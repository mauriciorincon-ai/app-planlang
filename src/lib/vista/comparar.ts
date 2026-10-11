/**
 * La pantalla «Comparar dos corridas» (S4): del resultado de `core/comparar` a filas listas para pintar. Solo cambia el
 * idioma y el formato de los números; las medidas, los estados y las categorías llegan del núcleo. Sin Intl: los números
 * salen de `core/brecha/numeros` (coma decimal en español).
 */
import type { TextoBilingue, Idioma } from "@core/formatos/bilingue";
import { LADOS, type Lado, type ResumenDeLado } from "@core/comparar";
import { num, numCorto, pct } from "@core/brecha/numeros";
import type { DatosDemo } from "@/lib/datos/vitrina";
import {
  AVISO,
  DECISION,
  ESTADO_CRITERIO,
  ESTADO_RIESGO,
  ETIQUETA,
  LIDER,
  METRICAS,
  PAUSAS,
  VEREDICTO,
} from "@/textos/comparar";
import { enlaceACaso } from "./paginas-caso";

type Veredicto = ResumenDeLado["veredicto"]["valor"];

export interface CeldaCriterio {
  estado: string;
  valor: string;
}

export interface CeldaRiesgo {
  estado: string;
  valor: string;
  marcados: number;
}

export interface VistaComparar {
  n: number;
  planVersion: string;
  ejecucionVersion: string;
  veredictos: Record<Lado, { valor: Veredicto; texto: string }>;
  metricas: { etiqueta: string; valores: Record<Lado, string> }[];
  pausas: { etiqueta: string; valores: Record<Lado, number> }[];
  decisiones: Record<Lado, string>;
  criterios: {
    id: string;
    enunciado: string;
    objetivo: string;
    celdas: Record<Lado, CeldaCriterio>;
  }[];
  riesgos: {
    id: string;
    modo: string;
    severidad: number;
    umbral: string;
    celdas: Record<Lado, CeldaRiesgo>;
  }[];
  casos: {
    id: string;
    verdad: string;
    debeEscalar: boolean;
    celdas: Record<Lado, { decision: string; pausa: boolean }>;
    href: string | null;
  }[];
  textos: {
    lider: Record<"veredicto" | "riesgos" | "casos", string>;
    revisor: string;
    costo: string;
    alcance: string;
  };
}

const t = (x: TextoBilingue, i: Idioma): string => x[i];

/** Una decisión que el núcleo no conoce se nombra como error: mostrarla como otra sería mentir. */
function decision(v: string, i: Idioma): string {
  if (!(v in DECISION))
    throw new Error(`vista comparar: decisión desconocida «${v}»`);
  return t(DECISION[v as keyof typeof DECISION], i);
}

const sino = (v: boolean, i: Idioma): string =>
  v ? t(ETIQUETA.si, i) : t(ETIQUETA.no, i);

function valorDeCriterio(v: number | boolean | null, i: Idioma): string {
  if (v === null) return t(ETIQUETA.noObservado, i);
  if (typeof v === "boolean") return sino(v, i);
  return numCorto(v, i, 3);
}

function textoDeVeredicto(v: Veredicto, i: Idioma): string {
  return t(VEREDICTO[v], i);
}

/** Los números de cada lado, en el formato de su idioma. */
function metricasDe(
  lados: Record<Lado, ResumenDeLado>,
  i: Idioma,
): VistaComparar["metricas"] {
  const f = (fn: (r: ResumenDeLado) => string) =>
    Object.fromEntries(LADOS.map((l) => [l, fn(lados[l])])) as Record<
      Lado,
      string
    >;
  return [
    {
      etiqueta: t(METRICAS.exactitud, i),
      valores: f((r) => pct(r.exactitud, i)),
    },
    {
      etiqueta: t(METRICAS.latencia, i),
      valores: f((r) =>
        r.latencia_mediana_s === null
          ? "—"
          : `${num(r.latencia_mediana_s, i, 3)} s`,
      ),
    },
    {
      etiqueta: t(METRICAS.costo, i),
      valores: f((r) => num(r.presupuesto.costo_nominal_usd, i, 4)),
    },
    {
      etiqueta: t(METRICAS.llamadas, i),
      valores: f((r) => String(r.presupuesto.llamadas_al_modelo)),
    },
    {
      etiqueta: t(METRICAS.decisiones, i),
      valores: f((r) => String(r.decisiones.correctas)),
    },
  ];
}

export function vistaComparar(d: DatosDemo, i: Idioma): VistaComparar | null {
  const c = d.comparacion;
  if (!c) return null;
  const lados = c.lados;
  const decisiones = Object.fromEntries(
    LADOS.map((l) => [
      l,
      `${lados[l].decisiones.correctas} ${t(ETIQUETA.de, i)} ${c.lote.n} ${t(ETIQUETA.correctas, i)}`,
    ]),
  ) as Record<Lado, string>;
  const pausas = (
    [
      ["necesaria", PAUSAS.necesaria],
      ["innecesaria", PAUSAS.innecesaria],
      ["omitida", PAUSAS.omitida],
      ["sin_pausa_correcta", PAUSAS.sinPausaCorrecta],
    ] as const
  ).map(([clave, texto]) => ({
    etiqueta: t(texto, i),
    valores: Object.fromEntries(
      LADOS.map((l) => [l, lados[l].pausas[clave]]),
    ) as Record<Lado, number>,
  }));
  const umbralDe = (ocurre: string | null) => ocurre ?? "—";
  // Lo que separa a los lados sale de sus estados, no de un texto fijo (AU-S4, A-1).
  const separan = [
    ...c.criterios
      .filter((k) => k.por_lado.multiagente.estado !== k.por_lado.agente_unico.estado)
      .map((k) => k.id),
    ...c.riesgos
      .filter((r) => r.por_lado.multiagente.estado !== r.por_lado.agente_unico.estado)
      .map((r) => r.id),
  ];
  const pausasBase = lados.agente_unico.pausas.innecesaria;
  const pausasMulti = lados.multiagente.pausas.innecesaria;
  const liderVeredicto =
    separan.length === 0
      ? t(LIDER.veredictoIguales, i)
      : t(LIDER.veredictoSeparan(separan.join(", ")), i);
  const liderRiesgos = t(
    pausasBase > pausasMulti
      ? LIDER.pausasMasEnBase(pausasBase, pausasMulti)
      : LIDER.pausasMasEnMulti(pausasBase, pausasMulti),
    i,
  );

  const casos = c.casos_que_difieren.map((x) => ({
    id: x.id,
    verdad: decision(x.verdad.decision, i),
    debeEscalar: x.verdad.debe_escalar,
    celdas: Object.fromEntries(
      LADOS.map((l) => [
        l,
        {
          decision:
            x.por_lado[l].decision_final === null
              ? t(ETIQUETA.noObservado, i)
              : decision(x.por_lado[l].decision_final, i),
          pausa: x.por_lado[l].pausa,
        },
      ]),
    ) as Record<Lado, { decision: string; pausa: boolean }>,
    href: enlaceACaso(d, x.id, i),
  }));

  return {
    n: c.lote.n,
    planVersion: c.plan.version,
    ejecucionVersion: c.plan.de_ejecucion.version,
    veredictos: Object.fromEntries(
      LADOS.map((l) => [
        l,
        {
          valor: lados[l].veredicto.valor,
          texto: textoDeVeredicto(lados[l].veredicto.valor, i),
        },
      ]),
    ) as VistaComparar["veredictos"],
    metricas: metricasDe(lados, i),
    pausas,
    decisiones,
    criterios: c.criterios.map((k) => ({
      id: k.id,
      enunciado: t(k.enunciado, i),
      objetivo: valorDeCriterio(k.objetivo, i),
      celdas: Object.fromEntries(
        LADOS.map((l) => [
          l,
          {
            estado: t(ESTADO_CRITERIO[k.por_lado[l].estado], i),
            valor: valorDeCriterio(k.por_lado[l].valor_medido, i),
          },
        ]),
      ) as Record<Lado, CeldaCriterio>,
    })),
    riesgos: c.riesgos.map((r) => ({
      id: r.id,
      modo: t(r.modo, i),
      severidad: r.severidad,
      umbral: umbralDe(r.ocurre_si),
      celdas: Object.fromEntries(
        LADOS.map((l) => [
          l,
          {
            estado: t(ESTADO_RIESGO[r.por_lado[l].estado], i),
            valor:
              r.por_lado[l].valor === null
                ? t(ETIQUETA.noObservado, i)
                : numCorto(r.por_lado[l].valor, i, 4),
            marcados: r.por_lado[l].casos_marcados,
          },
        ]),
      ) as Record<Lado, CeldaRiesgo>,
    })),
    casos,
    textos: {
      lider: {
        veredicto: liderVeredicto,
        riesgos: liderRiesgos,
        casos: t(LIDER.casos, i),
      },
      revisor: t(AVISO.revisor, i),
      costo: t(AVISO.costo, i),
      alcance: t(AVISO.alcance, i),
    },
  };
}
