/**
 * Arma lo que planlang entrega a hoja-de-vida, desde los datos del demo y los hechos del repositorio:
 * - la ficha de cada agente (contrato ficha técnica v1.3.1, frente Agentes): el texto redactado de `src/textos/fichas.ts`
 *   (A) o `src/textos/demo-b/fichas.ts` (B) y las cifras del informe, la corrida y el plan de su demo;
 * - el `brochure-export.json` (contrato 1.0.0): los hechos de la app, que cuentan todos los demos, de los que
 *   hoja-de-vida arma su ficha;
 * - el complemento que planlang propone para la ficha de la app (titular, cifras destacadas, límites, nunca);
 * - y la ficha de la app tal como la arma hoja-de-vida en su build: réplica de su `armarFichaTecnica`
 *   (export + complemento; huella de ese código en `docs/contratos/hoja-de-vida/CONTRATO.lock`).
 * Un idioma por ficha, como pide el contrato; se entrega el español y el inglés queda para la vitrina.
 */
import type { Idioma, TextoBilingue } from "@core/formatos/bilingue";
import { DEMOS, type IdDemo } from "@/lib/demos";
import type { DatosDeLosDemos, DatosDemo } from "@/lib/datos/vitrina";
import type { HechosDelRepo } from "@/lib/datos/repo";
import { numeroTal, versionCorta } from "@/lib/vista/formato";
import { AGENTE_B } from "@/textos/demo-b/fichas";
import { DEMO_TEXTO } from "@/textos/demo";
import { AGENTE, APP, METRICAS_APP as M } from "@/textos/fichas";
import { VERSION_EXPORT, VERSION_FICHA } from "./contrato";
import type { BrochureExport, CifraFicha, FichaTecnica } from "./tipos";

const X = (t: TextoBilingue, i: Idioma) => t[i];

/** Frases redactadas en cada idioma, una tras otra (el detalle de una cifra que suma los demos). */
const unir = (frases: TextoBilingue[]): TextoBilingue => ({
  es: frases.map((f) => f.es).join(" "),
  en: frases.map((f) => f.en).join(" "),
});

/**
 * «Actualizado»: la fecha más reciente de lo que la ficha cuenta (la corrida, la aprobación del plan y, en la de la
 * app, los ADR y los summaries), no solo la de la corrida (AU-S2-B41). Fechas ISO: se comparan como texto.
 */
function masReciente(...fechas: (string | null | undefined)[]): string {
  return fechas
    .filter((f): f is string => typeof f === "string" && f !== "")
    .sort()
    .at(-1)!;
}

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

/** Los nodos del contrato del grafo, en el orden del plan. */
function nodosDelPlan(d: DatosDemo): string[] {
  return d.plan.contrato_de_grafo.nodos_esperados.map((n) => n.id);
}

// ------------------------------------------------------------------------------------------- agentes

/** Lo que la ficha de un agente redacta igual en los dos demos (las cifras las arma cada demo). */
type TextosFicha = Pick<
  typeof AGENTE,
  | "slug"
  | "nombre"
  | "tagline"
  | "para_quien"
  | "intro"
  | "titular"
  | "stack"
  | "stackNombre"
  | "bloques"
  | "limites"
  | "nunca"
  | "proceso"
>;

/** Las cifras del agente A: exactitud con pass^k (C5), latencia mediana (C7), pausas, negaciones sin persona y costo. */
function cifrasAgenteA(d: DatosDemo, i: Idioma): CifraFicha[] {
  const inf = d.informe;
  const n = inf.ficha_reproducibilidad.corrida.casos_ejecutados;
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
      etiqueta: X(
        C.exactitud.etiqueta({
          k: c5.k?.observado ?? 1,
          requerido: c5.k?.requerido ?? null,
        }),
        i,
      ),
      fuente: "medido",
      detalle: X(
        C.exactitud.detalle({
          n: c5.n_poblacion,
          k: c5.k?.observado ?? 1,
          requerido: c5.k?.requerido ?? null,
        }),
        i,
      ),
    },
    {
      clave: "latencia_mediana",
      valor: red(c7.valor_medido, 1),
      unidad: X(C.latencia.unidad, i),
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
          total: numeroTal(costo, i),
          n,
        }),
        i,
      ),
    },
  ];
  return cifras;
}

/**
 * Las cifras del agente B: exactitud de extracción (C5), casos con el oficial, coincidencias en listas sin persona
 * (C1), rechazos sin persona (C2) y costo por caso. El plan B no fija latencia: la ficha no la inventa.
 */
function cifrasAgenteB(d: DatosDemo, i: Idioma): CifraFicha[] {
  const inf = d.informe;
  const n = inf.ficha_reproducibilidad.corrida.casos_ejecutados;
  const c1 = criterio(d, "C1");
  const c2 = criterio(d, "C2");
  const c5 = criterio(d, "C5");
  if (typeof c5.valor_medido !== "number")
    throw new Error("fichas: C5 del plan B sin valor medido.");
  const costo = costoDeLaCorrida(d);
  const C = AGENTE_B.cifras;
  return [
    {
      clave: "exactitud_extraccion",
      valor: red(c5.valor_medido * 100, 1),
      unidad: "%",
      etiqueta: X(C.exactitud.etiqueta, i),
      fuente: "medido",
      detalle: X(C.exactitud.detalle(c5.n_poblacion), i),
    },
    {
      clave: "casos_con_persona",
      valor: inf.contrato_de_grafo.pausas.casos_con_pausa,
      etiqueta: X(C.personas.etiqueta(n), i),
      fuente: "medido",
      detalle: X(C.personas.detalle, i),
    },
    {
      clave: "coincidencias_sin_persona",
      valor: c1.casos_que_incumplen.length,
      etiqueta: X(C.coincidencias.etiqueta, i),
      fuente: "medido",
      detalle: X(C.coincidencias.detalle(c1.n_poblacion), i),
    },
    {
      clave: "rechazos_sin_persona",
      valor: c2.casos_que_incumplen.length,
      etiqueta: X(C.rechazos.etiqueta, i),
      fuente: "medido",
      detalle: X(C.rechazos.detalle(c2.n_poblacion), i),
    },
    {
      clave: "costo_por_caso",
      valor: red(costo / n, 3),
      unidad: "US$",
      etiqueta: X(C.costo.etiqueta, i),
      fuente: "calculada",
      detalle: X(C.costo.detalle({ total: numeroTal(costo, i), n }), i),
    },
  ];
}

/** Los textos de la ficha de cada agente (un demo nuevo no compila sin los suyos). */
const TEXTOS_FICHA: Readonly<Record<IdDemo, TextosFicha>> = {
  "demo-a": AGENTE,
  "demo-b": AGENTE_B,
};

/** Las cifras de cada agente. Un `switch` sin `default`: un demo nuevo no compila hasta tener las suyas. */
function cifrasDe(d: DatosDemo, i: Idioma): CifraFicha[] {
  switch (d.id) {
    case "demo-a":
      return cifrasAgenteA(d, i);
    case "demo-b":
      return cifrasAgenteB(d, i);
  }
}

/** La ficha del agente del demo: sus textos y sus cifras; la forma es la misma en los dos. */
export function fichaAgente(
  d: DatosDemo,
  repo: HechosDelRepo,
  i: Idioma,
): FichaTecnica {
  const AG = TEXTOS_FICHA[d.id];
  const inf = d.informe;
  const rep = inf.ficha_reproducibilidad;
  const cifras = cifrasDe(d, i);
  const nodos = nodosDelPlan(d);
  // `cuenta` en 0: hoja-de-vida la pinta como «N funcionalidades» y un nodo del grafo no las tiene; con 0 la calla.
  const bloques = nodos.map((id, k) => {
    const b = AG.bloques[id];
    if (!b)
      throw new Error(
        `fichas: el nodo «${id}» del contrato no tiene su bloque en la ficha del agente de ${d.id}.`,
      );
    return {
      orden: k + 1,
      nombre: X(b.nombre, i),
      linea: X(b.linea, i),
      cuenta: 0,
    };
  });
  const P = AG.proceso;
  const ct = inf.contrato_de_grafo;
  const decisiones = ct.rf_09_2.reduce((s, r) => s + r.visitas, 0);
  const versionPlan = versionCorta(inf.plan_en_breve.version);
  const entorno = d.entorno.paquetes;
  const mm = (v: string) => v.split(".").slice(0, 2).join(".");
  return {
    schema_version: VERSION_FICHA,
    actualizado: masReciente(rep.corrida.fecha, d.plan.aprobado_el),
    pieza: {
      slug: AG.slug,
      nombre: X(AG.nombre, i),
      frente: "agentes",
      estado: "inicial",
      ciclo: "H1",
      // La versión del plan que gobierna al agente, en semver: hoja-de-vida la pinta como «v{version}».
      version: inf.plan_en_breve.version,
      sellado_en: null,
      sprints_cerrados: repo.sprintsCerrados,
    },
    promesa: {
      tagline: X(AG.tagline, i),
      intro: X(AG.intro, i),
      para_quien: X(AG.para_quien, i),
    },
    titular: X(AG.titular, i),
    stack: [
      {
        nombre: `LangGraph ${mm(entorno.langgraph)}`,
        papel: X(AG.stack.langgraph, i),
      },
      {
        nombre: `LangChain ${mm(entorno.langchain)}`,
        papel: X(AG.stack.langchain, i),
      },
      {
        nombre: `Python ${mm(d.entorno.python)}`,
        papel: X(AG.stack.python, i),
      },
      {
        nombre: X(AG.stackNombre.modelo, i),
        papel: X(AG.stack.modelo, i),
      },
      {
        nombre: X(AG.stackNombre.reglas, i),
        papel: X(AG.stack.reglas, i),
      },
      { nombre: "planlang-trace/v1", papel: X(AG.stack.trazas, i) },
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
    limites: AG.limites.map((t) => X(t, i)),
    nunca: AG.nunca.map((t) => X(t, i)),
    hitos: [
      { valor: versionPlan, etiqueta: X(AGENTE.hitos.plan, i) },
      { valor: rep.corrida.fecha, etiqueta: X(AGENTE.hitos.corrida, i) },
      {
        valor: X(
          AGENTE.hitos.piezasValor({
            a: ct.nodos.filter((x) => x.en_grafo).length,
            b: ct.nodos.length,
          }),
          i,
        ),
        etiqueta: X(AGENTE.hitos.piezas, i),
      },
      { valor: String(decisiones), etiqueta: X(AGENTE.hitos.decisiones, i) },
    ],
  };
}

// ------------------------------------------------------------------------------------------- la app

/**
 * Los hechos de la app (contrato brochure-export 1.0.0), con todos los demos de la vitrina: los criterios, las
 * decisiones cruzadas, los casos y el costo se suman, y cada detalle dice cuánto puso cada demo. Lo cuenta todo desde
 * los datos: nada se escribe a mano.
 */
export function brochureExport(
  ds: DatosDeLosDemos,
  repo: HechosDelRepo,
  i: Idioma,
): BrochureExport {
  const todos = DEMOS.map((id) => ({ id, d: ds[id] as DatosDemo }));
  const nombre = (id: (typeof DEMOS)[number]) => X(DEMO_TEXTO[id].corto, i);
  const rf = todos.flatMap(({ d }) => d.informe.contrato_de_grafo.rf_09_2);
  const decisiones = rf.reduce((s, r) => s + r.visitas, 0);
  const diferencias = rf.reduce((s, r) => s + r.discrepancias, 0);
  const criterios = todos.flatMap(({ d }) => d.informe.criterios);
  const cumplen = criterios.filter((c) => c.estado === "cumple").length;
  const casos = todos.reduce(
    (s, { d }) => s + d.informe.ficha_reproducibilidad.corrida.casos_ejecutados,
    0,
  );
  const costos = todos.map(({ id, d }) => ({
    id,
    d,
    costo: costoDeLaCorrida(d),
  }));
  // Redondeo a 4 decimales: la suma de dos flotantes no debe dejar colas como 0,96339999.
  const costo = red(
    costos.reduce((s, c) => s + c.costo, 0),
    4,
  );
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
  return {
    _schema: repo.bloqueSchema,
    schema_version: VERSION_EXPORT,
    actualizado: masReciente(
      ...todos.flatMap(({ d }) => [
        d.informe.ficha_reproducibilidad.corrida.fecha,
        d.plan.aprobado_el,
      ]),
      repo.ultimaFecha,
    ),
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
        etiqueta: X(
          M.criteriosCumplidos.etiqueta({
            n: criterios.length,
            demos: todos.length,
          }),
          i,
        ),
        valor: cumplen,
        unidad: X(M.criteriosCumplidos.unidad, i),
        fuente: "medido",
        detalle: X(
          unir(
            todos.map(({ id, d }) =>
              M.criteriosCumplidos.deUnDemo({
                demo: nombre(id),
                verificador: d.informe.version_verificador,
                corrida: d.informe.corrida_id,
                cumplen: d.informe.criterios.filter(
                  (c) => c.estado === "cumple",
                ).length,
                n: d.informe.criterios.length,
              }),
            ),
          ),
          i,
        ),
      },
      {
        clave: "decisiones_cruzadas",
        etiqueta: X(M.decisionesCruzadas.etiqueta(diferencias), i),
        valor: decisiones,
        unidad: X(M.decisionesCruzadas.unidad, i),
        fuente: "medido",
        detalle: X(
          M.decisionesCruzadas.detalle({
            corridas: rf.length,
            demos: todos.length,
          }),
          i,
        ),
      },
      {
        clave: "casos_sinteticos",
        etiqueta: X(M.casosSinteticos.etiqueta(todos.length), i),
        valor: casos,
        unidad: X(M.casosSinteticos.unidad, i),
        fuente: "medido",
        detalle: X(
          unir(
            todos.map(({ id, d }) => {
              const rep = d.informe.ficha_reproducibilidad;
              return M.casosSinteticos.deUnDemo({
                demo: nombre(id),
                n: rep.corrida.casos_ejecutados,
                corrida: rep.corrida.id,
                repeticiones: rep.repeticiones.length,
                base: rep.linea_base !== null,
              });
            }),
          ),
          i,
        ),
      },
      {
        clave: "llamadas_a_modelos_en_la_vitrina",
        etiqueta: X(M.llamadasEnLaVitrina.etiqueta, i),
        valor: 0,
        unidad: X(M.llamadasEnLaVitrina.unidad, i),
        fuente: "declarado",
        detalle: X(M.llamadasEnLaVitrina.detalle, i),
      },
      {
        clave: "costo_de_una_corrida",
        etiqueta: X(M.costoDeUnaCorrida.etiqueta(casos), i),
        valor: costo,
        unidad: "US$",
        fuente: "calculada",
        detalle: X(
          unir([
            ...costos.map(({ id, d, costo: c }) =>
              M.costoDeUnaCorrida.deUnDemo({
                demo: nombre(id),
                costo: numeroTal(c, i),
                n: d.informe.ficha_reproducibilidad.corrida.casos_ejecutados,
              }),
            ),
            M.costoDeUnaCorrida.detalle,
          ]),
          i,
        ),
      },
      {
        clave: "funcionalidades",
        etiqueta: X(M.funcionalidades.etiqueta, i),
        valor: total,
        unidad: X(M.funcionalidades.unidad, i),
        fuente: "medido",
        detalle: X(M.funcionalidades.detalle, i),
      },
      {
        clave: "decisiones_registradas",
        etiqueta: X(M.decisionesRegistradas.etiqueta, i),
        valor: repo.adrs,
        unidad: "ADR",
        fuente: "medido",
        detalle: X(M.decisionesRegistradas.detalle, i),
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
  /** Solo con un proceso: hoja-de-vida rechaza una procedencia sin proceso, y la ficha de la app no lo trae. */
  procedencia?: "app" | "cv-viva" | "planeadora";
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
  "casos_sinteticos",
  "llamadas_a_modelos_en_la_vitrina",
  "costo_de_una_corrida",
];

/**
 * El complemento que planlang propone para su ficha (en hoja-de-vida vive en `data/fichas/<slug>.yaml`); se declara
 * en la fecha de la corrida más reciente de los demos.
 */
export function complementoPropuesto(
  ds: DatosDeLosDemos,
  i: Idioma,
): Complemento {
  return {
    schema_version: "1.0.0",
    app: APP.slug,
    declarado_en: masReciente(
      ...DEMOS.map((id) => ds[id].informe.ficha_reproducibilidad.corrida.fecha),
    ),
    titular: X(APP.titular, i),
    cifras_destacadas: CIFRAS_DESTACADAS,
    limites: APP.limites.map((t) => X(t, i)),
    nunca: APP.nunca.map((t) => X(t, i)),
  };
}

/**
 * La ficha de la app como la arma hoja-de-vida: réplica de su `armarFichaTecnica` (export + complemento → ficha),
 * con su misma `schema_version` y los hitos como claves que su componente traduce. Una cifra destacada que no exista
 * en el export detiene el build.
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
    schema_version: VERSION_FICHA,
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
      ...(dec ? [{ valor: String(dec.valor), etiqueta: "decisiones" }] : []),
    ],
  };
}
