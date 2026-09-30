import {
  ArrowRight,
  CircleAlert,
  ClipboardList,
  Cpu,
  Database,
  Gauge,
  Hourglass,
  Inbox,
  ListChecks,
  Route,
  Ruler,
  Scale,
  Send,
  ShieldCheck,
  Target,
  UserCheck,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { Idioma } from "@core/formatos/bilingue";
import type {
  ClaveCampo,
  PanelNodo as Panel,
  RefPlan,
} from "@/lib/vista/agente";
import { formaDeTipo } from "@/lib/vista/nodos";
import { PANEL } from "@/textos/agente";
import { Chip } from "../chip";
import { ConCodigo } from "../con-codigo";
import { cx } from "../cx";
import { Icono } from "../icono";
import { Glifo } from "../marcas";
import { Veredicto } from "../veredicto";
import { PanelVista, Vistas } from "../vistas";
import { BloqueCodigo } from "./codigo";
import { PestanasPanel } from "./pestanas-panel";
import {
  Definiciones,
  Etiqueta,
  GrupoT,
  PrioridadAccion,
  TarjetaNodo,
} from "./piezas";
import { TablaTrazas } from "./trazas";

const ICONO_CAMPO: Record<ClaveCampo, LucideIcon> = {
  paraQue: Target,
  como: Workflow,
  decide: Route,
  siFalla: CircleAlert,
  seMide: Ruler,
  enLaCorrida: ListChecks,
  falta: Hourglass,
  garantia: ShieldCheck,
};

/** El ícono del grupo propio de cada nodo (maqueta): por qué no usa modelo, su modelo, sus reglas o qué revisa. */
const ICONO_GRUPO_PROPIO: Record<string, LucideIcon> = {
  enrutador: ShieldCheck,
  extractor: Cpu,
  aclaracion: Cpu,
  verificador_cobertura: Scale,
  decision: Route,
  pausa_humana: UserCheck,
  redactor: Cpu,
  guardia_salida: ShieldCheck,
};

/** Recibe → nodo → entrega, con el nodo en su tarjeta del lienzo. */
function FlujoNodo({ p, idioma }: { p: Panel; idioma: Idioma }) {
  const lado = (icono: LucideIcon, et: string, titulo: string, sub: string) => (
    <div className="grid min-w-0 content-center gap-1 self-stretch rounded-control border border-linea bg-sup-1 px-3.5 py-3">
      <span className="inline-flex items-center gap-1.5 text-dato text-tinta-2">
        <Icono de={icono} tam={14} />
        {et}
      </span>
      <p className="text-apoyo leading-[1.45]">{titulo}</p>
      <small className="text-dato text-tinta-2">{sub}</small>
    </div>
  );
  const flecha = (
    <span className="grid h-7 place-items-center text-tinta-2 escritorio:h-auto">
      <Icono de={ArrowRight} className="rotate-90 escritorio:rotate-0" />
    </span>
  );
  return (
    <div className="grid grid-cols-1 items-center escritorio:grid-cols-[minmax(0,1fr)_32px_minmax(180px,220px)_32px_minmax(0,1fr)]">
      {lado(
        Inbox,
        PANEL.recibe[idioma],
        p.lider.recibe.titulo,
        p.lider.recibe.sub,
      )}
      {flecha}
      <div className="min-w-50 justify-self-start escritorio:min-w-0 escritorio:justify-self-stretch">
        <TarjetaNodo
          tipo={p.tipo}
          codigo={p.codigo}
          nombre={p.nombre}
          seleccionada
        />
      </div>
      {flecha}
      {lado(
        Send,
        PANEL.entrega[idioma],
        p.lider.entrega.titulo,
        p.lider.entrega.sub,
      )}
    </div>
  );
}

function Campos({ p }: { p: Panel }) {
  return (
    <dl className="mt-6 grid grid-cols-1 gap-x-12 escritorio:grid-cols-2">
      {p.lider.campos.map((c) => (
        <div
          key={c.rotulo}
          className="grid grid-cols-1 gap-1 border-t border-linea py-3 chico:grid-cols-[148px_minmax(0,1fr)] chico:gap-3"
        >
          <dt className="flex items-start gap-2 text-chico leading-[1.45] text-tinta-2">
            <Icono de={ICONO_CAMPO[c.clave]} tam={15} className="mt-px" />
            {c.rotulo}
          </dt>
          <dd
            className={cx(
              "m-0 text-apoyo leading-normal",
              c.clave === "falta" && "text-tinta-2",
            )}
          >
            {c.texto}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function RefsPlan({ refs }: { refs: readonly RefPlan[] }) {
  return (
    <ul className="grid list-none p-0">
      {refs.map((r) => (
        <li
          key={r.id}
          className="grid grid-cols-[30px_minmax(0,1fr)] gap-x-2.5 gap-y-1 border-t border-linea py-2.25 text-chico leading-[1.45]"
        >
          <span className="font-mono text-dato leading-[1.6] font-medium text-tinta-2">
            {r.id}
          </span>
          <span>{r.texto}</span>
          {r.etiqueta || r.ap || r.factores || r.estado ? (
            <span className="col-start-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              {r.etiqueta ? (
                <Etiqueta unaVia={r.etiqueta.unaVia}>
                  {r.etiqueta.texto}
                </Etiqueta>
              ) : null}
              {r.ap ? (
                <PrioridadAccion barras={r.ap.barras} texto={r.ap.texto} />
              ) : null}
              {r.factores ? (
                <span className="font-mono text-dato leading-[1.4] text-tinta-2">
                  {r.factores}
                </span>
              ) : null}
              {r.estado ? (
                <Veredicto clase={r.estado.clase} chico>
                  {r.estado.texto}
                </Veredicto>
              ) : null}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function Experto({ p, idioma }: { p: Panel; idioma: Idioma }) {
  const e = p.experto;
  return (
    <div className="grid grid-cols-1 items-start gap-x-12 gap-y-8 amplio:grid-cols-2">
      <div className="grid min-w-0 gap-8">
        <GrupoT icono={Database} titulo={e.contrato.rotulo} nivel="h4">
          <Definiciones filas={e.contrato.filas} />
        </GrupoT>
        <GrupoT
          icono={ICONO_GRUPO_PROPIO[p.nombre] ?? Cpu}
          titulo={e.modelo.rotulo}
          nivel="h4"
        >
          <Definiciones filas={e.modelo.filas} />
        </GrupoT>
      </div>
      <div className="grid min-w-0 gap-8">
        <GrupoT
          icono={ClipboardList}
          titulo={PANEL.experto_.planExige[idioma]}
          nivel="h4"
        >
          <RefsPlan refs={e.plan} />
        </GrupoT>
        <GrupoT icono={Gauge} titulo={e.observado.rotulo} nivel="h4">
          <Definiciones filas={e.observado.filas} />
        </GrupoT>
      </div>
    </div>
  );
}

/** El detalle de un nodo: quién es, y lo que pide cada perfil (líder, experto), su código y sus trazas. */
export function PanelNodo({
  p,
  tipoDe,
  idioma,
}: {
  p: Panel;
  tipoDe: Readonly<Record<string, string>>;
  idioma: Idioma;
}) {
  const chip = <Chip procedencia="real">{p.chip}</Chip>;
  return (
    <Vistas inicial="perfil">
      <div className="grid gap-4" data-tipo={p.tipo}>
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
          <Glifo forma={formaDeTipo(p.tipo)} tam={20} className="text-c" />
          <h3 className="text-seccion">{p.nombre}</h3>
          <span className="font-mono text-dato font-medium text-tinta-2">
            {p.codigo}
          </span>
          {chip}
        </div>
        <p className="max-w-[70ch] text-guia leading-normal text-tinta-2">
          {p.rol}
        </p>
        <PestanasPanel
          rotulo={PANEL.pestanas[idioma]}
          lider={PANEL.lider[idioma]}
          experto={PANEL.experto[idioma]}
          codigo={PANEL.codigo[idioma]}
          trazas={`${PANEL.trazas[idioma]} · ${p.trazas.filas.length}`}
        />
        <PanelVista id="perfil" className="mt-1 min-w-0">
          <div className="solo-lider cambia-perfil">
            <FlujoNodo p={p} idioma={idioma} />
            <Campos p={p} />
          </div>
          <div className="solo-experto cambia-perfil">
            <Experto p={p} idioma={idioma} />
          </div>
        </PanelVista>
        <PanelVista id="codigo" className="mt-1 min-w-0">
          <div className="grid gap-6">
            {p.codigoBloques.map((b) => (
              <BloqueCodigo key={b.titulo} bloque={b} />
            ))}
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-dato text-tinta-2">
            <ConCodigo texto={p.codigoFuente} />{" "}
            <Chip procedencia="real">{PANEL.codigo_.chip[idioma]}</Chip>
          </p>
        </PanelVista>
        <PanelVista id="trazas" className="mt-1 min-w-0">
          <TablaTrazas panel={p} tipoDe={tipoDe} idioma={idioma} chip={chip} />
        </PanelVista>
      </div>
    </Vistas>
  );
}
