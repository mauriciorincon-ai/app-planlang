/**
 * El contrafactual de un caso: «con el umbral en X este caso habría ido a Y». Lo calcula el MISMO código que el
 * playground (`desvioDe` de `consecuencias.ts`, sobre el compacto y con `recalcularVisita`, P2): por cada visita a un
 * nodo que decide y por cada umbral que leen sus aristas, barre el dominio jugable del plan desde el valor vigente
 * hacia afuera y devuelve el valor más cercano con el que el caso se separa del camino del agente EN ESA visita.
 *
 * Lo que no se puede decir no se dice (P15): un nodo cuyas aristas no leen ningún umbral, un valor que no existe en el
 * dominio jugable o uno que separa el caso antes (en una visita anterior) quedan «no observado» con su razón; y lo que
 * habría pasado DESPUÉS de la rama nueva no lo registró ninguna traza: solo se sabe a dónde lleva esa rama.
 */
import type { JsonValor } from "../formatos/jcs";
import type { AristaCondicional } from "../plan/esquema";
import type { Umbrales } from "./aristas";
import type { Compacto, Desenlace, UmbralCompacto } from "./compacto";
import { desvioDe, umbralesDelPlan } from "./consecuencias";

export type ResultadoContrafactual =
  /** Con `valor` el caso toma `rama` en esta visita; `desenlace` es a dónde lleva esa rama (no lo que pasaría). */
  | {
      tipo: "cambia";
      valor: number | boolean;
      rama: string;
      desenlace: Desenlace;
    }
  /** Ningún valor del dominio jugable cambia la rama de esta visita. */
  | { tipo: "no_observado"; razon: "sin_valor" }
  /** El valor más cercano que cambia algo separa el caso antes, en el paso `paso`: a esta visita no se llega. */
  | {
      tipo: "no_observado";
      razon: "se_separa_antes";
      valor: number | boolean;
      paso: number;
    };

export interface ContrafactualDeUmbral {
  umbral: string;
  senal: string;
  plan: number | boolean;
  resultado: ResultadoContrafactual;
}

export interface ContrafactualDeVisita {
  paso: number;
  desde: string;
  /** La rama que tomó el agente. */
  rama: string;
  /**
   * Por qué la visita no tiene contrafactual de ningún umbral: sus aristas solo comparan literales o funciones sin
   * umbral, o el nodo solo tiene la rama por defecto. `null` si al menos un umbral se barrió.
   */
  sin_umbral: "solo_por_defecto" | "sin_umbral" | null;
  umbrales: ContrafactualDeUmbral[];
}

const redondeo = (x: number) => Math.round(x * 1e6) / 1e6;

/**
 * Los valores del dominio jugable de un umbral, del más cercano al valor del plan al más lejano (a igual distancia, el
 * menor), sin el del plan. Son los que ofrece el deslizador del playground: `min + k·paso` hasta `max`.
 */
export function dominioDesdeElPlan(u: UmbralCompacto): (number | boolean)[] {
  if (u.rango === "booleano") return [!u.valor_en_plan];
  const { min, max, paso } = u.rango;
  const plan = u.valor_en_plan as number;
  const valores: number[] = [];
  for (let k = 0; ; k++) {
    const v = redondeo(min + k * paso);
    if (v > max + 1e-9) break;
    if (Math.abs(v - plan) > 1e-9) valores.push(v);
  }
  return valores.sort(
    (a, b) => Math.abs(a - plan) - Math.abs(b - plan) || a - b,
  );
}

/** Los ids de los umbrales que leen las aristas de un nodo: por su valor (`umbral.Ux`) o por una ligadura. */
export function umbralesQueLee(
  aristas: readonly AristaCondicional[],
  ligaduras: Readonly<Record<string, string>>,
  desde: string,
): string[] {
  const ids = new Set<string>();
  for (const a of aristas) {
    if (a.desde !== desde) continue;
    if ("senal" in a) {
      const v: JsonValor = a.valor;
      if (typeof v === "string" && v.startsWith("umbral."))
        ids.add(v.slice("umbral.".length));
      const ligado = ligaduras[a.senal];
      if (ligado) ids.add(ligado);
    } else
      for (const e of a.funcion.entradas) {
        const ligado = ligaduras[e];
        if (ligado) ids.add(ligado);
      }
  }
  return [...ids].sort();
}

/** El contrafactual de cada visita del caso a un nodo que decide, en el orden de la traza. */
export function contrafactualesDelCaso(
  c: Compacto,
  casoId: string,
): ContrafactualDeVisita[] {
  const caso = c.casos.find((k) => k.id === casoId);
  if (!caso)
    throw new Error(
      `contrafactual: el caso «${casoId}» no está en el compacto de ${c.corrida_id}`,
    );
  const delPlan: Umbrales = umbralesDelPlan(c);
  return caso.visitas.map((v, i) => {
    const conAristas = c.aristas.some((a) => a.desde === v.desde);
    const ids = umbralesQueLee(c.aristas, c.ligaduras, v.desde).filter((id) =>
      c.umbrales.some((u) => u.id === id),
    );
    const umbrales = ids.map((id): ContrafactualDeUmbral => {
      const u = c.umbrales.find((x) => x.id === id) as UmbralCompacto;
      return {
        umbral: id,
        senal: u.senal,
        plan: u.valor_en_plan,
        resultado: barrer(c, caso, i, u, delPlan),
      };
    });
    return {
      paso: v.paso,
      desde: v.desde,
      rama: v.rama,
      sin_umbral:
        umbrales.length > 0
          ? null
          : conAristas
            ? "sin_umbral"
            : "solo_por_defecto",
      umbrales,
    };
  });
}

function barrer(
  c: Compacto,
  caso: Compacto["casos"][number],
  i: number,
  u: UmbralCompacto,
  delPlan: Umbrales,
): ResultadoContrafactual {
  for (const valor of dominioDesdeElPlan(u)) {
    const d = desvioDe(c, caso, { ...delPlan, [u.id]: valor }, delPlan);
    // Sin desvío, o un desvío en una visita posterior: este valor no cambia esta visita; se sigue buscando.
    if (!d || d.i > i) continue;
    if (d.i < i)
      return {
        tipo: "no_observado",
        razon: "se_separa_antes",
        valor,
        paso: (caso.visitas[d.i] as (typeof caso.visitas)[number]).paso,
      };
    return {
      tipo: "cambia",
      valor,
      rama: d.rama,
      desenlace: c.desenlace_de_rama[d.rama] ?? "no_observado",
    };
  }
  return { tipo: "no_observado", razon: "sin_valor" };
}

/**
 * Los umbrales que trae la consulta del playground (`?u=U1:0.8,U4:true`, el enlace del contrafactual), sobre los del
 * plan. Solo vale un id del compacto con un valor de su dominio jugable; cualquier otra cosa se ignora (la página no
 * inventa un valor que el deslizador no puede tomar). `null` si la consulta no mueve ninguno.
 */
export function umbralesDeConsulta(
  c: Compacto,
  consulta: string | null,
): Umbrales | null {
  if (!consulta) return null;
  const umbrales: Umbrales = { ...umbralesDelPlan(c) };
  let movidos = 0;
  for (const par of consulta.split(",")) {
    const [id, texto] = par.split(":");
    const u = c.umbrales.find((x) => x.id === id);
    if (!u || texto === undefined) continue;
    let valor: number | boolean | null = null;
    if (u.rango === "booleano") {
      if (texto === "true" || texto === "false") valor = texto === "true";
    } else {
      const x = Number(texto);
      if (
        texto.trim() !== "" &&
        Number.isFinite(x) &&
        dominioDesdeElPlan(u).some((v) => Math.abs((v as number) - x) < 1e-9)
      )
        valor = redondeo(x);
    }
    if (valor === null || valor === u.valor_en_plan) continue;
    umbrales[u.id] = valor;
    movidos++;
  }
  return movidos ? umbrales : null;
}
