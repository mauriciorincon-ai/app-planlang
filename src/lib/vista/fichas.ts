/**
 * Vista de P7 Fichas (maqueta `07-fichas.html`): la ficha de reproducibilidad del demo y las dos fichas que viajan a
 * hoja-de-vida —la de la app, que cuenta todos los demos y es la misma en las dos páginas, y la del agente del demo—,
 * pintadas como las pinta su componente (piel de CV Viva) y comprobadas campo por campo contra el contrato fijado. Las fichas son las mismas que escribe `pnpm fichas` (`src/lib/fichas/`), en el idioma de la ruta:
 * la vista no redacta ninguna, solo las ordena para leerlas. Server-only: corre al compilar.
 */
import type { Idioma } from "@core/formatos/bilingue";
import type { HechosDelRepo } from "@/lib/datos/repo";
import type { IdDemo } from "@/lib/demos";
import type { DatosDeLosDemos, DatosDemo } from "@/lib/datos/vitrina";
import {
  armarFichaApp,
  brochureExport,
  complementoPropuesto,
  fichaAgente,
} from "@/lib/fichas/armar";
import { RUTA_EXPORT, RUTA_FICHA_AGENTE } from "@/lib/fichas/archivos";
import {
  limiteDe,
  problemasDeFicha,
  VERSION_EXPORT,
  VERSION_FICHA,
} from "@/lib/fichas/contrato";
import type { FichaTecnica, Fuente, PasoBpmn } from "@/lib/fichas/tipos";
import {
  APP,
  CV,
  MIRADA,
  PORTADA,
  REPRO,
  SECCION,
  TABLA,
} from "@/textos/fichas";
import type { Fila } from "./agente";
import { pieDeCorrida } from "./caso";
import { entero, ESPACIO_DURO, versionCorta } from "./formato";
import { filasDeReproducibilidad } from "./reproducibilidad";

export interface FilaCampo {
  campo: string;
  medida: string;
  limite: string;
  cabe: boolean;
}

export interface CifraCv {
  clave: string;
  valor: string;
  unidad: string | null;
  /** La cifra con su unidad en una línea de texto («100 %» · «100%», «0,67 US$»), para la lista del experto. */
  completa: string;
  etiqueta: string;
  fuente: Fuente;
  fuenteTexto: string;
  detalle: string;
}

export interface FichaCv {
  clave: "app" | "agente";
  marco: { nombre: string; archivo: string };
  chips: string[];
  /** El primer chip es el estado de la pieza («Sin sellar» / «Sellada»), con su color. */
  sellada: boolean;
  nombre: string;
  tagline: string;
  stack: { nombre: string; papel: string }[];
  titular: string;
  cifras: CifraCv[];
  paraQuien: string;
  promesa: string;
  proceso: {
    titulo: string;
    carriles: {
      id: string;
      nombre: string;
      pasos: { n: number; texto: string; tipo: PasoBpmn["tipo"] }[];
    }[];
    anotaciones: { n: number; texto: string }[];
    procedencia: string;
  } | null;
  /** Número de cada sección («01»…); sin proceso, «Cómo funciona» no existe y las siguientes se renumeran. */
  num: {
    paraQuien: string;
    proceso: string | null;
    tiene: string;
    limites: string;
    donde: string;
  };
  tieneSub: string;
  bloques: {
    /** El nodo del grafo (agente) o el grupo de la visión (app): elige el ícono, que la ficha no trae. */
    id: string;
    orden: number;
    nombre: string;
    linea: string;
    cuenta: string | null;
  }[];
  limites: string[];
  nunca: string[];
  hitos: { valor: string; etiqueta: string }[];
  cierre: string;
  /** Lo que el lector debe saber de esta ficha antes de la tabla (quién la arma, por qué no tiene proceso). */
  notas: string[];
  tabla: {
    entrega: string;
    comprobado: string;
    filas: FilaCampo[];
    /** Lo que la ficha incumple en alguno de sus dos idiomas (vacío: valida). */
    problemas: string[];
  };
}

export interface VistaFichas {
  /** Los textos que cambian con el demo de la página. */
  textos: {
    antetitulo: string;
    cuadro: string;
    seccionApp: string;
    seccionAgente: string;
  };
  mirada: {
    recibe: { titulo: string; detalle: string }[];
    hace: string[];
    entrega: { titulo: string; detalle: string }[];
  };
  repro: {
    chip: string;
    filas: Fila[];
    pasos: { comando: string; texto: string }[];
  };
  app: FichaCv;
  agente: FichaCv;
  pie: string;
}

const base = (ruta: string) => ruta.slice(ruta.lastIndexOf("/") + 1);
const carpeta = (ruta: string) => ruta.slice(0, ruta.lastIndexOf("/"));

/** Lo que no sale del manifiesto: cómo se regeneran los casos y cómo corre el lote de cada demo (`package.json`). */
const COMANDOS: Readonly<Record<IdDemo, { casos: string; lote: string }>> = {
  "demo-a": {
    casos: "pnpm casos:generar --versionados",
    lote: "pnpm lote:demo",
  },
  "demo-b": {
    casos: "pnpm casos:generar --versionados --demo b",
    lote: "pnpm lote:demo-b",
  },
};

/**
 * Los pasos para repetir la corrida del demo, con los archivos que declara su manifiesto: el plan con que se mide, la
 * corrida y, si no siguen la convención de `brecha:informe` (`<corrida>-base`, `<corrida>-r2`…), su línea base y sus
 * repeticiones. El último paso rehace el informe y lo compara con el publicado.
 */
export function pasosDeRepro(
  d: DatosDemo,
  i: Idioma,
): { comando: string; texto: string }[] {
  const m = d.manifiesto;
  const corrida = m.corrida.ruta;
  const reps = m.repeticiones.map((r) => r.ruta);
  const baseArg =
    m.linea_base === null || m.linea_base === undefined
      ? " --sin-base"
      : m.linea_base.ruta === `${corrida}-base`
        ? ""
        : ` --base ${m.linea_base.ruta}`;
  const repsArg = reps.every((r, k) => r === `${corrida}-r${k + 2}`)
    ? ""
    : ` --repeticiones ${reps.join(",")}`;
  const P = REPRO.pasos;
  return [
    {
      comando: `pnpm plan:validar --verificar ${m.plan.archivo}`,
      texto: P.plan[i],
    },
    { comando: COMANDOS[d.id].casos, texto: P.casos[i] },
    { comando: COMANDOS[d.id].lote, texto: P.lote[i] },
    { comando: "pnpm trazas:verificar", texto: P.trazas[i] },
    {
      comando: `pnpm brecha:informe --corrida ${corrida} --plan ${m.plan.archivo}${baseArg}${repsArg} --salida ${carpeta(m.informe.archivo)} --verificar`,
      texto: P.informe[i],
    },
  ];
}

/** Largo como lo mide JSON Schema (`maxLength`): en puntos de código, no en unidades UTF-16. */
const largo = (s: string) => [...s].length;

/**
 * Una cifra como la pinta hoja-de-vida (`toLocaleString` de es-CO / en-US): hasta 3 decimales sin ceros de
 * más, separador de miles; sin `Intl`, para que el build no dependa de los datos de idioma del Node que compila.
 */
function cifra(x: number, i: Idioma): string {
  const r = Math.round(x * 1000) / 1000;
  const [ent, dec] = String(Math.abs(r)).split(".");
  const signo = r < 0 ? "-" : "";
  const miles = entero(Number(ent), i);
  return dec
    ? `${signo}${miles}${i === "es" ? "," : "."}${dec}`
    : `${signo}${miles}`;
}

/** «≤ 80» para un texto, «1–8» para una lista: lo que dice el esquema fijado. */
function limiteTexto(ruta: string): string {
  const l = limiteDe(ruta);
  return l.tipo === "lista" ? `${l.min ?? 0}–${l.max}` : `≤ ${l.max}`;
}

function cabe(ruta: string, n: number): boolean {
  const l = limiteDe(ruta);
  return (
    (l.min === undefined || n >= l.min) && (l.max === undefined || n <= l.max)
  );
}

/** La comprobación campo por campo, con la ficha en sus dos idiomas (el contrato recibe uno; se miden los dos). */
function filasDeCampos(
  es: FichaTecnica,
  en: FichaTecnica,
  enlaces: number,
  i: Idioma,
): FilaCampo[] {
  const texto = (
    campo: string,
    ruta: string,
    de: (f: FichaTecnica) => string,
  ) => {
    const a = largo(de(es));
    const b = largo(de(en));
    return {
      campo: `${campo} (es · en)`,
      medida: `${a} · ${b}`,
      limite: limiteTexto(ruta),
      cabe: cabe(ruta, a) && cabe(ruta, b),
    };
  };
  const lista = (ruta: string, n: number) => ({
    campo: `${ruta}[]`,
    medida: String(n),
    limite: limiteTexto(ruta),
    cabe: cabe(ruta, n),
  });
  const conFuente = es.cifras.filter((c) => c.fuente).length;
  const filas: FilaCampo[] = [
    texto("tagline", "promesa.tagline", (f) => f.promesa.tagline),
    texto("titular", "titular", (f) => f.titular),
    texto("para_quien", "promesa.para_quien", (f) => f.promesa.para_quien),
    texto("intro", "promesa.intro", (f) => f.promesa.intro),
    lista("stack", es.stack.length),
    {
      campo: "cifras[] · fuente",
      medida: `${es.cifras.length} · ${conFuente}`,
      limite: `${limiteTexto("cifras")} · ${TABLA.todas[i]}`,
      cabe: cabe("cifras", es.cifras.length) && conFuente === es.cifras.length,
    },
    lista("bloques", es.bloques.length),
    {
      campo: "limites[] · nunca[]",
      medida: `${es.limites.length} · ${es.nunca.length}`,
      limite: `${limiteTexto("limites")} · ${limiteTexto("nunca")}`,
      cabe:
        cabe("limites", es.limites.length) && cabe("nunca", es.nunca.length),
    },
    lista("hitos", es.hitos.length),
  ];
  if (es.proceso && en.proceso) {
    const mas = Math.max(
      ...[...es.proceso.pasos, ...en.proceso.pasos].map((p) => largo(p.texto)),
    );
    filas.push(
      {
        campo: "proceso.pasos[].texto",
        medida: String(mas),
        limite: limiteTexto("proceso.pasos.[].texto"),
        cabe: cabe("proceso.pasos.[].texto", mas),
      },
      lista("proceso.carriles", es.proceso.carriles.length),
    );
  }
  filas.push({
    campo: TABLA.enlaces[i],
    medida: String(enlaces),
    limite: "0",
    cabe: enlaces === 0,
  });
  return filas;
}

function fichaCv(
  clave: FichaCv["clave"],
  f: FichaTecnica,
  otra: FichaTecnica,
  i: Idioma,
  extra: {
    /** El id de cada bloque, en su orden. */
    ids: readonly string[];
    archivo: string;
    entrega: string;
    comprobado: string;
    notas: string[];
  },
): FichaCv {
  const [es, en] = i === "es" ? [f, otra] : [otra, f];
  const problemas = [
    ...problemasDeFicha(es).map((p) => `es ${p}`),
    ...problemasDeFicha(en).map((p) => `en ${p}`),
  ];
  const enlaces = problemas.filter((p) => p.includes("cero enlaces")).length;
  const p = f.proceso;
  const pasosNumerados = p
    ? p.pasos.map((x, k) => ({
        id: x.id,
        carril: x.carril,
        n: k + 1,
        tipo: x.tipo,
        texto: x.texto || (x.tipo === "fin" ? CV.fin[i] : ""),
      }))
    : [];
  const nDe = new Map(pasosNumerados.map((x) => [x.id, x.n]));
  let k = 0;
  const sig = () => String(++k).padStart(2, "0");
  const num = {
    paraQuien: sig(),
    proceso: p ? sig() : null,
    tiene: sig(),
    limites: sig(),
    donde: sig(),
  };
  const total = f.bloques.reduce((s, b) => s + b.cuenta, 0);
  return {
    clave,
    marco: { nombre: f.pieza.nombre, archivo: extra.archivo },
    chips: [
      (CV.estado[f.pieza.estado] ?? CV.estado.inicial)[i],
      ...(f.pieza.estado === "sellado" && f.pieza.sellado_en
        ? [f.pieza.sellado_en]
        : []),
      f.pieza.ciclo,
      CV.sprints(f.pieza.sprints_cerrados)[i],
      `v${f.pieza.version}`,
      CV.datosDel(f.actualizado)[i],
    ],
    sellada: f.pieza.estado === "sellado",
    nombre: f.pieza.nombre,
    tagline: f.promesa.tagline,
    stack: f.stack,
    titular: f.titular,
    cifras: f.cifras.map((c) => ({
      clave: c.clave,
      valor: cifra(c.valor, i),
      // La unidad solo si la etiqueta no la dice ya, como hoja-de-vida.
      unidad:
        c.unidad && !c.etiqueta.toLowerCase().includes(c.unidad.toLowerCase())
          ? c.unidad
          : null,
      completa: !c.unidad
        ? cifra(c.valor, i)
        : c.unidad === "%" && i === "en"
          ? `${cifra(c.valor, i)}%`
          : `${cifra(c.valor, i)}${ESPACIO_DURO}${c.unidad}`,
      etiqueta: c.etiqueta,
      fuente: c.fuente,
      fuenteTexto: CV.fuente[c.fuente]![i],
      detalle: c.detalle,
    })),
    paraQuien: f.promesa.para_quien,
    promesa: f.promesa.intro,
    proceso: p
      ? {
          titulo: p.titulo,
          carriles: p.carriles.map((c) => ({
            id: c.id,
            nombre: c.nombre,
            pasos: pasosNumerados
              .filter((x) => x.carril === c.id)
              .map(({ n, texto, tipo }) => ({ n, texto, tipo })),
          })),
          anotaciones: p.anotaciones.map((a) => ({
            n: nDe.get(a.paso)!,
            texto: a.texto,
          })),
          procedencia: (CV.procedencia[f.procedencia_proceso ?? "app"] ??
            CV.procedencia.app)[i],
        }
      : null,
    num,
    tieneSub: CV.tieneSub({ grupos: f.bloques.length, n: total })[i],
    bloques: f.bloques.map((b, k) => ({
      id: extra.ids[k] ?? String(b.orden),
      orden: b.orden,
      nombre: b.nombre,
      linea: b.linea,
      cuenta: b.cuenta > 0 ? CV.funcionalidades(b.cuenta)[i] : null,
    })),
    limites: f.limites,
    nunca: f.nunca,
    // Las claves que hoja-de-vida traduce; un texto libre (la ficha del agente) se pinta tal cual.
    hitos: f.hitos.map((h) => ({
      valor: h.valor,
      etiqueta: CV.hito[h.etiqueta]?.[i] ?? h.etiqueta,
    })),
    cierre: (clave === "app" ? CV.cierreApp : CV.cierre)[i],
    notas: extra.notas,
    tabla: {
      entrega: extra.entrega,
      comprobado: extra.comprobado,
      filas: filasDeCampos(es, en, enlaces, i),
      problemas,
    },
  };
}

export function vistaFichas(
  ds: DatosDeLosDemos,
  demo: IdDemo,
  repo: HechosDelRepo,
  i: Idioma,
): VistaFichas {
  const d: DatosDemo = ds[demo];
  const otro: Idioma = i === "es" ? "en" : "es";
  const appDe = (x: Idioma) =>
    armarFichaApp(brochureExport(ds, repo, x), complementoPropuesto(ds, x));
  const app = appDe(i);
  const agente = fichaAgente(d, repo, i);
  const E = MIRADA.entregaItems;
  const rutaAgente = RUTA_FICHA_AGENTE[demo];
  const vCorrida = versionCorta(
    d.informe.ficha_reproducibilidad.corrida.plan_de_ejecucion.version,
  );
  return {
    textos: {
      antetitulo: PORTADA.antetitulo[demo][i],
      cuadro: REPRO.cuadro[demo][i],
      seccionApp: SECCION.app[i],
      seccionAgente: SECCION.agente[demo][i],
    },
    mirada: {
      recibe: MIRADA.recibeItems.map((x) => ({
        titulo: x.titulo[i],
        detalle: x.detalle[i],
      })),
      hace: MIRADA.haceItems.map((x) => x[i]),
      entrega: [
        { titulo: E.repro.titulo[i], detalle: E.repro.detalle[i] },
        { titulo: base(RUTA_EXPORT), detalle: E.export[i] },
        { titulo: base(rutaAgente), detalle: E.agente[demo][i] },
        { titulo: E.nunca.titulo[i], detalle: E.nunca.detalle[i] },
      ],
    },
    repro: {
      chip: REPRO.chip(vCorrida)[i],
      filas: filasDeReproducibilidad(d, i, "fichas"),
      pasos: pasosDeRepro(d, i),
    },
    app: fichaCv("app", app, appDe(otro), i, {
      ids: APP.grupos.map((g) => g.id),
      archivo: `${app.pieza.slug}.ficha-tecnica.json`,
      entrega: RUTA_EXPORT,
      comprobado: TABLA.comprobadoApp({
        ficha: VERSION_FICHA,
        exportacion: VERSION_EXPORT,
      })[i],
      notas: [
        SECCION.appArma[i],
        ...(app.proceso ? [] : [SECCION.sinProceso[i]]),
      ],
    }),
    agente: fichaCv("agente", agente, fichaAgente(d, repo, otro), i, {
      ids: d.plan.contrato_de_grafo.nodos_esperados.map((n) => n.id),
      archivo: base(rutaAgente),
      entrega: rutaAgente,
      comprobado: TABLA.comprobado({ version: VERSION_FICHA })[i],
      notas: [],
    }),
    pie: pieDeCorrida(d, i),
  };
}
