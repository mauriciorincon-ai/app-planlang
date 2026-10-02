/**
 * Los archivos que planlang entrega por las fichas, con su contenido exacto (JSON con sangría de 2 y salto final, como
 * los de hoja-de-vida). Antes de devolverlos, cada uno pasa su contrato: una ficha que hoja-de-vida rechazaría no se escribe.
 * - `content/agentes/planlang-demo-a.ficha-tecnica.json`: la ficha del agente A, en español (la que se copia);
 * - `docs/brochure-export.json`: los hechos de la app, en español (hoja-de-vida lo copia a su `content/vitrina/`);
 * - `docs/fichas/`: la versión en inglés de las dos, el complemento que planlang propone para la ficha de la app y la
 *   ficha de la app tal como la arma hoja-de-vida (en los dos idiomas), para comparar.
 */
import type { Idioma } from "@core/formatos/bilingue";
import type { HechosDelRepo } from "@/lib/datos/repo";
import type { DatosDemo } from "@/lib/datos/vitrina";
import {
  armarFichaApp,
  brochureExport,
  complementoPropuesto,
  fichaAgente,
} from "./armar";
import {
  problemasDelComplemento,
  problemasDeExport,
  problemasDeFicha,
} from "./contrato";

export const RUTA_FICHA_AGENTE =
  "content/agentes/planlang-demo-a.ficha-tecnica.json";
export const RUTA_EXPORT = "docs/brochure-export.json";

const json = (x: unknown) => `${JSON.stringify(x, null, 2)}\n`;

function exigir(ruta: string, problemas: string[]) {
  if (problemas.length)
    throw new Error(
      `fichas: ${ruta} no cumple su contrato:\n  - ${problemas.join("\n  - ")}`,
    );
}

export function archivosDeFichas(
  d: DatosDemo,
  repo: HechosDelRepo,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of ["es", "en"] as Idioma[]) {
    const sufijo = i === "es" ? "" : ".en";
    const agente = fichaAgente(d, repo, i);
    const exp = brochureExport(d, repo, i);
    const comp = complementoPropuesto(d, i);
    const app = armarFichaApp(exp, comp);
    const rutaAgente =
      i === "es"
        ? RUTA_FICHA_AGENTE
        : "docs/fichas/planlang-demo-a.ficha-tecnica.en.json";
    const rutaExport =
      i === "es" ? RUTA_EXPORT : "docs/fichas/brochure-export.en.json";
    const rutaApp = `docs/fichas/planlang.ficha-tecnica${sufijo}.json`;
    exigir(rutaAgente, problemasDeFicha(agente));
    exigir(rutaExport, problemasDeExport(exp));
    exigir(rutaApp, problemasDeFicha(app));
    const rutaComp = `docs/fichas/planlang.complemento-propuesto${sufijo}.json`;
    exigir(rutaComp, problemasDelComplemento(comp));
    out[rutaAgente] = json(agente);
    out[rutaExport] = json(exp);
    out[rutaComp] = json(comp);
    out[rutaApp] = json(app);
  }
  return out;
}
