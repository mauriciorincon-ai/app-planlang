// Genera los tokens de color de planlang desde su declaración OKLCH. ESTE archivo es la fuente
// de verdad (design-system.md § tokens lo documenta); las salidas son DERIVADAS y no se editan a
// mano — el gate `diseno-tokens` (tests/unit/diseno-tokens.test.ts) detecta la deriva:
//   docs/diseno/assets/tokens.json  — hex por tema y cromo, más las medidas
//   docs/diseno/assets/tokens.css   — variables CSS por tema ([data-theme]) y cromo ([data-cromo])
// Uso: `pnpm tokens` (escribe) · importado por el test (compara sin escribir).
//
// Método (regla dura 13: el color nunca va solo; daltonismo leve del usuario):
//  - Un matiz propio por tipo de nodo de la gramática `agentes-ia` y por veredicto; los ocho no
//    comparten matiz. `regla` es casi neutra a propósito: lo determinista es tinta.
//  - La claridad de cada matiz, por tema, la fija una búsqueda determinista por coordenadas
//    (tres arranques fijos, paso 0,01) que maximiza la peor distancia ΔE_ok entre pares bajo
//    siete vistas (normal; protan, deutan y tritan con severidad 0,6 y 1,0), con la condición de
//    que cada trazo pase 3:1 sobre sup-1, sup-2 y su propio tinte, y que tinta-1 pase 4,5:1 sobre
//    ese tinte. La escala de grises no exige distancia: ahí cargan glifo y etiqueta.
//  - Umbrales declarados (convención de la casa, no evidencia publicada): ΔE ≥ 0,10 en normal,
//    ≥ 0,06 en severidad 0,6, ≥ 0,03 en dicromacia.
import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { contraste, mezclaHex, oklchToHex, peorPar, VISTAS } from "./color.mjs";

/** Los 5 tipos de nodo de `agentes-ia` v1.0.0 (token_color tipo-1 … tipo-5) y los 3 veredictos. */
export const CROMATICOS = [
  { token: "tipo-1", id: "modelo", familia: "violeta", matiz: 300, croma: 0.16, rango: { oscuro: [0.68, 0.86], claro: [0.42, 0.6] } },
  { token: "tipo-2", id: "herramienta", familia: "cian", matiz: 200, croma: 0.13, rango: { oscuro: [0.7, 0.88], claro: [0.42, 0.6] } },
  { token: "tipo-3", id: "regla", familia: "pizarra", matiz: 250, croma: 0.035, rango: { oscuro: [0.62, 0.78], claro: [0.36, 0.5] } },
  { token: "tipo-4", id: "pausa_humana", familia: "naranja", matiz: 50, croma: 0.16, rango: { oscuro: [0.68, 0.84], claro: [0.5, 0.64] } },
  { token: "tipo-5", id: "enrutador", familia: "azul", matiz: 250, croma: 0.15, rango: { oscuro: [0.7, 0.88], claro: [0.42, 0.58] } },
  { token: "cumple", id: "cumple", familia: "verde", matiz: 150, croma: 0.15, rango: { oscuro: [0.7, 0.86], claro: [0.42, 0.58] } },
  { token: "alerta", id: "cumple_con_alertas", familia: "ámbar", matiz: 92, croma: 0.15, rango: { oscuro: [0.76, 0.9], claro: [0.5, 0.64] } },
  { token: "no-cumple", id: "no_cumple", familia: "rojo", matiz: 22, croma: 0.17, rango: { oscuro: [0.64, 0.8], claro: [0.46, 0.6] } },
];

/** Dos cromos de neutros para la mirada 1: frío (dirección A) y cálido (dirección B). */
export const CROMOS = {
  frio: { matiz: 250, croma: { oscuro: 0.02, claro: 0.006 } },
  calido: { matiz: 70, croma: { oscuro: 0.012, claro: 0.012 } },
};

export const NEUTROS = {
  oscuro: { fondo: 0.16, "sup-1": 0.21, "sup-2": 0.26, linea: 0.4, "tinta-3": 0.55, "tinta-2": 0.8, "tinta-1": 0.95 },
  claro: { fondo: 0.965, "sup-1": 0.985, "sup-2": 0.998, linea: 0.87, "tinta-3": 0.62, "tinta-2": 0.4, "tinta-1": 0.22 },
};

export const UMBRALES = { normal: 0.1, 0.6: 0.06, 1.0: 0.03 };
export const TINTE = 0.15;
const PASO = 0.01;

function neutros(tema, cromo) {
  const { matiz, croma } = CROMOS[cromo];
  const out = {};
  for (const [nombre, L] of Object.entries(NEUTROS[tema])) {
    out[nombre] = oklchToHex({ L, C: croma[tema], h: matiz });
  }
  return out;
}

function umbralDe(vista) {
  if (vista.id === "normal") return UMBRALES.normal;
  if (vista.id === "grises") return null;
  return UMBRALES[vista.severidad];
}

/** Puntaje de un conjunto de hex: mínimo sobre las vistas de (peor par − umbral); −∞ si viola contraste. */
function puntaje(hexes, sup) {
  for (const { hex } of hexes) {
    const tinte = mezclaHex(sup["sup-2"], hex, TINTE);
    if (contraste(hex, sup["sup-1"]) < 3 || contraste(hex, sup["sup-2"]) < 3 || contraste(hex, tinte) < 3) return -Infinity;
    if (contraste(sup["tinta-1"], tinte) < 4.5) return -Infinity;
  }
  let min = Infinity;
  for (const vista of VISTAS) {
    const u = umbralDe(vista);
    if (u === null) continue;
    min = Math.min(min, peorPar(hexes, vista).d - u);
  }
  return min;
}

/** Búsqueda determinista de claridad por coordenadas con tres arranques fijos. */
export function buscar(tema, sup) {
  const arranques = [0, 0.5, 1].map((t) => CROMATICOS.map((c) => c.rango[tema][0] + (c.rango[tema][1] - c.rango[tema][0]) * t));
  let mejor = { Ls: null, s: -Infinity };
  for (const inicio of arranques) {
    const Ls = [...inicio];
    const hexes = () => CROMATICOS.map((c, i) => ({ token: c.token, hex: oklchToHex({ L: Ls[i], C: c.croma, h: c.matiz }) }));
    let s = puntaje(hexes(), sup);
    for (let ronda = 0; ronda < 4; ronda += 1) {
      let mejoro = false;
      for (let i = 0; i < CROMATICOS.length; i += 1) {
        const [lo, hi] = CROMATICOS[i].rango[tema];
        let mejorL = Ls[i];
        for (let L = lo; L <= hi + 1e-9; L += PASO) {
          const previo = Ls[i];
          Ls[i] = Math.round(L * 100) / 100;
          const p = puntaje(hexes(), sup);
          if (p > s + 1e-9) {
            s = p;
            mejorL = Ls[i];
            mejoro = true;
          }
          Ls[i] = previo;
        }
        Ls[i] = mejorL;
      }
      if (!mejoro) break;
    }
    if (s > mejor.s) mejor = { Ls: [...Ls], s };
  }
  return mejor.Ls;
}

export function generar() {
  const temas = {};
  const medidas = {};
  for (const tema of ["oscuro", "claro"]) {
    const sup = neutros(tema, "frio");
    const Ls = buscar(tema, sup);
    const cromaticos = {};
    CROMATICOS.forEach((c, i) => {
      const hex = oklchToHex({ L: Ls[i], C: c.croma, h: c.matiz });
      cromaticos[c.token] = { id: c.id, familia: c.familia, matiz: c.matiz, L: Ls[i], hex };
    });
    const tintes = {};
    for (const cromo of Object.keys(CROMOS)) {
      const n = neutros(tema, cromo);
      tintes[cromo] = Object.fromEntries(Object.entries(cromaticos).map(([t, v]) => [t, mezclaHex(n["sup-2"], v.hex, TINTE)]));
    }
    temas[tema] = { neutros: { frio: sup, calido: neutros(tema, "calido") }, cromaticos, tintes };
    const lista = Object.entries(cromaticos).map(([token, v]) => ({ token, hex: v.hex }));
    medidas[tema] = Object.fromEntries(
      VISTAS.map((vista) => {
        const p = peorPar(lista, vista);
        return [vista.id, { umbral: umbralDe(vista), peor_par: p.par, distancia: Math.round(p.d * 1000) / 1000 }];
      }),
    );
  }
  return { _generado: "scripts/paleta/generar-tokens.mjs — no editar a mano (gate diseno-tokens)", tinte: TINTE, umbrales: UMBRALES, temas, medidas };
}

export function aCss(tokens) {
  const bloque = (tema, cromo) => {
    const t = tokens.temas[tema];
    const lineas = [];
    for (const [k, v] of Object.entries(t.neutros[cromo])) lineas.push(`  --${k}: ${v};`);
    if (cromo === "frio") {
      for (const [k, v] of Object.entries(t.cromaticos)) lineas.push(`  --${k}: ${v.hex};`);
    }
    for (const [k, v] of Object.entries(t.tintes[cromo])) lineas.push(`  --${k}-tinte: ${v};`);
    return lineas.join("\n");
  };
  return [
    "/* GENERADO por scripts/paleta/generar-tokens.mjs — no editar a mano. `pnpm tokens` lo regenera. */",
    `:root, [data-theme="oscuro"] {\n${bloque("oscuro", "frio")}\n  color-scheme: dark;\n}`,
    `[data-theme="claro"] {\n${bloque("claro", "frio")}\n  color-scheme: light;\n}`,
    `[data-cromo="calido"] {\n${bloque("oscuro", "calido")}\n}`,
    `[data-theme="claro"] [data-cromo="calido"], [data-theme="claro"][data-cromo="calido"] {\n${bloque("claro", "calido")}\n}`,
    ":root {\n  --modelo: var(--tipo-1);\n  --herramienta: var(--tipo-2);\n  --regla: var(--tipo-3);\n  --pausa-humana: var(--tipo-4);\n  --enrutador: var(--tipo-5);\n}",
    "",
  ].join("\n");
}

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const RUTA_JSON = join(raiz, "docs", "diseno", "assets", "tokens.json");
export const RUTA_CSS = join(raiz, "docs", "diseno", "assets", "tokens.css");

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const tokens = generar();
  writeFileSync(RUTA_JSON, JSON.stringify(tokens, null, 2) + "\n");
  writeFileSync(RUTA_CSS, aCss(tokens));
  for (const tema of ["oscuro", "claro"]) {
    console.log(`\n${tema}`);
    for (const [k, v] of Object.entries(tokens.temas[tema].cromaticos)) console.log(`  ${k.padEnd(10)} ${v.familia.padEnd(8)} L ${v.L.toFixed(2)}  ${v.hex}`);
    for (const [vista, m] of Object.entries(tokens.medidas[tema])) console.log(`  ${vista.padEnd(11)} umbral ${m.umbral ?? "—"}  peor ${m.distancia} (${m.peor_par.join(" ~ ")})`);
    const n = tokens.temas[tema].neutros.frio;
    console.log(`  tinta-1/fondo ${contraste(n["tinta-1"], n.fondo).toFixed(1)}  tinta-2/fondo ${contraste(n["tinta-2"], n.fondo).toFixed(1)}  tinta-3/fondo ${contraste(n["tinta-3"], n.fondo).toFixed(1)}  linea/fondo ${contraste(n.linea, n.fondo).toFixed(1)}`);
  }
  console.log(`\nescrito ${RUTA_JSON}\nescrito ${RUTA_CSS}`);
}
