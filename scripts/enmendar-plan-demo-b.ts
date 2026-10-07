/**
 * Enmienda v1 → v1.1 del plan del demo B (decisión del usuario en la fase 3 del S3, 2026-10-04: «v1.1 con los tres»):
 * redacción bilingüe de los textos que el v1 traía solo en español, S1 con una clave que el verificador decide y S2 con
 * la comparación contra la línea base de agente único. Parte del v1 APROBADO, que queda intacto como historia.
 * Uso: `pnpm tsx scripts/enmendar-plan-demo-b.ts --por <nombre> --el <YYYY-MM-DD>`
 */
import { aprobarPlan, cargarPlan, mismaVerdad } from "../core/plan";
import { enmendarBV11 } from "./enmienda-plan-demo-b";
import { argumentos, escribirJson, leerJson } from "./_io";

const ENTRADA = "plans/demo-b/v1.json";
const SALIDA = "plans/demo-b/v1.1.json";

async function main(): Promise<number> {
  const args = argumentos(process.argv.slice(2));
  if (typeof args.por !== "string" || typeof args.el !== "string") {
    console.error("uso: enmendar-plan-demo-b --por <nombre> --el <YYYY-MM-DD>");
    return 2;
  }
  const bruto = leerJson(ENTRADA);
  const previo = await cargarPlan(bruto);
  if (!previo.ok) throw new Error(`${ENTRADA} no carga`);
  const r = await aprobarPlan(enmendarBV11(previo.plan), {
    por: args.por,
    el: args.el,
  });
  if (!r.ok) {
    for (const m of r.motivos)
      console.error(`[${m.codigo}] ${m.elemento}: ${m.mensaje.es}`);
    return 1;
  }
  if (!mismaVerdad(bruto, r.plan)) {
    console.error("la v1.1 cambia umbrales o contrato de grafo: no es una enmienda de medición");
    return 1;
  }
  escribirJson(SALIDA, r.plan as never);
  console.log(`OK ${SALIDA} · v${r.plan.version} · huella ${r.plan.huella}`);
  return 0;
}

main().then((c) => process.exit(c));
