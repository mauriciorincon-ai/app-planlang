/**
 * Los beneficiarios finales de una persona jurídica (S9, ADR-019): el gemelo de verdad del nodo `beneficiarios` del
 * agente B (`agents/src/app_agents/demo_b/beneficiarios.py`). El generador lo usa para fijar la verdad conocida y el
 * gate de contrato (`tests/contrato/beneficiarios.test.ts`) exige que Python dé lo mismo, al bit.
 *
 * La norma es 31 CFR § 1010.230(d), leída en su fuente el 2026-11-03: beneficiario es (1) cada persona que, directa o
 * indirectamente, tiene el 25 % o más de la participación («25 percent or more»: inclusivo) y (2) una persona con
 * responsabilidad significativa de controlar la sociedad. La norma no dice cómo se calcula la participación indirecta:
 * aquí se multiplica el porcentaje de cada eslabón de un camino y se suman los caminos que llegan a la misma persona.
 *
 * Exacto: cada porcentaje es un texto con dos decimales a lo sumo («33.33»), que se lee como centésimas enteras; la
 * participación efectiva es una fracción en `BigInt`. Ni `Math.pow` ni coma flotante: los mismos bytes en Node, en los
 * tres motores y en Python. Lo que no cierra (un ciclo, una suma de más del 100 %, un porcentaje mal escrito, alguien
 * que no está en la estructura) no se adivina: la estructura queda inválida y sin beneficiarios.
 */

/** Un porcentaje con dos decimales a lo sumo, de 0 a 100. */
export const PORCENTAJE_TEXTO = /^(100(\.0{1,2})?|\d{1,2}(\.\d{1,2})?)$/;

/** `BigInt` sin literales `0n` (el núcleo compila a ES2017, como `core/brecha/garantia.ts`). */
const B = (n: number): bigint => BigInt(n);
const CERO = B(0);
const UNO = B(1);
const DOS = B(2);
const CIEN = B(100);

/** El umbral de la norma, en centésimas de punto porcentual: 25,00 %. */
export const UMBRAL_CENTESIMAS = B(2500);
const CIEN_POR_CIENTO = B(10000);

/** La estructura tal como llega: del generador (siempre válida) o de lo que extrajo un modelo (puede no serlo). */
export interface EstructuraLeida {
  entidad: string | null;
  entidades: readonly { nit: string; nombre: string }[];
  personas: readonly { documento: string; nombre: string }[];
  participaciones: readonly {
    titular: string;
    participada: string;
    porcentaje: string;
  }[];
  controla: { documento: string; rol: string } | null;
}

/** La participación efectiva de una persona: la fracción exacta y su lectura con dos decimales (mitad hacia arriba). */
export interface ParticipacionEfectiva {
  documento: string;
  num: string;
  den: string;
  porcentaje: string;
}

export interface ResultadoDeBeneficiarios {
  valida: boolean;
  /** Por qué no cierra, en el orden en que se encontró (vacío si es válida). */
  problemas: string[];
  /** Cada persona de la estructura con su participación efectiva, por documento (vacío si no es válida). */
  participaciones: ParticipacionEfectiva[];
  /** Las que llegan al 25 % (inclusivo), por documento. */
  por_participacion: string[];
  /** La persona que controla, si la estructura la nombra. */
  controla: string | null;
  /** Los beneficiarios finales: por participación más quien controla, sin repetir y por documento; `null` si no es válida. */
  beneficiarios: string[] | null;
}

const ordenar = (xs: Iterable<string>): string[] =>
  [...new Set(xs)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

/** «33.33» → 3333n centésimas; `null` si no es un porcentaje con dos decimales a lo sumo. */
export function centesimas(texto: string): bigint | null {
  if (!PORCENTAJE_TEXTO.test(texto)) return null;
  const [entero, dec = ""] = texto.split(".");
  return BigInt(entero!) * CIEN + BigInt(dec.padEnd(2, "0"));
}

function mcd(a: bigint, b: bigint): bigint {
  let x = a < CERO ? -a : a;
  let y = b < CERO ? -b : b;
  while (y !== CERO) [x, y] = [y, x % y];
  return x;
}

/** La fracción como porcentaje con dos decimales, redondeado a la mitad hacia arriba. */
function aPorcentaje(num: bigint, den: bigint): string {
  const c = (num * CIEN_POR_CIENTO * DOS + den) / (DOS * den);
  return `${c / CIEN}.${String(c % CIEN).padStart(2, "0")}`;
}

/** Lo que no deja calcular, en orden: entidad, ids repetidos, cada participación, cada suma, quien controla y ciclos. */
function problemasDe(e: EstructuraLeida): string[] {
  const p: string[] = [];
  const nits = new Set(e.entidades.map((x) => x.nit));
  const docs = new Set(e.personas.map((x) => x.documento));
  if (!e.entidad || !nits.has(e.entidad)) p.push("sin_entidad");
  const vistos = new Set<string>();
  for (const id of [
    ...e.entidades.map((x) => x.nit),
    ...e.personas.map((x) => x.documento),
  ]) {
    if (vistos.has(id)) p.push(`id_repetido:${id}`);
    vistos.add(id);
  }
  const suma = new Map<string, bigint>();
  for (const x of e.participaciones) {
    const c = centesimas(x.porcentaje);
    if (c === null || c === CERO)
      p.push(`porcentaje_invalido:${x.titular}>${x.participada}`);
    if (!nits.has(x.participada)) p.push(`referencia_rota:${x.participada}`);
    if (!nits.has(x.titular) && !docs.has(x.titular))
      p.push(`referencia_rota:${x.titular}`);
    if (c !== null)
      suma.set(x.participada, (suma.get(x.participada) ?? CERO) + c);
  }
  for (const x of e.entidades)
    if ((suma.get(x.nit) ?? CERO) > CIEN_POR_CIENTO)
      p.push(`suma_sobre_100:${x.nit}`);
  if (e.controla && !docs.has(e.controla.documento))
    p.push(`referencia_rota:${e.controla.documento}`);
  if (e.entidad && nits.has(e.entidad)) {
    const ciclo = cicloDesde(e, e.entidad, nits);
    if (ciclo) p.push(`ciclo:${ciclo}`);
  }
  return [...new Set(p)];
}

/** El primer nit que se repite en un camino de dueños desde `raiz`, o `null` si no hay ciclo. */
function cicloDesde(
  e: EstructuraLeida,
  raiz: string,
  nits: ReadonlySet<string>,
): string | null {
  const enCamino = new Set<string>();
  const cerrado = new Set<string>();
  const visitar = (nit: string): string | null => {
    if (enCamino.has(nit)) return nit;
    if (cerrado.has(nit)) return null;
    enCamino.add(nit);
    for (const x of e.participaciones)
      if (x.participada === nit && nits.has(x.titular)) {
        const r = visitar(x.titular);
        if (r) return r;
      }
    enCamino.delete(nit);
    cerrado.add(nit);
    return null;
  };
  return visitar(raiz);
}

/** Los beneficiarios finales de la estructura, o por qué no se pueden calcular. */
export function beneficiariosDe(e: EstructuraLeida): ResultadoDeBeneficiarios {
  const problemas = problemasDe(e);
  const controla = e.controla?.documento ?? null;
  if (problemas.length > 0)
    return {
      valida: false,
      problemas,
      participaciones: [],
      por_participacion: [],
      controla,
      beneficiarios: null,
    };
  const docs = new Set(e.personas.map((x) => x.documento));
  const acumulado = new Map<string, { num: bigint; den: bigint }>();
  for (const d of e.personas)
    acumulado.set(d.documento, { num: CERO, den: UNO });
  // Cada camino desde la sociedad hacia arriba multiplica su eslabón; una persona es el final de un camino.
  const recorrer = (nit: string, num: bigint, den: bigint): void => {
    for (const x of e.participaciones) {
      if (x.participada !== nit) continue;
      const n = num * centesimas(x.porcentaje)!;
      const d = den * CIEN_POR_CIENTO;
      if (docs.has(x.titular)) {
        const a = acumulado.get(x.titular)!;
        const sn = a.num * d + n * a.den;
        const sd = a.den * d;
        const g = mcd(sn, sd);
        acumulado.set(x.titular, { num: sn / g, den: sd / g });
      } else recorrer(x.titular, n, d);
    }
  };
  recorrer(e.entidad!, UNO, UNO);
  const participaciones = ordenar(acumulado.keys()).map((documento) => {
    const { num, den } = acumulado.get(documento)!;
    return {
      documento,
      num: String(num),
      den: String(den),
      porcentaje: aPorcentaje(num, den),
    };
  });
  // num / den ≥ 25 / 100  ⇔  num · 10000 ≥ 2500 · den: la comparación es exacta, nunca sobre el redondeo.
  const por_participacion = participaciones
    .filter(
      (x) =>
        BigInt(x.num) * CIEN_POR_CIENTO >= UMBRAL_CENTESIMAS * BigInt(x.den),
    )
    .map((x) => x.documento);
  return {
    valida: true,
    problemas: [],
    participaciones,
    por_participacion,
    controla,
    beneficiarios: ordenar([
      ...por_participacion,
      ...(controla ? [controla] : []),
    ]),
  };
}
