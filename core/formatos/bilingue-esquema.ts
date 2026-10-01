/**
 * Esquemas Zod de los textos bilingües (`bilingue.ts` define los tipos sin Zod para que los diccionarios de la
 * vitrina no lo lleven al navegador). `satisfies` ata cada esquema a su tipo: si uno cambia sin el otro, no compila.
 */
import { z } from "zod";
import type { TextoBilingue, TextoLibre } from "./bilingue";

export const TextoBilingueSchema = z
  .object({ es: z.string().min(1), en: z.string().min(1) })
  .strict() satisfies z.ZodType<TextoBilingue>;

export const TextoLibreSchema = z.union([
  z.string().min(1),
  TextoBilingueSchema,
]) satisfies z.ZodType<TextoLibre>;
