/**
 * Vista de P3 Agente: arma lo que se pinta desde la corrida (sus trazas verificadas), el lote sintético, el plan y el
 * informe. Ninguna cifra se escribe a mano: todas se calculan aquí o en el perfil del demo (`agente-a.ts`,
 * `agente-b.ts`), que aporta su ficha, la frase «En los N casos» de cada nodo, sus tablas de trazas y la arista que
 * se puede tocar. Este esqueleto es común a los dos demos: el experto, el contrato, el lienzo, los paneles y el
 * spike. Pura: los mismos datos dan la misma vista en los dos idiomas (salvo el texto).
 */
import type { Idioma, TextoBilingue } from "@core/formatos/bilingue";
import type { Traza } from "@core/formatos/traza";
import { esAristaTripleta } from "@core/plan/esquema";
import { idDeMapa } from "@core/visor/ids";
import { BANDA_DE_TIPO } from "@core/visor/mapa";
import type { DatosDemo } from "@/lib/datos/vitrina";
import { ruta } from "@/lib/ruta";
import {
  ARISTA_U1,
  CONTRATO_CIFRAS,
  EXPERTO,
  GRAFO,
  MODO_ARISTA,
  PANEL,
  PIE_AGENTE,
  PORTADA,
  SPIKE,
} from "@/textos/agente";
import { CHIP_CORRIDA, FRACCION } from "@/textos/comun";
import { INCLUSIVO, REVERSIBILIDAD } from "@/textos/plan-comun";
import { perfilDemoA } from "./agente-a";
import { perfilDemoB } from "./agente-b";
import {
  contextoAgente,
  valorDeUmbral,
  visitas,
  type PerfilAgente,
} from "./agente-comun";
import { decimal, entero, enumerar, versionCorta } from "./formato";
import {
  VISIBLES,
  controlLegal,
  estadoDeCriterio,
  pausaDelPlan,
  estadoDeRiesgo,
  estadoDeSupuesto,
  prioridad,
  type ClaseDeEstado,
  type RiesgoDelInforme,
} from "./plan-comun";
import { delVocabulario } from "./vocabulario";
import { GRAMATICA, grafoParaMapa, lienzo, type Lienzo } from "./visor";

export { valorDeUmbral };

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
  /** El id del umbral que la regla lee (U1 en los planes del A y del B): el panel lo dice con el del plan. */
  umbralId: string;
  titulo: string;
  rol: string;
  chip: string;
  filas: Fila[];
  playground: string;
  puntos: Array<{ id: string; valor: number; aPersona: boolean }>;
  umbral: number;
  eje: { min: number; max: number };
  nota: string;
  /** Lo que oye el lector de la gráfica de puntos: qué valor se reparte. */
  etiqueta: string;
}
/** El spike de la F1 frente al mismo contrato: su lectura, tres cifras y su lienzo (sin selección). */
export interface VistaSpike {
  chip: string;
  lectura: string;
  cifras: Cifra[];
  lienzo: Lienzo;
  region: string;
  /** De qué línea del código del spike sale cada parte de la lectura: `archivo:línea`, sin enlace. */
  citas: { rotulo: string; refs: Array<{ que: string; donde: string }> };
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

const SIN_PLAN_DE_NODO = {
  decisiones: [],
  riesgos: [],
  supuestos: [],
  criterios: [],
  umbrales: [],
};

export function vistaAgente(d: DatosDemo, i: Idioma): VistaAgente {
  const ctx = contextoAgente(d, i);
  const perfil: PerfilAgente =
    d.id === "demo-a" ? perfilDemoA(d, ctx) : perfilDemoB(d, ctx);
  const { X, XP, trazas, n, corrida, sprint, fecha, modelo, con, pasosDe } =
    ctx;
  const demo = d.corrida.manifiesto.ficha.nombre;
  const informe = d.informe;
  const criterio = ctx.criterio;
  const campos = pausaDelPlan(d.plan.contrato_de_grafo.pausas_humanas)
    .payload_minimo.length;

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
  const pausaPlan = pausaDelPlan(d.plan.contrato_de_grafo.pausas_humanas);
  const ent = d.entorno;
  const pq = ent.paquetes as Record<string, string>;
  const conModelo = d.plan.contrato_de_grafo.nodos_esperados.filter(
    (x) => x.tipo === "modelo",
  ).length;
  // La arista que se puede tocar la elige el perfil del demo (en el A, la de la señal de confianza): su línea es la
  // seleccionable del lienzo y su panel es el de la arista (RF-08.4 por arista condicional queda en el roadmap, C-1).
  const { umbral: u1, regla: reglaU1 } = perfil.arista;
  const lineaU1 = `l-${idDeMapa(reglaU1.desde)}-a-${idDeMapa(reglaU1.si_verdadero)}`;
  const lienzoVista = lienzo(
    {
      demo: d.id,
      grafo: grafoParaMapa(grafo),
      contrato: d.plan.contrato_de_grafo,
      sujeto: { id: d.id, nombre: demo },
      version: d.corrida.manifiesto.plan.version,
      fecha,
      modelo,
      codigo: d.codigo.nodos,
      trazas: d.corrida.trazas,
    },
    // La huella de la corrida entra a la clave: sus trazas son los recorridos del mapa (contrato 0.5.0 § 3.5).
    `${grafo.huella}:${d.plan.huella}:${d.manifiesto.corrida.huella}`,
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
      // La línea que abre el panel es la de la regla que elige el perfil, no un par escrito (C-1).
      lineasSeleccionables: [lineaU1],
    },
  );
  const comp = lienzoVista.comparacion;
  const experto: VistaAgente["experto"] = {
    grupos: [
      perfil.arquitectura,
      {
        rotulo: X(EXPERTO.grafo.rotulo),
        filas: [
          {
            k: X(EXPERTO.grafo.contrato),
            v: X(
              EXPERTO.grafo.contratoTexto({
                nodos: d.plan.contrato_de_grafo.nodos_esperados.length,
                reglas: d.plan.contrato_de_grafo.aristas_condicionales.length,
                pausas: d.plan.contrato_de_grafo.pausas_humanas.length,
                rol: pausaPlan?.rol ?? "",
                campos,
              }),
            ),
          },
          {
            k: X(EXPERTO.grafo.sprint(sprint)),
            v: X(
              EXPERTO.grafo.sprintTexto({
                nodos: grafo.nodos.length,
                aristas: aristasLg.length,
                condicionales: aristasLg.filter((a) => a.conditional).length,
              }),
            ),
          },
          {
            k: X(EXPERTO.grafo.coincide),
            v: X(
              EXPERTO.grafo.coincideTexto({
                n: comp.nodos.coinciden,
                de: comp.nodos.contrato,
                r: comp.reglas.dibujadas,
                rde: comp.reglas.contrato,
                fuera: comp.nodos.fueraDelContrato.length,
              }),
            ),
          },
          {
            k: X(EXPERTO.grafo.huella),
            v: `\`${grafo.huella.slice(0, 16)}…\``,
          },
        ],
      },
      {
        rotulo: X(EXPERTO.modelo.rotulo),
        filas: [
          {
            k: X(EXPERTO.modelo.adaptador),
            v: "`ChatClaudeCode(BaseChatModel)` → `claude -p`",
          },
          {
            k: X(EXPERTO.modelo.modelo),
            v: X(EXPERTO.modelo.modeloTexto({ alias: modelo, n: conModelo })),
          },
          { k: X(EXPERTO.modelo.regimen[0]!), v: X(perfil.regimen) },
          {
            k: X(EXPERTO.modelo.aislamiento[0]!),
            v: X(EXPERTO.modelo.aislamiento[1]!),
          },
        ],
      },
      {
        rotulo: X(EXPERTO.versiones.rotulo),
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
        rotulo: X(EXPERTO.estado.rotulo),
        filas: [
          {
            k: X(EXPERTO.estado.tipo),
            v: X(
              EXPERTO.estado.tipoTexto({
                senales: claves.filter((c) => senalesPlan.has(c)).length,
                trabajo: claves.filter((c) => !senalesPlan.has(c)).length,
              }),
            ),
          },
          {
            k: X(EXPERTO.estado.trabajo),
            v: "",
            codigos: claves.filter((c) => !senalesPlan.has(c)),
          },
          { k: X(EXPERTO.estado.senales), v: "", codigos: [...senalesPlan] },
        ],
      },
      {
        rotulo: X(EXPERTO.persistencia.rotulo),
        filas: [
          EXPERTO.persistencia.checkpointer,
          EXPERTO.persistencia.hilo,
          EXPERTO.persistencia.trazas,
        ].map(([k, v]) => ({ k: X(k!), v: X(v!) })),
      },
      {
        rotulo: X(EXPERTO.evaluacion.rotulo),
        filas: [
          {
            k: X(EXPERTO.evaluacion.verificador),
            v: X(
              EXPERTO.evaluacion.verificadorTexto({
                criterios: informe.criterios.length,
                riesgos: informe.riesgos.length,
                supuestos: informe.supuestos.length,
              }),
            ),
          },
          {
            k: X(EXPERTO.evaluacion.cruzada),
            v: X(
              EXPERTO.evaluacion.cruzadaTexto({
                decisiones: decisionesRf,
                diferencias: diferenciasRf,
              }),
            ),
          },
          {
            k: X(EXPERTO.evaluacion.lotes),
            v: X(
              EXPERTO.evaluacion.lotesTexto({
                casos: n,
                repeticiones: 1 + d.manifiesto.repeticiones.length,
                base: d.manifiesto.linea_base !== null,
              }),
            ),
          },
          {
            k: X(EXPERTO.evaluacion.plan),
            v: X(
              EXPERTO.evaluacion.planTexto({
                d: d.plan.decisiones.length,
                r: d.plan.riesgos.length,
                s: d.plan.supuestos.length,
                c: d.plan.criterios_aceptacion.length,
                u: d.plan.umbrales.length,
              }),
            ),
          },
        ],
      },
    ],
    matriz: {
      columnas: EXPERTO.matriz.columnas.map((c) => X(c)),
      filas: d.plan.contrato_de_grafo.nodos_esperados.map((x) => {
        const p = perfil.planPorNodo[x.id] ?? SIN_PLAN_DE_NODO;
        const lista = (l: string[]) => (l.length ? l.join(" · ") : "—");
        const umbrales = [
          ...p.umbrales,
          ...(p.senal ?? []).map((u) => `${u} (${X(EXPERTO.matriz.senal)})`),
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
            X(FRACCION({ a: con(x.id).length, b: n })),
          ],
          corrio: con(x.id).length > 0,
        };
      }),
      nota: X(EXPERTO.matriz.nota(n)),
      fuente: X(EXPERTO.matriz.fuente(versionCorta(d.plan.version))),
    },
    estado: {
      titulo: X(EXPERTO.codigoEstado),
      archivo: d.codigo.estado.archivo,
      desde: d.codigo.estado.desde,
      lineas: X(
        PANEL.codigo_.lineas({
          desde: d.codigo.estado.desde,
          hasta: d.codigo.estado.hasta,
        }),
      ),
      codigo: d.codigo.estado.codigo,
    },
  };

  // ── lo que corrió frente a su plan ──────────────────────────────────────────────────────────────
  const faltanSobran = {
    faltan: comp.nodos.exigidosAusentes.length,
    sobran: comp.nodos.fueraDelContrato.length,
  };
  const contrato: VistaAgente["contrato"] = {
    cifras: [
      {
        cifra: X(FRACCION({ a: comp.nodos.coinciden, b: comp.nodos.contrato })),
        texto: X(CONTRATO_CIFRAS.nodos),
        // La frase que compara con el spike solo vale si el demo tiene spike.
        detalle: X(
          d.spike
            ? CONTRATO_CIFRAS.nodosDetalle(faltanSobran)
            : CONTRATO_CIFRAS.nodosDetalleSinSpike(faltanSobran),
        ),
      },
      {
        cifra: X(
          FRACCION({ a: comp.reglas.dibujadas, b: comp.reglas.contrato }),
        ),
        texto: X(CONTRATO_CIFRAS.reglas),
        detalle: X(CONTRATO_CIFRAS.reglasDetalle),
      },
      {
        cifra: `${decisionesRf} · ${diferenciasRf}`,
        texto: X(CONTRATO_CIFRAS.cruzada),
        detalle: X(CONTRATO_CIFRAS.cruzadaDetalle),
      },
    ],
    fuente: X(
      CONTRATO_CIFRAS.fuente({
        plan: versionCorta(d.plan.version),
        corrida,
        huella: `${grafo.huella.slice(0, 12)}…`,
      }),
    ),
    chip: X(CONTRATO_CIFRAS.chip),
  };

  // ── paneles por nodo ────────────────────────────────────────────────────────────────────────────
  const capas = GRAMATICA.bandas
    .filter((b) => b.clase === "capa")
    .sort((a, b) => a.orden - b.orden);
  const banda = (tipo: string) =>
    capas.findIndex((b) => b.id === BANDA_DE_TIPO[idDeMapa(tipo)]);
  const bandaDe = (tipo: string): TextoBilingue =>
    delVocabulario(
      Object.fromEntries(
        capas.map((b, k) => [String(k), b.nombre as TextoBilingue]),
      ),
      String(banda(tipo)),
      `las capas de la gramática agentes-ia (el tipo «${tipo}» no tiene capa)`,
    );
  const refPlan = (id: string): RefPlan | null => {
    const p = d.plan;
    const dd = p.decisiones.find((x) => x.id === id);
    if (dd)
      return {
        id,
        texto: X(dd.pregunta),
        etiqueta: {
          texto: X(
            delVocabulario(
              REVERSIBILIDAD,
              dd.reversibilidad,
              "REVERSIBILIDAD (src/textos/plan-comun.ts)",
            ),
          ),
          unaVia: dd.reversibilidad === "una_via",
        },
      };
    const r = p.riesgos.find((x) => x.id === id);
    if (r) {
      const ri = informe.riesgos.find((x) => x.id === id) as
        RiesgoDelInforme | undefined;
      const legal = controlLegal(ri, i);
      return {
        id,
        texto: X(r.modo),
        ap: prioridad(ri, i),
        factores: `S${r.severidad} · O${r.ocurrencia} · D${r.deteccion} · RPN ${ri?.rpn ?? r.severidad * r.ocurrencia * r.deteccion}${legal ? ` · ${legal}` : ""}`,
        estado: estadoDeRiesgo(ri?.estado, i),
      };
    }
    const s = p.supuestos.find((x) => x.id === id);
    if (s)
      return {
        id,
        texto: X(s.enunciado),
        estado: estadoDeSupuesto(
          informe.supuestos.find((x) => x.id === id)?.estado,
          i,
        ),
      };
    const c = p.criterios_aceptacion.find((x) => x.id === id);
    if (c)
      return {
        id,
        texto: X(c.enunciado),
        estado: estadoDeCriterio(criterio(id)?.estado, i),
      };
    const u = p.umbrales.find((x) => x.id === id);
    if (u)
      return {
        id,
        texto: `${X(u.nombre)} · ${valorDeUmbral(u.valor_en_plan, i)}`,
        factores: `${u.senal} · ${u.operador}${u.inclusivo ? ` · ${X(INCLUSIVO)}` : ""}`,
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
  const textosDe = (nodo: string) =>
    delVocabulario(perfil.nodos, nodo, perfil.dondeNodos);
  /** El grupo propio del nodo (por qué no usa modelo, su configuración, sus reglas o qué revisa). */
  const grupoModelo = (nodo: string): Grupo => {
    const m = textosDe(nodo).modelo;
    if (m.reglasDelPlan) {
      const reglas = d.plan.contrato_de_grafo.aristas_condicionales
        .filter((a) => a.desde === nodo)
        .sort((a, b) => a.orden - b.orden);
      return {
        rotulo: X(m.rotulo).replace("{n}", String(reglas.length)),
        filas: reglas.map((a) => ({
          k: String(a.orden),
          v: esAristaTripleta(a)
            ? `\`${a.senal} · ${a.operador} · ${String(a.valor)}\``
            : `\`${a.funcion.nombre}(${a.funcion.entradas.join(", ")})\``,
        })),
      };
    }
    return {
      rotulo: X(m.rotulo),
      filas: m.filas.map(([k, v]) => ({ k: X(k), v: conValores(X(v)) })),
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
      ? X(PANEL.experto_.inicio)
      : id === "__end__"
        ? X(PANEL.experto_.fin)
        : id;
  const pausasNodos = new Set(grafo.pausas_humanas.map((p) => p.nodo));
  const modo = (a: { source: string; conditional?: boolean }) =>
    X(
      a.conditional
        ? MODO_ARISTA.condicional
        : pausasNodos.has(a.source)
          ? MODO_ARISTA.reanudacion
          : MODO_ARISTA.secuencia,
    );
  const filaTraza = (t: Traza, nodo: string): FilaTraza => {
    const f = perfil.filaTraza(t, nodo);
    return {
      id: t.caso_id,
      tipo: perfil.tipoDeCaso(t.caso_id),
      celdas: f.celdas,
      barra: f.barra,
      solicitud: f.solicitud,
      pares: f.pares,
      enlace: ruta(i, "caso", t.caso_id, d.id),
    };
  };

  const paneles: PanelNodo[] = d.plan.contrato_de_grafo.nodos_esperados.map(
    (x) => {
      const t = textosDe(x.id);
      const casos = con(x.id).length;
      const nVisitas = pasosDe(x.id).length;
      const cod = delVocabulario(
        d.codigo.nodos,
        x.id,
        `data/vitrina/${d.id}/grafo-codigo.json (regenéralo con python -m app_agents.exportar_grafo)`,
      );
      const tipo = lienzoVista.lista
        .flatMap((l) => l.nodos)
        .find((nn) => nn.id === idDeMapa(x.id));
      if (!tipo)
        throw new Error(
          `vitrina: el nodo «${x.id}» del contrato no está en la lista del lienzo de P3`,
        );
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
        : salen.map((s) => `${casos} → ${s}`).join(" · ");
      const plan = perfil.planPorNodo[x.id] ?? SIN_PLAN_DE_NODO;
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
          titulo: X(PANEL.codigo_.nodo),
          archivo: cod.archivo,
          desde: cod.desde,
          lineas: X(
            PANEL.codigo_.lineas({
              desde: cod.desde,
              hasta: cod.hasta,
            }),
          ),
          codigo: cod.codigo,
        },
      ];
      if (x.id === "decision")
        bloques.push({
          titulo: X(PANEL.codigo_.ruta),
          archivo: d.codigo.ruta.archivo,
          desde: d.codigo.ruta.desde,
          lineas: X(
            PANEL.codigo_.lineas({
              desde: d.codigo.ruta.desde,
              hasta: d.codigo.ruta.hasta,
            }),
          ),
          codigo: d.codigo.ruta.codigo,
        });
      const reglas = reglasDelPlan(x.id);
      const defecto = grafo.ramas_por_defecto[x.id];
      const campos: Campo[] = [
        {
          clave: "paraQue",
          rotulo: X(PANEL.campos.paraQue),
          texto: XP(t.paraQue),
        },
        { clave: "como", rotulo: X(PANEL.campos.como), texto: XP(t.como) },
      ];
      if (t.decide)
        campos.push({
          clave: "decide",
          rotulo: X(PANEL.campos.decide),
          texto: XP(t.decide),
        });
      if (t.extra?.falta)
        campos.push({
          clave: "falta",
          rotulo: XP(t.extra.rotulo),
          texto: XP(t.extra.texto),
        });
      campos.push(
        {
          clave: "siFalla",
          rotulo: X(PANEL.campos.siFalla),
          texto: XP(t.siFalla),
        },
        {
          clave: "seMide",
          rotulo: X(PANEL.campos.seMide),
          texto: XP(t.seMide),
        },
        {
          clave: "enLaCorrida",
          rotulo: X(PANEL.campos.enLaCorrida(n)),
          texto: X(perfil.enLaCorrida(x.id)),
        },
      );
      if (t.extra && !t.extra.falta)
        campos.push({
          clave: "garantia",
          rotulo: XP(t.extra.rotulo),
          texto: XP(t.extra.texto),
        });
      campos.push(...perfil.camposExtra(x.id));
      const columnas = delVocabulario(
        perfil.trazasDeNodo,
        x.id,
        perfil.dondeTrazas,
      ).columnas.map((col) => X(col));
      return {
        id: idDeMapa(x.id),
        nombre: x.id,
        tipo: idDeMapa(x.tipo),
        codigo: tipo.codigo,
        rol: XP(t.rol),
        chip: X(CHIP_CORRIDA(corrida)),
        lider: {
          recibe: { titulo: XP(t.recibe.titulo), sub: XP(t.recibe.sub) },
          entrega: { titulo: XP(t.entrega.titulo), sub: XP(t.entrega.sub) },
          campos,
        },
        experto: {
          contrato: {
            rotulo: X(PANEL.experto_.contrato),
            filas: [
              {
                k: X(PANEL.experto_.nodo),
                v: `\`${x.id}\` · ${x.tipo} · ${X(
                  PANEL.experto_.capa({
                    n: String(banda(x.tipo) + 1).padStart(2, "0"),
                    banda: bandaDe(x.tipo),
                  }),
                )}`,
              },
              { k: X(PANEL.experto_.lee), v: XP(t.lee) },
              {
                k: X(PANEL.experto_.escribe),
                v: "",
                codigos: cod.escribe,
              },
              {
                k: X(PANEL.experto_.entraDesde),
                v: [
                  ...new Set(
                    entran.map((a) => `${nombreDe(a.source)} · ${modo(a)}`),
                  ),
                ].join(", "),
              },
              {
                k: X(PANEL.experto_.saleHacia),
                v: salen
                  .map((s) =>
                    aristas.some((a) => a.target === s) ? `\`${s}\`` : s,
                  )
                  .join(" · "),
              },
              {
                k: X(PANEL.experto_.reglas),
                v: reglas.length
                  ? `${reglas.join(" · ")}${defecto ? ` · ${X(GRAFO.lista_.siNo)} → \`${defecto}\`` : ""}`
                  : X(PANEL.experto_.sinReglas),
              },
            ],
          },
          modelo: grupoModelo(x.id),
          plan: refs,
          observado: {
            rotulo: X(PANEL.experto_.observado(corrida)),
            filas: [
              {
                k: X(PANEL.experto_.casosVisitas),
                v: `${X(FRACCION({ a: casos, b: n }))} · ${nVisitas}`,
              },
              {
                k: X(PANEL.experto_.modelo),
                v:
                  tok > 0
                    ? X(
                        PANEL.experto_.conModelo({
                          alias: modelo,
                          tokens: entero(tok, i),
                          usd: decimal(usd, 3, i),
                        }),
                      )
                    : X(PANEL.experto_.sinModelo),
              },
              { k: X(PANEL.experto_.caminos), v: caminos },
            ],
          },
        },
        codigoBloques: bloques,
        codigoFuente: X(
          PANEL.codigo_.fuente({
            grafo: `${grafo.huella.slice(0, 12)}…`,
            corrida,
          }),
        ),
        trazas: {
          columnas,
          filas: con(x.id).map((tr) => filaTraza(tr, x.id)),
          visibles: VISIBLES,
          nota: perfil.notaTrazas(x.id),
        },
      };
    },
  );

  // ── la arista que se puede tocar ────────────────────────────────────────────────────────────────
  if (!("min" in u1.rango_jugable))
    throw new Error(`vitrina: ${u1.id} no tiene rango numérico en el plan`);
  const rangoU1 = u1.rango_jugable;
  const desdeU1 = reglaU1.desde;
  const deNodo = d.plan.contrato_de_grafo.aristas_condicionales.filter(
    (a) => a.desde === desdeU1,
  ).length;
  const puntos = con(desdeU1)
    .map((t) => {
      const v = perfil.arista.valor(t);
      const decidioU1 = visitas(t, desdeU1).some(
        (x) => x.regla?.orden_arista === reglaU1.orden,
      );
      return { id: t.caso_id, valor: v, aPersona: decidioU1 };
    })
    .sort((a, b) => a.valor - b.valor || (a.id < b.id ? -1 : 1));
  const bajo = puntos.filter((p) => p.aPersona);
  const arista: PanelArista = {
    id: lineaU1,
    umbralId: u1.id,
    titulo: perfil.arista.titulo,
    rol: perfil.arista.rol,
    chip: X(CHIP_CORRIDA(corrida)),
    filas: [
      {
        k: X(ARISTA_U1.regla),
        v: `${u1.senal} · ${u1.operador} · ${u1.id}`,
      },
      {
        k: X(ARISTA_U1.valor),
        v: X(
          ARISTA_U1.valorTexto({
            valor: decimal(u1.valor_en_plan as number, 2, i),
            inclusivo: u1.inclusivo,
          }),
        ),
      },
      {
        k: X(ARISTA_U1.donde),
        v: X(
          ARISTA_U1.dondeTexto({
            nodo: desdeU1,
            orden: reglaU1.orden,
            de: deNodo,
          }),
        ),
      },
      {
        k: X(ARISTA_U1.rango),
        v: X(
          ARISTA_U1.rangoTexto({
            min: decimal(rangoU1.min, 2, i),
            max: decimal(rangoU1.max, 2, i),
            paso: decimal(rangoU1.paso, 2, i),
          }),
        ),
      },
      { k: X(ARISTA_U1.costo), v: perfil.arista.costo },
      {
        k: X(ARISTA_U1.enLaCorrida),
        v: perfil.arista.enLaCorrida({
          n: bajo.length,
          de: puntos.length,
          casos: enumerar(
            bajo.map(
              (p) => `${p.id}, ${X(ARISTA_U1.con)} ${decimal(p.valor, 2, i)}`,
            ),
            i,
          ),
        }),
      },
    ],
    playground: ruta(i, "playground", undefined, d.id),
    puntos,
    umbral: u1.valor_en_plan as number,
    // El eje cubre el rango jugable y todo valor observado: ningún punto se dibuja fuera (AU-S2-2).
    eje: {
      min: Math.min(rangoU1.min, ...puntos.map((p) => p.valor)),
      max: Math.max(1, rangoU1.max, ...puntos.map((p) => p.valor)),
    },
    nota: perfil.arista.nota({
      n: puntos.length,
      otros: n - puntos.length,
      nodo: desdeU1,
    }),
    etiqueta: perfil.arista.etiqueta,
  };

  // ── el spike, frente al mismo contrato ───────────────────────────────────────────────────────────
  let spike: VistaSpike | null = null;
  if (d.spike) {
    const sp = d.spike;
    const contratoG = d.plan.contrato_de_grafo;
    const lz = lienzo(
      {
        demo: d.id,
        grafo: sp.grafo,
        contrato: contratoG,
        sujeto: { id: `${d.id}-spike`, nombre: demo },
        // El spike corrió antes del plan: su mapa va como 0.1.0 (el contrato exige semver; antes «spike-<fecha>»).
        version: "0.1.0",
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
        exigirIgualdad: false,
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
      chip: X(SPIKE.chip(sp.fecha)),
      lectura: X(
        SPIKE.lectura({
          fecha: sp.fecha,
          presentes: cs.nodos.coinciden,
          total: cs.nodos.contrato,
          ausentes: cs.nodos.exigidosAusentes.length,
          fuera: cs.nodos.fueraDelContrato.length,
          sprint,
        }),
      ),
      cifras: [
        {
          cifra: X(FRACCION({ a: cs.nodos.coinciden, b: cs.nodos.contrato })),
          texto: X(SPIKE.nodos),
          detalle: X(
            SPIKE.faltaban(
              enumerar(
                contratoG.nodos_esperados
                  .map((x) => x.id)
                  .filter((x) =>
                    cs.nodos.exigidosAusentes.includes(idDeMapa(x)),
                  ),
                i,
              ),
            ),
          ),
        },
        {
          cifra: X(
            FRACCION({
              a: new Set(iguales.map((x) => x.plan)).size,
              b: contratoG.aristas_condicionales.length,
            }),
          ),
          texto: X(SPIKE.reglas),
          detalle: primera
            ? X(
                SPIKE.reglasDetalle({
                  umbral: String(primera.plan.valor).replace(/^umbral\./, ""),
                  desde: primera.spike.desde,
                  enPlan: primera.plan.desde,
                }),
              )
            : "",
        },
        {
          cifra: String(cs.nodos.fueraDelContrato.length),
          texto: X(SPIKE.fuera),
          detalle: X(SPIKE.fueraDetalle),
        },
      ],
      lienzo: lz,
      region: X(SPIKE.region),
      citas: {
        rotulo: X(SPIKE.citas),
        refs: Object.entries(sp.lectura.citas).map(([que, cita]) => {
          // Solo la referencia `archivo:línea` del principio: el resto de la cita es la línea del código, en el
          // idioma en que se escribió, y no se publica como si fuera texto de la página.
          const donde = /^([\w./-]+:\d+(?:-\d+)?)/.exec(cita)?.[1];
          if (!donde)
            throw new Error(
              `vitrina: la cita «${que}» de la lectura del spike no empieza por archivo:línea («${cita}»).`,
            );
          return {
            que: X(
              delVocabulario(
                SPIKE.cita,
                que,
                "SPIKE.cita (src/textos/agente.ts)",
              ),
            ),
            donde,
          };
        }),
      },
    };
  }

  return {
    portada: {
      antetitulo: X(PORTADA.antetitulo({ demo, corrida, sprint, fecha })),
      titulo: X(perfil.portadaTitulo),
      guia: X(PORTADA.guia),
    },
    ficha: perfil.ficha,
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
    ),
  };
}
