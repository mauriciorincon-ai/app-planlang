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
 * Con `--a 1.2`, la enmienda v1.1 → v1.2 (solo medición: R5, S1, S2; gate de la fase 4 del S1),
 * que parte del v1.1 aprobado y lo deja intacto. Con `--a 1.3`, la enmienda v1.2 → v1.3 del S2 (medición y redacción
 * bilingüe; umbrales y contrato de grafo intactos). Con `--a 1.4`, la enmienda v1.3 → v1.4 del S2 (AU-9: arista de
 * respaldo a la pausa humana sin proveedor; cambia el contrato de grafo).
 * Uso: `pnpm tsx scripts/enmendar-plan-demo-a.ts [--a 1.2|1.3|1.4] --por <nombre> --el <YYYY-MM-DD>`
 */
import { aprobarPlan, cargarPlan } from "../core/plan";
import {
  enmendar,
  enmendarAV12,
  enmendarAV13,
  enmendarAV14,
} from "./enmienda-plan-demo-a";
import { argumentos, escribirJson, leerJson } from "./_io";

const ENMIENDAS = {
  "1.1": {
    entrada: "plans/demo-a/v1.json",
    salida: "plans/demo-a/v1.1.json",
    f: enmendar,
  },
  "1.2": {
    entrada: "plans/demo-a/v1.1.json",
    salida: "plans/demo-a/v1.2.json",
    f: enmendarAV12,
  },
  "1.3": {
    entrada: "plans/demo-a/v1.2.json",
    salida: "plans/demo-a/v1.3.json",
    f: enmendarAV13,
  },
  "1.4": {
    entrada: "plans/demo-a/v1.3.json",
    salida: "plans/demo-a/v1.4.json",
    f: enmendarAV14,
  },
} as const;

async function main(): Promise<number> {
  const args = argumentos(process.argv.slice(2));
  if (typeof args.por !== "string" || typeof args.el !== "string") {
    console.error("uso: enmendar-plan-demo-a --por <nombre> --el <YYYY-MM-DD>");
    return 2;
  }
  const a =
    args.a === "1.4" || args.a === "1.3" || args.a === "1.2" ? args.a : "1.1";
  const { entrada: ENTRADA, salida: SALIDA, f } = ENMIENDAS[a];
  const previo = await cargarPlan(leerJson(ENTRADA));
  if (!previo.ok) throw new Error(`${ENTRADA} no carga`);
  const r = await aprobarPlan(f(previo.plan), {
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
