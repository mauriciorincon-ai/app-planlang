/**
 * Sella el plan de beneficios v2.0.0 del demo A (`scripts/enmienda-plan-beneficios-demo-a.ts`) contra el U2 del plan
 * v1.4 aprobado. Uso: `pnpm tsx scripts/enmendar-plan-beneficios-demo-a.ts`.
 */
import { conHuella } from "../core/formatos/huella";
import type { JsonValor } from "../core/formatos/jcs";
import type { Plan } from "../core/plan";
import { PlanBeneficiosSchema } from "../core/sintetico/esquema";
import { umbralesDelPlan } from "../core/sintetico/generador";
import { enmendarPlanBeneficiosV2 } from "./enmienda-plan-beneficios-demo-a";
import { escribirJson, leerJson } from "./_io";

export const PB_V1 = "data/plan-beneficios/demo-a.json";
export const PB_V2 = "data/plan-beneficios/demo-a-v2.json";
export const PLAN_DEL_U2 = "plans/demo-a/v1.4.json";

async function main(): Promise<number> {
  const v1 = PlanBeneficiosSchema.parse(leerJson(PB_V1));
  const { U2 } = umbralesDelPlan(leerJson(PLAN_DEL_U2) as unknown as Plan);
  const sellado = await conHuella(
    enmendarPlanBeneficiosV2(v1, U2) as unknown as Record<string, JsonValor>,
  );
  const v2 = PlanBeneficiosSchema.parse(sellado);
  escribirJson(PB_V2, v2 as unknown as JsonValor);
  const topes = v2.procedimientos.filter((p) => p.tope_cobertura != null);
  console.log(
    `OK ${PB_V2} · v${v2.version} · ${topes.length} topes · huella ${v2.huella}`,
  );
  return 0;
}

main().then((c) => process.exit(c));
