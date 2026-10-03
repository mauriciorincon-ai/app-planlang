/**
 * La vista de P1 Entrada: toda cifra sale del plan, del informe y del manifiesto de la vitrina; la copia,
 * de `src/textos/entrada.ts`. Función pura (sin disco ni reloj): los tests la corren con los datos reales
 * y con variantes armadas a mano (un criterio incumplido, un riesgo ocurrido, sin línea base).
 */
import type { Idioma } from "@core/formatos/bilingue";
import type { DatosDemo } from "@/lib/datos/vitrina";
import { CATEGORIA_DE_BRECHA, LECTURA_DE_SUPUESTO } from "@/textos/entrada";
import {
  conteo,
  deCada,
  enumerar,
  ESPACIO_DURO,
  versionCorta,
} from "./formato";
import { tipoDeNodo, type TipoDeNodo } from "./nodos";
import { tb } from "@core/formatos/bilingue";

export type ValorVeredicto = "cumple" | "cumple_con_alertas" | "no_cumple";
export type EstadoCuadro = "cumple" | "no-cumple" | "sin-probar";

export interface ParteDelPlan {
  clave: "decisiones" | "riesgos" | "supuestos" | "criterios" | "umbrales";
  codigo: string;
  n: number;
  /** Largo de la barra: la parte sobre la mayor (0–1). */
  fraccion: number;
}

export interface Falla {
  tipo: "fallo" | "sin-probar";
  texto: string;
}

export interface VistaEntrada {
  plan: { partes: ParteDelPlan[] };
  agente: {
    nodos: { id: string; tipo: TipoDeNodo; enGrafo: boolean }[];
    pie: string;
  };
  brecha: {
    cuadros: { id: string; estado: EstadoCuadro }[];
    etiquetaCuadros: string;
    leyenda: { criteriosCumplen: string; riesgosOcurren: string };
    fallas: Falla[];
    pie: string;
  };
  /** Cuántas fallas se ven (criterios incumplidos, riesgos ocurridos, supuestos refutados, lo no previsto). */
  fallasALaVista: { n: number; texto: string };
  capacidad: {
    casos: { cifra: string; texto: string; chip: string };
    cruzada: { cifra: string; chip: string };
    balance: { cifra: string };
  };
  veredicto: { valor: ValorVeredicto; detalle: string };
  corrida: { texto: string; chip: string };
  experto: { cruzada: string; modelo: string; pila: string };
}

const X = `${ESPACIO_DURO}×${ESPACIO_DURO}`;

const FORMAS = {
  falla: { uno: tb("falla", "failure"), varios: tb("fallas", "failures") },
  supuestoSinProbar: {
    uno: tb("supuesto sin probar", "assumption untested"),
    varios: tb("supuestos sin probar", "assumptions untested"),
  },
  corrida: { uno: tb("corrida", "run"), varios: tb("corridas", "runs") },
  decision: {
    uno: tb("decisión", "decision"),
    varios: tb("decisiones", "decisions"),
  },
  diferencia: {
    uno: tb("diferencia", "difference"),
    varios: tb("diferencias", "differences"),
  },
};

function lecturaDeSupuesto(id: string, idioma: Idioma): string {
  const l = LECTURA_DE_SUPUESTO[id];
  if (!l)
    throw new Error(
      `vitrina: el supuesto ${id} no tiene lectura corta en src/textos/entrada.ts`,
    );
  return l[idioma];
}

function loNoPrevisto(categorias: string[], idioma: Idioma): string {
  const cuenta = new Map<string, number>();
  for (const c of categorias) cuenta.set(c, (cuenta.get(c) ?? 0) + 1);
  const partes = [...cuenta].map(([c, n]) => {
    const forma = CATEGORIA_DE_BRECHA[c];
    if (!forma)
      throw new Error(
        `vitrina: la categoría de brecha «${c}» no tiene nombre en src/textos/entrada.ts`,
      );
    return conteo(n, forma, idioma);
  });
  return enumerar(partes, idioma);
}

export function vistaEntrada(datos: DatosDemo, idioma: Idioma): VistaEntrada {
  const { plan, informe, entorno, manifiesto } = datos;
  const es = idioma === "es";
  const ficha = informe.ficha_reproducibilidad;

  // Cómo funciona · Planeé: las cinco partes del plan, con la barra relativa a la mayor.
  const cuentas = [
    ["decisiones", "D", plan.decisiones.length],
    ["riesgos", "R", plan.riesgos.length],
    ["supuestos", "S", plan.supuestos.length],
    ["criterios", "C", plan.criterios_aceptacion.length],
    ["umbrales", "U", plan.umbrales.length],
  ] as const;
  const mayor = Math.max(...cuentas.map(([, , n]) => n));
  const partes = cuentas.map(([clave, codigo, n]) => ({
    clave,
    codigo,
    n,
    fraccion: mayor === 0 ? 0 : n / mayor,
  }));

  // Construí: las piezas del contrato de grafo, en su orden, y cuántas están en el grafo compilado.
  const nodos = informe.contrato_de_grafo.nodos.map((n) => ({
    id: n.id,
    tipo: tipoDeNodo(n.tipo),
    enGrafo: n.en_grafo,
  }));
  const enGrafo = nodos.filter((n) => n.enGrafo).length;
  const sprint = manifiesto.corrida.sprint;
  const agentePie = es
    ? `el agente del sprint ${sprint} · ${deCada(enGrafo, nodos.length, idioma)} piezas`
    : `the sprint ${sprint} agent · ${deCada(enGrafo, nodos.length, idioma)} pieces`;

  // Medí la brecha: un cuadro por criterio, la leyenda y lo que falló, nombrado.
  const cuadros = informe.criterios.map((c) => ({
    id: c.id,
    estado: (c.estado === "cumple"
      ? "cumple"
      : c.estado === "incumple"
        ? "no-cumple"
        : "sin-probar") as EstadoCuadro,
  }));
  const nCrit = cuadros.length;
  const cumplen = cuadros.filter((c) => c.estado === "cumple").length;
  const incumplidos = informe.criterios.filter((c) => c.estado === "incumple");
  const nRiesgos = informe.riesgos.length;
  const ocurridos = informe.riesgos.filter((r) => r.estado === "ocurrio");
  const refutados = informe.supuestos.filter((s) => s.estado === "refutado");
  const sinProbar = informe.supuestos.filter((s) => s.estado === "sin_probar");
  const brechas = informe.brechas_no_previstas.brechas;

  const fallas: Falla[] = [
    ...incumplidos.map((c) => ({
      tipo: "fallo" as const,
      texto: es
        ? `Falló ${c.id}: ${c.enunciado.es}`
        : `${c.id} failed: ${c.enunciado.en}`,
    })),
    ...ocurridos.map((r) => ({
      tipo: "fallo" as const,
      texto: es
        ? `Ocurrió ${r.id}: ${r.modo.es}`
        : `${r.id} occurred: ${r.modo.en}`,
    })),
    ...refutados.map((s) => ({
      tipo: "fallo" as const,
      texto: es
        ? `Falló ${s.id}: ${lecturaDeSupuesto(s.id, idioma)}`
        : `${s.id} failed: ${lecturaDeSupuesto(s.id, idioma)}`,
    })),
    ...(brechas.length > 0
      ? [
          {
            tipo: "fallo" as const,
            texto: es
              ? `Falló lo no previsto: ${loNoPrevisto(
                  brechas.map((b) => b.categoria),
                  idioma,
                )}`
              : `The unforeseen failed: ${loNoPrevisto(
                  brechas.map((b) => b.categoria),
                  idioma,
                )}`,
          },
        ]
      : []),
    ...sinProbar.map((s) => ({
      tipo: "sin-probar" as const,
      texto: es
        ? `Sin probar ${s.id}: ${lecturaDeSupuesto(s.id, idioma)}`
        : `${s.id} untested: ${lecturaDeSupuesto(s.id, idioma)}`,
    })),
  ];
  const nFallas = fallas.filter((f) => f.tipo === "fallo").length;

  const vEjec = versionCorta(ficha.corrida.plan_de_ejecucion.version);
  const vPlan = versionCorta(ficha.plan.version);
  const nCorridas = 1 + ficha.repeticiones.length;
  const casos = ficha.corrida.casos_ejecutados;
  const casosPorCorridas = `${casos}${X}${nCorridas}`;
  const corridaCorta = es ? `corrida ${vEjec}` : `run ${vEjec}`;

  // Capacidad y la prueba cruzada RF-09.2 (todas las corridas del informe: la principal, las repeticiones y la base).
  const rf = informe.contrato_de_grafo.rf_09_2;
  const decisiones = rf.reduce((s, c) => s + c.visitas, 0);
  const diferencias = rf.reduce((s, c) => s + c.discrepancias, 0);

  const balanceCifra = `${deCada(cumplen, nCrit, idioma)} · ${deCada(ocurridos.length, nRiesgos, idioma)}`;
  const leyendaCrit = es
    ? `${deCada(cumplen, nCrit, idioma)} criterios cumplen`
    : `${deCada(cumplen, nCrit, idioma)} criteria met`;
  const leyendaRiesgos = es
    ? `${deCada(ocurridos.length, nRiesgos, idioma)} riesgos ocurrieron`
    : `${deCada(ocurridos.length, nRiesgos, idioma)} risks occurred`;

  // Veredicto de la fila del demo: criterios, riesgos, fallas y supuestos sin probar.
  const detallePartes = [
    es
      ? `${deCada(cumplen, nCrit, idioma)} criterios`
      : `${deCada(cumplen, nCrit, idioma)} criteria`,
    es
      ? `${deCada(ocurridos.length, nRiesgos, idioma)} riesgos`
      : `${deCada(ocurridos.length, nRiesgos, idioma)} risks`,
  ];
  const cola = [
    ...(nFallas > 0 ? [conteo(nFallas, FORMAS.falla, idioma)] : []),
    ...(sinProbar.length > 0
      ? [conteo(sinProbar.length, FORMAS.supuestoSinProbar, idioma)]
      : []),
  ];
  if (cola.length > 0) detallePartes.push(cola.join(es ? " y " : " and "));

  const lineaBase = ficha.linea_base !== null;
  const corridaTexto = [
    vPlan === vEjec
      ? `plan ${vPlan}`
      : es
        ? `plan ${vPlan} · corrida con ${vEjec}`
        : `plan ${vPlan} · run with ${vEjec}`,
    `${casos} ${es ? "casos" : "cases"}${X}${nCorridas}${
      lineaBase ? (es ? " + línea base" : " + baseline") : ""
    }`,
    ficha.corrida.fecha,
  ].join(" · ");

  const version = (s: string) => s.match(/\d+(\.\d+)+/)?.[0] ?? s;
  const pythonMenor = version(entorno.python).split(".").slice(0, 2).join(".");
  const pila = [
    `LangGraph ${entorno.paquetes.langgraph}`,
    `LangChain ${entorno.paquetes.langchain}`,
    `Python ${pythonMenor}`,
    `Claude Code ${version(entorno.claude_cli)}`,
  ].join(" · ");

  const modelo =
    ficha.corrida.proveedor === "suscripcion"
      ? es
        ? `${ficha.corrida.modelo} por la suscripción de Claude Code del autor, en lotes de ${ficha.casos.n_lote} fuera de CI, con interruptor a una API por clave`
        : `${ficha.corrida.modelo} through the author’s Claude Code subscription, in batches of ${ficha.casos.n_lote} outside CI, with a switch to a keyed API`
      : es
        ? `${ficha.corrida.modelo} por ${ficha.corrida.proveedor}, en lotes de ${ficha.casos.n_lote} fuera de CI`
        : `${ficha.corrida.modelo} through ${ficha.corrida.proveedor}, in batches of ${ficha.casos.n_lote} outside CI`;

  return {
    plan: { partes },
    agente: { nodos, pie: agentePie },
    brecha: {
      cuadros,
      etiquetaCuadros: es
        ? `${nCrit} criterios: ${cumplen} cumplen${
            incumplidos.length
              ? `, ${incumplidos.length} no cumplen (${incumplidos.map((c) => c.id).join(", ")})`
              : ""
          }`
        : `${nCrit} criteria: ${cumplen} met${
            incumplidos.length
              ? `, ${incumplidos.length} not met (${incumplidos.map((c) => c.id).join(", ")})`
              : ""
          }`,
      leyenda: {
        criteriosCumplen: leyendaCrit,
        riesgosOcurren: leyendaRiesgos,
      },
      fallas,
      pie: es
        ? `${corridaCorta} · ${casos} casos${X}${nCorridas}`
        : `${corridaCorta} · ${casos} cases${X}${nCorridas}`,
    },
    fallasALaVista: {
      n: nFallas,
      texto:
        nFallas === 0
          ? es
            ? "Ninguna falla"
            : "No failures"
          : es
            ? `${conteo(nFallas, FORMAS.falla, idioma)} a la vista`
            : `${conteo(nFallas, FORMAS.falla, idioma)} in view`,
    },
    capacidad: {
      casos: {
        cifra: casosPorCorridas,
        texto: es
          ? `casos por corrida${lineaBase ? ", más una línea base de agente único" : ""}`
          : `cases per run${lineaBase ? ", plus a single-agent baseline" : ""}`,
        chip: es ? `real · ${corridaCorta}` : `real · ${corridaCorta}`,
      },
      cruzada: {
        cifra: `${decisiones} · ${diferencias}`,
        chip: "real · RF-09.2",
      },
      balance: { cifra: balanceCifra },
    },
    veredicto: {
      valor: informe.veredicto.valor,
      detalle: detallePartes.join(" · "),
    },
    corrida: {
      texto: corridaTexto,
      chip: es ? `real · sprint ${sprint}` : `real · sprint ${sprint}`,
    },
    experto: {
      cruzada: es
        ? `RF-09.2: el grafo (Python) y el playground (TypeScript) evalúan la misma regla del plan; ${conteo(diferencias, FORMAS.diferencia, idioma)} en ${conteo(decisiones, FORMAS.decision, idioma)} de ${conteo(rf.length, FORMAS.corrida, idioma)}`
        : `RF-09.2: the graph (Python) and the playground (TypeScript) evaluate the same plan rule; ${conteo(diferencias, FORMAS.diferencia, idioma)} in ${conteo(decisiones, FORMAS.decision, idioma)} across ${conteo(rf.length, FORMAS.corrida, idioma)}`,
      modelo,
      pila,
    },
  };
}
