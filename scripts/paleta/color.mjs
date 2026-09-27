// Aritmética de color de planlang: OKLCH ↔ sRGB, contraste WCAG y simulación de daltonismo.
// Sin dependencias. Determinista (nada de reloj ni azar). Se usa desde el generador de tokens
// (scripts/paleta/generar-tokens.mjs) y desde el gate (tests/unit/diseno-tokens.test.ts).
//
// Fuentes de las fórmulas:
//  - OKLab/OKLCH: Björn Ottosson, «A perceptual color space for image processing» (2020).
//  - Contraste: WCAG 2.2 § relative luminance / contrast ratio.
//  - Daltonismo: Machado, Oliveira & Fernandes, «A Physiologically-based Model for Simulation of
//    Color Vision Deficiency» (IEEE TVCG 2009); matrices en RGB lineal, severidades 0,6 y 1,0,
//    transcritas de la tabla publicada.

const clamp01 = (x) => Math.min(1, Math.max(0, x));

export function oklchToOklab({ L, C, h }) {
  const rad = (h * Math.PI) / 180;
  return { L, a: C * Math.cos(rad), b: C * Math.sin(rad) };
}

export function oklabToLinearSrgb({ L, a, b }) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

export function linearSrgbToOklab({ r, g, b }) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

export const gammaEncode = (c) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
export const gammaDecode = (c) =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

const inGamut = ({ r, g, b }) =>
  r >= -1e-6 && r <= 1 + 1e-6 && g >= -1e-6 && g <= 1 + 1e-6 && b >= -1e-6 && b <= 1 + 1e-6;

/** OKLCH → hex, reduciendo el croma hasta caber en sRGB (la claridad y el matiz se conservan). */
export function oklchToHex({ L, C, h }) {
  let c = C;
  let lin = oklabToLinearSrgb(oklchToOklab({ L, C: c, h }));
  let pasos = 0;
  while (!inGamut(lin) && c > 0 && pasos < 200) {
    c -= 0.002;
    lin = oklabToLinearSrgb(oklchToOklab({ L, C: Math.max(0, c), h }));
    pasos += 1;
  }
  return linearToHex(lin);
}

export function linearToHex({ r, g, b }) {
  const to = (c) =>
    Math.round(clamp01(gammaEncode(clamp01(c))) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function hexToLinear(hex) {
  const n = parseInt(hex.slice(1), 16);
  return {
    r: gammaDecode(((n >> 16) & 255) / 255),
    g: gammaDecode(((n >> 8) & 255) / 255),
    b: gammaDecode((n & 255) / 255),
  };
}

export function hexToOklab(hex) {
  return linearSrgbToOklab(hexToLinear(hex));
}

/** Mezcla perceptual en OKLab: t = 0 → a, t = 1 → b. */
export function mezclaHex(hexA, hexB, t) {
  const a = hexToOklab(hexA);
  const b = hexToOklab(hexB);
  const m = { L: a.L + (b.L - a.L) * t, a: a.a + (b.a - a.a) * t, b: a.b + (b.b - a.b) * t };
  return linearToHex(oklabToLinearSrgb(m));
}

export function luminancia(hex) {
  const { r, g, b } = hexToLinear(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razón de contraste WCAG entre dos hex (≥ 1). */
export function contraste(hexA, hexB) {
  const a = luminancia(hexA);
  const b = luminancia(hexB);
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

// Matrices de Machado et al. (2009), filas = R'G'B' de salida, sobre RGB lineal.
export const MATRICES_CVD = {
  protan: {
    0.6: [
      [0.38545, 0.769005, -0.154455],
      [0.100526, 0.829802, 0.069673],
      [-0.007442, -0.02219, 1.029632],
    ],
    1.0: [
      [0.152286, 1.052583, -0.204868],
      [0.114503, 0.786281, 0.099216],
      [-0.003882, -0.048116, 1.051998],
    ],
  },
  deutan: {
    0.6: [
      [0.498864, 0.674741, -0.173604],
      [0.205199, 0.754872, 0.039929],
      [-0.011131, 0.030969, 0.980162],
    ],
    1.0: [
      [0.367322, 0.860646, -0.227968],
      [0.280085, 0.672501, 0.047413],
      [-0.01182, 0.04294, 0.968881],
    ],
  },
  tritan: {
    0.6: [
      [1.104996, -0.046633, -0.058363],
      [-0.032137, 0.971635, 0.060503],
      [0.001336, 0.317922, 0.680742],
    ],
    1.0: [
      [1.255528, -0.076749, -0.178779],
      [-0.078411, 0.930809, 0.147602],
      [0.004733, 0.691367, 0.3039],
    ],
  },
};

export const VISTAS = [
  { id: "normal" },
  { id: "protan-0.6", tipo: "protan", severidad: 0.6 },
  { id: "deutan-0.6", tipo: "deutan", severidad: 0.6 },
  { id: "tritan-0.6", tipo: "tritan", severidad: 0.6 },
  { id: "protan-1.0", tipo: "protan", severidad: 1.0 },
  { id: "deutan-1.0", tipo: "deutan", severidad: 1.0 },
  { id: "tritan-1.0", tipo: "tritan", severidad: 1.0 },
  { id: "grises" },
];

/** Simula una vista sobre un hex y devuelve el OKLab resultante (para medir distancias). */
export function simular(hex, vista) {
  const lin = hexToLinear(hex);
  if (vista.id === "normal") return linearSrgbToOklab(lin);
  if (vista.id === "grises") {
    const y = 0.2126 * lin.r + 0.7152 * lin.g + 0.0722 * lin.b;
    return linearSrgbToOklab({ r: y, g: y, b: y });
  }
  const M = MATRICES_CVD[vista.tipo][vista.severidad];
  const v = [lin.r, lin.g, lin.b];
  const out = M.map((fila) => clamp01(fila[0] * v[0] + fila[1] * v[1] + fila[2] * v[2]));
  return linearSrgbToOklab({ r: out[0], g: out[1], b: out[2] });
}

/** Distancia euclídea en OKLab (ΔE_ok). */
export function deltaE(labA, labB) {
  return Math.sqrt((labA.L - labB.L) ** 2 + (labA.a - labB.a) ** 2 + (labA.b - labB.b) ** 2);
}

/** Peor par de una lista de hex bajo una vista. */
export function peorPar(hexes, vista) {
  let peor = { d: Infinity, par: null };
  for (let i = 0; i < hexes.length; i += 1) {
    for (let j = i + 1; j < hexes.length; j += 1) {
      const d = deltaE(simular(hexes[i].hex, vista), simular(hexes[j].hex, vista));
      if (d < peor.d) peor = { d, par: [hexes[i].token, hexes[j].token] };
    }
  }
  return peor;
}
