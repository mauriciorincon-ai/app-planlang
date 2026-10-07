/**
 * Las consecuencias de mover los umbrales del plan, calculadas en el navegador sobre el compacto (`compacto.ts`).
 * Rehace cada visita a un nodo jugable con el MISMO intérprete de aristas que RF-09.2 (`aristas.ts`) y, donde el
 * camino cambia, dice a dónde lleva, si eso evita o introduce un error según la verdad conocida (DA-04), cuántos
 * minutos de auditor suma o ahorra y cómo quedan los criterios medidos con la regla del plan.
 *
 * No vuelve a llamar a ningún modelo ni inventa lo que la traza no registró: un camino que llega a otro nodo que
 * decide queda «no observado», y un criterio que lee lo que pasa después de un cambio no se puede evaluar en ese
 * caso. Lo que eso le hace al criterio es lo mismo que en el verificador: un «todos cumplen» queda «indeterminado»;
 * una tasa lo cuenta como un caso que no cumple; una métrica se agrega sin él (AU-S2-B53). Con los umbrales del plan,
 * nada cambia y cada criterio dice lo mismo que el informe (paridad en la CI).
 */
import type { EstadoCriterio } from "../brecha/criterios";
import { maximo, mediana, promedio, redondear } from "../brecha/numeros";
import type { JsonValor } from "../formatos/jcs";
import {
  recalcularVisita,
  type RegistroDeArista,
  type Senales,
  type Umbrales,
} from "./aristas";
import type {
  CasoCompacto,
  Compacto,
  CriterioCompacto,
  Desenlace,
  Evaluacion,
} from "./compacto";

export type Efecto =
  | "error_introducido"
  | "error_evitado"
  | "revision_de_mas"
  | "revision_ahorrada"
  | "mismo_destino"
  | "no_observado";

export interface CambioDeCaso {
  id: string;
  antes: "persona" | "solo";
  ahora: Desenlace;
  /** El nodo y el paso donde el camino se separa del que tomó el agente: el enlace a su traza abre en ese paso. */
  nodo: string;
  paso: number;
  rama_nueva: string;
  /** Las señales que observó esa visita. */
  senales: Senales;
  /** La arista que decide ahora (null si ninguna se cumple y va por la rama por defecto). */
  ahora_decide: RegistroDeArista | null;
  /** Si ahora va por la rama por defecto: la arista que decidía con los umbrales del plan, evaluada con los nuevos. */
  ya_no_decide: RegistroDeArista | null;
  efecto: Efecto;
  /** Visitas al mismo nodo que el agente hizo después y que el camino nuevo se ahorra (aclaraciones de menos). */
  visitas_ahorradas: number;
}

export interface CriterioRecalculado {
  id: string;
  estado: EstadoCriterio;
  estado_informe: EstadoCriterio;
  /** El valor recalculado del que sale el estado; la prueba de paridad lo compara con el del verificador. */
  valor: number | boolean | null;
  casos_que_incumplen: string[];
  /** Casos que la regla no puede medir en el camino nuevo (lee lo que la traza no registró). */
  no_evaluables: string[];
  /** Algún caso que cambió de camino da otro resultado en este criterio. */
  recalculado: boolean;
}

export interface Observados {
  id: string;
  n: number;
  min: number | null;
  mediana: number | null;
  max: number | null;
  /**
   * En un umbral booleano, cuántos casos lo tuvieron verdadero: es la misma cuenta del informe (que el Markdown
   * pinta, «N de M verdaderos») y la prueba de paridad compara la forma completa (AU-S2-P-5).
   */
  verdaderos: number | null;
  casos_en_el_umbral: string[];
}

export interface Consecuencias {
  /** Ids de los umbrales que difieren del plan. */
  movidos: string[];
  /** Destino de cada caso con estos umbrales (en el orden del compacto). */
  destinos: { id: string; antes: "persona" | "solo"; ahora: Desenlace }[];
  cambios: CambioDeCaso[];
  introducidos: string[];
  evitados: string[];
  no_observados: string[];
  personas: number;
  /** Los casos que el plan registró con persona, sobre la misma población que `personas` (sin los no observados). */
  personas_plan: number;
  /** `null` si el plan no declara el costo humano por caso (el playground no lo inventa). */
  minutos: number | null;
  /**
   * Los minutos del plan sobre la misma población que `minutos` (AU-S2-22): los casos que el plan registró con
   * persona, sin los que con estos umbrales quedan «no observados». `null` como `minutos`.
   */
  minutos_plan: number | null;
  criterios: CriterioRecalculado[];
  cumplen: number;
}

export function umbralesDelPlan(c: Compacto): Umbrales {
  return Object.fromEntries(c.umbrales.map((u) => [u.id, u.valor_en_plan]));
}

/** Lo observado en la señal de cada umbral (la misma cuenta que el informe) y los casos justo en el valor dado. */
export function observados(c: Compacto, umbrales: Umbrales): Observados[] {
  return c.umbrales.map((u) => {
    const valores = c.casos
      .filter((k) => Object.hasOwn(k.senales_de_umbral, u.id))
      .map((k) => ({ id: k.id, x: k.senales_de_umbral[u.id] as JsonValor }));
    const nums = valores.filter(
      (v): v is { id: string; x: number } => typeof v.x === "number",
    );
    const bools = valores.filter(
      (v): v is { id: string; x: boolean } => typeof v.x === "boolean",
    );
    const xs = nums.map((v) => v.x);
    const med = mediana(xs);
    const aplicado = umbrales[u.id];
    return {
      id: u.id,
      n: nums.length + bools.length,
      min: xs.length ? Math.min(...xs) : null,
      mediana: med === null ? null : redondear(med, 3),
      max: xs.length ? Math.max(...xs) : null,
      verdaderos: bools.length ? bools.filter((b) => b.x).length : null,
      casos_en_el_umbral:
        typeof aplicado === "number"
          ? nums.filter((v) => v.x === aplicado).map((v) => v.id)
          : [],
    };
  });
}

interface Desvio {
  i: number;
  rama: string;
  registros: RegistroDeArista[];
  plan: RegistroDeArista[];
}

function desvioDe(
  c: Compacto,
  caso: CasoCompacto,
  umbrales: Umbrales,
  delPlan: Umbrales,
): Desvio | null {
  for (let i = 0; i < caso.visitas.length; i++) {
    const v = caso.visitas[i] as CasoCompacto["visitas"][number];
    if (!c.nodos_jugables.includes(v.desde)) continue;
    const { rama, registros } = recalcularVisita(
      v.desde,
      v.senales,
      c.aristas,
      c.ramas_por_defecto,
      umbrales,
      c.ligaduras,
    );
    if (rama === v.rama) continue;
    const plan = recalcularVisita(
      v.desde,
      v.senales,
      c.aristas,
      c.ramas_por_defecto,
      delPlan,
      c.ligaduras,
    ).registros;
    return { i, rama, registros, plan };
  }
  return null;
}

/**
 * ¿La propuesta del caso es adversa con estos umbrales? Toda la que no es la favorable lo es, salvo la parcial del
 * demo mientras su señal está apagada (con el modo Texas apagado, aprobar en parte sale sola por plan, D2 v1.5).
 */
export function propuestaAdversa(
  c: Compacto,
  senales: Readonly<Record<string, JsonValor>>,
  umbrales: Umbrales,
): boolean {
  const { senal, favorable, parcial } = c.propuesta;
  if (!Object.hasOwn(senales, senal)) return false;
  const p = senales[senal];
  if (p === favorable) return false;
  if (parcial && p === parcial.valor) {
    const s = parcial.senal_que_exige_persona;
    const id = c.ligaduras[s];
    return id !== undefined ? umbrales[id] === true : senales[s] === true;
  }
  return true;
}

function efectoDe(
  antes: "persona" | "solo",
  ahora: Desenlace,
  debeEscalar: boolean,
  propuestaAdversa: boolean,
): Efecto {
  if (ahora === "no_observado") return "no_observado";
  if (ahora === antes) return "mismo_destino";
  // Una propuesta adversa que sale sin persona es una infracción (regla dura 4) aunque la verdad conocida no pida
  // escalar: jamás se lee como «revisión ahorrada» (AU-S2-B45).
  if (ahora === "solo")
    return debeEscalar || propuestaAdversa
      ? "error_introducido"
      : "revision_ahorrada";
  return debeEscalar ? "error_evitado" : "revision_de_mas";
}

const MENOR_ES_MEJOR = new Set(["latencia", "costo"]);

/** Un criterio medido sobre la evaluación de cada caso: la misma agregación que `brecha/criterios.ts`. */
export function medirCriterio(
  c: CriterioCompacto,
  evals: readonly { id: string; e: Evaluacion; registrada: Evaluacion }[],
): Omit<CriterioRecalculado, "recalculado"> {
  const salida = {
    id: c.id,
    estado_informe: c.estado_informe,
    valor: null as number | boolean | null,
    casos_que_incumplen: [] as string[],
    no_evaluables: [] as string[],
  };
  if (c.estado_informe === "mal_formado")
    return { ...salida, estado: "mal_formado", valor: c.valor_informe };
  const dentro = evals.filter((x) => x.e.r !== "fuera" && x.e.r !== "nulo");
  salida.no_evaluables = dentro
    .filter((x) => x.e.r === "ne" || (c.con_metrica && x.e.m == null))
    .map((x) => x.id);

  if (c.agregacion === "pass^k") {
    // Las repeticiones no se pueden rehacer: si ningún caso cambia su resultado, vale lo que midió el informe.
    const igual = evals.every(
      (x) => x.e.r === x.registrada.r && x.e.m === x.registrada.m,
    );
    return igual
      ? { ...salida, estado: c.estado_informe, valor: c.valor_informe }
      : { ...salida, estado: "indeterminado" };
  }

  if (c.con_metrica) {
    const conValor = dentro.filter((x) => typeof x.e.m === "number");
    const xs = conValor.map((x) => x.e.m as number);
    const agregado =
      c.agregacion === "mediana"
        ? mediana(xs)
        : c.agregacion === "promedio"
          ? promedio(xs)
          : maximo(xs);
    if (agregado === null)
      return {
        ...salida,
        estado: dentro.length > 0 ? "indeterminado" : "sin_poblacion",
      };
    if (typeof c.objetivo !== "number")
      return { ...salida, estado: "sin_poblacion" };
    const objetivo = c.objetivo;
    const bien = (x: number) =>
      MENOR_ES_MEJOR.has(c.tipo) ? x <= objetivo : x >= objetivo;
    salida.valor = redondear(agregado, 3);
    salida.casos_que_incumplen = conValor
      .filter((x) => !bien(x.e.m as number))
      .map((x) => x.id);
    return {
      ...salida,
      estado: !bien(agregado)
        ? "incumple"
        : salida.no_evaluables.length > 0
          ? "indeterminado"
          : "cumple",
    };
  }

  const n = dentro.length;
  if (n === 0) return { ...salida, estado: "sin_poblacion" };
  const verdaderos = dentro.filter((x) => x.e.r === "v").length;
  const falsos = dentro.filter((x) => x.e.r === "f").map((x) => x.id);
  if (c.agregacion === "tasa") {
    const valor = verdaderos / n;
    salida.valor = redondear(valor);
    salida.casos_que_incumplen = dentro
      .filter((x) => x.e.r !== "v")
      .map((x) => x.id);
    // Una tasa cuenta el caso que no se pudo evaluar como uno que no cumple, igual que el verificador
    // (`criterios.ts`): la paridad lo exige (AU-S2-B53; la prueba de variantes de `paridad.test.ts` lo cruza).
    return {
      ...salida,
      estado: valor >= Number(c.objetivo) ? "cumple" : "incumple",
    };
  }
  // todos_cumplen
  salida.casos_que_incumplen = falsos;
  salida.valor = falsos.length === 0 && salida.no_evaluables.length === 0;
  return {
    ...salida,
    estado:
      falsos.length > 0
        ? "incumple"
        : salida.no_evaluables.length > 0
          ? "indeterminado"
          : "cumple",
  };
}

/**
 * Cuántos casos reproducen, con los umbrales del plan, el camino que registró el agente en los nodos que el
 * playground recalcula: la comprobación que la vitrina afirma, calculada y no supuesta (C-2). Con el plan en sus
 * valores todo caso debería reproducirse (RF-09.2); un caso que no lo hace baja la cuenta.
 */
export function casosQueReproducen(c: Compacto): number {
  const delPlan = umbralesDelPlan(c);
  return c.casos.filter((caso) => desvioDe(c, caso, delPlan, delPlan) === null)
    .length;
}

export function consecuencias(c: Compacto, umbrales: Umbrales): Consecuencias {
  const delPlan = umbralesDelPlan(c);
  const movidos = c.umbrales
    .filter((u) => umbrales[u.id] !== u.valor_en_plan)
    .map((u) => u.id);
  const destinos: Consecuencias["destinos"] = [];
  const cambios: CambioDeCaso[] = [];
  const evaluaciones: Evaluacion[][] = [];

  for (const caso of c.casos) {
    const d = desvioDe(c, caso, umbrales, delPlan);
    if (!d) {
      destinos.push({
        id: caso.id,
        antes: caso.registrado,
        ahora: caso.registrado,
      });
      evaluaciones.push(caso.evaluaciones.registrado);
      continue;
    }
    const v = caso.visitas[d.i] as CasoCompacto["visitas"][number];
    const ahora = c.desenlace_de_rama[d.rama] ?? "no_observado";
    const clave = `${d.i}:${ahora}`;
    const evs = caso.evaluaciones.caminos[clave];
    if (!evs)
      throw new Error(
        `playground: ${caso.id} no trae la evaluación del camino ${clave}.`,
      );
    evaluaciones.push(evs);
    destinos.push({ id: caso.id, antes: caso.registrado, ahora });
    const ahoraDecide = d.registros.find((r) => r.resultado) ?? null;
    const ordenPlan = d.plan.find((r) => r.resultado)?.orden_arista;
    cambios.push({
      id: caso.id,
      antes: caso.registrado,
      ahora,
      nodo: v.desde,
      paso: v.paso,
      rama_nueva: d.rama,
      senales: v.senales,
      ahora_decide: ahoraDecide,
      ya_no_decide:
        ahoraDecide === null && ordenPlan !== undefined
          ? (d.registros.find((r) => r.orden_arista === ordenPlan) ?? null)
          : null,
      efecto: efectoDe(
        caso.registrado,
        ahora,
        caso.debe_escalar,
        propuestaAdversa(c, v.senales, umbrales),
      ),
      visitas_ahorradas: caso.visitas
        .slice(d.i + 1)
        .filter((x) => x.desde === v.desde).length,
    });
  }

  const criterios = c.criterios.map((cr, j) => {
    const evals = c.casos.map((caso, k) => ({
      id: caso.id,
      e: (evaluaciones[k] as Evaluacion[])[j] as Evaluacion,
      registrada: caso.evaluaciones.registrado[j] as Evaluacion,
    }));
    return {
      ...medirCriterio(cr, evals),
      recalculado: evals.some(
        (x) => x.e.r !== x.registrada.r || x.e.m !== x.registrada.m,
      ),
    };
  });

  // Los minutos se comparan sobre la misma población (AU-S2-22): un caso que con estos umbrales queda «no
  // observado» sale de los dos lados. Si no, el delta contaría como ahorro una revisión que nadie midió.
  const sinObservar = new Set(
    destinos.filter((x) => x.ahora === "no_observado").map((x) => x.id),
  );
  const personas = destinos.filter((x) => x.ahora === "persona").length;
  const personas_plan = c.casos.filter(
    (k) => k.registrado === "persona" && !sinObservar.has(k.id),
  ).length;
  return {
    movidos,
    destinos,
    cambios,
    introducidos: cambios
      .filter((x) => x.efecto === "error_introducido")
      .map((x) => x.id),
    evitados: cambios
      .filter((x) => x.efecto === "error_evitado")
      .map((x) => x.id),
    no_observados: cambios
      .filter((x) => x.efecto === "no_observado")
      .map((x) => x.id),
    personas,
    personas_plan,
    minutos:
      c.minutos_por_persona === null ? null : personas * c.minutos_por_persona,
    minutos_plan:
      c.minutos_por_persona === null
        ? null
        : personas_plan * c.minutos_por_persona,
    criterios,
    cumplen: criterios.filter((x) => x.estado === "cumple").length,
  };
}
