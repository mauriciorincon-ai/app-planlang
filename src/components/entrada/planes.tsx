import { ArrowRight, FileCheck2 } from "lucide-react";
import type { Idioma } from "@core/formatos/bilingue";
import { ruta } from "@/lib/ruta";
import type { FilaPlanSinCorrida } from "@/lib/vista/plan-sin-corrida";
import { ENTRADA } from "@/textos/plan-sin-corrida";
import { Baldosa } from "../baldosa";
import { BotonEnlace } from "../boton";
import { Chip } from "../chip";
import { cx } from "../cx";
import { Icono } from "../icono";
import { Seccion } from "../seccion";

const FILA =
  "grid grid-cols-1 items-start gap-3 border-t border-linea py-4 escritorio:grid-cols-[minmax(0,4fr)_minmax(0,2fr)_minmax(0,2.4fr)_minmax(0,2.4fr)] escritorio:gap-6";

/**
 * «Planes sin corrida» (S5): una fila por plan aprobado que ningún demo corre. Sale del dato (`plans/<id>/vN.json`);
 * sin planes, la sección no se pinta. Nada aquí se simula: solo el contrato, con su fecha y su huella.
 */
export function PlanesSinCorrida({
  filas,
  idioma,
}: {
  filas: readonly FilaPlanSinCorrida[];
  idioma: Idioma;
}) {
  if (filas.length === 0) return null;
  const c = ENTRADA.columnas;
  return (
    <Seccion
      id="s-planes"
      titulo={ENTRADA.titulo[idioma]}
      nota={ENTRADA.nota[idioma]}
      ambosDemos
    >
      <div role="table" aria-labelledby="s-planes">
        <div
          role="row"
          className={cx(
            FILA,
            "hidden border-t-0 pt-0 pb-2 text-dato text-tinta-2 escritorio:grid",
          )}
        >
          <span role="columnheader">{c.plan[idioma]}</span>
          <span role="columnheader">{c.dominio[idioma]}</span>
          <span role="columnheader">{c.aprobado[idioma]}</span>
          <span role="columnheader">{c.abrir[idioma]}</span>
        </div>
        {filas.map((f) => (
          <div key={f.id} role="row" data-plan={f.id} className={FILA}>
            <div role="cell" className="flex items-start gap-3">
              <Baldosa icono={FileCheck2} />
              <div className="min-w-0">
                <h3 className="text-sub font-semibold">{f.nombre}</h3>
                <p className="mt-1 font-mono text-dato text-tinta-2">
                  {f.id} · v{f.version}
                </p>
              </div>
            </div>
            <div role="cell" className="grid justify-items-start gap-1.5">
              <span className="font-mono text-dato text-tinta-1">
                {f.dominio}
              </span>
            </div>
            <div role="cell" className="grid justify-items-start gap-1.5">
              <span className="text-chico text-tinta-2">{f.aprobacion}</span>
              <Chip procedencia="real">{ENTRADA.chip[idioma]}</Chip>
            </div>
            <div role="cell" className="grid justify-items-start gap-1.5">
              <BotonEnlace href={ruta(idioma, "planes", f.id, "demo-a")} chico>
                {ENTRADA.abrir[idioma]}
                <Icono de={ArrowRight} tam={15} />
              </BotonEnlace>
            </div>
          </div>
        ))}
      </div>
    </Seccion>
  );
}
