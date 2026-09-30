/**
 * Vista de P3 Agente: arma lo que se pinta desde la corrida (sus 20 trazas verificadas), el lote sintético, el
 * plan y el informe. Ninguna cifra se escribe a mano: todas se calculan aquí. Pura: los mismos datos dan la misma
 * vista en los dos idiomas (salvo el texto).
 */
import { mediana } from "@core/brecha/numeros";
import type { Idioma, TextoBilingue } from "@core/formatos/bilingue";
import type { Traza } from "@core/formatos/traza";
import { esAristaTripleta } from "@core/plan/esquema";
import type { Caso } from "@core/sintetico/esquema";
import { idDeMapa } from "@core/visor/ids";
import { BANDA_DE_TIPO } from "@core/visor/mapa";
import type { DatosDemo } from "@/lib/datos/vitrina";
import { ruta } from "@/lib/ruta";
import {
  ACTIVIDADES,
  ARISTA_U1,
  CIFRAS_ACTIVIDAD,
  CIFRAS_PUEDE,
  CONTRATO_CIFRAS,
  EXPERTO,
  EXTRACTOR_S1,
  FICHA,
  GRAFO,
  MARCA_CORRIO,
  MOTIVO_PAUSA,
  NODOS,
  NOTA_TRAZAS,
  PANEL,
  PIE_AGENTE,
  PLAN_POR_NODO,
  PORTADA,
  PUEDE,
  SPIKE,
  TIPO_DE_CASO,
  TRAZAS_DE_NODO,
  UNIDADES,
  VALORES,
  frasesDeCriterios,
  type CifrasDeNodo,
} from "@/textos/agente";
import {
  APAGADO,
  ENCENDIDO,
  ESTADO_SUPUESTO,
  INCLUSIVO,
  REVERSIBILIDAD,
} from "@/textos/plan-comun";
import { decimal, entero, enumerar, versionCorta } from "./formato";
import {
  controlLegal,
  estadoDeCriterio,
  estadoDeRiesgo,
  estadoDeSupuesto,
  prioridad,
  type ClaseDeEstado,
  type RiesgoDelInforme,
} from "./plan-comun";
import { GRAMATICA, grafoParaMapa, lienzo, type Lienzo } from "./visor";

export interface Item {
  titulo: string;
  detalle: string;
  corrio?: boolean;
  /** Id del plan (actor), cuando lo tiene. */
  id?: string;
}
export interface Fila {
  k: string;
  v: string;
  /** Lista de códigos (chips mono) en lugar de texto. */
  codigos?: string[];
  /** Una aclaración tras el valor, en tinta 2 y entre paréntesis (P2: el efecto esperado de una mitigación). */
  nota?: string;
}
export interface Grupo {
  rotulo: string;
  filas: Fila[];
}
export interface Cifra {
  cifra: string;
  unidad?: string;
  texto: string;
  detalle: string;
  estimacion?: boolean;
  /** Fracción (0–1) de lo que el plan permite, para la barra bajo la cifra. */
  barra?: number;
}
export type { ClaseDeEstado };
/** Un elemento del plan que gobierna un nodo, como lo lista «Lo que el plan le exige». */
export interface RefPlan {
  id: string;
  texto: string;
  /** Decisión: su reversibilidad (la de una vía lleva marca de alerta). */
  etiqueta?: { texto: string; unaVia: boolean };
  /** Riesgo: prioridad de acción efectiva, en barras (1–3) y en palabras. */
  ap?: { barras: number; texto: string };
  /** Riesgo: S · O · D · RPN (y el control legal); umbral: señal · operador. */
  factores?: string;
  /** Riesgo, supuesto o criterio: lo que midió el verificador. */
  estado?: { texto: string; clase: ClaseDeEstado };
}
export interface BloqueCodigo {
  titulo: string;
  archivo: string;
  /** Número de la primera línea en el archivo. */
  desde: number;
  lineas: string;
  codigo: string;
}
export interface FilaTraza {
  id: string;
  tipo: string;
  celdas: string[];
  /** La primera celda es una señal numérica: su barra (0–1) con la marca del umbral del plan. */
  barra?: { valor: number; umbral: number };
  solicitud: string;
  pares: Array<{ k: string; v: string }>;
  enlace: string;
}
/** Qué dice un campo del panel del líder (elige su ícono; `falta` se pinta en tinta 2). */
export type ClaveCampo =
  | "paraQue"
  | "como"
  | "decide"
  | "siFalla"
  | "seMide"
  | "enLaCorrida"
  | "falta"
  | "garantia";
export interface Campo {
  clave: ClaveCampo;
  rotulo: string;
  texto: string;
}
export interface PanelNodo {
  id: string;
  nombre: string;
  tipo: string;
  codigo: string;
  rol: string;
  chip: string;
  lider: {
    recibe: { titulo: string; sub: string };
    entrega: { titulo: string; sub: string };
    campos: Campo[];
  };
  experto: {
    contrato: Grupo;
    modelo: Grupo;
    plan: RefPlan[];
    observado: Grupo;
  };
  codigoBloques: BloqueCodigo[];
  codigoFuente: string;
  trazas: {
    columnas: string[];
    filas: FilaTraza[];
    visibles: number;
    nota: string;
  };
}
export interface PanelArista {
  id: string;
  titulo: string;
  rol: string;
  chip: string;
  filas: Fila[];
  playground: string;
  puntos: Array<{ id: string; valor: number; aPersona: boolean }>;
  umbral: number;
  eje: { min: number; max: number };
  nota: string;
}
/** El spike de la F1 frente al mismo contrato: su lectura, tres cifras y su lienzo (sin selección). */
export interface VistaSpike {
  chip: string;
  lectura: string;
  cifras: Cifra[];
  lienzo: Lienzo;
  region: string;
}
export interface VistaAgente {
  portada: { antetitulo: string; titulo: string; guia: string };
  ficha: {
    objetivo: string;
    recibe: Item[];
    hace: {
      sub: string;
      items: Array<Item & { n: number; nodos: string[]; flecha: boolean }>;
    };
    entrega: Item[];
    leyenda: string;
    puede: Item[];
    nunca: { items: Item[]; nota: string };
    participan: Item[];
    capacidad: Cifra[];
    fuente: string;
    chip: string;
    marca: string;
  };
  experto: {
    grupos: Grupo[];
    matriz: {
      columnas: string[];
      filas: Array<{
        nodo: string;
        tipo: string;
        celdas: string[];
        corrio: boolean;
      }>;
      nota: string;
      fuente: string;
    };
    estado: BloqueCodigo;
  };
  contrato: { cifras: Cifra[]; fuente: string; chip: string };
  lienzo: Lienzo;
  paneles: PanelNodo[];
  arista: PanelArista;
  pie: string;
  spike: VistaSpike | null;
  /** El tipo de cada nodo del contrato (para su glifo donde se nombra). */
  tipoDe: Record<string, string>;
}

const X = (t: TextoBilingue, i: Idioma) => t[i];

/** El valor de un umbral como lo lee una persona: decimales con coma en español, booleanos en palabras. */
export function valorDeUmbral(v: unknown, i: Idioma): string {
  if (typeof v === "boolean") return X(v ? ENCENDIDO : APAGADO, i);
  if (typeof v === "number")
    return Number.isInteger(v) ? entero(v, i) : decimal(v, 2, i);
  return String(v);
}

/** La rama que tomó cada visita a un nodo y la regla que la decidió (la primera que se cumplió, o ninguna). */
function visitas(t: Traza, nodo: string) {
  const porPaso = new Map<number, Traza["decisiones_de_arista"]>();
  for (const d of t.decisiones_de_arista.filter((x) => x.desde === nodo))
    (porPaso.get(d.paso) ?? porPaso.set(d.paso, []).get(d.paso)!).push(d);
  return [...porPaso.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([paso, ds]) => {
      const regla = ds
        .filter((d) => d.resultado)
        .sort((a, b) => a.orden_arista - b.orden_arista)[0];
      return { paso, rama: ds[0]!.rama_tomada, regla };
    });
}

type Categoria = keyof CifrasDeNodo["porRegla"];
function categoria(d: {
  senal: string | null;
  funcion: string | null;
}): Categoria {
  const s = d.senal ?? d.funcion ?? "";
  if (s === "senal_confianza") return "confianza";
  if (s === "costo_estimado") return "altoCosto";
  if (s === "contradiccion_orden_texto") return "contradiccion";
  if (s === "propuesta") return "negar";
  return "texas";
}

export function vistaAgente(d: DatosDemo, i: Idioma): VistaAgente {
  const es = i === "es";
  const trazas = d.corrida.trazas;
  const n = trazas.length;
  const casoDe = new Map<string, Caso>(d.lote.casos.map((c) => [c.id, c]));
  const corrida = versionCorta(d.corrida.manifiesto.plan.version);
  const sprint = d.manifiesto.corrida.sprint;
  const fecha = d.corrida.manifiesto.fecha;
  const modelo = d.corrida.manifiesto.modelo;
  const demo = d.corrida.manifiesto.ficha.nombre;
  const informe = d.informe;
  const criterio = (id: string) => informe.criterios.find((c) => c.id === id);
  const cumple = (id: string) => criterio(id)?.estado === "cumple";
  const visita = (t: Traza, nodo: string) => t.nodos_visitados.includes(nodo);
  const con = (nodo: string) => trazas.filter((t) => visita(t, nodo));
  const pasosDe = (nodo: string) =>
    trazas.flatMap((t) => t.pasos.filter((p) => p.nodo === nodo));
  const cobertura = (t: Traza) =>
    (t.cobertura ?? {}) as Record<string, unknown>;
  const senal = (t: Traza, k: string) => t.senales[k];
  const costoHumano = Math.max(
    ...d.plan.umbrales.map((u) => u.costo_humano_por_caso_min ?? 0),
  );
  const marca = MARCA_CORRIO(corrida)[i];

  // ── cifras por nodo ──────────────────────────────────────────────────────────────────────────────
  const enr = con("enrutador").map((t) => visitas(t, "enrutador")[0]!);
  const dec = con("decision").flatMap((t) =>
    visitas(t, "decision").map((v) => ({ t, v })),
  );
  const acl = con("aclaracion");
  const pausas = trazas.flatMap((t) => t.pausas_humanas.map((p) => ({ t, p })));
  const porRegla = {
    negar: 0,
    altoCosto: 0,
    confianza: 0,
    contradiccion: 0,
    texas: 0,
  };
  for (const { v } of dec) if (v.regla) porRegla[categoria(v.regla)]++;
  const cargas = trazas
    .filter((t) => t.guardia_salida?.carga_detectada_en_entrada)
    .map((t) => t.caso_id);
  const s1 = informe.supuestos.find((s) => s.id === "S1");
  const s2 = informe.supuestos.find((s) => s.id === "S2");
  const medidosS1 =
    (s1 as { curva?: Array<{ aceptados: number }> } | undefined)?.curva?.[0]
      ?.aceptados ?? 0;
  const cifras = (nodo: string, crit: string[]): CifrasDeNodo => ({
    total: n,
    casos: con(nodo).length,
    visitas: pasosDe(nodo).length,
    criterios: frasesDeCriterios(crit, cumple),
    aExtractor: enr.filter((v) => v.rama === "extractor").length,
    urgencias: enr.filter((v) => v.regla?.senal === "tipo_atencion").length,
    exentos: enr.filter((v) => v.regla?.senal === "servicio_exento").length,
    reintentos: pasosDe(nodo).reduce((a, p) => a + p.reintentos_esquema, 0),
    preguntas: acl.reduce((a, t) => a + t.aclaraciones.length, 0),
    resueltos: acl
      .filter((t) =>
        visitas(t, "aclaracion").every((v) => v.rama !== "pausa_humana"),
      )
      .map((t) => t.caso_id),
    tope: acl
      .filter((t) =>
        visitas(t, "aclaracion").some((v) => v.rama === "pausa_humana"),
      )
      .map((t) => t.caso_id),
    excluidos: con("verificador_cobertura").filter(
      (t) => cobertura(t).estado_servicio === "excluido",
    ).length,
    altoCosto: con("verificador_cobertura").filter(
      (t) => cobertura(t).alto_costo === true,
    ).length,
    contradicciones: con("verificador_cobertura").filter(
      (t) => cobertura(t).contradiccion === true,
    ).length,
    solos: dec.filter(({ v }) => v.rama !== "pausa_humana").length,
    aPersona: dec.filter(({ v }) => v.rama === "pausa_humana").length,
    porRegla,
    pausas: pausas.length,
    desdeDecision: pausas.filter(
      ({ p }) =>
        (p.payload.motivo as { desde?: string } | undefined)?.desde ===
        "decision",
    ).length,
    desdeAclaracion: pausas.filter(
      ({ p }) =>
        (p.payload.motivo as { desde?: string } | undefined)?.desde ===
        "aclaracion",
    ).length,
    nego: pausas.filter(({ p }) => p.respuesta_simulada.decision === "negar")
      .length,
    aprobo: pausas.filter(
      ({ p }) => p.respuesta_simulada.decision === "aprobar",
    ).length,
    minutos: pausas.length * costoHumano,
    minutosPorCaso: costoHumano,
    negaciones: trazas.filter(
      (t) =>
        t.documento_adverso &&
        t.documento_adverso.completo &&
        t.documento_adverso.idiomas.join() === "es,en",
    ).length,
    hallazgos: trazas.reduce(
      (a, t) => a + (t.guardia_salida?.hallazgos.length ?? 0),
      0,
    ),
    severidadMax: Math.max(
      0,
      ...trazas.map((t) => t.guardia_salida?.severidad_accion ?? 0),
    ),
    cargas,
    accion: [
      ...new Set(
        trazas.flatMap((t) => t.guardia_salida?.acciones_ejecutadas ?? []),
      ),
    ].join(", "),
    s1: {
      medidos: medidosS1,
      aciertos: medidosS1,
      sinProbar: s1?.estado === "sin_probar",
    },
    s2: X(ESTADO_SUPUESTO[s2?.estado ?? "sin_probar"]!, i).toLowerCase(),
  });
  const CRITERIOS_DE: Record<string, string[]> = {
    enrutador: ["C4"],
    extractor: ["C5", "C6"],
    aclaracion: [],
    verificador_cobertura: [],
    decision: ["C1", "C3"],
    pausa_humana: [],
    redactor: ["C8"],
    guardia_salida: ["C2", "C6"],
  };
  const cifrasDe = Object.fromEntries(
    Object.keys(NODOS).map((k) => [k, cifras(k, CRITERIOS_DE[k] ?? [])]),
  ) as Record<string, CifrasDeNodo>;

  // ── ficha ───────────────────────────────────────────────────────────────────────────────────────
  const contradicen = trazas
    .filter((t) => cobertura(t).contradiccion === true)
    .map((t) => t.caso_id);
  const pb = d.planBeneficios.procedimientos;
  const cE = cifrasDe.enrutador!;
  const decisionFinal = (t: Traza) => senal(t, "decision_final");
  const aprobadas = trazas.filter((t) => decisionFinal(t) === "aprobar").length;
  const negadas = trazas.filter((t) => decisionFinal(t) === "negar").length;
  const campos =
    d.plan.contrato_de_grafo.pausas_humanas[0]?.payload_minimo.length ?? 0;
  const cifrasActividad: TextoBilingue[] = [
    CIFRAS_ACTIVIDAD.casos({ n: con("enrutador").length, de: n }),
    CIFRAS_ACTIVIDAD.urgenciasExentos({ u: cE.urgencias, e: cE.exentos }),
    CIFRAS_ACTIVIDAD.casos({ n: con("extractor").length }),
    CIFRAS_ACTIVIDAD.preguntas({ casos: acl.length, preguntas: cE.preguntas }),
    CIFRAS_ACTIVIDAD.sinModelo(con("verificador_cobertura").length),
    CIFRAS_ACTIVIDAD.aPersona({
      n: trazas.filter((t) => senal(t, "pausa_humana") === true).length,
      de: n,
    }),
    CIFRAS_ACTIVIDAD.documentos(cE.negaciones),
  ];
  const corrioActividad = [
    con("enrutador").length > 0,
    cE.urgencias + cE.exentos > 0,
    con("extractor").length > 0,
    acl.length > 0,
    con("verificador_cobertura").length > 0,
    con("decision").length > 0 && pausas.length > 0,
    cE.negaciones > 0 && con("guardia_salida").length > 0,
  ];
  const latencias = trazas.map((t) => Number(senal(t, "latencia_total_s")));
  const tokens = trazas.map((t) => Number(senal(t, "tokens")));
  const costos = trazas.map((t) =>
    t.pasos.reduce((a, p) => a + p.costo_nominal_usd, 0),
  );
  const costoTotal = costos.reduce((a, b) => a + b, 0);
  const masLargo = trazas[tokens.indexOf(Math.max(...tokens))]!;
  const coinciden = trazas.filter((t) => {
    const v = casoDe.get(t.caso_id)!.verdad_conocida;
    return (
      decisionFinal(t) === v.decision &&
      senal(t, "pausa_humana") === v.debe_escalar
    );
  }).length;
  const promedio = latencias.reduce((a, b) => a + b, 0) / n;
  const c7 = criterio("C7") as
    { objetivo?: number; estado: string } | undefined;
  const aPersona = trazas.filter(
    (t) => senal(t, "pausa_humana") === true,
  ).length;
  const adversarios = cargas.length
    ? cargas
    : d.lote.casos
        .filter((c) => c.tipo === "adversario")
        .map((c) => c.id)
        .slice(0, 1);

  const ficha: VistaAgente["ficha"] = {
    objetivo: X(FICHA.objetivo.texto, i),
    recibe: [
      {
        titulo: X(FICHA.recibe.texto.titulo, i),
        detalle: X(FICHA.recibe.texto.detalle(n), i),
        corrio: true,
      },
      {
        titulo: X(FICHA.recibe.orden.titulo, i),
        detalle: contradicen.length
          ? X(FICHA.recibe.orden.detalle(enumerar(contradicen, i)), i)
          : X(FICHA.recibe.orden.sinContradiccion, i),
        corrio: true,
      },
      {
        titulo: X(FICHA.recibe.afiliado.titulo, i),
        detalle: X(FICHA.recibe.afiliado.detalle, i),
        corrio: true,
      },
      {
        titulo: X(FICHA.recibe.plan.titulo, i),
        detalle: X(
          FICHA.recibe.plan.detalle({
            total: pb.length,
            exentos: pb.filter((p) => p.estado === "exento").length,
            excluidos: pb.filter((p) => p.estado === "excluido").length,
          }),
          i,
        ),
        corrio: true,
      },
    ],
    hace: {
      sub: X(FICHA.hace.sub(ACTIVIDADES.length), i),
      items: ACTIVIDADES.map((a, k) => ({
        n: k + 1,
        titulo: X(a.titulo, i),
        detalle: X(cifrasActividad[k]!, i),
        nodos: [...a.nodos],
        flecha: a.flecha === true,
        corrio: corrioActividad[k],
      })),
    },
    entrega: [
      {
        titulo: X(FICHA.entrega.aprobacion.titulo, i),
        detalle: X(
          FICHA.entrega.aprobacion.detalle({ n: aprobadas, de: n }),
          i,
        ),
        corrio: aprobadas > 0,
      },
      {
        titulo: X(FICHA.entrega.escalamiento.titulo, i),
        detalle: X(
          FICHA.entrega.escalamiento.detalle({
            campos,
            pausas: pausas.length,
            aprobo: cE.aprobo,
            nego: cE.nego,
          }),
          i,
        ),
        corrio: pausas.length > 0,
      },
      {
        titulo: X(FICHA.entrega.negacion.titulo, i),
        detalle: X(FICHA.entrega.negacion.detalle({ n: negadas, de: n }), i),
        corrio: negadas > 0,
      },
      {
        titulo: X(FICHA.entrega.traza.titulo, i),
        detalle: X(FICHA.entrega.traza.detalle(n), i),
        corrio: true,
      },
    ],
    leyenda: X(FICHA.leyenda({ n: ACTIVIDADES.length, casos: n, sprint }), i),
    puede: [
      CIFRAS_PUEDE.lee({
        casos: con("extractor").length,
        reintentos: cifrasDe.extractor!.reintentos,
      }),
      CIFRAS_PUEDE.pregunta({ preguntas: cE.preguntas, casos: acl.length }),
      CIFRAS_PUEDE.cobertura(con("verificador_cobertura").length),
      CIFRAS_PUEDE.pausas(pausas.length),
      CIFRAS_PUEDE.inyeccion(enumerar(adversarios, i)),
    ].map((c, k) => ({
      titulo: X(PUEDE[k]!.titulo, i),
      detalle: X(c, i),
      corrio: true,
    })),
    nunca: {
      items: FICHA.nunca.items.map((x) => ({
        titulo: X(x.titulo, i),
        detalle: X(x.refs, i),
      })),
      nota: X(
        FICHA.nunca.nota({
          corrida,
          criterios: enumerar(["C1", "C2", "C4", "C6"].filter(cumple), i),
          rotas: ["C1", "C2", "C4", "C6"].filter((c) => !cumple(c)).length,
        }),
        i,
      ),
    },
    participan: d.plan.actores.map((a) => ({
      id: a.id,
      titulo: a[i],
      detalle: X(FICHA.participan.papel[a.id] ?? { es: "", en: "" }, i),
    })),
    capacidad: [
      {
        cifra: decimal(mediana(latencias) ?? 0, 1, i),
        unidad: "s",
        texto: X(FICHA.capacidad.porCaso, i),
        detalle: `${X(FICHA.capacidad.rango({ min: decimal(Math.min(...latencias), 1, i), max: decimal(Math.max(...latencias), 1, i) }), i)} · ${X(
          FICHA.capacidad.latenciaC7({
            objetivo: String(c7?.objetivo ?? ""),
            cumple: c7?.estado === "cumple",
          }),
          i,
        )}`,
        barra:
          typeof c7?.objetivo === "number" && c7.objetivo > 0
            ? Math.min(1, (mediana(latencias) ?? 0) / c7.objetivo)
            : undefined,
      },
      {
        cifra: decimal(costoTotal / n, 3, i),
        unidad: "USD",
        texto: X(FICHA.capacidad.costoPorCaso, i),
        detalle: X(
          FICHA.capacidad.costoTotal({ total: decimal(costoTotal, 2, i), n }),
          i,
        ),
      },
      {
        cifra: entero(mediana(tokens) ?? 0, i),
        texto: X(FICHA.capacidad.tokens, i),
        detalle: X(
          FICHA.capacidad.tokensRango({
            min: entero(Math.min(...tokens), i),
            max: entero(Math.max(...tokens), i),
            aclaraciones: masLargo.aclaraciones.length,
          }),
          i,
        ),
      },
      {
        cifra: es ? `${aPersona} de ${n}` : `${aPersona} of ${n}`,
        texto: X(FICHA.capacidad.aPersona, i),
        detalle: X(
          FICHA.capacidad.minutos({
            min: aPersona * costoHumano,
            porCaso: costoHumano,
          }),
          i,
        ),
      },
      {
        cifra: es ? `${coinciden} de ${n}` : `${coinciden} of ${n}`,
        texto: X(FICHA.capacidad.caminos, i),
        detalle: X(FICHA.capacidad.caminosDetalle, i),
      },
      {
        cifra: `≈ ${Math.round((promedio * 200) / 60)} min`,
        texto: X(FICHA.capacidad.lote, i),
        detalle: X(
          FICHA.capacidad.loteDetalle({
            promedio: decimal(promedio, 1, i),
            usd: decimal((costoTotal / n) * 200, 1, i),
          }),
          i,
        ),
        estimacion: true,
      },
    ],
    fuente: X(
      FICHA.fuente({
        plan: corrida,
        corrida: d.corrida.manifiesto.corrida_id,
        sprint,
        fecha,
        n,
        modelo,
      }),
      i,
    ),
    chip: es ? `real · corrida ${corrida}` : `real · run ${corrida}`,
    marca,
  };

  // ── experto ─────────────────────────────────────────────────────────────────────────────────────
  const grafo = d.corrida.grafo;
  const aristasLg = grafo.langgraph.edges as unknown as Array<{
    conditional?: boolean;
  }>;
  const rf = (
    informe.contrato_de_grafo as {
      rf_09_2: Array<{ visitas: number; discrepancias: number }>;
    }
  ).rf_09_2;
  const decisionesRf = rf.reduce((a, r) => a + r.visitas, 0);
  const diferenciasRf = rf.reduce((a, r) => a + r.discrepancias, 0);
  const claves = [...d.codigo.estado.codigo.matchAll(/^ {4}(\w+):/gm)].map(
    (m) => m[1]!,
  );
  const senalesPlan = new Set(
    d.plan.contrato_de_grafo.senales_obligatorias_en_traza,
  );
  const s3 = informe.supuestos.find((s) => s.id === "S3");
  const pausaPlan = d.plan.contrato_de_grafo.pausas_humanas[0];
  const ent = d.entorno;
  const pq = ent.paquetes as Record<string, string>;
  const conModelo = d.plan.contrato_de_grafo.nodos_esperados.filter(
    (x) => x.tipo === "modelo",
  ).length;
  const lienzoVista = lienzo(
    {
      grafo: grafoParaMapa(grafo),
      contrato: d.plan.contrato_de_grafo,
      sujeto: { id: d.id, nombre: demo },
      version: d.corrida.manifiesto.plan.version,
      fecha,
      modelo,
    },
    `${grafo.huella}:${d.plan.huella}`,
    i,
    {
      ns: "agente",
      titulo: GRAFO.svgTitulo({
        demo,
        sprint,
        corrida,
        nodos: d.plan.contrato_de_grafo.nodos_esperados.length,
        reglas: d.plan.contrato_de_grafo.aristas_condicionales.length,
      }),
      descripcion: GRAFO.svgDescripcion,
      lineasSeleccionables: [
        `l-${idDeMapa("decision")}-a-${idDeMapa("pausa_humana")}`,
      ],
    },
  );
  const comp = lienzoVista.comparacion;
  const experto: VistaAgente["experto"] = {
    grupos: [
      {
        rotulo: X(EXPERTO.arquitectura.rotulo, i),
        filas: [
          {
            k: X(EXPERTO.arquitectura.patron[0]!, i),
            v: X(EXPERTO.arquitectura.patron[1]!, i),
          },
          {
            k: X(EXPERTO.arquitectura.decision[0]!, i),
            v: X(EXPERTO.arquitectura.decision[1]!, i),
          },
          {
            k: X(EXPERTO.arquitectura.lineaBase, i),
            v: X(
              EXPERTO.arquitectura.lineaBaseTexto(s3?.estado === "refutado"),
              i,
            ),
          },
          {
            k: X(EXPERTO.arquitectura.orquestacion[0]!, i),
            v: X(EXPERTO.arquitectura.orquestacion[1]!, i),
          },
        ],
      },
      {
        rotulo: X(EXPERTO.grafo.rotulo, i),
        filas: [
          {
            k: X(EXPERTO.grafo.contrato, i),
            v: X(
              EXPERTO.grafo.contratoTexto({
                nodos: d.plan.contrato_de_grafo.nodos_esperados.length,
                reglas: d.plan.contrato_de_grafo.aristas_condicionales.length,
                pausas: d.plan.contrato_de_grafo.pausas_humanas.length,
                rol: pausaPlan?.rol ?? "",
                campos,
              }),
              i,
            ),
          },
          {
            k: X(EXPERTO.grafo.sprint(sprint), i),
            v: X(
              EXPERTO.grafo.sprintTexto({
                nodos: grafo.nodos.length,
                aristas: aristasLg.length,
                condicionales: aristasLg.filter((a) => a.conditional).length,
              }),
              i,
            ),
          },
          {
            k: X(EXPERTO.grafo.coincide, i),
            v: X(
              EXPERTO.grafo.coincideTexto({
                n: comp.nodos.coinciden,
                de: comp.nodos.contrato,
                r: comp.reglas.dibujadas,
                rde: comp.reglas.contrato,
                fuera: comp.nodos.fueraDelContrato.length,
              }),
              i,
            ),
          },
          {
            k: X(EXPERTO.grafo.huella, i),
            v: `\`${grafo.huella.slice(0, 16)}…\``,
          },
        ],
      },
      {
        rotulo: X(EXPERTO.modelo.rotulo, i),
        filas: [
          {
            k: X(EXPERTO.modelo.adaptador, i),
            v: "`ChatClaudeCode(BaseChatModel)` → `claude -p`",
          },
          {
            k: X(EXPERTO.modelo.modelo, i),
            v: X(
              EXPERTO.modelo.modeloTexto({ alias: modelo, n: conModelo }),
              i,
            ),
          },
          {
            k: X(EXPERTO.modelo.regimen[0]!, i),
            v: X(EXPERTO.modelo.regimen[1]!, i),
          },
          {
            k: X(EXPERTO.modelo.aislamiento[0]!, i),
            v: X(EXPERTO.modelo.aislamiento[1]!, i),
          },
        ],
      },
      {
        rotulo: X(EXPERTO.versiones.rotulo, i),
        filas: [
          {
            k: "LangGraph · LangChain",
            v: `${pq.langgraph} · ${pq.langchain}${pq["langchain-core"] ? ` (core ${pq["langchain-core"]})` : ""}`,
          },
          {
            k: "LangSmith SDK · Pydantic",
            v: `${pq.langsmith ?? "—"} · ${pq.pydantic ?? "—"}`,
          },
          {
            k: "Claude Code",
            v: ent.claude_cli.replace(/\s*\(Claude Code\)$/, ""),
          },
          { k: "Python", v: ent.python },
        ],
      },
      {
        rotulo: X(EXPERTO.estado.rotulo, i),
        filas: [
          {
            k: X(EXPERTO.estado.tipo, i),
            v: X(
              EXPERTO.estado.tipoTexto({
                senales: claves.filter((c) => senalesPlan.has(c)).length,
                trabajo: claves.filter((c) => !senalesPlan.has(c)).length,
              }),
              i,
            ),
          },
          {
            k: X(EXPERTO.estado.trabajo, i),
            v: "",
            codigos: claves.filter((c) => !senalesPlan.has(c)),
          },
          { k: X(EXPERTO.estado.senales, i), v: "", codigos: [...senalesPlan] },
        ],
      },
      {
        rotulo: X(EXPERTO.persistencia.rotulo, i),
        filas: [
          EXPERTO.persistencia.checkpointer,
          EXPERTO.persistencia.hilo,
          EXPERTO.persistencia.trazas,
        ].map(([k, v]) => ({ k: X(k!, i), v: X(v!, i) })),
      },
      {
        rotulo: X(EXPERTO.evaluacion.rotulo, i),
        filas: [
          {
            k: X(EXPERTO.evaluacion.verificador, i),
            v: X(
              EXPERTO.evaluacion.verificadorTexto({
                criterios: informe.criterios.length,
                riesgos: informe.riesgos.length,
                supuestos: informe.supuestos.length,
              }),
              i,
            ),
          },
          {
            k: X(EXPERTO.evaluacion.cruzada, i),
            v: X(
              EXPERTO.evaluacion.cruzadaTexto({
                decisiones: decisionesRf,
                diferencias: diferenciasRf,
              }),
              i,
            ),
          },
          {
            k: X(EXPERTO.evaluacion.lotes, i),
            v: X(
              EXPERTO.evaluacion.lotesTexto({
                casos: n,
                repeticiones: 1 + d.manifiesto.repeticiones.length,
                base: d.manifiesto.linea_base !== null,
              }),
              i,
            ),
          },
          {
            k: X(EXPERTO.evaluacion.plan, i),
            v: X(
              EXPERTO.evaluacion.planTexto({
                d: d.plan.decisiones.length,
                r: d.plan.riesgos.length,
                s: d.plan.supuestos.length,
                c: d.plan.criterios_aceptacion.length,
                u: d.plan.umbrales.length,
              }),
              i,
            ),
          },
        ],
      },
    ],
    matriz: {
      columnas: EXPERTO.matriz.columnas.map((c) => X(c, i)),
      filas: d.plan.contrato_de_grafo.nodos_esperados.map((x) => {
        const p = PLAN_POR_NODO[x.id] ?? {
          decisiones: [],
          riesgos: [],
          supuestos: [],
          criterios: [],
          umbrales: [],
        };
        const lista = (l: string[]) => (l.length ? l.join(" · ") : "—");
        const umbrales = [
          ...p.umbrales,
          ...(p.senal ?? []).map((u) => `${u} (${X(EXPERTO.matriz.senal, i)})`),
        ];
        return {
          nodo: x.id,
          tipo: x.tipo,
          celdas: [
            lista(p.decisiones),
            lista(p.riesgos),
            lista(p.supuestos),
            lista(p.criterios),
            lista(umbrales),
            es ? `${con(x.id).length} de ${n}` : `${con(x.id).length} of ${n}`,
          ],
          corrio: con(x.id).length > 0,
        };
      }),
      nota: X(EXPERTO.matriz.nota(n), i),
      fuente: X(EXPERTO.matriz.fuente(versionCorta(d.plan.version)), i),
    },
    estado: {
      titulo: X(EXPERTO.codigoEstado, i),
      archivo: d.codigo.estado.archivo,
      desde: d.codigo.estado.desde,
      lineas: X(
        PANEL.codigo_.lineas({
          desde: d.codigo.estado.desde,
          hasta: d.codigo.estado.hasta,
        }),
        i,
      ),
      codigo: d.codigo.estado.codigo,
    },
  };

  // ── lo que corrió frente a su plan ──────────────────────────────────────────────────────────────
  const contrato: VistaAgente["contrato"] = {
    cifras: [
      {
        cifra: es
          ? `${comp.nodos.coinciden} de ${comp.nodos.contrato}`
          : `${comp.nodos.coinciden} of ${comp.nodos.contrato}`,
        texto: X(CONTRATO_CIFRAS.nodos, i),
        detalle: X(
          CONTRATO_CIFRAS.nodosDetalle({
            faltan: comp.nodos.exigidosAusentes.length,
            sobran: comp.nodos.fueraDelContrato.length,
          }),
          i,
        ),
      },
      {
        cifra: es
          ? `${comp.reglas.dibujadas} de ${comp.reglas.contrato}`
          : `${comp.reglas.dibujadas} of ${comp.reglas.contrato}`,
        texto: X(CONTRATO_CIFRAS.reglas, i),
        detalle: X(CONTRATO_CIFRAS.reglasDetalle, i),
      },
      {
        cifra: `${decisionesRf} · ${diferenciasRf}`,
        texto: X(CONTRATO_CIFRAS.cruzada, i),
        detalle: X(CONTRATO_CIFRAS.cruzadaDetalle, i),
      },
    ],
    fuente: X(
      CONTRATO_CIFRAS.fuente({
        plan: versionCorta(d.plan.version),
        corrida,
        huella: `${grafo.huella.slice(0, 12)}…`,
      }),
      i,
    ),
    chip: X(CONTRATO_CIFRAS.chip, i),
  };

  // ── paneles por nodo ────────────────────────────────────────────────────────────────────────────
  const capas = GRAMATICA.bandas
    .filter((b) => b.clase === "capa")
    .sort((a, b) => a.orden - b.orden);
  const banda = (tipo: string) =>
    capas.findIndex((b) => b.id === BANDA_DE_TIPO[idDeMapa(tipo)]);
  const bandaDe = (tipo: string): TextoBilingue =>
    capas[banda(tipo)]?.nombre ?? { es: tipo, en: tipo };
  const refPlan = (id: string): RefPlan | null => {
    const p = d.plan;
    const dd = p.decisiones.find((x) => x.id === id);
    if (dd)
      return {
        id,
        texto: X(dd.pregunta, i),
        etiqueta: {
          texto: X(REVERSIBILIDAD[dd.reversibilidad]!, i),
          unaVia: dd.reversibilidad === "una_via",
        },
      };
    const r = p.riesgos.find((x) => x.id === id);
    if (r) {
      const ri = informe.riesgos.find((x) => x.id === id) as
        | RiesgoDelInforme
        | undefined;
      const legal = controlLegal(ri, i);
      return {
        id,
        texto: X(r.modo, i),
        ap: prioridad(ri, i),
        factores: `S${r.severidad} · O${r.ocurrencia} · D${r.deteccion} · RPN ${ri?.rpn ?? r.severidad * r.ocurrencia * r.deteccion}${legal ? ` · ${legal}` : ""}`,
        estado: estadoDeRiesgo(ri?.estado, i),
      };
    }
    const s = p.supuestos.find((x) => x.id === id);
    if (s)
      return {
        id,
        texto: X(s.enunciado, i),
        estado: estadoDeSupuesto(
          informe.supuestos.find((x) => x.id === id)?.estado,
          i,
        ),
      };
    const c = p.criterios_aceptacion.find((x) => x.id === id);
    if (c)
      return {
        id,
        texto: X(c.enunciado, i),
        estado: estadoDeCriterio(criterio(id)?.estado, i),
      };
    const u = p.umbrales.find((x) => x.id === id);
    if (u)
      return {
        id,
        texto: `${X(u.nombre, i)} · ${valorDeUmbral(u.valor_en_plan, i)}`,
        factores: `${u.senal} · ${u.operador}${u.inclusivo ? ` · ${X(INCLUSIVO, i)}` : ""}`,
      };
    return null;
  };
  const politicas = [
    ...new Set(
      trazas.flatMap((t) =>
        t.pausas_humanas.map((p) => p.respuesta_simulada.politica),
      ),
    ),
  ];
  const acciones = [
    ...new Set(
      trazas.flatMap((t) => t.guardia_salida?.acciones_ejecutadas ?? []),
    ),
  ];
  const conValores = (v: string) =>
    v
      .replaceAll("{modelo}", modelo)
      .replaceAll("{politica}", politicas.join(", ") || "—")
      .replaceAll("{acciones}", acciones.map((a) => `\`${a}\``).join(", "));
  /** El grupo propio del nodo (por qué no usa modelo, su configuración, sus reglas o qué revisa). */
  const grupoModelo = (nodo: string): Grupo => {
    const m = NODOS[nodo]!.modelo;
    if (m.reglasDelPlan) {
      const reglas = d.plan.contrato_de_grafo.aristas_condicionales
        .filter((a) => a.desde === nodo)
        .sort((a, b) => a.orden - b.orden);
      return {
        rotulo: X(m.rotulo, i).replace("{n}", String(reglas.length)),
        filas: reglas.map((a) => ({
          k: String(a.orden),
          v: esAristaTripleta(a)
            ? `\`${a.senal} · ${a.operador} · ${String(a.valor)}\``
            : `\`${a.funcion.nombre}(${a.funcion.entradas.join(", ")})\``,
        })),
      };
    }
    return {
      rotulo: X(m.rotulo, i),
      filas: m.filas.map(([k, v]) => ({ k: X(k, i), v: conValores(X(v, i)) })),
    };
  };
  const reglasDelPlan = (nodo: string) =>
    d.plan.contrato_de_grafo.aristas_condicionales
      .filter((a) => a.desde === nodo)
      .sort((a, b) => a.orden - b.orden)
      .map((a) =>
        esAristaTripleta(a)
          ? `\`${a.senal} · ${a.operador} · ${String(a.valor).replace(/^umbral\./, "")}\` → \`${a.si_verdadero}\``
          : `\`${a.funcion.nombre}(${a.funcion.entradas.join(", ")})\` → \`${a.si_verdadero}\``,
      );
  const aristas = grafo.langgraph.edges as unknown as Array<{
    source: string;
    target: string;
    conditional?: boolean;
  }>;
  const nombreDe = (id: string) =>
    id === "__start__"
      ? X(PANEL.experto_.inicio, i)
      : id === "__end__"
        ? X(PANEL.experto_.fin, i)
        : id;
  const pausasNodos = new Set(grafo.pausas_humanas.map((p) => p.nodo));
  const modo = (a: { source: string; conditional?: boolean }) =>
    a.conditional
      ? es
        ? "condicional"
        : "conditional"
      : pausasNodos.has(a.source)
        ? es
          ? "reanudación"
          : "resume"
        : es
          ? "secuencia"
          : "sequence";
  const tiempoSalidaCosto = (t: Traza, nodo: string) => {
    const ps = t.pasos.filter((p) => p.nodo === nodo);
    const s = ps.reduce((a, p) => a + p.duracion_ms, 0) / 1000;
    const salida = ps.reduce((a, p) => a + p.tokens.salida, 0);
    const usd = ps.reduce((a, p) => a + p.costo_nominal_usd, 0);
    return `${decimal(s, 1, i)} s · ${entero(salida, i)} ${X(UNIDADES.deSalida, i)} · ${decimal(usd, 4, i)} USD`;
  };
  const siNo = (b: boolean) => X(b ? PANEL.trazas_.si : PANEL.trazas_.no, i);
  const valor = (v: unknown) =>
    typeof v === "string" && VALORES[v] ? X(VALORES[v]!, i) : String(v ?? "—");
  const filaTraza = (t: Traza, nodo: string): FilaTraza => {
    const caso = casoDe.get(t.caso_id)!;
    const vs = visitas(t, nodo);
    const ultima = vs[vs.length - 1];
    const reglaTexto = (v?: {
      regla?: { senal: string | null; funcion: string | null };
    }) =>
      v?.regla
        ? (v.regla.senal ?? v.regla.funcion ?? "")
        : X(PANEL.trazas_.porDefecto, i);
    const cob = cobertura(t);
    const ext = t.extraccion;
    const pausa = t.pausas_humanas[0];
    const motivoPausa = () => {
      if (!pausa) return "—";
      const m = pausa.payload.motivo as { desde?: string } | undefined;
      if (m?.desde === "aclaracion") return X(MOTIVO_PAUSA.tope!, i);
      const v = visitas(t, "decision").find((x) => x.rama === "pausa_humana");
      return v?.regla ? X(MOTIVO_PAUSA[categoria(v.regla)]!, i) : "—";
    };
    let celdas: string[] = [];
    let pares: Array<{ k: string; v: string }> = [];
    const et = TRAZAS_DE_NODO[nodo]!.detalle.map((x) => X(x, i));
    switch (nodo) {
      case "enrutador":
        celdas = [
          valor(senal(t, "tipo_atencion")),
          siNo(senal(t, "servicio_exento") === true),
          ultima?.rama ?? "—",
        ];
        pares = [
          {
            k: et[0]!,
            v: ultima?.regla
              ? reglaTexto(ultima)
              : X(PANEL.trazas_.porDefecto, i),
          },
        ];
        break;
      case "extractor":
        celdas = [
          ext ? decimal(ext.confianza, 2, i) : "—",
          String(ext?.campos_faltantes.length ?? 0),
          tiempoSalidaCosto(t, nodo),
        ];
        pares = [
          {
            k: et[0]!,
            v: String(t.pasos.filter((p) => p.nodo === nodo).length),
          },
          { k: et[1]!, v: vs.map((v) => v.rama).join(" → ") },
          {
            k: et[2]!,
            v: String(
              t.pasos
                .filter((p) => p.nodo === nodo)
                .reduce((a, p) => a + p.reintentos_esquema, 0),
            ),
          },
        ];
        break;
      case "aclaracion":
        celdas = [
          String(t.aclaraciones.length),
          ultima?.rama ?? "—",
          tiempoSalidaCosto(t, nodo),
        ];
        pares = [
          {
            k: et[0]!,
            v: String(t.pasos.filter((p) => p.nodo === nodo).length),
          },
          { k: et[1]!, v: valor(decisionFinal(t)) },
        ];
        break;
      case "verificador_cobertura":
        celdas = [
          `${valor(cob.estado_servicio)}${cob.causal ? ` · ${X(VALORES.causal!, i)} ${String(cob.causal)}` : ""}`,
          valor(cob.propuesta),
          (Array.isArray(cob.reglas_disparadas)
            ? (cob.reglas_disparadas as unknown[]).map(String)
            : []
          ).join(", ") || "—",
        ];
        pares = [
          {
            k: et[0]!,
            v: `${String(cob.codigo_extraido ?? "—")} · ${String(cob.codigo_orden ?? "—")}`,
          },
        ];
        break;
      case "decision":
        celdas = [
          ultima?.regla ? reglaTexto(ultima) : X(PANEL.trazas_.ninguna, i),
          valor(senal(t, "propuesta")),
          ultima?.rama ?? "—",
        ];
        pares = [
          {
            k: et[0]!,
            v: `${ext ? decimal(ext.confianza, 2, i) : "—"} · ${String(senal(t, "costo_estimado") ?? "—")}`,
          },
          { k: et[1]!, v: valor(decisionFinal(t)) },
        ];
        break;
      case "pausa_humana":
        celdas = [
          motivoPausa(),
          valor(pausa?.respuesta_simulada.decision),
          valor(decisionFinal(t)),
        ];
        pares = [{ k: et[0]!, v: String(pausa?.payload.senal ?? "—") }];
        break;
      case "redactor":
        celdas = [
          valor(decisionFinal(t)),
          siNo(t.documento_adverso !== null),
          tiempoSalidaCosto(t, nodo),
        ];
        pares = [{ k: et[0]!, v: siNo(senal(t, "pausa_humana") === true) }];
        break;
      case "guardia_salida": {
        const g = t.guardia_salida;
        celdas = [
          g?.acciones_ejecutadas.join(", ") || "—",
          siNo(g?.carga_detectada_en_entrada === true),
          `${g?.hallazgos.length ?? 0} · ${g?.severidad_accion ?? 0}`,
        ];
        pares = [{ k: et[0]!, v: g?.acciones_intentadas.join(", ") || "—" }];
        break;
      }
    }
    const u1 = d.plan.umbrales.find((u) => u.id === "U1");
    return {
      id: t.caso_id,
      tipo: X(TIPO_DE_CASO[caso.tipo] ?? { es: caso.tipo, en: caso.tipo }, i),
      celdas,
      barra:
        nodo === "extractor" && ext && typeof u1?.valor_en_plan === "number"
          ? { valor: ext.confianza, umbral: u1.valor_en_plan }
          : undefined,
      solicitud: caso.entrada.texto_medico[i],
      pares,
      enlace: ruta(i, "caso", t.caso_id),
    };
  };

  const primeros = (ids: string[]): TextoBilingue => ({
    es: enumerar(ids.slice(0, 2), "es"),
    en: enumerar(ids.slice(0, 2), "en"),
  });
  const adversario = (detalle: string) =>
    d.lote.casos.find((c) => c.adversario_detalle === detalle)?.id ?? "—";
  const notaTrazas = (nodo: string): string => {
    const N = NOTA_TRAZAS;
    switch (nodo) {
      case "extractor": {
        const u1 = d.plan.umbrales.find((u) => u.id === "U1");
        return X(N.extractor(valorDeUmbral(u1?.valor_en_plan, i)), i);
      }
      case "aclaracion": {
        const mas = [...acl].sort(
          (a, b) =>
            b.aclaraciones.length - a.aclaraciones.length ||
            (a.caso_id < b.caso_id ? -1 : 1),
        )[0];
        return X(N.aclaracion(mas?.caso_id ?? "—"), i);
      }
      case "pausa_humana":
        return X(
          N.pausa_humana(
            primeros(pausas.map(({ t }) => t.caso_id).sort()),
          ),
          i,
        );
      case "redactor":
        return X(
          N.redactor(
            primeros(
              trazas
                .filter((t) => t.documento_adverso !== null)
                .map((t) => t.caso_id)
                .sort(),
            ),
          ),
          i,
        );
      case "guardia_salida":
        return X(
          N.guardia_salida({
            inyeccion: adversario("inyeccion"),
            dato: adversario("dato_sensible"),
            sinEfecto: cifrasDe.guardia_salida!.severidadMax === 0 && cumple("C6"),
          }),
          i,
        );
      case "enrutador":
      case "verificador_cobertura":
      case "decision":
        return X(N[nodo], i);
      default:
        return "";
    }
  };

  const paneles: PanelNodo[] = d.plan.contrato_de_grafo.nodos_esperados.map(
    (x) => {
      const t = NODOS[x.id]!;
      const c = cifrasDe[x.id]!;
      const tipo = lienzoVista.lista
        .flatMap((l) => l.nodos)
        .find((nn) => nn.id === idDeMapa(x.id));
      const entran = aristas.filter((a) => a.target === x.id);
      const salen = [
        ...new Set(
          aristas
            .filter((a) => a.source === x.id)
            .map((a) => nombreDe(a.target)),
        ),
      ];
      const ps = pasosDe(x.id);
      const tok = ps.reduce(
        (a, p) => a + p.tokens.entrada + p.tokens.salida,
        0,
      );
      const usd = ps.reduce((a, p) => a + p.costo_nominal_usd, 0);
      const grupos = new Map<string, number>();
      for (const tr of con(x.id))
        for (const v of visitas(tr, x.id)) {
          const k = v.regla
            ? `${v.regla.senal ?? v.regla.funcion} → ${v.rama}`
            : `→ ${v.rama}`;
          grupos.set(k, (grupos.get(k) ?? 0) + 1);
        }
      const caminos = grupos.size
        ? [...grupos.entries()].map(([k, m]) => `${m} ${k}`).join(" · ")
        : salen.map((s) => `${c.casos} → ${s}`).join(" · ");
      const plan = PLAN_POR_NODO[x.id] ?? {
        decisiones: [],
        riesgos: [],
        supuestos: [],
        criterios: [],
        umbrales: [],
      };
      const refs = [
        ...plan.decisiones,
        ...plan.riesgos,
        ...plan.supuestos,
        ...plan.criterios,
        ...plan.umbrales,
      ]
        .map(refPlan)
        .filter((r): r is RefPlan => r !== null);
      const bloques: BloqueCodigo[] = [
        {
          titulo: X(PANEL.codigo_.nodo, i),
          archivo: d.codigo.nodos[x.id]!.archivo,
          desde: d.codigo.nodos[x.id]!.desde,
          lineas: X(
            PANEL.codigo_.lineas({
              desde: d.codigo.nodos[x.id]!.desde,
              hasta: d.codigo.nodos[x.id]!.hasta,
            }),
            i,
          ),
          codigo: d.codigo.nodos[x.id]!.codigo,
        },
      ];
      if (x.id === "decision")
        bloques.push({
          titulo: X(PANEL.codigo_.ruta, i),
          archivo: d.codigo.ruta.archivo,
          desde: d.codigo.ruta.desde,
          lineas: X(
            PANEL.codigo_.lineas({
              desde: d.codigo.ruta.desde,
              hasta: d.codigo.ruta.hasta,
            }),
            i,
          ),
          codigo: d.codigo.ruta.codigo,
        });
      const reglas = reglasDelPlan(x.id);
      const defecto = grafo.ramas_por_defecto[x.id];
      const campos: Campo[] = [
        {
          clave: "paraQue",
          rotulo: X(PANEL.campos.paraQue, i),
          texto: X(t.paraQue, i),
        },
        { clave: "como", rotulo: X(PANEL.campos.como, i), texto: X(t.como, i) },
      ];
      if (t.decide)
        campos.push({
          clave: "decide",
          rotulo: X(PANEL.campos.decide, i),
          texto: X(t.decide, i),
        });
      if (t.extra?.falta)
        campos.push({
          clave: "falta",
          rotulo: X(t.extra.rotulo, i),
          texto: X(t.extra.texto, i),
        });
      campos.push(
        {
          clave: "siFalla",
          rotulo: X(PANEL.campos.siFalla, i),
          texto: X(t.siFalla, i),
        },
        {
          clave: "seMide",
          rotulo: X(PANEL.campos.seMide, i),
          texto: X(t.seMide, i),
        },
        {
          clave: "enLaCorrida",
          rotulo: X(PANEL.campos.enLaCorrida(n), i),
          texto: X(t.enLaCorrida(c), i),
        },
      );
      if (t.extra && !t.extra.falta)
        campos.push({
          clave: "garantia",
          rotulo: X(t.extra.rotulo, i),
          texto: X(t.extra.texto, i),
        });
      if (x.id === "extractor" && c.s1.sinProbar)
        campos.push({
          clave: "falta",
          rotulo: X(EXTRACTOR_S1.rotulo, i),
          texto: X(EXTRACTOR_S1.texto({ medidos: c.s1.medidos }), i),
        });
      const columnas = TRAZAS_DE_NODO[x.id]!.columnas.map((col) => X(col, i));
      return {
        id: idDeMapa(x.id),
        nombre: x.id,
        tipo: idDeMapa(x.tipo),
        codigo: tipo?.codigo ?? "",
        rol: X(t.rol, i),
        chip: es ? `real · corrida ${corrida}` : `real · run ${corrida}`,
        lider: {
          recibe: { titulo: X(t.recibe.titulo, i), sub: X(t.recibe.sub, i) },
          entrega: { titulo: X(t.entrega.titulo, i), sub: X(t.entrega.sub, i) },
          campos,
        },
        experto: {
          contrato: {
            rotulo: X(PANEL.experto_.contrato, i),
            filas: [
              {
                k: X(PANEL.experto_.nodo, i),
                v: `\`${x.id}\` · ${x.tipo} · ${X(
                  PANEL.experto_.capa({
                    n: String(banda(x.tipo) + 1).padStart(2, "0"),
                    banda: bandaDe(x.tipo),
                  }),
                  i,
                )}`,
              },
              { k: X(PANEL.experto_.lee, i), v: X(t.lee, i) },
              {
                k: X(PANEL.experto_.escribe, i),
                v: "",
                codigos: d.codigo.nodos[x.id]!.escribe,
              },
              {
                k: X(PANEL.experto_.entraDesde, i),
                v: [
                  ...new Set(
                    entran.map((a) => `${nombreDe(a.source)} · ${modo(a)}`),
                  ),
                ].join(", "),
              },
              {
                k: X(PANEL.experto_.saleHacia, i),
                v: salen
                  .map((s) => (aristas.some((a) => a.target === s) ? `\`${s}\`` : s))
                  .join(" · "),
              },
              {
                k: X(PANEL.experto_.reglas, i),
                v: reglas.length
                  ? `${reglas.join(" · ")}${defecto ? ` · ${X(GRAFO.lista_.siNo, i)} → \`${defecto}\`` : ""}`
                  : X(PANEL.experto_.sinReglas, i),
              },
            ],
          },
          modelo: grupoModelo(x.id),
          plan: refs,
          observado: {
            rotulo: X(PANEL.experto_.observado(corrida), i),
            filas: [
              {
                k: X(PANEL.experto_.casosVisitas, i),
                v: `${es ? `${c.casos} de ${n}` : `${c.casos} of ${n}`} · ${c.visitas}`,
              },
              {
                k: X(PANEL.experto_.modelo, i),
                v:
                  tok > 0
                    ? X(
                        PANEL.experto_.conModelo({
                          alias: modelo,
                          tokens: entero(tok, i),
                          usd: decimal(usd, 3, i),
                        }),
                        i,
                      )
                    : X(PANEL.experto_.sinModelo, i),
              },
              { k: X(PANEL.experto_.caminos, i), v: caminos },
            ],
          },
        },
        codigoBloques: bloques,
        codigoFuente: X(
          PANEL.codigo_.fuente({
            grafo: `${grafo.huella.slice(0, 12)}…`,
            corrida,
          }),
          i,
        ),
        trazas: {
          columnas,
          filas: con(x.id).map((tr) => filaTraza(tr, x.id)),
          visibles: 5,
          nota: notaTrazas(x.id),
        },
      };
    },
  );

  // ── arista U1 ───────────────────────────────────────────────────────────────────────────────────
  const u1 = d.plan.umbrales.find((u) => u.id === "U1")!;
  if (!("min" in u1.rango_jugable))
    throw new Error("vitrina: U1 no tiene rango numérico en el plan");
  const rangoU1 = u1.rango_jugable;
  const reglaU1 = d.plan.contrato_de_grafo.aristas_condicionales.find(
    (a) => esAristaTripleta(a) && a.valor === "umbral.U1",
  )!;
  const desdeU1 = reglaU1.desde;
  const deNodo = d.plan.contrato_de_grafo.aristas_condicionales.filter(
    (a) => a.desde === desdeU1,
  ).length;
  const puntos = con(desdeU1)
    .map((t) => {
      const v = Number(t.extraccion?.confianza ?? senal(t, "senal_confianza"));
      const decidioU1 = visitas(t, desdeU1).some(
        (x) => x.regla?.orden_arista === reglaU1.orden,
      );
      return { id: t.caso_id, valor: v, aPersona: decidioU1 };
    })
    .sort((a, b) => a.valor - b.valor || (a.id < b.id ? -1 : 1));
  const bajo = puntos.filter((p) => p.aPersona);
  const arista: PanelArista = {
    id: `l-${idDeMapa(desdeU1)}-a-${idDeMapa(reglaU1.si_verdadero)}`,
    titulo: X(ARISTA_U1.titulo({ umbral: "U1", nodo: desdeU1 }), i),
    rol: X(
      ARISTA_U1.rol({
        valor: decimal(u1.valor_en_plan as number, 2, i),
        min: u1.costo_humano_por_caso_min ?? 0,
      }),
      i,
    ),
    chip: es ? `real · corrida ${corrida}` : `real · run ${corrida}`,
    filas: [
      { k: X(ARISTA_U1.regla, i), v: `${u1.senal} · ${u1.operador} · U1` },
      {
        k: X(ARISTA_U1.valor, i),
        v: X(
          ARISTA_U1.valorTexto({
            valor: decimal(u1.valor_en_plan as number, 2, i),
            inclusivo: u1.inclusivo,
          }),
          i,
        ),
      },
      {
        k: X(ARISTA_U1.donde, i),
        v: X(
          ARISTA_U1.dondeTexto({
            nodo: desdeU1,
            orden: reglaU1.orden,
            de: deNodo,
          }),
          i,
        ),
      },
      {
        k: X(ARISTA_U1.rango, i),
        v: X(
          ARISTA_U1.rangoTexto({
            min: decimal(rangoU1.min, 2, i),
            max: decimal(rangoU1.max, 2, i),
            paso: decimal(rangoU1.paso, 2, i),
          }),
          i,
        ),
      },
      {
        k: X(ARISTA_U1.costo, i),
        v: X(ARISTA_U1.costoTexto(u1.costo_humano_por_caso_min ?? 0), i),
      },
      {
        k: X(ARISTA_U1.enLaCorrida, i),
        v: X(
          ARISTA_U1.enLaCorridaTexto({
            bajo: bajo.length,
            de: puntos.length,
            casos: enumerar(
              bajo.map(
                (p) =>
                  `${p.id}, ${X(ARISTA_U1.con, i)} ${decimal(p.valor, 2, i)}`,
              ),
              i,
            ),
          }),
          i,
        ),
      },
    ],
    playground: ruta(i, "playground"),
    puntos,
    umbral: u1.valor_en_plan as number,
    eje: { min: 0.5, max: 1 },
    nota: X(
      ARISTA_U1.distribucion({
        n: puntos.length,
        otros: n - puntos.length,
        nodo: desdeU1,
      }),
      i,
    ),
  };

  // ── el spike, frente al mismo contrato ───────────────────────────────────────────────────────────
  let spike: VistaSpike | null = null;
  if (d.spike) {
    const sp = d.spike;
    const contratoG = d.plan.contrato_de_grafo;
    const lz = lienzo(
      {
        grafo: sp.grafo,
        contrato: contratoG,
        sujeto: { id: `${d.id}-spike`, nombre: demo },
        version: `spike-${sp.fecha}`,
        fecha: sp.fecha,
        modelo: sp.lectura.modelo,
      },
      `spike:${d.manifiesto.spike!.grafo.sha256}:${d.plan.huella}`,
      i,
      {
        ns: "spike",
        titulo: SPIKE.svgTitulo,
        descripcion: SPIKE.svgDescripcion,
        seleccionables: false,
      },
    );
    const cs = lz.comparacion;
    const valorDe = (v: unknown) =>
      typeof v === "string" && v.startsWith("umbral.")
        ? d.plan.umbrales.find((u) => `umbral.${u.id}` === v)?.valor_en_plan
        : v;
    const iguales = sp.lectura.aristas_condicionales
      .filter(esAristaTripleta)
      .flatMap((a) =>
        contratoG.aristas_condicionales
          .filter(esAristaTripleta)
          .filter(
            (c) =>
              c.senal === a.senal &&
              c.operador === a.operador &&
              valorDe(c.valor) === valorDe(a.valor),
          )
          .map((c) => ({ spike: a, plan: c })),
      );
    const primera = iguales[0];
    spike = {
      chip: X(SPIKE.chip(sp.fecha), i),
      lectura: X(
        SPIKE.lectura({
          fecha: sp.fecha,
          presentes: cs.nodos.coinciden,
          total: cs.nodos.contrato,
          ausentes: cs.nodos.exigidosAusentes.length,
          fuera: cs.nodos.fueraDelContrato.length,
          sprint,
        }),
        i,
      ),
      cifras: [
        {
          cifra: es
            ? `${cs.nodos.coinciden} de ${cs.nodos.contrato}`
            : `${cs.nodos.coinciden} of ${cs.nodos.contrato}`,
          texto: X(SPIKE.nodos, i),
          detalle: X(
            SPIKE.faltaban(
              enumerar(
                contratoG.nodos_esperados
                  .map((x) => x.id)
                  .filter((x) => cs.nodos.exigidosAusentes.includes(idDeMapa(x))),
                i,
              ),
            ),
            i,
          ),
        },
        {
          cifra: es
            ? `${new Set(iguales.map((x) => x.plan)).size} de ${contratoG.aristas_condicionales.length}`
            : `${new Set(iguales.map((x) => x.plan)).size} of ${contratoG.aristas_condicionales.length}`,
          texto: X(SPIKE.reglas, i),
          detalle: primera
            ? X(
                SPIKE.reglasDetalle({
                  umbral: String(primera.plan.valor).replace(/^umbral\./, ""),
                  desde: primera.spike.desde,
                  enPlan: primera.plan.desde,
                }),
                i,
              )
            : "",
        },
        {
          cifra: String(cs.nodos.fueraDelContrato.length),
          texto: X(SPIKE.fuera, i),
          detalle: X(SPIKE.fueraDetalle, i),
        },
      ],
      lienzo: lz,
      region: X(SPIKE.region, i),
    };
  }

  return {
    portada: {
      antetitulo: X(PORTADA.antetitulo({ demo, corrida, sprint, fecha }), i),
      titulo: X(PORTADA.titulo, i),
      guia: X(PORTADA.guia, i),
    },
    ficha,
    experto,
    contrato,
    lienzo: lienzoVista,
    paneles,
    arista,
    spike,
    tipoDe: Object.fromEntries(
      d.plan.contrato_de_grafo.nodos_esperados.map((x) => [x.id, x.tipo]),
    ),
    pie: X(
      PIE_AGENTE({
        sprint,
        corrida: d.corrida.manifiesto.corrida_id,
        fecha,
        n,
        modelo,
      }),
      i,
    ),
  };
}
