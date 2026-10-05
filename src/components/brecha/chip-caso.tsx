import type { Idioma } from "@core/formatos/bilingue";
import { SIN_PAGINA } from "@/textos/comun";

/**
 * El id de un caso en una fila de la Brecha: un enlace a su página o, si no la tiene (corrida de 200,
 * `src/lib/vista/paginas-caso.ts`), el id con borde punteado y la razón para el lector de pantalla. La diferencia no
 * depende del color.
 */
export function ChipCaso({
  c,
  idioma,
  className = "",
}: {
  c: { id: string; href: string | null };
  idioma: Idioma;
  className?: string;
}) {
  return c.href ? (
    <a
      href={c.href}
      className={`rounded-chip border border-linea bg-sup-1 px-1.5 py-px font-mono text-tinta-1 no-underline hover:border-tinta-2 ${className}`}
    >
      {c.id}
    </a>
  ) : (
    <span
      className={`rounded-chip border border-dashed border-linea px-1.5 py-px font-mono text-tinta-2 ${className}`}
    >
      {c.id}
      <span className="sr-only"> ({SIN_PAGINA[idioma]})</span>
    </span>
  );
}
