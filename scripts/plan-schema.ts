/**
 * Genera `core/plan/plan.schema.json` (JSON Schema 2020-12) desde los esquemas Zod. Un test de frescura
 * comprueba que el archivo versionado coincide con lo que Zod produce hoy.
 * Uso: `pnpm tsx scripts/plan-schema.ts`
 */
import { jsonSchemaDelPlan } from "../core/plan";
import { escribirJson } from "./_io";

escribirJson("core/plan/plan.schema.json", jsonSchemaDelPlan() as never);
console.log("core/plan/plan.schema.json regenerado");
