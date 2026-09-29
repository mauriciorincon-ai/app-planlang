import {
  FileCheck,
  GitBranch,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Idioma } from "@core/formatos/bilingue";
import type { VistaEntrada } from "@/lib/vista/entrada";
import { ARISTA_FRASE, LIDER, LO_QUE_NINGUNA } from "@/textos/entrada";
import { Baldosa } from "../baldosa";
import { Chip } from "../chip";
import { Glifo } from "../marcas";
import { Seccion } from "../seccion";
import { Veredicto } from "../veredicto";

function Bloque({
  n,
  icono,
  titulo,
  children,
}: {
  n: number;
  icono: LucideIcon;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <article className="grid content-start gap-2">
      <div className="mb-1 flex items-center gap-3">
        <Baldosa icono={icono} />
        {/* La estrella numera las tres propiedades ★ de la VISION. */}
        <span className="inline-flex items-center gap-1.5 font-mono text-dato leading-none font-medium text-tinta-2">
          <Glifo forma="estrella" tam={11} />
          {n}
        </span>
      </div>
      <h3 className="text-sub font-semibold">{titulo}</h3>
      {children}
    </article>
  );
}

/** Las tres propiedades que ninguna herramienta muestra, cada una con su prueba en el demo A. */
export function LoQueNinguna({
  vista,
  idioma,
}: {
  vista: VistaEntrada;
  idioma: Idioma;
}) {
  const f = vista.fallasALaVista;
  return (
    <Seccion
      id="s-tres"
      titulo={LO_QUE_NINGUNA.titulo[idioma]}
      nota={LO_QUE_NINGUNA.nota[idioma]}
    >
      <div className="grid grid-cols-1 gap-6 escritorio:grid-cols-3 escritorio:gap-8">
        <Bloque n={1} icono={FileCheck} titulo={LO_QUE_NINGUNA.informe[idioma]}>
          <p className="text-apoyo text-tinta-2">{LIDER.informe[idioma]}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Veredicto clase={f.n > 0 ? "no-cumple" : "cumple"} chico>
              {f.texto}
            </Veredicto>
            <Chip procedencia="real">{vista.capacidad.casos.chip}</Chip>
          </div>
        </Bloque>
        <Bloque
          n={2}
          icono={SlidersHorizontal}
          titulo={LO_QUE_NINGUNA.umbral[idioma]}
        >
          <p className="text-apoyo text-tinta-2">{LIDER.umbral[idioma]}</p>
        </Bloque>
        <Bloque n={3} icono={GitBranch} titulo={LO_QUE_NINGUNA.arista[idioma]}>
          <p className="text-apoyo text-tinta-2">
            {ARISTA_FRASE.antes[idioma]}{" "}
            <span className="mono-en-texto">
              {LO_QUE_NINGUNA.tripleta[idioma]}
            </span>
            {ARISTA_FRASE.despues[idioma]}
          </p>
        </Bloque>
      </div>
    </Seccion>
  );
}
