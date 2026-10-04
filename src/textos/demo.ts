/**
 * La identidad de cada demo en la vitrina (ADR-014): su nombre corto y su dominio, que entran en los antetítulos y en
 * las descripciones. El A conserva sus palabras del S2; el B se redacta en los dos idiomas (regla 20).
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";
import type { IdDemo } from "@/lib/demos";

export const DEMO_TEXTO: Readonly<
  Record<IdDemo, { corto: TextoBilingue; dominio: TextoBilingue }>
> = {
  "demo-a": {
    corto: tb("Demo A", "Demo A"),
    dominio: tb("autorizaciones médicas", "medical prior authorizations"),
  },
  "demo-b": {
    corto: tb("Demo B", "Demo B"),
    dominio: tb(
      "vinculación con debida diligencia",
      "customer due-diligence onboarding",
    ),
  },
};
