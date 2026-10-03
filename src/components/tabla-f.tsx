import type { CSSProperties, ReactNode } from "react";
import { cx } from "./cx";

export interface ColumnaF {
  titulo: ReactNode;
  /** Ancho en la rejilla de escritorio (`minmax(0,2fr)`, `48px`…). */
  ancho: string;
  /** Datos en mono (ids, cifras, reglas). */
  mono?: boolean;
}

export interface FilaF {
  clave: string;
  celdas: ReactNode[];
  /** Un renglón resaltado (el caso que cambió con los umbrales del visitante). */
  marcada?: boolean;
  atributos?: Record<string, string>;
}

const ET =
  "block font-letra text-dato leading-[1.4] text-tinta-2 escritorio:hidden";
const MONO = "font-mono text-dato leading-normal [overflow-wrap:anywhere]";

/**
 * Tabla de datos de la maqueta (`.tabla-f`): rejilla con cabecera en escritorio; en el teléfono, una tarjeta por
 * renglón con la primera celda arriba y las demás con su rótulo, en dos columnas. Sin lógica: pinta celdas.
 */
export function TablaF({
  columnas,
  filas,
  className,
  etiqueta,
}: {
  columnas: readonly ColumnaF[];
  filas: readonly FilaF[];
  className?: string;
  /** El nombre accesible de la tabla (el título de su sección). */
  etiqueta?: string;
}) {
  const cols = columnas.map((c) => c.ancho).join(" ");
  // Semántica de tabla con roles ARIA (AU-S2-15, WCAG 1.3.1): en escritorio el lector asocia cada celda con su
  // columna; en el teléfono la cabecera no se pinta y cada celda lleva su rótulo.
  return (
    <div
      role="table"
      aria-label={etiqueta}
      className={cx("grid", className)}
      style={{ "--cols": cols } as CSSProperties}
    >
      <div
        role="row"
        className="hidden gap-3 pb-1.5 text-dato text-tinta-2 escritorio:grid escritorio:grid-cols-[var(--cols)]"
      >
        {columnas.map((c, k) => (
          <span key={k} role="columnheader">
            {c.titulo}
          </span>
        ))}
      </div>
      {filas.map((f) => (
        <div
          key={f.clave}
          role="row"
          {...f.atributos}
          className={cx(
            "grid grid-cols-2 items-start gap-x-3 gap-y-1.5 border-t border-linea py-3 escritorio:grid-cols-[var(--cols)] escritorio:items-center escritorio:py-2.25",
            f.marcada && "bg-sup-2",
          )}
        >
          {f.celdas.map((celda, k) => {
            const c = columnas[k];
            return (
              <span
                key={k}
                role="cell"
                className={cx(
                  "min-w-0 text-chico leading-normal",
                  c?.mono && MONO,
                  k === 0 && "col-span-2 escritorio:col-span-1",
                )}
              >
                {k > 0 ? <span className={ET}>{c?.titulo}</span> : null}
                {celda}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
