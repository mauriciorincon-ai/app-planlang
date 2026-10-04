import type { ReactNode } from "react";
import type { Idioma } from "@core/formatos/bilingue";
import type { IdDemo } from "@/lib/demos";
import type { Pantalla } from "@/lib/ruta";
import { SALTO } from "@/textos/comun";
import { Barra } from "./barra";
import { Pie } from "./pie";
import { Rotulo } from "./rotulo";

/** El marco de toda pantalla de la vitrina: rótulo, barra, contenido y pie. */
export function Marco({
  idioma,
  pagina,
  id,
  corrida,
  demo = "demo-a",
  children,
}: {
  idioma: Idioma;
  pagina: Pantalla;
  id?: string;
  /** El demo de la pantalla: las pestañas y el idioma enlazan dentro de él (ADR-014). */
  demo?: IdDemo;
  /** De qué corrida salen los datos de la pantalla (va al pie). */
  corrida?: string;
  children: ReactNode;
}) {
  return (
    <>
      {/* Lo primero que alcanza el teclado: saltar el rótulo y la barra (AU-S2-B24, WCAG 2.4.1). Solo se ve con foco. */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:border focus:border-tinta-1 focus:bg-fondo focus:px-3 focus:py-2 focus:text-chico focus:text-tinta-1 focus:outline-2 focus:outline-offset-2 focus:outline-tinta-1"
      >
        {SALTO[idioma]}
      </a>
      <Rotulo idioma={idioma} />
      <Barra idioma={idioma} pagina={pagina} id={id} demo={demo} />
      <main id="contenido" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Pie idioma={idioma} corrida={corrida} />
    </>
  );
}
