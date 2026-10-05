/**
 * Vista de P4 Brecha: arma lo que se pinta desde el informe que declara el manifiesto, el plan con que se midió y la
 * corrida verificada. Las cuentas (cumplidos, fallidos, sin probar), las frases con cifras y el orden salen de los
 * datos; lo editorial por elemento vive en `src/textos/brecha.ts` y se pide por id y estado: si el informe trae una
 * falla sin lectura, la vista lanza nombrándola, en vez de inventar una.
 */
import type { Idioma, TextoBilingue } from "@core/formatos/bilingue";
import type { ResultadoCriterio } from "@core/brecha/criterios";
import type { ResultadoRiesgo } from "@core/brecha/detectores";
import type { BrechaNoPrevista } from "@core/brecha/brechas-no-previstas";
import type { ResultadoSupuesto } from "@core/brecha/supuestos";
import type { CategoriaBrecha } from "@core/brecha/brechas-no-previstas";
import { SENAL_DE_CONFIANZA } from "@core/brecha/contexto";
import { numCorto } from "@core/brecha/numeros";
import { compactar } from "@core/playground/compactar";
import type { Compacto } from "@core/playground/compacto";
import { consecuencias, umbralesDelPlan } from "@core/playground/consecuencias";
import type { Plan } from "@core/plan/esquema";
import type { DatosDemo } from "@/lib/datos/vitrina";
import type { IdDemo } from "@/lib/demos";
import { DEMO_TEXTO } from "@/textos/demo";
import { ruta } from "@/lib/ruta";
import { umbralDeCategoria } from "./motivo-pausa";
import { delVocabulario } from "./vocabulario";
import { conPlan } from "./plan-en-texto";
import {
  BALANCE,
  BRECHAS,
  CATEGORIA_LECTURA,
  COLUMNAS,
  CRITERIOS,
  CUMPLIDO,
  CATEGORIA_CORTA,
  CRITERIO_EXIGENTE,
  EJEMPLARES,
  ESTADO_EVALUADOR,
  EXPERTO,
  ETIQUETA_FILA,
  FRASE,
  IPO,
  LECTURA_BRECHA,
  LECTURA_NOTA,
  LECTURA_SUPUESTO,
  NODO_EN_FRASE,
  PASO,
  PASO_FUERA,
  PLAN_EN_BREVE,
  PLAYGROUND,
  PORTADA,
  RESUMEN,
  RIESGOS,
  SECCIONES,
  SUPUESTOS,
  TIPO_EVALUADOR,
  VARIANTE,
} from "@/textos/brecha";
import { CRITERIO } from "@/textos/plan";
import { SUBTIPO } from "@/textos/caso";
import { VEREDICTOS } from "@/textos/comun";
import { APAGADO, ENCENDIDO } from "@/textos/plan-comun";
import {
  claseDeVeredicto,
  type ClaseDeVeredicto,
} from "@/components/veredicto";
import type { Fila } from "./agente";
import { pieDeCorrida } from "./caso";
import { filasDeReproducibilidad } from "./reproducibilidad";
import {
  decimal,
  deCada,
  entero,
  enumerar,
  numeroDato,
  porcentaje,
  versionCorta,
} from "./formato";
import {
  controlLegal,
  criticidadEnTexto,
  estadoDeCriterio,
  estadoDeRiesgo,
  estadoDeSupuesto,
  prioridad,
  type ClaseDeEstado,
  type EstadoMedido,
} from "./plan-comun";

const X = (t: TextoBilingue, i: Idioma) => t[i];

/**
 * Un detector sin población cubre todos los casos; se escribe con la palabra del lenguaje de reglas del plan, como
 * `IMPLICA`: es código, igual en los dos idiomas.
 */
const TODOS_EN_EL_PLAN = "todos";

/** El veredicto en palabras, en minúscula para la línea del experto; uno sin nombre detiene el build. */
function textoDeVeredicto(valor: string, i: Idioma): string {
  const t = (VEREDICTOS as Record<string, TextoBilingue>)[valor];
  if (!t)
    throw new Error(
      `vitrina: el veredicto «${valor}» no tiene nombre en src/textos/comun.ts`,
    );
  return t[i].toLowerCase();
}

function criterioExigente(demo: IdDemo, id: string): TextoBilingue {
  const t = CRITERIO_EXIGENTE[demo][id];
  if (!t)
    throw new Error(
      `vitrina: el criterio «${id}» es el más exigente (pass^k) y no tiene su nombre corto en src/textos/brecha.ts (CRITERIO_EXIGENTE)`,
    );
  return t;
}

/** El umbral sobre el que corre la curva riesgo-cobertura de un supuesto: el de la señal de confianza del plan. */
function umbralDeLaCurva(plan: Plan, supuesto: string) {
  const u = plan.umbrales.find((x) => x.senal === SENAL_DE_CONFIANZA);
  if (!u)
    throw new Error(
      `vitrina: el supuesto «${supuesto}» trae curva riesgo-cobertura, pero el plan no tiene un umbral sobre «${SENAL_DE_CONFIANZA}»`,
    );
  return u;
}

// ------------------------------------------------------------------------------------------------ tipos

export interface Celda {
  cifra: string;
  ids: string;
  href?: string;
}
export interface FilaBalance {
  clave: string;
  parte: string;
  nota: string;
  pideLider: string;
  pideExperto: string;
  cumplio: Celda | null;
  fallo: Celda | null;
  sinProbar: Celda | null;
}

export interface FilaFallo {
  ancla: string;
  clase: ClaseDeVeredicto;
  etiqueta: string;
  codigo: string;
  titulo: string;
  lider: [string, string, string];
  experto: [string, string, string];
  casos: { id: string; href: string }[];
  enlaces: { href: string; texto: string }[];
}

export interface ItemCumplido {
  codigo: string;
  texto: string;
  href?: string;
  experto: string;
  valor: string;
  clase: ClaseDeEstado;
}

export interface FilaCriterio {
  id: string;
  enunciado: string;
  regla: string;
  nota: string | null;
  medido: { rotulo: string; valor: string };
  objetivo: string;
  /** Pista: lo medido y la meta en % del ancho. */
  pista: { medido: number; meta: number };
  ejes: { desde: string; centro: string | null; hasta: string } | null;
  estado: EstadoMedido;
  casos: { id: string; href: string }[];
}

export interface FilaRiesgo {
  id: string;
  modo: string;
  medida: string;
  detector: string;
  efecto: string;
  causa: string;
  ap: { barras: number; texto: string };
  rpn: string;
  /** «control legal (tabla: baja)» cuando el control legal sube la prioridad de la tabla (instrumentos 0.2.0). */
  legal: string | null;
  estado: EstadoMedido;
  casos: { id: string; href: string }[];
}

export interface SupuestoVista {
  id: string;
  enunciado: string;
  estado: EstadoMedido;
  criticidad: string;
  dio: string;
  reglita: string;
  medidas: Fila[];
  notas: string[];
  grafico:
    | {
        tipo: "curva";
        /** El id del umbral sobre el que corre la curva (el de la señal de confianza del plan). */
        umbral: string;
        puntos: PuntoCurva[];
        plan: number;
        pie: string;
        chip: string;
        n: number;
      }
    | {
        tipo: "comparacion";
        filas: {
          t: string;
          n: string | null;
          multi: { v: string; ancho: number };
          unico: { v: string; ancho: number };
        }[];
        leyenda: [string, string];
        pie: string;
        chip: string;
      }
    | { tipo: "cifras"; cifras: { cifra: string; texto: string }[] }
    | null;
}

export interface PuntoCurva {
  umbral: number;
  cobertura: number;
  /** null si con ese umbral ningún caso queda para el agente solo (el riesgo no existe). */
  riesgo: number | null;
  aceptados: number;
}

export interface Ejemplar {
  rol: string;
  caso: { id: string; tipo: string } | null;
  texto: string;
  cadena: { id: string; tipo: string }[];
  decision: string | null;
  persona: string | null;
  href: string | null;
  etiquetaCadena: string;
}

export interface VistaBrecha {
  portada: { antetitulo: string };
  veredicto: {
    clase: ClaseDeVeredicto;
    texto: string;
    lider: string;
    experto: string;
    recomendacion: string;
  };
  balance: FilaBalance[];
  fallos: FilaFallo[];
  sinProbar: FilaFallo[];
  conNota: FilaFallo[];
  cumplido: {
    total: number;
    criterios: { titulo: string; items: ItemCumplido[] };
    riesgos: { titulo: string; items: ItemCumplido[] };
    ademas: { titulo: string; items: ItemCumplido[] };
  };
  ipo: {
    recibe: { titulo: string; detalle: string }[];
    hace: string[];
    haceSub: string;
    entrega: { titulo: string; detalle: string }[];
  };
  fuente: { texto: string; chip: string };
  indice: { id: string; n: number; titulo: string }[];
  resumen: {
    lectura: string;
    destacados: {
      id: string;
      criterio: string;
      medido: string;
      estado: EstadoMedido;
    }[];
    riesgos: string;
  };
  planEnBreve: {
    problema: string;
    flujoTitulo: string;
    flujo: string[];
    unaVia: { id: string; pregunta: string; justificacion: string | null }[];
    otras: string | null;
  };
  criterios: { chip: string; lectura: string; filas: FilaCriterio[] };
  riesgos: {
    chip: string;
    lectura: string;
    filas: FilaRiesgo[];
    construidoNota: string;
    visitas: {
      id: string;
      tipo: string;
      visitas: number;
      ancho: number;
      en_grafo: boolean;
    }[];
    senalesYPausas: string;
    otroLenguaje: string;
    rf: {
      corrida: string;
      variante: string;
      decisiones: number;
      diferencias: number;
      coincide: boolean;
    }[];
  };
  brechas: {
    chip: string;
    lectura: string;
    filas: {
      caso: string | null;
      href: string | null;
      corrida: string;
      nodo: { id: string; tipo: string } | null;
      paso: number | null;
      reintentos: string;
      detalle: string;
    }[];
    evaluadores: {
      id: string;
      tipo: string;
      estado: string;
      casos: number;
      fallas: string;
      noEvaluables: number;
      riesgos: string;
    }[];
  };
  supuestos: SupuestoVista[];
  ejemplares: { chip: string; lista: Ejemplar[] };
  playground: {
    lectura: string;
    filas: {
      id: string;
      nombre: string;
      descripcion: string;
      regla: string;
      rango: string;
      observado: string;
      justo: { id: string; href: string }[];
    }[];
    limites: string[];
    href: string;
  };
  ficha: { chip: string; filas: Fila[] };
  pie: string;
}

// ------------------------------------------------------------------------------------------------ utilidades

const NO_CUMPLIDOS_CRITERIO = new Set([
  "incompleto",
  "indeterminado",
  "sin_poblacion",
  "mal_formado",
]);
const NO_MEDIDOS_RIESGO = new Set([
  "indeterminado",
  "sin_poblacion",
  "no_detectable",
  "mal_formado",
]);
const MENOR_ES_MEJOR = new Set(["latencia", "costo"]);

function casosEnlazados(ids: readonly string[], demo: IdDemo, i: Idioma) {
  return ids.map((id) => ({ id, href: ruta(i, "caso", id, demo) }));
}

/** «C1–C9» si son los del plan en orden y sin huecos; si no, la lista. */
function rangoDeIds(ids: readonly string[], todos: readonly string[]): string {
  if (
    ids.length > 2 &&
    ids.length === todos.length &&
    ids.every((x, k) => x === todos[k])
  )
    return `${ids[0]}–${ids[ids.length - 1]}`;
  return ids.join(", ");
}

/** El prefijo común de las corridas, recortado en el último guion: «…v1.2», «…v1.2-r2». */
function cortarCorridas(ids: readonly string[]): (id: string) => string {
  if (ids.length < 2) return (id) => id;
  let p = ids[0] as string;
  for (const id of ids) while (!id.startsWith(p)) p = p.slice(0, -1);
  const corte = p.lastIndexOf("-");
  if (corte <= 0) return (id) => id;
  return (id) => `…${id.slice(corte + 1)}`;
}

function segundos(x: number, i: Idioma, d = 1): string {
  return `${decimal(x, d, i)} s`;
}

function objetivoDe(c: ResultadoCriterio, i: Idioma): string {
  if (typeof c.objetivo === "boolean") return X(CRITERIOS.todos, i);
  const op = MENOR_ES_MEJOR.has(c.tipo) ? "≤" : "≥";
  const v =
    c.tipo === "latencia"
      ? segundos(c.objetivo, i, 0)
      : porcentaje(c.objetivo, i);
  return `${op} ${v}`;
}

function valorDe(c: ResultadoCriterio, i: Idioma): string {
  if (c.valor_medido === null) return "—";
  if (typeof c.valor_medido === "boolean")
    return deCada(
      c.n_poblacion - c.casos_que_incumplen.length,
      c.n_poblacion,
      i,
    );
  if (c.tipo === "latencia") return segundos(c.valor_medido, i);
  return porcentaje(c.valor_medido, i);
}

function reglaDe(c: ResultadoCriterio): string {
  const partes = [c.poblacion];
  if (c.condicion) partes.push(c.condicion);
  const base = c.metrica ? `${c.agregacion}(${c.metrica})` : partes.join(" → ");
  return c.metrica
    ? base
    : `${base} · ${c.agregacion === "pass^k" && c.k ? `pass^${c.k.requerido}` : c.agregacion}`;
}

function lecturaSupuesto(demo: IdDemo, s: ResultadoSupuesto) {
  const l = LECTURA_SUPUESTO[demo][`${s.id}:${s.estado}`];
  if (!l)
    throw new Error(
      `vitrina: el informe marca ${s.id} «${s.estado}» y Brecha no tiene su lectura (src/textos/brecha.ts, LECTURA_SUPUESTO).`,
    );
  return l;
}

function lecturaBrecha(categoria: string) {
  const l = LECTURA_BRECHA[categoria];
  if (!l)
    throw new Error(
      `vitrina: el informe trae brechas «${categoria}» y Brecha no tiene su lectura (src/textos/brecha.ts, LECTURA_BRECHA).`,
    );
  return l;
}

/**
 * El valor más cercano al del plan, moviendo un solo umbral en su rango, con el que el criterio deja de cumplirse en
 * el playground (o null si ninguno lo hace). Es la misma cuenta que hace el visitante al mover el deslizador.
 */
export function umbralQueLoRompe(
  c: Compacto,
  criterio: string,
): { umbral: string; valor: number; casos: string[] } | null {
  const plan = umbralesDelPlan(c);
  let mejor: {
    umbral: string;
    valor: number;
    casos: string[];
    pasos: number;
  } | null = null;
  for (const u of c.umbrales) {
    if (u.rango === "booleano" || typeof u.valor_en_plan !== "number") continue;
    const { min, max, paso } = u.rango;
    for (const dir of [1, -1]) {
      for (let k = 1; ; k++) {
        const v = Math.round((u.valor_en_plan + dir * k * paso) * 1e6) / 1e6;
        if (v < min - 1e-9 || v > max + 1e-9) break;
        if (mejor && k >= mejor.pasos) break;
        const r = consecuencias(c, { ...plan, [u.id]: v });
        const x = r.criterios.find((y) => y.id === criterio);
        if (x?.estado === "incumple") {
          mejor = {
            umbral: u.id,
            valor: v,
            casos: x.casos_que_incumplen,
            pasos: k,
          };
          break;
        }
      }
    }
  }
  return mejor
    ? { umbral: mejor.umbral, valor: mejor.valor, casos: mejor.casos }
    : null;
}

// ------------------------------------------------------------------------------------------------ la vista

export function vistaBrecha(d: DatosDemo, i: Idioma): VistaBrecha {
  const inf = d.informe;
  const plan = d.plan;
  const compacto = compactar(
    plan,
    d.corrida,
    d.lote,
    inf,
    d.manifiesto.playground,
  );
  const idsCriterios = inf.criterios.map((c) => c.id);
  const corridaId = inf.corrida_id;
  const corridas = [
    corridaId,
    ...inf.ficha_reproducibilidad.repeticiones.map((r) => r.corrida_id),
  ];
  const corta = cortarCorridas([
    ...corridas,
    ...(inf.ficha_reproducibilidad.linea_base
      ? [inf.ficha_reproducibilidad.linea_base.corrida_id]
      : []),
  ]);
  const vCorrida = versionCorta(
    inf.ficha_reproducibilidad.corrida.plan_de_ejecucion.version,
  );
  const latenciaDe = new Map(
    d.corrida.trazas.map((t) => [
      t.caso_id,
      t.senales.latencia_total_s as number,
    ]),
  );

  // --------------------------------------------------------------------- clasificación
  const criteriosCumplen = inf.criterios.filter((c) => c.estado === "cumple");
  const criteriosFallan = inf.criterios.filter((c) => c.estado === "incumple");
  const criteriosSinProbar = inf.criterios.filter((c) =>
    NO_CUMPLIDOS_CRITERIO.has(c.estado),
  );
  const riesgosOcurridos = inf.riesgos.filter((r) => r.estado === "ocurrio");
  const riesgosNo = inf.riesgos.filter((r) => r.estado === "no_ocurrio");
  const riesgosSinMedir = inf.riesgos.filter((r) =>
    NO_MEDIDOS_RIESGO.has(r.estado),
  );
  const supConfirmados = inf.supuestos.filter((s) => s.estado === "confirmado");
  const supRefutados = inf.supuestos.filter((s) => s.estado === "refutado");
  const supSinProbar = inf.supuestos.filter((s) => s.estado === "sin_probar");
  const brechas = inf.brechas_no_previstas.brechas;
  const porCategoria = new Map<string, BrechaNoPrevista[]>();
  for (const b of brechas)
    porCategoria.set(b.categoria, [
      ...(porCategoria.get(b.categoria) ?? []),
      b,
    ]);
  const conNota = criteriosCumplen.filter(
    (c) =>
      c.nota !== null ||
      c.fuera_por_senal_nula > 0 ||
      c.casos_que_incumplen.length > 0,
  );
  const ct = inf.contrato_de_grafo;
  const nodosEnGrafo = ct.nodos.filter((n) => n.en_grafo).length;
  const senalesCompletas = ct.senales.filter(
    (s) => s.presente_en === s.de,
  ).length;
  const decisiones = ct.rf_09_2.reduce((n, r) => n + r.visitas, 0);
  const diferencias = ct.rf_09_2.reduce((n, r) => n + r.discrepancias, 0);
  const grafoBien =
    nodosEnGrafo === ct.nodos.length &&
    senalesCompletas === ct.senales.length &&
    ct.hallazgos.length === 0;

  // --------------------------------------------------------------------- veredicto
  const fallaronEs: string[] = [];
  const fallaronEn: string[] = [];
  for (const s of supRefutados) {
    const f = lecturaSupuesto(d.id, s).frase;
    fallaronEs.push(f.es);
    fallaronEn.push(f.en);
  }
  for (const c of criteriosFallan) {
    fallaronEs.push(`no se cumplió ${c.id}`);
    fallaronEn.push(`${c.id} was not met`);
  }
  for (const r of riesgosOcurridos) {
    fallaronEs.push(`ocurrió ${r.id} (${r.modo.es.toLowerCase()})`);
    fallaronEn.push(`${r.id} occurred (${r.modo.en.toLowerCase()})`);
  }
  for (const [cat, bs] of porCategoria) {
    const f = lecturaBrecha(cat).frase(bs.length);
    fallaronEs.push(f.es);
    fallaronEn.push(f.en);
  }
  const frases = [
    criteriosCumplen.length === inf.criterios.length &&
    riesgosOcurridos.length === 0
      ? X(
          FRASE.todoCumplido({
            criterios: inf.criterios.length,
            riesgos: inf.riesgos.length,
          }),
          i,
        )
      : X(
          FRASE.parcial({
            cumplen: criteriosCumplen.length,
            criterios: inf.criterios.length,
            ocurridos: riesgosOcurridos.length,
            riesgos: inf.riesgos.length,
          }),
          i,
        ),
  ];
  if (fallaronEs.length > 0)
    frases.push(
      X(
        FRASE.fallaron({
          n: fallaronEs.length,
          es: fallaronEs,
          en: fallaronEn,
        }),
        i,
      ),
    );
  if (supSinProbar.length > 0) {
    const ls = supSinProbar.map((s) => lecturaSupuesto(d.id, s).frase);
    frases.push(
      X(
        FRASE.sinProbar({ es: ls.map((l) => l.es), en: ls.map((l) => l.en) }),
        i,
      ),
    );
  }
  const totalReintentos = brechas.reduce((n, b) => n + (b.reintentos ?? 0), 0);
  const experto = [
    X(EXPERTO.veredicto(textoDeVeredicto(inf.veredicto.valor, i)), i),
    X(
      EXPERTO.criterios({
        a: criteriosCumplen.length,
        b: inf.criterios.length,
      }),
      i,
    ),
    X(
      EXPERTO.riesgosOcurridos({
        a: riesgosOcurridos.length,
        b: inf.riesgos.length,
      }),
      i,
    ),
    ...inf.supuestos.map(
      (s) =>
        `${s.id} ${estadoDeSupuesto(s.estado, i).texto.toLowerCase()}${detalleExpertoSupuesto(s, i)}`,
    ),
    ...(brechas.length > 0
      ? [
          X(
            EXPERTO.brechas({ n: brechas.length, reintentos: totalReintentos }),
            i,
          ),
        ]
      : []),
    X(EXPERTO.cruzada({ diferencias, decisiones }), i),
  ].join(" · ");
  const clase = claseDeVeredicto(inf.veredicto.valor);
  const veredicto = {
    clase,
    texto: X(
      VEREDICTOS[
        clase === "cumple"
          ? "cumple"
          : clase === "no-cumple"
            ? "no_cumple"
            : "cumple_con_alertas"
      ],
      i,
    ),
    lider: frases.join(" "),
    experto,
    recomendacion: X(inf.resumen.recomendacion, i),
  };

  // --------------------------------------------------------------------- balance
  const prioridades = { alta: 0, media: 0, baja: 0 };
  for (const r of inf.riesgos)
    prioridades[r.prioridad_de_accion as keyof typeof prioridades]++;
  const pideCriterios = (() => {
    const todos = inf.criterios.filter(
      (c) => c.agregacion === "todos_cumplen",
    ).length;
    const otros = inf.criterios
      .filter((c) => c.agregacion !== "todos_cumplen")
      .map((c) => {
        const ag =
          c.agregacion === "pass^k" && c.k
            ? `pass^${c.k.requerido}`
            : c.agregacion;
        const op = MENOR_ES_MEJOR.has(c.tipo) ? "≤" : "≥";
        const v =
          typeof c.objetivo === "number"
            ? c.tipo === "latencia"
              ? `${numeroDato(c.objetivo, i)} s`
              : decimal(c.objetivo, 2, i)
            : String(c.objetivo);
        return `${c.id} ${ag} ${op} ${v}`;
      });
    return [todos > 0 ? `${todos} × todos_cumplen` : "", ...otros]
      .filter(Boolean)
      .join(" · ");
  })();
  const pideSupuestos = plan.supuestos
    .map((s) => {
      const m = s.medible_en_trazas;
      if (!m) return s.id;
      if (m.comparacion) return X(EXPERTO.frenteABase(s.id), i);
      const u = m.umbral_confirmacion ?? {};
      const partes = Object.entries(u).map(([k, v]) => {
        const nombre = k.replace(/_(min|max)$/, "");
        const op = k.endsWith("_max") ? "≤" : "≥";
        return `${nombreMetrica(nombre, i)} ${op} ${decimal(Number(v), 2, i)}`;
      });
      return `${s.id} ${partes.join(" ∧ ")}`;
    })
    .join(" · ");
  const celda = (
    ids: string[],
    cifra?: string,
    ancla?: string,
  ): Celda | null =>
    ids.length === 0
      ? null
      : {
          cifra: cifra ?? String(ids.length),
          ids: ids.join(", "),
          ...(ancla ? { href: `#${ancla}` } : {}),
        };
  const balance: FilaBalance[] = [
    {
      clave: "criterios",
      parte: X(BALANCE.criterios.parte, i),
      nota: X(BALANCE.criterios.nota, i),
      pideLider: X(BALANCE.criterios.lider(inf.criterios.length), i),
      pideExperto: pideCriterios,
      cumplio:
        criteriosCumplen.length === 0
          ? null
          : {
              cifra: String(criteriosCumplen.length),
              ids: rangoDeIds(
                criteriosCumplen.map((c) => c.id),
                idsCriterios,
              ),
            },
      fallo: celda(
        criteriosFallan.map((c) => c.id),
        undefined,
        criteriosFallan[0] ? `f-${criteriosFallan[0].id}` : undefined,
      ),
      sinProbar: celda(
        criteriosSinProbar.map((c) => c.id),
        undefined,
        criteriosSinProbar[0] ? `f-${criteriosSinProbar[0].id}` : undefined,
      ),
    },
    {
      clave: "riesgos",
      parte: X(BALANCE.riesgos.parte, i),
      nota: X(BALANCE.riesgos.nota, i),
      pideLider: X(BALANCE.riesgos.lider(inf.riesgos.length), i),
      pideExperto: X(
        BALANCE.riesgos.experto({ n: inf.riesgos.length, ...prioridades }),
        i,
      ),
      cumplio:
        riesgosNo.length === 0
          ? null
          : {
              cifra: X(BALANCE.riesgos.noOcurrieron(riesgosNo.length), i),
              ids: "",
            },
      fallo:
        riesgosOcurridos.length === 0
          ? null
          : {
              cifra: X(BALANCE.riesgos.ocurrieron(riesgosOcurridos.length), i),
              ids: riesgosOcurridos.map((r) => r.id).join(", "),
              href: `#f-${riesgosOcurridos[0]!.id}`,
            },
      sinProbar: celda(
        riesgosSinMedir.map((r) => r.id),
        undefined,
        riesgosSinMedir[0] ? `f-${riesgosSinMedir[0].id}` : undefined,
      ),
    },
    {
      clave: "supuestos",
      parte: X(BALANCE.supuestos.parte, i),
      nota: X(BALANCE.supuestos.nota, i),
      pideLider: X(BALANCE.supuestos.lider, i),
      pideExperto: pideSupuestos,
      cumplio: celda(supConfirmados.map((s) => s.id)),
      fallo: celda(
        supRefutados.map((s) => s.id),
        undefined,
        supRefutados[0] ? `f-${supRefutados[0].id}` : undefined,
      ),
      sinProbar: celda(
        supSinProbar.map((s) => s.id),
        undefined,
        supSinProbar[0] ? `f-${supSinProbar[0].id}` : undefined,
      ),
    },
    {
      clave: "noPrevisto",
      parte: X(BALANCE.noPrevisto.parte, i),
      nota: X(BALANCE.noPrevisto.nota, i),
      pideLider: X(BALANCE.noPrevisto.lider, i),
      pideExperto: X(BALANCE.noPrevisto.experto, i),
      cumplio: null,
      fallo:
        brechas.length === 0
          ? null
          : {
              cifra: X(BALANCE.noPrevisto.fallas(brechas.length), i),
              ids: [...porCategoria.keys()]
                // La categoría ya pasó por LECTURA_BRECHA, que detiene el build si no la conoce; el tipo de
                // CATEGORIA_CORTA exige un nombre corto por cada categoría del núcleo.
                .map((c) => X(CATEGORIA_CORTA[c as CategoriaBrecha], i))
                .join(", "),
              href: "#f-np",
            },
      sinProbar: null,
    },
    {
      clave: "grafo",
      parte: X(BALANCE.grafo.parte, i),
      nota: X(BALANCE.grafo.nota, i),
      pideLider: X(
        BALANCE.grafo.lider({
          nodos: ct.nodos.length,
          senales: ct.senales.length,
        }),
        i,
      ),
      pideExperto: X(
        BALANCE.grafo.experto({
          nodos: ct.nodos.length,
          senales: ct.senales.length,
          rol: ct.pausas.rol,
        }),
        i,
      ),
      cumplio: grafoBien
        ? {
            cifra: deCada(nodosEnGrafo, ct.nodos.length, i),
            ids: X(
              BALANCE.grafo.senales({
                a: senalesCompletas,
                b: ct.senales.length,
              }),
              i,
            ),
          }
        : null,
      fallo: grafoBien
        ? null
        : {
            cifra: String(ct.nodos.length - nodosEnGrafo + ct.hallazgos.length),
            ids: ct.hallazgos.map((h) => h.codigo).join(", "),
            href: "#b4",
          },
      sinProbar: null,
    },
    {
      clave: "cruzada",
      parte: X(BALANCE.cruzada.parte, i),
      nota: X(BALANCE.cruzada.nota, i),
      pideLider: X(BALANCE.cruzada.lider, i),
      pideExperto: X(BALANCE.cruzada.experto(ct.rf_09_2.length), i),
      cumplio:
        diferencias === 0
          ? {
              cifra: deCada(decisiones, decisiones, i),
              ids: X(BALANCE.cruzada.decisiones, i),
            }
          : null,
      fallo:
        diferencias === 0
          ? null
          : {
              cifra: String(diferencias),
              ids: X(BALANCE.cruzada.decisiones, i),
              href: "#b4",
            },
      sinProbar: null,
    },
  ];

  // --------------------------------------------------------------------- lo que falló / sin probar / con nota
  const fallos: FilaFallo[] = [];
  for (const s of supRefutados)
    fallos.push(filaSupuesto(s, "fallo", plan, vCorrida, d.id, i));
  for (const c of criteriosFallan) fallos.push(filaCriterioFallido(c, d.id, i));
  for (const r of riesgosOcurridos)
    fallos.push(filaRiesgoOcurrido(r, plan, d.id, i));
  for (const [cat, bs] of porCategoria)
    fallos.push(
      filaBrecha(
        cat,
        bs,
        inf.riesgos.length,
        corridas.length,
        inf.brechas_no_previstas.evaluadores,
        corridaId,
        vCorrida,
        d.id,
        i,
      ),
    );
  const sinProbar: FilaFallo[] = [
    ...supSinProbar.map((s) =>
      filaSupuesto(s, "sinProbar", plan, vCorrida, d.id, i),
    ),
    ...criteriosSinProbar.map((c) => filaCriterioFallido(c, d.id, i, true)),
  ];
  const filasConNota = conNota.map((c) =>
    filaConNota(c, compacto, latenciaDe, plan, d.id, i),
  );

  // --------------------------------------------------------------------- lo que se cumplió
  const notaIds = new Set(conNota.map((c) => c.id));
  const itemsCriterios: ItemCumplido[] = criteriosCumplen.map((c) => ({
    codigo: c.id,
    texto: X(c.enunciado, i),
    ...(notaIds.has(c.id) ? { href: `#f-${c.id}` } : {}),
    experto: c.metrica
      ? `${c.agregacion}(${c.metrica}) ${MENOR_ES_MEJOR.has(c.tipo) ? "≤" : "≥"} ${typeof c.objetivo === "number" ? numeroDato(c.objetivo, i) : c.objetivo}`
      : `${c.poblacion} → ${c.condicion ?? ""}`,
    valor:
      c.agregacion === "pass^k" && c.k && typeof c.valor_medido === "number"
        ? X(
            CUMPLIDO.corridas({
              valor: porcentaje(c.valor_medido, i),
              k: c.k.observado,
              de: c.k.requerido,
            }),
            i,
          )
        : typeof c.valor_medido === "number"
          ? valorDe(c, i)
          : X(
              CUMPLIDO.casos({
                a: c.n_poblacion - c.casos_que_incumplen.length,
                b: c.n_poblacion,
              }),
              i,
            ),
    clase: notaIds.has(c.id) ? "alerta" : "cumple",
  }));
  const riesgoDelPlan = new Map(plan.riesgos.map((r) => [r.id, r]));
  const itemsRiesgos: ItemCumplido[] = riesgosNo.map((r) => {
    const p = riesgoDelPlan.get(r.id);
    const det = p?.detector_en_trazas;
    return {
      codigo: r.id,
      texto: X(r.modo, i),
      experto: `${det?.poblacion ?? TODOS_EN_EL_PLAN} → ${det?.condicion ?? "—"} · ${prioridad(r, i).texto} · S${r.severidad}·O${r.ocurrencia}·D${r.deteccion}`,
      valor:
        r.tipo_detector === "tasa" && typeof r.valor === "number"
          ? X(
              EXPERTO.deTotal({
                valor: porcentaje(r.valor, i),
                n: r.n_poblacion,
              }),
              i,
            )
          : X(
              (r.ambito === "sesion" ? CUMPLIDO.sesiones : CUMPLIDO.casos)({
                a: typeof r.valor === "number" ? r.valor : 0,
                b: r.n_poblacion,
              }),
              i,
            ),
      clase: "cumple",
    };
  });
  const itemsAdemas: ItemCumplido[] = [
    ...supConfirmados.map((s) => ({
      codigo: s.id,
      texto: X(s.enunciado, i),
      experto: `${Object.entries(s.metricas)
        .map(
          ([k, v]) =>
            `${nombreMetrica(k, i)} ${v === null ? "—" : valorMetrica(v, i)}`,
        )
        .join(
          " · ",
        )} · n = ${s.n} · ${estadoDeSupuesto(s.estado, i).texto.toLowerCase()}`,
      valor: X(CUMPLIDO.casos({ a: s.n, b: s.n }), i),
      clase: "cumple" as ClaseDeEstado,
    })),
    ...(grafoBien
      ? [
          {
            codigo: X(EXPERTO.codigoGrafo, i),
            texto: X(CUMPLIDO.grafo, i),
            experto: X(
              EXPERTO.grafo({
                nodos: ct.nodos.length,
                senales: ct.senales.length,
                pausas: ct.pausas.pausas_registradas,
                rol: ct.pausas.rol,
              }),
              i,
            ),
            valor: deCada(nodosEnGrafo, ct.nodos.length, i),
            clase: "cumple" as ClaseDeEstado,
          },
        ]
      : []),
    ...(diferencias === 0
      ? [
          {
            codigo: "RF",
            texto: X(CUMPLIDO.cruzada, i),
            experto: X(EXPERTO.cruzadaCumplida(ct.rf_09_2.length), i),
            valor: deCada(decisiones, decisiones, i),
            clase: "cumple" as ClaseDeEstado,
          },
        ]
      : []),
  ];

  // --------------------------------------------------------------------- cómo se obtuvo
  const composicion = { normal: 0, borde: 0, faltante: 0, adversario: 0 };
  for (const c of d.lote.casos)
    composicion[c.tipo as keyof typeof composicion]++;
  const kMax = Math.max(1, ...inf.criterios.map((c) => c.k?.requerido ?? 1));
  const ipo = {
    recibe: [
      {
        titulo: X(IPO.plan(versionCorta(inf.plan_en_breve.version)), i),
        detalle: X(
          IPO.planDetalle({
            c: plan.criterios_aceptacion.length,
            r: plan.riesgos.length,
            s: plan.supuestos.length,
            u: plan.umbrales.length,
          }),
          i,
        ),
      },
      {
        titulo: X(IPO.casos(d.lote.casos.length), i),
        detalle: X(IPO.composicion(composicion), i),
      },
      {
        titulo: X(IPO.trazas(ct.rf_09_2.length), i),
        detalle: X(
          IPO.trazasDetalle({
            multi: corridas.length,
            base: inf.ficha_reproducibilidad.linea_base !== null,
          }),
          i,
        ),
      },
    ],
    hace: IPO.pasos({
      c: inf.criterios.length,
      r: inf.riesgos.length,
      s: inf.supuestos.length,
      k: kMax,
    }).map((t) => X(t, i)),
    haceSub: X(IPO.haceSub(8), i),
    entrega: [
      ...IPO.entregas.map((e) => ({
        titulo: X(e.titulo, i),
        detalle: X(e.detalle, i),
      })),
    ],
  };
  const fuente = {
    texto: X(
      IPO.fuente({
        version: inf.version_verificador,
        sprint: d.manifiesto.corrida.sprint,
        huella: inf.huella.slice(0, 8),
      }),
      i,
    ),
    chip: X(IPO.chip(vCorrida), i),
  };
  const indice = (Object.keys(SECCIONES) as (keyof typeof SECCIONES)[]).map(
    (k, n) => ({
      id: k,
      n: n + 1,
      titulo: X(SECCIONES[k], i),
    }),
  );

  // --------------------------------------------------------------------- § 1 · § 2
  const porId = new Map(inf.criterios.map((c) => [c.id, c]));
  const resumen = {
    lectura: X(inf.resumen.texto, i),
    destacados: inf.resumen.criterios_destacados
      .map((id) => porId.get(id))
      .filter((c): c is ResultadoCriterio => c !== undefined)
      .map((c) => ({
        id: c.id,
        criterio: X(c.enunciado, i),
        medido:
          typeof c.valor_medido === "boolean"
            ? X(
                EXPERTO.respuestaEnCasos({
                  respuesta: X(c.valor_medido ? RESUMEN.si : RESUMEN.no, i),
                  n: c.n_poblacion,
                }),
                i,
              )
            : valorDe(c, i),
        estado: estadoDeCriterio(c.estado, i, "informe"),
      })),
    riesgos:
      riesgosOcurridos.length === 0
        ? X(RESUMEN.ningunRiesgo(inf.riesgos.length), i)
        : X(
            RESUMEN.riesgosOcurridos(
              enumerar(
                riesgosOcurridos.map((r) => r.id),
                i,
              ),
            ),
            i,
          ),
  };
  const unaVia = inf.plan_en_breve.decisiones_una_via;
  const otras = plan.decisiones.length - unaVia.length;
  const planEnBreve = {
    problema: X(inf.plan_en_breve.problema, i),
    flujoTitulo: X(
      PLAN_EN_BREVE.flujo({
        n: inf.plan_en_breve.flujo.length,
        corrieron: inf.plan_en_breve.flujo.length,
      }),
      i,
    ),
    flujo: inf.plan_en_breve.flujo.map((f) => X(f, i)),
    unaVia: unaVia.map((x) => ({
      id: x.id,
      pregunta: X(x.pregunta, i),
      justificacion: x.justificacion ? X(x.justificacion, i) : null,
    })),
    otras: otras > 0 ? X(PLAN_EN_BREVE.otras(otras), i) : null,
  };

  // --------------------------------------------------------------------- § 3 criterios
  const exigente = inf.criterios.find((c) => c.agregacion === "pass^k" && c.k);
  const criterios = {
    chip: X(
      CRITERIOS.chip({
        n: inf.ficha_reproducibilidad.corrida.casos_ejecutados,
        k: corridas.length,
      }),
      i,
    ),
    lectura: X(
      CRITERIOS.lectura({
        n: inf.criterios.length,
        cumplen: criteriosCumplen.length,
        exigente: exigente ? X(criterioExigente(d.id, exigente.id), i) : null,
        k: exigente?.k?.requerido ?? 1,
      }),
      i,
    ),
    filas: inf.criterios.map((c) => filaCriterio(c, latenciaDe, d.id, i)),
  };

  // --------------------------------------------------------------------- § 4 riesgos
  const maxVisitas = Math.max(1, ...ct.nodos.map((n) => n.visitas));
  const extractor = ct.nodos.find((n) => n.id === "extractor");
  const conAclaracion = d.corrida.trazas.filter(
    (t) =>
      t.senales.nodos_visitados &&
      (t.senales.nodos_visitados as string[]).filter((n) => n === "extractor")
        .length > 1,
  ).length;
  const spike = d.spike
    ? d.spike.grafo.nodos.filter((n) => ct.nodos.some((x) => x.id === n.id))
        .length
    : null;
  const riesgos = {
    chip: X(
      RIESGOS.chip(inf.ficha_reproducibilidad.corrida.casos_ejecutados),
      i,
    ),
    lectura: X(
      RIESGOS.lectura({
        n: inf.riesgos.length,
        ocurridos: riesgosOcurridos.length,
      }),
      i,
    ),
    filas: inf.riesgos.map((r) => filaRiesgo(r, plan, d.id, i)),
    construidoNota: X(
      RIESGOS.construidoNota({
        n: ct.nodos.length,
        todos: nodosEnGrafo === ct.nodos.length,
        extractor: extractor?.visitas ?? null,
        aclaraciones: conAclaracion,
      }),
      i,
    ),
    visitas: ct.nodos.map((n) => ({
      id: n.id,
      tipo: n.tipo,
      visitas: n.visitas,
      ancho: Math.round((n.visitas / maxVisitas) * 1000) / 10,
      en_grafo: n.en_grafo,
    })),
    senalesYPausas: X(
      RIESGOS.senalesYPausas({
        a: senalesCompletas,
        b: ct.senales.length,
        casos: ct.pausas.casos_con_pausa,
        registradas: ct.pausas.pausas_registradas,
        rol: ct.pausas.rol,
        spike,
        nodos: ct.nodos.length,
      }),
      i,
    ),
    otroLenguaje: X(
      RIESGOS.otroLenguajeLectura({
        decisiones,
        corridas: ct.rf_09_2.length,
        diferencias,
      }),
      i,
    ),
    rf: ct.rf_09_2.map((r) => ({
      corrida: corta(r.corrida_id),
      variante: X(
        VARIANTE[r.variante] ?? { es: r.variante, en: r.variante },
        i,
      ),
      decisiones: r.visitas,
      diferencias: r.discrepancias,
      coincide: r.coincide,
    })),
  };

  // --------------------------------------------------------------------- § 5 brechas
  const brechasV = {
    chip: X(BRECHAS.chip(corridas.length), i),
    lectura: X(
      BRECHAS.lectura({
        n: brechas.length,
        categorias: porCategoria.size,
        lectura:
          porCategoria.size === 1
            ? (CATEGORIA_LECTURA[[...porCategoria.keys()][0]!]?.[i] ?? null)
            : null,
      }),
      i,
    ),
    filas: brechas.map((b) => ({
      caso: b.caso_id,
      href:
        b.caso_id && b.corrida_id === corridaId
          ? ruta(i, "caso", b.caso_id, d.id)
          : null,
      corrida:
        b.corrida_id === corridaId
          ? X(BRECHAS.principal, i)
          : b.corrida_id.slice(corridaId.length + 1) || b.corrida_id,
      nodo: b.nodo
        ? {
            id: b.nodo,
            tipo: ct.nodos.find((n) => n.id === b.nodo)?.tipo ?? "modelo",
          }
        : null,
      paso: b.paso,
      reintentos: b.reintentos === null ? "—" : String(b.reintentos),
      detalle: X(b.detalle, i),
    })),
    evaluadores: inf.brechas_no_previstas.evaluadores.map((e) => ({
      id: e.id,
      tipo: X(TIPO_EVALUADOR[e.tipo] ?? { es: e.tipo, en: e.tipo }, i),
      estado: X(
        ESTADO_EVALUADOR[e.estado] ?? { es: e.estado, en: e.estado },
        i,
      ),
      casos: e.casos_evaluados,
      fallas: e.fallas.length === 0 ? "—" : e.fallas.join(", "),
      noEvaluables: e.no_evaluables,
      riesgos:
        e.riesgos_cubiertos.length === 0 ? "—" : e.riesgos_cubiertos.join(", "),
    })),
  };

  // --------------------------------------------------------------------- § 6 supuestos (orden de la maqueta: lo abierto primero)
  const ORDEN_SUP: Record<string, number> = {
    sin_probar: 0,
    refutado: 1,
    confirmado: 2,
  };
  const supuestos = [...inf.supuestos]
    .sort((a, b) => (ORDEN_SUP[a.estado] ?? 3) - (ORDEN_SUP[b.estado] ?? 3))
    .map((s) =>
      vistaSupuesto(
        s,
        plan,
        vCorrida,
        inf.ficha_reproducibilidad.linea_base?.corrida_id ?? null,
        corta,
        d.id,
        i,
      ),
    );

  // --------------------------------------------------------------------- § 7 ejemplares
  const trazaDe = new Map(d.corrida.trazas.map((t) => [t.caso_id, t]));
  const tipoDeNodo = new Map(ct.nodos.map((n) => [n.id, n.tipo]));
  const ejemplares = {
    chip: X(EJEMPLARES.chip(vCorrida), i),
    lista: (
      [
        "exitoso",
        "escalado_correctamente",
        "fallido",
        "adversario_neutralizado",
      ] as const
    ).map((rol) => {
      const e = inf.casos_ejemplares[rol];
      if (!e)
        return {
          rol: X(EJEMPLARES.rol[rol]!, i),
          caso: null,
          texto: X(EJEMPLARES.ningunoTexto, i),
          cadena: [],
          decision: null,
          persona: null,
          href: null,
          etiquetaCadena: "",
        };
      const t = trazaDe.get(e.caso_id);
      const visitados =
        (t?.senales.nodos_visitados as string[] | undefined) ?? [];
      const cadena = visitados.filter((n, k) => visitados.indexOf(n) === k);
      return {
        rol: X(EJEMPLARES.rol[rol]!, i),
        caso: {
          id: e.caso_id,
          tipo: X(SUBTIPO[e.subtipo] ?? { es: e.subtipo, en: e.subtipo }, i),
        },
        texto: X(e.por_que, i),
        cadena: cadena.map((n) => ({
          id: n,
          tipo: tipoDeNodo.get(n) ?? "modelo",
        })),
        decision: (t?.senales.decision_final as string | undefined) ?? null,
        persona: X(
          t && t.pausas_humanas.length > 0
            ? EJEMPLARES.conPersona
            : EJEMPLARES.sinPersona,
          i,
        ),
        href: ruta(i, "caso", e.caso_id, d.id),
        etiquetaCadena: X(EJEMPLARES.cadena(e.caso_id), i),
      };
    }),
  };

  // --------------------------------------------------------------------- § 8 playground
  const umbralDelPlan = new Map(plan.umbrales.map((u) => [u.id, u]));
  const playground = {
    lectura: X(PLAYGROUND.lectura(inf.playground.umbrales.length), i),
    filas: inf.playground.umbrales.map((u) => {
      const p = umbralDelPlan.get(u.id);
      const valor =
        typeof u.valor_en_plan === "boolean"
          ? X(u.valor_en_plan ? ENCENDIDO : APAGADO, i)
          : numeroDato(u.valor_en_plan, i);
      const regla =
        typeof u.valor_en_plan === "boolean"
          ? X(
              EXPERTO.reglaBooleana({ senal: u.senal, operador: u.operador }),
              i,
            )
          : X(
              EXPERTO.reglaNumerica({
                senal: u.senal,
                operador: u.operador,
                valor,
                inclusivo: u.inclusivo,
              }),
              i,
            );
      const o = u.observados;
      return {
        id: u.id,
        nombre: X(u.nombre, i),
        descripcion: p ? X(p.descripcion_lider, i) : "",
        regla,
        rango:
          u.rango === "booleano"
            ? X(PLAYGROUND.siNo, i)
            : X(
                PLAYGROUND.rango({
                  min: decimalDeRango(u.rango.min, u.rango.paso, i),
                  max: decimalDeRango(u.rango.max, u.rango.paso, i),
                }),
                i,
              ),
        observado:
          o.verdaderos !== null
            ? X(PLAYGROUND.verdaderos({ a: o.verdaderos, b: o.n }), i)
            : `${o.min === null ? "—" : numeroDato(o.min, i)} · ${o.mediana === null ? "—" : numeroDato(o.mediana, i)} · ${o.max === null ? "—" : numeroDato(o.max, i)} (n = ${o.n})`,
        justo: casosEnlazados(u.casos_en_el_umbral, d.id, i),
      };
    }),
    limites: inf.playground.limites.map((l) => X(l, i)),
    href: ruta(i, "playground", undefined, d.id),
  };

  // --------------------------------------------------------------------- § 9 ficha
  const ficha = {
    chip: X(IPO.chip(vCorrida), i),
    filas: filasDeReproducibilidad(d, i, "brecha"),
  };

  return {
    portada: {
      antetitulo: X(
        PORTADA.antetitulo({
          demo: DEMO_TEXTO[d.id].corto,
          dominio: DEMO_TEXTO[d.id].dominio,
          corrida: corridaId,
          fecha: inf.fecha,
        }),
        i,
      ),
    },
    veredicto,
    balance,
    fallos,
    sinProbar,
    conNota: filasConNota,
    cumplido: {
      total: itemsCriterios.length + itemsRiesgos.length + itemsAdemas.length,
      criterios: {
        titulo: X(
          CUMPLIDO.criterios({
            a: criteriosCumplen.length,
            b: inf.criterios.length,
          }),
          i,
        ),
        items: itemsCriterios,
      },
      riesgos: {
        titulo: X(
          CUMPLIDO.riesgos({ a: riesgosNo.length, b: inf.riesgos.length }),
          i,
        ),
        items: itemsRiesgos,
      },
      ademas: {
        titulo: X(CUMPLIDO.ademas(itemsAdemas.length), i),
        items: itemsAdemas,
      },
    },
    ipo,
    fuente,
    indice,
    resumen,
    planEnBreve,
    criterios,
    riesgos,
    brechas: brechasV,
    supuestos,
    ejemplares,
    playground,
    ficha,
    pie: pieDeCorrida(d, i),
  };
}

/** Cómo se nombra una métrica de supuesto en la línea del experto: siglas en mayúscula, palabras redactadas. */
const NOMBRE_METRICA: Record<string, TextoBilingue> = {
  ece: { es: "ECE", en: "ECE" },
  auroc: { es: "AUROC", en: "AUROC" },
  exactitud: { es: "exactitud", en: "accuracy" },
  tasa: { es: "tasa", en: "rate" },
};
function nombreMetrica(k: string, i: Idioma): string {
  return NOMBRE_METRICA[k]?.[i] ?? k;
}
/** Valor de una métrica con hasta 4 decimales, sin ceros sobrantes (0,0807 · 1). */
function valorMetrica(v: number, i: Idioma): string {
  return numCorto(v, i, 4);
}

/** Una cifra que el informe debe traer para pintar esa parte: si falta, la vista lo dice en vez de pintar «NaN». */
function cifra(x: number | null, que: string): number {
  if (x === null)
    throw new Error(
      `vitrina: el informe no trae ${que}; Brecha no la puede pintar.`,
    );
  return x;
}

function decimalDeRango(x: number, paso: number, i: Idioma): string {
  return Number.isInteger(paso) ? String(x) : decimal(x, 2, i);
}

/** La cifra que explica el estado de un supuesto en la línea del experto («: latencia mediana 11,831 s > 9,261 s…»). */
function detalleExpertoSupuesto(s: ResultadoSupuesto, i: Idioma): string {
  if (s.estado === "refutado" && s.comparacion) {
    const c = s.comparacion;
    const peorLatencia =
      cifra(
        c.latencia_mediana_s.multiagente,
        "la latencia mediana del multiagente",
      ) >
      cifra(
        c.latencia_mediana_s.agente_unico,
        "la latencia mediana de la línea base",
      );
    return peorLatencia
      ? X(
          EXPERTO.peorLatencia({
            multi: decimal(
              cifra(
                c.latencia_mediana_s.multiagente,
                "la latencia mediana del multiagente",
              ),
              3,
              i,
            ),
            base: decimal(
              cifra(
                c.latencia_mediana_s.agente_unico,
                "la latencia mediana de la línea base",
              ),
              3,
              i,
            ),
          }),
          i,
        )
      : X(
          EXPERTO.peorExactitud({
            multi: numeroDato(c.exactitud.multiagente, i),
            base: numeroDato(c.exactitud.agente_unico, i),
          }),
          i,
        );
  }
  if (s.estado === "sin_probar") {
    const nulas = Object.entries(s.metricas)
      .filter(([, v]) => v === null)
      .map(([k]) => nombreMetrica(k, i));
    const exactitud =
      typeof s.metricas.exactitud === "number" ? s.metricas.exactitud : null;
    const errores =
      exactitud === null ? null : Math.round(s.n * (1 - exactitud));
    return X(EXPERTO.sinProbar({ nulas, errores, n: s.n }), i);
  }
  return "";
}

function filaSupuesto(
  s: ResultadoSupuesto,
  grupo: "fallo" | "sinProbar",
  plan: Plan,
  vCorrida: string,
  demo: IdDemo,
  i: Idioma,
): FilaFallo {
  const l = lecturaSupuesto(demo, s);
  const p = plan.supuestos.find((x) => x.id === s.id);
  let paso = "";
  let medido = "";
  let evidencia = "";
  let regla = "";
  let casos: string[] = [];
  if (s.comparacion) {
    const c = s.comparacion;
    paso = X(
      PASO.comparacion({
        exactitud: porcentaje(c.exactitud.multiagente, i),
        exactitudBase: porcentaje(c.exactitud.agente_unico, i),
        acerto:
          c.exactitud.multiagente > c.exactitud.agente_unico
            ? "mas"
            : c.exactitud.multiagente < c.exactitud.agente_unico
              ? "menos"
              : "igual",
        latencia: segundos(
          cifra(
            c.latencia_mediana_s.multiagente,
            "la latencia mediana del multiagente",
          ),
          i,
        ),
        latenciaBase: segundos(
          cifra(
            c.latencia_mediana_s.agente_unico,
            "la latencia mediana de la línea base",
          ),
          i,
        ),
        tardo:
          cifra(
            c.latencia_mediana_s.multiagente,
            "la latencia mediana del multiagente",
          ) >
          cifra(
            c.latencia_mediana_s.agente_unico,
            "la latencia mediana de la línea base",
          )
            ? "mas"
            : cifra(
                  c.latencia_mediana_s.multiagente,
                  "la latencia mediana del multiagente",
                ) <
                cifra(
                  c.latencia_mediana_s.agente_unico,
                  "la latencia mediana de la línea base",
                )
              ? "menos"
              : "igual",
        llamadas: c.presupuesto.multiagente.llamadas_al_modelo,
        llamadasBase: c.presupuesto.agente_unico.llamadas_al_modelo,
      }),
      i,
    );
    medido = X(
      EXPERTO.comparacionMedido({
        exactitud: numeroDato(c.exactitud.multiagente, i),
        exactitudBase: numeroDato(c.exactitud.agente_unico, i),
        latencia: decimal(
          cifra(
            c.latencia_mediana_s.multiagente,
            "la latencia mediana del multiagente",
          ),
          3,
          i,
        ),
        latenciaBase: decimal(
          cifra(
            c.latencia_mediana_s.agente_unico,
            "la latencia mediana de la línea base",
          ),
          3,
          i,
        ),
        llamadas: c.presupuesto.multiagente.llamadas_al_modelo,
        llamadasBase: c.presupuesto.agente_unico.llamadas_al_modelo,
        tokens: entero(c.presupuesto.multiagente.tokens, i),
        tokensBase: entero(c.presupuesto.agente_unico.tokens, i),
        costo: decimal(c.presupuesto.multiagente.costo_nominal_usd, 4, i),
        costoBase: decimal(c.presupuesto.agente_unico.costo_nominal_usd, 4, i),
      }),
      i,
    );
    evidencia = X(
      EXPERTO.comparacionEvidencia({
        corrida: vCorrida,
        base: c.corrida_base.endsWith("-base")
          ? `${vCorrida}-base`
          : c.corrida_base,
        n: s.n,
        respetado: c.presupuesto_respetado,
        distintos: {
          es: enumerar(c.casos_distintos, "es"),
          en: enumerar(c.casos_distintos, "en"),
        },
      }),
      i,
    );
    regla = X(s.motivo, i);
    casos = c.casos_distintos;
  } else {
    const n = s.n;
    const exactitud =
      typeof s.metricas.exactitud === "number" ? s.metricas.exactitud : null;
    paso = exactitud === 1 ? X(PASO.sinErrores(n), i) : X(s.motivo, i);
    medido = `${Object.entries(s.metricas)
      .map(([k, v]) =>
        X(
          EXPERTO.metrica({
            nombre: nombreMetrica(k, i),
            valor: v === null ? null : valorMetrica(v, i),
          }),
          i,
        ),
      )
      .join(" · ")} · n = ${n}`;
    const curva = s.curva;
    const estadoTexto = estadoDeSupuesto(s.estado, i).texto.toLowerCase();
    evidencia =
      curva && curva.length
        ? X(
            EXPERTO.curva({
              riesgo: porcentaje(
                Math.max(...curva.map((p) => p.riesgo ?? 0)),
                i,
              ),
              umbral: umbralDeLaCurva(plan, s.id).id,
              desde: decimal(curva[0]!.umbral, 2, i),
              hasta: decimal(curva[curva.length - 1]!.umbral, 2, i),
              estado: estadoTexto,
            }),
            i,
          )
        : X(EXPERTO.estado(estadoTexto), i);
    const u = p?.medible_en_trazas?.umbral_confirmacion ?? {};
    regla = X(
      EXPERTO.reglaSupuesto({
        condiciones: Object.entries(u)
          .map(
            ([k, v]) =>
              `${nombreMetrica(k.replace(/_(min|max)$/, ""), i)} ${k.endsWith("_max") ? "≤" : "≥"} ${decimal(Number(v), 2, i)}`,
          )
          .join(" ∧ "),
        poblacion: p?.medible_en_trazas?.poblacion ?? null,
        criticidad: criticidadEnTexto(s.criticidad, i),
      }),
      i,
    );
  }
  // El valor del umbral que la lectura cita sale del plan, no de la copia (AU-S2-3).
  const planeo = conPlan(X(l.planeo, i), plan, i, demo);
  const estado = estadoDeSupuesto(s.estado, i);
  return {
    ancla: `f-${s.id}`,
    clase: estado.clase,
    etiqueta: X(
      grupo === "fallo" ? ETIQUETA_FILA.fallo : ETIQUETA_FILA.sinProbar,
      i,
    ),
    codigo: s.id,
    titulo: X(l.titulo, i),
    lider: [planeo, paso, X(l.significa, i)],
    experto: [regla, medido, evidencia],
    casos: casosEnlazados(casos, demo, i),
    enlaces: [{ href: "#b6", texto: `§ 6 ${X(SECCIONES.b6, i)}` }],
  };
}

function filaCriterioFallido(
  c: ResultadoCriterio,
  demo: IdDemo,
  i: Idioma,
  sinProbar = false,
): FilaFallo {
  const estado = estadoDeCriterio(c.estado, i, "informe");
  return {
    ancla: `f-${c.id}`,
    clase: sinProbar ? "beta" : estado.clase,
    etiqueta: X(sinProbar ? ETIQUETA_FILA.sinProbar : ETIQUETA_FILA.fallo, i),
    codigo: c.id,
    titulo: X(c.enunciado, i),
    lider: [
      X(CRITERIO.lider[demo][c.id] ?? c.enunciado, i),
      `${valorDe(c, i)} · ${estado.texto}`,
      c.nota ? X(c.nota, i) : estado.texto,
    ],
    experto: [
      reglaDe(c),
      `${valorDe(c, i)} · n = ${c.n_poblacion}`,
      c.casos_que_incumplen.join(", ") || "—",
    ],
    casos: casosEnlazados(c.casos_que_incumplen, demo, i),
    enlaces: [{ href: "#b3", texto: `§ 3 ${X(SECCIONES.b3, i)}` }],
  };
}

function filaRiesgoOcurrido(
  r: ResultadoRiesgo,
  plan: Plan,
  demo: IdDemo,
  i: Idioma,
): FilaFallo {
  const p = plan.riesgos.find((x) => x.id === r.id);
  const det = p?.detector_en_trazas;
  return {
    ancla: `f-${r.id}`,
    clase: "no-cumple",
    etiqueta: X(ETIQUETA_FILA.fallo, i),
    codigo: r.id,
    titulo: X(r.modo, i),
    lider: [
      p ? X(p.efecto, i) : X(r.modo, i),
      X(
        EXPERTO.deTotal({ valor: String(r.valor ?? "—"), n: r.n_poblacion }),
        i,
      ),
      p ? X(p.causa, i) : "",
    ],
    experto: [
      `${det?.poblacion ?? TODOS_EN_EL_PLAN} → ${det?.condicion ?? "—"}`,
      `${r.valor ?? "—"} · ${r.ocurre_si ?? ""}`,
      r.casos.join(", "),
    ],
    casos: casosEnlazados(r.casos, demo, i),
    enlaces: [{ href: "#b4", texto: `§ 4 ${X(SECCIONES.b4, i)}` }],
  };
}

function filaBrecha(
  categoria: string,
  bs: readonly BrechaNoPrevista[],
  nRiesgos: number,
  nCorridas: number,
  evaluadores: readonly { estado: string; tipo: string; fallas: string[] }[],
  corridaId: string,
  vCorrida: string,
  demo: IdDemo,
  i: Idioma,
): FilaFallo {
  const l = lecturaBrecha(categoria);
  const casos = [
    ...new Set(bs.map((b) => b.caso_id).filter((x): x is string => x !== null)),
  ].sort();
  const reintentos = bs.reduce((n, b) => n + (b.reintentos ?? 0), 0);
  const nodos = [
    ...new Set(bs.map((b) => b.nodo).filter((x): x is string => x !== null)),
  ];
  const nodo =
    nodos.length === 1
      ? delVocabulario(
          NODO_EN_FRASE[demo],
          nodos[0]!,
          "NODO_EN_FRASE (src/textos/brecha.ts)",
        )
      : { es: nodos.join(", "), en: nodos.join(", ") };
  const deRegla = evaluadores.filter(
    (e) => e.tipo === "regla" && e.estado === "ejecutado",
  );
  const fallasRegla = deRegla.reduce((n, e) => n + e.fallas.length, 0);
  const juezSinCorrer = evaluadores.some(
    (e) => e.tipo === "juez_modelo" && e.estado !== "ejecutado",
  );
  // La corrida principal se nombra por su versión («v1.2»); una repetición, por su sufijo («r2»).
  const corta = (id: string) =>
    id === corridaId ? vCorrida : id.slice(corridaId.length + 1) || id;
  return {
    ancla: "f-np",
    clase: "no-cumple",
    etiqueta: X(ETIQUETA_FILA.fallo, i),
    codigo: X(ETIQUETA_FILA.noPrevisto, i),
    titulo: X(l.titulo, i),
    lider: [
      X(l.planeo(nRiesgos), i),
      categoria === "reintento_de_esquema"
        ? X(
            PASO.reintentos({
              veces: bs.length,
              casos: casos.length,
              nodo,
              reintentos,
              corridas: nCorridas,
            }),
            i,
          )
        : enumerar(
            bs.map((b) => X(b.detalle, i)),
            i,
          ),
      X(l.significa, i),
    ],
    experto: [
      X(EXPERTO.sinDetector, i),
      X(
        EXPERTO.brechaCasos({
          lista: bs
            .map(
              (b) =>
                `${b.caso_id ?? "—"} (${corta(b.corrida_id)}, ${b.reintentos ?? "—"})`,
            )
            .join(" · "),
          nodos: nodos.join(", "),
          paso: bs[0]?.paso ?? null,
          reintentos,
        }),
        i,
      ),
      X(
        EXPERTO.evaluadores({
          corridas: nCorridas,
          ejecutados: deRegla.length,
          fallas: fallasRegla,
          juezSinCorrer,
        }),
        i,
      ),
    ],
    casos: casos.map((id) => ({ id, href: ruta(i, "caso", id, demo) })),
    enlaces: [{ href: "#b5", texto: `§ 5 ${X(SECCIONES.b5, i)}` }],
  };
}

function filaConNota(
  c: ResultadoCriterio,
  compacto: Compacto,
  latenciaDe: ReadonlyMap<string, number>,
  plan: Plan,
  demo: IdDemo,
  i: Idioma,
): FilaFallo {
  const rompe = umbralQueLoRompe(compacto, c.id);
  const rompeTexto = rompe
    ? X(
        PASO.playground({
          umbral: rompe.umbral,
          valor: numeroDato(rompe.valor, i),
          caso: enumerar(rompe.casos, i),
        }),
        i,
      )
    : null;
  const unoAUno = c.casos_que_incumplen.map(
    (id) => `${id}: ${segundos(latenciaDe.get(id) ?? Number.NaN, i)}`,
  );
  let paso: string;
  let medido: string;
  if (
    c.metrica &&
    c.casos_que_incumplen.length > 0 &&
    typeof c.valor_medido === "number"
  ) {
    paso = X(
      PASO.mediana({
        mediana: segundos(c.valor_medido, i),
        casos: enumerar(c.casos_que_incumplen, i),
        valores: unoAUno.map((x) => x.split(": ")[1]).join(", "),
      }),
      i,
    );
    medido = `${decimal(c.valor_medido, 3, i)} s · ${c.casos_que_incumplen.map((id) => `${id}: ${decimal(latenciaDe.get(id) ?? Number.NaN, 3, i)} s`).join(" · ")}`;
  } else {
    paso = X(
      (PASO_FUERA[demo][c.id] ?? PASO.fuera)({
        dentro: c.n_poblacion,
        fuera: c.fuera_por_senal_nula,
      }),
      i,
    );
    medido = X(
      EXPERTO.fueraPorNula({
        cumplen: deCada(
          c.n_poblacion - c.casos_que_incumplen.length,
          c.n_poblacion,
          i,
        ),
        fuera: c.fuera_por_senal_nula,
      }),
      i,
    );
  }
  const lectura = LECTURA_NOTA[demo][c.id]?.(c.n_poblacion);
  const significa = [
    lectura ? X(lectura, i) : c.nota ? X(c.nota, i) : "",
    rompeTexto ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  const u = rompe ? plan.umbrales.find((x) => x.id === rompe.umbral) : null;
  return {
    ancla: `f-${c.id}`,
    clase: "alerta",
    etiqueta: X(ETIQUETA_FILA.conNota, i),
    codigo: c.id,
    titulo: X(c.enunciado, i),
    lider: [X(CRITERIO.lider[demo][c.id] ?? c.enunciado, i), paso, significa],
    experto: [
      c.metrica
        ? `${c.agregacion}(${c.metrica}) ${MENOR_ES_MEJOR.has(c.tipo) ? "≤" : "≥"} ${numeroDato(Number(c.objetivo), i)} · n = ${c.n_poblacion}`
        : `${c.poblacion} → ${c.condicion ?? ""}`,
      medido,
      rompe && u
        ? X(
            EXPERTO.rompe({
              umbral: rompe.umbral,
              valor: numeroDato(rompe.valor, i),
              casos: rompe.casos
                .map((id) => {
                  const x = compacto.casos.find((k) => k.id === id)
                    ?.senales_de_umbral[rompe.umbral];
                  return typeof x === "number"
                    ? `${id} (${u.senal} ${numeroDato(x, i)})`
                    : id;
                })
                .join(", "),
              n: rompe.casos.length,
              criterio: c.id,
            }),
            i,
          )
        : c.nota
          ? X(EXPERTO.notaVerificador(X(c.nota, i)), i)
          : "—",
    ],
    casos: casosEnlazados(c.casos_que_incumplen, demo, i),
    enlaces: [
      { href: "#b3", texto: `§ 3 ${X(SECCIONES.b3, i)}` },
      ...(rompe
        ? [
            {
              href: ruta(i, "playground", undefined, demo),
              texto: "Playground",
            },
          ]
        : []),
    ],
  };
}

function filaCriterio(
  c: ResultadoCriterio,
  latenciaDe: ReadonlyMap<string, number>,
  demo: IdDemo,
  i: Idioma,
): FilaCriterio {
  const estado = estadoDeCriterio(c.estado, i, "informe");
  let medido: { rotulo: string; valor: string };
  let pista: { medido: number; meta: number };
  let ejes: FilaCriterio["ejes"] = null;
  if (typeof c.valor_medido === "boolean" || c.valor_medido === null) {
    const a = c.n_poblacion - c.casos_que_incumplen.length;
    medido = {
      rotulo: X(CRITERIOS.cumplen, i),
      valor: deCada(a, c.n_poblacion, i),
    };
    pista = {
      medido: c.n_poblacion === 0 ? 0 : (a / c.n_poblacion) * 100,
      meta: 100,
    };
  } else if (c.metrica) {
    const objetivo = Number(c.objetivo);
    const escala = Math.max(objetivo, c.valor_medido);
    medido = {
      rotulo: X(
        c.agregacion === "promedio"
          ? CRITERIOS.promedio
          : c.agregacion === "maximo"
            ? CRITERIOS.maximo
            : CRITERIOS.mediana,
        i,
      ),
      valor: valorDe(c, i),
    };
    pista = {
      medido: (c.valor_medido / escala) * 100,
      meta: (objetivo / escala) * 100,
    };
    ejes =
      c.tipo === "latencia"
        ? { desde: "0 s", centro: null, hasta: segundos(escala, i, 0) }
        : { desde: "0", centro: null, hasta: numeroDato(escala, i) };
  } else {
    medido = {
      rotulo: X(CRITERIOS.medido, i),
      valor: porcentaje(c.valor_medido, i),
    };
    pista = { medido: c.valor_medido * 100, meta: Number(c.objetivo) * 100 };
    ejes = {
      desde: "0",
      centro: c.k
        ? X(
            CRITERIOS.corridas({
              k: c.k.observado,
              de: c.k.requerido,
              n: c.n_poblacion,
            }),
            i,
          )
        : null,
      hasta: porcentaje(1, i),
    };
  }
  const notas: string[] = [];
  if (c.fuera_por_senal_nula > 0)
    notas.push(X(CRITERIOS.fuera(c.fuera_por_senal_nula), i));
  if (c.metrica && c.casos_que_incumplen.length > 0)
    notas.push(
      X(
        CRITERIOS.unoAUno({
          casos: enumerar(c.casos_que_incumplen, i),
          valores: c.casos_que_incumplen
            .map((id) => segundos(latenciaDe.get(id) ?? Number.NaN, i))
            .join(", "),
        }),
        i,
      ),
    );
  if (c.no_evaluables.length > 0)
    notas.push(
      X(
        CRITERIOS.noEvaluables({
          n: c.no_evaluables.length,
          casos: enumerar(
            c.no_evaluables.map((x) => x.caso_id),
            i,
          ),
        }),
        i,
      ),
    );
  return {
    id: c.id,
    enunciado: X(c.enunciado, i),
    regla: reglaDe(c),
    nota: notas.length ? notas.join(" ") : null,
    medido,
    objetivo: objetivoDe(c, i),
    pista: {
      medido: Math.round(pista.medido * 10) / 10,
      meta: Math.round(pista.meta * 10) / 10,
    },
    ejes,
    estado,
    casos: casosEnlazados(c.casos_que_incumplen, demo, i),
  };
}

function filaRiesgo(
  r: ResultadoRiesgo,
  plan: Plan,
  demo: IdDemo,
  i: Idioma,
): FilaRiesgo {
  const p = plan.riesgos.find((x) => x.id === r.id);
  const det = p?.detector_en_trazas;
  const tasa = r.tipo_detector === "tasa";
  const fmt = (x: number) => (tasa ? porcentaje(x, i) : String(x));
  const disparo = r.ocurre_si
    ? r.ocurre_si.replace(/([\d.]+)/, (m) => fmt(Number(m)))
    : "";
  const medida =
    typeof r.valor === "number"
      ? `${tasa ? X(EXPERTO.deCasos({ valor: porcentaje(r.valor, i), n: r.n_poblacion }), i) : X((r.ambito === "sesion" ? CUMPLIDO.sesiones : CUMPLIDO.casos)({ a: r.valor, b: r.n_poblacion }), i)} · ${X(RIESGOS.ocurreSi, i)} ${disparo}`
      : "—";
  return {
    id: r.id,
    modo: X(r.modo, i),
    medida,
    detector: `${det?.poblacion ?? TODOS_EN_EL_PLAN} → ${det?.condicion ?? "—"}`,
    efecto: p ? X(p.efecto, i) : "",
    causa: p ? X(p.causa, i) : "",
    ap: prioridad(r, i),
    rpn: `S${r.severidad} · O${r.ocurrencia} · D${r.deteccion} · RPN ${r.rpn}`,
    legal: controlLegal(r, i),
    estado: estadoDeRiesgo(r.estado, i),
    casos: casosEnlazados(r.casos, demo, i),
  };
}

function vistaSupuesto(
  s: ResultadoSupuesto,
  plan: Plan,
  vCorrida: string,
  base: string | null,
  corta: (id: string) => string,
  demo: IdDemo,
  i: Idioma,
): SupuestoVista {
  const p = plan.supuestos.find((x) => x.id === s.id);
  const estado = estadoDeSupuesto(s.estado, i);
  const clave = `${s.id}:${s.estado}`;
  const dio = SUPUESTOS.dio[demo][clave] as
    ((p: unknown) => TextoBilingue) | undefined;
  if (!dio)
    throw new Error(
      `vitrina: el informe marca ${s.id} «${s.estado}» y Brecha no tiene su lectura (src/textos/brecha.ts, SUPUESTOS.dio).`,
    );
  let texto: TextoBilingue;
  let medidas: Fila[] = [];
  let grafico: SupuestoVista["grafico"] = null;
  if (s.comparacion) {
    const c = s.comparacion;
    texto = dio({
      exactitud: porcentaje(c.exactitud.multiagente, i),
      exactitudBase: porcentaje(c.exactitud.agente_unico, i),
      latencia: segundos(
        cifra(
          c.latencia_mediana_s.multiagente,
          "la latencia mediana del multiagente",
        ),
        i,
      ),
      latenciaBase: segundos(
        cifra(
          c.latencia_mediana_s.agente_unico,
          "la latencia mediana de la línea base",
        ),
        i,
      ),
    });
    const fr = X(SUPUESTOS.frente, i);
    medidas = [
      {
        k: X(SUPUESTOS.exactitud, i),
        v: `${numeroDato(c.exactitud.multiagente, i)} ${fr} ${numeroDato(c.exactitud.agente_unico, i)}`,
      },
      {
        k: X(SUPUESTOS.latencia, i),
        v: `${decimal(cifra(c.latencia_mediana_s.multiagente, "la latencia mediana del multiagente"), 3, i)} s ${fr} ${decimal(cifra(c.latencia_mediana_s.agente_unico, "la latencia mediana de la línea base"), 3, i)} s`,
      },
      { k: X(SUPUESTOS.regla, i), v: X(SUPUESTOS.reglaComparacion, i) },
    ];
    const barra = (a: number, b: number, fmt: (x: number) => string) => {
      const m = Math.max(a, b) || 1;
      return {
        multi: { v: fmt(a), ancho: Math.round((a / m) * 1000) / 10 },
        unico: { v: fmt(b), ancho: Math.round((b / m) * 1000) / 10 },
      };
    };
    const F = SUPUESTOS.filas;
    grafico = {
      tipo: "comparacion",
      leyenda: [X(SUPUESTOS.leyendaMulti, i), X(SUPUESTOS.leyendaUnico, i)],
      filas: [
        {
          t: X(F.exactitud.t, i),
          n: X(F.exactitud.n, i),
          ...barra(c.exactitud.multiagente, c.exactitud.agente_unico, (x) =>
            porcentaje(x, i),
          ),
        },
        {
          t: X(F.latencia.t, i),
          n: X(F.latencia.n, i),
          ...barra(
            cifra(
              c.latencia_mediana_s.multiagente,
              "la latencia mediana del multiagente",
            ),
            cifra(
              c.latencia_mediana_s.agente_unico,
              "la latencia mediana de la línea base",
            ),
            (x) => segundos(x, i),
          ),
        },
        {
          t: X(F.llamadas.t, i),
          n: X(F.llamadas.n, i),
          ...barra(
            c.presupuesto.multiagente.llamadas_al_modelo,
            c.presupuesto.agente_unico.llamadas_al_modelo,
            String,
          ),
        },
        {
          t: X(F.tokens.t, i),
          n: null,
          ...barra(
            c.presupuesto.multiagente.tokens,
            c.presupuesto.agente_unico.tokens,
            (x) => entero(x, i),
          ),
        },
        {
          t: X(F.costo.t, i),
          n: X(F.costo.n, i),
          ...barra(
            c.presupuesto.multiagente.costo_nominal_usd,
            c.presupuesto.agente_unico.costo_nominal_usd,
            (x) => decimal(x, 4, i),
          ),
        },
      ],
      pie: X(
        SUPUESTOS.difieren({
          casos: enumerar(c.casos_distintos, i),
          cupo: c.presupuesto_respetado,
        }),
        i,
      ),
      chip: X(
        SUPUESTOS.chipComparacion({
          v: vCorrida,
          base: base
            ? base.endsWith("-base")
              ? `${vCorrida}-base`
              : corta(base)
            : vCorrida,
        }),
        i,
      ),
    };
  } else if (s.curva && s.curva.length) {
    texto = dio(s.n);
    const umbral = p?.medible_en_trazas?.umbral_confirmacion ?? {};
    medidas = Object.entries(s.metricas).map(([k, v]) => {
      const tope = Object.entries(umbral).find(([u]) => u.startsWith(k));
      return {
        k: k === "exactitud" ? X(SUPUESTOS.exactitud, i) : nombreMetrica(k, i),
        v:
          v === null
            ? X(SUPUESTOS.noExiste, i)
            : `${valorMetrica(v, i)}${tope ? ` (${X(SUPUESTOS.pide(`${tope[0].endsWith("_max") ? "≤" : "≥"} ${decimal(Number(tope[1]), 2, i)}`), i)})` : k === "exactitud" ? ` · n = ${s.n}` : ""}`,
      };
    });
    const conRiesgo = s.curva.some((x) => (x.riesgo ?? 0) > 0);
    const deLaCurva = umbralDeLaCurva(plan, s.id);
    grafico = {
      tipo: "curva",
      umbral: deLaCurva.id,
      puntos: s.curva.map((x) => ({ ...x })),
      plan:
        typeof deLaCurva.valor_en_plan === "number"
          ? deLaCurva.valor_en_plan
          : s.curva[0]!.umbral,
      pie: X(
        conRiesgo ? SUPUESTOS.curvaPieConRiesgo(s.n) : SUPUESTOS.curvaPie(s.n),
        i,
      ),
      chip: X(SUPUESTOS.chipCurva(vCorrida), i),
      n: s.n,
    };
  } else {
    // En el A, el tope de aclaraciones lo dice la regla del plan que lo aplica; sin ella, la página no inventa un
    // «0» (AU-S2-16). El B no ata su tasa a ningún tope: la cifra dice cuántos se resolvieron como dice la verdad.
    const tope =
      demo === "demo-a" ? umbralDeCategoria(plan, "tope", demo) : null;
    // Un tope que no sea número no llega aquí: el intérprete de aristas lo rechaza al compactar las señales.
    const topeValor = tope ? (tope.valor_en_plan as number) : null;
    const tasaMedida =
      typeof s.metricas.tasa === "number" ? s.metricas.tasa : null;
    texto = dio({
      n: s.n,
      u: topeValor,
      a: tasaMedida === null ? 0 : Math.round(tasaMedida * s.n),
    });
    medidas = Object.entries(s.metricas).map(([k, v]) => ({
      k: k === "tasa" ? X(SUPUESTOS.tasa, i) : k,
      v: `${v === null ? "—" : numeroDato(v, i)} · n = ${s.n}`,
    }));
    const tasa = typeof s.metricas.tasa === "number" ? s.metricas.tasa : null;
    const minimo = Number(
      p?.medible_en_trazas?.umbral_confirmacion?.tasa_min ?? 0,
    );
    grafico = {
      tipo: "cifras",
      cifras: [
        {
          cifra: X(
            SUPUESTOS.cerrados({
              a: tasa === null ? 0 : Math.round(tasa * s.n),
              b: s.n,
            }),
            i,
          ),
          texto: X(
            topeValor === null
              ? SUPUESTOS.aciertosNota
              : SUPUESTOS.cerradosNota(topeValor),
            i,
          ),
        },
        { cifra: porcentaje(minimo, i), texto: X(SUPUESTOS.pideElPlan, i) },
      ],
    };
  }
  return {
    id: s.id,
    enunciado: X(s.enunciado, i),
    estado,
    criticidad: criticidadEnTexto(s.criticidad, i),
    dio: X(texto, i),
    reglita: X(s.motivo, i),
    medidas,
    notas: s.limitaciones.map((l) => X(l, i)),
    grafico,
  };
}

/** Columnas del renglón de una falla según el perfil (rótulos). */
export function columnasFallo(i: Idioma) {
  return {
    lider: [
      X(COLUMNAS.planeo, i),
      X(COLUMNAS.paso, i),
      X(COLUMNAS.significa, i),
    ] as const,
    experto: [
      X(COLUMNAS.regla, i),
      X(COLUMNAS.medido, i),
      X(COLUMNAS.evidencia, i),
    ] as const,
    casos: X(COLUMNAS.casos, i),
  };
}

export const _paraPruebas = { cortarCorridas, rangoDeIds };
