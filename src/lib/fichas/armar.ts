/**
 * Arma lo que planlang entrega a hoja-de-vida, desde los datos del demo y los hechos del repositorio:
 * - la ficha del agente A (contrato ficha técnica v1.3.1, frente Agentes): el texto redactado de `src/textos/fichas.ts`
 *   y las cifras del informe, la corrida y el plan;
 * - el `brochure-export.json` (contrato 1.0.0): los hechos de la app, de los que la planeadora arma su ficha;
 * - el complemento que planlang propone a la planeadora (titular, cifras destacadas, límites, nunca);
 * - y la ficha de la app tal como la armaría la planeadora: réplica de `armar.py` (export + complemento).
 * Un idioma por ficha, como pide el contrato; se entrega el español y el inglés queda para la vitrina.
 */
import type { Idioma, TextoBilingue } from "@core/formatos/bilingue";
import type { DatosDemo } from "@/lib/datos/vitrina";
import type { HechosDelRepo } from "@/lib/datos/repo";
import { versionCorta } from "@/lib/vista/formato";
import { AGENTE, APP } from "@/textos/fichas";
import { VERSION_EXPORT, VERSION_FICHA } from "./contrato";
import type { BrochureExport, CifraFicha, FichaTecnica } from "./tipos";

const X = (t: TextoBilingue, i: Idioma) => t[i];

/** Redondeo para mostrar una cifra en la ficha (la fuente exacta queda en `detalle`). */
const red = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;

function criterio(d: DatosDemo, id: string) {
  const c = d.informe.criterios.find((x) => x.id === id);
  if (!c) throw new Error(`fichas: el informe no trae el criterio ${id}.`);
  return c;
}

function costoDeLaCorrida(d: DatosDemo): number {
  const s = d.informe.supuestos.find((x) => x.comparacion);
  const c = s?.comparacion?.presupuesto.multiagente.costo_nominal_usd;
  if (typeof c !== "number")
    throw new Error(
      "fichas: el informe no trae el costo nominal de la corrida.",
    );
  return c;
}

/** Cada nodo del contrato del grafo en orden, con las reglas del plan que salen de él. */
function nodosDelPlan(d: DatosDemo) {
  const aristas = d.plan.contrato_de_grafo.aristas_condicionales;
  return d.plan.contrato_de_grafo.nodos_esperados.map((n) => ({
    id: n.id,
    reglas: aristas.filter((a) => a.desde === n.id).length,
  }));
}

// ------------------------------------------------------------------------------------------- agente A

export function fichaAgente(
  d: DatosDemo,
  repo: HechosDelRepo,
  i: Idioma,
): FichaTecnica {
  const inf = d.informe;
  const rep = inf.ficha_reproducibilidad;
  const n = rep.corrida.casos_ejecutados;
  const c1 = criterio(d, "C1");
  const c5 = criterio(d, "C5");
  const c7 = criterio(d, "C7");
  if (
    typeof c5.valor_medido !== "number" ||
    typeof c7.valor_medido !== "number"
  )
    throw new Error("fichas: C5 o C7 sin valor medido.");
  const costo = costoDeLaCorrida(d);
  const C = AGENTE.cifras;
  const cifras: CifraFicha[] = [
    {
      clave: "exactitud_extraccion",
      valor: red(c5.valor_medido * 100, 1),
      unidad: "%",
      etiqueta: X(C.exactitud.etiqueta, i),
      fuente: "medido",
      detalle: X(
        C.exactitud.detalle({ n: c5.n_poblacion, k: c5.k?.observado ?? 1 }),
        i,
      ),
    },
    {
      clave: "latencia_mediana",
      valor: red(c7.valor_medido, 1),
      unidad: "s",
      etiqueta: X(C.latencia.etiqueta, i),
      fuente: "medido",
      detalle: X(C.latencia.detalle({ n: c7.n_poblacion }), i),
    },
    {
      clave: "casos_con_persona",
      valor: inf.contrato_de_grafo.pausas.casos_con_pausa,
      etiqueta: X(C.personas.etiqueta(n), i),
      fuente: "medido",
      detalle: X(C.personas.detalle, i),
    },
    {
      clave: "negaciones_sin_persona",
      valor: c1.casos_que_incumplen.length,
      etiqueta: X(C.sinPersona.etiqueta, i),
      fuente: "medido",
      detalle: X(C.sinPersona.detalle(c1.n_poblacion), i),
    },
    {
      clave: "costo_por_caso",
      valor: red(costo / n, 3),
      unidad: "US$",
      etiqueta: X(C.costo.etiqueta, i),
      fuente: "calculada",
      detalle: X(
        C.costo.detalle({
          total: i === "es" ? String(costo).replace(".", ",") : String(costo),
          n,
        }),
        i,
      ),
    },
  ];
  const nodos = nodosDelPlan(d);
  const bloques = nodos.map((x, k) => {
    const b = AGENTE.bloques[x.id];
    if (!b)
      throw new Error(
        `fichas: el nodo «${x.id}» del contrato no tiene su bloque en la ficha del agente (src/textos/fichas.ts).`,
      );
    return {
      orden: k + 1,
      nombre: X(b.nombre, i),
      linea: X(b.linea, i),
      cuenta: x.reglas,
    };
  });
  const P = AGENTE.proceso;
  const ct = inf.contrato_de_grafo;
  const decisiones = ct.rf_09_2.reduce((s, r) => s + r.visitas, 0);
  const versionPlan = versionCorta(inf.plan_en_breve.version);
  const entorno = d.entorno.paquetes;
  const mm = (v: string) => v.split(".").slice(0, 2).join(".");
  return {
    schema_version: VERSION_FICHA,
    actualizado: rep.corrida.fecha,
    pieza: {
      slug: AGENTE.slug,
      nombre: X(AGENTE.nombre, i),
      frente: "agentes",
      estado: "inicial",
      ciclo: "H1",
      version: `plan ${versionPlan}`,
      sellado_en: null,
      sprints_cerrados: repo.sprintsCerrados,
    },
    promesa: {
      tagline: X(AGENTE.tagline, i),
      intro: X(AGENTE.intro, i),
      para_quien: X(AGENTE.para_quien, i),
    },
    titular: X(AGENTE.titular, i),
    stack: [
      {
        nombre: `LangGraph ${mm(entorno.langgraph)}`,
        papel: X(AGENTE.stack.langgraph, i),
      },
      {
        nombre: `LangChain ${mm(entorno.langchain)}`,
        papel: X(AGENTE.stack.langchain, i),
      },
      {
        nombre: `Python ${mm(d.entorno.python)}`,
        papel: X(AGENTE.stack.python, i),
      },
      {
        nombre: X(AGENTE.stackNombre.modelo, i),
        papel: X(AGENTE.stack.modelo, i),
      },
      {
        nombre: X(AGENTE.stackNombre.reglas, i),
        papel: X(AGENTE.stack.reglas, i),
      },
      { nombre: "planlang-trace/v1", papel: X(AGENTE.stack.trazas, i) },
    ],
    cifras,
    bloques,
    proceso: {
      titulo: X(P.titulo, i),
      carriles: Object.entries(P.carriles).map(([id, nombre]) => ({
        id,
        nombre: X(nombre, i),
      })),
      pasos: P.pasos.map((p) => ({
        id: p.id,
        tipo: p.tipo,
        carril: p.carril,
        texto: p.texto ? X(p.texto, i) : "",
      })),
      flujos: P.flujos.map((f) => ({
        de: f.de,
        a: f.a,
        ...(f.etiqueta ? { etiqueta: X(f.etiqueta, i) } : {}),
      })),
      anotaciones: P.anotaciones.map((a) => ({
        paso: a.paso,
        texto: X(a.texto, i),
      })),
    },
    procedencia_proceso: "app",
    limites: AGENTE.limites.map((t) => X(t, i)),
    nunca: AGENTE.nunca.map((t) => X(t, i)),
    hitos: [
      { valor: versionPlan, etiqueta: X(AGENTE.hitos.plan, i) },
      { valor: rep.corrida.fecha, etiqueta: X(AGENTE.hitos.corrida, i) },
      {
        valor:
          i === "es"
            ? `${ct.nodos.filter((x) => x.en_grafo).length} de ${ct.nodos.length}`
            : `${ct.nodos.filter((x) => x.en_grafo).length} of ${ct.nodos.length}`,
        etiqueta: X(AGENTE.hitos.piezas, i),
      },
      { valor: String(decisiones), etiqueta: X(AGENTE.hitos.decisiones, i) },
    ],
  };
}

// ------------------------------------------------------------------------------------------- la app

/** Los hechos de la app (contrato brochure-export 1.0.0). Lo cuenta todo desde los datos: nada se escribe a mano. */
export function brochureExport(
  d: DatosDemo,
  repo: HechosDelRepo,
  i: Idioma,
): BrochureExport {
  const inf = d.informe;
  const rep = inf.ficha_reproducibilidad;
  const ct = inf.contrato_de_grafo;
  const decisiones = ct.rf_09_2.reduce((s, r) => s + r.visitas, 0);
  const diferencias = ct.rf_09_2.reduce((s, r) => s + r.discrepancias, 0);
  const cumplen = inf.criterios.filter((c) => c.estado === "cumple").length;
  const n = rep.corrida.casos_ejecutados;
  const corridas = 1 + rep.repeticiones.length;
  const grupos = APP.grupos.map((g, k) => ({
    orden: k + 1,
    estrella: g.estrella,
    nombre: X(g.nombre, i),
    linea: X(g.linea, i),
    features: g.features.map((f) => ({
      id: f.id,
      nombre: X(f.nombre, i),
      que_hace: X(f.que_hace, i),
      seccion_manual: X(f.seccion_manual, i),
    })),
  }));
  const total = grupos.reduce((s, g) => s + g.features.length, 0);
  const es = i === "es";
  const costo = costoDeLaCorrida(d);
  return {
    _schema: repo.bloqueSchema,
    schema_version: VERSION_EXPORT,
    actualizado: rep.corrida.fecha,
    app: {
      slug: APP.slug,
      nombre: APP.nombre,
      ciclo: "H1",
      estado: "inicial",
      sellado_en: null,
      sprints_cerrados: repo.sprintsCerrados,
      version_repo: repo.version,
    },
    promesa: {
      tagline: X(APP.tagline, i),
      intro: X(APP.intro, i),
      para_quien: X(APP.para_quien, i),
      diferencial: X(APP.diferencial, i),
    },
    funcionalidades: {
      total,
      fuente_del_conteo: "docs/MANUAL-DE-USO.md",
      descartadas: [],
      grupos,
    },
    metricas: [
      {
        clave: "criterios_cumplidos",
        etiqueta: es
          ? `criterios del plan cumplidos, de ${inf.criterios.length}`
          : `plan criteria met, of ${inf.criterios.length}`,
        valor: cumplen,
        unidad: es ? "criterios" : "criteria",
        fuente: "medido",
        detalle: es
          ? `Del informe del verificador ${inf.version_verificador} sobre la corrida ${inf.corrida_id}: ${cumplen} de ${inf.criterios.length} criterios cumplidos.`
          : `From verifier ${inf.version_verificador}'s report on run ${inf.corrida_id}: ${cumplen} of ${inf.criterios.length} criteria met.`,
      },
      {
        clave: "decisiones_cruzadas",
        etiqueta: es
          ? `decisiones rehechas en otro lenguaje, con ${diferencias} diferencias`
          : `decisions redone in another language, with ${diferencias} differences`,
        valor: decisiones,
        unidad: es ? "decisiones" : "decisions",
        fuente: "medido",
        detalle: es
          ? `Prueba cruzada RF-09.2 sobre ${ct.rf_09_2.length} corridas: el intérprete de aristas de TypeScript rehace cada decisión que registró Python.`
          : `RF-09.2 cross-check over ${ct.rf_09_2.length} runs: the TypeScript edge interpreter redoes every decision Python recorded.`,
      },
      {
        clave: "casos_por_corrida",
        etiqueta: es
          ? `casos por corrida, en ${corridas} corridas y una línea base`
          : `cases per run, over ${corridas} runs and a baseline`,
        valor: n,
        unidad: es ? "casos" : "cases",
        fuente: "medido",
        detalle: es
          ? `Corrida ${rep.corrida.id} con sus ${rep.repeticiones.length} repeticiones (pass^k) y la línea base de agente único a igual presupuesto.`
          : `Run ${rep.corrida.id} with its ${rep.repeticiones.length} repetitions (pass^k) and the single-agent baseline at equal budget.`,
      },
      {
        clave: "llamadas_a_modelos_en_la_vitrina",
        etiqueta: es
          ? "llamadas a modelos al visitar la vitrina"
          : "model calls when visiting the showcase",
        valor: 0,
        unidad: es ? "llamadas" : "calls",
        fuente: "declarado",
        detalle: es
          ? "Lo fija la arquitectura: la vitrina es un export estático con los datos precalculados; el paquete se prueba sin una sola solicitud fuera de su origen."
          : "Set by the architecture: the showcase is a static export with precomputed data; the package is tested without a single request outside its origin.",
      },
      {
        clave: "costo_de_una_corrida",
        etiqueta: es
          ? `costo nominal de una corrida de ${n} casos`
          : `nominal cost of a ${n}-case run`,
        valor: costo,
        unidad: "US$",
        fuente: "calculada",
        detalle: es
          ? "Suma del costo nominal que el CLI declara por llamada, en las trazas de la corrida; por la suscripción no se pagó aparte."
          : "Sum of the nominal cost the CLI declares per call, over the run's traces; through the subscription it was not paid separately.",
      },
      {
        clave: "funcionalidades",
        etiqueta: es ? "funcionalidades construidas" : "built features",
        valor: total,
        unidad: es ? "funcionalidades" : "features",
        fuente: "medido",
        detalle: es
          ? "Las de la visión del producto marcadas para el corte de dos semanas, contadas contra docs/MANUAL-DE-USO.md; las del roadmap no cuentan."
          : "Those of the product vision marked for the two-week cut, counted against docs/MANUAL-DE-USO.md; roadmap ones do not count.",
      },
      {
        clave: "decisiones_registradas",
        etiqueta: es
          ? "decisiones de arquitectura registradas"
          : "recorded architecture decisions",
        valor: repo.adrs,
        unidad: "ADR",
        fuente: "medido",
        detalle: es ? "Archivos de decisions/." : "Files in decisions/.",
      },
    ],
    stack: APP.stack.map((s) => ({
      nombre: X(s.nombre, i),
      papel: X(s.papel, i),
    })),
    privacidad: {
      detalle: X(APP.privacidad.detalle, i),
      datos_sinteticos: APP.privacidad.datos_sinteticos,
      llamadas_a_modelos_en_la_vitrina:
        APP.privacidad.llamadas_a_modelos_en_la_vitrina,
      red_saliente_en_la_vitrina: APP.privacidad.red_saliente_en_la_vitrina,
    },
    enlaces: {
      produccion: null,
      razon: X(APP.enlaces.razon, i),
      repositorio: null,
      razon_repositorio: X(APP.enlaces.razon_repositorio, i),
      brochure_archivo: X(APP.enlaces.brochure_archivo, i),
      brochure_ruta_local: X(APP.enlaces.brochure_ruta_local, i),
    },
  };
}

export interface Complemento {
  schema_version: string;
  app: string;
  procedencia: "app" | "cv-viva" | "planeadora";
  declarado_en: string;
  titular: string;
  cifras_destacadas: string[];
  limites: string[];
  nunca: string[];
}

/** Las cifras que planlang propone destacar (claves del export). */
export const CIFRAS_DESTACADAS = [
  "criterios_cumplidos",
  "decisiones_cruzadas",
  "casos_por_corrida",
  "llamadas_a_modelos_en_la_vitrina",
  "costo_de_una_corrida",
];

/** El complemento que planlang propone a la planeadora (formato de `vitrina/apps/<slug>.complemento.json`). */
export function complementoPropuesto(d: DatosDemo, i: Idioma): Complemento {
  return {
    schema_version: "1.0.0",
    app: APP.slug,
    procedencia: "app",
    declarado_en: d.informe.ficha_reproducibilidad.corrida.fecha,
    titular: X(APP.titular, i),
    cifras_destacadas: CIFRAS_DESTACADAS,
    limites: APP.limites.map((t) => X(t, i)),
    nunca: APP.nunca.map((t) => X(t, i)),
  };
}

/**
 * La ficha de la app como la armaría la planeadora: réplica de `vitrina/armar.py` (export + complemento → ficha),
 * con su misma `schema_version` y sus mismos hitos. Una cifra destacada que no exista en el export detiene el build.
 */
export function armarFichaApp(
  exp: BrochureExport,
  comp: Complemento,
): FichaTecnica {
  if (comp.app !== exp.app.slug)
    throw new Error(
      `fichas: complemento de «${comp.app}» aplicado a «${exp.app.slug}».`,
    );
  const cifras = comp.cifras_destacadas.map((clave) => {
    const m = exp.metricas.find((x) => x.clave === clave);
    if (!m)
      throw new Error(
        `fichas: la cifra destacada «${clave}» no existe en el export (disponibles: ${exp.metricas.map((x) => x.clave).join(", ")}).`,
      );
    return {
      clave: m.clave,
      valor: m.valor,
      unidad: m.unidad,
      etiqueta: m.etiqueta,
      fuente: m.fuente,
      detalle: m.detalle,
    };
  });
  const a = exp.app;
  const dec = exp.metricas.find((m) => m.clave === "decisiones_registradas");
  return {
    schema_version: "1.1.0",
    actualizado: exp.actualizado,
    pieza: {
      slug: a.slug,
      nombre: a.nombre,
      frente: "apps",
      estado: a.estado,
      ciclo: a.ciclo,
      version: a.version_repo,
      sellado_en: a.sellado_en,
      sprints_cerrados: a.sprints_cerrados,
    },
    promesa: {
      tagline: exp.promesa.tagline,
      intro: exp.promesa.intro,
      para_quien: exp.promesa.para_quien,
    },
    titular: comp.titular,
    stack: exp.stack.map((s) => ({ nombre: s.nombre, papel: s.papel })),
    cifras,
    bloques: exp.funcionalidades.grupos.map((g) => ({
      orden: g.orden,
      nombre: g.nombre,
      linea: g.linea,
      cuenta: g.features.length,
    })),
    limites: comp.limites,
    nunca: comp.nunca,
    hitos: [
      { valor: a.ciclo, etiqueta: "ciclo" },
      { valor: String(a.sprints_cerrados), etiqueta: "sprints" },
      a.sellado_en
        ? { valor: a.sellado_en, etiqueta: "sellada" }
        : { valor: "—", etiqueta: "construccion" },
      { valor: `v${a.version_repo}`, etiqueta: "version" },
      ...(dec
        ? [{ valor: String(dec.valor), etiqueta: "decisiones registradas" }]
        : []),
    ],
  };
}
