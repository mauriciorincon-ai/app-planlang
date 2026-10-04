import type { ReactNode } from "react";
import { cx } from "./cx";

/** Sección de página: 40 px arriba y abajo y un filete (design-system § 2.4). */
export function Seccion({
  id,
  titulo,
  nota,
  cabecera,
  className,
  children,
}: {
  id: string;
  titulo: ReactNode;
  nota?: ReactNode;
  /** Controles de la cabecera (p. ej. «Leer como»), a la derecha del título. */
  cabecera?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cx("border-t border-linea py-10", className)}
    >
      <div
        className={cx(
          "flex flex-wrap justify-between",
          cabecera
            ? "mb-4 items-center gap-x-6 gap-y-3"
            : "mb-6 items-baseline gap-x-6 gap-y-1",
        )}
      >
        <h2 id={id} className="text-seccion">
          {titulo}
        </h2>
        {nota ? <p className="text-chico text-tinta-2">{nota}</p> : null}
        {cabecera}
      </div>
      {children}
    </section>
  );
}
