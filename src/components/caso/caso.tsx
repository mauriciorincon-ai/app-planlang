import {
  ArrowRight,
  Braces,
  Check,
  CircleAlert,
  ClipboardList,
  Cpu,
  FileText,
  Fingerprint,
  Inbox,
  Info,
  Send,
  ShieldCheck,
  Split,
  UserCheck,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { Fragment, type CSSProperties, type ReactNode } from "react";
import type { Idioma } from "@core/formatos/bilingue";
import type { FilaRegla, PasoCaso, VistaCaso } from "@/lib/vista/caso";
import {
  CABECERA,
  DOCUMENTO,
  ENTREGA,
  FICHA,
  HACE,
  PAUSA,
  RECIBE,
  RECORRIDO,
  SALIDA,
  SENALES,
  SI_NO,
} from "@/textos/caso";
import { PERFIL } from "@/textos/comun";
import {
  ColumnaIpo,
  Definiciones,
  FlechaIpo,
  GrupoT,
  RefNodo,
} from "../agente/piezas";
import { Chip } from "../chip";
import { ConCodigo } from "../con-codigo";
import { cx } from "../cx";
import { Icono } from "../icono";
import { Marca } from "../marcas";
import { BloqueExperto } from "../perfil/bloque-experto";
import { Seccion } from "../seccion";
import { Veredicto } from "../veredicto";

const RELIGUITA =
  "font-mono text-dato leading-normal text-tinta-2 [overflow-wrap:anywhere]";
const ET = "mb-1 block text-dato text-tinta-2";
const CAJA =
  "rounded-control border border-linea bg-sup-1 px-4 py-3.5 text-chico leading-relaxed";

/** Un identificador largo se parte solo después de un guion bajo (en la tabla de reglas del teléfono). */
function ConCortes({ texto }: { texto: string }) {
  const partes = texto.split("_");
  return (
    <>
      {partes.map((p, k) => (
        <Fragment key={k}>
          {p}
          {k < partes.length - 1 ? (
            <>
              _<wbr />
            </>
          ) : null}
        </Fragment>
      ))}
    </>
  );
}

function ItemIcono({
  icono,
  titulo,
  children,
}: {
  icono: LucideIcon;
  titulo: ReactNode;
  children?: ReactNode;
}) {
  return (
    <li className="grid grid-cols-[16px_minmax(0,1fr)] items-start gap-2.5 border-t border-linea py-2.25 text-apoyo leading-[1.45] first:border-t-0 first:pt-0">
      <Icono de={icono} tam={15} className="mt-0.5 text-tinta-2" />
      <div className="min-w-0">
        {titulo}
        {children}
      </div>
    </li>
  );
}

function Cabecera({ v, idioma }: { v: VistaCaso; idioma: Idioma }) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          {v.ejemplar ? (
            <p className="mb-3 text-chico text-tinta-2">{v.ejemplar}</p>
          ) : null}
          <h2 id="c-caso" className="flex items-baseline gap-3 text-seccion">
            <span className="font-mono text-texto leading-none font-medium text-tinta-2">
              {v.id}
            </span>
            {v.descriptor}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Veredicto clase={v.aprobado ? "cumple" : "no-cumple"}>
            {v.veredicto}
          </Veredicto>
          <span className="inline-flex h-5 items-center gap-1.25 rounded-chip border border-tinta-3 px-1.75 text-dato leading-none font-medium whitespace-nowrap text-tinta-2">
            <Icono de={v.persona ? UserCheck : Cpu} tam={14} />
            {v.personaTexto}
          </span>
          <span className="inline-flex h-5 items-center gap-1.25 rounded-chip border border-tinta-3 px-1.75 text-dato leading-none font-medium whitespace-nowrap text-tinta-2">
            <Marca
              tipo={v.coincide ? "cumple" : "falta"}
              tam={14}
              className="text-tinta-1"
            />
            {v.coincideTexto}
          </span>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 border-y border-linea py-4 chico:grid-cols-2">
        <div>
          <span className={ET}>{CABECERA.debia[idioma]}</span>
          <p className="text-texto leading-[1.55]">{v.debia}</p>
        </div>
        <div>
          <span className={ET}>{CABECERA.paso[idioma]}</span>
          <p className="text-texto leading-[1.55]">{v.paso}</p>
        </div>
      </div>
    </>
  );
}

function Ipo({ v, idioma }: { v: VistaCaso; idioma: Idioma }) {
  const [antes, carga, despues] = v.recibe.texto;
  return (
    <div className="mt-6 grid grid-cols-1 amplio:grid-cols-[minmax(0,4fr)_28px_minmax(0,5fr)_28px_minmax(0,4fr)]">
      <ColumnaIpo icono={Inbox} titulo={RECIBE.titulo[idioma]} sub="">
        <ul className="grid list-none p-0">
          <ItemIcono icono={FileText} titulo={RECIBE.texto[idioma]}>
            <blockquote className="mt-2 border-l-2 border-tinta-3 bg-sup-1 px-3 py-2.5 text-chico leading-relaxed">
              {antes}
              {carga ? (
                <mark className="rounded-mini border border-dashed border-tinta-2 bg-transparent px-1 py-px text-tinta-1 [box-decoration-break:clone]">
                  <Marca
                    tipo="alerta"
                    tam={12}
                    className="mr-1 inline align-[-1px]"
                  />
                  <span className="sr-only">{RECIBE.inyeccion[idioma]}: </span>
                  {carga}
                </mark>
              ) : null}
              {despues}
            </blockquote>
          </ItemIcono>
          <ItemIcono icono={ClipboardList} titulo={RECIBE.orden[idioma]}>
            <small className="mt-0.75 block text-dato leading-normal text-tinta-2">
              {v.recibe.orden}
            </small>
          </ItemIcono>
          <ItemIcono icono={Users} titulo={v.recibe.afiliado}>
            <small className="mt-0.75 block text-dato leading-normal text-tinta-2">
              {RECIBE.enmascarado[idioma]}
            </small>
          </ItemIcono>
        </ul>
      </ColumnaIpo>
      <FlechaIpo />
      <ColumnaIpo
        icono={Workflow}
        titulo={HACE.titulo[idioma]}
        sub={v.hace.sub}
      >
        <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {v.hace.nodos.map((n, k) => (
            <Fragment key={`${n.nombre}-${k}`}>
              {k > 0 ? (
                <Icono de={ArrowRight} tam={10} trazo="var(--tinta-3)" />
              ) : null}
              <RefNodo nombre={n.nombre} tipo={n.tipo} />
            </Fragment>
          ))}
        </span>
        <p className="mt-3 text-chico leading-relaxed">{v.hace.relato}</p>
      </ColumnaIpo>
      <FlechaIpo />
      <ColumnaIpo icono={Send} titulo={ENTREGA.titulo[idioma]} sub="">
        <ul className="grid list-none p-0">
          {v.entrega.map((x, k) => (
            <ItemIcono
              key={x.titulo}
              icono={k === 0 ? Send : x.detalle ? Fingerprint : FileText}
              titulo={x.titulo}
            >
              {x.detalle ? (
                <small className="mt-0.75 block font-mono text-dato text-tinta-2">
                  {x.detalle}
                </small>
              ) : null}
            </ItemIcono>
          ))}
        </ul>
      </ColumnaIpo>
    </div>
  );
}

function Cifras({ v }: { v: VistaCaso }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 escritorio:grid-cols-5">
      {v.cifras.map((c) => (
        <div key={c.texto} className="grid content-start gap-1">
          <b className="text-cifra-chica font-semibold tracking-apretado tabular-nums">
            {c.cifra}
          </b>
          <span className="text-dato leading-[1.35] text-tinta-2">
            {c.texto}
          </span>
        </div>
      ))}
    </div>
  );
}

const COLS_REGLAS =
  "24px minmax(0,1.4fr) minmax(0,1.1fr) minmax(0,1.2fr) 64px minmax(0,1fr)";

function TablaReglas({
  reglas,
  idioma,
}: {
  reglas: readonly FilaRegla[];
  idioma: Idioma;
}) {
  const col = RECORRIDO.columnas.map((c) => c[idioma]);
  const FILA =
    "grid grid-cols-2 items-start gap-x-3 gap-y-1 border-t border-linea py-3 text-chico escritorio:grid-cols-[var(--cols)] escritorio:items-center escritorio:py-2.25";
  const ET_M =
    "block font-letra text-dato leading-[1.4] text-tinta-2 escritorio:hidden";
  const M = "font-mono text-dato leading-normal [overflow-wrap:anywhere]";
  return (
    <div
      role="table"
      className="grid"
      style={{ "--cols": COLS_REGLAS } as CSSProperties}
    >
      <div
        role="row"
        className="hidden gap-3 pb-1.5 text-dato text-tinta-2 escritorio:grid escritorio:grid-cols-[var(--cols)]"
      >
        {col.map((c) => (
          <span key={c} role="columnheader">
            {c}
          </span>
        ))}
      </div>
      {reglas.map((r) => (
        <div
          key={r.n}
          role="row"
          data-toma={r.rama !== null}
          className={cx(FILA, r.rama !== null && "bg-sup-1")}
        >
          <span
            role="cell"
            className={cx(M, "col-span-2 escritorio:col-span-1")}
          >
            {r.n}
          </span>
          <span role="cell" className={M}>
            <span className={ET_M}>{col[1]}</span>
            <ConCortes texto={r.senal} />
          </span>
          <span role="cell" className={M}>
            <span className={ET_M}>{col[2]}</span>
            {r.funcion ? (
              <span className="font-letra text-tinta-2">{r.regla}</span>
            ) : (
              r.regla
            )}
          </span>
          <span role="cell" className={M}>
            <span className={ET_M}>{col[3]}</span>
            {r.observado}
          </span>
          <span role="cell">
            <span className={ET_M}>{col[4]}</span>
            <span
              className={cx(
                "inline-flex items-center gap-1 text-dato",
                r.cumple ? "text-tinta-1" : "text-tinta-2",
              )}
            >
              {r.cumple ? <Marca tipo="cumple" tam={12} /> : null}
              {r.cumple ? SI_NO.si[idioma] : SI_NO.no[idioma]}
            </span>
          </span>
          <span role="cell" className={M}>
            <span className={ET_M}>{col[5]}</span>
            {r.rama ? <ConCortes texto={r.rama} /> : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

function Paso({ p, idioma }: { p: PasoCaso; idioma: Idioma }) {
  return (
    <li
      id={`paso-${p.n}`}
      className="grid scroll-mt-6 grid-cols-[28px_minmax(0,1fr)] gap-x-3.5 gap-y-1 border-t border-linea py-3.5"
    >
      <span className="row-span-2 font-mono text-dato leading-[1.9] font-medium text-tinta-2">
        {p.n}
      </span>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <RefNodo nombre={p.nodo} tipo={p.tipo} />
        <span className="font-mono text-dato leading-[1.4] text-tinta-2">
          {p.medida}
        </span>
      </div>
      <div className="grid min-w-0 gap-2 text-chico leading-[1.55]">
        <div>
          <p>{p.hizo}</p>
          {p.dialogo.map((d) => (
            <div
              key={d.pregunta}
              className="mt-1.5 grid gap-1.5 border-l-2 border-tinta-3 bg-sup-1 px-3 py-2"
            >
              <p>
                <b className="mr-1.5 font-medium">
                  {RECORRIDO.pregunta[idioma]}
                </b>
                <span lang="es">«{d.pregunta}»</span>
              </p>
              <p>
                <b className="mr-1.5 font-medium">
                  {RECORRIDO.respuesta[idioma]}
                </b>
                <span lang="es">«{d.respuesta}»</span>
              </p>
              {RECORRIDO.original[idioma] ? (
                <small className="text-dato text-tinta-2">
                  {RECORRIDO.original[idioma]}
                </small>
              ) : null}
            </div>
          ))}
        </div>
        <p className={cx("solo-experto", RELIGUITA)}>{p.tecnico}</p>
        {p.rama ? (
          <p className="flex items-start gap-2 text-tinta-1">
            <Icono de={ArrowRight} tam={14} className="mt-0.75" />
            {p.rama}
          </p>
        ) : null}
        {p.reglas.length ? (
          <BloqueExperto rotulo={PERFIL.experto[idioma]} sutil>
            <TablaReglas reglas={p.reglas} idioma={idioma} />
          </BloqueExperto>
        ) : null}
      </div>
    </li>
  );
}

/** Un caso de punta a punta: cabecera, recibe → hace → entrega, recorrido, pausa, respuesta, documento y señales. */
export function Caso({ v, idioma }: { v: VistaCaso; idioma: Idioma }) {
  return (
    <>
      <section aria-labelledby="c-caso" className="pt-8 pb-10">
        <Cabecera v={v} idioma={idioma} />
        <Ipo v={v} idioma={idioma} />
        <Cifras v={v} />
        <BloqueExperto rotulo={PERFIL.experto[idioma]} className="mt-6">
          <h3 className="mb-2 flex items-center gap-2 text-sub font-semibold">
            <Icono de={Cpu} className="text-tinta-2" />
            {FICHA.titulo[idioma]}
          </h3>
          <Definiciones filas={v.ficha} />
        </BloqueExperto>
      </section>

      <Seccion
        id="c-rec"
        titulo={RECORRIDO.titulo[idioma]}
        cabecera={<Chip procedencia="real">{RECORRIDO.chip[idioma]}</Chip>}
      >
        <p className="mb-6 max-w-[72ch] text-texto">
          {RECORRIDO.lectura[idioma]}
        </p>
        <ol className="grid list-none p-0">
          {v.pasos.map((p) => (
            <Paso key={p.n} p={p} idioma={idioma} />
          ))}
        </ol>
      </Seccion>

      {v.pausa ? (
        <Seccion
          id="c-pausa"
          titulo={PAUSA.titulo[idioma]}
          cabecera={<Chip procedencia="real">{PAUSA.chip[idioma]}</Chip>}
        >
          <p className="mb-6 max-w-[72ch] text-texto">
            {PAUSA.lectura[idioma]}
          </p>
          <div className="grid grid-cols-1 items-start gap-x-12 gap-y-6 amplio:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <div className="grid gap-4">
              <GrupoT icono={CircleAlert} titulo={PAUSA.porQue[idioma]}>
                <p className="border-l-2 border-linea pl-3 text-apoyo leading-normal">
                  {v.pausa.porQue}
                </p>
                <p className={cx("solo-experto", RELIGUITA)}>
                  {PAUSA.motivo[idioma]} {v.pausa.motivoTecnico}
                </p>
                <p className={cx("solo-experto", RELIGUITA)}>{v.pausa.senal}</p>
              </GrupoT>
              <GrupoT icono={Check} titulo={PAUSA.evidencia[idioma]}>
                <ListaEv items={v.pausa.evidencia} icono={Check} />
              </GrupoT>
              <GrupoT icono={Split} titulo={PAUSA.contraevidencia[idioma]}>
                <ListaEv items={v.pausa.contraevidencia} icono={Split} />
              </GrupoT>
            </div>
            <div className="grid gap-4">
              <GrupoT icono={Braces} titulo={PAUSA.leyo[idioma]}>
                <p className={RELIGUITA}>{v.pausa.leyo}</p>
              </GrupoT>
              <div className={CAJA}>
                <span className={ET}>{PAUSA.respondio[idioma]}</span>
                <p>
                  <b className="font-mono text-texto leading-[1.4] font-medium">
                    {v.pausa.respuesta}
                  </b>
                </p>
                <p className="mt-1 text-chico text-tinta-2">{v.pausa.nota}</p>
              </div>
            </div>
          </div>
        </Seccion>
      ) : null}

      <Seccion
        id="c-salida"
        titulo={SALIDA.titulo[idioma]}
        cabecera={<Chip procedencia="real">{SALIDA.chip[idioma]}</Chip>}
      >
        <div className="grid grid-cols-1 items-start gap-x-12 gap-y-6 amplio:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className={CAJA}>
            <span className={ET}>{SALIDA.recibe[idioma]}</span>
            <p className="text-texto">{v.salida.respuesta}</p>
            {v.salida.aviso ? (
              <p className="mt-2.5 grid grid-cols-[16px_minmax(0,1fr)] gap-2 border-t border-linea pt-2.5 text-dato text-tinta-2">
                <Icono de={Info} tam={14} className="mt-0.5" />
                {v.salida.aviso}
              </p>
            ) : null}
          </div>
          <GrupoT icono={ShieldCheck} titulo={SALIDA.guardia[idioma]}>
            <Definiciones filas={v.salida.guardia} />
          </GrupoT>
        </div>
      </Seccion>

      {v.documento ? (
        <Seccion
          id="c-doc"
          titulo={DOCUMENTO.titulo[idioma]}
          cabecera={<Chip procedencia="real">{DOCUMENTO.chip[idioma]}</Chip>}
        >
          <p className="mb-6 max-w-[72ch] text-texto">
            {DOCUMENTO.lectura[idioma]}
          </p>
          <article className="max-w-[820px] rounded-control border border-tinta-3 bg-sup-1">
            <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-linea px-4.5 py-3 text-chico font-semibold">
              <span>{DOCUMENTO.cabecera[idioma]}</span>
              <span className="font-mono text-dato leading-[1.4] font-normal text-tinta-2">
                {v.documento.encabezado}
              </span>
            </header>
            <dl className="m-0 grid grid-cols-1 px-4.5 py-1.5 chico:grid-cols-[minmax(0,170px)_minmax(0,1fr)]">
              {v.documento.filas.map((f, k) => (
                <div key={f.k} className="contents">
                  <dt
                    className={cx(
                      "py-2.25 pr-3 text-chico leading-[1.55] text-tinta-2",
                      k > 0 && "border-t border-linea",
                    )}
                  >
                    {f.k}
                  </dt>
                  <dd
                    className={cx(
                      "m-0 pb-2.25 text-chico leading-[1.55] chico:pt-2.25",
                      k > 0 && "chico:border-t chico:border-linea",
                    )}
                  >
                    <ConCodigo texto={f.v} />
                    {f.nota ? (
                      <small className="block text-chico text-tinta-2">
                        {f.nota}
                      </small>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
            <footer className="grid grid-cols-[16px_minmax(0,1fr)] items-start gap-2 border-t border-linea px-4.5 py-3 text-dato text-tinta-2">
              <Icono de={Info} tam={14} className="mt-0.5" />
              {v.documento.aviso}
            </footer>
          </article>
          <BloqueExperto
            rotulo={PERFIL.experto[idioma]}
            sutil
            className="max-w-[820px]"
          >
            <p className={RELIGUITA}>{v.documento.completo}</p>
          </BloqueExperto>
        </Seccion>
      ) : null}

      <Seccion id="c-sen" titulo={v.senalesTitulo} className="solo-experto">
        <BloqueExperto rotulo={PERFIL.experto[idioma]}>
          <p className="mb-2 text-chico text-tinta-2">{SENALES.nota[idioma]}</p>
          <dl className="m-0 grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            {v.senales.map((f) => (
              <div key={f.k} className="contents">
                <dt className="border-t border-linea py-2 font-mono text-dato">
                  {f.k}
                </dt>
                <dd className="m-0 border-t border-linea py-2 font-mono text-dato [overflow-wrap:anywhere]">
                  {f.v}
                </dd>
              </div>
            ))}
          </dl>
        </BloqueExperto>
      </Seccion>
    </>
  );
}

function ListaEv({
  items,
  icono,
}: {
  items: readonly string[];
  icono: LucideIcon;
}) {
  return (
    <ul className="grid list-none gap-1.5 p-0 text-chico leading-normal">
      {items.map((x) => (
        <li key={x} className="grid grid-cols-[16px_minmax(0,1fr)] gap-2">
          <Icono de={icono} tam={14} className="mt-0.75 text-tinta-2" />
          {x}
        </li>
      ))}
    </ul>
  );
}
