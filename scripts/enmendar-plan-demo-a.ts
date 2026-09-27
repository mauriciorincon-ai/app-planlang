/**
 * Enmienda v1 → v1.1 del plan del demo A (aprobada por el usuario en el chat del builder, fase 3 del
 * S1). Parte del v1 APROBADO (que queda intacto como historia) y aplica un solo cambio con sus
 * consecuencias mecánicas:
 *   1. Arista nueva del enrutador: `servicio_exento · igual_a · true → redactor` (orden 2). Sin ella,
 *      C4 y R6 fallaban por diseño del plan: el grafo v1 solo sacaba del flujo las urgencias.
 *   2. Con dos aristas, el enrutador declara su rama por defecto (`extractor`) y su primera arista
 *      deja de llevar `si_falso` (el validador prohíbe ambas cosas a la vez).
 *   3. `servicio_exento` pasa a señal obligatoria en la traza.
 *   4. El paso 2 del flujo objetivo lo dice en ES y EN.
 * Uso: `pnpm tsx scripts/enmendar-plan-demo-a.ts --por <nombre> --el <YYYY-MM-DD>`
 */
import { aprobarPlan, cargarPlan } from "../core/plan";
import { enmendar } from "./enmienda-plan-demo-a";
import { argumentos, escribirJson, leerJson } from "./_io";

const ENTRADA = "plans/demo-a/v1.json";
const SALIDA = "plans/demo-a/v1.1.json";

async function main(): Promise<number> {
  const args = argumentos(process.argv.slice(2));
  if (typeof args.por !== "string" || typeof args.el !== "string") {
    console.error("uso: enmendar-plan-demo-a --por <nombre> --el <YYYY-MM-DD>");
    return 2;
  }
  const v1 = await cargarPlan(leerJson(ENTRADA));
  if (!v1.ok) throw new Error("el v1 no carga");
  const r = await aprobarPlan(enmendar(v1.plan), {
    por: args.por,
    el: args.el,
  });
  if (!r.ok) {
    for (const m of r.motivos)
      console.error(`[${m.codigo}] ${m.elemento}: ${m.mensaje.es}`);
    return 1;
  }
  escribirJson(SALIDA, r.plan as never);
  console.log(`OK ${SALIDA} · v${r.plan.version} · huella ${r.plan.huella}`);
  return 0;
}

main().then((c) => process.exit(c));
