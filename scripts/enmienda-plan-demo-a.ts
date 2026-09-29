/**
 * La enmienda v1 → v1.1 del plan del demo A como función pura (la usa el CLI
 * `enmendar-plan-demo-a.ts` y el test que prueba que `plans/demo-a/v1.1.json` sale de aquí).
 */
import type { Plan } from "../core/plan";

export function enmendar(v1: Plan): Record<string, unknown> {
  const contrato = v1.contrato_de_grafo;
  const aristas = contrato.aristas_condicionales.map((a) => {
    if (a.desde !== "enrutador") return a;
    const copia: Record<string, unknown> = { ...a };
    delete copia.si_falso;
    return copia as typeof a;
  });
  aristas.splice(1, 0, {
    desde: "enrutador",
    orden: 2,
    senal: "servicio_exento",
    operador: "igual_a",
    valor: true,
    inclusivo: false,
    si_verdadero: "redactor",
  });
  const senales = [...contrato.senales_obligatorias_en_traza];
  senales.splice(senales.indexOf("tipo_atencion") + 1, 0, "servicio_exento");
  const flujo = v1.flujo_objetivo.map((paso, i) =>
    i === 1
      ? {
          es: "Si es urgencia o un servicio exento, se autoriza sin verificar cobertura (ley y plan de beneficios).",
          en: "If it is an emergency or an exempt service, it is approved without a coverage check (law and benefit plan).",
        }
      : paso,
  );
  const borrador: Record<string, unknown> = {
    ...v1,
    version: "1.1.0",
    estado_aprobacion: "borrador",
    huella: null,
    flujo_objetivo: flujo,
    contrato_de_grafo: {
      ...contrato,
      aristas_condicionales: aristas,
      ramas_por_defecto: {
        ...contrato.ramas_por_defecto,
        enrutador: "extractor",
      },
      senales_obligatorias_en_traza: senales,
    },
  };
  delete borrador.aprobado_por;
  delete borrador.aprobado_el;
  return borrador;
}

/**
 * La enmienda v1.1 → v1.2 (aprobada por el usuario en el gate de la fase 4 del S1): SOLO medición.
 * Grafo, umbrales y decisiones quedan idénticos — por eso los lotes generados con la v1.1 siguen
 * sirviendo (misma verdad conocida).
 *   1. R5: el detector comparaba la extracción entera con sus campos (siempre «distinto»); compara campos.
 *   2. S1: umbral numérico de confirmación (el que ya decía su prueba barata): ECE ≤ 0,10 y AUROC ≥ 0,75.
 *   3. S2: la condición `ciclos_aclaracion <= 2` no podía fallar con U3 = 2; ahora mide si los casos
 *      incompletos CON respuesta del médico quedan completos dentro de los ciclos permitidos (≥ 95 %).
 */
export function enmendarAV12(v11: Plan): Record<string, unknown> {
  const riesgos = v11.riesgos.map((r) =>
    r.id === "R5" && r.detector_en_trazas
      ? {
          ...r,
          detector_en_trazas: {
            ...r.detector_en_trazas,
            condicion: "extraccion.campos != verdad_conocida.campos",
          },
        }
      : r,
  );
  const supuestos = v11.supuestos.map((s) => {
    if (s.id === "S1" && s.medible_en_trazas)
      return {
        ...s,
        medible_en_trazas: {
          ...s.medible_en_trazas,
          umbral_confirmacion: { auroc_min: 0.75, ece_max: 0.1 },
        },
      };
    if (s.id === "S2")
      return {
        ...s,
        medible_en_trazas: {
          metricas: ["tasa"],
          poblacion:
            "tipo == 'faltante' AND verdad_conocida.ciclos_aclaracion_necesarios != null",
          condicion: "campos_faltantes_count == 0",
          umbral_confirmacion: { tasa_min: 0.95 },
        },
        prueba_barata: {
          es: "Tasa de casos incompletos, con respuesta del médico, que quedan completos dentro de los ciclos permitidos; se confirma si es ≥ 95 %.",
          en: "Share of incomplete cases, with a reply from the physician, that end complete within the allowed cycles; confirmed if ≥ 95%.",
        },
      };
    return s;
  });
  const borrador: Record<string, unknown> = {
    ...v11,
    version: "1.2.0",
    estado_aprobacion: "borrador",
    huella: null,
    riesgos,
    supuestos,
  };
  delete borrador.aprobado_por;
  delete borrador.aprobado_el;
  return borrador;
}

type Tb = { es: string; en: string };
const tb = (es: string, en: string): Tb => ({ es, en });

/** Opciones y opción elegida de cada decisión, redactadas en los dos idiomas (M-25). El ES es el del v1.2. */
const DECISIONES_V13: Record<
  string,
  { opciones: Tb[]; elegida: Tb; justificacion_en?: string }
> = {
  D1: {
    opciones: [
      tb("todo el expediente", "the whole record"),
      tb(
        "solo los campos clínicamente necesarios, identificadores enmascarados",
        "only the clinically necessary fields, identifiers masked",
      ),
    ],
    elegida: tb(
      "solo edad, sexo, procedimiento, diagnóstico y texto del médico; nombre e identificación enmascarados antes del modelo",
      "only age, sex, procedure, diagnosis and the physician's text; name and ID masked before the model",
    ),
    justificacion_en:
      "Legal data minimization (Law 1581 arts. 3–6, GDPR art. 9) and a trivial output guard.",
  },
  D2: {
    opciones: [
      tb("aprobar y negar", "approve and deny"),
      tb(
        "solo aprobar; toda decisión adversa pasa por humano",
        "approve only; every adverse decision goes to a human",
      ),
    ],
    elegida: tb(
      "solo aprobar; negar y escalar exigen pausa humana",
      "approve only; deny and escalate require a human pause",
    ),
    justificacion_en:
      "CA SB 1120, TX SB 815, AI Act art. 14; the app's hard rule.",
  },
  D3: {
    opciones: [
      tb("siempre", "always"),
      tb(
        "por umbrales de confianza, costo y contradicción",
        "by confidence, cost and contradiction thresholds",
      ),
    ],
    elegida: tb(
      "confianza < umbral, costo > alto costo, contradicción orden/texto, o modo Texas activo",
      "confidence < threshold, cost > high-cost limit, order/text contradiction, or Texas mode on",
    ),
  },
  D4: {
    opciones: [
      tb("agente único", "single agent"),
      tb(
        "enrutador + extractor + verificador + redactor",
        "router + extractor + checker + writer",
      ),
    ],
    elegida: tb(
      "enrutador + tres especializados, con línea base de agente único medida a un presupuesto no mayor",
      "router + three specialists, with a single-agent baseline measured at no larger budget",
    ),
    justificacion_en:
      "Required by the specification (RF-04.3); evidence says the gain is not automatic (Tran & Kiela 2026), hence reversible and measured.",
  },
  D5: {
    opciones: [
      tb("sin límite", "no limit"),
      tb("máximo declarado como umbral", "maximum declared as a threshold"),
    ],
    elegida: tb(
      "máximo 2 ciclos como umbral jugable",
      "at most 2 cycles, as a playable threshold",
    ),
  },
  D6: {
    opciones: [
      tb("API con clave", "API with a key"),
      tb(
        "suscripción de Claude Code por binario oficial",
        "Claude Code subscription through the official binary",
      ),
      tb("Groq", "Groq"),
    ],
    elegida: tb(
      "suscripción de Claude Code (alias sonnet) en lotes de 20 fuera de CI; interruptor a API/Groq",
      "Claude Code subscription (alias sonnet) in batches of 20 outside CI; switch to API/Groq",
    ),
  },
};

const MOMENTO: Record<string, Tb> = {
  diseño: tb("diseño", "design"),
  S1: tb("S1", "S1"),
};
const EFECTO: Record<string, string> = {
  ocurrencia: "occurrence",
  detección: "detection",
  severidad: "severity",
};
const MITIGACION_EN: Record<string, string> = {
  R1: "mandatory human pause on every deny/escalate output (graph contract)",
  R2: "masking before the model + deterministic output guard with the synthetic set's identifier list",
  R3: "control/data separation; allow-list of actions; the text never changes the tool; output guard",
  R4: "threshold U3 and escalation when it runs out",
  R5: "cheap test of assumption S1; threshold set by risk control; rule fallback",
  R6: "hard rule: emergency ⇒ no coverage check; list of exempt services in the benefit plan",
  R7: "typed state per node; single-agent baseline; the verifier records the agent and step of the first error",
  R8: "spaced batches of 20, accumulable without duplicates (RF-05.5); every limit reached is recorded; switch to API",
};

/**
 * La enmienda v1.2 → v1.3 (S2 fase 0; decisiones del usuario en el plan del S2: U4 queda y se explica, tolerancia de
 * S3 estricta): SOLO medición y redacción. Umbrales y contrato de grafo quedan idénticos — el lote de 20 sigue
 * valiendo (ADR-005) — por eso U4 y la unidad de U2 NO se tocan aunque la unidad siga solo en español.
 *   1. R8 se mide sobre las sesiones del manifiesto (M-14): el límite de uso detiene el lote y no queda en ninguna traza.
 *   2. R1 y R6 protegen obligaciones legales: `control_legal` (instrumentos-de-plan v0.2.0, G8).
 *   3. S3 declara su tolerancia (estricta: no peor en exactitud ni en latencia) y dice «a un presupuesto no mayor» (ADR-006).
 *   4. Decisiones y mitigaciones bilingües (M-25): opciones, opción elegida, acción, momento y efecto; el EN de las
 *      justificaciones de D1, D2 y D4 recupera los hechos del ES.
 */
export function enmendarAV13(v12: Plan): Record<string, unknown> {
  const decisiones = v12.decisiones.map((d) => {
    const n = DECISIONES_V13[d.id];
    if (!n) throw new Error(`sin redacción v1.3 para ${d.id}`);
    if (n.opciones.length !== d.opciones.length)
      throw new Error(`${d.id}: cambió el número de opciones`);
    return {
      ...d,
      opciones: d.opciones.map((o, i) => ({
        ...o,
        nombre: n.opciones[i] as Tb,
      })),
      opcion_elegida: n.elegida,
      ...(n.justificacion_en && d.justificacion
        ? { justificacion: { es: d.justificacion.es, en: n.justificacion_en } }
        : {}),
    };
  });
  const riesgos = v12.riesgos.map((r) => {
    const en = MITIGACION_EN[r.id];
    if (!en) throw new Error(`sin redacción v1.3 para ${r.id}`);
    const mitigaciones = r.mitigaciones.map((m) => {
      const accion = typeof m.accion === "string" ? m.accion : m.accion.es;
      const momento = typeof m.momento === "string" ? m.momento : m.momento.es;
      const efecto =
        typeof m.efecto_esperado === "string"
          ? m.efecto_esperado
          : m.efecto_esperado.es;
      const [dim, valor] = efecto.split(" → ");
      const dimEn = EFECTO[dim ?? ""];
      if (!MOMENTO[momento] || !dimEn || !valor)
        throw new Error(`${r.id}: mitigación sin redacción v1.3`);
      return {
        accion: tb(accion, en),
        momento: MOMENTO[momento],
        efecto_esperado: tb(efecto, `${dimEn} → ${valor}`),
      };
    });
    const base = { ...r, mitigaciones };
    if (r.id === "R1" || r.id === "R6") return { ...base, control_legal: true };
    if (r.id === "R8")
      return {
        ...base,
        detector_en_trazas: {
          tipo: "conteo",
          ambito: "sesion",
          poblacion: "todos",
          condicion: "limites_alcanzados > 0",
          ocurre_si: "> 0",
        },
      };
    return base;
  });
  const supuestos = v12.supuestos.map((s) =>
    s.id === "S3" && s.medible_en_trazas
      ? {
          ...s,
          enunciado: tb(
            "El enrutador con tres especializados no rinde peor que un agente único a un presupuesto no mayor.",
            "The router with three specialists does no worse than a single agent at no larger budget.",
          ),
          medible_en_trazas: {
            ...s.medible_en_trazas,
            umbral_confirmacion: {
              exactitud_dif_min: 0,
              latencia_mediana_razon_max: 1,
            },
          },
        }
      : s,
  );
  const borrador: Record<string, unknown> = {
    ...v12,
    version: "1.3.0",
    estado_aprobacion: "borrador",
    huella: null,
    decisiones,
    riesgos,
    supuestos,
  };
  delete borrador.aprobado_por;
  delete borrador.aprobado_el;
  return borrador;
}
