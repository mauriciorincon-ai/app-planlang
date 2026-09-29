import type { ReactNode } from "react";
import type { Idioma } from "@core/formatos/bilingue";
import type { Pantalla } from "@/lib/ruta";
import { Barra } from "./barra";
import { Pie } from "./pie";
import { Rotulo } from "./rotulo";

/** El marco de toda pantalla de la vitrina: rótulo, barra, contenido y pie. */
export function Marco({
  idioma,
  pagina,
  id,
  children,
}: {
  idioma: Idioma;
  pagina: Pantalla;
  id?: string;
  children: ReactNode;
}) {
  return (
    <>
      <Rotulo idioma={idioma} />
      <Barra idioma={idioma} pagina={pagina} id={id} />
      <main id="contenido">{children}</main>
      <Pie idioma={idioma} />
    </>
  );
}
