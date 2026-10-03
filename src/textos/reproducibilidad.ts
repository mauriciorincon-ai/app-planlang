/**
 * Los rótulos de la ficha de reproducibilidad, que se pinta en dos sitios: la sección 9 de P4 Brecha y la sección 1 de
 * P7 Fichas (maquetas `04-brecha.html` y `07-fichas.html`). Las filas las arma `src/lib/vista/reproducibilidad.ts`.
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";

type Plantilla<P> = (p: P) => TextoBilingue;

export const REPRODUCIBILIDAD = {
  plan: tb("Plan", "Plan"),
  planConQueCorrio: tb("Plan con que corrió", "Plan it ran with"),
  casos: tb("Casos", "Cases"),
  corrida: tb("Corrida", "Run"),
  grafo: tb("Grafo", "Graph"),
  grafoCompilado: tb("Grafo compilado", "Compiled graph"),
  repeticion: tb("Repetición", "Repetition"),
  lineaBase: tb("Línea base", "Baseline"),
  entorno: tb("Entorno", "Environment"),
  ejecucion: tb("Ejecución", "Execution"),
  umbrales: tb("Umbrales aplicados", "Applied thresholds"),
  revision: tb("Revisión humana", "Human review"),
  verificador: tb("Verificador", "Verifier"),
  huellaEste: tb("Huella de este informe", "This report’s fingerprint"),
  huellaDel: tb("Huella del informe", "The report’s fingerprint"),
  semilla: tb("semilla", "seed"),
  suscripcion: tb("suscripción", "subscription"),
  ejecucionValor: ((p: {
    sesiones: number;
    casos: number;
    errores: number;
    limites: number;
  }) =>
    tb(
      `${p.sesiones} ${p.sesiones === 1 ? "sesión" : "sesiones"} · ${p.casos} casos · ${p.errores} errores del proveedor · ${p.limites} límites de uso`,
      `${p.sesiones} ${p.sesiones === 1 ? "session" : "sessions"} · ${p.casos} cases · ${p.errores} provider errors · ${p.limites} usage limits`,
    )) as Plantilla<{
    sesiones: number;
    casos: number;
    errores: number;
    limites: number;
  }>,
  losDelPlan: tb("los del plan", "the plan’s"),
  distintosDelPlan: tb(
    "distintos de los del plan",
    "different from the plan’s",
  ),
};
