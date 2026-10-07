import type { Metadata } from "next";
import type { Idioma, TextoBilingue } from "@core/formatos/bilingue";
import { SEGMENTO_DEMO, type IdDemo } from "@/lib/demos";
import { DEMO_TEXTO } from "@/textos/demo";

/** Un texto común a los dos demos, o uno redactado para cada demo. */
type TextoDePagina = TextoBilingue | Readonly<Record<IdDemo, TextoBilingue>>;

const delDemo = (t: TextoDePagina, demo: IdDemo): TextoBilingue =>
  "es" in t ? (t as TextoBilingue) : t[demo];

/**
 * Título y descripción de una pantalla. El A conserva sus títulos del S2; las pantallas de otro demo anteponen su
 * nombre corto («Demo B · El plan · planlang», ADR-014).
 */
export function metadatos(
  titulo: TextoDePagina,
  descripcion: TextoDePagina,
  idioma: Idioma,
  demo: IdDemo,
): Metadata {
  const t = delDemo(titulo, demo)[idioma];
  return {
    title: SEGMENTO_DEMO[demo] ? `${DEMO_TEXTO[demo].corto[idioma]} · ${t}` : t,
    description: delDemo(descripcion, demo)[idioma],
  };
}
