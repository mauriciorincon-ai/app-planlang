/**
 * Lector mínimo de WOFF2 para la tabla de métricas del visor (contrato del diagramador, G15): descomprime con el
 * brotli de Node y lee `head`, `hhea`, `hmtx`, `cmap`, `fvar`, `avar` y `HVAR`, lo justo para saber el avance de
 * cada carácter en una instancia (peso, tamaño óptico) de una fuente variable. Sin kerning (cota superior, P12 del
 * contrato). Solo corre en Node, al generar la tabla; el núcleo lee la tabla, nunca la fuente.
 */
import { brotliDecompressSync } from "node:zlib";

const TAGS_CONOCIDOS = [
  "cmap",
  "head",
  "hhea",
  "hmtx",
  "maxp",
  "name",
  "OS/2",
  "post",
  "cvt ",
  "fpgm",
  "glyf",
  "loca",
  "prep",
  "CFF ",
  "VORG",
  "EBDT",
  "EBLC",
  "gasp",
  "hdmx",
  "kern",
  "LTSH",
  "PCLT",
  "VDMX",
  "vhea",
  "vmtx",
  "BASE",
  "GDEF",
  "GPOS",
  "GSUB",
  "EBSC",
  "JSTF",
  "MATH",
  "CBDT",
  "CBLC",
  "COLR",
  "CPAL",
  "SVG ",
  "sbix",
  "acnt",
  "avar",
  "bdat",
  "bloc",
  "bsln",
  "cvar",
  "fdsc",
  "feat",
  "fmtx",
  "fvar",
  "gvar",
  "hsty",
  "just",
  "lcar",
  "mort",
  "morx",
  "opbd",
  "prop",
  "trak",
  "Zapf",
  "Silf",
  "Glat",
  "Gloc",
  "Feat",
  "Sill",
];

export interface Eje {
  tag: string;
  min: number;
  defecto: number;
  max: number;
}

export interface Fuente {
  unidadesPorEm: number;
  ejes: Eje[];
  /** Punto de código → glifo. */
  cmap: Map<number, number>;
  /** Avance de un glifo en la instancia pedida, en unidades de la fuente (sin redondear). */
  avance(glifo: number, instancia: Record<string, number>): number;
}

class Lector {
  constructor(
    readonly b: Buffer,
    public p = 0,
  ) {}
  u8() {
    return this.b.readUInt8(this.p++);
  }
  u16(o = this.avanza(2)) {
    return this.b.readUInt16BE(o);
  }
  i16(o = this.avanza(2)) {
    return this.b.readInt16BE(o);
  }
  u32(o = this.avanza(4)) {
    return this.b.readUInt32BE(o);
  }
  avanza(n: number) {
    const o = this.p;
    this.p += n;
    return o;
  }
  base128() {
    let v = 0;
    for (let i = 0; i < 5; i++) {
      const c = this.u8();
      v = v * 128 + (c & 0x7f);
      if (!(c & 0x80)) return v;
    }
    throw new Error("woff2: UIntBase128 inválido");
  }
}

/** Separa las tablas del flujo descomprimido (en el orden del directorio, sin relleno). */
function tablas(woff2: Buffer): Map<string, Buffer> {
  const l = new Lector(woff2);
  if (woff2.toString("ascii", 0, 4) !== "wOF2") throw new Error("woff2: firma");
  const numTablas = l.u16(12);
  const comprimido = l.u32(20);
  l.p = 48;
  const dir: { tag: string; largo: number }[] = [];
  for (let i = 0; i < numTablas; i++) {
    const banderas = l.u8();
    const tag =
      (banderas & 0x3f) === 0x3f
        ? woff2.toString("ascii", l.avanza(4), l.p)
        : TAGS_CONOCIDOS[banderas & 0x3f];
    const version = (banderas >> 6) & 3;
    const original = l.base128();
    const transformada =
      ((tag === "glyf" || tag === "loca") && version === 0) ||
      (tag === "hmtx" && version === 1);
    if (tag === "hmtx" && transformada)
      throw new Error("woff2: hmtx transformada no soportada");
    dir.push({ tag, largo: transformada ? l.base128() : original });
  }
  const flujo = brotliDecompressSync(woff2.subarray(l.p, l.p + comprimido));
  const out = new Map<string, Buffer>();
  let o = 0;
  for (const t of dir) {
    out.set(t.tag, flujo.subarray(o, o + t.largo));
    o += t.largo;
  }
  if (o !== flujo.length)
    throw new Error("woff2: el flujo no cuadra con el directorio");
  const head = out.get("head");
  if (!head || head.readUInt32BE(12) !== 0x5f0f3cf5)
    throw new Error("woff2: head sin número mágico");
  return out;
}

function leerCmap(t: Buffer): Map<number, number> {
  const l = new Lector(t);
  const n = l.u16(2);
  let f12 = -1;
  let f4 = -1;
  for (let i = 0; i < n; i++) {
    const plataforma = l.u16(4 + i * 8);
    const cod = l.u16(6 + i * 8);
    const off = l.u32(8 + i * 8);
    const formato = l.u16(off);
    if (formato === 12 && (plataforma === 3 || plataforma === 0)) f12 = off;
    if (formato === 4 && ((plataforma === 3 && cod === 1) || plataforma === 0))
      f4 = off;
  }
  const m = new Map<number, number>();
  if (f12 >= 0) {
    const grupos = l.u32(f12 + 12);
    for (let g = 0; g < grupos; g++) {
      const b = f12 + 16 + g * 12;
      const ini = l.u32(b);
      const fin = l.u32(b + 4);
      const glifo = l.u32(b + 8);
      for (let c = ini; c <= fin; c++) m.set(c, glifo + (c - ini));
    }
    return m;
  }
  if (f4 < 0) throw new Error("cmap: sin subtabla 4 ni 12");
  const segs = l.u16(f4 + 6) / 2;
  const fin = f4 + 14;
  const ini = fin + segs * 2 + 2;
  const delta = ini + segs * 2;
  const rango = delta + segs * 2;
  for (let s = 0; s < segs; s++) {
    const a = l.u16(ini + s * 2);
    const z = l.u16(fin + s * 2);
    const d = l.i16(delta + s * 2);
    const r = l.u16(rango + s * 2);
    for (let c = a; c <= z && c !== 0xffff; c++) {
      let g: number;
      if (r === 0) g = (c + d) & 0xffff;
      else {
        g = l.u16(rango + s * 2 + r + (c - a) * 2);
        if (g !== 0) g = (g + d) & 0xffff;
      }
      if (g !== 0) m.set(c, g);
    }
  }
  return m;
}

const f2dot14 = (v: number) => v / 16384;
const fixed = (v: number) => v / 65536;
const cuantiza = (v: number) => Math.round(v * 16384) / 16384;

export function leerWoff2(woff2: Buffer): Fuente {
  const t = tablas(woff2);
  const head = t.get("head")!;
  const hhea = t.get("hhea")!;
  const hmtx = t.get("hmtx")!;
  const unidadesPorEm = head.readUInt16BE(18);
  const nMetricas = hhea.readUInt16BE(34);
  const avanceBase = (g: number) =>
    hmtx.readUInt16BE(Math.min(g, nMetricas - 1) * 4);

  const ejes: Eje[] = [];
  const fvar = t.get("fvar");
  if (fvar) {
    const off = fvar.readUInt16BE(4);
    const n = fvar.readUInt16BE(8);
    const tam = fvar.readUInt16BE(10);
    for (let i = 0; i < n; i++) {
      const b = off + i * tam;
      ejes.push({
        tag: fvar.toString("ascii", b, b + 4),
        min: fixed(fvar.readInt32BE(b + 4)),
        defecto: fixed(fvar.readInt32BE(b + 8)),
        max: fixed(fvar.readInt32BE(b + 12)),
      });
    }
  }
  const avarMapas: [number, number][][] = [];
  const avar = t.get("avar");
  if (avar) {
    let o = 8;
    for (let i = 0; i < avar.readUInt16BE(6); i++) {
      const n = avar.readUInt16BE(o);
      o += 2;
      const mapa: [number, number][] = [];
      for (let k = 0; k < n; k++, o += 4)
        mapa.push([
          f2dot14(avar.readInt16BE(o)),
          f2dot14(avar.readInt16BE(o + 2)),
        ]);
      avarMapas.push(mapa);
    }
  }
  function normaliza(instancia: Record<string, number>): number[] {
    return ejes.map((e, i) => {
      const v = Math.min(e.max, Math.max(e.min, instancia[e.tag] ?? e.defecto));
      let n =
        v < e.defecto
          ? (v - e.defecto) / (e.defecto - e.min)
          : v > e.defecto
            ? (v - e.defecto) / (e.max - e.defecto)
            : 0;
      n = cuantiza(n);
      const m = avarMapas[i];
      if (m && m.length) {
        for (let k = 1; k < m.length; k++) {
          const [a0, b0] = m[k - 1];
          const [a1, b1] = m[k];
          if (n >= a0 && n <= a1) {
            n = a1 === a0 ? b0 : b0 + ((n - a0) * (b1 - b0)) / (a1 - a0);
            break;
          }
        }
        n = cuantiza(n);
      }
      return n;
    });
  }

  const hvar = t.get("HVAR");
  let delta: (g: number, coords: number[]) => number = () => 0;
  if (hvar) {
    const almacen = hvar.readUInt32BE(4);
    const mapaAvance = hvar.readUInt32BE(8);
    const regiones = almacen + hvar.readUInt32BE(almacen + 2);
    const nEjesR = hvar.readUInt16BE(regiones);
    const nRegiones = hvar.readUInt16BE(regiones + 2);
    const region = (r: number, a: number) => {
      const b = regiones + 4 + (r * nEjesR + a) * 6;
      return [
        hvar.readInt16BE(b),
        hvar.readInt16BE(b + 2),
        hvar.readInt16BE(b + 4),
      ].map(f2dot14);
    };
    const nDatos = hvar.readUInt16BE(almacen + 6);
    const datos = Array.from(
      { length: nDatos },
      (_, i) => almacen + hvar.readUInt32BE(almacen + 8 + i * 4),
    );
    let indice: (g: number) => [number, number] = (g) => [0, g];
    if (mapaAvance) {
      const formato = hvar.readUInt8(mapaAvance);
      const entrada = hvar.readUInt8(mapaAvance + 1);
      const cuenta =
        formato === 0
          ? hvar.readUInt16BE(mapaAvance + 2)
          : hvar.readUInt32BE(mapaAvance + 2);
      const base = mapaAvance + (formato === 0 ? 4 : 6);
      const bitsInternos = (entrada & 0x0f) + 1;
      const tam = ((entrada >> 4) & 3) + 1;
      indice = (g) => {
        const i = Math.min(g, cuenta - 1);
        let v = 0;
        for (let k = 0; k < tam; k++)
          v = v * 256 + hvar.readUInt8(base + i * tam + k);
        return [Math.floor(v / 2 ** bitsInternos), v % 2 ** bitsInternos];
      };
    }
    delta = (g, coords) => {
      const [ext, int] = indice(g);
      const d = datos[ext];
      const items = hvar.readUInt16BE(d);
      const palabras = hvar.readUInt16BE(d + 2);
      const nRegIdx = hvar.readUInt16BE(d + 4);
      if (int >= items) return 0;
      const largas = (palabras & 0x8000) !== 0;
      const nPal = palabras & 0x7fff;
      const tamGrande = largas ? 4 : 2;
      const tamChico = largas ? 2 : 1;
      const fila = nPal * tamGrande + (nRegIdx - nPal) * tamChico;
      let o = d + 6 + nRegIdx * 2 + int * fila;
      let suma = 0;
      for (let k = 0; k < nRegIdx; k++) {
        let v: number;
        if (k < nPal) {
          v = largas ? hvar.readInt32BE(o) : hvar.readInt16BE(o);
          o += tamGrande;
        } else {
          v = largas ? hvar.readInt16BE(o) : hvar.readInt8(o);
          o += tamChico;
        }
        const r = hvar.readUInt16BE(d + 6 + k * 2);
        if (r >= nRegiones) continue;
        let escala = 1;
        for (let a = 0; a < nEjesR && escala !== 0; a++) {
          const [ini, pico, fin] = region(r, a);
          const c = coords[a] ?? 0;
          if (
            pico === 0 ||
            ini > pico ||
            pico > fin ||
            (ini < 0 && fin > 0) ||
            c === pico
          )
            continue;
          if (c <= ini || c >= fin) escala = 0;
          else
            escala *=
              c < pico ? (c - ini) / (pico - ini) : (fin - c) / (fin - pico);
        }
        suma += escala * v;
      }
      return suma;
    };
  }
  return {
    unidadesPorEm,
    ejes,
    cmap: leerCmap(t.get("cmap")!),
    avance: (g, instancia) => avanceBase(g) + delta(g, normaliza(instancia)),
  };
}
