/**
 * Los archivos que planlang entrega por las fichas, con su contenido exacto (JSON con sangría de 2 y salto final, como
 * los de hoja-de-vida). Antes de devolverlos, cada uno pasa su contrato: una ficha que hoja-de-vida rechazaría no se escribe.
 * - `content/agentes/planlang-demo-a.ficha-tecnica.json` y `planlang-demo-b.ficha-tecnica.json`: la ficha de cada
 *   agente, en español (las que se copian);
 * - `docs/brochure-export.json`: los hechos de la app, que cuentan los dos demos, en español (hoja-de-vida lo copia a
 *   su `content/vitrina/`);
 * - `docs/fichas/`: la versión en inglés de cada una, el complemento que planlang propone para la ficha de la app y la
 *   ficha de la app tal como la arma hoja-de-vida (en los dos idiomas), para comparar.
 */
import { IDIOMAS } from "@core/formatos/bilingue";
import { DEMOS } from "@/lib/demos";
import type { HechosDelRepo } from "@/lib/datos/repo";
import type { DatosDeLosDemos } from "@/lib/datos/vitrina";
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

import {
  RUTA_COMPLEMENTO,
  RUTA_EXPORT,
  RUTA_FICHA_AGENTE,
  RUTA_FICHA_AGENTE_EN,
  SLUG_AGENTE,
} from "./rutas";

export { RUTA_EXPORT, RUTA_FICHA_AGENTE };

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
    for (const demo of DEMOS) {
      const agente = fichaAgente(ds[demo], repo, i);
      const ruta = (i === "es" ? RUTA_FICHA_AGENTE : RUTA_FICHA_AGENTE_EN)[
        demo
      ];
      // La ruta la pone el slug: una ficha con el slug de otro demo se copiaría encima de la suya.
      if (agente.pieza.slug !== SLUG_AGENTE[demo])
        throw new Error(
          `fichas: la ficha del agente de ${demo} dice slug «${agente.pieza.slug}» y su ruta es la de «${SLUG_AGENTE[demo]}».`,
        );
      exigir(ruta, problemasDeFicha(agente));
      out[ruta] = json(agente);
    }
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
  }
  return out;
}
