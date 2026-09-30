/**
 * Geometría del lienzo del visor: un dato puro, IGUAL en todos los idiomas (§ 5.3): las cajas, los trazados y
 * las etiquetas se calculan con el texto más largo entre los idiomas declarados; solo el texto cambia.
 * Disposición en `disposicion.ts`, ruteo en `ruteo.ts`. Coordenadas enteras (las etiquetas y los saltos, a
 * medio punto como mucho).
 */
import type { Idioma } from "../formatos/bilingue";
import {
  COL_ANCHO,
  MARGEN,
  NODO_ALTO,
  PASO_COLUMNA,
  PASO_FILA,
  disponer,
  xColumna,
} from "./disposicion";
import { ESTILOS, type EstiloDeTexto, type NombreDeEstilo } from "./estilos";
import { idDeCodigo } from "./ids";
import { SENAL_POR_DEFECTO } from "./mapa";
import { ancho, partir } from "./medida";
import {
  HOLGURA,
  rutear,
  type Lado,
  type Pedido,
  type Punto,
  type Rect,
} from "./ruteo";
import type {
  Condicion,
  FlujoMapa,
  Gramatica,
  Mapa,
  TextoIdioma,
} from "./tipos";

export const INICIO_ID = "inicio";
export const FIN_ID = "fin";

export interface TextoPorIdioma {
  lineas: Record<Idioma, string[]>;
  estilo: NombreDeEstilo;
}

export interface BandaGeo {
  id: string;
  columna: number;
  x: number;
  numero: string;
  nombre: TextoPorIdioma;
  pregunta: TextoPorIdioma;
}

export interface NodoGeo {
  id: string;
  caja: Rect;
  fila: number;
  columna: number;
  tipo: string;
  madurez: string;
  fueraDelContrato: boolean;
  codigo: TextoPorIdioma;
  nombre: TextoPorIdioma;
}

export interface TerminalGeo {
  id: typeof INICIO_ID | typeof FIN_ID;
  cx: number;
  cy: number;
  r: number;
  etiqueta: TextoPorIdioma;
}

export interface EtiquetaGeo {
  caja: Rect;
  texto: TextoPorIdioma;
}

export interface LineaGeo {
  id: string;
  flujos: string[];
  modo: string;
  origen: string;
  destino: string;
  puntos: Punto[];
  ladoOrigen: Lado;
  ladoDestino: Lado;
  /** Saltos: por índice de tramo horizontal, las x donde cruza una vertical de otra línea. */
  saltos: Array<{ tramo: number; x: number }>;
  marcador?: Punto;
  etiqueta?: EtiquetaGeo;
  /** Conteo de reglas del plan que lleva (0 en secuencia, reanudación y «si no»). */
  reglas: number;
}

export interface Geometria {
  ancho: number;
  alto: number;
  cabecera: number;
  guias: { xs: number[]; y1: number; y2: number };
  bandas: BandaGeo[];
  nodos: NodoGeo[];
  terminales: TerminalGeo[];
  lineas: LineaGeo[];
  /** Lo que el motor no pudo dibujar sin encimar (el contrato lo reporta, no lo esconde). */
  avisos: string[];
}

export interface OpcionesGeometria {
  idiomas: readonly Idioma[];
  terminales: { inicio: readonly string[]; fin: readonly string[] };
  textosTerminales: { inicio: TextoIdioma; fin: TextoIdioma };
  /** Lo que sigue a la etiqueta corta del tipo en la caja («2 reglas», «sonnet», «auditor»), por id del mapa. */
  detalleNodo?: Readonly<Record<string, TextoIdioma>>;
  /** Nombre corto de una regla para las líneas que agrupan tres o más, por id de flujo. */
  reglasCortas?: Readonly<Record<string, TextoIdioma>>;
}

const MARGEN_SUP = 14;
const RADIO_TERMINAL = 9;
const RETROCESO_PUNTA = 3;
const ETIQUETA_MAX = 400;
const RELLENO = 3;
const SEP = " · ";

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function porIdioma(
  idiomas: readonly Idioma[],
  f: (i: Idioma) => string[],
): Record<Idioma, string[]> {
  const out = {} as Record<Idioma, string[]>;
  for (const i of idiomas) out[i] = f(i);
  return out;
}

function maxLineas(t: TextoPorIdioma): number {
  return Math.max(...Object.values(t.lineas).map((l) => l.length));
}

function anchoMax(t: TextoPorIdioma): number {
  const e = ESTILOS[t.estilo] as EstiloDeTexto;
  return Math.max(
    ...Object.values(t.lineas).flatMap((l) => l.map((x) => ancho(x, e))),
  );
}

const SIMBOLO: Record<string, string> = {
  "<": "<",
  "<=": "≤",
  "=": "=",
  "!=": "≠",
  ">=": "≥",
  ">": ">",
};

export function textoDeRegla(c: Condicion): string {
  return `${idDeCodigo(c.senal)} ${SIMBOLO[c.operador]} ${String(c.valor)}`;
}

const O: TextoIdioma = { es: "o", en: "or" };
const REGLAS: TextoIdioma = { es: "reglas", en: "rules" };
const SI_NO: TextoIdioma = { es: "si no", en: "else" };
const REANUDA: TextoIdioma = { es: "reanuda", en: "resumes" };

function etiquetaDe(
  flujos: readonly FlujoMapa[],
  modo: string,
  idiomas: readonly Idioma[],
  cortas: Readonly<Record<string, TextoIdioma>>,
): TextoPorIdioma | undefined {
  if (modo === "secuencia") return undefined;
  if (modo === "reanudacion")
    return {
      lineas: porIdioma(idiomas, (i) => [REANUDA[i]]),
      estilo: "flujoSuave",
    };
  const reglas = flujos.filter(
    (f) => f.condicion && f.condicion.senal !== SENAL_POR_DEFECTO,
  );
  if (reglas.length === 0)
    return {
      lineas: porIdioma(idiomas, (i) => [SI_NO[i]]),
      estilo: "flujoSuave",
    };
  const e = ESTILOS.flujoRegla;
  if (reglas.length <= 2)
    return {
      lineas: porIdioma(idiomas, (i) =>
        reglas.map(
          (f, k) =>
            `${k ? `${O[i]} ` : ""}${textoDeRegla(f.condicion as Condicion)}`,
        ),
      ),
      estilo: "flujoRegla",
    };
  return {
    lineas: porIdioma(idiomas, (i) =>
      partir(
        `${reglas.length} ${REGLAS[i]}: ${reglas.map((f) => cortas[f.id]?.[i] ?? idDeCodigo((f.condicion as Condicion).senal)).join(SEP)}`,
        e,
        ETIQUETA_MAX,
      ),
    ),
    estilo: "flujoRegla",
  };
}

function cruzaRect(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

function infla(r: Rect, d: number): Rect {
  return { x: r.x - d, y: r.y - d, w: r.w + 2 * d, h: r.h + 2 * d };
}

function tramoCortaRect([x1, y1]: Punto, [x2, y2]: Punto, r: Rect): boolean {
  const caja: Rect = {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.abs(x2 - x1) || 0.001,
    h: Math.abs(y2 - y1) || 0.001,
  };
  return cruzaRect(caja, r);
}

export function geometria(
  mapa: Mapa,
  g: Gramatica,
  op: OpcionesGeometria,
): Geometria {
  const idiomas = op.idiomas;
  const disp = disponer(mapa, g, op.terminales.inicio);
  const n = disp.columnas.length;
  const anchoLienzo =
    2 * MARGEN + n * PASO_COLUMNA - (PASO_COLUMNA - COL_ANCHO);

  // Cabeceras: número, nombre y pregunta de la gramática, partidos a la columna; altura común (D2).
  const bandas: BandaGeo[] = disp.columnas.map((id, i) => {
    const b = g.bandas.find((x) => x.id === id)!;
    return {
      id,
      columna: i,
      x: xColumna(i),
      numero: String(i + 1).padStart(2, "0"),
      nombre: {
        lineas: porIdioma(idiomas, (l) =>
          partir(b.nombre[l], ESTILOS.bandaNombre, COL_ANCHO),
        ),
        estilo: "bandaNombre",
      },
      pregunta: {
        lineas: porIdioma(idiomas, (l) =>
          partir(b.pregunta_lider[l], ESTILOS.bandaPregunta, COL_ANCHO),
        ),
        estilo: "bandaPregunta",
      },
    };
  });
  const lNombre = Math.max(...bandas.map((b) => maxLineas(b.nombre)));
  const lPregunta = Math.max(...bandas.map((b) => maxLineas(b.pregunta)));
  const cabecera =
    MARGEN_SUP +
    ESTILOS.bandaNumero.tam +
    6 +
    lNombre * ESTILOS.bandaNombre.interlinea +
    lPregunta * ESTILOS.bandaPregunta.interlinea;
  const carrilSuperior = cabecera + 22;
  const fila0 = cabecera + 48;
  const yFila = (f: number) => fila0 + f * PASO_FILA;

  const detalle = op.detalleNodo ?? {};
  const nodos: NodoGeo[] = mapa.nodos.map((nm) => {
    const c = disp.celdas.get(nm.id)!;
    const tipo = g.tipos_de_nodo.find((t) => t.id === nm.tipo_id)!;
    return {
      id: nm.id,
      caja: {
        x: xColumna(c.columna),
        y: yFila(c.fila),
        w: COL_ANCHO,
        h: NODO_ALTO,
      },
      fila: c.fila,
      columna: c.columna,
      tipo: nm.tipo_id,
      madurez: nm.madurez,
      fueraDelContrato: (nm.refs_externas ?? []).includes(
        "planlang:fuera-del-contrato",
      ),
      codigo: {
        lineas: porIdioma(idiomas, (l) => [
          detalle[nm.id]
            ? `${tipo.etiqueta_corta[l]}${SEP}${detalle[nm.id]![l]}`
            : tipo.etiqueta_corta[l],
        ]),
        estilo: "nodoCodigo",
      },
      nombre: {
        lineas: porIdioma(idiomas, (l) =>
          partir(nm.nombre[l], ESTILOS.nodoNombre, COL_ANCHO - 20),
        ),
        estilo: "nodoNombre",
      },
    };
  });
  const cajaDe = new Map(nodos.map((x) => [x.id, x.caja] as const));

  // Terminales: el inicio en la primera capa, a la altura de su primer destino; el fin en la última.
  const terminales: TerminalGeo[] = [];
  const primero = op.terminales.inicio.find((id) => cajaDe.has(id));
  if (primero) {
    const c = cajaDe.get(primero)!;
    terminales.push({
      id: INICIO_ID,
      cx: xColumna(0) + COL_ANCHO / 2,
      cy: c.y + NODO_ALTO / 2,
      r: RADIO_TERMINAL,
      etiqueta: {
        lineas: porIdioma(idiomas, (l) => [op.textosTerminales.inicio[l]]),
        estilo: "terminal",
      },
    });
  }
  const ultimo = op.terminales.fin.find((id) => cajaDe.has(id));
  if (ultimo) {
    const c = cajaDe.get(ultimo)!;
    terminales.push({
      id: FIN_ID,
      cx: xColumna(n - 1) + COL_ANCHO / 2,
      cy: c.y + NODO_ALTO / 2,
      r: RADIO_TERMINAL,
      etiqueta: {
        lineas: porIdioma(idiomas, (l) => [op.textosTerminales.fin[l]]),
        estilo: "terminal",
      },
    });
  }
  const cajaTerminal = (t: TerminalGeo): Rect => ({
    x: t.cx - t.r,
    y: t.cy - t.r,
    w: 2 * t.r,
    h: 2 * t.r,
  });
  const etiquetaTerminal = (t: TerminalGeo): Rect => {
    const w = Math.ceil(anchoMax(t.etiqueta));
    return { x: t.cx - Math.ceil(w / 2), y: t.cy + t.r + 6, w, h: 16 };
  };

  // Líneas: una por (origen, destino, modo, ¿por defecto?).
  const grupos = new Map<string, FlujoMapa[]>();
  for (const f of mapa.flujos) {
    const defecto = f.condicion?.senal === SENAL_POR_DEFECTO;
    const k = `${f.origen}|${f.destino}|${f.modo_id}|${defecto ? "d" : "r"}`;
    (grupos.get(k) ?? grupos.set(k, []).get(k)!).push(f);
  }
  const cajas = new Map<string, Rect>([...cajaDe]);
  for (const t of terminales) cajas.set(t.id, cajaTerminal(t));
  interface Pendiente extends Pedido {
    flujos: FlujoMapa[];
    modo: string;
  }
  const pendientes: Pendiente[] = [];
  for (const [k, fs] of grupos) {
    const [o, d, modo, tipo] = k.split("|") as [string, string, string, string];
    pendientes.push({
      id: `${o}-a-${d}${tipo === "d" ? "-defecto" : ""}`,
      origen: o,
      destino: d,
      flujos: fs,
      modo,
    });
  }
  if (primero)
    pendientes.push({
      id: `${INICIO_ID}-a-${primero}`,
      origen: INICIO_ID,
      destino: primero,
      flujos: [],
      modo: "secuencia",
    });
  for (const s of op.terminales.fin)
    if (cajaDe.has(s) && ultimo)
      pendientes.push({
        id: `${s}-a-${FIN_ID}`,
        origen: s,
        destino: FIN_ID,
        flujos: [],
        modo: "secuencia",
      });
  const centro = (k: string): Punto => {
    const r = cajas.get(k)!;
    return [r.x + r.w / 2, r.y + r.h / 2];
  };
  const dist = (p: Pedido) => {
    const [a, b] = [centro(p.origen), centro(p.destino)];
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  };
  pendientes.sort((a, b) => dist(a) - dist(b) || cmp(a.id, b.id));

  const filas = disp.filas;
  const fondo = yFila(filas - 1) + NODO_ALTO;
  const alto0 = fondo + 70;
  const lineasX: number[] = [MARGEN - 6, anchoLienzo - MARGEN + 6];
  for (let i = 0; i < n; i++) {
    if (i > 0) lineasX.push(xColumna(i) - (PASO_COLUMNA - COL_ANCHO) / 2);
    lineasX.push(xColumna(i) + 40, xColumna(i) + 80, xColumna(i) + 120);
  }
  const lineasY: number[] = [carrilSuperior, fondo + 24, fondo + 46];
  for (let f = 0; f < filas; f++) {
    lineasY.push(yFila(f) + NODO_ALTO / 2);
    if (f > 0) lineasY.push(yFila(f) - 56, yFila(f) - 28);
  }
  const obstaculos = terminales.map(etiquetaTerminal);
  // Pasillos estrechos: el canal entre dos columnas a la altura de una fila (recorrerlo largo encima la lectura).
  const estrechos: Rect[] = [];
  const hueco = PASO_COLUMNA - COL_ANCHO;
  for (let f = 0; f < filas; f++)
    for (let i = 1; i < n; i++)
      estrechos.push({
        x: xColumna(i) - hueco,
        y: yFila(f),
        w: hueco,
        h: NODO_ALTO,
      });
  const rutas = rutear(
    {
      ancho: anchoLienzo,
      alto: alto0,
      yMin: cabecera + 8,
      cajas,
      obstaculos,
      lineasX,
      lineasY,
      estrechos,
    },
    pendientes,
  );

  const cortas = op.reglasCortas ?? {};
  const lineas: LineaGeo[] = pendientes.map((p) => {
    const r = rutas.find((x) => x.id === p.id)!;
    const puntos = r.puntos.map((q) => [q[0], q[1]] as Punto);
    const [ax, ay] = puntos[puntos.length - 2]!;
    const [bx, by] = puntos[puntos.length - 1]!;
    const largo = Math.abs(bx - ax) + Math.abs(by - ay);
    if (largo > 2 * RETROCESO_PUNTA)
      puntos[puntos.length - 1] = [
        bx - Math.sign(bx - ax) * RETROCESO_PUNTA,
        by - Math.sign(by - ay) * RETROCESO_PUNTA,
      ];
    const reglas = p.flujos.filter(
      (f) => f.condicion && f.condicion.senal !== SENAL_POR_DEFECTO,
    ).length;
    const l: LineaGeo = {
      id: `l-${p.id}`,
      flujos: p.flujos.map((f) => f.id).sort(cmp),
      modo: p.modo,
      origen: p.origen,
      destino: p.destino,
      puntos,
      ladoOrigen: r.ladoOrigen,
      ladoDestino: r.ladoDestino,
      saltos: [],
      reglas,
    };
    if (p.modo === "condicional") {
      const [x0, y0] = puntos[0]!;
      const [x1, y1] = puntos[1]!;
      const primerTramo = Math.abs(x1 - x0) + Math.abs(y1 - y0);
      if (primerTramo >= 30)
        l.marcador = [
          x0 + Math.sign(x1 - x0) * 18,
          y0 + Math.sign(y1 - y0) * 18,
        ];
    }
    const et = etiquetaDe(p.flujos, p.modo, idiomas, cortas);
    if (et) l.etiqueta = { caja: { x: 0, y: 0, w: 0, h: 0 }, texto: et };
    return l;
  });

  // Saltos: donde una horizontal cruza la vertical de otra línea, la horizontal salta (convención fija).
  for (const a of lineas)
    for (let i = 1; i < a.puntos.length; i++) {
      const [x1, y] = a.puntos[i - 1]!;
      const [x2, y2] = a.puntos[i]!;
      if (y !== y2) continue;
      for (const b of lineas) {
        if (b === a) continue;
        for (let j = 1; j < b.puntos.length; j++) {
          const [vx, vy1] = b.puntos[j - 1]!;
          const [vx2, vy2] = b.puntos[j]!;
          if (vx !== vx2) continue;
          if (
            vx > Math.min(x1, x2) + 8 &&
            vx < Math.max(x1, x2) - 8 &&
            y > Math.min(vy1, vy2) &&
            y < Math.max(vy1, vy2)
          )
            a.saltos.push({ tramo: i - 1, x: vx });
        }
      }
      a.saltos.sort((p, q) => p.tramo - q.tramo || p.x - q.x);
    }

  // Etiquetas: primer lugar libre junto al tramo más largo; ninguna encima de una caja, de un terminal, de la
  // cabecera ni de otra etiqueta. Si ninguno está libre de líneas ajenas, el que menos toca.
  const avisos: string[] = [];
  const prohibido: Rect[] = [
    ...[...cajas.values()].map((r) => infla(r, 3)),
    ...obstaculos.map((r) => infla(r, 2)),
    { x: 0, y: 0, w: anchoLienzo, h: cabecera + 4 },
  ];
  const puestas: Rect[] = [];
  for (const l of lineas) {
    if (!l.etiqueta) continue;
    const t = l.etiqueta.texto;
    const w = Math.ceil(anchoMax(t)) + 2 * RELLENO;
    const h = maxLineas(t) * (ESTILOS[t.estilo] as EstiloDeTexto).interlinea;
    const tramos = l.puntos
      .slice(1)
      .map((q, i) => [l.puntos[i]!, q, i] as const)
      .sort(
        (a, b) =>
          Math.abs(b[1][0] - b[0][0]) +
            Math.abs(b[1][1] - b[0][1]) -
            (Math.abs(a[1][0] - a[0][0]) + Math.abs(a[1][1] - a[0][1])) ||
          a[2] - b[2],
      );
    let mejor: { caja: Rect; toques: number } | null = null;
    for (const [p, q] of tramos) {
      const horizontal = p[1] === q[1];
      for (const f of [0.5, 0.35, 0.65, 0.2, 0.8]) {
        const cx = Math.round(p[0] + (q[0] - p[0]) * f);
        const cy = Math.round(p[1] + (q[1] - p[1]) * f);
        const candidatas: Rect[] = [];
        for (let d = 5; d <= 45; d += 4)
          if (horizontal)
            candidatas.push(
              { x: cx - Math.ceil(w / 2), y: p[1] - d - h, w, h },
              { x: cx - Math.ceil(w / 2), y: p[1] + d, w, h },
            );
          else
            candidatas.push(
              { x: p[0] + d + 1, y: cy - Math.ceil(h / 2), w, h },
              { x: p[0] - d - 1 - w, y: cy - Math.ceil(h / 2), w, h },
            );
        for (const c of candidatas) {
          if (c.x < 2 || c.x + c.w > anchoLienzo - 2 || c.y < cabecera + 4)
            continue;
          if (
            prohibido.some((r) => cruzaRect(c, r)) ||
            puestas.some((r) => cruzaRect(c, infla(r, 3)))
          )
            continue;
          let toques = 0;
          for (const o of lineas)
            for (let i = 1; i < o.puntos.length; i++)
              if (
                tramoCortaRect(
                  o.puntos[i - 1]!,
                  o.puntos[i]!,
                  infla(c, o === l ? -1 : 1),
                )
              )
                toques += o === l ? 0 : 1;
          if (!mejor || toques < mejor.toques) mejor = { caja: c, toques };
          if (toques === 0) break;
        }
        if (mejor?.toques === 0) break;
      }
      if (mejor?.toques === 0) break;
    }
    if (!mejor) {
      avisos.push(`etiqueta sin lugar: ${l.id}`);
      delete l.etiqueta;
      continue;
    }
    l.etiqueta.caja = mejor.caja;
    puestas.push(mejor.caja);
  }

  // Alto final: lo más bajo que se dibuja más un margen.
  let abajo = fondo;
  for (const l of lineas) {
    for (const [, y] of l.puntos) abajo = Math.max(abajo, y);
    if (l.etiqueta)
      abajo = Math.max(abajo, l.etiqueta.caja.y + l.etiqueta.caja.h);
  }
  for (const r of obstaculos) abajo = Math.max(abajo, r.y + r.h);
  const alto = abajo + 14;
  const xsGuia: number[] = [];
  for (let i = 1; i < n; i++)
    xsGuia.push(xColumna(i) - (PASO_COLUMNA - COL_ANCHO) / 2);

  // D11: ningún tramo atraviesa una caja que no es su origen ni su destino (el ruteo lo garantiza; se mide).
  for (const l of lineas)
    for (let i = 1; i < l.puntos.length; i++)
      for (const [k, r] of cajas)
        if (
          k !== l.origen &&
          k !== l.destino &&
          tramoCortaRect(l.puntos[i - 1]!, l.puntos[i]!, infla(r, HOLGURA - 1))
        )
          avisos.push(`D11: ${l.id} atraviesa ${k}`);

  return {
    ancho: anchoLienzo,
    alto,
    cabecera,
    guias: { xs: xsGuia, y1: cabecera + 8, y2: alto - 8 },
    bandas,
    nodos,
    terminales,
    lineas,
    avisos,
  };
}
