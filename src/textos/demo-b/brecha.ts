/**
 * La copia propia del demo B en P4 Brecha: las lecturas de sus supuestos y el nombre de sus nodos en una frase. Vive
 * aparte para que la guardia «copia contra plan» la lea contra el plan B (los ids de los dos planes se cruzan).
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";
import type { LecturaDeFalla } from "../brecha";

type Plantilla<P> = (p: P) => TextoBilingue;

export const LECTURA_SUPUESTO_B: Record<string, LecturaDeFalla> = {
  "S2:refutado": {
    frase: tb(
      "repartir el trabajo entre el extractor y el investigador resultó un poco más lento que un solo agente (S2)",
      "splitting the work between the extractor and the investigator turned out a little slower than a single agent (S2)",
    ),
    titulo: tb(
      "Varios agentes frente a uno solo",
      "Several agents against one",
    ),
    planeo: tb(
      "El extractor y el investigador de contexto, cada uno con su llamada, no rinden peor que un solo agente con un presupuesto no mayor.",
      "The extractor and the context investigator, each with its own call, do no worse than a single agent on no larger a budget.",
    ),
    significa: tb(
      "Los dos aciertan igual y el multiagente tarda un poco más en la mediana; el plan solo tolera la misma demora. Además, la línea base gastó más: para decidir con justicia hay que repetir la comparación con el presupuesto igualado.",
      "Both get the same cases right and the multi-agent takes a little longer at the median; the plan only tolerates the same delay. Also, the baseline spent more: a fair decision needs the comparison rerun with a matched budget.",
    ),
  },
};

export const NODO_EN_FRASE_B: Record<string, TextoBilingue> = {
  enrutador: tb("la guardia de entrada", "the input guard"),
  extractor: tb("el extractor", "the extractor"),
  verificador_listas: tb("el verificador de listas", "the watch-list checker"),
  investigador: tb("el investigador de contexto", "the context investigator"),
  puntaje: tb("el nodo de puntaje", "the scoring node"),
  decision: tb("el nodo de decisión", "the decision node"),
  pausa_humana: tb("la pausa humana", "the human pause"),
  redactor: tb("el redactor del expediente", "the file writer"),
  guardia_salida: tb("la guardia de salida", "the output guard"),
};

/** La lectura llana de lo que salió de cada supuesto del B, por id y estado. */
export const DIO_SUPUESTO_B = {
  "S1:confirmado": ((p: { n: number; a: number }) =>
    tb(
      p.n === 1
        ? `El único homónimo de la zona gris llegó al investigador de contexto, y lo resolvió bien: no era la persona de la lista. Con un solo caso, la medida orienta pero no prueba.`
        : `De los ${p.n} homónimos de la zona gris que llegaron al investigador de contexto, resolvió bien ${p.a}.`,
      p.n === 1
        ? `The only look-alike name in the grey zone reached the context investigator, which got it right: it was not the listed person. With a single case, the measure points the way but does not prove it.`
        : `Of the ${p.n} look-alike names in the grey zone that reached the context investigator, it got ${p.a} right.`,
    )) as Plantilla<{ n: number; a: number }>,
  "S2:refutado": ((p: {
    exactitud: string;
    exactitudBase: string;
    latencia: string;
    latenciaBase: string;
  }) =>
    tb(
      `El plan suponía que el extractor y el investigador, por separado, no rendirían peor que un solo agente. Acertaron igual (${p.exactitud} frente a ${p.exactitudBase}) pero tardaron un poco más (${p.latencia} frente a ${p.latenciaBase}), y el plan solo tolera la misma demora: refutado.`,
      `The plan assumed that the extractor and the investigator, kept apart, would do no worse than a single agent. They got the same right (${p.exactitud} against ${p.exactitudBase}) but took a little longer (${p.latencia} against ${p.latenciaBase}), and the plan only tolerates the same delay: refuted.`,
    )) as Plantilla<{
    exactitud: string;
    exactitudBase: string;
    latencia: string;
    latenciaBase: string;
  }>,
} as Record<string, (p: never) => TextoBilingue>;
