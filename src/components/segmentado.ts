/**
 * Control segmentado (design-system § 5, barra y «Leer como»): un grupo con borde de control y opciones
 * de 28 px; la elegida se pinta en tinta-1 llena. Sirve igual para botones (`aria-pressed`) y para los
 * enlaces de idioma (`aria-current`).
 */
export const SEG =
  "inline-flex overflow-hidden rounded-control border border-tinta-3";
export const SEG_OPCION =
  "inline-flex h-7 cursor-pointer items-center gap-1.25 border-0 bg-transparent px-2.5 text-dato leading-none font-medium text-tinta-2 no-underline transition-colors [&+&]:border-l [&+&]:border-tinta-3 hover:text-tinta-1 aria-pressed:bg-tinta-1 aria-pressed:text-fondo aria-[current=true]:bg-tinta-1 aria-[current=true]:text-fondo";
