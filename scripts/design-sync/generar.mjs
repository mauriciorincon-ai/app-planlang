/**
 * El bundle publicable del design system (regla 16; `/design-sync`): `design-sync/` DERIVA de `design-system.md` y de los
 * tokens que genera `scripts/paleta/generar-tokens.mjs`. Este script lo escribe entero; nadie lo edita a mano.
 *   - `styles.css`: los tokens de color de los dos temas (copia de `docs/diseno/assets/tokens.css`) y la escala de
 *     tipografía, espacio, forma y movimiento del § 2.
 *   - `components/<grupo>/<tarjeta>.html`: una tarjeta autocontenida por tema del sistema, primera línea `@dsCard`,
 *     CSS en línea, cero CDN, los dos temas lado a lado.
 *   - `README.md`: qué es, versión, tarjetas y estado de publicación (lo lee `project.json`).
 * `project.json` NO lo escribe este script: lleva el destino y el registro de publicación (`/design-sync`).
 *
 * Uso: `node scripts/design-sync/generar.mjs` (escribe) · `--verificar` (no escribe; sale con 1 si algo difiere).
 * `tests/unit/design-sync.test.ts` lo corre en modo verificación.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SALIDA = join(RAIZ, "design-sync");

const version = /^version:\s*(\S+)/m.exec(
  readFileSync(join(RAIZ, "design-system.md"), "utf8"),
)?.[1];
if (!version) throw new Error("design-system.md sin versión en el frente");
const colores = readFileSync(
  join(RAIZ, "docs/diseno/assets/tokens.css"),
  "utf8",
).trim();
const tokens = JSON.parse(
  readFileSync(join(RAIZ, "docs/diseno/assets/tokens.json"), "utf8"),
);

const ESCALA = `:root {
  /* § 2.3 Tipografía: Inter en la interfaz, JetBrains Mono solo para datos (la app sirve las dos; aquí, la pila). */
  --letra: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
  --mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
  --t-titulo: 600 36px/1.15 var(--letra);
  --t-seccion: 600 20px/1.3 var(--letra);
  --t-sub: 600 15px/1.4 var(--letra);
  --t-texto: 400 15px/1.6 var(--letra);
  --t-guia: 400 17px/1.55 var(--letra);
  --t-chico: 400 13px/1.5 var(--letra);
  --t-dato: 400 12px/1.5 var(--mono);
  --t-cifra: 600 28px/1 var(--letra);
  /* § 2.4 Espacio (múltiplos de 4), rejilla, radios. Sin sombras. */
  --e-1: 4px; --e-2: 8px; --e-3: 12px; --e-4: 16px; --e-5: 24px; --e-6: 32px; --e-7: 48px; --e-8: 64px;
  --ancho: 1120px; --margen: 32px;
  --r-control: 6px; --r-chip: 4px; --r-baldosa: 8px;
  /* § 2.6 Movimiento: solo transform y opacity (más color en controles); nada con reducir movimiento. */
  --curva: cubic-bezier(0.2, 0, 0, 1); --m-control: 150ms; --m-seleccion: 200ms;
}
@media (prefers-reduced-motion: reduce) {
  :root { --m-control: 0ms; --m-seleccion: 0ms; }
}`;

const STYLES = `/* GENERADO por scripts/design-sync/generar.mjs desde design-system.md ${version} — no editar a mano. */\n${colores}\n${ESCALA}\n`;

const BASE = `*{box-sizing:border-box}
body{margin:0;background:#888;font:var(--t-texto)}
.temas{display:grid;grid-template-columns:1fr 1fr;gap:0;min-height:100vh}
@media (max-width:860px){.temas{grid-template-columns:1fr}}
.tema{background:var(--fondo);color:var(--tinta-1);padding:var(--e-5);min-width:0}
.rotulo-tema{font:var(--t-dato);color:var(--tinta-2);margin:0 0 var(--e-4)}
h1{font:var(--t-seccion);letter-spacing:-0.01em;margin:0 0 var(--e-2)}
h2{font:var(--t-sub);margin:var(--e-5) 0 var(--e-2)}
p{margin:0 0 var(--e-2)}
.chico{font:var(--t-chico);color:var(--tinta-2)}
.dato{font:var(--t-dato)}
code{font:var(--t-dato)}
.fila{display:flex;flex-wrap:wrap;gap:var(--e-3);align-items:center}
.sup{background:var(--sup-2);border:1px solid var(--linea);border-radius:var(--r-baldosa);padding:var(--e-4)}`;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** Una tarjeta: primera línea `@dsCard`, documento autocontenido, el contenido en los dos temas. */
function tarjeta(grupo, nombre, css, contenido) {
  const panel = (tema, rotulo) =>
    `<section class="tema" data-theme="${tema}"><p class="rotulo-tema">${rotulo}</p>\n${contenido}\n</section>`;
  return `<!-- @dsCard group="${grupo}" name="${nombre}" -->
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(nombre)} · planlang ${version}</title>
<style>
${colores}
${ESCALA}
${BASE}
${css}
</style>
</head>
<body>
<div class="temas">
${panel("oscuro", "oscuro (primario)")}
${panel("claro", "claro")}
</div>
</body>
</html>
`;
}

// ── Glifos de tipo de nodo (gramática agentes-ia + hexágono para regla, sellado por el usuario) ──
const GLIFO = {
  modelo:
    '<path d="M8 1.5l1.9 4.1 4.5.5-3.4 3 1 4.4L8 11.3 4 13.5l1-4.4-3.4-3 4.5-.5z"/>',
  herramienta: '<path d="M8 2l6.5 11.5h-13z"/>',
  regla: '<path d="M8 1.5l5.6 3.25v6.5L8 14.5l-5.6-3.25v-6.5z"/>',
  pausa_humana: '<rect x="2.5" y="2.5" width="11" height="11"/>',
  enrutador: '<path d="M8 1.5l6.5 6.5L8 14.5 1.5 8z"/>',
};
const TIPOS = [
  ["modelo", "tipo-1", "MOD", "Modelo", "razona con un modelo"],
  ["herramienta", "tipo-2", "HER", "Herramienta", "llama a un sistema externo"],
  ["regla", "tipo-3", "REG", "Regla", "código fijo, sin modelo"],
  ["pausa_humana", "tipo-4", "HUM", "Pausa humana", "espera a una persona"],
  ["enrutador", "tipo-5", "ENR", "Enrutador", "elige el camino por una señal"],
];
const glifo = (id, color, tam = 16) =>
  `<svg width="${tam}" height="${tam}" viewBox="0 0 16 16" aria-hidden="true" fill="var(--${color}-tinte)" stroke="var(--${color})" stroke-width="1.5" stroke-linejoin="round">${GLIFO[id]}</svg>`;

// ── Marcas de veredicto: símbolo dibujado + texto + color ──
const VEREDICTOS = [
  [
    "cumple",
    "cumple",
    "Cumple",
    '<circle cx="8" cy="8" r="7" fill="var(--cumple)"/><path d="M4.8 8.2l2.1 2.1 4.3-4.6" fill="none" stroke="var(--fondo)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    "solid",
  ],
  [
    "alerta",
    "alerta",
    "Cumple con alertas",
    '<path d="M8 1.6l6.6 12H1.4z" fill="none" stroke="var(--alerta)" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6v3.6" stroke="var(--alerta)" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="11.6" r="0.9" fill="var(--alerta)"/>',
    "solid",
  ],
  [
    "no-cumple",
    "no-cumple",
    "No cumple",
    '<circle cx="8" cy="8" r="6.6" fill="none" stroke="var(--no-cumple)" stroke-width="1.5"/><path d="M5.5 5.5l5 5m0-5l-5 5" stroke="var(--no-cumple)" stroke-width="1.6" stroke-linecap="round"/>',
    "solid",
  ],
  [
    "construccion",
    "tinta-3",
    "En construcción",
    '<circle cx="8" cy="8" r="6.6" fill="none" stroke="var(--tinta-2)" stroke-width="1.5" stroke-dasharray="2.4 2"/>',
    "dashed",
  ],
];
const marca = (svg, tam = 16) =>
  `<svg width="${tam}" height="${tam}" viewBox="0 0 16 16" aria-hidden="true">${svg}</svg>`;
const veredicto = ([id, color, texto, svg, borde], chico = false) =>
  `<span class="veredicto${chico ? " chico" : ""}" style="--c:var(--${color});--t:${id === "construccion" ? "transparent" : `var(--${color}-tinte)`};border-style:${borde}">${marca(svg, chico ? 13 : 16)}<span>${texto}</span></span>`;

const TARJETAS = [];
const agregar = (archivo, grupo, nombre, css, contenido) =>
  TARJETAS.push({
    archivo,
    grupo,
    nombre,
    html: tarjeta(grupo, nombre, css, contenido),
  });

// ── Fundamentos ──
{
  const neutros = Object.keys(tokens.temas.oscuro.neutros.neutro);
  const vetadas = new Set(["linea", "tinta-3"]);
  const muestra = (t) =>
    `<div class="m"><span class="c" style="background:var(--${t})"></span><code>--${t}</code>${vetadas.has(t) ? '<span class="chico">vetada como texto</span>' : ""}</div>`;
  const crom = Object.entries(tokens.temas.oscuro.cromaticos).map(
    ([t, d]) =>
      `<div class="m"><span class="c" style="background:var(--${t});box-shadow:inset 0 0 0 6px var(--${t}-tinte)"></span><code>--${t}</code><span class="chico">${d.id.replace(/_/g, " ")}</span></div>`,
  );
  agregar(
    "fundamentos/color.html",
    "Fundamentos",
    "Color",
    `.m{display:flex;align-items:center;gap:var(--e-2);padding:var(--e-1) 0}.c{width:28px;height:28px;border-radius:var(--r-chip);border:1px solid var(--linea);flex:none}`,
    `<h1>Color</h1><p class="chico">Tinta sobre neutro; el color es dato: solo tipo de nodo y veredicto. Cada cromático lleva su tinte (15 %) para fondos de estado.</p>
<h2>Neutros</h2>${neutros.map(muestra).join("")}
<h2>Cromáticos y su tinte</h2>${crom.join("")}`,
  );
}
agregar(
  "fundamentos/tipografia.html",
  "Fundamentos",
  "Tipografía",
  `.e{border-top:1px solid var(--linea);padding:var(--e-2) 0}.e code{color:var(--tinta-2)}`,
  `<h1>Tipografía</h1><p class="chico">Inter en toda la interfaz; JetBrains Mono solo para datos (huellas, señales, versiones). Cifras tabulares; nada fuera de esta escala.</p>
${[
  ["titulo", "Título de página"],
  ["seccion", "Sección"],
  ["sub", "Subtítulo"],
  ["texto", "Texto: toda lectura dentro de una sección"],
  ["guia", "Guía: solo la entradilla de la portada"],
  ["chico", "Secundario"],
  ["dato", "dato · senal_confianza < umbral.U1"],
  ["cifra", "89 %"],
]
  .map(
    ([t, e]) =>
      `<div class="e"><div style="font:var(--t-${t})${t === "cifra" ? ";font-variant-numeric:tabular-nums" : ""}">${e}</div><code>--t-${t}</code></div>`,
  )
  .join("")}`,
);
agregar(
  "fundamentos/espacio-y-forma.html",
  "Fundamentos",
  "Espacio y forma",
  `.b{height:10px;background:var(--tinta-2);border-radius:2px}.r{width:64px;height:40px;background:var(--sup-2);border:1px solid var(--linea)}.foco{outline:2px solid var(--tinta-1);outline-offset:2px}`,
  `<h1>Espacio y forma</h1><p class="chico">Múltiplos de 4; una rejilla de 12 columnas; sin sombras: la elevación es superficie y filete.</p>
<h2>Espaciado</h2>${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<div class="fila"><code style="width:48px">--e-${n}</code><div class="b" style="width:var(--e-${n})"></div></div>`).join("")}
<h2>Radios</h2><div class="fila"><div class="r" style="border-radius:var(--r-control)"></div><span class="chico">6 · control</span><div class="r" style="border-radius:var(--r-chip)"></div><span class="chico">4 · chip</span><div class="r" style="border-radius:var(--r-baldosa)"></div><span class="chico">8 · baldosa</span></div>
<h2>Bordes</h2><div class="fila"><div class="r" style="border-radius:var(--r-control)"></div><span class="chico">continuo: estructura</span><div class="r" style="border:1px dashed var(--tinta-2);border-radius:var(--r-control)"></div><span class="chico">discontinuo: algo falta o no es real</span></div>
<h2>Foco</h2><div class="fila"><div class="r foco" style="border-radius:var(--r-control)"></div><span class="chico">2 px tinta-1 a 2 px, igual en toda la app</span></div>`,
);
agregar(
  "fundamentos/movimiento.html",
  "Fundamentos",
  "Movimiento",
  `table{border-collapse:collapse;width:100%}td,th{text-align:left;border-top:1px solid var(--linea);padding:var(--e-2);font:var(--t-chico)}th{color:var(--tinta-2)}`,
  `<h1>Movimiento</h1><p class="chico">Explica causalidad, no decora. Solo transform y opacity (más color en controles). Con reducir movimiento todo es instantáneo y la forma de la página no cambia.</p>
<table><tr><th>Uso</th><th>Duración</th><th>Propiedades</th></tr>
<tr><td>Hover y pulsación de controles</td><td class="dato">150 ms</td><td>color, fondo, borde</td></tr>
<tr><td>Selección de nodo, cambio de pestaña</td><td class="dato">200 ms</td><td>opacity, transform</td></tr>
<tr><td>Salto del lienzo a una capa</td><td class="dato">250 ms</td><td>desplazamiento suave</td></tr>
<tr><td>Bloque del experto al aparecer</td><td class="dato">450 ms</td><td>opacity</td></tr></table>`,
);
agregar(
  "fundamentos/glifos-y-marcas.html",
  "Fundamentos",
  "Glifos y marcas",
  `.n{display:flex;align-items:center;gap:var(--e-2);padding:var(--e-1) 0}.n code{width:34px}`,
  `<h1>Glifos y marcas</h1><p class="chico">Forma antes que color: tipo de nodo = color + glifo + etiqueta; todo se lee en escala de grises. Dibujados, no son íconos de Lucide.</p>
<h2>Tipo de nodo</h2>${TIPOS.map(([id, c, corto, nombre, que]) => `<div class="n">${glifo(id, c, 18)}<code>${corto}</code><span>${nombre}</span><span class="chico">${que}</span></div>`).join("")}
<h2>Frente a lo que corrió</h2><div class="n">${marca('<circle cx="8" cy="8" r="6.5" fill="var(--tinta-1)"/><path d="M5 8.2l2 2 4-4.3" fill="none" stroke="var(--fondo)" stroke-width="1.6" stroke-linecap="round"/>')}<span>corrió</span></div>
<div class="n">${marca('<circle cx="8" cy="8" r="6.5" fill="none" stroke="var(--tinta-1)" stroke-width="1.4"/><path d="M8 1.5a6.5 6.5 0 0 1 0 13z" fill="var(--tinta-1)"/>')}<span>en parte</span></div>
<div class="n">${marca('<circle cx="8" cy="8" r="6.5" fill="none" stroke="var(--tinta-1)" stroke-width="1.4" stroke-dasharray="2.2 2"/>')}<span>exigido y aún no</span></div>`,
);

// ── Componentes ──
const BOTON = `.btn{font:var(--t-chico);font-weight:600;border-radius:var(--r-control);padding:6px 14px;border:1px solid var(--tinta-3);background:transparent;color:var(--tinta-1);transition:background var(--m-control) var(--curva)}
.btn.principal{background:var(--tinta-1);border-color:var(--tinta-1);color:var(--fondo)}
.btn.chico{padding:2px 10px}.btn[disabled]{opacity:.55;border-style:dashed}
.chip{font:var(--t-dato);border-radius:var(--r-chip);padding:0 6px;border:1px solid var(--tinta-2);color:var(--tinta-2)}
.chip.maqueta,.chip.no{border-style:dashed}`;
agregar(
  "componentes/rotulo-y-barra.html",
  "Componentes",
  "Rótulo y barra",
  `.rotulo{font:var(--t-chico);background:var(--sup-1);border-bottom:1px solid var(--linea);padding:var(--e-2) var(--e-3)}.barra{display:flex;gap:var(--e-1);overflow-x:auto;border-bottom:1px solid var(--linea);padding:var(--e-2) 0}.p{font:var(--t-chico);padding:var(--e-1) var(--e-3);border-radius:var(--r-control);color:var(--tinta-2);white-space:nowrap}.p.activa{color:var(--tinta-1);background:var(--sup-2);box-shadow:inset 0 -2px 0 var(--tinta-1)}`,
  `<h1>Rótulo y barra</h1><div class="rotulo"><strong>Simulación · no operativo</strong> · datos 100 % sintéticos; las decisiones humanas se simularon en lote</div>
<div class="barra"><span class="dato" style="padding:var(--e-1) var(--e-2)">planlang</span>${["Entrada", "Plan", "Agente", "Brecha", "Playground", "Casos", "Fichas"].map((t, i) => `<span class="p${i === 1 ? " activa" : ""}">${t}</span>`).join("")}</div>
<p class="chico">El rótulo es la primera franja de toda pantalla. En el teléfono la fila de pestañas se desliza dentro de sí; la página nunca.</p>`,
);
agregar(
  "componentes/botones-y-chips.html",
  "Componentes",
  "Botones y chips",
  BOTON,
  `<h1>Botones y chips</h1><h2>Botón</h2><div class="fila"><button class="btn principal">Ver como experto</button><button class="btn">Volver al plan</button><button class="btn chico">Ver 3 más: R7, R4, R8</button><button class="btn" disabled>No observado</button></div>
<p class="chico">Un principal por vista. Deshabilitado siempre dice por qué.</p>
<h2>Procedencia, junto a toda cifra</h2><div class="fila"><span class="chip">real · sprint 1</span><span class="chip maqueta">maqueta</span><span class="chip">fuente</span><span class="chip no">no observado</span></div>`,
);
agregar(
  "componentes/veredicto.html",
  "Componentes",
  "Veredicto",
  `.veredicto{display:inline-flex;align-items:center;gap:6px;font:var(--t-sub);padding:3px 10px;border-radius:var(--r-chip);border:1px solid var(--c);background:var(--t);color:var(--tinta-1)}.veredicto.chico{font:var(--t-chico);font-weight:600;padding:1px 7px}`,
  `<h1>Veredicto</h1><p class="chico">Símbolo dibujado + texto + color; el positivo con tinte y borde sólido. Discontinuo: aún no existe.</p>
<h2>Normal</h2><div class="fila">${VEREDICTOS.map((v) => veredicto(v)).join("")}</div>
<h2>Chico</h2><div class="fila">${VEREDICTOS.map((v) => veredicto(v, true)).join("")}</div>`,
);
agregar(
  "componentes/nodo-y-arista.html",
  "Componentes",
  "Nodo y arista",
  `.nodo{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:var(--r-control);background:var(--sup-2);border:1px solid var(--linea);font:600 12.5px/1.2 var(--letra)}.nodo code{font:10.5px/1 var(--mono);color:var(--tinta-2)}.nodo.sel{outline:2px solid var(--tinta-1);outline-offset:2px}.nodo.exigido{border-style:dashed;background:transparent;color:var(--tinta-2)}svg.ar{display:block;margin:var(--e-2) 0}`,
  `<h1>Nodo y arista</h1><h2>Nodos</h2><div class="fila">${TIPOS.map(([id, c, corto, nombre]) => `<span class="nodo">${glifo(id, c)}${nombre}<code>${corto}</code></span>`).join("")}</div>
<div class="fila" style="margin-top:var(--e-3)"><span class="nodo sel" style="background:var(--tipo-5-tinte);border-color:var(--tipo-5)">${glifo("enrutador", "tipo-5")}Decisión<code>ENR</code></span><span class="chico">seleccionado</span><span class="nodo exigido">${glifo("herramienta", "tipo-2")}Consulta<code>HER</code></span><span class="chico">exigido y ausente</span></div>
<h2>Aristas</h2>
<svg class="ar" width="320" height="24" viewBox="0 0 320 24"><path d="M4 12H290" stroke="var(--tinta-2)" stroke-width="1.5"/><path d="M290 7l8 5-8 5z" fill="var(--tinta-2)"/></svg><p class="chico">secuencia: sólida</p>
<svg class="ar" width="320" height="34" viewBox="0 0 320 34"><path d="M4 17H290" stroke="var(--tinta-2)" stroke-width="1.5" stroke-dasharray="5 4"/><path d="M290 12l8 5-8 5z" fill="var(--tinta-2)"/><rect x="70" y="6" width="170" height="22" rx="3" fill="var(--sup-1)" stroke="var(--tinta-3)"/><text x="155" y="21" text-anchor="middle" fill="var(--tinta-1)" font-size="10.5" font-family="var(--mono)">senal_confianza &lt; 0,75</text></svg><p class="chico">condicional: discontinua y su regla en un cuadro; «si no» rotula la rama por defecto</p>
<svg class="ar" width="320" height="24" viewBox="0 0 320 24"><path d="M4 12H290" stroke="var(--tinta-2)" stroke-width="1.5" stroke-dasharray="1.5 3.5" stroke-linecap="round"/><path d="M290 7l8 5-8 5z" fill="var(--tinta-2)"/></svg><p class="chico">reanudación: punteada</p>`,
);
agregar(
  "componentes/deslizador-de-umbral.html",
  "Componentes",
  "Deslizador de umbral",
  `${BOTON}.d{margin:var(--e-3) 0}.pista{position:relative;height:6px;background:var(--sup-2);border:1px solid var(--linea);border-radius:3px;margin:var(--e-3) 0}.plan{position:absolute;top:-6px;width:2px;height:16px;background:var(--tinta-2)}.pomo{position:absolute;top:-7px;width:18px;height:18px;border-radius:50%;background:var(--tinta-1);border:2px solid var(--fondo)}.sw{display:inline-flex;width:38px;height:22px;border-radius:11px;border:1px solid var(--tinta-3);background:var(--sup-2);padding:2px}.sw span{width:16px;height:16px;border-radius:50%;background:var(--tinta-2)}`,
  `<h1>Deslizador de umbral</h1>
<div class="d"><div class="fila"><strong>U1 · confianza mínima de extracción</strong><span class="chip">real</span></div><code>senal_confianza · menor_que · 0,90 · no inclusivo</code>
<div class="pista"><span class="plan" style="left:55.5%" title="valor del plan 0,75"></span><span class="pomo" style="left:calc(88.8% - 9px)"></span></div>
<p class="chico">rango jugable 0,50–0,95 · la marca es el valor del plan (0,75) · movido: 0,90</p></div>
<div class="d"><div class="fila"><strong>U4 · modo Texas</strong><span class="sw" role="switch" aria-checked="false"><span></span></span><span class="chico">booleano: ninguna determinación adversa automática</span></div></div>
<div class="d" style="opacity:.7"><div class="fila"><strong>U9 · señal sin registrar</strong><span class="chip no">no observado</span></div><p class="chico">deshabilitado: las trazas no registran la señal</p></div>`,
);
agregar(
  "componentes/fila-de-criterio.html",
  "Componentes",
  "Fila de criterio",
  `${BOTON}.veredicto{display:inline-flex;align-items:center;gap:6px;font:var(--t-chico);font-weight:600;padding:1px 7px;border-radius:var(--r-chip);border:1px solid var(--c);background:var(--t);color:var(--tinta-1)}.f{border-top:1px solid var(--linea);padding:var(--e-3) 0}.barra{position:relative;height:10px;background:var(--sup-2);border-radius:2px;margin:var(--e-2) 0}.med{position:absolute;inset:0 auto 0 0;background:var(--tinta-2);border-radius:2px}.hueco{position:absolute;top:0;bottom:0;background:repeating-linear-gradient(135deg,var(--no-cumple) 0 2px,transparent 2px 6px);border:1px solid var(--no-cumple)}`,
  `<h1>Fila de criterio</h1><p class="chico">Las dos filas son ilustrativas: llevan el chip «maqueta», como toda cifra que no sale de una corrida.</p>
<div class="f"><div class="fila"><code>C2</code><strong>Exactitud de la decisión</strong>${veredicto(VEREDICTOS[0], true)}<span class="chip maqueta">maqueta</span></div><p class="chico">regla: decision_final == verdad_conocida.decision · pass^3</p><div class="barra"><span class="med" style="width:100%"></span></div><p class="chico">medido 100 % · objetivo ≥ 95 %</p></div>
<div class="f"><div class="fila"><code>C5</code><strong>Latencia por caso</strong>${veredicto(VEREDICTOS[2], true)}<span class="chip maqueta">maqueta</span></div><p class="chico">la brecha entre lo medido y el objetivo se dibuja rayada, con su valor escrito</p><div class="barra"><span class="med" style="width:62%"></span><span class="hueco" style="left:62%;width:18%"></span></div><p class="chico">medido 62 % · objetivo 80 % · brecha 18 puntos</p></div>`,
);
agregar(
  "componentes/marco-de-cv-viva.html",
  "Componentes",
  "Marco de CV Viva",
  `.cv{--cv-papel:#fbfaf7;--cv-tinta:#121110;--cv-tinta-2:#5e5c55;--cv-salvia:#cfe3cf;--cv-salvia-tinta:#3c5a3c;background:var(--cv-papel);color:var(--cv-tinta);border-radius:var(--r-baldosa);padding:var(--e-5);border:1px solid #ddd8cb}.cv .migas{font:11px/1.4 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--cv-tinta-2)}.cv h3{font:500 34px/1.1 Fraunces,Georgia,serif;margin:var(--e-2) 0}.cv .estado{display:inline-block;background:var(--cv-salvia);color:var(--cv-salvia-tinta);font:11px/1.6 var(--mono);padding:0 8px;border-radius:99px}.cv .cifras{display:flex;gap:var(--e-5);margin-top:var(--e-4)}.cv .cifras b{font:500 26px/1 Fraunces,Georgia,serif;display:block}.cv .cifras span{font:12px/1.4 var(--letra);color:var(--cv-tinta-2)}`,
  `<h1>Marco de CV Viva</h1><p class="chico">El único lugar con otra piel: las fichas de la app y del agente como las pinta hoja-de-vida (papel, Fraunces en titulares, Inter en texto). Queda en papel claro en los dos temas.</p>
<div class="cv"><div class="migas">La vitrina · ficha técnica</div><span class="estado">Sin sellar</span><h3>planlang</h3><p>Planeé, construí y medí la brecha.</p><div class="cifras"><div><b>9</b><span>criterios del plan cumplidos, de 9</span></div><div><b>233</b><span>decisiones rehechas en otro lenguaje, con 0 diferencias</span></div><div><b>20</b><span>casos por corrida</span></div></div></div>`,
);

const README = `# planlang · bundle del design system

> GENERADO por \`node scripts/design-sync/generar.mjs\` desde \`design-system.md\` ${version} y los tokens de
> \`scripts/paleta/generar-tokens.mjs\`. No se edita a mano: \`tests/unit/design-sync.test.ts\` lo regenera y exige los
> mismos bytes.

Espejo publicable del design system de planlang para Claude Design (regla 16 de la constitución). La jerarquía es
fija: \`design-system.md\` (fuente de verdad) → \`design-sync/\` (este bundle, deriva) → el proyecto en Claude Design
(vitrina, jamás se edita allá). El destino y el registro de publicación viven en \`project.json\`.

**Estado:** sin publicar. Se publica en el cierre de pruebas del ciclo H1 (S3), después del gate ⭐⭐ corto, cuando el
usuario invoque \`/design-sync\`.

## Qué trae

- \`styles.css\`: los tokens de color de los dos temas (generados) y la escala de tipografía, espacio, forma y
  movimiento del § 2.
- ${TARJETAS.length} tarjetas autocontenidas (primera línea \`@dsCard\`, CSS en línea, sin CDN), cada una en los dos temas:

| Grupo | Tarjeta | Archivo |
| --- | --- | --- |
${TARJETAS.map((t) => `| ${t.grupo} | ${t.nombre} | \`components/${t.archivo}\` |`).join("\n")}

## Lo que no está aquí

El catálogo completo de componentes canon (§ 5, más de 50) vive en \`design-system.md\` y en la vitrina construida;
estas tarjetas muestran los fundamentos y los componentes que fijan la gramática visual. Inter, JetBrains Mono y
Fraunces los sirve la app; las tarjetas declaran la pila de letras sin descargar fuentes.
`;

const ARCHIVOS = {
  "README.md": README,
  "styles.css": STYLES,
  ...Object.fromEntries(
    TARJETAS.map((t) => [`components/${t.archivo}`, t.html]),
  ),
};

export function archivosDelBundle() {
  return ARCHIVOS;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const verificar = process.argv.includes("--verificar");
  const distintos = [];
  for (const [ruta, contenido] of Object.entries(ARCHIVOS)) {
    const destino = join(SALIDA, ruta);
    const actual = existsSync(destino) ? readFileSync(destino, "utf8") : null;
    if (actual === contenido) continue;
    distintos.push(ruta);
    if (!verificar) {
      mkdirSync(dirname(destino), { recursive: true });
      writeFileSync(destino, contenido);
    }
  }
  if (verificar && distintos.length) {
    console.error(
      `design-sync/ desactualizado (${distintos.join(", ")}): node scripts/design-sync/generar.mjs`,
    );
    process.exit(1);
  }
  console.log(
    `design-sync: ${Object.keys(ARCHIVOS).length} archivos${verificar ? " al día" : `, ${distintos.length} escritos`}`,
  );
}
