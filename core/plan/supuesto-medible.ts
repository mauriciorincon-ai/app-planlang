/**
 * Cómo se mide un supuesto en las trazas: su familia y las claves de `umbral_confirmacion` que el verificador sabe
 * decidir. Lo comparten el verificador (`core/brecha/supuestos.ts`, que mide) y las contradicciones del borrador
 * (`contradicciones.ts`, que avisan ANTES de aprobar un supuesto que nunca se podrá decidir).
 */

/** Métricas de la familia de calibración (sobre la señal de confianza). */
export const METRICAS_DE_CALIBRACION = [
  "ece",
  "auroc",
  "curva_riesgo_cobertura",
] as const;

/** La comparación con la línea base de agente único (regla dura 10). */
export const COMPARACION_LINEA_BASE = "linea_base_agente_unico";

/** Tolerancias de la comparación con la línea base (plan v1.3 del A, S3). */
export const TOLERANCIA_LINEA_BASE = [
  "exactitud_dif_min",
  "latencia_mediana_razon_max",
] as const;

export type FamiliaSupuesto = "linea_base" | "calibracion" | "tasa";

export function familiaDeSupuesto(m: {
  comparacion?: string | undefined;
  metricas: readonly string[];
}): FamiliaSupuesto {
  if (m.comparacion === COMPARACION_LINEA_BASE) return "linea_base";
  if (
    m.metricas.some((x) =>
      (METRICAS_DE_CALIBRACION as readonly string[]).includes(x),
    )
  )
    return "calibracion";
  return "tasa";
}

const ambos = (metricas: readonly string[]) =>
  metricas.flatMap((x) => [`${x}_min`, `${x}_max`]);

/** Las claves de `umbral_confirmacion` que el verificador decide para cada familia. */
export const CLAVES_DECIDIBLES: Readonly<
  Record<FamiliaSupuesto, readonly string[]>
> = {
  linea_base: TOLERANCIA_LINEA_BASE,
  calibracion: ambos(["ece", "auroc", "exactitud"]),
  tasa: ambos(["tasa"]),
};
