/**
 * Serializador propio del lienzo (D8): orden de atributos fijo por tipo de elemento, números cuantizados con
 * `-0` normalizado, ids con espacio de nombres por SVG, sin fechas ni versiones dentro, UTF-8 con LF y un salto
 * final. Un solo SVG para los dos temas (G13): todo color sale de clases que leen los tokens. Accesible (D9):
 * raíz `graphics-document document` con título y descripción en su idioma; los nodos y las líneas que llevan
 * reglas son botones enfocables (la vitrina los selecciona); lo demás es `aria-hidden` (la lista por capa es la
 * versión en texto, G10).
 */
import type { Idioma } from "../formatos/bilingue";
import { ESTILOS } from "./estilos";
import { ancho } from "./medida";
import {
  FIN_ID,
  INICIO_ID,
  type Geometria,
  type LineaGeo,
  type NodoGeo,
} from "./geometria";
import { formaDeGlifo, RUTA_GLIFO } from "./glifos";
import { idDeCodigo } from "./ids";
import type { Gramatica, TextoIdioma } from "./tipos";

export interface OpcionesSvg {
  idioma: Idioma;
  /** Espacio de nombres de los ids (D8): dos lienzos en una página no repiten ids. */
  ns: string;
  titulo: TextoIdioma;
  descripcion: TextoIdioma;
  /** Nodos y líneas con reglas como botones (la vitrina los selecciona). */
  seleccionables?: boolean;
  /** Si se da, solo estas líneas son botones (por defecto, todas las que llevan reglas). */
  lineasSeleccionables?: readonly string[];
}

const MARCA_EXIGIDO = "M0,-2.5 V2.5 M0,5 V5.3";
const MARCA_EXTRA = "M-3,0 H3 M0,-3 V3";
const EXIGIDO: TextoIdioma = { es: "exigido", en: "required" };
const EXTRA: TextoIdioma = { es: "sin contrato", en: "unplanned" };
const AUSENTE: TextoIdioma = {
  es: "exigido por el plan, ausente del grafo",
  en: "required by the plan, missing from the graph",
};
const FUERA: TextoIdioma = {
  es: "fuera del contrato",
  en: "outside the contract",
};

export function num(x: number): string {
  const r = Math.round(x * 2) / 2;
  if (Object.is(r, -0) || r === 0) return "0";
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

export function escapar(t: string): string {
  return t
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function atributos(
  pares: ReadonlyArray<readonly [string, string | number | undefined]>,
): string {
  return pares
    .filter((p) => p[1] !== undefined)
    .map(
      ([k, v]) =>
        ` ${k}="${typeof v === "number" ? num(v) : escapar(v as string)}"`,
    )
    .join("");
}

function el(
  nombre: string,
  pares: ReadonlyArray<readonly [string, string | number | undefined]>,
  hijos?: string,
): string {
  return hijos === undefined
    ? `<${nombre}${atributos(pares)}/>`
    : `<${nombre}${atributos(pares)}>${hijos}</${nombre}>`;
}

function trazado(l: LineaGeo): string {
  const p = l.puntos;
  let d = `M${num(p[0]![0])},${num(p[0]![1])}`;
  for (let i = 1; i < p.length; i++) {
    const [x1, y1] = p[i - 1]!;
    const [x2, y2] = p[i]!;
    if (y1 === y2) {
      const saltos = l.saltos.filter((s) => s.tramo === i - 1).map((s) => s.x);
      const derecha = x2 > x1;
      saltos.sort((a, b) => (derecha ? a - b : b - a));
      for (const x of saltos) {
        const a = derecha ? x - 6 : x + 6;
        const b = derecha ? x + 6 : x - 6;
        d += ` H${num(a)} A6,6 0 0 ${derecha ? 1 : 0} ${num(b)},${num(y1)}`;
      }
      d += ` H${num(x2)}`;
    } else d += ` V${num(y2)}`;
  }
  return d;
}

function lineasDeTexto(
  clase: string,
  x: number,
  y0: number,
  paso: number,
  lineas: readonly string[],
  ancla?: string,
): string {
  return lineas
    .map((t, i) =>
      el(
        "text",
        [
          ["class", clase],
          ["x", x],
          ["y", y0 + i * paso],
          ["text-anchor", ancla],
        ],
        escapar(t),
      ),
    )
    .join("");
}

export function aSvg(geo: Geometria, g: Gramatica, op: OpcionesSvg): string {
  const i = op.idioma;
  const ns = op.ns;
  const partes: string[] = [];
  partes.push(el("title", [["id", `${ns}-t`]], escapar(op.titulo[i])));
  partes.push(el("desc", [["id", `${ns}-d`]], escapar(op.descripcion[i])));
  partes.push(
    el(
      "defs",
      [],
      el(
        "marker",
        [
          ["id", `${ns}-punta`],
          ["viewBox", "0 0 10 10"],
          ["refX", "9"],
          ["refY", "5"],
          ["markerUnits", "userSpaceOnUse"],
          ["markerWidth", "10.5"],
          ["markerHeight", "10.5"],
          ["orient", "auto-start-reverse"],
        ],
        el("path", [
          ["class", "punta"],
          ["d", "M0,0 L10,5 L0,10 z"],
        ]),
      ),
    ),
  );
  partes.push(
    el(
      "g",
      [
        ["class", "d-guia"],
        ["aria-hidden", "true"],
      ],
      el("path", [
        [
          "d",
          geo.guias.xs
            .map((x) => `M${num(x)},${num(geo.guias.y1)} V${num(geo.guias.y2)}`)
            .join(" "),
        ],
      ]),
    ),
  );

  // Cabeceras de banda.
  const yNum = 14 + ESTILOS.bandaNumero.tam;
  const yNombre = yNum + 6 + ESTILOS.bandaNombre.tam + 2;
  const lNombre = Math.max(
    ...geo.bandas.map((b) =>
      Math.max(...Object.values(b.nombre.lineas).map((l) => l.length)),
    ),
  );
  const yPregunta =
    yNombre +
    (lNombre - 1) * ESTILOS.bandaNombre.interlinea +
    ESTILOS.bandaPregunta.interlinea;
  partes.push(
    el(
      "g",
      [
        ["class", "d-bandas"],
        ["aria-hidden", "true"],
      ],
      geo.bandas
        .map((b) =>
          el(
            "g",
            [
              ["class", "d-banda-cab"],
              ["data-banda", b.id],
              ["data-columna", b.x],
            ],
            el(
              "text",
              [
                ["class", "d-banda-num"],
                ["x", b.x],
                ["y", yNum],
              ],
              b.numero,
            ) +
              lineasDeTexto(
                "d-banda-nombre",
                b.x,
                yNombre,
                ESTILOS.bandaNombre.interlinea,
                b.nombre.lineas[i],
              ) +
              lineasDeTexto(
                "d-banda-preg",
                b.x,
                yPregunta,
                ESTILOS.bandaPregunta.interlinea,
                b.pregunta.lineas[i],
              ),
          ),
        )
        .join(""),
    ),
  );

  // Líneas.
  for (const l of geo.lineas) {
    const sel =
      op.seleccionables &&
      l.reglas > 0 &&
      (op.lineasSeleccionables ?? [l.id]).includes(l.id);
    // Una línea que se puede enfocar lleva un halo (oculto hasta el foco): el foco se ve por su forma y no solo
    // por el color del trazo, y no cambia el estilo de la línea, que dice su modo (regla dura 13; AU-S2-14).
    let hijos = sel
      ? el("path", [
          ["class", "halo"],
          ["d", trazado(l)],
        ])
      : "";
    hijos += el("path", [
      ["d", trazado(l)],
      ["marker-end", `url(#${ns}-punta)`],
    ]);
    if (l.marcador)
      hijos += el("rect", [
        ["class", "marcador"],
        ["x", l.marcador[0] - 4],
        ["y", l.marcador[1] - 4],
        ["width", 8],
        ["height", 8],
      ]);
    if (l.etiqueta) {
      const c = l.etiqueta.caja;
      const e = ESTILOS[l.etiqueta.texto.estilo];
      hijos += el("rect", [
        ["class", "et-fondo"],
        ["x", c.x],
        ["y", c.y],
        ["width", c.w],
        ["height", c.h],
        ["rx", 2],
      ]);
      hijos += lineasDeTexto(
        l.etiqueta.texto.estilo === "flujoSuave" ? "suave" : "regla",
        c.x + 3,
        c.y + e.tam,
        e.interlinea,
        l.etiqueta.texto.lineas[i],
      );
    }
    const etiqueta = l.etiqueta ? l.etiqueta.texto.lineas[i].join(" ") : "";
    partes.push(
      el(
        "g",
        [
          ["class", "d-flujo"],
          ["id", `${ns}-${l.id}`],
          ["data-modo", l.modo],
          ["data-origen", l.origen],
          ["data-destino", l.destino],
          ["data-flujos", l.flujos.join(" ") || undefined],
          [
            "data-condiciones",
            l.condiciones.some((c) => c !== "")
              ? l.condiciones.join("|")
              : undefined,
          ],
          ["data-sel-id", sel ? l.id : undefined],
          ["tabindex", sel ? "0" : undefined],
          ["role", sel ? "button" : undefined],
          [
            "aria-label",
            sel
              ? `${idDeCodigo(l.origen)} → ${idDeCodigo(l.destino)}: ${etiqueta}`
              : undefined,
          ],
          ["aria-hidden", sel ? undefined : "true"],
        ],
        hijos,
      ),
    );
  }

  // Terminales.
  for (const t of geo.terminales) {
    const e = ESTILOS.terminal;
    let hijos = el("circle", [
      ["cx", t.cx],
      ["cy", t.cy],
      ["r", t.r],
    ]);
    if (t.id === FIN_ID)
      hijos += el("circle", [
        ["class", "centro"],
        ["cx", t.cx],
        ["cy", t.cy],
        ["r", 4.5],
      ]);
    hijos += lineasDeTexto(
      "",
      t.cx,
      t.cy + t.r + 6 + e.tam,
      e.interlinea,
      t.etiqueta.lineas[i],
      "middle",
    ).replaceAll(' class=""', "");
    partes.push(
      el(
        "g",
        [
          ["class", t.id === INICIO_ID ? "d-terminal" : "d-terminal fin"],
          ["id", `${ns}-${t.id}`],
          ["aria-hidden", "true"],
        ],
        hijos,
      ),
    );
  }

  // Nodos, en el orden de la lista por capa (columna, fila): es el orden de tabulación (D9).
  const nodos = [...geo.nodos].sort(
    (a, b) => a.columna - b.columna || a.fila - b.fila,
  );
  for (const n of nodos) partes.push(nodoSvg(n, g, op));

  const raiz = el(
    "svg",
    [
      ["xmlns", "http://www.w3.org/2000/svg"],
      ["viewBox", `0 0 ${num(geo.ancho)} ${num(geo.alto)}`],
      ["width", geo.ancho],
      ["height", geo.alto],
      ["class", "visor"],
      ["lang", i],
      ["role", "graphics-document document"],
      ["aria-labelledby", `${ns}-t ${ns}-d`],
      ["data-visor", ns],
    ],
    partes.join("\n") + "\n",
  );
  return raiz + "\n";
}

function nodoSvg(n: NodoGeo, g: Gramatica, op: OpcionesSvg): string {
  const i = op.idioma;
  const c = n.caja;
  const tipo = g.tipos_de_nodo.find((t) => t.id === n.tipo)!;
  const exigido = n.madurez === "exigido-por-el-plan";
  const forma = formaDeGlifo(g, n.tipo);
  const nombre = n.nombre.lineas[i].join("");
  // El anillo de foco, a 4 px de la caja (oculto hasta el foco): distinto de la selección, que tiñe la caja
  // (AU-S2-14).
  let hijos =
    op.seleccionables && !exigido
      ? el("rect", [
          ["class", "foco"],
          ["x", c.x - 4],
          ["y", c.y - 4],
          ["width", c.w + 8],
          ["height", c.h + 8],
          ["rx", 9],
        ])
      : "";
  hijos += el("rect", [
    ["class", "caja"],
    ["x", c.x],
    ["y", c.y],
    ["width", c.w],
    ["height", c.h],
    ["rx", 6],
  ]);
  if (!exigido)
    hijos += el("rect", [
      ["class", "filete"],
      ["x", c.x + 1],
      ["y", c.y + 8],
      ["width", 3],
      ["height", c.h - 16],
      ["rx", 1.5],
    ]);
  hijos += el("path", [
    ["class", "glifo"],
    ["transform", `translate(${num(c.x + 18)},${num(c.y + 18)}) scale(0.67)`],
    ["d", RUTA_GLIFO[forma]],
  ]);
  hijos += lineasDeTexto(
    "cod",
    c.x + 30,
    c.y + 22,
    ESTILOS.nodoCodigo.interlinea,
    n.codigo.lineas[i],
  );
  const insignia = exigido
    ? { marca: MARCA_EXIGIDO, texto: EXIGIDO, clase: "aus" }
    : n.fueraDelContrato
      ? { marca: MARCA_EXTRA, texto: EXTRA, clase: "extra" }
      : null;
  if (insignia) {
    // Mismo ancho en los dos idiomas (la geometría no depende del idioma, § 5.3).
    const w =
      21 +
      Math.ceil(
        Math.max(
          ...Object.values(insignia.texto).map((t) =>
            ancho(t, ESTILOS.insignia),
          ),
        ),
      );
    const x = c.x + c.w - 8 - w;
    const y = c.y + 8;
    hijos += el(
      "g",
      [["class", insignia.clase]],
      el("rect", [
        ["x", x],
        ["y", y],
        ["width", w],
        ["height", 16],
        ["rx", 3],
      ]) +
        el("path", [
          ["transform", `translate(${num(x + 8)},${num(y + 8)})`],
          ["d", insignia.marca],
        ]) +
        el(
          "text",
          [
            ["x", x + 15],
            ["y", y + 12],
          ],
          escapar(insignia.texto[i]),
        ),
    );
  }
  hijos += lineasDeTexto(
    "nombre",
    c.x + 12,
    c.y + 42,
    ESTILOS.nodoNombre.interlinea,
    n.nombre.lineas[i],
  );
  const estado = exigido
    ? `, ${AUSENTE[i]}`
    : n.fueraDelContrato
      ? `, ${FUERA[i]}`
      : "";
  const sel = op.seleccionables && !exigido;
  return el(
    "g",
    [
      ["class", "d-nodo"],
      ["id", `${op.ns}-n-${n.id}`],
      ["data-nodo-id", n.id],
      ["data-tipo", n.tipo],
      ["data-madurez", exigido ? "exigido" : undefined],
      ["data-sel-id", sel ? n.id : undefined],
      ["tabindex", sel ? "0" : undefined],
      ["role", sel ? "button" : "img"],
      ["aria-label", `${nombre}: ${tipo.nombre[i]}${estado}`],
    ],
    hijos,
  );
}
