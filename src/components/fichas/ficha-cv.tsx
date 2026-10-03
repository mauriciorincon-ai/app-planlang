/**
 * Secciones 2 y 3 de P7 Fichas (maqueta `07-fichas.html`): una ficha técnica pintada como la pinta hoja-de-vida, en
 * la piel de CV Viva (`src/styles/cv-viva.css`: papel, Fraunces en titulares), dentro de un marco que nombra el
 * archivo y el contrato. El proceso BPMN no se dibuja: se muestra lo que la ficha le entrega al motor de CV Viva,
 * carril por carril. Debajo, para el experto, la comprobación de cada campo contra el contrato fijado. Sin lógica:
 * pinta `src/lib/vista/fichas.ts`. Es el único lugar de la vitrina con texto en Fraunces (`.cv-letra`).
 */
import {
  Ban,
  Box,
  Braces,
  ClipboardPenLine,
  Eye,
  FileText,
  GitBranch,
  Info,
  MessageCircleQuestion,
  Route,
  Ruler,
  Scale,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Split,
  UserCheck,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Idioma } from "@core/formatos/bilingue";
import type { FichaCv } from "@/lib/vista/fichas";
import { PERFIL } from "@/textos/comun";
import { CV, SECCION, TABLA } from "@/textos/fichas";
import { BloqueExperto } from "../perfil/bloque-experto";
import { CODIGO_EN_LINEA } from "../con-codigo";
import { cx } from "../cx";
import { Icono } from "../icono";
import { Seccion } from "../seccion";
import { TablaF } from "../tabla-f";
import { TituloNumerado } from "../titulo-numerado";
import { Veredicto } from "../veredicto";

/**
 * El ícono de cada bloque: la ficha no lo trae (hoja-de-vida pone el suyo por pieza); aquí, por nodo del grafo o
 * por grupo de la visión, como la maqueta. Un bloque nuevo sin ícono se pinta con una caja, no rompe.
 */
const ICONO_BLOQUE: Record<string, LucideIcon> = {
  planear: ClipboardPenLine,
  correr: Route,
  medir: Ruler,
  jugar: SlidersHorizontal,
  entender: Workflow,
  mostrar: Eye,
  enrutador: GitBranch,
  extractor: FileText,
  aclaracion: MessageCircleQuestion,
  verificador_cobertura: Scale,
  decision: Split,
  pausa_humana: UserCheck,
  redactor: Send,
  guardia_salida: ShieldCheck,
};

const TINTA_0 = "text-(color:--cv-tinta-0)";
const TINTA_2 = "text-(color:--cv-tinta-2)";
const ROTULO = cx("font-mono text-[11px] tracking-[0.08em] uppercase", TINTA_2);
const CHIP = cx(
  "inline-block rounded-full border border-(color:--cv-papel-3) px-2.5 py-1 font-mono text-[11px] tracking-[0.02em] uppercase",
  TINTA_2,
);
const PILDORA =
  "inline-block self-start rounded-full px-2 py-0.5 font-mono text-[10px] tracking-[0.04em] uppercase";

function SeccionCv({
  n,
  titulo,
  sub,
  children,
}: {
  n: string;
  titulo: string;
  sub: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-3.5 flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5">
        <span
          className={cx("font-mono text-[11px] tracking-[0.08em]", TINTA_2)}
        >
          {n}
        </span>
        <h4
          className={cx(
            "cv-letra m-0 text-[26px] leading-tight tracking-[-0.015em]",
            TINTA_0,
          )}
        >
          {titulo}
        </h4>
        <p
          className={cx(
            "basis-full text-[13px] amplio:ml-auto amplio:basis-auto amplio:text-right",
            TINTA_2,
          )}
        >
          {sub}
        </p>
      </div>
      {children}
    </section>
  );
}

function Panel({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="cv-caja rounded-[14px] px-5.5 py-5">
      <h5 className={cx("m-0 mb-2.5 font-medium", ROTULO)}>{titulo}</h5>
      {children}
    </div>
  );
}

function Lista({
  items,
  marca,
  clase,
}: {
  items: readonly string[];
  marca: string;
  clase: string;
}) {
  return (
    <ul className="m-0 list-none p-0">
      {items.map((x) => (
        <li
          key={x}
          className="flex gap-3 border-t border-(color:--cv-papel-2) py-2 text-[14px] leading-snug first:border-t-0"
        >
          <span aria-hidden="true" className={clase}>
            {marca}
          </span>
          {x}
        </li>
      ))}
    </ul>
  );
}

/** La ficha en la piel de CV Viva: lo que vería un visitante de la vitrina de hoja-de-vida. */
function Cv({ f, idioma }: { f: FichaCv; idioma: Idioma }) {
  return (
    <article
      lang={idioma}
      data-ficha-cv={f.clave}
      className={cx(
        "cv-viva px-4 pt-6 pb-7 text-[15px] leading-[1.6] amplio:px-7 amplio:pt-8 amplio:pb-10",
      )}
    >
      <header>
        <p className="m-0 flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-(color:--cv-salvia-tinta) uppercase">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-(color:--cv-salvia-tinta)"
          />
          {CV.migas[idioma]}
        </p>
        <ul className="m-0 mt-3.5 flex list-none flex-wrap gap-2 p-0">
          {f.chips.map((c, k) => (
            <li key={c}>
              {k === 0 ? (
                <span
                  data-estado={f.sellada ? "sellado" : "inicial"}
                  className="inline-block rounded-full px-2.5 py-1 font-mono text-[11px] tracking-[0.02em] uppercase"
                >
                  {c}
                </span>
              ) : (
                <span className={CHIP}>{c}</span>
              )}
            </li>
          ))}
        </ul>
        <h3
          className={cx(
            "cv-letra m-0 mt-4.5 text-[34px] leading-[1.05] tracking-[-0.02em] amplio:text-[48px]",
            TINTA_0,
          )}
        >
          {f.nombre}
        </h3>
        <p className="cv-letra m-0 mt-2.5 text-[22px] leading-[1.3]">
          {f.tagline}
        </p>
        <ul
          aria-label={CV.stack[idioma]}
          className="m-0 mt-3.5 flex list-none flex-wrap gap-2 p-0"
        >
          {f.stack.map((s) => (
            <li key={s.nombre}>
              <span className={CHIP}>
                {s.nombre}
                {/* El papel de cada pieza no vive solo en un `title` (AU-S2-B26). */}
                <span className="sr-only">: {s.papel}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-5.5 max-w-[820px] rounded-[10px] border-l-[3px] border-(color:--cv-salvia-tinta) bg-(color:--cv-papel-1) px-4.5 py-3.5">
          <p className="m-0 mb-1 font-mono text-[10.5px] tracking-[0.08em] text-(color:--cv-salvia-tinta) uppercase">
            {CV.titular[idioma]}
          </p>
          <p className={cx("m-0 text-[16px] font-medium", TINTA_0)}>
            {f.titular}
          </p>
        </div>
      </header>

      <ul
        aria-label={CV.cifras[idioma]}
        className="m-0 mt-6.5 grid list-none grid-cols-2 gap-3 p-0 amplio:grid-cols-5"
      >
        {f.cifras.map((c) => (
          <li
            key={c.clave}
            data-cifra={c.clave}
            className="cv-caja flex flex-col rounded-[12px] px-3.75 py-3.5"
          >
            <p
              className={cx(
                "cv-letra m-0 text-[30px] leading-none tracking-[-0.02em] tabular-nums",
                TINTA_0,
              )}
            >
              {c.valor}
              {c.unidad ? (
                <small
                  className={cx(
                    "ml-1 font-letra text-[13px] font-normal tracking-normal",
                    TINTA_2,
                  )}
                >
                  {c.unidad}
                </small>
              ) : null}
            </p>
            <p
              className={cx("m-0 mt-1.5 text-[12.5px] leading-[1.35]", TINTA_2)}
            >
              {c.etiqueta}
            </p>
            <span data-fuente={c.fuente} className={cx(PILDORA, "mt-2")}>
              {c.fuenteTexto}
              <span className="sr-only"> ({c.detalle})</span>
            </span>
          </li>
        ))}
      </ul>

      <SeccionCv
        n={f.num.paraQuien}
        titulo={CV.paraQuienT[idioma]}
        sub={CV.paraQuienSub[idioma]}
      >
        <div className="grid grid-cols-1 gap-4 amplio:grid-cols-2">
          <Panel titulo={CV.paraQuien[idioma]}>
            <p className="m-0">{f.paraQuien}</p>
          </Panel>
          <Panel titulo={CV.promesa[idioma]}>
            <p className="m-0">{f.promesa}</p>
          </Panel>
        </div>
      </SeccionCv>

      {f.proceso && f.num.proceso ? (
        <SeccionCv
          n={f.num.proceso}
          titulo={CV.comoT[idioma]}
          sub={CV.comoSub[idioma]}
        >
          <div className="cv-caja rounded-[14px] p-4 amplio:p-5">
            <h5 className={cx("m-0 mb-3 font-medium", ROTULO)}>
              {f.proceso.titulo}
            </h5>
            <p
              className={cx(
                "m-0 mb-3.5 grid grid-cols-[16px_minmax(0,1fr)] gap-2 rounded-[8px] border border-dashed border-(color:--cv-papel-3) px-3 py-2.5 text-[13px]",
                TINTA_2,
              )}
            >
              <Icono de={Info} tam={14} className="mt-1" />
              {CV.comoNota[idioma]}
            </p>
            <div className="grid overflow-hidden rounded-[10px] border border-(color:--cv-papel-2)">
              {f.proceso.carriles.map((c) => (
                <div
                  key={c.id}
                  data-carril={c.id}
                  className="grid grid-cols-1 border-t border-(color:--cv-papel-2) first:border-t-0 even:bg-(color:--cv-papel-1) amplio:grid-cols-[110px_minmax(0,1fr)]"
                >
                  <span
                    className={cx(
                      "px-3 pt-3 font-mono text-[10.5px] tracking-[0.08em] uppercase amplio:border-r amplio:border-(color:--cv-papel-2) amplio:pb-3",
                      TINTA_2,
                    )}
                  >
                    {c.nombre}
                  </span>
                  <ol className="m-0 flex list-none flex-wrap gap-2 px-3 py-2.5">
                    {c.pasos.map((p) => (
                      <li
                        key={p.n}
                        data-paso={p.tipo}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12.5px]"
                      >
                        <span
                          className={cx("font-mono text-[10.5px]", TINTA_2)}
                        >
                          <span className="sr-only">{CV.paso[idioma]} </span>
                          {p.n}
                        </span>
                        {CV.tipoPaso[p.tipo] ? (
                          <span className="sr-only">
                            {CV.tipoPaso[p.tipo]![idioma]}:{" "}
                          </span>
                        ) : null}
                        {p.texto}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
            <ol
              className={cx(
                "m-0 mt-3 grid list-none gap-1 p-0 text-[12.5px]",
                TINTA_2,
              )}
            >
              {f.proceso.anotaciones.map((a) => (
                <li key={`${a.n}-${a.texto}`} className="flex gap-2">
                  <span className="font-mono text-[10.5px] leading-[1.9]">
                    <span className="sr-only">{CV.paso[idioma]} </span>
                    {a.n}
                  </span>
                  {a.texto}
                </li>
              ))}
            </ol>
            <p
              className={cx(
                "m-0 mt-3 border-t border-(color:--cv-papel-2) pt-3 font-mono text-[10.5px] tracking-[0.04em] uppercase",
                TINTA_2,
              )}
            >
              {f.proceso.procedencia}
            </p>
          </div>
        </SeccionCv>
      ) : null}

      <SeccionCv n={f.num.tiene} titulo={CV.tieneT[idioma]} sub={f.tieneSub}>
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 amplio:grid-cols-4">
          {f.bloques.map((b) => (
            <li
              key={b.orden}
              data-bloque={b.id}
              className="cv-caja rounded-[12px] px-4 py-3.5"
            >
              <span className="mb-2.5 flex size-9 items-center justify-center rounded-[9px] bg-(color:--cv-papel-1)">
                <Icono
                  de={ICONO_BLOQUE[b.id] ?? Box}
                  tam={20}
                  className="text-(color:--cv-tinta-1)"
                />
              </span>
              <h5
                className={cx(
                  "cv-letra m-0 text-[16.5px] leading-[1.2]",
                  TINTA_0,
                )}
              >
                {b.nombre}
              </h5>
              {b.cuenta ? (
                <p
                  className={cx(
                    "m-0 mt-1 font-mono text-[10.5px] tracking-[0.04em] uppercase",
                    TINTA_2,
                  )}
                >
                  {b.cuenta}
                </p>
              ) : null}
              <p
                className={cx("m-0 mt-1.5 text-[13px] leading-[1.45]", TINTA_2)}
              >
                {b.linea}
              </p>
            </li>
          ))}
        </ul>
      </SeccionCv>

      <SeccionCv
        n={f.num.limites}
        titulo={CV.limitesT[idioma]}
        sub={CV.limitesSub[idioma]}
      >
        <div className="grid grid-cols-1 gap-4 amplio:grid-cols-2">
          <Panel titulo={CV.limites[idioma]}>
            <Lista items={f.limites} marca="—" clase={TINTA_2} />
          </Panel>
          <Panel titulo={CV.nunca[idioma]}>
            <Lista
              items={f.nunca}
              marca="×"
              clase="font-semibold text-(color:--cv-rosa-tinta)"
            />
          </Panel>
        </div>
      </SeccionCv>

      <SeccionCv
        n={f.num.donde}
        titulo={CV.dondeT[idioma]}
        sub={CV.dondeSub[idioma]}
      >
        <ol className="cv-caja m-0 flex list-none flex-wrap gap-y-5 rounded-[14px] p-6">
          {f.hitos.map((h) => (
            <li
              key={`${h.valor}-${h.etiqueta}`}
              className="relative flex-[1_1_110px] pt-4 text-center before:absolute before:top-0 before:left-1/2 before:size-2 before:-translate-x-1/2 before:rounded-full before:bg-(color:--cv-salvia-tinta)"
            >
              <span className={cx("cv-letra block text-[18px]", TINTA_0)}>
                {h.valor}
              </span>
              <span className={cx("block text-[12px]", TINTA_2)}>
                {h.etiqueta}
              </span>
            </li>
          ))}
        </ol>
      </SeccionCv>

      <p
        className={cx(
          "m-0 mt-9 border-t border-(color:--cv-papel-2) pt-6 text-[13px]",
          TINTA_2,
        )}
      >
        {f.cierre}
      </p>
    </article>
  );
}

/** Lo que el experto ve bajo cada ficha: qué archivo se entrega y cada campo contra el límite del contrato. */
function Comprobacion({ f, idioma }: { f: FichaCv; idioma: Idioma }) {
  const t = f.tabla;
  return (
    <BloqueExperto rotulo={PERFIL.experto[idioma]} className="mt-4">
      <h3 className="mb-1 flex flex-wrap items-center gap-2 text-sub font-semibold">
        <Icono de={Braces} className="text-tinta-2" />
        {TABLA.entrega[idioma]}{" "}
        <code className={CODIGO_EN_LINEA}>{t.entrega}</code>
      </h3>
      <p className="mb-3 max-w-[72ch] text-chico leading-normal text-tinta-2">
        {t.comprobado}
      </p>
      <h4 className="mt-4 mb-1 text-chico font-semibold">
        {TABLA.cifras[idioma]}
      </h4>
      <ul className="mb-4 grid list-none gap-0 p-0">
        {f.cifras.map((c) => (
          <li
            key={c.clave}
            className="border-t border-linea py-1.75 text-chico leading-normal first:border-t-0"
          >
            <b className="font-semibold">{c.completa}</b> {c.etiqueta} ·{" "}
            <span className="text-tinta-2">{c.fuenteTexto}</span>
            <span className="block text-dato text-tinta-2">{c.detalle}</span>
          </li>
        ))}
      </ul>
      <TablaF
        columnas={[
          { titulo: TABLA.campo[idioma], ancho: "minmax(0,1.6fr)", mono: true },
          { titulo: TABLA.medida[idioma], ancho: "minmax(0,1fr)", mono: true },
          { titulo: TABLA.limite[idioma], ancho: "minmax(0,1fr)", mono: true },
          { titulo: TABLA.estado[idioma], ancho: "minmax(0,1fr)" },
        ]}
        filas={t.filas.map((x) => ({
          clave: x.campo,
          atributos: { "data-campo": x.campo },
          celdas: [
            x.campo,
            x.medida,
            x.limite,
            <Veredicto key="e" clase={x.cabe ? "cumple" : "no-cumple"} chico>
              {(x.cabe ? TABLA.cabe : TABLA.noCabe)[idioma]}
            </Veredicto>,
          ],
        }))}
      />
      {t.problemas.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-chico text-tinta-2">
          <Veredicto clase="cumple" chico>
            {TABLA.cabe[idioma]}
          </Veredicto>
          {TABLA.valida[idioma]}
        </p>
      ) : (
        <div className="mt-3 text-chico">
          <p className="flex items-center gap-2 font-medium">
            <Icono de={Ban} className="text-tinta-1" />
            {TABLA.noValida(t.problemas.length)[idioma]}
          </p>
          <ul className="mt-1.5 grid gap-1 pl-6 font-mono text-dato">
            {t.problemas.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </BloqueExperto>
  );
}

export function SeccionFicha({
  n,
  f,
  idioma,
  className,
}: {
  n: number;
  f: FichaCv;
  idioma: Idioma;
  className?: string;
}) {
  const app = f.clave === "app";
  return (
    <Seccion
      id={`f-${f.clave}`}
      titulo={
        <TituloNumerado
          n={n}
          titulo={(app ? SECCION.app : SECCION.agente)[idioma]}
        />
      }
      nota={(app ? SECCION.appNota : SECCION.agenteNota)[idioma]}
      className={className}
    >
      <div className="overflow-hidden rounded-control border border-tinta-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-tinta-3 bg-sup-1 px-4 py-2.5 text-chico text-tinta-2">
          <span>
            <b className="font-medium text-tinta-1">{f.marco.nombre}</b> ·{" "}
            {SECCION.asi[idioma]}
          </span>
          <span>
            {f.marco.archivo} · {SECCION.contrato[idioma]}
          </span>
        </div>
        <Cv f={f} idioma={idioma} />
      </div>
      {f.notas.map((x) => (
        <p
          key={x}
          className="mt-3 grid max-w-[80ch] grid-cols-[16px_minmax(0,1fr)] gap-2 text-chico leading-normal text-tinta-2"
        >
          <Icono de={Info} tam={15} className="mt-0.5" />
          {x}
        </p>
      ))}
      <Comprobacion f={f} idioma={idioma} />
    </Seccion>
  );
}
