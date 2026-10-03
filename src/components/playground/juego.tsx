"use client";

/**
 * La isla de P5 Playground (maqueta `05-playground.html`): los deslizadores de U1–U3, el interruptor de U4 y todo lo
 * que cambia al moverlos — las cuatro cifras, la frase llana del líder, la regla con los valores del visitante
 * (experto), los criterios que cambian, los casos que cambian de camino, las decisiones con sus señales y la curva
 * riesgo-cobertura. El cálculo es `core/playground/consecuencias.ts` sobre el compacto que armó el build: el mismo
 * intérprete de aristas que RF-09.2, en el navegador, sin modelo. Con los valores del plan, el primer render es el
 * del servidor (mismo árbol, sin #418).
 */
import {
  ArrowRight,
  Braces,
  Database,
  History,
  ListChecks,
} from "lucide-react";
import {
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { Idioma } from "@core/formatos/bilingue";
import type { JsonValor } from "@core/formatos/jcs";
import type { RegistroDeArista, Umbrales } from "@core/playground/aristas";
import type { Desenlace } from "@core/playground/compacto";
import {
  consecuencias,
  observados,
  umbralesDelPlan,
  type CambioDeCaso,
  type Consecuencias,
  type CriterioRecalculado,
} from "@core/playground/consecuencias";
import {
  decimal,
  enumerar,
  porcentaje,
  porcentajeFijo,
} from "@/lib/vista/formato";
import type { DatosIsla, UmbralIsla } from "@/lib/vista/playground";
import { PERFIL } from "@/textos/comun";
import {
  CAMBIOS,
  CIFRAS,
  CRITERIO_CAMBIO,
  CURVA,
  DESTINO,
  EFECTO,
  ESTADO,
  FRASE,
  INTERRUPTOR,
  JUEGO,
  OPERADOR,
  PORQUE,
  PORQUE_FUNCION,
  REGLA_VIVA,
  SENAL,
  SIMBOLO,
  TABLA,
  VISITA_DE,
} from "@/textos/playground";
import { Chip } from "../chip";
import { claseBoton } from "../boton";
import { Curva } from "../curva";
import { cx } from "../cx";
import { Icono } from "../icono";
import { Glifo, Marca } from "../marcas";
import { BloqueExperto } from "../perfil/bloque-experto";
import { Seccion } from "../seccion";
import { Veredicto } from "../veredicto";
import { SinProbar } from "../sin-probar";

const MONO = "font-mono text-dato leading-normal [overflow-wrap:anywhere]";
const ET =
  "block font-letra text-dato leading-[1.4] text-tinta-2 escritorio:hidden";

function datoCorto(x: JsonValor | undefined, i: Idioma): string {
  if (x === undefined || x === null) return "—";
  if (typeof x === "boolean") return (x ? TABLA.si : TABLA.no)[i];
  if (typeof x === "number")
    return Number.isInteger(x) ? String(x) : decimal(x, 2, i);
  return String(x);
}

// --------------------------------------------------------------------------------------------- deslizadores

function Deslizador({
  u,
  v,
  obs,
  i,
  alCambiar,
}: {
  u: UmbralIsla;
  v: number;
  obs: {
    n: number;
    min: number | null;
    mediana: number | null;
    max: number | null;
    casos_en_el_umbral: string[];
  };
  i: Idioma;
  alCambiar: (x: number) => void;
}) {
  const id = useId();
  const r = u.rango!;
  const plan = u.valorPlan as number;
  const movido = Math.abs(v - plan) > 1e-9;
  const pct = ((plan - r.min) / (r.max - r.min)) * 100;
  const fmt = (x: number) => decimal(x, u.decimales, i);
  const nota = `${id}-nota`;
  return (
    <div
      id={`w-${u.id}`}
      data-movido={movido}
      className={cx(
        "grid gap-2 rounded-baldosa border bg-sup-1 px-4 py-3.5",
        movido ? "border-tinta-2" : "border-linea",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-chico font-semibold">
          <span className="mr-1.5 font-mono text-dato font-medium text-tinta-2">
            {u.id}
          </span>
          {u.nombre}
        </label>
        <output
          htmlFor={id}
          className="text-cifra-chica font-semibold tabular-nums"
        >
          {fmt(v)}
        </output>
      </div>
      <span className={cx(MONO, "text-tinta-2")}>
        {u.senal} · {u.operador} ·{" "}
        <b
          className={
            movido ? "text-tinta-1 underline underline-offset-3" : "font-normal"
          }
        >
          {fmt(v)}
        </b>{" "}
        · {(u.inclusivo ? JUEGO.inclusivo : JUEGO.noInclusivo)[i]}
      </span>
      <div className="relative pt-1 pb-5">
        <input
          id={id}
          type="range"
          min={r.min}
          max={r.max}
          step={r.paso}
          value={v}
          aria-valuetext={fmt(v)}
          aria-describedby={nota}
          onChange={(e) => alCambiar(Number(e.target.value))}
          className={cx(
            "relative z-10 h-6 w-full cursor-pointer appearance-none bg-transparent",
            "[&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-barra [&::-webkit-slider-runnable-track]:bg-linea",
            "[&::-webkit-slider-thumb]:-mt-[7px] [&::-webkit-slider-thumb]:size-4.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-tinta-1 [&::-webkit-slider-thumb]:bg-fondo",
            "[&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-barra [&::-moz-range-track]:bg-linea",
            "[&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-tinta-1 [&::-moz-range-thumb]:bg-fondo",
            "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tinta-1",
          )}
        />
        <span
          aria-hidden="true"
          className="absolute top-7 -translate-x-1/2 text-center font-mono text-micro leading-none whitespace-nowrap text-tinta-2"
          style={{ left: `calc(${pct}% + ${9 - (pct / 100) * 18}px)` }}
        >
          <span className="mx-auto mb-0.5 block h-1.5 w-px bg-tinta-2" />
          {JUEGO.plan(fmt(plan))[i]}
        </span>
      </div>
      <div className="flex justify-between font-mono text-dato text-tinta-2">
        <span>{fmt(r.min)}</span>
        <span>{fmt(r.max)}</span>
      </div>
      <p id={nota} className="text-chico text-tinta-2">
        {u.descripcion}
      </p>
      <span
        className={cx(
          "solo-experto cambia-perfil rounded-r-control border-l-2 border-l-tinta-2 bg-sup-2 px-2.5 py-1.5",
          MONO,
          "text-tinta-2",
        )}
      >
        {JUEGO.observado[i]}: {obs.min === null ? "—" : datoCorto(obs.min, i)} ·{" "}
        {obs.mediana === null ? "—" : datoCorto(obs.mediana, i)} ·{" "}
        {obs.max === null ? "—" : datoCorto(obs.max, i)} (n = {obs.n}) ·{" "}
        {JUEGO.justo[i]}:{" "}
        {obs.casos_en_el_umbral.length
          ? obs.casos_en_el_umbral.join(", ")
          : "—"}
      </span>
      <span hidden={!movido} className="justify-self-start">
        <Chip procedencia="declarado">{JUEGO.movido(fmt(plan))[i]}</Chip>
      </span>
    </div>
  );
}

function Interruptor({
  u,
  v,
  i,
  alCambiar,
}: {
  u: UmbralIsla;
  v: boolean;
  i: Idioma;
  alCambiar: (x: boolean) => void;
}) {
  const id = useId();
  const plan = u.valorPlan as boolean;
  const movido = v !== plan;
  return (
    <div
      id={`w-${u.id}`}
      data-movido={movido}
      className={cx(
        "grid gap-2 rounded-baldosa border bg-sup-1 px-4 py-3.5",
        movido ? "border-tinta-2" : "border-linea",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-chico font-semibold">
          <span className="mr-1.5 font-mono text-dato font-medium text-tinta-2">
            {u.id}
          </span>
          {u.nombre}
        </span>
        <Chip procedencia="declarado">
          {(plan ? JUEGO.planEncendido : JUEGO.planApagado)[i]}
        </Chip>
      </div>
      <span className={cx("solo-experto cambia-perfil", MONO, "text-tinta-2")}>
        {u.senal} · {u.operador} · {JUEGO.verdadero[i]}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={v}
        aria-describedby={`${id}-nota`}
        onClick={() => alCambiar(!v)}
        className="inline-flex items-center gap-2.5 justify-self-start rounded-control py-1 text-chico font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta-1"
      >
        <span
          aria-hidden="true"
          className={cx(
            "relative h-5 w-9 rounded-full border transition-colors motion-reduce:transition-none",
            v ? "border-tinta-1 bg-tinta-1" : "border-tinta-2 bg-sup-2",
          )}
        >
          <span
            className={cx(
              "absolute top-0.5 size-3.5 rounded-full transition-[left] motion-reduce:transition-none",
              v ? "left-[18px] bg-fondo" : "left-0.5 bg-tinta-2",
            )}
          />
        </span>
        {u.nombre}
        <span className="font-mono text-dato text-tinta-2">
          {(v ? JUEGO.encendido : JUEGO.apagado)[i]}
        </span>
      </button>
      <p id={`${id}-nota`} className="text-chico text-tinta-2">
        {u.descripcion}
      </p>
      <span hidden={!movido} className="justify-self-start">
        <Chip procedencia="declarado">
          {(v ? JUEGO.texasMovido : JUEGO.texasMovidoApagado)[i]}
        </Chip>
      </span>
    </div>
  );
}

// --------------------------------------------------------------------------------------------- textos que cambian

function nombreSenal(s: string | null, i: Idioma): string {
  if (!s) return "";
  return (SENAL[s] ?? { es: s, en: s })[i];
}

function valorRegistro(x: JsonValor, i: Idioma): string {
  return typeof x === "number"
    ? Number.isInteger(x)
      ? String(x)
      : decimal(x, 2, i)
    : datoCorto(x, i);
}

export function porque(x: CambioDeCaso, i: Idioma): string {
  if (x.ahora === "no_observado") return PORQUE.noObservado(x.rama_nueva)[i];
  const d: RegistroDeArista | null = x.ahora_decide;
  if (d) {
    if (d.tipo === "funcion") return PORQUE_FUNCION[d.funcion ?? ""]![i];
    return PORQUE.ahora({
      senal: nombreSenal(d.senal, i),
      valor: valorRegistro(d.valor_observado, i),
      op: (OPERADOR[d.operador ?? ""] ?? {
        es: d.operador ?? "",
        en: d.operador ?? "",
      })[i],
      umbral: valorRegistro(d.umbral_aplicado, i),
    })[i];
  }
  const y = x.ya_no_decide;
  if (y && y.tipo === "tripleta")
    return PORQUE.yaNo({
      senal: nombreSenal(y.senal, i),
      valor: valorRegistro(y.valor_observado, i),
      op: (OPERADOR[y.operador ?? ""] ?? { es: "", en: "" })[i],
      umbral: valorRegistro(y.umbral_aplicado, i),
    })[i];
  return PORQUE.ninguna[i];
}

function reglaAplicada(x: CambioDeCaso): string {
  const s = Object.entries(x.senales)
    .map(([k, v]) => `${k} ${v === null ? "null" : String(v)}`)
    .join(" · ");
  return `${x.nodo} · ${s} → ${x.rama_nueva}`;
}

function frase(r: Consecuencias, d: DatosIsla, i: Idioma): string {
  const nCrit = r.criterios.length;
  if (r.movidos.length === 0)
    return FRASE.plan({
      personas: r.personas,
      minutos: r.minutos,
      cumplen: r.cumplen,
      criterios: nCrit,
    })[i];
  if (r.cambios.length === 0) return FRASE.nada[i];
  const partes: string[] = [];
  const caso = (x: CambioDeCaso) =>
    x.ahora === "no_observado"
      ? FRASE.caso.no_observado(x.id)
      : x.ahora === x.antes
        ? FRASE.caso.mismo_destino(x.id)
        : x.ahora === "persona"
          ? FRASE.caso.persona(x.id)
          : FRASE.caso.solo(x.id);
  const cs = r.cambios.map(caso);
  partes.push(
    FRASE.cambian({
      n: r.cambios.length,
      es: cs.map((c) => c.es),
      en: cs.map((c) => c.en),
    })[i],
  );
  if (r.introducidos.length)
    partes.push(
      FRASE.introducidos({
        n: r.introducidos.length,
        ids: enumerar(r.introducidos, i),
      })[i],
    );
  if (r.evitados.length) partes.push(FRASE.evitados(r.evitados.length)[i]);
  partes.push(
    FRASE.minutos({
      minutos: r.minutos,
      delta: r.minutos - r.minutos_plan,
      sinContar: r.no_observados.length,
    })[i],
  );
  const dejan = r.criterios
    .filter((c) => c.estado === "incumple" && c.estado_informe !== "incumple")
    .map((c) => c.id);
  const vuelven = r.criterios
    .filter((c) => c.estado === "cumple" && c.estado_informe !== "cumple")
    .map((c) => c.id);
  const sinMedir = r.criterios.filter(
    (c) => c.estado === "indeterminado" && c.estado_informe !== "indeterminado",
  );
  if (dejan.length)
    partes.push(
      FRASE.dejan({
        n: dejan.length,
        ids: enumerar(dejan, "es"),
        idsEn: enumerar(dejan, "en"),
      })[i],
    );
  if (vuelven.length)
    partes.push(
      FRASE.vuelven({
        n: vuelven.length,
        ids: enumerar(vuelven, "es"),
        idsEn: enumerar(vuelven, "en"),
      })[i],
    );
  if (sinMedir.length) {
    const ids = sinMedir.map((c) => c.id);
    const casos = [...new Set(sinMedir.flatMap((c) => c.no_evaluables))];
    partes.push(
      FRASE.sinMedir({
        ids: enumerar(ids, "es"),
        idsEn: enumerar(ids, "en"),
        casos: enumerar(casos, "es"),
        casosEn: enumerar(casos, "en"),
      })[i],
    );
  }
  if (!dejan.length && !sinMedir.length && !vuelven.length)
    partes.push(FRASE.siguen[i]);
  void d;
  return partes.join(" ");
}

function Destino({ d, i }: { d: Desenlace; i: Idioma }) {
  return (
    <span className="inline-flex items-center gap-1.25 whitespace-nowrap">
      {d === "persona" ? (
        <Glifo forma="cuadrado" tam={11} className="text-tipo-4" />
      ) : d === "solo" ? (
        <svg
          viewBox="-9 -9 18 18"
          width={11}
          height={11}
          aria-hidden="true"
          className="text-tinta-1"
        >
          <circle r={6.5} fill="none" stroke="currentColor" strokeWidth={1.6} />
        </svg>
      ) : (
        <Marca tipo="falta" tam={11} className="text-tinta-2" />
      )}
      {DESTINO[d][i]}
    </span>
  );
}

function Efecto({
  x,
  minutos,
  i,
}: {
  x: CambioDeCaso;
  minutos: number;
  i: Idioma;
}) {
  switch (x.efecto) {
    case "error_introducido":
      return (
        <Veredicto clase="no-cumple" chico>
          {EFECTO.error_introducido[i]}
        </Veredicto>
      );
    case "error_evitado":
      return (
        <Veredicto clase="cumple" chico>
          {EFECTO.error_evitado[i]}
        </Veredicto>
      );
    case "no_observado":
      return <SinProbar>{EFECTO.no_observado[i]}</SinProbar>;
    case "revision_de_mas":
      return (
        <Chip procedencia="declarado">
          {EFECTO.revision_de_mas(minutos)[i]}
        </Chip>
      );
    case "revision_ahorrada":
      return (
        <Chip procedencia="declarado">
          {EFECTO.revision_ahorrada(minutos)[i]}
        </Chip>
      );
    case "mismo_destino": {
      const que = VISITA_DE[x.nodo];
      return (
        <Chip procedencia="declarado">
          {x.visitas_ahorradas > 0 && que
            ? EFECTO.menos({
                n: x.visitas_ahorradas,
                que: x.visitas_ahorradas === 1 ? que.uno : que.varios,
              })[i]
            : EFECTO.mismo_destino[i]}
        </Chip>
      );
    }
  }
}

function CambioCriterio({ c, i }: { c: CriterioRecalculado; i: Idioma }) {
  if (c.estado === "incumple")
    return (
      <div className="flex flex-wrap items-center gap-2 text-chico">
        <Veredicto clase="no-cumple" chico>
          {CRITERIO_CAMBIO.incumple(c.id)[i]}
        </Veredicto>
        {c.casos_que_incumplen.length
          ? CRITERIO_CAMBIO.casos(enumerar(c.casos_que_incumplen, i))[i]
          : null}
      </div>
    );
  if (c.estado === "cumple")
    return (
      <div className="flex flex-wrap items-center gap-2 text-chico">
        <Veredicto clase="cumple" chico>
          {CRITERIO_CAMBIO.cumple(c.id)[i]}
        </Veredicto>
      </div>
    );
  return (
    <div className="flex flex-wrap items-center gap-2 text-chico">
      <SinProbar>{CRITERIO_CAMBIO.indeterminado(c.id)[i]}</SinProbar>
      {c.no_evaluables.length
        ? CRITERIO_CAMBIO.noEvaluables(enumerar(c.no_evaluables, i))[i]
        : null}
    </div>
  );
}

function Cifra({
  cifra,
  texto,
  sub,
  id,
}: {
  cifra: ReactNode;
  texto: string;
  sub: ReactNode;
  id: string;
}) {
  return (
    <div className="grid content-start gap-0.5" id={id}>
      <b className="text-cifra leading-[1.1] font-semibold tabular-nums">
        {cifra}
      </b>
      <span className="text-chico">{texto}</span>
      <small className="text-dato text-tinta-2">{sub}</small>
    </div>
  );
}

// --------------------------------------------------------------------------------------------- la regla viva

function ReglaViva({
  d,
  u,
  r,
  i,
}: {
  d: DatosIsla;
  u: Umbrales;
  r: Consecuencias;
  i: Idioma;
}) {
  const c = d.compacto;
  const plan = umbralesDelPlan(c);
  const nodos = d.nodosEnOrden;
  const valorDe = (id: string) => {
    const um = d.umbrales.find((x) => x.id === id)!;
    const v = u[id] as number | boolean;
    const texto =
      typeof v === "boolean" ? String(v) : decimal(v, um.decimales, i);
    return v !== plan[id] ? (
      <b className="text-tinta-1 underline underline-offset-3">{texto}</b>
    ) : (
      texto
    );
  };
  const cambiados = r.criterios.filter(
    (x) => x.recalculado || x.estado !== x.estado_informe,
  );
  return (
    <BloqueExperto rotulo={PERFIL.experto[i]}>
      <h3 className="mb-2 flex items-center gap-2 text-sub font-semibold">
        <Icono de={Braces} className="text-tinta-2" />
        {REGLA_VIVA.titulo[i]}
      </h3>
      <dl className="m-0 grid grid-cols-1 chico:grid-cols-[minmax(0,112px)_minmax(0,1fr)]">
        {nodos.map((n) => {
          const aristas = c.aristas
            .filter((a) => a.desde === n)
            .sort((a, b) => a.orden - b.orden);
          const defecto = c.ramas_por_defecto[n];
          return (
            <div key={n} className="contents">
              <dt className="border-t border-linea py-1.75 pr-3 text-chico text-tinta-2">
                {n}
              </dt>
              <dd
                className={cx(
                  "border-linea pb-1.75 chico:border-t chico:pt-1.75",
                  MONO,
                )}
              >
                {aristas.map((a) => (
                  <span key={a.orden} className="block">
                    {a.orden} ·{" "}
                    {"senal" in a ? (
                      <>
                        {a.senal} · {a.operador} ·{" "}
                        {typeof a.valor === "string" &&
                        a.valor.startsWith("umbral.") ? (
                          <>
                            {a.valor.slice(7)} = {valorDe(a.valor.slice(7))}
                          </>
                        ) : (
                          String(a.valor)
                        )}
                        {a.operador === "menor_que" ||
                        a.operador === "mayor_que"
                          ? ` · ${(a.inclusivo ? JUEGO.inclusivo : JUEGO.noInclusivo)[i]}`
                          : ""}
                      </>
                    ) : (
                      <>
                        {a.funcion.nombre}(
                        {a.funcion.entradas.map((e, k) => {
                          const id = c.ligaduras[e];
                          return (
                            <span key={e}>
                              {k ? ", " : ""}
                              {id ? (
                                <>
                                  {e} = {valorDe(id)}
                                </>
                              ) : (
                                e
                              )}
                            </span>
                          );
                        })}
                        )
                      </>
                    )}{" "}
                    → {a.si_verdadero}
                  </span>
                ))}
                {defecto ? (
                  <span className="block text-tinta-2">
                    {
                      (aristas.length > 1
                        ? REGLA_VIVA.siNinguna
                        : REGLA_VIVA.siNo)(defecto)[i]
                    }
                  </span>
                ) : null}
              </dd>
            </div>
          );
        })}
        <div className="contents">
          <dt className="border-t border-linea py-1.75 pr-3 text-chico text-tinta-2">
            {REGLA_VIVA.criterios[i]}
          </dt>
          <dd
            className={cx(
              "border-linea pb-1.75 chico:border-t chico:pt-1.75",
              MONO,
            )}
          >
            {cambiados.length === 0 ? (
              <span className="text-tinta-2">
                {REGLA_VIVA.ningunCriterio[i]}
              </span>
            ) : (
              cambiados.map((x) => (
                <span key={x.id} className="block">
                  {x.id} · {d.criterios.find((k) => k.id === x.id)?.regla}
                </span>
              ))
            )}
          </dd>
        </div>
      </dl>
    </BloqueExperto>
  );
}

// --------------------------------------------------------------------------------------------- la isla

export function Juego({ datos }: { datos: DatosIsla }) {
  const i = datos.idioma;
  const c = datos.compacto;
  const plan = useMemo(() => umbralesDelPlan(c), [c]);
  const [u, setU] = useState<Umbrales>(plan);
  const r = useMemo(() => consecuencias(c, u), [c, u]);
  const obs = useMemo(() => observados(c, u), [c, u]);
  const poner = (id: string, v: number | boolean) =>
    setU((x) => ({ ...x, [id]: v }));
  const minutos = c.minutos_por_persona;
  const cambia = new Set(r.cambios.map((x) => x.id));
  const movidosTexto = r.movidos.map((id) => {
    const um = datos.umbrales.find((x) => x.id === id)!;
    const v = u[id] as number | boolean;
    if (typeof v === "boolean")
      return v ? INTERRUPTOR[id]!.on : INTERRUPTOR[id]!.off;
    return {
      es: `${id} ${decimal(v, um.decimales, "es")}`,
      en: `${id} ${decimal(v, um.decimales, "en")}`,
    };
  });
  const sinMedir = r.criterios.filter(
    (x) => x.estado === "indeterminado" && x.estado_informe !== "indeterminado",
  ).length;
  const criteriosCambian = r.criterios.filter(
    (x) => x.estado !== x.estado_informe,
  );
  // Encender un interruptor sin cambiar ningún caso se explica solo si el dato lo sostiene: toda propuesta adversa
  // ya pasaba por una persona.
  const soloBooleano =
    r.movidos.length > 0 && r.movidos.every((id) => typeof u[id] === "boolean");
  const adversasConPersona = c.casos.every((k) =>
    k.visitas.every(
      (v) =>
        !("propuesta" in v.senales) ||
        v.senales.propuesta === "aprobar" ||
        k.registrado === "persona",
    ),
  );
  // Un solo interruptor encendido que no cambia ningún caso tiene su explicación propia (la del plan).
  const interruptorSinCambio =
    soloBooleano && adversasConPersona && r.movidos.length === 1
      ? u[r.movidos[0]!] === true
        ? INTERRUPTOR[r.movidos[0]!]!.sinCambio
        : null
      : null;
  const vacio =
    r.movidos.length === 0
      ? CAMBIOS.mueve[i]
      : interruptorSinCambio
        ? interruptorSinCambio[i]
        : CAMBIOS.ninguno[i];
  const curva = datos.curva;
  const u1 = curva ? (u[curva.umbral] as number) : null;
  const umbralCurva = curva
    ? datos.umbrales.find((x) => x.id === curva.umbral)
    : undefined;

  return (
    <>
      <Seccion
        id="s-juego-t"
        titulo={JUEGO.titulo[i]}
        cabecera={
          <Chip procedencia="real">{JUEGO.chip(c.casos.length)[i]}</Chip>
        }
      >
        <div className="grid grid-cols-1 items-start gap-6 amplio:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="grid gap-3">
            {datos.umbrales.map((um) => {
              const o = obs.find((x) => x.id === um.id)!;
              return um.rango ? (
                <Deslizador
                  key={um.id}
                  u={um}
                  v={u[um.id] as number}
                  obs={o}
                  i={i}
                  alCambiar={(x) => poner(um.id, x)}
                />
              ) : (
                <Interruptor
                  key={um.id}
                  u={um}
                  v={u[um.id] as boolean}
                  i={i}
                  alCambiar={(x) => poner(um.id, x)}
                />
              );
            })}
          </div>
          <div className="grid gap-4">
            <div className="grid gap-4 rounded-baldosa border border-linea bg-sup-1 p-4">
              <div className="grid grid-cols-2 gap-4 escritorio:grid-cols-4">
                <Cifra
                  id="k-cambian"
                  cifra={r.cambios.length}
                  texto={CIFRAS.cambian[i]}
                  sub={
                    <>
                      {CIFRAS.de(c.casos.length)[i]}
                      {r.no_observados.length
                        ? ` · ${CIFRAS.noObservados(r.no_observados.length)[i]}`
                        : ""}
                    </>
                  }
                />
                <Cifra
                  id="k-intro"
                  cifra={r.introducidos.length}
                  texto={CIFRAS.introducidos[i]}
                  sub={CIFRAS.evitados(r.evitados.length)[i]}
                />
                <Cifra
                  id="k-min"
                  cifra={r.minutos}
                  texto={CIFRAS.minutos[i]}
                  sub={
                    CIFRAS.minutosPlan({
                      plan: r.minutos_plan,
                      delta: r.minutos - r.minutos_plan,
                    })[i]
                  }
                />
                <Cifra
                  id="k-crit"
                  cifra={r.cumplen}
                  texto={CIFRAS.criterios(r.criterios.length)[i]}
                  sub={
                    <>
                      {criteriosCambian.length
                        ? CIFRAS.antes(
                            r.criterios.filter(
                              (x) => x.estado_informe === "cumple",
                            ).length,
                          )[i]
                        : CIFRAS.sinCambio[i]}
                      {sinMedir ? ` · ${CIFRAS.sinMedir(sinMedir)[i]}` : ""}
                    </>
                  }
                />
              </div>
              <p className="flex flex-wrap items-center gap-2 text-dato text-tinta-2">
                {CIFRAS.nota(minutos)[i]}
                <Chip procedencia="real">{CIFRAS.chip(datos.version)[i]}</Chip>
              </p>
              <p id="k-frase" className="solo-lider text-texto leading-[1.6]">
                {frase(r, datos, i)}
              </p>
              <ReglaViva d={datos} u={u} r={r} i={i} />
              {criteriosCambian.length ? (
                <div className="grid gap-2" id="k-crit-l">
                  {criteriosCambian.map((x) => (
                    <CambioCriterio key={x.id} c={x} i={i} />
                  ))}
                </div>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-linea pt-3">
                <p
                  role="status"
                  aria-live="polite"
                  className="flex items-center gap-2 text-chico"
                >
                  <Marca
                    tipo={r.movidos.length ? "parcial" : "cumple"}
                    tam={15}
                    className="text-tinta-1"
                  />
                  {r.movidos.length
                    ? ESTADO.movido({
                        es: movidosTexto.map((m) => m.es).join(" · "),
                        en: movidosTexto.map((m) => m.en).join(" · "),
                      })[i]
                    : ESTADO.enPlan(c.casos.length)[i]}
                </p>
                <button
                  type="button"
                  className={claseBoton({ chico: true })}
                  disabled={r.movidos.length === 0}
                  onClick={() => setU(plan)}
                >
                  <Icono de={History} />
                  {ESTADO.volver[i]}
                </button>
              </div>
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sub font-semibold">
                <Icono de={ListChecks} className="text-tinta-2" />
                {CAMBIOS.titulo[i]}
              </h3>
              {r.cambios.length === 0 ? (
                <p
                  id="cambios"
                  className="rounded-control border border-linea px-3 py-2.5 text-chico text-tinta-2"
                >
                  {vacio}
                </p>
              ) : (
                <div id="cambios" className="grid">
                  <div className="hidden gap-3 pb-1.5 text-dato text-tinta-2 escritorio:grid escritorio:grid-cols-[56px_minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,1.4fr)_minmax(0,1.2fr)]">
                    <span>{CAMBIOS.columnas.caso[i]}</span>
                    <span>{CAMBIOS.columnas.tipo[i]}</span>
                    <span>{CAMBIOS.columnas.antesAhora[i]}</span>
                    <span>{CAMBIOS.columnas.porque[i]}</span>
                    <span>{CAMBIOS.columnas.consecuencia[i]}</span>
                  </div>
                  {r.cambios.map((x) => {
                    const caso = datos.casos.find((k) => k.id === x.id);
                    return (
                      <div
                        key={x.id}
                        data-caso={x.id}
                        className="grid grid-cols-[56px_minmax(0,1fr)] items-start gap-x-3 gap-y-1.5 border-t border-linea py-3 text-chico escritorio:grid-cols-[56px_minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,1.4fr)_minmax(0,1.2fr)]"
                      >
                        <span className="font-mono text-dato">{x.id}</span>
                        <span className="text-tinta-2">{caso?.tipo}</span>
                        <span className="col-start-2 flex flex-wrap items-center gap-1.5 escritorio:col-start-auto">
                          <Destino d={x.antes} i={i} />
                          <Icono
                            de={ArrowRight}
                            tam={12}
                            className="text-tinta-2"
                          />
                          <Destino d={x.ahora} i={i} />
                        </span>
                        <span className="col-start-2 escritorio:col-start-auto">
                          {porque(x, i)}
                          <span
                            className={cx(
                              "solo-experto cambia-perfil mt-0.5 block",
                              MONO,
                              "text-tinta-2",
                            )}
                          >
                            {reglaAplicada(x)}
                          </span>
                        </span>
                        {/* En la columna angosta la marca de la consecuencia se parte en dos líneas, como en la maqueta. */}
                        <span className="col-start-2 grid justify-items-start gap-1 escritorio:col-start-auto [&>span]:h-auto [&>span]:min-h-5 [&>span]:py-0.5 [&>span]:leading-[1.3] [&>span]:whitespace-normal">
                          <Efecto x={x} minutos={minutos} i={i} />
                          {caso ? (
                            <a
                              href={caso.href}
                              className="inline-flex items-center gap-1 text-dato text-tinta-1 underline underline-offset-3"
                            >
                              <Icono
                                de={ArrowRight}
                                tam={12}
                                className="text-tinta-2"
                              />
                              {EFECTO.traza[i]}
                              <span className="sr-only"> {x.id}</span>
                            </a>
                          ) : null}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="solo-experto cambia-perfil mt-2 rounded-r-control border-l-2 border-l-tinta-2 bg-sup-2 px-2.5 py-1.5 text-dato text-tinta-2">
                {
                  CAMBIOS.comprobacion({
                    a: c.casos.length,
                    b: c.casos.length,
                  })[i]
                }
              </p>
            </div>
          </div>
        </div>

        <BloqueExperto rotulo={PERFIL.experto[i]} className="mt-6">
          <h3 className="mb-1 flex items-center gap-2 text-sub font-semibold">
            <Icono de={Database} className="text-tinta-2" />
            {TABLA.titulo(c.casos.length)[i]}
          </h3>
          <p className="mb-2 text-dato text-tinta-2">{TABLA.nota[i]}</p>
          <TablaDecisiones d={datos} r={r} cambia={cambia} i={i} />
        </BloqueExperto>
      </Seccion>

      {curva && u1 !== null && umbralCurva ? (
        <Seccion
          id="s-curva-t"
          titulo={CURVA.titulo[i]}
          cabecera={<Chip procedencia="real">{CURVA.chip(curva.n)[i]}</Chip>}
        >
          <p className="mb-6 max-w-[72ch] text-texto leading-[1.6]">
            {curva.lectura}
          </p>
          <div className="grid grid-cols-1 items-start gap-6 amplio:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <figure className="m-0 rounded-baldosa border border-linea bg-sup-1 p-4">
              <Curva
                id="curva-pg"
                puntos={curva.puntos}
                plan={curva.plan}
                actual={u1}
                textos={{
                  titulo: CURVA.tituloSvg({ n: curva.n })[i],
                  ejeCobertura: CURVA.ejeCobertura[i],
                  ejeRiesgo: CURVA.ejeRiesgo[i],
                  pct: (x) => porcentaje(Math.round(x * 100) / 100, i),
                  plan: (us) =>
                    `plan · ${curva.umbral} ${decimal(us[0]!, umbralCurva.decimales, i)}`,
                  grupo: (us) =>
                    `${curva.umbral} ${decimal(us[0]!, umbralCurva.decimales, i)}`,
                  actual: (v, cob) =>
                    `${i === "es" ? "actual" : "current"} · ${curva.umbral} ${decimal(v, umbralCurva.decimales, i)} · ${porcentaje(Math.round(cob * 100) / 100, i)}`,
                }}
              />
              <figcaption className="mt-2 text-dato text-tinta-2">
                {CURVA.pie[i]}
              </figcaption>
            </figure>
            <div className="grid">
              <div className="grid grid-cols-[60px_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-2 pb-1.5 text-dato text-tinta-2">
                <span>{curva.umbral}</span>
                <span>{CURVA.columnas.cobertura[i]}</span>
                <span>{CURVA.columnas.escalamiento[i]}</span>
                <span>{CURVA.columnas.riesgo[i]}</span>
                <span>{CURVA.columnas.solos[i]}</span>
              </div>
              {curva.puntos.map((p) => {
                const esPlan = Math.abs(p.umbral - curva.plan) < 1e-9;
                const esActual = Math.abs(p.umbral - u1) < 1e-9;
                return (
                  <div
                    key={p.umbral}
                    data-u={p.umbral}
                    data-actual={esActual}
                    data-plan={esPlan}
                    className={cx(
                      "grid grid-cols-[60px_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] items-center gap-2 border-t border-linea py-1.75 font-mono text-dato",
                      esActual && "bg-sup-2",
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {esActual ? (
                        <span
                          aria-hidden="true"
                          className="inline-block size-2 bg-tinta-1"
                        />
                      ) : null}
                      {decimal(p.umbral, umbralCurva.decimales, i)}
                      {esPlan ? (
                        <span
                          aria-hidden="true"
                          className="inline-block size-2 rounded-full border border-tinta-1"
                        />
                      ) : null}
                      {esActual ? (
                        <span className="sr-only"> ({CURVA.srActual[i]})</span>
                      ) : null}
                      {esPlan ? (
                        <span className="sr-only"> ({CURVA.srPlan[i]})</span>
                      ) : null}
                    </span>
                    <span>{porcentajeFijo(p.cobertura, 1, i)}</span>
                    <span>{porcentajeFijo(1 - p.cobertura, 1, i)}</span>
                    <span>
                      {p.riesgo === null
                        ? CURVA.sinCaso[i]
                        : porcentaje(p.riesgo, i)}
                    </span>
                    <span>{p.aceptados}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Seccion>
      ) : null}
    </>
  );
}

function TablaDecisiones({
  d,
  r,
  cambia,
  i,
}: {
  d: DatosIsla;
  r: Consecuencias;
  cambia: ReadonlySet<string>;
  i: Idioma;
}) {
  const cols = `56px minmax(0,1.3fr) ${d.columnas.map(() => "minmax(0,0.8fr)").join(" ")} minmax(0,1.1fr)`;
  return (
    <div className="grid" style={{ "--cols": cols } as CSSProperties}>
      <div className="hidden gap-2 pb-1.5 text-dato text-tinta-2 escritorio:grid escritorio:grid-cols-[var(--cols)]">
        <span>{TABLA.caso[i]}</span>
        <span>{TABLA.tipo[i]}</span>
        {d.columnas.map((c) => (
          <span key={c.senal}>{c.titulo}</span>
        ))}
        <span>{TABLA.planAhora[i]}</span>
      </div>
      {d.compacto.casos.map((k) => {
        const dest = r.destinos.find((x) => x.id === k.id)!;
        const marcada = cambia.has(k.id);
        const tipo = d.casos.find((x) => x.id === k.id)?.tipo;
        return (
          <div
            key={k.id}
            data-caso={k.id}
            data-cambia={marcada}
            className={cx(
              "grid grid-cols-2 items-center gap-x-2 gap-y-1 border-t border-linea py-1.75 text-dato escritorio:grid-cols-[var(--cols)]",
              marcada && "bg-sup-1",
            )}
          >
            <span className="font-mono">
              {marcada ? (
                <span
                  aria-hidden="true"
                  className="mr-1 inline-block size-2 bg-tinta-1"
                />
              ) : null}
              {k.id}
            </span>
            <span>{tipo}</span>
            {d.columnas.map((c) => {
              const vals = k.visitas
                .filter((v) => v.desde === c.nodo && c.senal in v.senales)
                .map((v) => v.senales[c.senal]);
              const texto =
                vals.length === 0
                  ? "—"
                  : vals.length === 1
                    ? datoCorto(vals[0], i)
                    : vals.map((x) => datoCorto(x, i)).join("·");
              return (
                <span key={c.senal} className="font-mono">
                  <span className={ET}>{c.titulo}</span>
                  {texto}
                </span>
              );
            })}
            <span className="col-span-2 escritorio:col-span-1">
              <span className={ET}>{TABLA.planAhora[i]}</span>
              {DESTINO.corto[dest.antes]![i]} → {DESTINO.corto[dest.ahora]![i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export { SIMBOLO };
