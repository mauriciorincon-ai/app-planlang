// Arnés de CAPTURAS de la vitrina (S2): gate de FIDELIDAD de cada pantalla contra su maqueta y pasada de
// INTERACCIÓN (regla 22 b). Sirve `out/` (el export ya construido: `pnpm build` antes) y `docs/diseno/` con
// un servidor estático propio en puertos libres, entra por el ÍNDICE (`/?elegir`) y desde ahí a la pantalla,
// y para cada ancho × tema × idioma (× perfil) captura la pantalla de la vitrina y la de la maqueta sin el
// cromo de sala. Después:
//   - mide: sin desplazamiento horizontal de página, fuentes activas cargadas, consola sin errores;
//   - pasada de interacción: pulsa cada control (tema, perfil, «Ver como experto», idioma, una pestaña) y
//     comprueba que ALGO cambió en el DOM; un control que no cambia nada pone el arnés en rojo;
//   - arma `docs/fidelidad/<mirada>/index.html` (autocontenido, sin CDN) con los pares lado a lado, la
//     matriz de qué mirar y el resultado de las mediciones.
//
// Regla 17-bis (b): declara al arrancar los dos árboles que lee (`out/`, `docs/diseno/`) y ABORTA si una ruta
// pedida sale de ellos. No toca datos: la vitrina solo tiene datos sintéticos precompilados.
//
// Uso: node scripts/capturar-vitrina.mjs [--mirada p1] [--anchos 380,1280] [--temas oscuro,claro]
//      [--idiomas es,en] [--calidad 55] [--solo-medir]
import {
  createReadStream,
  existsSync,
  mkdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(raiz, "out");
const MAQUETA = join(raiz, "docs");
const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i < 0 ? def : process.argv[i + 1];
};
const bandera = (n) => process.argv.includes(`--${n}`);

/** Pasada de interacción de la Entrada: tema, perfil, «Ver como experto», idioma y una pestaña. */
async function interaccionEntrada({ page, probar }) {
  await page.goto(`${V}/es?tema=oscuro&perfil=lider`);
  await asentar(page);
  await probar(
    "tema → Claro",
    () => page.getByRole("button", { name: "Claro" }).click(),
    () =>
      page.evaluate(
        () =>
          document.documentElement.dataset.theme === "claro" &&
          getComputedStyle(document.body).backgroundColor !== "rgb(11, 12, 15)",
      ),
  );
  await probar(
    "tema → Oscuro",
    () => page.getByRole("button", { name: "Oscuro" }).click(),
    () =>
      page.evaluate(() => document.documentElement.dataset.theme === "oscuro"),
  );
  await probar(
    "Leer como → Experto",
    () => page.getByRole("button", { name: "Experto", exact: true }).click(),
    () =>
      page
        .getByRole("heading", { name: "Cómo se sostiene cada afirmación" })
        .isVisible(),
  );
  await probar(
    "Volver a líder",
    () => page.getByRole("button", { name: "Volver a líder" }).click(),
    async () =>
      !(await page
        .getByRole("heading", { name: "Cómo se sostiene cada afirmación" })
        .isVisible()),
  );
  await probar(
    "Ver como experto",
    () => page.getByRole("button", { name: "Ver como experto" }).click(),
    () =>
      page
        .getByRole("heading", { name: "Cómo se sostiene cada afirmación" })
        .isVisible(),
  );
  await probar(
    "idioma → EN",
    () => page.getByRole("link", { name: "English" }).click(),
    () =>
      page.evaluate(
        () =>
          document.documentElement.lang === "en" && location.pathname === "/en",
      ),
  );
  await probar(
    "pestaña → Plan",
    () =>
      page
        .getByRole("navigation", { name: "Sections" })
        .getByRole("link", { name: "Plan" })
        .click(),
    () => page.evaluate(() => location.pathname === "/en/plan"),
  );
}

/** Pasada de interacción de la mirada 2: los controles propios de Plan, Agente y Caso. */
async function interaccionMirada2({ page, probar }) {
  await page.goto(`${V}/es/plan?tema=oscuro&perfil=lider`);
  await asentar(page);
  await probar(
    "Plan: índice → Riesgos",
    () =>
      page
        .getByRole("navigation", { name: "Partes del plan" })
        .getByRole("link", { name: "Riesgos" })
        .click(),
    () => page.evaluate(() => location.hash === "#p-ries"),
  );
  await probar(
    "Plan: «Ver 3 más»",
    () => page.getByRole("button", { name: "Ver 3 más: R7, R4, R8" }).click(),
    () => page.getByText("Bucle de aclaraciones", { exact: true }).isVisible(),
  );
  await probar(
    "Plan: abrir un renglón",
    () => page.locator("#fila-R2 summary").click(),
    () => page.locator("#fila-R2").getByText("Si pasa").isVisible(),
  );
  await probar(
    "Plan: Leer como → Experto",
    () =>
      page
        .getByRole("group", { name: "Leer como" })
        .getByRole("button", { name: "Experto" })
        .click(),
    () =>
      page.getByRole("heading", { name: "Ficha técnica del plan" }).isVisible(),
  );
  await page.goto(`${V}/es/agente?tema=oscuro&perfil=lider`);
  await asentar(page);
  await probar(
    "Agente: elegir «decision» en el lienzo",
    () => page.locator('[data-sel-id="decision"]').click(),
    () => page.locator("#detalle-decision").isVisible(),
  );
  await probar(
    "Agente: pestaña «Código» del panel",
    () =>
      page
        .locator("#detalle-decision")
        .getByRole("button", { name: "Código", exact: true })
        .click(),
    () => page.locator("#detalle-decision figure").first().isVisible(),
  );
  await page.goto(`${V}/es/caso/A-006?tema=oscuro&perfil=lider`);
  await asentar(page);
  await probar(
    "Caso: selector → A-008",
    () =>
      page
        .getByRole("navigation", { name: "Casos", exact: true })
        .getByRole("link", { name: /^A-008/ })
        .click(),
    () => page.evaluate(() => location.pathname === "/es/caso/A-008"),
  );
}

/** Mueve U2 del playground a 1600 con el teclado (seis pasos de 100 desde el plan, 1000). */
async function u2a1600(page) {
  await page.locator("#w-U2 input[type=range]").focus();
  for (let k = 0; k < 6; k++) await page.keyboard.press("ArrowRight");
  await page.locator('#cambios [data-caso="A-010"]').waitFor();
  // Sin el anillo de foco del teclado en la captura: se compara la pantalla, no el foco.
  await page.evaluate(() => document.activeElement?.blur());
}

/** Pasada de interacción de la mirada 3: los controles propios de Brecha y del Playground. */
async function interaccionMirada3({ page, probar }) {
  await page.goto(`${V}/es/brecha?tema=oscuro&perfil=lider`);
  await asentar(page);
  await probar(
    "Brecha: «Ver como experto»",
    () => page.getByRole("button", { name: "Ver como experto" }).click(),
    () =>
      page.evaluate(
        () =>
          document.documentElement.getAttribute("data-perfil") === "experto",
      ),
  );
  await probar(
    "Brecha: balance «1 · S3» → lo que falló",
    () => page.locator('a[href="#f-S3"]').first().click(),
    () => page.evaluate(() => location.hash === "#f-S3"),
  );
  await probar(
    "Brecha: «Abrir el playground»",
    () => page.getByRole("link", { name: "Abrir el playground" }).click(),
    () => page.evaluate(() => location.pathname === "/es/playground"),
  );
  await asentar(page);
  await probar(
    "Playground: U2 → 1600 con el teclado",
    () => u2a1600(page),
    () => page.locator('#cambios [data-caso="A-010"]').isVisible(),
  );
  await probar(
    "Playground: «Volver al plan»",
    () => page.getByRole("button", { name: "Volver al plan" }).click(),
    () =>
      page.evaluate(
        () => document.querySelectorAll("#cambios [data-caso]").length === 0,
      ),
  );
  await probar(
    "Playground: modo Texas encendido",
    () => page.getByRole("switch", { name: /Modo Texas/ }).click(),
    () =>
      page.evaluate(
        () =>
          document
            .querySelector("#w-U4 [role=switch]")
            ?.getAttribute("aria-checked") === "true",
      ),
  );
}

/**
 * Mirada 4: en Fichas, el experto ve la tabla de campos bajo cada ficha y los pasos para repetir la corrida; volver a
 * líder la oculta; el idioma lleva a la misma pantalla en inglés, con la ficha del agente en inglés.
 */
async function interaccionMirada4({ page, probar }) {
  await page.goto(`${V}/es/fichas?tema=oscuro&perfil=lider`);
  await asentar(page);
  await probar(
    "Fichas: «Ver como experto» → la tabla de campos",
    () => page.getByRole("button", { name: "Ver como experto" }).click(),
    () => page.locator('[data-campo="proceso.carriles[]"]').isVisible(),
  );
  await probar(
    "Fichas: «Volver a líder» → la tabla se oculta",
    () => page.getByRole("button", { name: "Volver a líder" }).click(),
    () => page.locator('[data-campo="proceso.carriles[]"]').isHidden(),
  );
  await probar(
    "Fichas: «English» → la misma pantalla en inglés",
    () => page.getByRole("link", { name: "English" }).click(),
    () =>
      page.evaluate(
        () =>
          location.pathname === "/en/fichas" &&
          document
            .querySelector('[data-ficha-cv="agente"]')
            ?.getAttribute("lang") === "en",
      ),
  );
}

/** Los pares de experto de cada pantalla (oscuro, español, en los dos anchos). */
const EXPERTO = [
  { ancho: 1280, tema: "oscuro", idioma: "es", perfil: "experto" },
  { ancho: 380, tema: "oscuro", idioma: "es", perfil: "experto" },
];

/**
 * Las miradas que el arnés sabe capturar: sus pantallas (ruta de la vitrina y página de la maqueta), la pasada de
 * interacción y la matriz de qué mirar (pantalla · dónde · qué hacer · qué debe verse).
 */
const MIRADAS = {
  p1: {
    titulo: {
      es: "P1 Entrada frente a su maqueta",
      en: "P1 Home against its mock-up",
    },
    pregunta: "¿La Entrada construida se ve como la maqueta que aprobaste?",
    pantallas: [
      {
        clave: "p1",
        nombre: "P1 Entrada",
        ruta: (idioma) => `/${idioma}`,
        maqueta: "diseno/01-entrada.html",
        extra: EXPERTO,
      },
    ],
    interaccion: interaccionEntrada,
    matriz: [
      [
        "Arriba: la tesis y el gancho",
        "Lee el titular y la columna de la derecha.",
        "«Planeé, construí y medí la brecha» y los datos con su fuente: 89 % observan, 52 % evalúan, nadie pregunta si se planeó qué evaluar.",
      ],
      [
        "«Cómo funciona»",
        "Lee el objetivo y los tres pasos.",
        "El objetivo en una frase; «Construí» con las 8 piezas del agente real; «Medí la brecha» con 9 de 9 criterios y lo que falló, nombrado.",
      ],
      [
        "«Capacidad medida», bajo los tres pasos",
        "Mira las cuatro cifras.",
        "20 × 3 casos, 233 decisiones con 0 diferencias, 9 de 9 · 0 de 8 y 0 llamadas a modelos, cada una con su procedencia.",
      ],
      [
        "«Los demos», fila A",
        "Compara la columna «Corrida» con la maqueta.",
        "Demo A «Cumple con alertas». La corrida dice «plan v1.3 · corrida con v1.2»: el informe es el del plan v1.3 sobre el lote que corrió con la v1.2 (la maqueta decía «plan v1.2»).",
      ],
      [
        "Botón «Ver como experto»",
        "Mira el par «experto».",
        "Aparece «Cómo se sostiene cada afirmación» con el rótulo «Experto»: núcleo sin IA, trazas, prueba cruzada, modelo, decisiones simuladas, pila y fuente.",
      ],
      [
        "Barra de arriba, en el teléfono",
        "Mira los pares de 380 px.",
        "Las pestañas bajan a su propia fila y se deslizan de lado; la página no se desplaza de lado.",
      ],
      [
        "Toda la página, tema claro",
        "Mira los pares «claro».",
        "Los mismos colores que la maqueta en claro; ningún texto en gris tenue sobre blanco.",
      ],
      [
        "Toda la página, en inglés",
        "Mira los pares «en».",
        "Todo redactado en inglés, sin español residual; decimales con punto y porcentajes pegados («89%», como pide el design system para el inglés; la maqueta los dejaba con espacio).",
      ],
    ],
  },
  p2: {
    titulo: {
      es: "Mirada 2: P2 Plan, P3 Agente y P6 Caso frente a sus maquetas",
      en: "Look 2: P2 Plan, P3 Agent and P6 Case against their mock-ups",
    },
    pregunta:
      "¿Plan, Agente y Casos construidos se ven como las maquetas que aprobaste?",
    pantallas: [
      {
        clave: "p2",
        nombre: "P2 Plan",
        ruta: (idioma) => `/${idioma}/plan`,
        maqueta: "diseno/02-plan.html",
        estadoMaqueta: "plan",
        extra: EXPERTO,
      },
      {
        clave: "p3",
        nombre: "P3 Agente",
        ruta: (idioma) => `/${idioma}/agente`,
        maqueta: "diseno/03-agente.html",
        // En esta maqueta el estado de sala es el nodo elegido; la vitrina abre con el primero del contrato.
        estadoMaqueta: "enrutador",
        extra: EXPERTO,
      },
      {
        clave: "p6",
        nombre: "P6 Caso (A-006)",
        ruta: (idioma) => `/${idioma}/caso/A-006`,
        maqueta: "diseno/06-caso.html",
        estadoMaqueta: "a006",
        extra: EXPERTO,
      },
    ],
    interaccion: interaccionMirada2,
    matriz: [
      [
        "P2 Plan",
        "Arriba, «El plan en una mirada»",
        "Lee «Para qué» y las tres cajas.",
        "El problema, el dominio (40 procedimientos, 5 exentos, 6 exclusiones) y quién participa; seis pasos con ✓; tres entregas, la primera con la huella del plan v1.3.",
      ],
      [
        "P2 Plan",
        "Las cinco cifras",
        "Mira «riesgos».",
        "«5 con prioridad alta, 2 por control legal». La maqueta decía 3: el plan v1.3 declara el control legal de R1 y R6, que sube su prioridad.",
      ],
      [
        "P2 Plan",
        "«Riesgos»",
        "Mira el orden y la columna de la derecha de R1 y R6.",
        "R2, R3, R1, R6 y R5 a la vista; R1 y R6 con «AP alta» y la línea «control legal (tabla: baja)»; abajo, «Ver 3 más: R7, R4, R8».",
      ],
      [
        "P2 Plan",
        "Cualquier renglón",
        "Pulsa «Por qué y qué más se consideró» o «Qué pasaría y qué se hizo».",
        "Se abre el porqué con sus filas; como experto, además, la línea técnica en letra de código.",
      ],
      [
        "P2 Plan",
        "Pares «experto»",
        "Mira bajo las cifras y al final de la página.",
        "«Ficha técnica del plan» y «Las 9 aristas condicionales, en orden»; en el teléfono, una tarjeta por regla, sin cortar palabras.",
      ],
      [
        "P2 Plan",
        "«Umbrales»",
        "Pulsa «Moverlo».",
        "Lleva a Playground, que sigue «en construcción» hasta la fase 3.",
      ],
      [
        "P3 Agente",
        "El lienzo",
        "Mira las formas de los nodos.",
        "Las reglas (verificador_cobertura, guardia_salida) con hexágono, distintas de los círculos de inicio y fin; ninguna línea cruza una caja ni el rótulo «fin».",
      ],
      [
        "P3 Agente",
        "El lienzo, pares de 380 px",
        "Mira el marco del lienzo y el índice de capas.",
        "El lienzo se desliza dentro de su marco con el índice de capas debajo; la página no se desplaza de lado.",
      ],
      [
        "P3 Agente",
        "El panel del nodo",
        "Abre la página, toca «decision» y luego la pestaña «Trazas».",
        "El panel cambia al nodo; «Trazas · 15» muestra 5 casos reales y «Ver 10 más»; cada fila se abre y enlaza a su caso.",
      ],
      [
        "P3 Agente",
        "«Antes: el spike», al final",
        "Lee las tres cifras.",
        "«3 de 8» nodos, «1 de 9» reglas (la de U1, pero en enrutador y no en decision) y «1 nodo fuera del contrato» (aprobar), con el lienzo del spike dibujado contra el mismo contrato y lo que faltaba en discontinuo.",
      ],
      [
        "P3 Agente",
        "La ficha, pares «experto»",
        "Mira la matriz «Qué del plan toca a cada nodo».",
        "Lleva el chip «declarado»: la lectura del autor comprobada por prueba (la maqueta decía «maqueta»).",
      ],
      [
        "P6 Caso",
        "«Recibe»",
        "Mira el texto del médico.",
        "La instrucción escondida va marcada con borde discontinuo y ⚠, y el resto del texto sigue normal.",
      ],
      [
        "P6 Caso",
        "«El recorrido, paso a paso»",
        "Lee los pasos; luego mira un par «experto».",
        "Cada paso dice qué hizo y por qué tomó su rama; como experto, la tabla de reglas con que decidió y la regla que eligió la rama resaltada.",
      ],
      [
        "P6 Caso",
        "La pausa humana y el documento",
        "Mira las dos secciones.",
        "Lo que vio el auditor (evidencia y contraevidencia, respuesta simulada dicha) y el documento de decisión adversa con su aviso de IA.",
      ],
      [
        "P6 Caso",
        "El selector de casos",
        "En la página, pulsa A-008.",
        "Cambia de caso y lo marca; A-008 muestra el diálogo con el médico y no trae pausa ni documento.",
      ],
      [
        "Las tres",
        "Pares «claro» y «en»",
        "Míralos junto a su maqueta.",
        "Los mismos colores que la maqueta en claro; en inglés todo redactado, salvo los nombres del código y las citas del modelo (marcadas en español).",
      ],
    ],
  },
  p3: {
    titulo: {
      es: "Mirada 3: P4 Brecha y P5 Playground frente a sus maquetas",
      en: "Look 3: P4 Gap and P5 Playground against their mock-ups",
    },
    pregunta:
      "¿Brecha y Playground construidos se ven como las maquetas que aprobaste?",
    pantallas: [
      {
        clave: "p4",
        nombre: "P4 Brecha",
        ruta: (idioma) => `/${idioma}/brecha`,
        maqueta: "diseno/04-brecha.html",
        estadoMaqueta: "real",
        extra: EXPERTO,
      },
      {
        clave: "p5",
        nombre: "P5 Playground",
        ruta: (idioma) => `/${idioma}/playground`,
        maqueta: "diseno/05-playground.html",
        estadoMaqueta: "plan",
        extra: EXPERTO,
      },
      {
        clave: "p5-u2",
        nombre: "P5 Playground con U2 en 1600",
        ruta: (idioma) => `/${idioma}/playground`,
        maqueta: "diseno/05-playground.html",
        estadoMaqueta: "u2",
        accion: u2a1600,
        // Un estado movido basta en los dos anchos, oscuro, en los dos idiomas: el resto ya lo cubren los pares
        // del plan.
        pares: [
          { ancho: 1280, tema: "oscuro", idioma: "es", perfil: "lider" },
          { ancho: 380, tema: "oscuro", idioma: "es", perfil: "lider" },
          { ancho: 1280, tema: "oscuro", idioma: "en", perfil: "lider" },
        ],
      },
    ],
    interaccion: interaccionMirada3,
    matriz: [
      [
        "P4 Brecha",
        "«El informe en una mirada»",
        "Lee el sello y la frase debajo.",
        "«Cumple con alertas»: se cumplieron los 9 criterios y no ocurrió ninguno de los 8 riesgos; fallaron S3 (varios agentes, más lentos que uno) y 5 respuestas fuera de formato; S1 quedó sin probar.",
      ],
      [
        "P4 Brecha",
        "El balance",
        "Pulsa «1 · S3» en la fila de supuestos.",
        "Baja a «Lo que falló», al renglón de S3, con sus casos A-008, A-012 y A-020 enlazados.",
      ],
      [
        "P4 Brecha",
        "«Lo que quedó sin probar»",
        "Mira el renglón de S1.",
        "Borde discontinuo y «Sin probar»: el modelo acertó los 15 casos medidos y sin un error no hay con qué medir su confianza.",
      ],
      [
        "P4 Brecha",
        "«Se cumplió, con una nota»",
        "Lee el renglón de C3.",
        "Cumple sobre solo 3 casos; con U2 en 1500 deja de cumplirse (A-010 saldría sin persona). Ese 1500 lo calcula el playground, no está escrito a mano.",
      ],
      [
        "P4 Brecha",
        "Lo cumplido, renglón R8",
        "Mira la columna de la derecha.",
        "«0 de 1 sesión»: R8 se cuenta por sesión, no por caso (la maqueta decía «casos»).",
      ],
      [
        "P4 Brecha",
        "§ 5 Brechas no previstas, pares «experto»",
        "Mira cada falla y la tabla de evaluadores.",
        "Cada falla con su categoría y sus reintentos, y una columna «No evaluables» en los evaluadores: es la deuda M-24 pagada.",
      ],
      [
        "P4 Brecha",
        "§ 6 Supuestos, S1",
        "Mira la curva en miniatura.",
        "La curva plana en 0 % con las etiquetas de U1 sin encimarse y el punto del plan en 0,75.",
      ],
      [
        "P5 Playground",
        "«El playground en una mirada», como líder",
        "Lee «Un ejemplo».",
        "Subir U1 de 0,75 a 0,90 manda A-008 (confianza 0,88) a una persona: 12 minutos más, ningún error nuevo. Es una medida, no un texto fijo.",
      ],
      [
        "P5 Playground",
        "Pares «experto»",
        "Mira la ficha técnica y la regla de decisión.",
        "El orden de evaluación sigue el grafo (enrutador, extractor, aclaracion, decision) y no el alfabeto; la regla muestra los valores que muevas, subrayados.",
      ],
      [
        "P5 Playground",
        "Par «U2 en 1600»",
        "Compáralo con la maqueta en el mismo estado.",
        "A-010 pasa a «solo» y es un error; C3 deja de cumplirse. La maqueta decía «8 de 9»; aquí dice «6 de 9» porque C2 y C7 no se pueden medir en A-010: leen lo que pasa después del cambio, que la traza no registró.",
      ],
      [
        "P5 Playground",
        "Modo Texas (U4)",
        "En la página, enciéndelo.",
        "Ningún caso cambia, y la lista lo dice: toda propuesta adversa ya pasaba por una persona; abajo, «conmutarlo cambia 0 de las 62 decisiones».",
      ],
      [
        "P5 Playground",
        "La curva riesgo-cobertura",
        "En la página, mueve U1.",
        "El cuadro ■ sigue a U1 en la curva y en la tabla; el círculo es el plan. La lectura dice que el riesgo quedó en 0 % porque no hubo errores.",
      ],
      [
        "Las dos",
        "Pares «claro» y «en»",
        "Míralos junto a su maqueta.",
        "Los mismos colores que la maqueta en claro; en inglés todo redactado, salvo los nombres del código.",
      ],
    ],
  },
};

MIRADAS.p4 = {
  titulo: {
    es: "Mirada 4: P7 Fichas frente a su maqueta",
    en: "Look 4: P7 Records against its mock-up",
  },
  pregunta: "¿Las fichas construidas se ven como la maqueta que aprobaste?",
  pantallas: [
    {
      clave: "p7",
      nombre: "P7 Fichas",
      ruta: (idioma) => `/${idioma}/fichas`,
      maqueta: "diseno/07-fichas.html",
      estadoMaqueta: "fichas",
      extra: EXPERTO,
    },
  ],
  interaccion: interaccionMirada4,
  matriz: [
    [
      "P7 Fichas",
      "Arriba, «Las fichas en una mirada»",
      "Lee la columna «Entrega».",
      "Qué va a quién: la de reproducibilidad se queda en planlang; viajan brochure-export.json (los hechos de la app, de los que hoja-de-vida arma su ficha) y planlang-demo-a.ficha-tecnica.json, sin enlaces.",
    ],
    [
      "P7 Fichas",
      "1 · Ficha de reproducibilidad",
      "Recórrela.",
      "Plan v1.3 y el plan con que corrió (v1.2), casos con su semilla, corrida, grafo, repeticiones, línea base, entorno y la huella del informe: nada inventado.",
    ],
    [
      "P7 Fichas",
      "2 · La ficha de la app",
      "Mírala como la vería un visitante de tu hoja de vida.",
      "Papel y Fraunces, con los rótulos reales de hoja-de-vida («Sin sellar», «Datos del 2026-09-27»); cinco cifras con su fuente, seis grupos con 16 funcionalidades, límites, nunca y dónde está.",
    ],
    [
      "P7 Fichas",
      "3 · La ficha del agente A, «Cómo funciona»",
      "Busca los carriles.",
      "Médico, el agente, auditor y afiliado, con los 15 pasos numerados en su orden; la decisión con borde discontinuo. En hoja-de-vida los dibuja su motor BPMN.",
    ],
    [
      "P7 Fichas",
      "Pares «experto»",
      "Baja a cada ficha.",
      "Los pasos para repetir la corrida y, bajo cada ficha, la tabla de campos contra el contrato v1.3.1: todos «Cabe».",
    ],
    [
      "P7 Fichas",
      "Pares «claro» y «en»",
      "Míralos junto a su maqueta.",
      "El marco de CV Viva se queda en papel claro en los dos temas; en inglés, las dos fichas redactadas en inglés.",
    ],
  ],
};

const mirada = arg("mirada", "p1");
const M = MIRADAS[mirada];
if (!M) {
  console.error(
    `capturar-vitrina: no sé capturar la mirada «${mirada}» (conozco: ${Object.keys(MIRADAS).join(", ")}).`,
  );
  process.exit(1);
}
if (!existsSync(join(OUT, "index.html"))) {
  console.error(
    "capturar-vitrina: falta out/index.html — corre `pnpm build` antes. Aborto.",
  );
  process.exit(1);
}
const anchos = arg("anchos", "380,1280").split(",").map(Number);
const temas = arg("temas", "oscuro,claro").split(",");
const idiomas = arg("idiomas", "es,en").split(",");
const calidad = Number(arg("calidad", "55"));
const soloMedir = bandera("solo-medir");
const destino = join(raiz, "docs", "fidelidad", mirada);

console.log(
  `capturar-vitrina: árboles leídos → vitrina ${OUT} · maqueta ${join(MAQUETA, "diseno")}`,
);
console.log(
  `capturar-vitrina: salida → ${soloMedir ? "(solo medir, sin archivos)" : destino}`,
);

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".md": "text/plain; charset=utf-8",
};

/** Servidor estático con URL limpias (como `serve` y `cleanUrls` de Vercel): /es → es.html. */
function servidor(base) {
  return createServer((req, res) => {
    const ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const pedido = normalize(join(base, ruta));
    if (!pedido.startsWith(base)) {
      res.writeHead(403).end();
      console.error(`capturar-vitrina: ${ruta} sale de ${base}. Aborto.`);
      process.exit(1);
    }
    const candidatos = [pedido, `${pedido}.html`, join(pedido, "index.html")];
    const archivo = candidatos.find(
      (c) => existsSync(c) && statSync(c).isFile(),
    );
    if (!archivo) {
      const nf = join(base, "404.html");
      res.writeHead(404, { "content-type": TIPOS[".html"] });
      return existsSync(nf) ? createReadStream(nf).pipe(res) : res.end("404");
    }
    res.writeHead(200, {
      "content-type": TIPOS[extname(archivo)] ?? "application/octet-stream",
    });
    createReadStream(archivo).pipe(res);
  });
}
const escuchar = (s) =>
  new Promise((ok) => s.listen(0, "127.0.0.1", () => ok(s.address().port)));
const sVitrina = servidor(OUT);
const sMaqueta = servidor(MAQUETA);
const pV = await escuchar(sVitrina);
const pM = await escuchar(sMaqueta);
const V = `http://127.0.0.1:${pV}`;
const Q = `http://127.0.0.1:${pM}`;

const CROMO_SALA =
  ".mq-bar,.mq-nota,.mq-solo-sala,.mq-cierre{display:none!important}";
const combinaciones = [];
for (const pantalla of M.pantallas) {
  if (pantalla.pares) {
    for (const e of pantalla.pares)
      if (
        anchos.includes(e.ancho) &&
        temas.includes(e.tema) &&
        idiomas.includes(e.idioma)
      )
        combinaciones.push({ pantalla, ...e });
    continue;
  }
  for (const ancho of anchos)
    for (const tema of temas)
      for (const idioma of idiomas)
        combinaciones.push({ pantalla, ancho, tema, idioma, perfil: "lider" });
  for (const e of pantalla.extra)
    if (
      anchos.includes(e.ancho) &&
      temas.includes(e.tema) &&
      idiomas.includes(e.idioma)
    )
      combinaciones.push({ pantalla, ...e });
}
const varias = M.pantallas.length > 1;

const navegador = await chromium.launch();
const pares = [];
const mediciones = [];
const fallas = [];

async function asentar(page) {
  // La mono de datos de la vitrina entra tras la carga (`html[data-mono]`, ADR-008): se espera a que esté.
  if (page.url().startsWith(V))
    await page.waitForFunction(() =>
      document.documentElement.hasAttribute("data-mono"),
    );
  await page.evaluate(async () => {
    void document.body.offsetHeight;
    await document.fonts.ready;
  });
  // Las transiciones de color duran 150 ms: se deja que terminen antes de capturar.
  await page.waitForTimeout(400);
}

async function medir(page, que) {
  return page.evaluate((que) => {
    const d = document.documentElement;
    const cs = getComputedStyle(document.body);
    return {
      que,
      desbordaDeLado: d.scrollWidth > d.clientWidth,
      // La primera familia del cuerpo y la de un dato en mono (next/font las renombra) deben estar CARGADAS.
      fuentes: [
        ["letra", document.body],
        ["mono", document.querySelector(".font-mono")],
      ].map(([nombre, el]) => {
        const familia = el
          ? getComputedStyle(el)
              .fontFamily.split(",")[0]
              .trim()
              .replace(/["']/g, "")
          : "";
        return [
          `${nombre} (${familia})`,
          [...document.fonts].some(
            (x) =>
              x.family.replace(/["']/g, "") === familia &&
              x.status === "loaded",
          ),
        ];
      }),
      letra: cs.fontFamily.slice(0, 60),
    };
  }, que);
}

/**
 * La maqueta toma el perfil de `?perfil=` (perfil.js); la de Agente no lo carga y su ficha cambia de perfil con sus
 * pestañas. Se comprueba y, si no quedó en experto, se pulsa el control que la maqueta dibuja para eso.
 */
async function maquetaEnExperto(page, c) {
  const enExperto = () =>
    page.evaluate(
      () =>
        document.documentElement.getAttribute("data-perfil") === "experto" ||
        document
          .querySelector(".vista-alterna button[data-vista=experto]")
          ?.getAttribute("aria-pressed") === "true",
    );
  if (await enExperto()) return;
  const boton = page
    .locator(
      "button[data-perfil-set=experto]:visible, .vista-alterna button[data-vista=experto]:visible",
    )
    .first();
  if (await boton.count()) await boton.click();
  if (!(await enExperto()))
    fallas.push(
      `maqueta ${c.pantalla.nombre} ${c.ancho}: no se pudo poner en experto`,
    );
}

for (const c of combinaciones) {
  const ctx = await navegador.newContext({
    viewport: { width: c.ancho, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  const errores = [];
  page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  page.on("pageerror", (e) => errores.push(String(e)));
  // Entra por el índice (sin redirección) y de ahí a la pantalla, con el tema y el perfil en la URL.
  await page.goto(`${V}/?elegir`);
  await page.click(`a[hreflang="${c.idioma}"]`);
  await page.goto(
    `${V}${c.pantalla.ruta(c.idioma)}?tema=${c.tema}&perfil=${c.perfil}`,
  );
  await asentar(page);
  // Un estado movido (p. ej. U2 en 1600): se llega con el control, como lo haría quien lee.
  if (c.pantalla.accion) {
    await c.pantalla.accion(page);
    await asentar(page);
  }
  const m = await medir(
    page,
    `vitrina ${c.pantalla.nombre} ${c.ancho} ${c.tema} ${c.idioma} ${c.perfil}`,
  );
  m.errores = errores.slice();
  mediciones.push(m);
  if (m.desbordaDeLado) fallas.push(`${m.que}: la página se desplaza de lado`);
  if (m.fuentes.some(([, ok]) => !ok))
    fallas.push(`${m.que}: una fuente no cargó (${JSON.stringify(m.fuentes)})`);
  if (errores.length)
    fallas.push(`${m.que}: errores de consola ${JSON.stringify(errores)}`);
  const base = `${varias ? `${c.pantalla.clave}-` : ""}${c.ancho}-${c.tema}-${c.idioma}${c.perfil === "experto" ? "-experto" : ""}`;
  const archivoV = `vitrina-${base}.jpg`;
  const archivoM = `maqueta-${base}.jpg`;
  if (!soloMedir) {
    mkdirSync(destino, { recursive: true });
    await page.screenshot({
      path: join(destino, archivoV),
      fullPage: true,
      type: "jpeg",
      quality: calidad,
      // Brecha en el teléfono pasa de 20.000 px: la captura de página entera tarda más que los 30 s por omisión.
      timeout: 120_000,
    });
  }
  await page.goto(
    `${Q}/${c.pantalla.maqueta}?tema=${c.tema}&lang=${c.idioma}&estado=${c.pantalla.estadoMaqueta ?? "real"}&perfil=${c.perfil}`,
  );
  await page.addStyleTag({ content: CROMO_SALA });
  // El estado de sala tiene que existir en esa maqueta: con uno que no tiene, la sala oculta todo lo que depende
  // de un estado y la captura sale vacía (le pasó a Plan y a Casos con «real» en la mirada 2).
  const estadoPedido = c.pantalla.estadoMaqueta ?? "real";
  const tieneEstado = await page.evaluate(
    (e) => !!document.querySelector(`button[data-estado="${e}"]`),
    estadoPedido,
  );
  if (!tieneEstado)
    fallas.push(
      `maqueta ${c.pantalla.maqueta}: no tiene el estado de sala «${estadoPedido}»; la captura saldría vacía`,
    );
  if (c.perfil === "experto") await maquetaEnExperto(page, c);
  await asentar(page);
  if (!soloMedir)
    await page.screenshot({
      path: join(destino, archivoM),
      fullPage: true,
      type: "jpeg",
      quality: calidad,
      // Brecha en el teléfono pasa de 20.000 px: la captura de página entera tarda más que los 30 s por omisión.
      timeout: 120_000,
    });
  pares.push({ ...c, archivoV, archivoM });
  await ctx.close();
}

// Pasada de INTERACCIÓN (regla 22 b): cada control cambia algo, o el arnés queda en rojo.
const interacciones = [];
{
  const ctx = await navegador.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();
  // Un hash de TODO el HTML, no su longitud: cambiar de pestaña intercambia atributos del mismo largo
  // (`hidden`, `aria-pressed="true"`/`"false"`) y una huella por longitud lo daba por «no cambió nada».
  const huella = () =>
    page.evaluate(() =>
      [
        [...document.documentElement.outerHTML].reduce(
          (h, ch) => (h * 31 + ch.charCodeAt(0)) | 0,
          0,
        ),
        document.documentElement.getAttribute("data-theme"),
        document.documentElement.getAttribute("data-perfil"),
        location.pathname + location.hash,
        document.documentElement.lang,
      ].join("|"),
    );
  const probar = async (nombre, accion, espera) => {
    const antes = await huella();
    await accion();
    await page.waitForTimeout(300);
    const despues = await huella();
    const ok = antes !== despues && (espera ? await espera() : true);
    interacciones.push({ nombre, ok, antes, despues });
    if (!ok) fallas.push(`interacción «${nombre}»: no cambió nada`);
  };
  await M.interaccion({ page, probar });
  await ctx.close();
}

await navegador.close();
sVitrina.close();
sMaqueta.close();

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
if (!soloMedir) {
  const TEMA = { oscuro: "oscuro", claro: "claro" };
  const par = (p) =>
    `<section class="par" data-ancho="${p.ancho}" data-pantalla="${p.pantalla.clave}"><h2>${varias ? `${esc(p.pantalla.nombre)} · ` : ""}${p.ancho} px · ${TEMA[p.tema]} · ${p.idioma.toUpperCase()} · ${p.perfil === "experto" ? "experto" : "líder"}</h2><div class="lado"><figure><figcaption>Maqueta aprobada · <code>docs/${p.pantalla.maqueta}</code></figcaption><img loading="lazy" src="${p.archivoM}" alt="Maqueta ${esc(p.pantalla.nombre)} ${p.ancho} px ${p.tema} ${p.idioma} ${p.perfil}"></figure><figure><figcaption>Vitrina construida · <code>out${p.pantalla.ruta(p.idioma)}.html</code></figcaption><img loading="lazy" src="${p.archivoV}" alt="Vitrina ${esc(p.pantalla.nombre)} ${p.ancho} px ${p.tema} ${p.idioma} ${p.perfil}"></figure></div></section>`;
  const bloques = M.pantallas
    .map(
      (pt) =>
        `${varias ? `<h2 class="pantalla" id="${pt.clave}">${esc(pt.nombre)}</h2>` : ""}${pares
          .filter((p) => p.pantalla === pt)
          .map(par)
          .join("\n")}`,
    )
    .join("\n");
  const matriz = M.matriz
    .map((fila, i) => {
      const [pantalla, donde, hacer, ver] =
        fila.length === 4 ? fila : [M.pantallas[0].nombre, ...fila];
      return `<tr><td>${i + 1}</td><td>${esc(pantalla)}</td><td>${esc(donde)}</td><td>${esc(hacer)}</td><td>${esc(ver)}</td></tr>`;
    })
    .join("\n");
  const filtroPantallas = varias
    ? `<div class="filtros" role="group" aria-label="Filtrar por pantalla" data-eje="pantalla"><button type="button" aria-pressed="true" data-f="todos">Las ${M.pantallas.length}</button>${M.pantallas.map((pt) => `<button type="button" aria-pressed="false" data-f="${pt.clave}">${esc(pt.nombre)}</button>`).join("")}</div>`
    : "";
  const inter = interacciones
    .map((x) => `<li>${x.ok ? "✓" : "✕"} ${esc(x.nombre)}</li>`)
    .join("");
  const med = mediciones
    .map(
      (x) =>
        `<li>${x.desbordaDeLado || x.errores.length ? "✕" : "✓"} ${esc(x.que)} — ${x.desbordaDeLado ? "se desplaza de lado" : "sin desplazamiento lateral"} · fuentes ${x.fuentes.every(([, ok]) => ok) ? "cargadas" : "FALTAN"} · consola ${x.errores.length ? "con errores" : "limpia"}</li>`,
    )
    .join("");
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fidelidad · ${esc(M.titulo.es)}</title>
<style>
:root{color-scheme:dark;--fondo:#0b0c0f;--sup:#191b1d;--linea:#2c2e31;--t1:#eceff3;--t2:#b8bbbe}
body{margin:0;background:var(--fondo);color:var(--t1);font:15px/1.6 system-ui,sans-serif}
main{max-width:1500px;margin:0 auto;padding:24px 16px 64px}
h1{font-size:24px;margin:0 0 4px} h2{font-size:15px;margin:32px 0 8px;color:var(--t2);font-weight:600} h2.pantalla{font-size:20px;color:var(--t1);margin-top:48px;padding-top:16px;border-top:1px solid var(--linea)} a{color:var(--t1)}
p{color:var(--t2);max-width:80ch} code{font:12px ui-monospace,monospace}
.filtros{display:flex;gap:8px;margin:16px 0}.filtros button{font:inherit;font-size:13px;color:var(--t1);background:transparent;border:1px solid #75777b;border-radius:6px;padding:4px 10px;cursor:pointer}.filtros button[aria-pressed=true]{background:var(--t1);color:var(--fondo)}
.lado{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
.par[data-ancho="380"] .lado{grid-template-columns:repeat(2,minmax(0,400px));justify-content:start}
figure{margin:0}figcaption{font-size:12px;color:var(--t2);margin-bottom:6px}img{width:100%;height:auto;border:1px solid var(--linea);border-radius:6px;display:block}
table{border-collapse:collapse;width:100%;font-size:13px;margin-top:8px}th,td{border-top:1px solid var(--linea);padding:8px;text-align:left;vertical-align:top}th{color:var(--t2);font-weight:500}
ul{padding-left:20px;font-size:13px;color:var(--t2)}
@media (max-width:860px){.lado{grid-template-columns:1fr}}
</style>
</head>
<body>
<main>
<h1>${esc(M.pregunta)}</h1>
<p>${esc(M.titulo.es)}. A la izquierda, la maqueta aprobada (sin el cromo de la sala de diseño); a la derecha, la vitrina que se construyó en el sprint 2, capturada del export estático entrando por el índice. ${pares.length} pares: 380 px y escritorio × oscuro y claro × español e inglés, más dos como experto${varias ? " por pantalla" : ""}${pares.some((p) => p.pantalla.pares) ? `; además, ${pares.filter((p) => p.pantalla.pares).length} con un umbral movido` : ""}. <a href="#matriz">La matriz de qué mirar</a> está al pie.</p>
${filtroPantallas}
<div class="filtros" role="group" aria-label="Filtrar por ancho" data-eje="ancho"><button type="button" aria-pressed="true" data-f="todos">Todos</button><button type="button" aria-pressed="false" data-f="1280">Escritorio</button><button type="button" aria-pressed="false" data-f="380">Teléfono (380 px)</button></div>
${bloques}
<h2 id="matriz">Qué mirar y qué deberías ver</h2>
<table><thead><tr><th>#</th><th>Pantalla</th><th>Dónde</th><th>Qué hacer</th><th>Qué debe verse</th></tr></thead><tbody>
${matriz}
</tbody></table>
<h2>Mediciones del arnés</h2>
<ul>${med}</ul>
<h2>Pasada de interacción (regla 22)</h2>
<ul>${inter}</ul>
<p>Generado por <code>node scripts/capturar-vitrina.mjs --mirada ${mirada}</code> sobre el export de <code>pnpm build</code>. Las capturas se regeneran; no se editan a mano.</p>
</main>
<script>
var sel={ancho:"todos",pantalla:"todos"};document.querySelectorAll(".filtros").forEach(function(g){g.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;sel[g.dataset.eje]=b.dataset.f;g.querySelectorAll("button").forEach(function(x){x.setAttribute("aria-pressed",String(x===b))});document.querySelectorAll(".par").forEach(function(s){s.hidden=(sel.ancho!=="todos"&&s.dataset.ancho!==sel.ancho)||(sel.pantalla!=="todos"&&s.dataset.pantalla!==sel.pantalla)});document.querySelectorAll("h2.pantalla").forEach(function(h){h.hidden=sel.pantalla!=="todos"&&h.id!==sel.pantalla})})});
</script>
</body>
</html>
`;
  writeFileSync(join(destino, "index.html"), html);
}

console.log(
  `capturar-vitrina: ${pares.length} pares · ${mediciones.length} mediciones · ${interacciones.filter((x) => x.ok).length}/${interacciones.length} interacciones`,
);
for (const x of interacciones) console.log(`  ${x.ok ? "✓" : "✕"} ${x.nombre}`);
if (fallas.length) {
  console.error("capturar-vitrina: EN ROJO");
  for (const f of fallas) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("capturar-vitrina: verde");
