import type { LucideIcon } from "lucide-react";

/**
 * Ícono de línea (Lucide 1.48.0, ISC — licencia en /licencias/LICENSE-lucide.txt): trazo 1,75, puntas
 * redondeadas, monocromo (hereda la tinta del texto). Siempre decorativo: el texto que acompaña dice lo
 * que significa (design-system § 2.5).
 */
export function Icono({
  de: I,
  tam = 16,
  trazo,
  className,
}: {
  de: LucideIcon;
  tam?: number;
  /** Color del trazo cuando el ícono es una guía gráfica (p. ej. `var(--tinta-3)`, vetada como texto). */
  trazo?: string;
  className?: string;
}) {
  return (
    <I
      aria-hidden="true"
      focusable="false"
      size={tam}
      strokeWidth={1.75}
      color={trazo}
      className={className}
    />
  );
}
