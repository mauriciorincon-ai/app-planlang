import {
  ArrowRight,
  Ban,
  Braces,
  Check,
  ClipboardList,
  Cpu,
  Database,
  Gauge,
  History,
  Inbox,
  Layers,
  ListChecks,
  Ruler,
  Send,
  Stethoscope,
  Target,
  UserCheck,
  UserRound,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Idioma } from "@core/formatos/bilingue";
import type { Cifra, Item, VistaAgente } from "@/lib/vista/agente";
import { EXPERTO, FICHA } from "@/textos/agente";
import { PERFIL, PROCEDENCIA } from "@/textos/comun";
import { Baldosa } from "../baldosa";
import { Chip } from "../chip";
import { cx } from "../cx";
import { Icono } from "../icono";
import { LeerComo } from "../perfil/leer-como";
import { Seccion } from "../seccion";
import { BloqueCodigo } from "./codigo";
import {
  Definiciones,
  GrupoT,
  IconoFila,
  ItemEst,
  ListaEst,
  MarcaCorrio,
  RefNodo,
} from "./piezas";

/** Íconos de los grupos técnicos, en el orden de `vista.experto.grupos` (maqueta). */
const ICONOS_GRUPO: LucideIcon[] = [
  Layers,
  Workflow,
  Cpu,
  Braces,
  Database,
  History,
  Ruler,
];
/** Cuántos grupos van en la primera columna del perfil experto. */
const GRUPOS_COLUMNA_1 = 4;

const ICONO_ACTOR: Record<string, LucideIcon> = {
  medico: Stethoscope,
  afiliado: UserRound,
  auditor: UserCheck,
  plan_beneficios: ClipboardList,
  agente: Workflow,
};

function Columna({
  icono,
  titulo,
  sub,
  children,
}: {
  icono: LucideIcon;
  titulo: string;
  sub: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-w-0 content-start gap-3 rounded-baldosa border border-linea bg-sup-1 px-4.5 py-4">
      <div className="flex items-center gap-2.5">
        <Baldosa icono={icono} chica />
        <h3 className="flex-1 text-sub font-semibold">{titulo}</h3>
        <small className="text-right text-dato text-tinta-2">{sub}</small>
      </div>
      {children}
    </div>
  );
}

/** Flecha entre columnas: de lado en escritorio, hacia abajo cuando se apilan. */
function Flecha() {
  return (
    <span className="grid h-7 place-items-center text-tinta-2 amplio:h-auto">
      <Icono de={ArrowRight} className="rotate-90 amplio:rotate-0" />
    </span>
  );
}

function Bloque({
  icono,
  titulo,
  sub,
  children,
}: {
  icono: LucideIcon;
  titulo: string;
  sub?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <div className="flex items-center gap-2.5">
        <Baldosa icono={icono} chica />
        <h3 className="text-sub font-semibold">{titulo}</h3>
        {sub ? (
          <small className="ml-auto text-dato text-tinta-2">{sub}</small>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function ListaCorrio({ items, marca }: { items: Item[]; marca: string }) {
  return (
    <ListaEst>
      {items.map((x) => (
        <ItemEst
          key={x.titulo}
          inicio={<MarcaCorrio texto={marca} />}
          titulo={x.titulo}
          detalle={x.detalle}
        />
      ))}
    </ListaEst>
  );
}

function CifraCapacidad({ c, idioma }: { c: Cifra; idioma: Idioma }) {
  return (
    <div className="grid min-w-0 content-start gap-1 border-t border-linea py-3.5">
      <b className="text-cifra leading-[1.1] font-semibold tracking-cifra tabular-nums">
        {c.cifra}
        {c.unidad ? ` ${c.unidad}` : null}
      </b>
      <span className="text-apoyo leading-[1.4]">{c.texto}</span>
      {c.barra !== undefined ? (
        <span
          aria-hidden="true"
          className="mt-1 mb-0.5 block h-1 overflow-hidden rounded-barra bg-linea"
        >
          <i
            className="block h-full bg-tinta-2"
            style={{ width: `${(c.barra * 100).toFixed(1)}%` }}
          />
        </span>
      ) : null}
      <small className="text-dato leading-normal text-tinta-2">
        {c.detalle}
      </small>
      {c.estimacion ? (
        <span className="justify-self-start">
          <Chip procedencia="maqueta">
            {FICHA.capacidad.estimacion[idioma]}
          </Chip>
        </span>
      ) : null}
    </div>
  );
}

function Lider({ v, idioma }: { v: VistaAgente; idioma: Idioma }) {
  const f = v.ficha;
  return (
    <div className="solo-lider cambia-perfil">
      <div className="grid grid-cols-[36px_minmax(0,1fr)] items-start gap-x-3.5 gap-y-0.5">
        <span className="row-span-2">
          <Baldosa icono={Target} />
        </span>
        <span className="text-chico text-tinta-2">
          {FICHA.objetivo.rotulo[idioma]}
        </span>
        <p className="max-w-objetivo text-texto">{f.objetivo}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 amplio:grid-cols-[minmax(0,4fr)_28px_minmax(0,5fr)_28px_minmax(0,4fr)]">
        <Columna
          icono={Inbox}
          titulo={FICHA.recibe.rotulo[idioma]}
          sub={FICHA.recibe.sub[idioma]}
        >
          <ListaCorrio items={f.recibe} marca={f.marca} />
        </Columna>
        <Flecha />
        <Columna
          icono={Workflow}
          titulo={FICHA.hace.rotulo[idioma]}
          sub={f.hace.sub}
        >
          <ListaEst numerada>
            {f.hace.items.map((a) => (
              <ItemEst
                key={a.n}
                inicio={
                  <span className="font-mono text-dato leading-[1.9] font-medium text-tinta-2">
                    {a.n}
                  </span>
                }
                fin={a.corrio ? <MarcaCorrio texto={f.marca} /> : undefined}
                titulo={a.titulo}
                detalle={
                  <>
                    {a.nodos.map((nodo, k) => (
                      <span key={nodo}>
                        {k > 0 ? (a.flecha ? " → " : " ") : null}
                        <RefNodo nombre={nodo} tipo={v.tipoDe[nodo] ?? ""} />
                      </span>
                    ))}{" "}
                    · {a.detalle}
                  </>
                }
              />
            ))}
          </ListaEst>
        </Columna>
        <Flecha />
        <Columna
          icono={Send}
          titulo={FICHA.entrega.rotulo[idioma]}
          sub={FICHA.entrega.sub[idioma]}
        >
          <ListaCorrio items={f.entrega} marca={f.marca} />
        </Columna>
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-4.5 gap-y-1.5 text-dato text-tinta-2">
        <span className="inline-flex items-center gap-1.5">
          <MarcaCorrio texto="" />
          <span>{f.marca}</span>
        </span>
        <span>{f.leyenda}</span>
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 amplio:grid-cols-3">
        <Bloque
          icono={Check}
          titulo={FICHA.puede.rotulo[idioma]}
          sub={FICHA.puede.sub[idioma]}
        >
          <ListaCorrio items={f.puede} marca={f.marca} />
        </Bloque>
        <Bloque
          icono={Ban}
          titulo={FICHA.nunca.rotulo[idioma]}
          sub={FICHA.nunca.sub[idioma]}
        >
          <ListaEst>
            {f.nunca.items.map((x) => (
              <ItemEst
                key={x.titulo}
                inicio={<IconoFila de={Ban} />}
                titulo={x.titulo}
                detalle={x.detalle}
              />
            ))}
          </ListaEst>
          <p className="text-chico text-tinta-2">{f.nunca.nota}</p>
        </Bloque>
        <Bloque icono={Users} titulo={FICHA.participan.rotulo[idioma]}>
          <ListaEst>
            {f.participan.map((x) => (
              <ItemEst
                key={x.titulo}
                inicio={<IconoFila de={ICONO_ACTOR[x.id ?? ""] ?? UserRound} />}
                titulo={x.titulo}
                detalle={x.detalle}
              />
            ))}
          </ListaEst>
        </Bloque>
      </div>

      <GrupoT
        icono={Gauge}
        titulo={FICHA.capacidad.rotulo[idioma]}
        className="mt-8"
      >
        <div className="grid grid-cols-1 gap-x-8 chico:grid-cols-2 amplio:grid-cols-3">
          {f.capacidad.map((c) => (
            <CifraCapacidad key={c.texto} c={c} idioma={idioma} />
          ))}
        </div>
      </GrupoT>
      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-dato text-tinta-2">
        {f.fuente} <Chip procedencia="real">{f.chip}</Chip>
      </p>
    </div>
  );
}

function Experto({ v, idioma }: { v: VistaAgente; idioma: Idioma }) {
  const e = v.experto;
  const grupo = (k: number) => {
    const g = e.grupos[k]!;
    return (
      <GrupoT
        key={g.rotulo}
        icono={ICONOS_GRUPO[k] ?? Layers}
        titulo={g.rotulo}
      >
        <Definiciones filas={g.filas} />
      </GrupoT>
    );
  };
  const indices = e.grupos.map((_, k) => k);
  const m = e.matriz;
  const FILA =
    "grid grid-cols-2 gap-x-3 gap-y-1 border-t border-linea py-3 font-mono text-dato leading-normal text-tinta-1 escritorio:grid-cols-[minmax(0,1.5fr)_repeat(5,minmax(0,1fr))_76px] escritorio:items-center escritorio:gap-3 escritorio:py-2";
  const ETIQUETA = "mr-1.5 font-letra text-tinta-2 escritorio:hidden";
  return (
    <div className="solo-experto cambia-perfil">
      <div className="grid grid-cols-1 gap-x-12 gap-y-8 amplio:grid-cols-2">
        <div className="grid min-w-0 content-start gap-8">
          {indices.slice(0, GRUPOS_COLUMNA_1).map(grupo)}
        </div>
        <div className="grid min-w-0 content-start gap-8">
          {indices.slice(GRUPOS_COLUMNA_1).map(grupo)}
        </div>
      </div>

      <GrupoT
        icono={ListChecks}
        titulo={EXPERTO.matriz.rotulo[idioma]}
        className="mt-12"
      >
        <p className="text-chico text-tinta-2">{m.nota}</p>
        <div
          role="table"
          aria-label={EXPERTO.matriz.rotulo[idioma]}
          className="grid"
        >
          <div
            role="row"
            className="hidden gap-3 pb-1.5 text-dato leading-normal text-tinta-2 escritorio:grid escritorio:grid-cols-[minmax(0,1.5fr)_repeat(5,minmax(0,1fr))_76px]"
          >
            {m.columnas.map((c) => (
              <span key={c} role="columnheader">
                {c}
              </span>
            ))}
          </div>
          {m.filas.map((fila) => (
            <div key={fila.nodo} role="row" className={FILA}>
              <span role="cell" className="col-span-2 escritorio:col-span-1">
                <RefNodo nombre={fila.nodo} tipo={fila.tipo} />
              </span>
              {fila.celdas.slice(0, -1).map((c, k) => (
                <span
                  key={m.columnas[k + 1]}
                  role="cell"
                  className={c === "—" ? "text-tinta-2" : undefined}
                >
                  <span className={ETIQUETA}>{m.columnas[k + 1]}</span>
                  {c}
                </span>
              ))}
              <span
                role="cell"
                className="inline-flex items-center gap-1.5 font-letra text-tinta-2"
              >
                <span className={ETIQUETA}>{m.columnas.at(-1)}</span>
                {fila.corrio ? <MarcaCorrio texto={v.ficha.marca} /> : null}
                <small className="text-chico whitespace-nowrap">{fila.celdas.at(-1)}</small>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-dato text-tinta-2">
          {m.fuente}{" "}
          <Chip procedencia="declarado">{PROCEDENCIA.declarado[idioma]}</Chip>
        </p>
      </GrupoT>

      <div className="mt-8 max-w-[760px]">
        <BloqueCodigo bloque={e.estado} />
      </div>
    </div>
  );
}

/** «El agente en una mirada»: la ficha general (líder) y la técnica (experto), según el perfil de la página. */
export function FichaAgente({
  vista,
  idioma,
}: {
  vista: VistaAgente;
  idioma: Idioma;
}) {
  return (
    <Seccion
      id="s-ficha-t"
      titulo={FICHA.titulo[idioma]}
      className={cx("pt-8")}
      cabecera={
        <LeerComo
          rotulo={PERFIL.leerComo[idioma]}
          lider={PERFIL.lider[idioma]}
          experto={PERFIL.experto[idioma]}
          rotuloVisible={false}
        />
      }
    >
      <Lider v={vista} idioma={idioma} />
      <Experto v={vista} idioma={idioma} />
    </Seccion>
  );
}
