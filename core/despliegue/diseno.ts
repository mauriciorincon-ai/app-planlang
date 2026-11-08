/**
 * El diseño de despliegue (S10): cómo se pondría a correr el agente de un plan, derivado del plan y de lo que midió
 * la corrida publicada, sin desplegar nada. Es una función pura de datos: los componentes de una arquitectura de
 * agente (canal · orquestación con checkpointer · puerto de modelo sin proveedor · guardia · cola humana · trazas ·
 * observabilidad) como un `GrafoParaMapa` para el visor, el dimensionamiento que las trazas y el informe sí miden y
 * el control de cada riesgo del plan en su componente.
 *
 * Lo que no se midió se dice «no medido» (P15): ni un host, ni un precio de servidor, ni un cálculo de personas que el
 * plan no declare. La unidad de la capacidad es la del plan («casos por día hábil»), no «auditores por día».
 *
 * El núcleo no decide nada por demo: lo que es de un demo (qué riesgo protege qué componente) llega como dato en
 * `controles`, y el plan trae sus riesgos, su pausa humana y su capacidad. Las rutas de `evidencia` son datos
 * fijos de lo que existe en `agents/` (hoy solo el A tiene su código citado); la prueba de existencia vive en los tests.
 */
import type { TextoBilingue, TextoLibre } from "../formatos/bilingue";
import { comoBilingue } from "../formatos/bilingue";
import type { InformeDePlazos } from "../brecha/plazos";
import type { Paso } from "../formatos/traza";
import type { ContratoDeGrafo } from "../plan/esquema";
import type { GrafoParaMapa } from "../visor/mapa";

export const COMPONENTES = [
  "canal",
  "orquestador",
  "puerto_modelo",
  "guardia",
  "cola_humana",
  "trazas",
  "observabilidad",
] as const;
export type IdComponente = (typeof COMPONENTES)[number];

/** Dónde se ve que el componente existe en el código que corrió: un archivo y un símbolo que contiene. */
export interface Evidencia {
  archivo: string;
  simbolo: string;
}

export interface ComponenteDeDespliegue {
  id: IdComponente;
  /** El tipo de nodo del plan con que se dibuja. */
  tipo: "enrutador" | "modelo" | "herramienta" | "regla" | "pausa_humana";
  /** La banda del lienzo: las franjas transversales no reciben nodos, así que las trazas y la observabilidad van en la salida. */
  banda:
    | "entrada"
    | "orquestacion"
    | "agentes"
    | "reglas"
    | "pausa-humana"
    | "salida";
  /**
   * `implementado` solo con evidencia en el código que corrió; sin ella, `en-construccion`. «Implementado» dice que
   * corrió en la construcción, no que esté en un servidor.
   */
  madurez: "implementado" | "en-construccion";
  evidencia: Evidencia[];
}

/** Los siete componentes con la evidencia de cada uno. Un símbolo que ya no esté en su archivo rompe el test del diseño. */
export const COMPONENTES_DEL_DISENO: readonly ComponenteDeDespliegue[] = [
  {
    id: "canal",
    tipo: "herramienta",
    banda: "entrada",
    madurez: "en-construccion",
    evidencia: [],
  },
  {
    id: "orquestador",
    tipo: "enrutador",
    banda: "orquestacion",
    madurez: "implementado",
    evidencia: [
      { archivo: "agents/src/app_agents/lotes.py", simbolo: "SqliteSaver" },
      {
        archivo: "agents/src/app_agents/demo_a/grafo.py",
        simbolo: "add_edge",
      },
    ],
  },
  {
    id: "puerto_modelo",
    tipo: "modelo",
    banda: "agentes",
    madurez: "implementado",
    evidencia: [
      {
        archivo: "agents/src/app_agents/adaptador.py",
        simbolo: "def crear_modelo",
      },
    ],
  },
  {
    id: "guardia",
    tipo: "regla",
    banda: "reglas",
    madurez: "implementado",
    evidencia: [
      {
        archivo: "agents/src/app_agents/demo_a/nodos.py",
        simbolo: "def guardia_salida",
      },
    ],
  },
  {
    id: "cola_humana",
    tipo: "pausa_humana",
    banda: "pausa-humana",
    madurez: "implementado",
    evidencia: [
      {
        archivo: "agents/src/app_agents/demo_a/nodos.py",
        simbolo: "interrupt(",
      },
      {
        archivo: "agents/src/app_agents/demo_b/nodos.py",
        simbolo: "interrupt(",
      },
    ],
  },
  {
    id: "trazas",
    tipo: "herramienta",
    banda: "salida",
    madurez: "implementado",
    evidencia: [
      { archivo: "core/formatos/traza.ts", simbolo: "planlang-trace/v1" },
    ],
  },
  {
    id: "observabilidad",
    tipo: "herramienta",
    banda: "salida",
    madurez: "en-construccion",
    evidencia: [],
  },
];

/** Cómo viaja el caso entre componentes: una cadena, con la cola humana bifurcando hacia las dos salidas. */
const ARISTAS: ReadonlyArray<readonly [string, string]> = [
  ["canal", "orquestador"],
  ["orquestador", "puerto_modelo"],
  ["puerto_modelo", "guardia"],
  ["guardia", "cola_humana"],
  ["cola_humana", "trazas"],
  ["cola_humana", "observabilidad"],
];

export interface RiesgoDelPlan {
  id: string;
  modo: TextoBilingue;
  severidad: number;
  mitigaciones: ReadonlyArray<{ accion: TextoLibre }>;
  control_legal?: boolean;
}

export interface PausaDelPlan {
  rol: string;
  payload_minimo: readonly string[];
  politica_simulada: TextoBilingue;
}

export interface EntradaDeDespliegue {
  riesgos: readonly RiesgoDelPlan[];
  /** La pausa humana del contrato de grafo del plan; `null` si no declara ninguna. */
  pausa: PausaDelPlan | null;
  /**
   * Qué componentes llevan el control de cada riesgo (id del riesgo → componentes). Un riesgo sin entrada rompe el
   * diseño; uno con lista vacía queda explícito «sin componente». Es dato de cada demo, no del núcleo.
   */
  controles: Readonly<Record<string, readonly IdComponente[]>>;
  /** La sección «Plazos» del informe, o `null` si el plan no declara plazos o el lote no trae llegadas. */
  plazos: InformeDePlazos | null;
  trazas: ReadonlyArray<{
    caso_id: string;
    pasos: ReadonlyArray<
      Pick<Paso, "nodo" | "duracion_ms" | "costo_nominal_usd">
    >;
  }>;
}

export interface LatenciaDeNodo {
  nodo: string;
  /** Cuántas veces corrió el nodo en toda la corrida (un caso puede pasar varias veces). */
  pasos: number;
  p50_ms: number;
  max_ms: number;
}

export interface MedidasDeDespliegue {
  casos: number;
  /** De `pasos[].duracion_ms` de las trazas, por nodo del grafo, de la mayor mediana a la menor. */
  latencia_por_nodo: LatenciaDeNodo[];
  /** De `pasos[].costo_nominal_usd`: lo que costó cada caso (la suma de sus pasos), nominal, no una factura. */
  costo_por_caso: {
    media_usd: number;
    p50_usd: number;
    max_usd: number;
  } | null;
  /** La capacidad del auditor medida por el informe, o `null` («no medido»). */
  capacidad: CapacidadMedida | null;
}

export interface CapacidadMedida {
  valor: number;
  unidad: TextoBilingue;
  rango: { min: number; max: number; paso: number };
  dias_habiles: number;
  /** Cuántas solicitudes pasaron por el auditor en la corrida. */
  pausas: number;
  carga_por_dia: number;
  /** La menor capacidad que cumple todos los plazos y cuántas salen tardías con una menos; `null` si ni la medida cumple. */
  minima: { valor: number; tardias_con_una_menos: number | null } | null;
  horas_de_auditor: number | null;
}

export interface RiesgoConControl {
  id: string;
  modo: TextoBilingue;
  severidad: number;
  control_legal: boolean;
  /** Lo que el plan declara como mitigación, tal cual (no se reescribe). */
  mitigaciones: TextoBilingue[];
  /** Vacío = «sin componente»: el plan lo mitiga con algo que no es un componente de despliegue. */
  componentes: IdComponente[];
}

export interface DisenoDeDespliegue {
  componentes: readonly ComponenteDeDespliegue[];
  grafo: GrafoParaMapa;
  /** Lo mínimo del contrato que `construirMapa` lee: los nodos esperados, que son los componentes. */
  contrato: ContratoDeGrafo;
  riesgos: RiesgoConControl[];
  medidas: MedidasDeDespliegue;
}

/**
 * La mediana de una lista de números: el valor del medio, o la media de los dos del medio si la cantidad es par (la
 * convención es la de siempre y está fija: el diseño publica una cifra, no un percentil interpolado).
 */
export function mediana(xs: readonly number[]): number {
  if (xs.length === 0) throw new RangeError("mediana de una lista vacía");
  const o = [...xs].sort((a, b) => a - b);
  const m = o.length >> 1;
  return o.length % 2 === 1
    ? (o[m] as number)
    : ((o[m - 1] as number) + (o[m] as number)) / 2;
}

const redondear = (x: number, decimales: number) => {
  const f = 10 ** decimales;
  return Math.round(x * f) / f;
};

/** La latencia de cada nodo del grafo que corrió, de las trazas: mediana y máximo de `duracion_ms`. */
export function latenciaPorNodo(
  trazas: EntradaDeDespliegue["trazas"],
): LatenciaDeNodo[] {
  const porNodo = new Map<string, number[]>();
  for (const t of trazas)
    for (const p of t.pasos) {
      const l = porNodo.get(p.nodo);
      if (l) l.push(p.duracion_ms);
      else porNodo.set(p.nodo, [p.duracion_ms]);
    }
  return [...porNodo]
    .map(([nodo, ms]) => ({
      nodo,
      pasos: ms.length,
      p50_ms: mediana(ms),
      max_ms: Math.max(...ms),
    }))
    .sort((a, b) => b.p50_ms - a.p50_ms || (a.nodo < b.nodo ? -1 : 1));
}

/** El costo nominal de cada caso (suma de sus pasos): media, mediana y máximo, a seis decimales. `null` sin trazas. */
export function costoPorCaso(
  trazas: EntradaDeDespliegue["trazas"],
): MedidasDeDespliegue["costo_por_caso"] {
  if (trazas.length === 0) return null;
  const costos = trazas.map((t) =>
    t.pasos.reduce((s, p) => s + p.costo_nominal_usd, 0),
  );
  return {
    media_usd: redondear(costos.reduce((s, c) => s + c, 0) / costos.length, 6),
    p50_usd: redondear(mediana(costos), 6),
    max_usd: redondear(Math.max(...costos), 6),
  };
}

function capacidadMedida(p: InformeDePlazos | null): CapacidadMedida | null {
  if (!p) return null;
  return {
    valor: p.capacidad.valor,
    unidad: p.capacidad.unidad,
    rango: p.capacidad.rango,
    dias_habiles: p.dias_habiles,
    pausas: p.pausas,
    carga_por_dia: p.carga_por_dia,
    minima: p.capacidad_minima,
    horas_de_auditor: p.horas_de_auditor,
  };
}

/**
 * El diseño de despliegue de un plan. Falla con nombre si un riesgo del plan no tiene su entrada en `controles` o si
 * `controles` nombra un riesgo que el plan no tiene (el mapa riesgo → componente no se adivina ni envejece en silencio).
 */
export function disenoDeDespliegue(e: EntradaDeDespliegue): DisenoDeDespliegue {
  const delPlan = new Set(e.riesgos.map((r) => r.id));
  for (const id of Object.keys(e.controles))
    if (!delPlan.has(id))
      throw new Error(
        `despliegue: «${id}» está en los controles y no es un riesgo del plan`,
      );
  const riesgos = e.riesgos.map((r): RiesgoConControl => {
    const componentes = e.controles[r.id];
    if (!componentes)
      throw new Error(
        `despliegue: el riesgo «${r.id}» no tiene su control en ningún componente (lista vacía = «sin componente», explícita)`,
      );
    return {
      id: r.id,
      modo: r.modo,
      severidad: r.severidad,
      control_legal: r.control_legal === true,
      mitigaciones: r.mitigaciones.map((m) => comoBilingue(m.accion)),
      componentes: COMPONENTES.filter((c) => componentes.includes(c)),
    };
  });

  const componentes = COMPONENTES_DEL_DISENO;
  const grafo: GrafoParaMapa = {
    nodos: componentes.map((c) => ({
      id: c.id,
      tipo: c.tipo,
      banda: c.banda,
      madurez: c.madurez,
    })),
    aristas: ARISTAS.map(([source, target]) => ({ source, target })),
    aristas_condicionales: [],
    ramas_por_defecto: {},
    pausas_humanas: e.pausa
      ? [
          {
            nodo: "cola_humana",
            rol: e.pausa.rol,
            payload_minimo: [...e.pausa.payload_minimo],
            politica_simulada: e.pausa.politica_simulada,
          },
        ]
      : [],
  };
  const contrato: ContratoDeGrafo = {
    nodos_esperados: componentes.map((c) => ({ id: c.id, tipo: c.tipo })),
    aristas_condicionales: [],
    ramas_por_defecto: {},
    pausas_humanas: grafo.pausas_humanas as ContratoDeGrafo["pausas_humanas"],
    senales_obligatorias_en_traza: [],
    evaluadores_requeridos: [],
  };

  return {
    componentes,
    grafo,
    contrato,
    riesgos,
    medidas: {
      casos: e.trazas.length,
      latencia_por_nodo: latenciaPorNodo(e.trazas),
      costo_por_caso: costoPorCaso(e.trazas),
      capacidad: capacidadMedida(e.plazos),
    },
  };
}
