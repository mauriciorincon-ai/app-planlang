/**
 * Los archivos que planlang entrega por las fichas, con su contenido exacto (JSON con sangría de 2 y salto final, como
 * los de hoja-de-vida). Antes de devolverlos, cada uno pasa su contrato: una ficha que hoja-de-vida rechazaría no se escribe.
 * - `docs/brochure-export.json`: los hechos de la app, que cuentan los dos demos, en español (hoja-de-vida lo copia a
 *   su `content/vitrina/`);
 * - `docs/fichas/`: la versión en inglés del export, el complemento que planlang propone para la ficha de la app y la
 *   ficha de la app tal como la arma hoja-de-vida (en los dos idiomas), para comparar;
 * - `docs/cv-viva/complemento.yaml`: el mismo complemento en YAML, en español, para CV Viva (S8, devolución 026).
 * Las fichas de los agentes A y B ya no se producen (decisión del 2026-10-25).
 */
import { IDIOMAS } from "@core/formatos/bilingue";
import type { HechosDelRepo } from "@/lib/datos/repo";
import type { DatosDeLosDemos } from "@/lib/datos/vitrina";
import { armarFichaApp, brochureExport, complementoPropuesto } from "./armar";
import {
  problemasDelComplemento,
  problemasDeExport,
  problemasDeFicha,
} from "./contrato";
import { RUTA_COMPLEMENTO, RUTA_COMPLEMENTO_YAML, RUTA_EXPORT } from "./rutas";
import { fusionarComplemento } from "./yaml-complemento";

export { RUTA_EXPORT };

const json = (x: unknown) => `${JSON.stringify(x, null, 2)}\n`;

function exigir(ruta: string, problemas: string[]) {
  if (problemas.length)
    throw new Error(
      `fichas: ${ruta} no cumple su contrato:\n  - ${problemas.join("\n  - ")}`,
    );
}

export function archivosDeFichas(
  ds: DatosDeLosDemos,
  repo: HechosDelRepo,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of IDIOMAS) {
    const sufijo = i === "es" ? "" : ".en";
    const exp = brochureExport(ds, repo, i);
    const comp = complementoPropuesto(ds, i);
    const app = armarFichaApp(exp, comp);
    const rutaExport =
      i === "es" ? RUTA_EXPORT : "docs/fichas/brochure-export.en.json";
    const rutaApp = `docs/fichas/planlang.ficha-tecnica${sufijo}.json`;
    exigir(rutaExport, problemasDeExport(exp));
    exigir(rutaApp, problemasDeFicha(app));
    const rutaComp =
      i === "es"
        ? RUTA_COMPLEMENTO
        : RUTA_COMPLEMENTO.replace(/\.json$/, ".en.json");
    exigir(rutaComp, problemasDelComplemento(comp));
    out[rutaExport] = json(exp);
    out[rutaComp] = json(comp);
    out[rutaApp] = json(app);
    if (i === "es")
      out[RUTA_COMPLEMENTO_YAML] = fusionarComplemento(
        comp as unknown as Record<string, unknown>,
        null,
      ).yaml;
  }
  return out;
}
