/**
 * Veredicto global (RF-06.7), con sus motivos a la vista:
 * - `no_cumple`: falla un criterio absoluto, ocurre un riesgo de severidad ≥ 9 o el contrato de grafo
 *   tiene un hallazgo bloqueante (el agente no es el que el plan describe);
 * - `cumple_con_alertas`: falla o queda incompleto un criterio de tasa/latencia/costo, un absoluto queda
 *   sin medir o indeterminado, un supuesto se refuta, ocurre otro riesgo, hay brechas no previstas o
 *   una regla del plan está mal formada;
 * - `cumple`: nada de lo anterior.
 */
import type { TextoBilingue } from "../formatos/bilingue";
import type { BrechaNoPrevista } from "./brechas-no-previstas";
import type { ResultadoContrato } from "./contrato-grafo";
import type { ResultadoCriterio } from "./criterios";
import type { ResultadoRiesgo } from "./detectores";
import type { ResultadoSupuesto } from "./supuestos";

export type Veredicto = "cumple" | "cumple_con_alertas" | "no_cumple";

export const SEVERIDAD_BLOQUEANTE = 9;

export interface ResultadoVeredicto {
  valor: Veredicto;
  bloqueantes: TextoBilingue[];
  alertas: TextoBilingue[];
}

export function veredicto(
  criterios: readonly ResultadoCriterio[],
  riesgos: readonly ResultadoRiesgo[],
  supuestos: readonly ResultadoSupuesto[],
  contrato: ResultadoContrato,
  brechas: readonly BrechaNoPrevista[],
): ResultadoVeredicto {
  const bloqueantes: TextoBilingue[] = [];
  const alertas: TextoBilingue[] = [];
  for (const c of criterios) {
    const absoluto = c.tipo === "absoluto";
    if (c.estado === "incumple" && absoluto)
      bloqueantes.push({
        es: `${c.id}: criterio absoluto incumplido.`,
        en: `${c.id}: absolute criterion not met.`,
      });
    else if (c.estado === "incumple")
      alertas.push({
        es: `${c.id}: criterio incumplido.`,
        en: `${c.id}: criterion not met.`,
      });
    else if (c.estado === "incompleto")
      alertas.push({
        es: `${c.id}: medido con menos corridas de las exigidas.`,
        en: `${c.id}: measured with fewer runs than required.`,
      });
    else if (c.estado === "indeterminado")
      alertas.push({
        es: `${c.id}: hay casos que no se pudieron evaluar.`,
        en: `${c.id}: some cases could not be evaluated.`,
      });
    else if (c.estado === "sin_poblacion")
      alertas.push({
        es: `${c.id}: ningún caso del lote lo puso a prueba.`,
        en: `${c.id}: no case in the batch put it to the test.`,
      });
    else if (c.estado === "mal_formado")
      alertas.push({
        es: `${c.id}: su regla de medición está mal formada.`,
        en: `${c.id}: its measurement rule is malformed.`,
      });
  }
  for (const r of riesgos) {
    if (r.estado === "ocurrio" && r.severidad >= SEVERIDAD_BLOQUEANTE)
      bloqueantes.push({
        es: `${r.id}: ocurrió un riesgo de severidad ${r.severidad}.`,
        en: `${r.id}: a severity ${r.severidad} risk occurred.`,
      });
    else if (r.estado === "ocurrio")
      alertas.push({
        es: `${r.id}: el riesgo ocurrió.`,
        en: `${r.id}: the risk occurred.`,
      });
    else if (r.estado === "mal_formado")
      alertas.push({
        es: `${r.id}: su detector está mal formado; el riesgo no se midió.`,
        en: `${r.id}: its detector is malformed; the risk was not measured.`,
      });
    else if (r.estado === "indeterminado")
      alertas.push({
        es: `${r.id}: hay casos que el detector no pudo evaluar.`,
        en: `${r.id}: some cases could not be evaluated by the detector.`,
      });
  }
  for (const s of supuestos)
    if (s.estado === "refutado")
      alertas.push({
        es: `${s.id}: supuesto refutado.`,
        en: `${s.id}: assumption refuted.`,
      });
  const bloqueContrato = contrato.hallazgos.filter(
    (h) => h.severidad === "bloqueante",
  );
  if (bloqueContrato.length > 0)
    bloqueantes.push({
      es: `Contrato de grafo: ${bloqueContrato.length} hallazgo(s) bloqueante(s).`,
      en: `Graph contract: ${bloqueContrato.length} blocking finding(s).`,
    });
  if (brechas.length > 0)
    alertas.push({
      es: `${brechas.length} brecha(s) no prevista(s) por el plan.`,
      en: `${brechas.length} gap(s) the plan did not foresee.`,
    });
  return {
    valor:
      bloqueantes.length > 0
        ? "no_cumple"
        : alertas.length > 0
          ? "cumple_con_alertas"
          : "cumple",
    bloqueantes,
    alertas,
  };
}
