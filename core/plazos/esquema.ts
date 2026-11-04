/**
 * El lector de la capa de llegadas (`planlang-llegadas/v1`): quien la escribe es `scripts/llegadas-generar.ts` y la leen
 * el verificador y la vitrina. Estricto: una clave que se cuele rompe la lectura, no pasa en silencio.
 */
import { z } from "zod";
import { FORMATO_DE_LLEGADAS } from "./tipos";

export const CapaDeLlegadasSchema = z
  .object({
    formato: z.literal(FORMATO_DE_LLEGADAS),
    lote: z
      .object({
        id: z.string().min(1),
        huella: z.string().regex(/^[0-9a-f]{64}$/),
        semilla: z.string().min(1),
      })
      .strict(),
    dias_habiles: z.number().int().min(1),
    minutos_de_jornada: z.number().int().min(1),
    llegadas: z.array(
      z
        .object({
          caso_id: z.string().min(1),
          dia: z.number().int().min(0),
          minuto: z.number().int().min(0),
        })
        .strict(),
    ),
    huella: z.string().regex(/^[0-9a-f]{64}$/),
  })
  .strict();
