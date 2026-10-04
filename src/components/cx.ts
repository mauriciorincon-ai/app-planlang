/** Une clases de Tailwind ignorando las vacías. Sin fusión: un componente no recibe clases que choquen con las suyas. */
export function cx(...clases: (string | false | null | undefined)[]): string {
  return clases.filter(Boolean).join(" ");
}

/** El contenedor de la rejilla (design-system § 2.4): 1120 px de ancho, margen de 32 px (16 en teléfono). */
export const CONT = "mx-auto max-w-ancho px-(--margen)";
