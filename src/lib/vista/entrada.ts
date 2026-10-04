/**
 * La vista de P1 Entrada: toda cifra sale del plan, del informe y del manifiesto de la vitrina; la copia,
 * de `src/textos/entrada.ts`. Función pura (sin disco ni reloj): los tests la corren con los datos reales
 * y con variantes armadas a mano (un criterio incumplido, un riesgo ocurrido, sin línea base).
 */
import type { Idioma } from "@core/formatos/bilingue";
import type { DatosDemo } from "@/lib/datos/vitrina";
import {
  ARMADO,
  CATEGORIA_DE_BRECHA,
  FORMAS,
  LECTURA_DE_SUPUESTO,
} from "@/textos/entrada";
import {
  conteo,
  deCada,
  enumerar,
  ESPACIO_DURO,
  versionCorta,
} from "./formato";
import { tipoDeNodo, type TipoDeNodo } from "./nodos";

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
  const agentePie = ARMADO.agentePie({
    sprint,
    piezas: deCada(enGrafo, nodos.length, idioma),
  })[idioma];

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
      texto: ARMADO.fallo({ id: c.id, texto: c.enunciado[idioma] })[idioma],
    })),
    ...ocurridos.map((r) => ({
      tipo: "fallo" as const,
      texto: ARMADO.ocurrio({ id: r.id, texto: r.modo[idioma] })[idioma],
    })),
    ...refutados.map((s) => ({
      tipo: "fallo" as const,
      texto: ARMADO.fallo({
        id: s.id,
        texto: lecturaDeSupuesto(s.id, idioma),
      })[idioma],
    })),
    ...(brechas.length > 0
      ? [
          {
            tipo: "fallo" as const,
            texto: ARMADO.noPrevisto(
              loNoPrevisto(
                brechas.map((b) => b.categoria),
                idioma,
              ),
            )[idioma],
          },
        ]
      : []),
    ...sinProbar.map((s) => ({
      tipo: "sin-probar" as const,
      texto: ARMADO.sinProbar({
        id: s.id,
        texto: lecturaDeSupuesto(s.id, idioma),
      })[idioma],
    })),
  ];
  const nFallas = fallas.filter((f) => f.tipo === "fallo").length;

  const vEjec = versionCorta(ficha.corrida.plan_de_ejecucion.version);
  const vPlan = versionCorta(ficha.plan.version);
  const nCorridas = 1 + ficha.repeticiones.length;
  const casos = ficha.corrida.casos_ejecutados;
  const casosPorCorridas = `${casos}${X}${nCorridas}`;
  const corridaCorta = ARMADO.corridaCorta(vEjec)[idioma];

  // Capacidad y la prueba cruzada RF-09.2 (todas las corridas del informe: la principal, las repeticiones y la base).
  const rf = informe.contrato_de_grafo.rf_09_2;
  const decisiones = rf.reduce((s, c) => s + c.visitas, 0);
  const diferencias = rf.reduce((s, c) => s + c.discrepancias, 0);

  const balanceCifra = `${deCada(cumplen, nCrit, idioma)} · ${deCada(ocurridos.length, nRiesgos, idioma)}`;
  const leyendaCrit = ARMADO.criteriosCumplen(deCada(cumplen, nCrit, idioma))[
    idioma
  ];
  const leyendaRiesgos = ARMADO.riesgosOcurrieron(
    deCada(ocurridos.length, nRiesgos, idioma),
  )[idioma];

  // Veredicto de la fila del demo: criterios, riesgos, fallas y supuestos sin probar.
  const detallePartes = [
    ARMADO.criterios(deCada(cumplen, nCrit, idioma))[idioma],
    ARMADO.riesgos(deCada(ocurridos.length, nRiesgos, idioma))[idioma],
  ];
  const cola = [
    ...(nFallas > 0 ? [conteo(nFallas, FORMAS.falla, idioma)] : []),
    ...(sinProbar.length > 0
      ? [conteo(sinProbar.length, FORMAS.supuestoSinProbar, idioma)]
      : []),
  ];
  if (cola.length > 0) detallePartes.push(enumerar(cola, idioma));

  const lineaBase = ficha.linea_base !== null;
  const corridaTexto = [
    ARMADO.planYCorrida({ plan: vPlan, ejecucion: vEjec })[idioma],
    ARMADO.casosPorCorridas({ casos, por: `${X}${nCorridas}`, lineaBase })[
      idioma
    ],
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

  const modelo = (
    ficha.corrida.proveedor === "suscripcion"
      ? ARMADO.modeloSuscripcion({
          modelo: ficha.corrida.modelo,
          lote: ficha.casos.n_lote,
        })
      : ARMADO.modeloProveedor({
          modelo: ficha.corrida.modelo,
          proveedor: ficha.corrida.proveedor,
          lote: ficha.casos.n_lote,
        })
  )[idioma];

  return {
    plan: { partes },
    agente: { nodos, pie: agentePie },
    brecha: {
      cuadros,
      etiquetaCuadros: ARMADO.etiquetaCuadros({
        n: nCrit,
        cumplen,
        incumplidos: incumplidos.map((c) => c.id),
      })[idioma],
      leyenda: {
        criteriosCumplen: leyendaCrit,
        riesgosOcurren: leyendaRiesgos,
      },
      fallas,
      pie: ARMADO.piePrueba({
        corrida: corridaCorta,
        casos,
        por: `${X}${nCorridas}`,
      })[idioma],
    },
    fallasALaVista: {
      n: nFallas,
      texto: ARMADO.fallasALaVista({
        n: nFallas,
        conteo: conteo(nFallas, FORMAS.falla, idioma),
      })[idioma],
    },
    capacidad: {
      casos: {
        cifra: casosPorCorridas,
        texto: ARMADO.casosPorCorrida(lineaBase)[idioma],
        chip: `real · ${corridaCorta}`,
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
      chip: `real · sprint ${sprint}`,
    },
    experto: {
      cruzada: ARMADO.cruzada({
        diferencias: conteo(diferencias, FORMAS.diferencia, idioma),
        decisiones: conteo(decisiones, FORMAS.decision, idioma),
        corridas: conteo(rf.length, FORMAS.corrida, idioma),
      })[idioma],
      modelo,
      pila,
    },
  };
}
