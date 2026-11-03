/**
 * Calibración con garantía (supuesto S1, S8; ADR-018): sobre las mismas muestras y la misma rejilla de la curva
 * riesgo-cobertura, tres cifras con su nivel, y lo que los datos no alcanzan dicho con sus números (P9).
 *
 * - (a) **Learn then Test** (Angelopoulos, Bates, Candès, Jordan y Lei, arXiv 2110.01052), secuencia fija: de lo más
 *   conservador a lo menos (de 0,95 hacia abajo con `menor_que`), cada umbral prueba H₀ «error > α entre lo que el
 *   agente decide solo» con p = P(Bin(n_τ, α) ≤ errores_τ); se acepta mientras p ≤ δ y se para en el primero que no.
 *   El menor aceptado, τ*, tiene error ≤ α con probabilidad ≥ 1 − δ (y todos los aceptados a la vez).
 * - (b) **conformal** (Angelopoulos y Bates, arXiv 2107.07511) sobre los aciertos: τ_c = el ⌊(n_c + 1)·α⌋-ésimo menor
 *   valor de confianza, y P(un acierto nuevo pasa sin persona) ≥ 1 − α — marginal y bajo intercambiabilidad.
 * - (c) **cobertura conjunta** (Bonferroni): las k etapas con modelo medidas contra la verdad, cada una con α/k y δ/k,
 *   sobre los mismos casos que el agente decide solo en cada umbral ⇒ P(alguna etapa falla) ≤ α con prob. ≥ 1 − δ.
 *
 * Exacta: α y δ son racionales y las colas binomiales se suman con `BigInt`, sin `Math.pow`, `log`, `exp` ni `**`
 * (G2): los mismos bytes en Node, Chromium, Firefox y WebKit (`tests/e2e/garantia.paridad.spec.ts`) y lo mismo que
 * calcula Python con `fractions` (`tests/contrato/garantia_fracciones.py`). Solo importa `comparar`, la arista del
 * plan: un caso lo decide el agente solo si la arista que escala es falsa, como en la curva y en el playground.
 */
import type { Operador } from "../plan/esquema";
import { comparar } from "../playground/aristas";

/** Un racional pequeño (α, δ, α/k): numerador y denominador enteros positivos. */
export interface Racional {
  num: number;
  den: number;
}

/** Los niveles de α que publica el informe (y elige el playground), el que el informe declara y el δ (ADR-018). */
export const NIVELES_DE_ALFA: readonly Racional[] = [
  { num: 1, den: 20 },
  { num: 1, den: 10 },
  { num: 1, den: 5 },
];
export const ALFA_DEL_INFORME: Racional = { num: 1, den: 10 };
export const DELTA: Racional = { num: 1, den: 10 };
/** Hasta cuántas veces los casos de hoy, con la misma tasa de error, se busca el n que respaldaría el umbral. */
export const TOPE_DE_ESCALA = 20;
/** Los operadores con que la arista escala por confianza BAJA: los únicos en que la garantía tiene sentido. */
export const OPERADORES_CON_GARANTIA: readonly Operador[] = [
  "menor_que",
  "menor_o_igual_que",
];

const B = (n: number): bigint => BigInt(n);
const CERO = B(0);
const UNO = B(1);

function potencia(base: bigint, exponente: number): bigint {
  let r = UNO;
  let b = base;
  for (let e = exponente; e > 0; e = (e - (e % 2)) / 2) {
    if (e % 2 === 1) r *= b;
    b *= b;
  }
  return r;
}

function mcd(a: bigint, b: bigint): bigint {
  let x = a < CERO ? -a : a;
  let y = b;
  while (y !== CERO) [x, y] = [y, x % y];
  return x;
}

/** Un racional exacto y reducido: lo que se compara con el `Fraction` de Python. */
export interface RacionalExacto {
  num: bigint;
  den: bigint;
}

/**
 * P(Bin(n, α) ≤ e), exacta. Con α = a/b y q = b − a: Σ_{i ≤ e} C(n,i)·aⁱ·q^(n−i) / bⁿ, sacando q^(n−e) de factor común
 * para que cada término sea pequeño.
 */
export function colaBinomial(
  n: number,
  e: number,
  alfa: Racional,
): RacionalExacto {
  const a = B(alfa.num);
  const q = B(alfa.den - alfa.num);
  const tope = e < n ? e : n;
  let suma = CERO;
  let c = UNO; // C(n, i)
  for (let i = 0; i <= tope; i++) {
    suma += c * potencia(a, i) * potencia(q, tope - i);
    c = (c * B(n - i)) / B(i + 1);
  }
  const num = suma * potencia(q, n - tope);
  const den = potencia(B(alfa.den), n);
  if (num === CERO) return { num: CERO, den: UNO };
  const g = mcd(num, den);
  return { num: num / g, den: den / g };
}

/** ¿p ≤ δ? En cruz, sin dividir. */
const noPasaDe = (p: RacionalExacto, d: Racional): boolean =>
  p.num * B(d.den) <= B(d.num) * p.den;

/** El racional como número con `decimales` fijos, redondeado a la mitad hacia arriba y sin pasar por coma flotante. */
export function aDecimal(num: bigint, den: bigint, decimales = 4): number {
  let f = UNO;
  for (let k = 0; k < decimales; k++) f *= B(10);
  const q = (B(2) * num * f + den) / (B(2) * den);
  const fraccion = (q % f).toString().padStart(decimales, "0");
  return Number(`${q / f}.${fraccion}`);
}

const valor = (r: Racional): number => aDecimal(B(r.num), B(r.den), 6);
const entre = (r: Racional, k: number): Racional => ({
  num: r.num,
  den: r.den * k,
});
/** Cociente entero exacto de dos enteros no negativos. */
const cociente = (p: number, q: number): number => (p - (p % q)) / q;

/** El menor n con (1 − α)ⁿ ≤ δ: los casos que haría falta decidir solos, y sin un solo error, para respaldar α. */
export function casosSinErrores(alfa: Racional, delta: Racional): number {
  const q = B(alfa.den - alfa.num);
  let izq = B(delta.den); // (b − a)ⁿ · δ_den
  let der = B(delta.num); // bⁿ · δ_num
  let n = 0;
  while (izq > der) {
    izq *= q;
    der *= B(alfa.den);
    n++;
  }
  return n;
}

export interface Prueba {
  aceptados: number;
  errores: number;
  /** p = P(Bin(aceptados, α) ≤ errores) con 4 decimales, para leer; `rechaza` sale de la exacta. */
  p: number;
  /** H₀ «error > α» rechazada (p ≤ δ): con estos datos, el umbral está respaldado. */
  rechaza: boolean;
}

function probar(
  aceptados: number,
  errores: number,
  alfa: Racional,
  delta: Racional,
): Prueba {
  const p = colaBinomial(aceptados, errores, alfa);
  return {
    aceptados,
    errores,
    p: aDecimal(p.num, p.den),
    rechaza: noPasaDe(p, delta),
  };
}

/** Por qué no hay umbral respaldado, en el punto más conservador, y cuántos casos harían falta. */
export interface Faltan {
  motivo: "pocos_casos" | "tasa_cerca_de_alfa" | "tasa_sobre_alfa";
  /** La etapa que no alcanza, en la cobertura conjunta; `null` en el umbral con garantía (el acierto de S1). */
  nodo: string | null;
  umbral: number;
  aceptados: number;
  errores: number;
  /**
   * `pocos_casos`: el menor n con (1 − α)ⁿ ≤ δ. `tasa_cerca_de_alfa`: el menor múltiplo de los casos de hoy, con la
   * misma tasa de error, que respaldaría el umbral (`null` si pasa de `TOPE_DE_ESCALA` veces). `tasa_sobre_alfa`:
   * `null`, porque más casos con esa tasa no lo respaldan nunca.
   */
  casos: number | null;
}

function faltan(
  umbral: number,
  aceptados: number,
  errores: number,
  alfa: Racional,
  delta: Racional,
  nodo: string | null = null,
): Faltan {
  const base = { nodo, umbral, aceptados, errores };
  if (errores === 0)
    return {
      ...base,
      motivo: "pocos_casos",
      casos: casosSinErrores(alfa, delta),
    };
  if (errores * alfa.den >= alfa.num * aceptados)
    return { ...base, motivo: "tasa_sobre_alfa", casos: null };
  for (let m = 2; m <= TOPE_DE_ESCALA; m++)
    if (probar(m * aceptados, m * errores, alfa, delta).rechaza)
      return { ...base, motivo: "tasa_cerca_de_alfa", casos: m * aceptados };
  return { ...base, motivo: "tasa_cerca_de_alfa", casos: null };
}

export interface MuestraDeGarantia {
  caso_id: string;
  confianza: number;
  /** El acierto de S1 (la extracción contra la verdad conocida): lo que miden (a) y (b). */
  correcto: boolean;
  /** El acierto de cada etapa con modelo contra la verdad (`null`: no se midió en este caso). Lo que mide (c). */
  etapas: Readonly<Record<string, boolean | null>>;
}

export interface EntradaDeGarantia {
  muestras: readonly MuestraDeGarantia[];
  rejilla: readonly number[];
  operador: Operador;
  inclusivo: boolean;
  /** Las etapas con modelo del plan, en su orden; `observada: false` si el caso no trae verdad para ella. */
  etapas: readonly { nodo: string; observada: boolean }[];
  umbral_aplicado: number | null;
  alfas?: readonly Racional[];
  delta?: Racional;
}

export interface PruebaDeUmbral extends Prueba {
  umbral: number;
}

export interface PruebaConjunta {
  umbral: number;
  etapas: (Prueba & { nodo: string })[];
  rechaza: boolean;
}

export interface CoberturaConjunta {
  /** Las etapas que entran (observadas y con casos medidos). */
  k: number;
  nodos: string[];
  alfa_por_etapa: number;
  delta_por_etapa: number;
  /** Los casos con todas esas etapas medidas: la población común de la cota. */
  casos: number;
  umbral: number | null;
  pruebas: PruebaConjunta[];
  /** En el umbral conjunto (o en el más conservador, si no lo hay): de los que el agente decide solo, cuántos fallan en alguna etapa. */
  error_observado: {
    umbral: number;
    aceptados: number;
    errores: number;
    tasa: number | null;
  };
  faltan: Faltan | null;
}

export interface NivelDeGarantia {
  alfa: number;
  umbral_con_garantia: {
    umbral: number | null;
    cobertura: number | null;
    riesgo: number | null;
    pruebas: PruebaDeUmbral[];
    faltan: Faltan | null;
  };
  conformal: {
    n_aciertos: number;
    /** ⌊(n_c + 1)·α⌋: 0 quiere decir que no hay cota. */
    indice: number;
    umbral: number | null;
    /** El menor n_c con índice ≥ 1. */
    aciertos_minimos: number;
  };
  /** Los umbrales de la rejilla con las dos garantías a la vez, de menor a mayor. */
  zona: { desde: number; hasta: number; umbrales: number[] } | null;
  sin_zona:
    | "sin_umbral_con_garantia"
    | "sin_cota_conformal"
    | "conformal_bajo_el_umbral"
    | null;
  umbral_aplicado_en_zona: boolean | null;
  conjunta: CoberturaConjunta | null;
}

export interface GarantiaDeCalibracion {
  delta: number;
  alfa_del_informe: number;
  umbral_aplicado: number | null;
  n: number;
  aciertos: number;
  etapas: {
    nodo: string;
    observada: boolean;
    casos: number;
    errores: number;
  }[];
  niveles: NivelDeGarantia[];
}

/** La rejilla de lo más conservador (lo que menos decide solo el agente) a lo menos: de mayor a menor umbral. */
const ordenConservador = (rejilla: readonly number[]): number[] =>
  [...rejilla].sort((a, b) => b - a);

/**
 * La garantía de la calibración, o `null` si la arista no escala por confianza baja (la garantía no tiene sentido).
 * Pura: el orden de las muestras no cambia el resultado.
 */
export function garantiaDeCalibracion(
  e: EntradaDeGarantia,
): GarantiaDeCalibracion | null {
  if (!OPERADORES_CON_GARANTIA.includes(e.operador) || e.rejilla.length === 0)
    return null;
  const delta = e.delta ?? DELTA;
  const muestras = [...e.muestras].sort((a, b) =>
    a.caso_id < b.caso_id ? -1 : a.caso_id > b.caso_id ? 1 : 0,
  );
  const decideSolo = (c: number, u: number) =>
    !comparar(c, e.operador, u, e.inclusivo);
  const orden = ordenConservador(e.rejilla);
  const etapas = e.etapas.map((et) => {
    const medidas = muestras
      .map((m) => m.etapas[et.nodo])
      .filter((v): v is boolean => typeof v === "boolean");
    return {
      nodo: et.nodo,
      observada: et.observada && medidas.length > 0,
      casos: et.observada ? medidas.length : 0,
      errores: et.observada ? medidas.filter((v) => !v).length : 0,
    };
  });
  const nodos = etapas.filter((x) => x.observada).map((x) => x.nodo);
  const comun = muestras.filter((m) =>
    nodos.every((nodo) => typeof m.etapas[nodo] === "boolean"),
  );
  const aciertos = muestras
    .filter((m) => m.correcto)
    .map((m) => m.confianza)
    .sort((a, b) => a - b);

  const nivel = (alfa: Racional): NivelDeGarantia => {
    // (a) Learn then Test, secuencia fija: se para en el primer umbral que no rechaza.
    const pruebas: PruebaDeUmbral[] = [];
    for (const u of orden) {
      const solos = muestras.filter((m) => decideSolo(m.confianza, u));
      const prueba = {
        umbral: u,
        ...probar(
          solos.length,
          solos.filter((m) => !m.correcto).length,
          alfa,
          delta,
        ),
      };
      pruebas.push(prueba);
      if (!prueba.rechaza) break;
    }
    const respaldados = pruebas.filter((p) => p.rechaza);
    const estrella = respaldados.at(-1) ?? null;
    const primera = pruebas[0];

    // (b) conformal sobre los aciertos.
    const n_c = aciertos.length;
    const indice = cociente((n_c + 1) * alfa.num, alfa.den);
    const tauC = indice >= 1 ? (aciertos[indice - 1] as number) : null;

    // La zona: respaldados por (a) y con todo acierto de confianza ≥ τ_c decidido solo.
    const umbrales =
      tauC === null
        ? []
        : respaldados
            .map((p) => p.umbral)
            .filter((u) => decideSolo(tauC, u))
            .sort((a, b) => a - b);
    const zona =
      umbrales.length > 0
        ? {
            desde: umbrales[0] as number,
            hasta: umbrales.at(-1) as number,
            umbrales,
          }
        : null;

    return {
      alfa: valor(alfa),
      umbral_con_garantia: {
        umbral: estrella?.umbral ?? null,
        cobertura:
          estrella && muestras.length > 0
            ? aDecimal(B(estrella.aceptados), B(muestras.length))
            : null,
        riesgo:
          estrella && estrella.aceptados > 0
            ? aDecimal(B(estrella.errores), B(estrella.aceptados))
            : null,
        pruebas,
        faltan:
          estrella || !primera
            ? null
            : faltan(
                primera.umbral,
                primera.aceptados,
                primera.errores,
                alfa,
                delta,
              ),
      },
      conformal: {
        n_aciertos: n_c,
        indice,
        umbral: tauC,
        aciertos_minimos: cociente(alfa.den + alfa.num - 1, alfa.num) - 1,
      },
      zona,
      sin_zona: zona
        ? null
        : !estrella
          ? "sin_umbral_con_garantia"
          : tauC === null
            ? "sin_cota_conformal"
            : "conformal_bajo_el_umbral",
      umbral_aplicado_en_zona:
        e.umbral_aplicado === null
          ? null
          : (zona?.umbrales.includes(e.umbral_aplicado) ?? false),
      conjunta: nodos.length === 0 ? null : conjunta(alfa),
    };
  };

  // (c) Bonferroni: cada etapa con α/k y δ/k, sobre los casos que el agente decide solo en cada umbral.
  const conjunta = (alfa: Racional): CoberturaConjunta => {
    const k = nodos.length;
    const a = entre(alfa, k);
    const d = entre(delta, k);
    const pruebas: PruebaConjunta[] = [];
    for (const u of orden) {
      const solos = comun.filter((m) => decideSolo(m.confianza, u));
      const porEtapa = nodos.map((nodo) => ({
        nodo,
        ...probar(
          solos.length,
          solos.filter((m) => m.etapas[nodo] === false).length,
          a,
          d,
        ),
      }));
      const rechaza = porEtapa.every((x) => x.rechaza);
      pruebas.push({ umbral: u, etapas: porEtapa, rechaza });
      if (!rechaza) break;
    }
    const respaldada = pruebas.filter((p) => p.rechaza).at(-1) ?? null;
    const enUmbral = respaldada?.umbral ?? (orden[0] as number);
    const solos = comun.filter((m) => decideSolo(m.confianza, enUmbral));
    const fallan = solos.filter((m) =>
      nodos.some((nodo) => m.etapas[nodo] === false),
    ).length;
    const primera = pruebas[0] as PruebaConjunta;
    const fallidas = primera.etapas
      .filter((x) => !x.rechaza)
      .map((x) => faltan(primera.umbral, x.aceptados, x.errores, a, d, x.nodo));
    return {
      k,
      nodos,
      alfa_por_etapa: valor(a),
      delta_por_etapa: valor(d),
      casos: comun.length,
      umbral: respaldada?.umbral ?? null,
      pruebas,
      error_observado: {
        umbral: enUmbral,
        aceptados: solos.length,
        errores: fallan,
        tasa: solos.length === 0 ? null : aDecimal(B(fallan), B(solos.length)),
      },
      faltan: respaldada ? null : peorFaltan(fallidas),
    };
  };

  return {
    delta: valor(delta),
    alfa_del_informe: valor(ALFA_DEL_INFORME),
    umbral_aplicado: e.umbral_aplicado,
    n: muestras.length,
    aciertos: aciertos.length,
    etapas,
    niveles: (e.alfas ?? NIVELES_DE_ALFA).map(nivel),
  };
}

/** De las etapas que no alcanzan, la que más pide: una tasa sobre α manda; si no, el mayor número de casos. */
function peorFaltan(fallidas: readonly Faltan[]): Faltan | null {
  const peso = (f: Faltan) =>
    f.motivo === "tasa_sobre_alfa" || f.casos === null
      ? Number.MAX_SAFE_INTEGER
      : f.casos;
  let peor: Faltan | null = null;
  for (const f of fallidas) if (!peor || peso(f) > peso(peor)) peor = f;
  return peor;
}
