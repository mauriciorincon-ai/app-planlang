/**
 * Migración documentada del plan-borrador del demo A (`PLAN-DEMO-A-v0.json`, planeadora, RO) a la forma
 * que el validador exige. Cada transformación es una corrección anotada en la bitácora del S1
 * (§ «Desviación del plan» y § «Correcciones al plan v0»). No inventa contenido de plan: solo
 * estructura, referencias y las desviaciones 3–4 (función nombrada del modo Texas; orden y rama por
 * defecto de las aristas). El resultado (`plans/demo-a/v0-migrado.json`) se aprueba con `plan:validar`.
 *
 * Uso: `pnpm tsx scripts/migrar-plan-demo-a.ts --entrada <ruta v0> --salida plans/demo-a/v0-migrado.json`
 */
import { argumentos, escribirJson, leerJson } from "./_io";

type Obj = Record<string, unknown>;

const CORRECCIONES: string[] = [];
function nota(texto: string): void {
  CORRECCIONES.push(texto);
}

function migrar(v0: Obj): Obj {
  const plan: Obj = { ...v0 };
  delete plan._nota;
  nota("`_nota` eliminada (el esquema es estricto: solo campos del contrato).");

  plan.version = "1.0.0";
  nota(
    "`version` «0.1.0-borrador» → «1.0.0» (versión semántica; la v1 aprobada).",
  );
  plan.estado_aprobacion = "borrador";
  plan.huella = null;

  // Decisiones: opciones como {nombre}; justificación bilingüe ya lo era.
  plan.decisiones = (v0.decisiones as Obj[]).map((d) => ({
    ...d,
    opciones: (d.opciones as string[]).map((nombre) => ({ nombre })),
    depende_de: d.depende_de ?? [],
    umbrales_asociados: d.umbrales_asociados ?? [],
    riesgos_asociados: d.riesgos_asociados ?? [],
  }));
  nota(
    "`decisiones[].opciones`: cadenas → `{ nombre }` (contrato instrumentos-de-plan § 1.1; pros/contras opcionales, enmienda propuesta).",
  );

  // Riesgos: mitigaciones ya tienen la forma; detector con `ocurre_si` normalizado (espacio único).
  plan.riesgos = (v0.riesgos as Obj[]).map((r) => {
    const det = r.detector_en_trazas as Obj | undefined;
    return {
      ...r,
      mitigaciones: r.mitigaciones ?? [],
      detector_en_trazas: det
        ? {
            ...det,
            ocurre_si: String(det.ocurre_si).replace(/\s+/g, " ").trim(),
          }
        : null,
    };
  });
  nota(
    "`riesgos[].detector_en_trazas.ocurre_si` normalizado a «operador número» (p. ej. «> 0»).",
  );

  // Umbrales: sin cambios de contenido; U3 usa mayor_o_igual_que + inclusivo true (coherente); U4 booleano.
  // Criterios: sin cambios (poblacion vive dentro de regla_de_medicion, como en el v0).

  // Contrato de grafo.
  const contrato = { ...(v0.contrato_de_grafo as Obj) };
  const aristasV0 = contrato.aristas_condicionales as Obj[];
  const contador = new Map<string, number>();
  const aristas: Obj[] = [];
  for (const a of aristasV0) {
    const desde = a.desde as string;
    const orden = (contador.get(desde) ?? 0) + 1;
    contador.set(desde, orden);
    if (a.nota !== undefined) {
      // Desviación 3: la arista «modo Texas» («cuando propuesta != aprobar») no cabe en la tripleta.
      aristas.push({
        desde,
        orden,
        funcion: {
          nombre: "texas_y_no_aprobar",
          entradas: ["modo_texas", "propuesta"],
        },
        si_verdadero: a.si_verdadero,
        nota: {
          es: "Modo Texas: si está encendido y la propuesta no es aprobar, toda determinación adversa pasa por una persona (TX SB 815).",
          en: "Texas mode: when on and the proposal is not approve, every adverse determination goes to a person (TX SB 815).",
        },
      });
      continue;
    }
    const { nota: _nota, ...resto } = a;
    void _nota;
    aristas.push({
      ...resto,
      orden,
      inclusivo:
        a.operador === "mayor_o_igual_que" || a.operador === "menor_o_igual_que"
          ? true
          : (a.inclusivo ?? false),
    });
  }
  contrato.aristas_condicionales = aristas;
  nota(
    "Aristas: `orden` explícito por nodo escritor (desviación 4); `inclusivo` explícito (E-14: true solo en ≥/≤; los demás estrictos como en el v0).",
  );
  nota(
    "Arista «modo Texas» (`nota: cuando propuesta != aprobar`) → función nombrada `texas_y_no_aprobar(modo_texas, propuesta)` (desviación 3, regla dura 2).",
  );

  contrato.ramas_por_defecto = { decision: "redactor" };
  nota(
    "`ramas_por_defecto: { decision: redactor }` (desviación 4: primera arista verdadera gana; si ninguna, redactor).",
  );

  contrato.pausas_humanas = (contrato.pausas_humanas as Obj[]).map((p) => ({
    ...p,
    politica_simulada: {
      es: "En lotes, el revisor simulado sigue la verdad conocida del caso (DA-04); la vitrina lo divulga.",
      en: "In batches, the simulated reviewer follows the case's known truth (DA-04); the showcase discloses it.",
    },
  }));
  nota("`pausas_humanas[].politica_simulada`: texto → bilingüe (regla 20).");

  // Evaluadores: riesgos cubiertos (para calcular brechas no previstas, RF-06.6).
  const cubiertos: Record<string, string[]> = {
    exactitud_extraccion: ["R5", "R7"],
    datos_sensibles_en_salida: ["R2"],
    pausas_cumplidas: ["R1", "R6"],
    inyeccion_neutralizada: ["R3"],
    calidad_redaccion: [],
  };
  contrato.evaluadores_requeridos = (
    contrato.evaluadores_requeridos as Obj[]
  ).map((e) => ({
    ...e,
    riesgos_cubiertos: cubiertos[e.id as string] ?? [],
  }));
  nota(
    "`evaluadores_requeridos[].riesgos_cubiertos` (desviación 5): exactitud→R5,R7 · datos sensibles→R2 · pausas→R1,R6 · inyección→R3; el juez de redacción no cubre riesgo (sus fallas son brechas no previstas).",
  );

  plan.contrato_de_grafo = contrato;

  plan.etiqueta_riesgo = {
    es: "Alto riesgo por analogía (AI Act, Anexo III 5(a)/(c)) · simulación con datos sintéticos · no operativo.",
    en: "High risk by analogy (AI Act, Annex III 5(a)/(c)) · simulation on synthetic data · not operational.",
  };
  nota("`etiqueta_riesgo` añadida (legal F14).");

  return plan;
}

const args = argumentos(process.argv.slice(2));
if (typeof args.entrada !== "string" || typeof args.salida !== "string") {
  console.error("uso: migrar-plan-demo-a --entrada <v0.json> --salida <ruta>");
  process.exit(2);
}
const v0 = leerJson(args.entrada) as Obj;
const migrado = migrar(v0);
escribirJson(args.salida, migrado as never);
console.log(`migrado → ${args.salida}`);
for (const c of CORRECCIONES) console.log(`  - ${c}`);
