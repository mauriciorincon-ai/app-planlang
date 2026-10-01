/**
 * «El informe en una mirada» de P4 Brecha (maqueta `04-brecha.html`): el veredicto con su frase, el balance del plan
 * frente a la corrida, lo que falló, lo que quedó sin probar, lo que se cumplió con una nota, lo que se cumplió uno por
 * uno y cómo se obtuvo el informe. Sin lógica: pinta `src/lib/vista/brecha.ts`. Las dos lecturas (líder y experto)
 * están siempre en el árbol; el perfil las oculta por atributo (regla 5-a).
 */
import {
  ArrowRight,
  Ban,
  CircleCheck,
  CircleDashed,
  CircleX,
  Compass,
  Gauge,
  Inbox,
  ListChecks,
  Send,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Idioma } from "@core/formatos/bilingue";
import {
  columnasFallo,
  type Celda,
  type FilaFallo,
  type ItemCumplido,
  type VistaBrecha,
} from "@/lib/vista/brecha";
import { BALANCE, GRUPOS, IPO, INDICE, MIRADA } from "@/textos/brecha";
import { PERFIL } from "@/textos/comun";
import {
  ColumnaIpo,
  FlechaIpo,
  ItemEst,
  ListaEst,
  MarcaCorrio,
} from "../agente/piezas";
import { Chip } from "../chip";
import { cx } from "../cx";
import { Icono } from "../icono";
import { Marca } from "../marcas";
import { AvisoPerfil } from "../perfil/aviso-perfil";
import { LeerComo } from "../perfil/leer-como";
import { Veredicto } from "../veredicto";

const ET =
  "block font-letra text-dato leading-[1.4] text-tinta-2 escritorio:hidden";
const CODIGO = "font-mono text-dato leading-normal text-tinta-2";

/** Chip de «sin probar»: borde discontinuo y la marca de lo que falta (lo que no se midió se dibuja discontinuo). */
export function SinProbar({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-5.5 items-center gap-1.5 rounded-chip border border-dashed border-tinta-3 pr-2 pl-1.25 text-dato leading-none font-medium whitespace-nowrap text-tinta-1">
      <Marca tipo="falta" tam={12} className="text-tinta-2" />
      {children}
    </span>
  );
}

function Estado({
  clase,
  texto,
}: {
  clase: FilaFallo["clase"];
  texto: string;
}) {
  return clase === "beta" ? (
    <SinProbar>{texto}</SinProbar>
  ) : (
    <Veredicto clase={clase} chico>
      {texto}
    </Veredicto>
  );
}

/** Título de grupo con su ícono y su cuenta («Lo que falló · 2»). */
function TituloGrupo({
  icono,
  id,
  titulo,
  cuenta,
  nota,
}: {
  icono: LucideIcon;
  id?: string;
  titulo: string;
  cuenta?: ReactNode;
  nota?: ReactNode;
}) {
  return (
    <h3
      id={id}
      className="mt-10 mb-4 flex scroll-mt-6 flex-wrap items-baseline gap-x-2 gap-y-1 text-sub font-semibold"
    >
      <Icono de={icono} tam={17} className="translate-y-0.5 self-center" />
      <span>{titulo}</span>
      {cuenta !== undefined ? (
        <span className="font-medium">· {cuenta}</span>
      ) : null}
      {nota ? (
        <small className="text-chico font-normal text-tinta-2">{nota}</small>
      ) : null}
    </h3>
  );
}

/** Una cifra de la matriz: marca + número + ids; las de «Falló» y «Sin probar» llevan a su renglón. */
function CeldaBalance({
  c,
  tipo,
  sr,
  rotulo,
}: {
  c: Celda | null;
  tipo: "cumple" | "no-cumple" | "falta";
  sr: string;
  rotulo: string;
}) {
  const cuerpo = c ? (
    <>
      <Marca
        tipo={tipo}
        tam={15}
        className={tipo === "falta" ? "text-tinta-2" : "text-tinta-1"}
      />
      <span className="sr-only">{sr}</span>
      <span className={c.href ? "underline underline-offset-3" : undefined}>
        {c.cifra}
      </span>
      {c.ids ? <span className={CODIGO}>{c.ids}</span> : null}
    </>
  ) : (
    <span className="text-tinta-2">—</span>
  );
  return (
    <span className="min-w-0">
      <span className={ET}>{rotulo}</span>
      {c?.href ? (
        <a
          href={c.href}
          className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-tinta-1 no-underline hover:[&>span]:decoration-2"
        >
          {cuerpo}
        </a>
      ) : (
        <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          {cuerpo}
        </span>
      )}
    </span>
  );
}

const COLS_BALANCE =
  "escritorio:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.75fr)]";

function Balance({ v, idioma }: { v: VistaBrecha; idioma: Idioma }) {
  const B = BALANCE;
  return (
    <>
      <TituloGrupo
        icono={ListChecks}
        titulo={B.titulo[idioma]}
        cuenta={B.partes(v.balance.length)[idioma]}
        nota={B.nota[idioma]}
      />
      <div className="grid">
        <div
          className={cx(
            "hidden gap-3 pb-1.5 text-dato text-tinta-2 escritorio:grid",
            COLS_BALANCE,
          )}
        >
          <span>{B.parte[idioma]}</span>
          <span>
            {B.pide[idioma]}{" "}
            <span className="solo-experto ml-1 rounded-mini bg-sup-2 px-1">
              {B.experto[idioma]}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Marca tipo="cumple" tam={13} />
            {B.cumplio[idioma]}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Marca tipo="no-cumple" tam={13} />
            {B.fallo[idioma]}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Marca tipo="falta" tam={13} />
            {B.sinProbar[idioma]}
          </span>
        </div>
        {v.balance.map((f) => (
          <div
            key={f.clave}
            data-parte={f.clave}
            className={cx(
              "grid grid-cols-3 items-start gap-x-3 gap-y-1.5 border-t border-linea py-3 text-chico escritorio:items-center",
              COLS_BALANCE,
            )}
          >
            <span className="col-span-3 grid escritorio:col-span-1">
              <b className="font-medium">{f.parte}</b>
              <small className="text-dato text-tinta-2">{f.nota}</small>
            </span>
            <span className="col-span-3 escritorio:col-span-1">
              <span className={ET}>{B.pide[idioma]}</span>
              <span className="solo-lider text-tinta-2">{f.pideLider}</span>
              <span className="solo-experto cambia-perfil font-mono text-dato [overflow-wrap:anywhere] text-tinta-2">
                {f.pideExperto}
              </span>
            </span>
            <CeldaBalance
              c={f.cumplio}
              tipo="cumple"
              sr={B.srCumplio[idioma]}
              rotulo={B.cumplio[idioma]}
            />
            <CeldaBalance
              c={f.fallo}
              tipo="no-cumple"
              sr={B.srFallo[idioma]}
              rotulo={B.fallo[idioma]}
            />
            <CeldaBalance
              c={f.sinProbar}
              tipo="falta"
              sr={B.srSinProbar[idioma]}
              rotulo={B.sinProbar[idioma]}
            />
          </div>
        ))}
      </div>
    </>
  );
}

const COLS_FALLO =
  "escritorio:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]";

/** Un renglón de «Lo que falló» (y de «sin probar» y «con nota»): qué se planeó, qué pasó y qué significa. */
function RenglonFallo({ f, idioma }: { f: FilaFallo; idioma: Idioma }) {
  const col = columnasFallo(idioma);
  return (
    <div
      id={f.ancla}
      className={cx(
        "grid scroll-mt-6 grid-cols-1 gap-x-6 gap-y-2.5 border-t border-linea py-4",
        COLS_FALLO,
      )}
    >
      <div className="grid content-start justify-items-start gap-1.5">
        <Estado clase={f.clase} texto={f.etiqueta} />
        <h4 className="text-sub font-semibold">
          <span className="mr-1.5 font-mono text-dato font-normal text-tinta-2">
            {f.codigo}
          </span>
          {f.titulo}
        </h4>
      </div>
      {f.lider.map((l, k) => (
        <div key={k} className="min-w-0 text-chico leading-normal">
          <span className={ET}>
            <span className="solo-lider">{col.lider[k]}</span>
            <span className="solo-experto">{col.experto[k]}</span>
          </span>
          <span className="solo-lider">{l}</span>
          <span className="solo-experto cambia-perfil block font-mono text-dato [overflow-wrap:anywhere] text-tinta-2">
            {f.experto[k]}
          </span>
        </div>
      ))}
      {f.casos.length > 0 || f.enlaces.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 escritorio:col-span-3 escritorio:col-start-2">
          {f.casos.length > 0 ? (
            <span className="flex flex-wrap items-center gap-1.5 text-dato text-tinta-2">
              {col.casos}
              {f.casos.map((c) => (
                <a
                  key={c.id}
                  href={c.href}
                  className="rounded-chip border border-linea bg-sup-1 px-1.5 py-px font-mono text-tinta-1 no-underline hover:border-tinta-2"
                >
                  {c.id}
                </a>
              ))}
            </span>
          ) : null}
          {f.enlaces.map((e) => (
            <a
              key={e.href}
              href={e.href}
              className="inline-flex items-center gap-1.5 text-dato text-tinta-1 underline underline-offset-3"
            >
              <Icono de={ArrowRight} tam={13} className="text-tinta-2" />
              {e.texto}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Cabecera({ idioma }: { idioma: Idioma }) {
  const col = columnasFallo(idioma);
  return (
    <div
      className={cx(
        "hidden gap-x-6 pb-1.5 text-dato text-tinta-2 escritorio:grid",
        COLS_FALLO,
      )}
    >
      <span />
      {col.lider.map((l, k) => (
        <span key={l}>
          <span className="solo-lider">{l}</span>
          <span className="solo-experto">{col.experto[k]}</span>
        </span>
      ))}
    </div>
  );
}

function ListaCumplida({
  titulo,
  items,
}: {
  titulo: string;
  items: readonly ItemCumplido[];
}) {
  return (
    <div className="min-w-0">
      <h4 className="mb-1.5 text-chico font-normal text-tinta-2">{titulo}</h4>
      <ul className="grid list-none p-0">
        {items.map((it) => (
          <li
            key={it.codigo}
            className="grid grid-cols-[16px_44px_minmax(0,1fr)] items-start gap-x-2.5 gap-y-0.5 border-t border-linea py-2 text-chico leading-normal chico:grid-cols-[16px_44px_minmax(0,1fr)_auto]"
          >
            <Marca
              tipo={it.clase === "alerta" ? "alerta" : "cumple"}
              tam={14}
              className="mt-0.5 text-tinta-1"
            />
            <span className={CODIGO}>{it.codigo}</span>
            <span className="min-w-0">
              {it.href ? (
                <a
                  href={it.href}
                  className="text-tinta-1 underline underline-offset-3"
                >
                  {it.texto}
                </a>
              ) : (
                it.texto
              )}
              <span className="solo-experto cambia-perfil mt-0.5 block font-mono text-dato [overflow-wrap:anywhere] text-tinta-2">
                {it.experto}
              </span>
            </span>
            <span className="col-start-3 font-mono text-dato whitespace-nowrap text-tinta-2 chico:col-start-auto chico:text-right">
              {it.valor}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** «El informe en una mirada»: todo lo de arriba de las nueve secciones. */
export function MiradaBrecha({
  v,
  idioma,
}: {
  v: VistaBrecha;
  idioma: Idioma;
}) {
  return (
    <section
      id="s-ficha"
      aria-labelledby="s-ficha-t"
      className="border-t border-linea pt-8"
    >
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

      <div className="mt-6 grid justify-items-start gap-3">
        <Veredicto clase={v.veredicto.clase}>{v.veredicto.texto}</Veredicto>
        <p className="max-w-[72ch] text-texto leading-[1.6]">
          <span className="solo-lider">{v.veredicto.lider}</span>
          <span className="solo-experto cambia-perfil font-mono text-chico [overflow-wrap:anywhere]">
            {v.veredicto.experto}
          </span>
        </p>
        <div className="grid w-full grid-cols-[18px_minmax(0,1fr)] gap-x-2.5 border-t border-linea pt-3">
          <Icono de={Compass} tam={18} className="mt-0.5" />
          <p className="text-chico">
            <b className="font-semibold">{v.veredicto.recomendacion}</b>
            <small className="mt-0.5 block text-dato text-tinta-2">
              {MIRADA.recomendacionPie[idioma]}
            </small>
          </p>
        </div>
      </div>

      <Balance v={v} idioma={idioma} />

      <TituloGrupo
        icono={CircleX}
        id="fallos"
        titulo={GRUPOS.fallo.titulo[idioma]}
        cuenta={v.fallos.length}
        nota={
          <>
            <span className="solo-lider">{GRUPOS.fallo.lider[idioma]}</span>
            <span className="solo-experto">{GRUPOS.fallo.experto[idioma]}</span>
          </>
        }
      />
      {v.fallos.length === 0 ? (
        <p className="text-chico text-tinta-2">{GRUPOS.noFallo[idioma]}</p>
      ) : (
        <div className="grid">
          <Cabecera idioma={idioma} />
          {v.fallos.map((f) => (
            <RenglonFallo key={f.ancla} f={f} idioma={idioma} />
          ))}
        </div>
      )}

      {v.sinProbar.length > 0 ? (
        <>
          <TituloGrupo
            icono={CircleDashed}
            titulo={GRUPOS.sinProbar[idioma]}
            cuenta={v.sinProbar.length}
          />
          <div className="grid">
            {v.sinProbar.map((f) => (
              <RenglonFallo key={f.ancla} f={f} idioma={idioma} />
            ))}
          </div>
        </>
      ) : null}

      {v.conNota.length > 0 ? (
        <>
          <TituloGrupo
            icono={TriangleAlert}
            titulo={GRUPOS.conNota[idioma]}
            cuenta={v.conNota.length}
          />
          <div className="grid">
            {v.conNota.map((f) => (
              <RenglonFallo key={f.ancla} f={f} idioma={idioma} />
            ))}
          </div>
        </>
      ) : null}

      <TituloGrupo
        icono={CircleCheck}
        titulo={GRUPOS.cumplido[idioma]}
        cuenta={v.cumplido.total}
      />
      <div className="grid grid-cols-1 items-start gap-x-12 gap-y-6 escritorio:grid-cols-2">
        <ListaCumplida
          titulo={v.cumplido.criterios.titulo}
          items={v.cumplido.criterios.items}
        />
        <div className="grid gap-6">
          <ListaCumplida
            titulo={v.cumplido.riesgos.titulo}
            items={v.cumplido.riesgos.items}
          />
          {v.cumplido.ademas.items.length > 0 ? (
            <ListaCumplida
              titulo={v.cumplido.ademas.titulo}
              items={v.cumplido.ademas.items}
            />
          ) : null}
        </div>
      </div>

      <TituloGrupo icono={Gauge} titulo={IPO.titulo[idioma]} />
      <div className="grid grid-cols-1 amplio:grid-cols-[minmax(0,4fr)_28px_minmax(0,5fr)_28px_minmax(0,4fr)]">
        <ColumnaIpo
          icono={Inbox}
          titulo={IPO.recibe[idioma]}
          sub={IPO.recibeSub[idioma]}
        >
          <ListaEst>
            {v.ipo.recibe.map((x) => (
              <ItemEst
                key={x.titulo}
                inicio={<MarcaCorrio texto={IPO.hecho[idioma]} />}
                titulo={x.titulo}
                detalle={x.detalle}
              />
            ))}
          </ListaEst>
        </ColumnaIpo>
        <FlechaIpo />
        <ColumnaIpo icono={Gauge} titulo={IPO.hace[idioma]} sub={v.ipo.haceSub}>
          <ListaEst numerada>
            {v.ipo.hace.map((paso, k) => (
              <ItemEst
                key={paso}
                inicio={
                  <span className="font-mono text-dato leading-[1.9] font-medium text-tinta-2">
                    {k + 1}
                  </span>
                }
                fin={<MarcaCorrio texto={IPO.hecho[idioma]} />}
                titulo={paso}
              />
            ))}
          </ListaEst>
        </ColumnaIpo>
        <FlechaIpo />
        <ColumnaIpo
          icono={Send}
          titulo={IPO.entrega[idioma]}
          sub={IPO.entregaSub[idioma]}
        >
          <ListaEst>
            {v.ipo.entrega.map((x) => (
              <ItemEst
                key={x.titulo}
                inicio={<MarcaCorrio texto={IPO.hecho[idioma]} />}
                titulo={x.titulo}
                detalle={x.detalle}
              />
            ))}
            <ItemEst
              inicio={
                <Icono de={Ban} tam={15} className="mt-0.5 text-tinta-2" />
              }
              titulo={IPO.nunca[idioma]}
              detalle={IPO.nuncaDetalle[idioma]}
            />
          </ListaEst>
        </ColumnaIpo>
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-2 text-dato text-tinta-2">
        {v.fuente.texto}
        <Chip procedencia="real">{v.fuente.chip}</Chip>
      </p>

      <nav
        aria-label={INDICE.rotulo[idioma]}
        className="mt-8 border-t border-linea pt-6"
      >
        <p className="mb-2 text-chico text-tinta-2">{INDICE.nota[idioma]}</p>
        <ol className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {v.indice.map((x) => (
            <li key={x.id}>
              <a
                href={`#${x.id}`}
                className="inline-flex h-7 items-center gap-1.5 rounded-control border border-linea px-2.5 text-chico text-tinta-1 no-underline hover:border-tinta-2"
              >
                <span className="font-mono text-dato text-tinta-2">{x.n}</span>
                {x.titulo}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
}
