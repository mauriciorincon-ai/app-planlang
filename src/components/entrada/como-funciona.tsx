import {
  ArrowRight,
  ClipboardPenLine,
  Microscope,
  Ruler,
  Target,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Idioma } from "@core/formatos/bilingue";
import type { VistaEntrada } from "@/lib/vista/entrada";
import { PERFIL, PROCEDENCIA } from "@/textos/comun";
import { CAPACIDAD, COMO_FUNCIONA, LIDER, SOSTIENE } from "@/textos/entrada";
import { Baldosa } from "../baldosa";
import { Chip, type Procedencia } from "../chip";
import { Icono } from "../icono";
import { AvisoPerfil } from "../perfil/aviso-perfil";
import { BloqueExperto } from "../perfil/bloque-experto";
import { LeerComo } from "../perfil/leer-como";
import { Seccion } from "../seccion";
import { MiniAgente, MiniBrecha, MiniPlan } from "./miniaturas";

function Paso({
  n,
  icono,
  titulo,
  texto,
  conector,
  children,
}: {
  n: number;
  icono: LucideIcon;
  titulo: string;
  texto: string;
  conector: boolean;
  children: ReactNode;
}) {
  return (
    <li className="grid min-w-0 grid-rows-[auto_auto_1fr] gap-3">
      <div className="flex items-center gap-3">
        <Baldosa icono={icono} />
        <h3 className="flex items-baseline gap-2 text-sub font-semibold">
          <span className="font-mono text-dato leading-none font-medium text-tinta-2">
            {n}
          </span>
          {titulo}
        </h3>
        {conector ? (
          <span
            className="hidden min-w-6 flex-1 items-center before:h-px before:flex-1 before:bg-linea before:content-[''] escritorio:flex"
            aria-hidden="true"
          >
            <Icono
              de={ArrowRight}
              tam={14}
              trazo="var(--tinta-3)"
              className="-ml-0.5"
            />
          </span>
        ) : null}
      </div>
      <p className="text-apoyo text-tinta-2">{texto}</p>
      {children}
    </li>
  );
}

function Cifra({
  cifra,
  texto,
  procedencia,
  chip,
}: {
  cifra: string;
  texto: string;
  procedencia: Procedencia;
  chip: string;
}) {
  return (
    <div className="grid content-start gap-1">
      <b className="text-cifra-chica font-semibold tracking-apretado tabular-nums">
        {cifra}
      </b>
      <span className="text-dato leading-snug text-tinta-2">{texto}</span>
      <span className="mt-1.5 justify-self-start">
        <Chip procedencia={procedencia}>{chip}</Chip>
      </span>
    </div>
  );
}

/** «Cómo funciona»: la ficha general de planlang (objetivo, los tres pasos con su miniatura y la capacidad medida). */
export function ComoFunciona({
  vista,
  idioma,
}: {
  vista: VistaEntrada;
  idioma: Idioma;
}) {
  const sostiene: [string, ReactNode][] = [
    [SOSTIENE.nucleo.dt[idioma], SOSTIENE.nucleo.dd[idioma]],
    [SOSTIENE.trazas.dt[idioma], SOSTIENE.trazas.dd[idioma]],
    [SOSTIENE.cruzada.dt[idioma], vista.experto.cruzada],
    [SOSTIENE.modelo.dt[idioma], vista.experto.modelo],
    [SOSTIENE.humanas.dt[idioma], SOSTIENE.humanas.dd[idioma]],
    [
      SOSTIENE.pila.dt[idioma],
      `${vista.experto.pila} · ${SOSTIENE.pila.vitrina[idioma]}`,
    ],
    [SOSTIENE.fuente.dt[idioma], SOSTIENE.fuente.dd[idioma]],
  ];
  return (
    <Seccion
      id="s-ciclo"
      titulo={COMO_FUNCIONA.titulo[idioma]}
      cabecera={
        <LeerComo
          rotulo={PERFIL.leerComo[idioma]}
          lider={PERFIL.lider[idioma]}
          experto={PERFIL.experto[idioma]}
        />
      }
    >
      <AvisoPerfil
        lider={{
          titulo: PERFIL.leesComoLider[idioma],
          texto: LIDER.avisoLider[idioma],
          boton: PERFIL.verComoExperto[idioma],
        }}
        experto={{
          titulo: PERFIL.leesComoExperto[idioma],
          texto: LIDER.avisoExperto[idioma],
          boton: PERFIL.volverALider[idioma],
        }}
      />
      <div className="my-6 grid grid-cols-[36px_minmax(0,1fr)] items-start gap-x-3.5 gap-y-0.5">
        <span className="row-span-2">
          <Baldosa icono={Target} />
        </span>
        <span className="text-chico text-tinta-2">
          {COMO_FUNCIONA.objetivo[idioma]}
        </span>
        <p className="max-w-objetivo text-texto">{LIDER.objetivo[idioma]}</p>
      </div>
      <ol className="grid grid-cols-1 gap-8 escritorio:grid-cols-3 escritorio:gap-6">
        <Paso
          n={1}
          icono={ClipboardPenLine}
          titulo={COMO_FUNCIONA.pasos.planee[idioma]}
          texto={LIDER.planee[idioma]}
          conector
        >
          <MiniPlan vista={vista} idioma={idioma} />
        </Paso>
        <Paso
          n={2}
          icono={Workflow}
          titulo={COMO_FUNCIONA.pasos.construi[idioma]}
          texto={LIDER.construi[idioma]}
          conector
        >
          <MiniAgente vista={vista} idioma={idioma} />
        </Paso>
        <Paso
          n={3}
          icono={Ruler}
          titulo={COMO_FUNCIONA.pasos.medi[idioma]}
          texto={LIDER.medi[idioma]}
          conector={false}
        >
          <MiniBrecha vista={vista} idioma={idioma} />
        </Paso>
      </ol>
      <div id="capacidad" className="mt-8">
        <p className="mb-2 text-chico text-tinta-2">
          {COMO_FUNCIONA.capacidad[idioma]}
        </p>
        <div className="grid grid-cols-2 gap-4 escritorio:grid-cols-4">
          <Cifra
            cifra={vista.capacidad.casos.cifra}
            texto={vista.capacidad.casos.texto}
            procedencia="real"
            chip={vista.capacidad.casos.chip}
          />
          <Cifra
            cifra={vista.capacidad.cruzada.cifra}
            texto={CAPACIDAD.cruzada[idioma]}
            procedencia="real"
            chip={vista.capacidad.cruzada.chip}
          />
          <Cifra
            cifra={vista.capacidad.balance.cifra}
            texto={CAPACIDAD.balance[idioma]}
            procedencia="real"
            chip={CAPACIDAD.balanceChip[idioma]}
          />
          <Cifra
            cifra="0"
            texto={CAPACIDAD.llamadas[idioma]}
            procedencia="declarado"
            chip={PROCEDENCIA.declarado[idioma]}
          />
        </div>
      </div>
      <BloqueExperto rotulo={PERFIL.experto[idioma]} className="mt-6">
        <h3 className="mb-2 flex items-center gap-2 text-texto font-medium">
          <Icono de={Microscope} />
          {COMO_FUNCIONA.sostiene[idioma]}
        </h3>
        <dl className="grid grid-cols-1 tableta:grid-cols-[minmax(0,132px)_minmax(0,1fr)]">
          {sostiene.map(([dt, dd]) => (
            <div key={dt} className="contents">
              <dt className="border-t border-linea py-1.75 pr-3 text-chico leading-normal text-tinta-2">
                {dt}
              </dt>
              <dd className="pb-1.75 text-chico leading-normal [overflow-wrap:anywhere] text-tinta-1 tableta:border-t tableta:border-linea tableta:pt-1.75">
                {dd}
              </dd>
            </div>
          ))}
        </dl>
      </BloqueExperto>
    </Seccion>
  );
}
