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
