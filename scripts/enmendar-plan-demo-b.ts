/**
 * Enmiendas del plan del demo B. Parten de la versión APROBADA anterior, que queda intacta como historia.
 *   - `--a 1.1` (por defecto): v1 → v1.1 (decisión del usuario en la fase 3 del S3, 2026-10-04: «v1.1 con los tres»):
 *     redacción bilingüe de los textos que el v1 traía solo en español, S1 con una clave que el verificador decide y S2
 *     con la comparación contra la línea base de agente único. Solo medición: debe dar la misma verdad (ADR-005).
 *   - `--a 1.2`: v1.1 → v1.2 del S9 («El reloj y los dueños»; aprobada por el usuario en el G-Plan del S9, chat de la
 *     planeadora, 2026-11-02): el nodo `beneficiarios` y sus aristas, y el criterio C7. Cambia el contrato de grafo, así
 *     que las corridas de la v1 y la v1.1 no valen para ella (ADR-005): la corrida de la v1.2 es la `b-002-20`.
 * Un `--a` desconocido es un error, y un destino que ya existe no se reescribe (`scripts/_enmendar.ts`).
 * Uso: `pnpm tsx scripts/enmendar-plan-demo-b.ts [--a 1.1|1.2] --por <nombre> --el <YYYY-MM-DD>`
 */
import { aprobarPlan, cargarPlan, mismaVerdad } from "../core/plan";
import { enmendarBV11, enmendarBV12 } from "./enmienda-plan-demo-b";
import { argumentos, escribirJson, leerJson } from "./_io";
import { elegirEnmienda, motivoDeDestinoOcupado } from "./_enmendar";

const ENMIENDAS = {
  "1.1": {
    entrada: "plans/demo-b/v1.json",
    salida: "plans/demo-b/v1.1.json",
    f: enmendarBV11,
    /** Una enmienda de solo medición conserva umbrales y contrato de grafo. */
    mismaVerdad: true,
  },
  "1.2": {
    entrada: "plans/demo-b/v1.1.json",
    salida: "plans/demo-b/v1.2.json",
    f: enmendarBV12,
    mismaVerdad: false,
  },
} as const;

async function main(): Promise<number> {
  const args = argumentos(process.argv.slice(2));
  if (typeof args.por !== "string" || typeof args.el !== "string") {
    console.error(
      "uso: enmendar-plan-demo-b [--a 1.1|1.2] --por <nombre> --el <YYYY-MM-DD>",
    );
    return 2;
  }
  const eleccion = elegirEnmienda(ENMIENDAS, args.a, "1.1");
  if (!eleccion.ok) {
    console.error(eleccion.motivo);
    return 2;
  }
  const {
    entrada,
    salida,
    f,
    mismaVerdad: conservaLaVerdad,
  } = ENMIENDAS[eleccion.clave];
  const ocupado = motivoDeDestinoOcupado(salida);
  if (ocupado) {
    console.error(ocupado);
    return 1;
  }
  const bruto = leerJson(entrada);
  const previo = await cargarPlan(bruto);
  if (!previo.ok) throw new Error(`${entrada} no carga`);
  const r = await aprobarPlan(f(previo.plan), {
    por: args.por,
    el: args.el,
  });
  if (!r.ok) {
    for (const m of r.motivos)
      console.error(`[${m.codigo}] ${m.elemento}: ${m.mensaje.es}`);
    return 1;
  }
  if (conservaLaVerdad && !mismaVerdad(bruto, r.plan)) {
    console.error(
      `la v${r.plan.version} cambia umbrales o contrato de grafo: no es una enmienda de medición`,
    );
    return 1;
  }
  escribirJson(salida, r.plan as never);
  console.log(`OK ${salida} · v${r.plan.version} · huella ${r.plan.huella}`);
  return 0;
}

main().then((c) => process.exit(c));
