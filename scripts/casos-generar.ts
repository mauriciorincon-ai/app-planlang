/**
 * `pnpm casos:generar --semilla <s> --n <n> [--receta estandar|humo] [--plan <plan.json>]
 *                    [--beneficios <plan-beneficios.json>] [--salida <ruta>]`
 * `pnpm casos:generar --versionados` regenera los lotes versionados de `data/casos/demo-a/`.
 * `pnpm casos:generar --versionados --demo b` regenera las listas de `data/listas/demo-b.json` y los lotes del B.
 *
 * Carga el plan aprobado y el plan de beneficios verificando sus huellas, genera el lote (M3),
 * corre el validador de identificadores (E-11) y solo escribe si no hay hallazgos.
 */
import type { JsonValor } from "../core/formatos/jcs";
import { verificarHuella } from "../core/formatos/huella";
import { cargarPlan } from "../core/plan";
import {
  generarListas,
  generarLote,
  generarLoteB,
  PlanBeneficiosSchema,
  validarIdentificadores,
  type Lote,
  type LoteB,
} from "../core/sintetico";
import { argumentos, escribirJson, escribirTexto, leerJson } from "./_io";
import {
  LISTAS_DEMO_B,
  LOTES_VERSIONADOS,
  LOTES_VERSIONADOS_B,
  markdownAfirmacion,
  PLAN_DEMO_B,
  RUTA_AFIRMACION_B,
  rutaDeLoteB,
  PLAN_BENEFICIOS_DEMO_A,
  PLAN_DEMO_A,
  RUTA_AFIRMACION,
  rutaDeLote,
} from "./lotes-versionados";

async function entradas(rutaPlan: string, rutaBeneficios: string) {
  const plan = await cargarPlan(leerJson(rutaPlan));
  if (!plan.ok)
    throw new Error(
      `plan rechazado: ${plan.motivos.map((m) => m.codigo).join(", ")}`,
    );
  const crudo = leerJson(rutaBeneficios) as Record<string, JsonValor>;
  const v = await verificarHuella(crudo);
  if (!v.ok) throw new Error(`huella del plan de beneficios: ${v.motivo}`);
  return { plan: plan.plan, planBeneficios: PlanBeneficiosSchema.parse(crudo) };
}

function escribirSiLimpio(ruta: string, lote: Lote | LoteB): boolean {
  const hallazgos = validarIdentificadores(lote);
  if (hallazgos.length > 0) {
    console.error(
      `NO SE ESCRIBE ${ruta}: ${hallazgos.length} identificadores con formato real`,
    );
    for (const h of hallazgos.slice(0, 10))
      console.error(`  [${h.regla}] ${h.ruta}: ${h.fragmento}`);
    return false;
  }
  escribirJson(ruta, lote as unknown as JsonValor);
  console.log(
    `OK ${ruta} · ${lote.n} casos · ${JSON.stringify(lote.composicion.por_tipo)} · huella ${lote.huella}`,
  );
  return true;
}

/** Demo B: las listas primero (los lotes las citan por huella), luego cada lote, todo solo si sale limpio. */
async function versionadosB(): Promise<number> {
  const plan = await cargarPlan(leerJson(PLAN_DEMO_B));
  if (!plan.ok)
    throw new Error(
      `plan B rechazado: ${plan.motivos.map((m) => m.codigo).join(", ")}`,
    );
  const listas = await generarListas();
  const hallazgos = validarIdentificadores(listas);
  if (hallazgos.length > 0) {
    console.error(
      `NO SE ESCRIBE ${LISTAS_DEMO_B}: ${hallazgos.length} hallazgos`,
    );
    return 1;
  }
  escribirJson(LISTAS_DEMO_B, listas as unknown as JsonValor);
  console.log(`OK ${LISTAS_DEMO_B} · huella ${listas.huella}`);
  let ok = true;
  const lotes: LoteB[] = [];
  for (const l of LOTES_VERSIONADOS_B) {
    const lote = await generarLoteB({
      plan: plan.plan,
      listas,
      semilla: l.semilla,
      n: l.n,
      receta: l.receta,
    });
    ok = escribirSiLimpio(rutaDeLoteB(l.semilla, l.n), lote) && ok;
    lotes.push(lote);
  }
  if (ok) {
    escribirTexto(RUTA_AFIRMACION_B, markdownAfirmacion(lotes, "B"));
    console.log(`OK ${RUTA_AFIRMACION_B}`);
  }
  return ok ? 0 : 1;
}

async function main(): Promise<number> {
  const args = argumentos(process.argv.slice(2));
  if (args.demo === "b") {
    if (args.versionados !== true) {
      console.error("uso: casos-generar --versionados --demo b");
      return 2;
    }
    return versionadosB();
  }
  const rutaPlan = typeof args.plan === "string" ? args.plan : PLAN_DEMO_A;
  const rutaBeneficios =
    typeof args.beneficios === "string"
      ? args.beneficios
      : PLAN_BENEFICIOS_DEMO_A;
  const base = await entradas(rutaPlan, rutaBeneficios);

  if (args.versionados === true) {
    let ok = true;
    const lotes: Lote[] = [];
    for (const l of LOTES_VERSIONADOS) {
      const propio =
        l.plan === rutaPlan && l.beneficios === rutaBeneficios
          ? base
          : await entradas(l.plan, l.beneficios);
      const lote = await generarLote({
        ...propio,
        semilla: l.semilla,
        n: l.n,
        receta: l.receta,
      });
      ok = escribirSiLimpio(rutaDeLote(l.semilla, l.n), lote) && ok;
      lotes.push(lote);
    }
    if (ok) {
      escribirTexto(RUTA_AFIRMACION, markdownAfirmacion(lotes));
      console.log(`OK ${RUTA_AFIRMACION}`);
    }
    return ok ? 0 : 1;
  }
  if (typeof args.semilla !== "string" || typeof args.n !== "string") {
    console.error(
      "uso: casos-generar --semilla <s> --n <n> [--receta estandar|humo] [--salida <ruta>] | --versionados",
    );
    return 2;
  }
  const receta = args.receta === "humo" ? "humo" : "estandar";
  const lote = await generarLote({
    ...base,
    semilla: args.semilla,
    n: Number(args.n),
    receta,
  });
  const salida =
    typeof args.salida === "string"
      ? args.salida
      : rutaDeLote(args.semilla, Number(args.n));
  return escribirSiLimpio(salida, lote) ? 0 : 1;
}

main().then(
  (codigo) => process.exit(codigo),
  (e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  },
);
