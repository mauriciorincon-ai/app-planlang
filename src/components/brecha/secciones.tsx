/**
 * Las nueve secciones del informe (§ 12 de la especificación) en P4 Brecha, en su orden. Sin lógica: pintan
 * `src/lib/vista/brecha.ts`. Las líneas técnicas van en bloques del experto; las tablas, con `TablaF` (una tarjeta
 * por renglón en el teléfono).
 */
import {
  ArrowRight,
  CircleCheck,
  CircleUserRound,
  EyeOff,
  Fingerprint,
  GitBranch,
  Info,
  Languages,
  ShieldCheck,
  SlidersHorizontal,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Idioma } from "@core/formatos/bilingue";
import { porcentaje, decimal } from "@/lib/vista/formato";
import type { SupuestoVista, VistaBrecha } from "@/lib/vista/brecha";
import {
  BRECHAS,
  CRITERIOS,
  CURVA_SUPUESTO,
  EJEMPLARES,
  FICHA,
  MARCAS,
  PLAN_EN_BREVE,
  PLAYGROUND,
  RESUMEN,
  RIESGOS,
  SECCIONES,
  SUPUESTOS,
} from "@/textos/brecha";
import { PERFIL } from "@/textos/comun";
import {
  Definiciones,
  GrupoT,
  ItemEst,
  ListaEst,
  MarcaCorrio,
  PrioridadAccion,
  RefNodo,
} from "../agente/piezas";
import { claseBoton } from "../boton";
import { Chip } from "../chip";
import { Curva } from "../curva";
import { cx } from "../cx";
import { Icono } from "../icono";
import { BloqueExperto } from "../perfil/bloque-experto";
import { Seccion } from "../seccion";
import { TablaF } from "../tabla-f";
import { Veredicto } from "../veredicto";
import { SinProbar } from "../sin-probar";
import { TituloNumerado } from "../titulo-numerado";

const MONO = "font-mono text-dato leading-normal [overflow-wrap:anywhere]";
const LECTURA = "mb-6 max-w-[72ch] text-texto leading-[1.6]";

function SeccionB({
  n,
  idioma,
  chip,
  children,
}: {
  n: number;
  idioma: Idioma;
  chip?: string;
  children: ReactNode;
}) {
  const id = `b${n}` as keyof typeof SECCIONES;
  return (
    <Seccion
      id={id}
      titulo={<TituloNumerado n={n} titulo={SECCIONES[id][idioma]} />}
      cabecera={chip ? <Chip procedencia="real">{chip}</Chip> : undefined}
      className="scroll-mt-6 [&>div:first-child>h2]:scroll-mt-6"
    >
      {children}
    </Seccion>
  );
}

function Estado({ e }: { e: { texto: string; clase: string } }) {
  return e.clase === "beta" ? (
    <SinProbar>{e.texto}</SinProbar>
  ) : (
    <Veredicto clase={e.clase as "cumple"} chico>
      {e.texto}
    </Veredicto>
  );
}

function ChipsCasos({
  casos,
}: {
  casos: readonly { id: string; href: string }[];
}) {
  if (casos.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {casos.map((c) => (
        <a
          key={c.id}
          href={c.href}
          className="rounded-chip border border-linea bg-sup-1 px-1.5 py-px font-mono text-dato text-tinta-1 no-underline hover:border-tinta-2"
        >
          {c.id}
        </a>
      ))}
    </span>
  );
}

// --------------------------------------------------------------------------------------------- § 1

export function Resumen({ v, idioma }: { v: VistaBrecha; idioma: Idioma }) {
  const R = RESUMEN;
  return (
    <SeccionB n={1} idioma={idioma}>
      <div className="grid grid-cols-1 items-start gap-x-12 gap-y-6 amplio:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <div>
          <p className="max-w-[72ch] text-texto leading-[1.6]">
            {v.resumen.lectura}
          </p>
          <p className="mt-3 text-chico text-tinta-2">
            <a
              href="#fallos"
              className="text-tinta-2 underline underline-offset-3"
            >
              {R.porque[idioma]}
            </a>
          </p>
        </div>
        <div>
          <p className="mb-2 text-chico text-tinta-2">{R.destacados[idioma]}</p>
          <TablaF
            columnas={[
              { titulo: R.id[idioma], ancho: "40px", mono: true },
              { titulo: R.criterio[idioma], ancho: "minmax(0,1.6fr)" },
              { titulo: R.medido[idioma], ancho: "minmax(0,0.9fr)" },
              { titulo: R.estado[idioma], ancho: "minmax(0,0.8fr)" },
            ]}
            filas={v.resumen.destacados.map((d) => ({
              clave: d.id,
              celdas: [
                d.id,
                d.criterio,
                d.medido,
                <Estado key="e" e={d.estado} />,
              ],
            }))}
          />
          <p className="mt-3 text-chico text-tinta-2">{v.resumen.riesgos}</p>
        </div>
      </div>
    </SeccionB>
  );
}

// --------------------------------------------------------------------------------------------- § 2

export function PlanEnBreve({ v, idioma }: { v: VistaBrecha; idioma: Idioma }) {
  const p = v.planEnBreve;
  return (
    <SeccionB n={2} idioma={idioma}>
      <p className={LECTURA}>{p.problema}</p>
      <div className="grid grid-cols-1 items-start gap-x-12 gap-y-6 amplio:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <p className="mb-2 text-chico text-tinta-2">{p.flujoTitulo}</p>
          <ListaEst numerada>
            {p.flujo.map((paso, k) => (
              <ItemEst
                key={paso}
                inicio={
                  <span className="font-mono text-dato leading-[1.9] font-medium text-tinta-2">
                    {k + 1}
                  </span>
                }
                fin={<MarcaCorrio texto={MARCAS.hecho[idioma]} />}
                titulo={paso}
              />
            ))}
          </ListaEst>
        </div>
        <div>
          <p className="mb-2 text-chico text-tinta-2">
            {PLAN_EN_BREVE.unaVia[idioma]}
          </p>
          <ListaEst>
            {p.unaVia.map((d) => (
              <ItemEst
                key={d.id}
                inicio={
                  <Icono
                    de={GitBranch}
                    tam={15}
                    className="mt-0.5 text-tinta-2"
                  />
                }
                titulo={
                  <b className="font-semibold">
                    {d.id} · {d.pregunta}
                  </b>
                }
                detalle={d.justificacion ?? undefined}
              />
            ))}
          </ListaEst>
          {p.otras ? (
            <p className="mt-3 text-chico text-tinta-2">{p.otras}</p>
          ) : null}
        </div>
      </div>
    </SeccionB>
  );
}

// --------------------------------------------------------------------------------------------- § 3

const COLS_CRIT =
  "escritorio:grid-cols-[40px_minmax(0,1.7fr)_minmax(0,1.2fr)_minmax(0,0.9fr)]";

export function Criterios({ v, idioma }: { v: VistaBrecha; idioma: Idioma }) {
  const C = CRITERIOS;
  return (
    <SeccionB n={3} idioma={idioma} chip={v.criterios.chip}>
      <p className={LECTURA}>{v.criterios.lectura}</p>
      <div className="grid">
        <div
          className={cx(
            "hidden gap-x-4 pb-1.5 text-dato text-tinta-2 escritorio:grid",
            COLS_CRIT,
          )}
        >
          <span>Id</span>
          <span>
            {C.columnas.criterio[idioma]}{" "}
            <span className="solo-experto">{C.columnas.regla[idioma]}</span>
          </span>
          <span>{C.columnas.medido[idioma]}</span>
          <span>{C.columnas.veredicto[idioma]}</span>
        </div>
        {v.criterios.filas.map((f) => (
          <div
            key={f.id}
            data-criterio={f.id}
            className={cx(
              "grid grid-cols-[40px_minmax(0,1fr)] items-start gap-x-4 gap-y-2 border-t border-linea py-3.5",
              COLS_CRIT,
            )}
          >
            <span className={cx(MONO, "text-tinta-2")}>{f.id}</span>
            <div className="min-w-0">
              <p className="text-chico">{f.enunciado}</p>
              <span
                className={cx(
                  "solo-experto cambia-perfil mt-1 block",
                  MONO,
                  "text-tinta-2",
                )}
              >
                {f.regla}
              </span>
              {f.nota ? (
                <p className="mt-1 text-dato text-tinta-2">{f.nota}</p>
              ) : null}
            </div>
            <div className="col-start-2 min-w-0 escritorio:col-start-auto">
              <div className="flex justify-between gap-2 text-dato text-tinta-2">
                <span>
                  {f.medido.rotulo}{" "}
                  <b className="font-semibold text-tinta-1">{f.medido.valor}</b>
                </span>
                <span>
                  {C.objetivo[idioma]}{" "}
                  <b className="font-semibold text-tinta-1">{f.objetivo}</b>
                </span>
              </div>
              <div
                className="relative mt-1.5 h-2 rounded-barra bg-linea"
                aria-hidden="true"
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-barra bg-tinta-1"
                  style={{ width: `${Math.min(100, f.pista.medido)}%` }}
                />
                <span
                  className="absolute -top-1 -bottom-1 w-0.5 bg-tinta-1"
                  style={{
                    left: `calc(${Math.min(100, f.pista.meta)}% - 1px)`,
                  }}
                />
              </div>
              {f.ejes ? (
                <div className="mt-1 flex justify-between gap-2 font-mono text-micro text-tinta-2">
                  <span>{f.ejes.desde}</span>
                  {f.ejes.centro ? <span>{f.ejes.centro}</span> : null}
                  <span>{f.ejes.hasta}</span>
                </div>
              ) : null}
            </div>
            <div className="col-start-2 flex flex-wrap items-center gap-1.5 escritorio:col-start-auto escritorio:grid escritorio:justify-items-start">
              <Estado e={f.estado} />
              <ChipsCasos casos={f.casos} />
            </div>
          </div>
        ))}
      </div>
    </SeccionB>
  );
}

// --------------------------------------------------------------------------------------------- § 4

const COLS_RIESGO =
  "escritorio:grid-cols-[40px_minmax(0,1.7fr)_minmax(0,1.2fr)_minmax(0,0.9fr)]";

export function Riesgos({ v, idioma }: { v: VistaBrecha; idioma: Idioma }) {
  const R = RIESGOS;
  const r = v.riesgos;
  return (
    <SeccionB n={4} idioma={idioma} chip={r.chip}>
      <p className={LECTURA}>{r.lectura}</p>
      <div className="grid">
        <div
          className={cx(
            "hidden gap-x-4 pb-1.5 text-dato text-tinta-2 escritorio:grid",
            COLS_RIESGO,
          )}
        >
          <span>Id</span>
          <span>{R.columnas.modo[idioma]}</span>
          <span>{R.columnas.prioridad[idioma]}</span>
          <span>{R.columnas.corrida[idioma]}</span>
        </div>
        {r.filas.map((f) => (
          <div
            key={f.id}
            data-riesgo={f.id}
            className={cx(
              "grid grid-cols-[40px_minmax(0,1fr)] items-start gap-x-4 gap-y-2 border-t border-linea py-3.5",
              COLS_RIESGO,
            )}
          >
            <span className={cx(MONO, "text-tinta-2")}>{f.id}</span>
            <div className="min-w-0">
              <p className="text-chico">{f.modo}</p>
              <span className={cx("mt-1 block", MONO, "text-tinta-2")}>
                {f.medida}
              </span>
              <span
                className={cx(
                  "solo-experto cambia-perfil mt-1 block",
                  MONO,
                  "text-tinta-2",
                )}
              >
                {f.detector}
              </span>
              <p className="solo-experto cambia-perfil mt-1 text-dato text-tinta-2">
                <b className="font-medium">{R.efecto[idioma]}</b>: {f.efecto} ·{" "}
                <b className="font-medium">{R.causa[idioma]}</b>: {f.causa}
              </p>
            </div>
            <div className="col-start-2 grid content-start gap-1 escritorio:col-start-auto">
              <PrioridadAccion barras={f.ap.barras} texto={f.ap.texto} />
              <span className={cx(MONO, "text-tinta-2")}>{f.rpn}</span>
              {f.legal ? (
                <span className="text-dato text-tinta-2">{f.legal}</span>
              ) : null}
            </div>
            <div className="col-start-2 flex flex-wrap items-center gap-1.5 escritorio:col-start-auto">
              <Estado e={f.estado} />
              <ChipsCasos casos={f.casos} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 items-start gap-x-12 gap-y-8 amplio:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <GrupoT icono={Workflow} titulo={R.construido[idioma]}>
          <p className="text-chico text-tinta-2">{r.construidoNota}</p>
          <ul className="m-0 grid list-none grid-cols-[minmax(0,auto)_minmax(0,1fr)_36px_16px] items-center gap-x-3 gap-y-1.5 p-0">
            {r.visitas.map((n) => (
              <li key={n.id} className="contents">
                <RefNodo nombre={n.id} tipo={n.tipo} />
                <span
                  className="h-1.5 rounded-barra bg-linea"
                  aria-hidden="true"
                >
                  <span
                    className="block h-full rounded-barra bg-tinta-1"
                    style={{ width: `${n.ancho}%` }}
                  />
                </span>
                <b className="text-right font-mono text-dato">{n.visitas}</b>
                {n.en_grafo ? (
                  <MarcaCorrio texto={MARCAS.enGrafo[idioma]} />
                ) : (
                  <Veredicto clase="no-cumple" chico>
                    {MARCAS.falta[idioma]}
                  </Veredicto>
                )}
              </li>
            ))}
          </ul>
          <p className="text-chico text-tinta-2">{r.senalesYPausas}</p>
        </GrupoT>
        <GrupoT icono={Languages} titulo={R.otroLenguaje[idioma]}>
          <p className="text-texto leading-[1.6]">{r.otroLenguaje}</p>
          <BloqueExperto rotulo={PERFIL.experto[idioma]}>
            <TablaF
              columnas={[
                {
                  titulo: R.rf.corrida[idioma],
                  ancho: "minmax(0,1fr)",
                  mono: true,
                },
                { titulo: R.rf.variante[idioma], ancho: "minmax(0,1fr)" },
                { titulo: R.rf.decisiones[idioma], ancho: "64px", mono: true },
                { titulo: R.rf.diferencias[idioma], ancho: "64px", mono: true },
                { titulo: R.rf.huella[idioma], ancho: "minmax(0,0.8fr)" },
              ]}
              filas={r.rf.map((x) => ({
                clave: x.corrida,
                celdas: [
                  x.corrida,
                  x.variante,
                  x.decisiones,
                  x.diferencias,
                  <Veredicto
                    key="h"
                    clase={x.coincide ? "cumple" : "no-cumple"}
                    chico
                  >
                    {(x.coincide ? R.rf.si : R.rf.no)[idioma]}
                  </Veredicto>,
                ],
              }))}
            />
          </BloqueExperto>
        </GrupoT>
      </div>
    </SeccionB>
  );
}

// --------------------------------------------------------------------------------------------- § 5

export function Brechas({ v, idioma }: { v: VistaBrecha; idioma: Idioma }) {
  const B = BRECHAS;
  const b = v.brechas;
  return (
    <SeccionB n={5} idioma={idioma} chip={b.chip}>
      <p className={LECTURA}>{b.lectura}</p>
      {b.filas.length > 0 ? (
        <TablaF
          columnas={[
            { titulo: B.columnas.caso[idioma], ancho: "64px", mono: true },
            { titulo: B.columnas.corrida[idioma], ancho: "80px" },
            { titulo: B.columnas.donde[idioma], ancho: "minmax(0,1.3fr)" },
            {
              titulo: B.columnas.reintentos[idioma],
              ancho: "72px",
              mono: true,
            },
            { titulo: B.columnas.paso[idioma], ancho: "minmax(0,2.4fr)" },
          ]}
          filas={b.filas.map((f, k) => ({
            clave: `${f.caso}-${f.corrida}-${k}`,
            celdas: [
              f.href ? (
                <a
                  key="c"
                  href={f.href}
                  className="text-tinta-1 underline underline-offset-3"
                >
                  {f.caso}
                </a>
              ) : (
                (f.caso ?? "—")
              ),
              f.corrida,
              f.nodo ? (
                <span
                  key="d"
                  className="inline-flex flex-wrap items-center gap-1.5"
                >
                  <RefNodo nombre={f.nodo.id} tipo={f.nodo.tipo} />
                  {f.paso !== null ? (
                    <span className="text-dato text-tinta-2">
                      · {B.pasoN[idioma]} {f.paso}
                    </span>
                  ) : null}
                </span>
              ) : (
                "—"
              ),
              f.reintentos,
              f.detalle,
            ],
          }))}
        />
      ) : null}
      <BloqueExperto rotulo={PERFIL.experto[idioma]} className="mt-6">
        <GrupoT icono={ShieldCheck} titulo={B.evaluadores[idioma]}>
          <TablaF
            columnas={[
              {
                titulo: B.ev.evaluador[idioma],
                ancho: "minmax(0,1.5fr)",
                mono: true,
              },
              { titulo: B.ev.tipo[idioma], ancho: "minmax(0,0.8fr)" },
              { titulo: B.ev.estado[idioma], ancho: "minmax(0,1.2fr)" },
              { titulo: B.ev.casos[idioma], ancho: "56px", mono: true },
              { titulo: B.ev.fallas[idioma], ancho: "64px", mono: true },
              { titulo: B.ev.noEvaluables[idioma], ancho: "80px", mono: true },
              {
                titulo: B.ev.riesgos[idioma],
                ancho: "minmax(0,0.8fr)",
                mono: true,
              },
            ]}
            filas={b.evaluadores.map((e) => ({
              clave: e.id,
              celdas: [
                e.id,
                e.tipo,
                e.estado,
                e.casos,
                e.fallas,
                e.noEvaluables,
                e.riesgos,
              ],
            }))}
          />
        </GrupoT>
      </BloqueExperto>
    </SeccionB>
  );
}

// --------------------------------------------------------------------------------------------- § 6

function GraficoSupuesto({ s, idioma }: { s: SupuestoVista; idioma: Idioma }) {
  const g = s.grafico;
  if (!g) return null;
  const CAJA = "rounded-baldosa border border-linea bg-sup-1 p-4";
  if (g.tipo === "curva") {
    return (
      <figure className={cx(CAJA, "m-0")}>
        <Curva
          id={`curva-${s.id}`}
          mini
          puntos={g.puntos}
          plan={g.plan}
          textos={{
            titulo: CURVA_SUPUESTO.titulo({ id: s.id, n: g.n })[idioma],
            ejeCobertura: CURVA_SUPUESTO.ejeCobertura[idioma],
            ejeRiesgo: CURVA_SUPUESTO.ejeRiesgo[idioma],
            pct: (x) => porcentaje(Math.round(x * 100) / 100, idioma),
            plan: (us, c) =>
              CURVA_SUPUESTO.plan({
                umbral: g.umbral,
                rango: rango(us, idioma),
                cobertura: porcentaje(Math.round(c * 100) / 100, idioma),
              })[idioma],
            grupo: (us) => `${g.umbral} ${rango(us, idioma)}`,
          }}
        />
        <figcaption className="mt-2 flex flex-wrap items-center gap-2 text-dato text-tinta-2">
          {g.pie}
          <Chip procedencia="real">{g.chip}</Chip>
        </figcaption>
      </figure>
    );
  }
  if (g.tipo === "comparacion") {
    return (
      <div className={CAJA}>
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-dato text-tinta-2">
          <span className="inline-flex items-center gap-1.5">
            <i
              className="inline-block h-2.5 w-4.5 rounded-mini bg-tinta-1"
              aria-hidden="true"
            />
            {g.leyenda[0]}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i
              className="inline-block h-2.5 w-4.5 rounded-mini border border-tinta-2 bg-[repeating-linear-gradient(135deg,var(--tinta-2)_0_1px,transparent_1px_4px)]"
              aria-hidden="true"
            />
            {g.leyenda[1]}
          </span>
        </div>
        <dl className="m-0 grid gap-3">
          {g.filas.map((f) => (
            <div
              key={f.t}
              className="grid grid-cols-1 gap-x-4 gap-y-1 chico:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)]"
            >
              <dt className="text-chico">
                {f.t}
                {f.n ? (
                  <small className="block text-dato text-tinta-2">{f.n}</small>
                ) : null}
              </dt>
              <dd className="m-0 grid gap-1">
                {(["multi", "unico"] as const).map((k) => (
                  <span
                    key={k}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
                  >
                    <span className="h-2.5 rounded-mini" aria-hidden="true">
                      <span
                        className={cx(
                          "block h-full rounded-mini",
                          k === "multi"
                            ? "bg-tinta-1"
                            : "border border-tinta-2 bg-[repeating-linear-gradient(135deg,var(--tinta-2)_0_1px,transparent_1px_4px)]",
                        )}
                        style={{ width: `${f[k].ancho}%` }}
                      />
                    </span>
                    <span className="font-mono text-dato">
                      <span className="sr-only">
                        {k === "multi" ? g.leyenda[0] : g.leyenda[1]}:{" "}
                      </span>
                      {f[k].v}
                    </span>
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-dato text-tinta-2">
          {g.pie}
          <Chip procedencia="real">{g.chip}</Chip>
        </p>
      </div>
    );
  }
  return (
    <div className={cx(CAJA, "grid grid-cols-2 gap-4")}>
      {g.cifras.map((c) => (
        <div key={c.texto} className="grid content-start gap-0.5">
          <b className="text-cifra leading-[1.1] font-semibold tabular-nums">
            {c.cifra}
          </b>
          <span className="text-dato text-tinta-2">{c.texto}</span>
        </div>
      ))}
    </div>
  );
}

function rango(us: readonly number[], idioma: Idioma): string {
  const a = decimal(us[0]!, 2, idioma);
  const b = decimal(us[us.length - 1]!, 2, idioma);
  return us.length === 1 ? a : `${a}–${b}`;
}

export function Supuestos({ v, idioma }: { v: VistaBrecha; idioma: Idioma }) {
  return (
    <SeccionB n={6} idioma={idioma}>
      <p className={LECTURA}>{SUPUESTOS.lectura[idioma]}</p>
      <div className="grid">
        {v.supuestos.map((s) => (
          <div
            key={s.id}
            id={`s-${s.id}`}
            className="grid grid-cols-1 items-start gap-x-12 gap-y-4 border-t border-linea py-6 amplio:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
          >
            <div className="grid content-start gap-2">
              <span className={cx(MONO, "text-tinta-2")}>{s.id}</span>
              <h3 className="text-sub font-semibold">{s.enunciado}</h3>
              <div className="flex flex-wrap gap-1.5">
                <Estado e={s.estado} />
                <Chip procedencia="declarado">{s.criticidad}</Chip>
              </div>
              <p className="text-chico leading-normal">{s.dio}</p>
              <BloqueExperto rotulo={PERFIL.experto[idioma]}>
                <p className="mb-1.5 text-dato text-tinta-2">{s.reglita}</p>
                <Definiciones
                  filas={s.medidas}
                  valor={(x) => <span className="font-mono">{x}</span>}
                />
              </BloqueExperto>
              <ul className="m-0 grid list-none gap-1.5 p-0">
                {s.notas.map((n) => (
                  <li
                    key={n}
                    className="grid grid-cols-[16px_minmax(0,1fr)] gap-2 text-dato text-tinta-2"
                  >
                    <Icono de={Info} tam={14} className="mt-0.5" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
            <GraficoSupuesto s={s} idioma={idioma} />
          </div>
        ))}
      </div>
    </SeccionB>
  );
}

// --------------------------------------------------------------------------------------------- § 7

const ICONO_ROL: LucideIcon[] = [
  CircleCheck,
  CircleUserRound,
  Info,
  ShieldCheck,
];

export function Ejemplares({ v, idioma }: { v: VistaBrecha; idioma: Idioma }) {
  return (
    <SeccionB n={7} idioma={idioma} chip={v.ejemplares.chip}>
      <p className={LECTURA}>{EJEMPLARES.lectura[idioma]}</p>
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 tableta:grid-cols-2 amplio:grid-cols-4">
        {v.ejemplares.lista.map((e, k) => (
          <li
            key={e.rol}
            className={cx(
              "grid content-start gap-2.5 rounded-baldosa border p-4",
              e.caso ? "border-linea bg-sup-1" : "border-dashed border-tinta-3",
            )}
          >
            <span className="inline-flex items-center gap-1.5 text-chico text-tinta-2">
              <Icono de={ICONO_ROL[k] ?? Info} tam={15} />
              {e.rol}
            </span>
            <h3 className="text-sub font-semibold">
              {e.caso ? (
                <>
                  <span className="mr-1.5 font-mono text-chico font-medium">
                    {e.caso.id}
                  </span>
                  {e.caso.tipo}
                </>
              ) : (
                EJEMPLARES.ninguno[idioma]
              )}
            </h3>
            <p className="text-chico leading-normal">{e.texto}</p>
            {e.cadena.length > 0 ? (
              <span
                role="group"
                aria-label={e.etiquetaCadena}
                className="flex flex-wrap items-center gap-x-1.5 gap-y-1"
              >
                {e.cadena.map((n, j) => (
                  <span
                    key={`${n.id}-${j}`}
                    className="inline-flex items-center gap-1.5"
                  >
                    <RefNodo nombre={n.id} tipo={n.tipo} />
                    {j < e.cadena.length - 1 ? (
                      <Icono
                        de={ArrowRight}
                        tam={11}
                        className="text-tinta-2"
                      />
                    ) : null}
                  </span>
                ))}
              </span>
            ) : null}
            {e.decision ? (
              <p className="text-dato text-tinta-2">
                {EJEMPLARES.decisionFinal[idioma]}:{" "}
                <code className="rounded-mini bg-sup-2 px-1 font-mono text-tinta-1">
                  {e.decision}
                </code>{" "}
                · {e.persona}
              </p>
            ) : null}
            {e.href ? (
              <a
                href={e.href}
                className="inline-flex items-center gap-1.5 text-chico text-tinta-1 underline underline-offset-3"
              >
                <Icono de={ArrowRight} tam={13} className="text-tinta-2" />
                {EJEMPLARES.traza[idioma]}
                <span className="sr-only"> {e.caso?.id}</span>
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </SeccionB>
  );
}

// --------------------------------------------------------------------------------------------- § 8

export function Playground({ v, idioma }: { v: VistaBrecha; idioma: Idioma }) {
  const P = PLAYGROUND;
  const p = v.playground;
  return (
    <SeccionB n={8} idioma={idioma}>
      <p className={LECTURA}>{p.lectura}</p>
      <TablaF
        columnas={[
          { titulo: P.columnas.umbral[idioma], ancho: "minmax(0,1.6fr)" },
          {
            titulo: P.columnas.regla[idioma],
            ancho: "minmax(0,1.4fr)",
            mono: true,
          },
          { titulo: P.columnas.rango[idioma], ancho: "minmax(0,0.8fr)" },
          {
            titulo: P.columnas.observado[idioma],
            ancho: "minmax(0,1fr)",
            mono: true,
          },
          { titulo: P.columnas.justo[idioma], ancho: "minmax(0,0.8fr)" },
        ]}
        filas={p.filas.map((u) => ({
          clave: u.id,
          celdas: [
            <span key="u" className="grid">
              <span>
                <b className="mr-1.5 font-mono text-dato font-medium text-tinta-2">
                  {u.id}
                </b>
                {u.nombre}
              </span>
              <small className="text-dato text-tinta-2">{u.descripcion}</small>
            </span>,
            u.regla,
            u.rango,
            u.observado,
            u.justo.length ? (
              <ChipsCasos key="j" casos={u.justo} />
            ) : (
              <span key="j" className="text-tinta-2">
                —
              </span>
            ),
          ],
        }))}
      />
      <div className="mt-8 grid grid-cols-1 items-start gap-x-12 gap-y-6 amplio:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <p className="mb-2 text-chico text-tinta-2">{P.limites[idioma]}</p>
          <ListaEst>
            {p.limites.map((l) => (
              <ItemEst
                key={l}
                inicio={
                  <Icono de={EyeOff} tam={15} className="mt-0.5 text-tinta-2" />
                }
                titulo={l}
              />
            ))}
          </ListaEst>
        </div>
        <div>
          <a href={p.href} className={claseBoton({ principal: true })}>
            <Icono de={SlidersHorizontal} />
            {P.abrir[idioma]}
          </a>
        </div>
      </div>
    </SeccionB>
  );
}

// --------------------------------------------------------------------------------------------- § 9

export function Ficha({ v, idioma }: { v: VistaBrecha; idioma: Idioma }) {
  return (
    <SeccionB n={9} idioma={idioma}>
      <p className={LECTURA}>{FICHA.lectura[idioma]}</p>
      <div className="rounded-baldosa border border-linea bg-sup-1 p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sub font-semibold">
            <Icono de={Fingerprint} tam={17} className="text-tinta-2" />
            {FICHA.titulo[idioma]}
          </h3>
          <Chip procedencia="real">{v.ficha.chip}</Chip>
        </div>
        <Definiciones filas={v.ficha.filas} />
      </div>
    </SeccionB>
  );
}
