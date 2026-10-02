import {
  ClipboardPenLine,
  Cpu,
  GitBranch,
  Inbox,
  Landmark,
  Send,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { Idioma } from "@core/formatos/bilingue";
import type { SeccionPlan, VistaPlan } from "@/lib/vista/plan";
import {
  CIFRAS,
  CONTRATO,
  ENTREGA,
  FICHA_TECNICA,
  HACE,
  INDICE,
  MIRADA,
  PARTE_DE,
  SECCIONES,
  VER_MAS,
} from "@/textos/plan";
import { PERFIL } from "@/textos/comun";
import {
  ColumnaIpo,
  Definiciones,
  FlechaIpo,
  GrupoT,
  ItemEst,
  ListaEst,
  MarcaCorrio,
  RefNodo,
} from "../agente/piezas";
import { Baldosa } from "../baldosa";
import { Chip } from "../chip";
import { cx } from "../cx";
import { Icono } from "../icono";
import { AvisoPerfil } from "../perfil/aviso-perfil";
import { BloqueExperto } from "../perfil/bloque-experto";
import { LeerComo } from "../perfil/leer-como";
import { Seccion } from "../seccion";
import { VerMas } from "../ver-mas";
import { FilaPlan } from "./fila";
import { TituloNumerado } from "../titulo-numerado";

const ICONO_PARTE: Record<VistaPlan["parteDe"][number]["clave"], LucideIcon> = {
  problema: Target,
  dominio: Landmark,
  participan: Users,
};

const RELIGUITA =
  "font-mono text-dato leading-normal text-tinta-2 [overflow-wrap:anywhere]";

/** Título de sección con su número, como en la maqueta (`.sec-num`). */

/** «El plan en una mirada»: perfil, para qué, parte de → hace → entrega, las cifras y la ficha técnica. */
export function MiradaPlan({ v, idioma }: { v: VistaPlan; idioma: Idioma }) {
  return (
    <section aria-labelledby="s-ficha-t" className="border-t border-linea pt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h2 id="s-ficha-t" className="text-seccion">
          {MIRADA.titulo[idioma]}
        </h2>
        <LeerComo
          rotulo={PERFIL.leerComo[idioma]}
          lider={PERFIL.lider[idioma]}
          experto={PERFIL.experto[idioma]}
        />
      </div>
      <AvisoPerfil
        lider={{
          titulo: PERFIL.leesComoLider[idioma],
          texto: MIRADA.avisoLider[idioma],
          boton: PERFIL.verComoExperto[idioma],
        }}
        experto={{
          titulo: PERFIL.leesComoExperto[idioma],
          texto: MIRADA.avisoExperto[idioma],
          boton: PERFIL.volverALider[idioma],
        }}
      />

      <div className="mt-6 grid grid-cols-[36px_minmax(0,1fr)] items-start gap-x-3.5 gap-y-0.5">
        <span className="row-span-2">
          <Baldosa icono={Target} />
        </span>
        <span className="text-chico text-tinta-2">
          {MIRADA.paraQue[idioma]}
        </span>
        <p className="max-w-objetivo text-texto">{v.paraQue}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 amplio:grid-cols-[minmax(0,4fr)_28px_minmax(0,5fr)_28px_minmax(0,4fr)]">
        <ColumnaIpo icono={Inbox} titulo={PARTE_DE.titulo[idioma]} sub="">
          <ListaEst>
            {v.parteDe.map((x) => (
              <ItemEst
                key={x.clave}
                inicio={
                  <Icono
                    de={ICONO_PARTE[x.clave]}
                    tam={15}
                    className="mt-0.5 text-tinta-2"
                  />
                }
                titulo={x.titulo}
                detalle={x.detalle}
              />
            ))}
          </ListaEst>
        </ColumnaIpo>
        <FlechaIpo />
        <ColumnaIpo
          icono={ClipboardPenLine}
          titulo={HACE.titulo[idioma]}
          sub={v.hace.sub}
        >
          <ListaEst numerada>
            {v.hace.pasos.map((paso, k) => (
              <ItemEst
                key={paso}
                inicio={
                  <span className="font-mono text-dato leading-[1.9] font-medium text-tinta-2">
                    {k + 1}
                  </span>
                }
                fin={
                  v.hace.hecho ? (
                    <MarcaCorrio texto={HACE.hecho[idioma]} />
                  ) : undefined
                }
                titulo={paso}
              />
            ))}
          </ListaEst>
        </ColumnaIpo>
        <FlechaIpo />
        <ColumnaIpo icono={Send} titulo={ENTREGA.titulo[idioma]} sub="">
          <ListaEst>
            {v.entrega.map((x) => (
              <ItemEst
                key={x.titulo}
                inicio={<MarcaCorrio texto={HACE.hecho[idioma]} />}
                titulo={x.titulo}
                detalle={x.detalle}
              />
            ))}
          </ListaEst>
        </ColumnaIpo>
      </div>

      <ul
        aria-label={CIFRAS.rotulo[idioma]}
        className="m-0 mt-6 grid list-none grid-cols-2 gap-4 p-0 escritorio:grid-cols-5"
      >
        {v.cifras.map((c) => (
          <li key={c.href} className="border-t border-linea pt-2.5">
            <a
              href={c.href}
              className="group/cifra grid content-start gap-0.5 text-tinta-1 no-underline"
            >
              <b className="text-cifra leading-[1.1] font-semibold tabular-nums">
                {c.cifra}
              </b>
              <span className="text-chico group-hover/cifra:underline group-hover/cifra:underline-offset-3">
                {c.texto}
              </span>
              <small className="text-dato text-tinta-2">{c.detalle}</small>
            </a>
          </li>
        ))}
      </ul>

      <BloqueExperto rotulo={PERFIL.experto[idioma]} className="mt-6">
        <GrupoT icono={Cpu} titulo={FICHA_TECNICA.titulo[idioma]}>
          <Definiciones filas={v.ficha} />
        </GrupoT>
      </BloqueExperto>
    </section>
  );
}

/** Índice de las partes del plan: pestañas que llevan a cada sección. */
export function IndicePlan({ v, idioma }: { v: VistaPlan; idioma: Idioma }) {
  const partes = [
    ...v.secciones.map((s) => ({ id: s.id, n: s.n, titulo: s.indice })),
    {
      id: "p-cg",
      n: v.secciones.length + 1,
      titulo: SECCIONES.contrato.indice[idioma],
    },
  ];
  return (
    <nav
      aria-label={INDICE.rotulo[idioma]}
      className="mt-10 border-t border-linea pt-6"
    >
      <ol className="m-0 flex list-none flex-wrap gap-1.5 p-0">
        {partes.map((p) => (
          <li key={p.id}>
            <a
              href={`#${p.id}`}
              className="inline-flex h-7 items-center gap-1.5 rounded-chip border border-linea bg-sup-1 px-2.5 text-chico text-tinta-1 no-underline hover:border-tinta-3"
            >
              <span className="font-mono text-dato leading-none font-medium text-tinta-2">
                {p.n}
              </span>
              {p.titulo}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Una sección del plan: título numerado, procedencia, lectura, los primeros renglones y «Ver N más». */
export function SeccionDelPlan({
  s,
  idioma,
}: {
  s: SeccionPlan;
  idioma: Idioma;
}) {
  const experto = PERFIL.experto[idioma];
  return (
    <Seccion
      id={s.id}
      titulo={<TituloNumerado n={s.n} titulo={s.titulo} />}
      cabecera={<Chip procedencia="real">{s.chip}</Chip>}
      className="scroll-mt-6"
    >
      <p className="mb-6 max-w-[72ch] text-texto">{s.lectura}</p>
      <div className="grid">
        {s.visibles.map((f) => (
          <FilaPlan key={f.id} f={f} experto={experto} />
        ))}
        {s.mas ? (
          <VerMas id={`mas-${s.id}`} mas={s.mas} menos={VER_MAS.menos[idioma]}>
            {s.resto.map((f) => (
              <FilaPlan key={f.id} f={f} experto={experto} />
            ))}
          </VerMas>
        ) : null}
      </div>
    </Seccion>
  );
}

const COLS_CONTRATO =
  "minmax(0,1.1fr) 32px minmax(0,2.4fr) minmax(0,1.1fr) minmax(0,1fr)";

/**
 * Las aristas condicionales, en orden: en escritorio, una tabla de cinco columnas; en el teléfono, una tarjeta por
 * regla con el nodo arriba y los demás campos rotulados de a dos (como la tabla de reglas de un caso).
 */
function TablaContrato({
  filas,
  idioma,
}: {
  filas: VistaPlan["contrato"]["tabla"];
  idioma: Idioma;
}) {
  const col = CONTRATO.columnas.map((c) => c[idioma]);
  const ET =
    "block font-letra text-dato leading-[1.4] text-tinta-2 escritorio:hidden";
  const M = "font-mono text-dato leading-normal [overflow-wrap:anywhere]";
  return (
    <div className="grid" style={{ "--cols": COLS_CONTRATO } as CSSProperties}>
      <div className="hidden gap-3 pb-1.5 text-dato text-tinta-2 escritorio:grid escritorio:grid-cols-[var(--cols)]">
        {col.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      {filas.map((r) => (
        <div
          key={`${r.desde}-${r.n}`}
          className="grid grid-cols-2 items-start gap-x-3 gap-y-1.5 border-t border-linea py-3 escritorio:grid-cols-[var(--cols)] escritorio:py-2.25"
        >
          <span className={cx(M, "col-span-2 escritorio:col-span-1")}>
            {r.desde}
          </span>
          <span className={M}>
            <span className={ET}>{col[1]}</span>
            {r.n}
          </span>
          <span className={M}>
            <span className={ET}>{col[2]}</span>
            {r.regla}
          </span>
          <span className={M}>
            <span className={ET}>{col[3]}</span>
            {r.si}
          </span>
          <span className={M}>
            <span className={ET}>{col[4]}</span>
            {r.no}
          </span>
        </div>
      ))}
    </div>
  );
}

/** «El contrato del grafo»: las piezas exigidas, el flujo y, para el experto, las reglas arista por arista. */
export function SeccionContrato({
  v,
  idioma,
}: {
  v: VistaPlan;
  idioma: Idioma;
}) {
  const c = v.contrato;
  const n = v.secciones.length + 1;
  return (
    <Seccion
      id="p-cg"
      titulo={
        <TituloNumerado n={n} titulo={SECCIONES.contrato.titulo[idioma]} />
      }
      cabecera={<Chip procedencia="real">{v.secciones[0]!.chip}</Chip>}
      className="scroll-mt-6"
    >
      <p className="mb-6 max-w-[72ch] text-texto">
        {SECCIONES.contrato.lectura[idioma]}
      </p>
      <div className="grid grid-cols-1 items-start gap-x-12 gap-y-6 amplio:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="grid gap-5">
          <div>
            <p className="mb-2 text-chico text-tinta-2">{c.piezasTitulo}</p>
            <p className="flex flex-wrap gap-x-2 gap-y-1.5">
              {c.piezas.map((p) => (
                <RefNodo key={p.nombre} nombre={p.nombre} tipo={p.tipo} />
              ))}
            </p>
          </div>
          <div>
            <p className="mb-2 text-chico text-tinta-2">{c.flujoTitulo}</p>
            <ol className="m-0 grid list-none p-0">
              {c.flujo.map((paso, k) => (
                <li
                  key={paso}
                  className="grid grid-cols-[28px_minmax(0,1fr)] border-t border-linea py-2.5 text-apoyo leading-[1.45] first:border-t-0 first:pt-0"
                >
                  <span className="font-mono text-dato leading-[1.9] font-medium text-tinta-2">
                    {k + 1}
                  </span>
                  {paso}
                </li>
              ))}
            </ol>
          </div>
        </div>
        <aside className="grid grid-cols-[18px_minmax(0,1fr)] items-start gap-3 text-chico leading-relaxed text-tinta-2">
          <Icono de={GitBranch} tam={18} className="text-tinta-1" />
          <p>
            <b className="block font-medium text-tinta-1">
              {CONTRATO.apartadoTitulo[idioma]}
            </b>
            {c.apartado}{" "}
            <span className="solo-lider">{CONTRATO.conExperto[idioma]}</span>
            <span className="solo-experto">{CONTRATO.abajo[idioma]}</span>
          </p>
        </aside>
      </div>

      <BloqueExperto rotulo={PERFIL.experto[idioma]} className="mt-6">
        <GrupoT icono={GitBranch} titulo={c.tablaTitulo}>
          <TablaContrato filas={c.tabla} idioma={idioma} />
          <div className="mt-2 grid gap-1">
            {c.lineas.map((l) => (
              <p key={l} className={RELIGUITA}>
                {l}
              </p>
            ))}
          </div>
        </GrupoT>
      </BloqueExperto>
    </Seccion>
  );
}
