/**
 * `pnpm plan:validar --entrada <plan.json> [--aprobar --por <nombre> --el <YYYY-MM-DD> --salida <ruta>]`
 *
 * Sin `--aprobar`: valida y lista los motivos de rechazo (ES) con código y elemento; sale 1 si rechaza.
 * Con `--aprobar`: valida, calcula la huella y escribe el plan aprobado en `--salida`.
 * `--verificar <plan.json>`: carga un plan aprobado verificando su huella (RF-06.1).
 */
import {
  aprobarPlan,
  cargarPlan,
  contratoParaConstructor,
  validarPlan,
} from "../core/plan";
import { argumentos, escribirJson, leerJson } from "./_io";

function imprimirMotivos(
  titulo: string,
  motivos: { codigo: string; elemento: string; mensaje: { es: string } }[],
): void {
  if (motivos.length === 0) return;
  console.log(`${titulo} (${motivos.length}):`);
  for (const m of motivos)
    console.log(`  [${m.codigo}] ${m.elemento}: ${m.mensaje.es}`);
}

async function main(): Promise<number> {
  const args = argumentos(process.argv.slice(2));
  if (typeof args.verificar === "string") {
    const r = await cargarPlan(leerJson(args.verificar));
    if (!r.ok) {
      imprimirMotivos("RECHAZADO", r.motivos);
      return 1;
    }
    console.log(
      `OK ${args.verificar} · plan ${r.plan.id} v${r.plan.version} · huella ${r.huella}`,
    );
    imprimirMotivos("Advertencias", r.advertencias);
    return 0;
  }
  if (typeof args.entrada !== "string") {
    console.error(
      "uso: plan-validar --entrada <plan.json> [--aprobar --por <nombre> --el <fecha> --salida <ruta>] | --verificar <plan.json>",
    );
    return 2;
  }
  const entrada = leerJson(args.entrada);
  if (args.aprobar === true) {
    if (
      typeof args.por !== "string" ||
      typeof args.el !== "string" ||
      typeof args.salida !== "string"
    ) {
      console.error("--aprobar exige --por, --el y --salida");
      return 2;
    }
    const r = await aprobarPlan(entrada, { por: args.por, el: args.el });
    if (!r.ok) {
      imprimirMotivos("RECHAZADO", r.motivos);
      return 1;
    }
    escribirJson(args.salida, r.plan);
    const contrato = contratoParaConstructor(r.plan);
    console.log(`APROBADO → ${args.salida} · huella ${r.plan.huella}`);
    console.log(
      `  nodos ${contrato.nodos.length} · aristas ${contrato.aristas.length} · umbrales ${JSON.stringify(contrato.umbrales_aplicados)}`,
    );
    imprimirMotivos("Advertencias", r.advertencias);
    return 0;
  }
  const v = validarPlan(entrada);
  if (!v.ok) {
    imprimirMotivos("RECHAZADO", v.motivos);
    imprimirMotivos("Advertencias", v.advertencias);
    return 1;
  }
  console.log(
    `VÁLIDO · plan ${v.plan.id} v${v.plan.version} · ondas ${JSON.stringify(v.instrumentos.ondas)} · una vía ${v.instrumentos.una_via.join(", ")}`,
  );
  for (const m of v.instrumentos.modos)
    console.log(`  ${m.id}: prioridad ${m.prioridad_de_accion} · RPN ${m.rpn}`);
  imprimirMotivos("Advertencias", v.advertencias);
  return 0;
}

main().then((codigo) => process.exit(codigo));
