/**
 * Textos del recorrido animado de un caso (S10, contrato del diagramador 0.5.0 § 3.5 y § 4.3): el lienzo del agente
 * con el nodo de cada paso encendido, sus controles, el texto equivalente (G10) y el contrafactual del umbral. Lo que
 * cambia de un caso a otro (el nodo, la regla, el valor que cambiaría la rama) se arma con plantillas desde la traza
 * y el compacto del playground: ningún paso lleva texto escrito a mano.
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";

type Plantilla<P> = (p: P) => TextoBilingue;

export const CAMINA = {
  titulo: tb("El caso camina por el grafo", "The case walks the graph"),
  chip: tb(
    "real · la traza de este caso sobre el lienzo del agente",
    "real · this case’s trace on the agent’s canvas",
  ),
  lectura: tb(
    "Cada paso enciende el nodo por donde pasó este caso, en el orden de su traza. Donde una regla lee un umbral del plan, el panel dice con qué valor habría tomado otra rama; lo calcula el mismo intérprete del playground.",
    "Each step lights up the node this case went through, in the order of its trace. Where a rule reads a plan threshold, the panel says which value would have sent it down another branch; the playground’s own interpreter works it out.",
  ),
  svgTitulo: ((p: { caso: string; demo: string }) =>
    tb(
      `Recorrido del caso ${p.caso} sobre el grafo de ${p.demo}`,
      `Walkthrough of case ${p.caso} on the ${p.demo} graph`,
    )) as Plantilla<{ caso: string; demo: string }>,
  svgDescripcion: tb(
    "El lienzo del agente con el nodo del paso actual resaltado y los ya recorridos con filete discontinuo; el recorrido en texto sigue al diagrama.",
    "The agent’s canvas with the current step’s node highlighted and the ones already walked with a dashed border; the walkthrough in text follows the diagram.",
  ),
  region: tb(
    "Lienzo del recorrido (se desliza de lado)",
    "Walkthrough canvas (scrolls sideways)",
  ),
  indice: tb("Capas:", "Layers:"),
  irACapa: tb("Ir a la capa", "Go to layer"),
  saltar: tb("Saltar el diagrama", "Skip the diagram"),
  controles: tb("Controles del recorrido", "Walkthrough controls"),
  anterior: tb("Paso anterior", "Previous step"),
  siguiente: tb("Paso siguiente", "Next step"),
  reproducir: tb("Reproducir", "Play"),
  pausar: tb("Pausar", "Pause"),
  teclado: tb(
    "También con las flechas ← → del teclado.",
    "Also with the ← → arrow keys.",
  ),
  posicion: ((p: { k: number; n: number; nodo: string }) =>
    tb(
      `Paso ${p.k} de ${p.n}: ${p.nodo}`,
      `Step ${p.k} of ${p.n}: ${p.nodo}`,
    )) as Plantilla<{ k: number; n: number; nodo: string }>,
  equivalente: tb("El recorrido en texto", "The walkthrough in text"),
  leyenda: {
    activo: tb("● en este paso", "● at this step"),
    visitado: tb("◌ ya recorrido", "◌ already walked"),
    pendiente: tb("○ aún no", "○ not yet"),
  },
  paso: ((p: { k: number }) => tb(`Paso ${p.k}`, `Step ${p.k}`)) as Plantilla<{
    k: number;
  }>,
  pausa: ((p: { rol: string; decision: string }) =>
    tb(
      `Pausa humana: ${p.rol} decidió «${p.decision}» (revisor simulado que sigue la verdad conocida del lote).`,
      `Human pause: ${p.rol} decided “${p.decision}” (a simulated reviewer that follows the batch’s known truth).`,
    )) as Plantilla<{ rol: string; decision: string }>,
  contrafactual: tb("¿Y con otro umbral?", "What about another threshold?"),
} as const;

/** El contrafactual de un umbral en un paso (P15: lo que pasaría después de la rama nueva no se observó). */
export const CONTRAFACTUAL = {
  cambia: ((p: {
    umbral: string;
    nombre: string;
    valor: string;
    plan: string;
    rama: string;
    desenlace: "persona" | "solo" | "no_observado";
  }) => {
    const destino = {
      persona: [
        ", un camino que lleva a una persona",
        ", a path that leads to a person",
      ],
      solo: [
        ", un camino que termina sin persona",
        ", a path that ends without a person",
      ],
      no_observado: [
        ", donde decide otro nodo que esta traza no registró",
        ", where another node decides that this trace did not record",
      ],
    }[p.desenlace];
    return tb(
      `Con ${p.umbral} (${p.nombre}) en ${p.valor} —el plan dice ${p.plan}— este caso habría ido a «${p.rama}» en este paso${destino[0]}. Lo que habría pasado después no se observó.`,
      `With ${p.umbral} (${p.nombre}) at ${p.valor} —the plan says ${p.plan}— this case would have gone to “${p.rama}” at this step${destino[1]}. What would have happened next was not observed.`,
    );
  }) as Plantilla<{
    umbral: string;
    nombre: string;
    valor: string;
    plan: string;
    rama: string;
    desenlace: "persona" | "solo" | "no_observado";
  }>,
  seSeparaAntes: ((p: { umbral: string; valor: string; paso: number }) =>
    tb(
      `No observado: el valor de ${p.umbral} más cercano que cambia algo (${p.valor}) separa el caso antes, en el paso ${p.paso}; con él, a este paso no se llega.`,
      `Not observed: the nearest ${p.umbral} value that changes anything (${p.valor}) splits the case earlier, at step ${p.paso}; with it, this step is never reached.`,
    )) as Plantilla<{ umbral: string; valor: string; paso: number }>,
  sinValor: ((p: { umbral: string; nombre: string }) =>
    tb(
      `No observado: ningún valor jugable de ${p.umbral} (${p.nombre}) cambia la rama de este paso.`,
      `Not observed: no playable value of ${p.umbral} (${p.nombre}) changes this step’s branch.`,
    )) as Plantilla<{ umbral: string; nombre: string }>,
  sinUmbral: tb(
    "Las reglas de este nodo comparan con valores fijos del plan, no con un umbral: no hay valor que mover.",
    "This node’s rules compare against fixed plan values, not a threshold: there is no value to move.",
  ),
  probar: ((p: { umbral: string; valor: string }) =>
    tb(
      `Probar ${p.umbral} = ${p.valor} en el playground`,
      `Try ${p.umbral} = ${p.valor} in the playground`,
    )) as Plantilla<{ umbral: string; valor: string }>,
} as const;

/** El enlace al recorrido desde las trazas del visor del agente, junto a «Ver caso». */
export const RECORRER = tb("Recorrer", "Walk through");
