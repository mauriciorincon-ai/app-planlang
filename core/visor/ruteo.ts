/**
 * Ruteo ortogonal del visor (D4, D11): camino de menor costo sobre una rejilla DISPERSA de líneas candidatas
 * (canales entre columnas, calles entre filas, carriles bajo el lienzo y las líneas de los puertos). Costo =
 * largo + codos + cruces + solapes con lo ya ruteado. Ningún tramo atraviesa una caja que no es su origen ni su
 * destino: esas aristas no existen en la rejilla. Todo entero y con desempate fijo (G1, G2).
 *
 * Dos pasadas: la primera elige el lado de salida y de llegada con puertos en el centro de cada lado; la
 * segunda reparte los puertos de cada lado (`k` puertos en `i/(k+1)`, contrato § 5.3) y rutea otra vez; luego
 * prueba las permutaciones del orden de los puertos de cada lado con dos o más y se queda con la de menor costo.
 */
export type Lado = "arriba" | "abajo" | "izquierda" | "derecha";
export const LADOS: readonly Lado[] = [
  "derecha",
  "abajo",
  "arriba",
  "izquierda",
];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Pedido {
  id: string;
  origen: string;
  destino: string;
}

export type Punto = [number, number];

export interface Ruta {
  id: string;
  puntos: Punto[];
  ladoOrigen: Lado;
  ladoDestino: Lado;
}

export interface Escenario {
  ancho: number;
  alto: number;
  /** Nada se rutea por encima de esta y (las cabeceras de banda). */
  yMin: number;
  /** Cajas que se conectan (nodos y terminales). También son obstáculos. */
  cajas: ReadonlyMap<string, Rect>;
  /** Obstáculos que no se conectan (textos de terminales). */
  obstaculos: readonly Rect[];
  lineasX: readonly number[];
  lineasY: readonly number[];
  /** Pasillos estrechos (entre dos cajas de una fila): recorrerlos cuesta el triple por unidad. */
  estrechos?: readonly Rect[];
  /** Lados por los que una caja no se conecta (un terminal, por abajo: ahí va su rótulo). */
  sinLado?: ReadonlyMap<string, readonly Lado[]>;
}

export const HOLGURA = 4;
const CODO = 60;
const CRUCE = 150;
const SOLAPE = 20;
const ESTRECHO = 3;
const DIRS: readonly Punto[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const SALIDA: Record<Lado, number> = {
  derecha: 0,
  izquierda: 1,
  abajo: 2,
  arriba: 3,
};

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function infla(r: Rect, d: number): Rect {
  return { x: r.x - d, y: r.y - d, w: r.w + 2 * d, h: r.h + 2 * d };
}

function dentro(x: number, y: number, r: Rect): boolean {
  return x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
}

/** ¿El tramo alineado a un eje entra en el interior del rectángulo? */
function cortaRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r: Rect,
): boolean {
  if (y1 === y2) {
    if (y1 <= r.y || y1 >= r.y + r.h) return false;
    return Math.max(x1, x2) > r.x && Math.min(x1, x2) < r.x + r.w;
  }
  if (x1 <= r.x || x1 >= r.x + r.w) return false;
  return Math.max(y1, y2) > r.y && Math.min(y1, y2) < r.y + r.h;
}

export function puertoEn(r: Rect, lado: Lado, i: number, k: number): Punto {
  switch (lado) {
    case "derecha":
      return [r.x + r.w, r.y + Math.round((r.h * (i + 1)) / (k + 1))];
    case "izquierda":
      return [r.x, r.y + Math.round((r.h * (i + 1)) / (k + 1))];
    case "abajo":
      return [r.x + Math.round((r.w * (i + 1)) / (k + 1)), r.y + r.h];
    case "arriba":
      return [r.x + Math.round((r.w * (i + 1)) / (k + 1)), r.y];
  }
}

interface Tramo {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function tramosDe(puntos: readonly Punto[]): Tramo[] {
  const t: Tramo[] = [];
  for (let i = 1; i < puntos.length; i++) {
    const [x1, y1] = puntos[i - 1] as Punto;
    const [x2, y2] = puntos[i] as Punto;
    t.push({ x1, y1, x2, y2 });
  }
  return t;
}

function sobre(x: number, y: number, t: Tramo): boolean {
  return (
    x >= Math.min(t.x1, t.x2) &&
    x <= Math.max(t.x1, t.x2) &&
    y >= Math.min(t.y1, t.y2) &&
    y <= Math.max(t.y1, t.y2)
  );
}

/**
 * Penalización de un tramo candidato frente a lo ya ruteado: cruces perpendiculares, largo solapado y TOQUES
 * (un extremo sobre otra línea: dos líneas que se unen en una esquina se leen como una sola).
 */
function penalizacion(a: Tramo, ya: readonly Tramo[]): number {
  let p = 0;
  const hA = a.y1 === a.y2;
  for (const b of ya) {
    if (
      sobre(a.x1, a.y1, b) ||
      sobre(a.x2, a.y2, b) ||
      sobre(b.x1, b.y1, a) ||
      sobre(b.x2, b.y2, a)
    )
      p += CRUCE;
    const hB = b.y1 === b.y2;
    if (hA === hB) {
      if (hA && a.y1 === b.y1) {
        const s =
          Math.min(Math.max(a.x1, a.x2), Math.max(b.x1, b.x2)) -
          Math.max(Math.min(a.x1, a.x2), Math.min(b.x1, b.x2));
        if (s > 0) p += s * SOLAPE;
      } else if (!hA && a.x1 === b.x1) {
        const s =
          Math.min(Math.max(a.y1, a.y2), Math.max(b.y1, b.y2)) -
          Math.max(Math.min(a.y1, a.y2), Math.min(b.y1, b.y2));
        if (s > 0) p += s * SOLAPE;
      }
      continue;
    }
    const h = hA ? a : b;
    const v = hA ? b : a;
    const x = v.x1;
    const y = h.y1;
    if (
      x > Math.min(h.x1, h.x2) &&
      x < Math.max(h.x1, h.x2) &&
      y > Math.min(v.y1, v.y2) &&
      y < Math.max(v.y1, v.y2)
    )
      p += CRUCE;
  }
  return p;
}

interface Extremo {
  caja: string;
  lado: Lado;
  punto: Punto;
}

interface Rejilla {
  xs: number[];
  ys: number[];
  /** Índice de vértice por "x,y". */
  indice: Map<string, number>;
  pts: Punto[];
  /** Vecinos por vértice: [vecino, dirección, largo ponderado]. */
  vecinos: Array<Array<[number, number, number]>>;
  /** Desplazamiento de las aristas de cada vértice en un arreglo plano (caché de penalizaciones). */
  base: Int32Array;
  aristas: number;
}

function construirRejilla(e: Escenario, extremos: readonly Extremo[]): Rejilla {
  const obst = [
    ...[...e.cajas.values()].map((r) => infla(r, HOLGURA)),
    ...e.obstaculos.map((r) => infla(r, HOLGURA)),
  ];
  const xs = [
    ...new Set([
      ...e.lineasX,
      ...extremos
        .filter((x) => x.lado === "arriba" || x.lado === "abajo")
        .map((x) => x.punto[0]),
    ]),
  ]
    .filter((x) => x >= 0 && x <= e.ancho)
    .sort((a, b) => a - b);
  const ys = [
    ...new Set([
      ...e.lineasY,
      ...extremos
        .filter((x) => x.lado === "izquierda" || x.lado === "derecha")
        .map((x) => x.punto[1]),
    ]),
  ]
    .filter((y) => y >= e.yMin && y <= e.alto)
    .sort((a, b) => a - b);
  const indice = new Map<string, number>();
  const pts: Punto[] = [];
  const agrega = (x: number, y: number) => {
    const k = `${x},${y}`;
    if (!indice.has(k)) {
      indice.set(k, pts.length);
      pts.push([x, y]);
    }
    return indice.get(k) as number;
  };
  for (const x of xs)
    for (const y of ys) if (!obst.some((r) => dentro(x, y, r))) agrega(x, y);
  const vecinos: Array<Array<[number, number, number]>> = [];
  const estrechos = e.estrechos ?? [];
  const peso = (x1: number, y1: number, x2: number, y2: number) => {
    const largo = Math.abs(x2 - x1) + Math.abs(y2 - y1);
    // Solo el recorrido A LO LARGO del pasillo (vertical); cruzarlo de lado a lado es cómo se unen dos vecinos.
    return x1 === x2 &&
      estrechos.some(
        (r) =>
          x1 >= r.x &&
          x1 <= r.x + r.w &&
          Math.max(y1, y2) > r.y &&
          Math.min(y1, y2) < r.y + r.h,
      )
      ? largo * ESTRECHO
      : largo;
  };
  const conecta = (a: number, b: number) => {
    const [x1, y1] = pts[a] as Punto;
    const [x2, y2] = pts[b] as Punto;
    if (obst.some((r) => cortaRect(x1, y1, x2, y2, r))) return;
    const d = x2 > x1 ? 0 : x2 < x1 ? 1 : y2 > y1 ? 2 : 3;
    const w = peso(x1, y1, x2, y2);
    (vecinos[a] ??= []).push([b, d, w]);
    (vecinos[b] ??= []).push([a, d ^ 1, w]);
  };
  const porFila = new Map<number, number[]>();
  const porColumna = new Map<number, number[]>();
  pts.forEach(([x, y], i) => {
    (porFila.get(y) ?? porFila.set(y, []).get(y)!).push(i);
    (porColumna.get(x) ?? porColumna.set(x, []).get(x)!).push(i);
  });
  for (const [, l] of porFila) {
    l.sort((a, b) => (pts[a] as Punto)[0] - (pts[b] as Punto)[0]);
    for (let i = 1; i < l.length; i++)
      conecta(l[i - 1] as number, l[i] as number);
  }
  for (const [, l] of porColumna) {
    l.sort((a, b) => (pts[a] as Punto)[1] - (pts[b] as Punto)[1]);
    for (let i = 1; i < l.length; i++)
      conecta(l[i - 1] as number, l[i] as number);
  }
  // Cada puerto se une solo hacia afuera, con el primer vértice libre de su línea.
  for (const ex of extremos) {
    const [px, py] = ex.punto;
    const p = agrega(px, py);
    const d = SALIDA[ex.lado];
    const [dx, dy] = DIRS[d] as Punto;
    // El primer vértice de su línea, hacia afuera.
    const linea = (dx !== 0 ? porFila.get(py) : porColumna.get(px)) ?? [];
    let i = -1;
    let mejor = Infinity;
    for (const k of linea) {
      const [qx, qy] = pts[k] as Punto;
      if ((dx !== 0 ? (qx - px) * dx : (qy - py) * dy) <= 0) continue;
      const dist = Math.abs(qx - px) + Math.abs(qy - py);
      if (dist < mejor) {
        mejor = dist;
        i = k;
      }
    }
    if (i < 0) continue;
    const q = pts[i] as Punto;
    const otras = [...e.cajas.entries()]
      .filter(([k]) => k !== ex.caja)
      .map(([, r]) => infla(r, HOLGURA));
    if (otras.some((r) => cortaRect(px, py, q[0], q[1], r))) continue;
    const w = Math.abs(q[0] - px) + Math.abs(q[1] - py);
    (vecinos[p] ??= []).push([i, d, w]);
    (vecinos[i] ??= []).push([p, d ^ 1, w]);
  }
  const base = new Int32Array(pts.length + 1);
  for (let k = 0; k < pts.length; k++)
    base[k + 1] = (base[k] as number) + (vecinos[k]?.length ?? 0);
  return {
    xs,
    ys,
    indice,
    pts,
    vecinos,
    base,
    aristas: base[pts.length] as number,
  };
}

/** Montículo binario con desempate fijo (costo, vértice, dirección). */
class Monticulo {
  private h: Array<[number, number, number]> = [];
  get tam() {
    return this.h.length;
  }
  private menor(a: [number, number, number], b: [number, number, number]) {
    return a[0] !== b[0]
      ? a[0] < b[0]
      : a[1] !== b[1]
        ? a[1] < b[1]
        : a[2] < b[2];
  }
  mete(x: [number, number, number]) {
    const h = this.h;
    h.push(x);
    let i = h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.menor(h[i]!, h[p]!)) break;
      [h[i], h[p]] = [h[p]!, h[i]!];
      i = p;
    }
  }
  saca(): [number, number, number] {
    const h = this.h;
    const top = h[0]!;
    const ult = h.pop()!;
    if (h.length) {
      h[0] = ult;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < h.length && this.menor(h[l]!, h[m]!)) m = l;
        if (r < h.length && this.menor(h[r]!, h[m]!)) m = r;
        if (m === i) break;
        [h[i], h[m]] = [h[m]!, h[i]!];
        i = m;
      }
    }
    return top;
  }
}

/**
 * Camino de menor costo entre algún extremo de origen y alguno de destino: A* sobre (vértice, dirección) con la
 * distancia Manhattan a la meta más cercana, que nunca sobrestima (el costo de un tramo es ≥ su largo).
 */
function camino(
  r: Rejilla,
  origenes: readonly Extremo[],
  destinos: readonly Extremo[],
  ya: readonly Tramo[],
): {
  puntos: Punto[];
  costo: number;
  origen: Extremo;
  destino: Extremo;
} | null {
  const n = r.pts.length;
  const dist = new Float64Array(n * 4).fill(Infinity);
  const cerrado = new Uint8Array(n * 4);
  const previo = new Int32Array(n * 4).fill(-1);
  const q = new Monticulo();
  const inicioDe = new Map<number, Extremo>();
  const metas = new Map<number, Extremo>();
  for (const d of destinos) {
    const v = r.indice.get(`${d.punto[0]},${d.punto[1]}`);
    if (v !== undefined) metas.set(v, d);
  }
  const metasPts = [...metas.keys()].map((v) => r.pts[v] as Punto);
  const h = (v: number) => {
    const [x, y] = r.pts[v] as Punto;
    let m = Infinity;
    for (const [tx, ty] of metasPts)
      m = Math.min(m, Math.abs(x - tx) + Math.abs(y - ty));
    return m;
  };
  for (const o of origenes) {
    const v = r.indice.get(`${o.punto[0]},${o.punto[1]}`);
    if (v === undefined) continue;
    dist[v * 4 + SALIDA[o.lado]] = 0;
    inicioDe.set(v, o);
    q.mete([h(v), v, SALIDA[o.lado]]);
  }
  const cache = new Float64Array(r.aristas).fill(-1);
  while (q.tam) {
    const [, v, d] = q.saca();
    const s0 = v * 4 + d;
    if (cerrado[s0]) continue;
    cerrado[s0] = 1;
    const c = dist[s0] as number;
    if (metas.has(v) && !inicioDe.has(v)) {
      const puntos: Punto[] = [];
      let s = s0;
      while (s >= 0) {
        puntos.push(r.pts[Math.floor(s / 4)] as Punto);
        s = previo[s] as number;
      }
      puntos.reverse();
      const origen = inicioDe.get(
        r.indice.get(`${puntos[0]![0]},${puntos[0]![1]}`) as number,
      ) as Extremo;
      return {
        puntos: comprimir(puntos),
        costo: c,
        origen,
        destino: metas.get(v) as Extremo,
      };
    }
    const vs = r.vecinos[v] ?? [];
    const [x1, y1] = r.pts[v] as Punto;
    for (let k = 0; k < vs.length; k++) {
      const [w, dw, largo] = vs[k] as [number, number, number];
      if (dw === (d ^ 1) && !inicioDe.has(v)) continue; // sin media vuelta
      if (inicioDe.has(v) && dw !== d) continue; // el puerto sale solo hacia afuera
      if (inicioDe.has(w)) continue;
      const s = w * 4 + dw;
      if (cerrado[s]) continue;
      const clave = (r.base[v] as number) + k;
      let pen = cache[clave] as number;
      if (pen < 0) {
        const [x2, y2] = r.pts[w] as Punto;
        pen = penalizacion({ x1, y1, x2, y2 }, ya);
        cache[clave] = pen;
      }
      const nc = c + largo + pen + (dw !== d ? CODO : 0);
      if (nc < (dist[s] as number)) {
        dist[s] = nc;
        previo[s] = s0;
        q.mete([nc + h(w), w, dw]);
      }
    }
  }
  return null;
}

function comprimir(p: Punto[]): Punto[] {
  const out: Punto[] = [];
  for (const q of p) {
    if (out.length >= 2) {
      const a = out[out.length - 2] as Punto;
      const b = out[out.length - 1] as Punto;
      if (
        (a[0] === b[0] && b[0] === q[0]) ||
        (a[1] === b[1] && b[1] === q[1])
      ) {
        out[out.length - 1] = q;
        continue;
      }
    }
    if (
      out.length &&
      out[out.length - 1]![0] === q[0] &&
      out[out.length - 1]![1] === q[1]
    )
      continue;
    out.push(q);
  }
  return out;
}

/** Candidatos de la pasada 1: en cada lado, las posiciones de 1, 2 y 3 puertos (¼, ⅓, ½, ⅔, ¾). */
function extremosCandidatos(e: Escenario, caja: string): Extremo[] {
  const r = e.cajas.get(caja);
  if (!r) throw new Error(`visor: caja desconocida «${caja}»`);
  const out: Extremo[] = [];
  const vistos = new Set<string>();
  const vedados = e.sinLado?.get(caja) ?? [];
  for (const lado of LADOS.filter((l) => !vedados.includes(l)))
    for (const [i, k] of [
      [0, 1],
      [0, 2],
      [1, 2],
      [0, 3],
      [2, 3],
    ] as const) {
      const punto = puertoEn(r, lado, i, k);
      const clave = `${lado}${punto[0]},${punto[1]}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      out.push({ caja, lado, punto });
    }
  return out;
}

interface Asignacion {
  /** "caja|lado" → ids de ruta en orden. */
  orden: Map<string, string[]>;
  lados: Map<string, { o: Lado; d: Lado }>;
}

function extremosFijos(
  e: Escenario,
  a: Asignacion,
  p: Pedido,
): { o: Extremo; d: Extremo } {
  const { o, d } = a.lados.get(p.id) as { o: Lado; d: Lado };
  const pos = (caja: string, lado: Lado, rol: string): Punto => {
    const lista = a.orden.get(`${caja}|${lado}`) as string[];
    return puertoEn(
      e.cajas.get(caja) as Rect,
      lado,
      lista.indexOf(`${p.id}${rol}`),
      lista.length,
    );
  };
  return {
    o: { caja: p.origen, lado: o, punto: pos(p.origen, o, ">") },
    d: { caja: p.destino, lado: d, punto: pos(p.destino, d, "<") },
  };
}

function rutearTodo(
  e: Escenario,
  pedidos: readonly Pedido[],
  a: Asignacion,
): { rutas: Ruta[]; costo: number } | null {
  const fijos = pedidos.map((p) => extremosFijos(e, a, p));
  const rej = construirRejilla(
    e,
    fijos.flatMap((f) => [f.o, f.d]),
  );
  const ya: Tramo[] = [];
  const rutas: Ruta[] = [];
  let costo = 0;
  for (let i = 0; i < pedidos.length; i++) {
    const p = pedidos[i] as Pedido;
    const f = fijos[i] as { o: Extremo; d: Extremo };
    const c = camino(rej, [f.o], [f.d], ya);
    if (!c) return null;
    costo += c.costo;
    ya.push(...tramosDe(c.puntos));
    rutas.push({
      id: p.id,
      puntos: c.puntos,
      ladoOrigen: f.o.lado,
      ladoDestino: f.d.lado,
    });
  }
  return { rutas, costo };
}

function permutaciones<T>(l: readonly T[]): T[][] {
  if (l.length <= 1) return [l.slice()];
  const out: T[][] = [];
  l.forEach((x, i) => {
    for (const r of permutaciones([...l.slice(0, i), ...l.slice(i + 1)]))
      out.push([x, ...r]);
  });
  return out;
}

function construirOrden(
  e: Escenario,
  pedidos: readonly Pedido[],
  lados: ReadonlyMap<string, { o: Lado; d: Lado }>,
) {
  const centro = (k: string) => {
    const r = e.cajas.get(k) as Rect;
    return [r.x + r.w / 2, r.y + r.h / 2] as Punto;
  };
  const lista: Array<[string, string, number]> = [];
  for (const p of pedidos) {
    const { o, d } = lados.get(p.id) as { o: Lado; d: Lado };
    const ejeO = o === "arriba" || o === "abajo" ? 0 : 1;
    const ejeD = d === "arriba" || d === "abajo" ? 0 : 1;
    lista.push([`${p.origen}|${o}`, `${p.id}>`, centro(p.destino)[ejeO]]);
    lista.push([`${p.destino}|${d}`, `${p.id}<`, centro(p.origen)[ejeD]]);
  }
  lista.sort((a, b) => cmp(a[0], b[0]) || a[2] - b[2] || cmp(a[1], b[1]));
  const orden = new Map<string, string[]>();
  for (const [clave, id] of lista)
    (orden.get(clave) ?? orden.set(clave, []).get(clave)!).push(id);
  return orden;
}

/** Separación del auto-lazo respecto de su caja. */
const LAZO = 18;

/**
 * Un auto-lazo (X → X, p. ej. un nodo que se reintenta a sí mismo) no tiene ruta en la rejilla: todo extremo es a la
 * vez inicio y meta. Se dibuja fijo, a la derecha de la caja, de su tercio superior a su tercio inferior (AU-S2-B46).
 */
function rutaDeLazo(e: Escenario, p: Pedido): Ruta {
  const r = e.cajas.get(p.origen);
  if (!r) throw new Error(`visor: caja desconocida «${p.origen}»`);
  const x = r.x + r.w;
  const y1 = r.y + r.h / 3;
  const y2 = r.y + (2 * r.h) / 3;
  return {
    id: p.id,
    puntos: [
      [x, y1],
      [x + LAZO, y1],
      [x + LAZO, y2],
      [x, y2],
    ],
    ladoOrigen: "derecha",
    ladoDestino: "derecha",
  };
}

export function rutear(
  e: Escenario,
  todosLosPedidos: readonly Pedido[],
): Ruta[] {
  const lazos = todosLosPedidos.filter((p) => p.origen === p.destino);
  const pedidos = todosLosPedidos.filter((p) => p.origen !== p.destino);
  const conLazos = (rutas: Ruta[]): Ruta[] => {
    const de = new Map(
      [...rutas, ...lazos.map((p) => rutaDeLazo(e, p))].map((r) => [r.id, r]),
    );
    return todosLosPedidos.map((p) => de.get(p.id) as Ruta);
  };
  if (pedidos.length === 0) return conLazos([]);
  // Pasada 1: lados, con candidatos de puerto en cada lado.
  const todos = [...e.cajas.keys()]
    .sort(cmp)
    .flatMap((k) => extremosCandidatos(e, k));
  const rej = construirRejilla(e, todos);
  const ya: Tramo[] = [];
  const lados = new Map<string, { o: Lado; d: Lado }>();
  for (const p of pedidos) {
    const c = camino(
      rej,
      extremosCandidatos(e, p.origen),
      extremosCandidatos(e, p.destino),
      ya,
    );
    if (!c)
      throw new Error(
        `visor: no hay ruta de ${p.origen} a ${p.destino} (${p.id})`,
      );
    ya.push(...tramosDe(c.puntos));
    lados.set(p.id, { o: c.origen.lado, d: c.destino.lado });
  }
  const a: Asignacion = { orden: construirOrden(e, pedidos, lados), lados };
  let mejor = rutearTodo(e, pedidos, a);
  if (!mejor)
    throw new Error(
      "visor: el ruteo con puertos repartidos no encontró camino",
    );

  // Arrancar y rehacer: cada línea (de la más larga a la más corta) prueba las cuatro combinaciones de lados
  // más baratas frente a TODAS las demás, con el ruteo completo y el orden de puertos de esos dos lados
  // optimizado; el cambio se queda si baja el costo total.
  for (let pasada = 0; pasada < 1; pasada++)
    for (const p of [...pedidos].reverse()) {
      const otras = mejor.rutas
        .filter((r) => r.id !== p.id)
        .flatMap((r) => tramosDe(r.puntos));
      const previo = a.lados.get(p.id) as { o: Lado; d: Lado };
      const opciones: Array<{ o: Lado; d: Lado; costo: number }> = [];
      for (const o of LADOS)
        for (const d of LADOS) {
          if (o === previo.o && d === previo.d) continue;
          const c = camino(
            rej,
            extremosCandidatos(e, p.origen).filter((x) => x.lado === o),
            extremosCandidatos(e, p.destino).filter((x) => x.lado === d),
            otras,
          );
          if (c) opciones.push({ o, d, costo: c.costo });
        }
      opciones.sort((x, y) => x.costo - y.costo || cmp(x.o + x.d, y.o + y.d));
      for (const op of opciones.slice(0, 4)) {
        const lados2 = new Map(a.lados);
        lados2.set(p.id, { o: op.o, d: op.d });
        const a2: Asignacion = {
          orden: construirOrden(e, pedidos, lados2),
          lados: lados2,
        };
        const r = permutarLados(e, pedidos, a2, [
          `${p.origen}|${op.o}`,
          `${p.destino}|${op.d}`,
        ]);
        if (r && r.costo < mejor.costo) {
          mejor = r;
          a.lados = lados2;
          a.orden = a2.orden;
        }
      }
    }

  // Permutaciones del orden de los puertos de todos los lados con dos a cuatro.
  const final = permutarLados(
    e,
    pedidos,
    a,
    [...a.orden.keys()].sort(cmp),
    mejor,
  );
  return conLazos((final ?? mejor).rutas);
}

/**
 * Prueba, lado por lado, todas las permutaciones del orden de sus puertos (dos a cuatro) y deja en `a` la
 * mejor. Devuelve el ruteo de menor costo (o null si ninguno encontró camino).
 */
function permutarLados(
  e: Escenario,
  pedidos: readonly Pedido[],
  a: Asignacion,
  claves: readonly string[],
  base?: { rutas: Ruta[]; costo: number },
): { rutas: Ruta[]; costo: number } | null {
  let mejor = base ?? rutearTodo(e, pedidos, a);
  for (const clave of claves) {
    const actual = a.orden.get(clave);
    if (!actual || actual.length < 2 || actual.length > 4) continue;
    let mejorOrden = actual;
    for (const perm of permutaciones(actual)) {
      if (perm.join() === actual.join()) continue;
      a.orden.set(clave, perm);
      const r = rutearTodo(e, pedidos, a);
      if (r && (!mejor || r.costo < mejor.costo)) {
        mejor = r;
        mejorOrden = perm;
      }
    }
    a.orden.set(clave, mejorOrden);
  }
  return mejor;
}
