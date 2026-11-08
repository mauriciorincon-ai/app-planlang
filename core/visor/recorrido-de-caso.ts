/**
 * El recorrido de UN caso (contrato 0.5.0 § 3.5 y § 4.3, nivel 3): los nodos que visitó, en el orden de su traza, con
 * lo que el caso llevaba en cada paso — las reglas que evaluó el nodo (señal observada, umbral del plan, resultado),
 * la rama que tomó, la pausa humana y cuánto tardó. `recorridosDeTrazas` agrupa caminos; este sigue a un caso.
 *
 * El recorrido es lineal (un caso no se bifurca): cada paso sigue al anterior y ninguno declara `bifurca` (V12). La
 * validación es la del mapa (`validarMapa`, V5 y V12), no una copia: quien lo publica lo mete en el mapa y lo valida.
 * `cssDeRecorrido` genera las reglas que, según el atributo `data-paso` del contenedor, marcan cada nodo activo,
 * visitado o pendiente; sin movimiento: la transición vive en una hoja aparte (G12). Puro: sin reloj ni azar.
 */
import type { JsonValor } from "../formatos/jcs";
import { idDeMapa } from "./ids";
import type { TextosDeNodo } from "./mapa";
import type { PasoRecorrido, Recorrido, TextoIdioma } from "./tipos";

export interface TrazaParaCaso {
  caso_id: string;
  pasos: ReadonlyArray<{ orden: number; nodo: string; duracion_ms: number }>;
  decisiones_de_arista: ReadonlyArray<{
    desde: string;
    paso: number;
    orden_arista: number;
    tipo: "tripleta" | "funcion";
    senal: string | null;
    valor_observado: JsonValor;
    operador: string | null;
    valor_declarado: JsonValor;
    umbral_aplicado: JsonValor;
    inclusivo: boolean | null;
    funcion: string | null;
    entradas: Record<string, JsonValor> | null;
    resultado: boolean;
    rama_tomada: string;
  }>;
  pausas_humanas: ReadonlyArray<{
    nodo: string;
    paso: number;
    rol: string;
    respuesta_simulada: { decision: string; politica: string };
  }>;
}

/** Una regla que el nodo evaluó en este paso, tal como la registró la traza. */
export interface ReglaDelPaso {
  orden: number;
  tipo: "tripleta" | "funcion";
  senal: string | null;
  observado: JsonValor;
  operador: string | null;
  /** El valor que declara el plan: un literal o `umbral.Ux`. */
  declarado: JsonValor;
  /** El umbral que leyó, si la regla compara con uno (`Ux`); `null` si compara con un literal o es una función. */
  umbral: string | null;
  aplicado: JsonValor;
  inclusivo: boolean | null;
  funcion: string | null;
  entradas: Record<string, JsonValor> | null;
  resultado: boolean;
}

export interface DetalleDePaso {
  /** Número del paso en el recorrido (1…N): el valor de `data-paso`. */
  n: number;
  /** El `orden` del paso en la traza (el `paso` de sus decisiones y de su pausa). */
  paso: number;
  /** Id del nodo en el código y en el mapa. */
  nodo: string;
  nodo_mapa: string;
  duracion_ms: number;
  /** Las reglas que evaluó, en orden; vacío si el nodo no decide. */
  reglas: ReglaDelPaso[];
  /** La rama que tomó por sus reglas; `null` si el nodo no decide (sigue por secuencia). */
  rama: string | null;
  pausa: { rol: string; decision: string; politica: string } | null;
}

export interface RecorridoDeCaso {
  caso_id: string;
  /** La forma del contrato (§ 3.5), lista para el mapa y para V5/V12. */
  recorrido: Recorrido;
  pasos: DetalleDePaso[];
}

const umbralDe = (v: JsonValor): string | null =>
  typeof v === "string" && v.startsWith("umbral.")
    ? v.slice("umbral.".length)
    : null;

export function recorridoDeCaso(
  traza: TrazaParaCaso,
  textos: Readonly<Record<string, TextosDeNodo>>,
  titulo: TextoIdioma,
): RecorridoDeCaso {
  const ordenados = [...traza.pasos].sort((a, b) => a.orden - b.orden);
  if (ordenados.length === 0)
    throw new Error(`visor: el caso «${traza.caso_id}» no tiene pasos`);
  const pasos = ordenados.map((p, j): DetalleDePaso => {
    const reglas = traza.decisiones_de_arista
      .filter((d) => d.paso === p.orden && d.desde === p.nodo)
      .sort((a, b) => a.orden_arista - b.orden_arista)
      .map((d): ReglaDelPaso => ({
        orden: d.orden_arista,
        tipo: d.tipo,
        senal: d.senal,
        observado: d.valor_observado,
        operador: d.operador,
        declarado: d.valor_declarado,
        umbral: umbralDe(d.valor_declarado),
        aplicado: d.umbral_aplicado,
        inclusivo: d.inclusivo,
        funcion: d.funcion,
        entradas: d.entradas,
        resultado: d.resultado,
      }));
    const ramas = new Set(
      traza.decisiones_de_arista
        .filter((d) => d.paso === p.orden && d.desde === p.nodo)
        .map((d) => d.rama_tomada),
    );
    if (ramas.size > 1)
      throw new Error(
        `visor: el paso ${p.orden} de «${traza.caso_id}» registra dos ramas (${[...ramas].join(", ")})`,
      );
    const pausa = traza.pausas_humanas.find(
      (x) => x.paso === p.orden && x.nodo === p.nodo,
    );
    return {
      n: j + 1,
      paso: p.orden,
      nodo: p.nodo,
      nodo_mapa: idDeMapa(p.nodo),
      duracion_ms: p.duracion_ms,
      reglas,
      rama: ramas.size ? ([...ramas][0] as string) : null,
      pausa: pausa
        ? {
            rol: pausa.rol,
            decision: pausa.respuesta_simulada.decision,
            politica: pausa.respuesta_simulada.politica,
          }
        : null,
    };
  });
  return {
    caso_id: traza.caso_id,
    recorrido: {
      id: `caso-${traza.caso_id.toLowerCase()}`,
      titulo,
      pasos: pasos.map((p, j): PasoRecorrido => {
        const t = textos[p.nodo];
        if (!t)
          throw new Error(
            `visor: el recorrido de «${traza.caso_id}» pasa por «${p.nodo}», que no tiene textos`,
          );
        return {
          id: `p${p.n}`,
          nodo_id: p.nodo_mapa,
          ...(j > 0 ? { sigue_de: `p${p.n - 1}` } : {}),
          que_pasa: t.lider,
          lider: t.por_que_importa,
          experto: t.experto,
        };
      }),
    },
    pasos,
  };
}

/** Estado de cada nodo en el paso `k`: el del paso es activo; los de pasos anteriores, visitados; el resto, pendiente. */
export function estadosEnPaso(
  r: Pick<RecorridoDeCaso, "pasos">,
  k: number,
): Record<string, "activo" | "visitado"> {
  const out: Record<string, "activo" | "visitado"> = {};
  for (const p of r.pasos.slice(0, Math.max(0, k - 1)))
    out[p.nodo_mapa] = "visitado";
  const actual = r.pasos[k - 1];
  if (actual) out[actual.nodo_mapa] = "activo";
  return out;
}

/**
 * Las reglas CSS del recorrido (§ 4.3): por cada paso `k`, `[data-paso="k"]` dentro del contenedor marca el nodo
 * activo y los visitados; los demás quedan pendientes. El estado no va solo en color (P13): activo = filete grueso y
 * caja teñida; visitado = filete discontinuo; pendiente = atenuado. Ninguna regla anima (G12).
 */
export function cssDeRecorrido(
  r: Pick<RecorridoDeCaso, "pasos">,
  ns: string,
  contenedor: string,
): string {
  const lineas = [
    `${contenedor}[data-paso] svg[data-visor="${ns}"] .d-nodo { opacity: 0.45; }`,
  ];
  for (let k = 1; k <= r.pasos.length; k++) {
    const estados = estadosEnPaso(r, k);
    const de = (e: "activo" | "visitado") =>
      Object.keys(estados)
        .filter((id) => estados[id] === e)
        .sort()
        .map((id) => `${contenedor}[data-paso="${k}"] #${ns}-n-${id}`);
    const activo = de("activo");
    const visitados = de("visitado");
    lineas.push(
      `${activo.join(", ")} { opacity: 1; }`,
      `${activo.map((s) => `${s} .caja`).join(", ")} { fill: var(--t); stroke: var(--c); stroke-width: 3; }`,
    );
    if (visitados.length)
      lineas.push(
        `${visitados.join(", ")} { opacity: 1; }`,
        `${visitados.map((s) => `${s} .caja`).join(", ")} { stroke: var(--c); stroke-width: 2; stroke-dasharray: 5 3; }`,
      );
  }
  return `${lineas.join("\n")}\n`;
}
