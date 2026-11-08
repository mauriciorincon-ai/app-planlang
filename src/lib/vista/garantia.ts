/**
 * La calibración con garantía lista para pintar (S8, ADR-018): del bloque `garantia` del supuesto S1 del informe a los
 * textos de cada nivel de α, en los dos registros. Se arma al compilar: la isla del playground y la Brecha reciben
 * cadenas y números ya escritos, y no calculan nada al pintar (LCP, ADR-017). Una sola función para las dos pantallas,
 * de modo que digan lo mismo.
 */
import type { Idioma } from "@core/formatos/bilingue";
import {
  TOPE_DE_ESCALA,
  type CoberturaConjunta,
  type Faltan,
  type GarantiaDeCalibracion,
  type NivelDeGarantia,
} from "@core/brecha/garantia";
import { ETAPA, ETAPA_CORTA, EXPERTO, LIDER, ZONA } from "@/textos/garantia";
import { decimal, enumerar, porcentaje } from "./formato";
import type { Zona } from "./zona";

export interface NivelVista {
  /** El α del nivel (0,05 · 0,10 · 0,20): la clave del selector. */
  alfa: number;
  /** «10 %»: el error que acepta el visitante, en llano. */
  alfaPct: string;
  /** El texto de la opción del selector: «10 % (α 0,10)». */
  opcion: string;
  esDelInforme: boolean;
  zona: Zona | null;
  /** Una línea: «Zona respaldada con 10 % de error: …» o «No hay zona respaldada …». */
  leyenda: string;
  /** El párrafo de líder: qué respaldan los datos o, si no hay zona, por qué y cuántos casos harían falta. */
  lider: string;
  /** Dónde cae el umbral que usó la corrida frente a la zona (`null` si la corrida no declara uno). */
  aplicado: string | null;
  /**
   * La cobertura conjunta de este nivel en llano: si los datos la respaldan o lo que no alcanzan (y el n que haría
   * falta). Con una sola etapa medida dice que no hay nada que sumar; `null` si no hay etapas.
   */
  conjunta: string | null;
  /** Registro de experto: las pruebas del nivel, la cobertura conjunta y el error conjunto observado. */
  experto: string[];
  /** Las celdas de la fila del nivel en la tabla del experto. */
  fila: string[];
}

export interface VistaGarantia {
  /** El umbral cuya curva se mide (`U1`). */
  umbral: string;
  seguridad: string;
  /** «0,10». */
  delta: string;
  n: number;
  aciertos: number;
  /** El índice del nivel que el informe declara. */
  porOmision: number;
  niveles: NivelVista[];
  /** Las etapas con modelo sin verdad en los casos, en llano; `null` si todas se observan. */
  noObservadas: string | null;
  /** Por qué el orden de la prueba (secuencia fija desde el umbral más alto) importa para lo que dice «no se respalda». */
  secuencia: string;
  /** Registro de experto: lo que cada etapa con modelo falló entre los casos medidos. */
  etapas: string;
  tablaExperto: { titulo: string; columnas: string[] };
  metodo: string;
  alcance: string;
}

const cerca = (a: number, b: number) => Math.abs(a - b) < 1e-9;

/** «p = 0,0931»; con 4 decimales un p de 0,00004 no es cero: «p < 0,0001». */
function pTexto(p: number, i: Idioma): string {
  return p < 0.00005 ? `p ${EXPERTO.menorQue[i]}` : `p = ${decimal(p, 4, i)}`;
}

function nombres(nodos: readonly string[], i: Idioma): string {
  return enumerar(
    nodos.map((n) => ETAPA[n]?.[i] ?? n),
    i,
  );
}

/** El párrafo de líder de un nivel sin zona: la causa que el cálculo dejó, con los números que la sostienen. */
function liderSinZona(
  n: NivelDeGarantia,
  g: GarantiaDeCalibracion,
  ctx: { alfa: string; seguridad: string; dec: number },
  i: Idioma,
): string {
  const u = (x: number) => decimal(x, ctx.dec, i);
  const base = { alfa: ctx.alfa, seguridad: ctx.seguridad };
  const f = n.umbral_con_garantia.faltan;
  if (f)
    return f.motivo === "pocos_casos"
      ? LIDER.pocosCasos({
          ...base,
          umbral: u(f.umbral),
          solos: f.aceptados,
          casos: f.casos as number,
        })[i]
      : f.motivo === "tasa_cerca_de_alfa"
        ? LIDER.tasaCerca({
            ...base,
            umbral: u(f.umbral),
            solos: f.aceptados,
            errores: f.errores,
            casos: f.casos,
            tope: TOPE_DE_ESCALA,
          })[i]
        : LIDER.tasaSobre({
            ...base,
            umbral: u(f.umbral),
            solos: f.aceptados,
            errores: f.errores,
          })[i];
  if (n.sin_zona === "sin_cota_conformal")
    return LIDER.sinCota({
      ...base,
      aciertos: n.conformal.n_aciertos,
      minimo: n.conformal.aciertos_minimos,
    })[i];
  return LIDER.conformalBajo({
    ...base,
    pasa: porcentaje(1 - n.alfa, i),
    umbral: u(n.conformal.umbral as number),
    respalda: u(n.umbral_con_garantia.umbral as number),
  })[i];
}

function conjuntaEnLlano(
  c: CoberturaConjunta,
  ctx: { alfa: string; seguridad: string; dec: number },
  i: Idioma,
): string | null {
  // Con una sola etapa medida, la conjunta es la de la etapa: no hay nada que sumar, y el líder lo dice (no calla).
  if (c.k < 2)
    return c.nodos.length === 1
      ? LIDER.conjuntaUnaEtapa({ etapa: nombres(c.nodos, i) })[i]
      : null;
  const u = (x: number) => decimal(x, ctx.dec, i);
  const etapas = nombres(c.nodos, i);
  if (c.umbral !== null)
    return LIDER.conjuntaSi({
      alfa: ctx.alfa,
      seguridad: ctx.seguridad,
      etapas,
      umbral: u(c.umbral),
    })[i];
  const f = c.faltan as Faltan;
  const etapa = f.nodo ? (ETAPA[f.nodo]?.[i] ?? f.nodo) : ETAPA.extractor![i];
  const comun = {
    alfa: ctx.alfa,
    seguridad: ctx.seguridad,
    etapas,
    umbral: u(f.umbral),
    solos: f.aceptados,
    errores: f.errores,
    etapa,
  };
  return f.motivo === "tasa_sobre_alfa"
    ? LIDER.conjuntaSobre(comun)[i]
    : LIDER.conjuntaNo({ ...comun, casos: f.casos, tope: TOPE_DE_ESCALA })[i];
}

/**
 * La vista de la garantía de S1. `umbralId` es el id del umbral de confianza del plan (`U1`) y `decimales` los de su
 * paso: los valores del umbral salen con las mismas cifras que el deslizador.
 */
export function vistaGarantia(
  g: GarantiaDeCalibracion,
  umbralId: string,
  decimales: number,
  i: Idioma,
): VistaGarantia {
  const seguridad = porcentaje(1 - g.delta, i);
  const u = (x: number) => decimal(x, decimales, i);
  const niveles = g.niveles.map((n): NivelVista => {
    const alfaPct = porcentaje(n.alfa, i);
    const alfaTexto = decimal(n.alfa, 2, i);
    const ctx = { alfa: alfaPct, seguridad, dec: decimales };
    const zona = n.zona;
    const lider = zona
      ? LIDER.conZona({
          ...ctx,
          n: g.n,
          desde: u(zona.desde),
          hasta: u(zona.hasta),
        })[i]
      : liderSinZona(n, g, ctx, i);
    const aplicado =
      n.umbral_aplicado_en_zona === null || g.umbral_aplicado === null
        ? null
        : (n.umbral_aplicado_en_zona
            ? LIDER.aplicadoDentro
            : LIDER.aplicadoFuera)({
            umbral: umbralId,
            valor: u(g.umbral_aplicado),
          })[i];
    const conjunta = n.conjunta ? conjuntaEnLlano(n.conjunta, ctx, i) : null;
    const t = n.umbral_con_garantia;
    const c = n.conjunta;
    const experto = [
      EXPERTO.conformalLinea({
        n: n.conformal.n_aciertos,
        indice: n.conformal.indice,
        umbral:
          n.conformal.umbral === null
            ? EXPERTO.sinCota[i]
            : u(n.conformal.umbral),
      })[i],
      EXPERTO.pruebas({
        alfa: alfaTexto,
        lista: t.pruebas
          .map(
            (p) =>
              `${u(p.umbral)}: ${p.aceptados}/${p.errores}, ${pTexto(p.p, i)} ${p.rechaza ? "✓" : "✗"}`,
          )
          .join(" · "),
      })[i],
      ...(c
        ? [
            EXPERTO.conjunta({
              etapas: c.nodos.map((x) => ETAPA_CORTA[x]?.[i] ?? x).join(", "),
              k: c.k,
            })[i],
            EXPERTO.conjuntaPruebas({
              k: c.k,
              alfa: decimal(c.alfa_por_etapa, 3, i),
              delta: decimal(c.delta_por_etapa, 3, i),
              casos: c.casos,
              lista: c.pruebas
                .map(
                  (q) =>
                    `${u(q.umbral)}: ${q.etapas
                      .map(
                        (e) =>
                          `${ETAPA_CORTA[e.nodo]?.[i] ?? e.nodo} ${e.aceptados}/${e.errores} ${pTexto(e.p, i)} ${e.rechaza ? "✓" : "✗"}`,
                      )
                      .join(", ")}`,
                )
                .join(" · "),
            })[i],
            EXPERTO.observado({
              umbral: u(c.error_observado.umbral),
              solos: c.error_observado.aceptados,
              errores: c.error_observado.errores,
              tasa:
                c.error_observado.tasa === null
                  ? "—"
                  : porcentaje(c.error_observado.tasa, i),
            })[i],
          ]
        : []),
    ];
    return {
      alfa: n.alfa,
      alfaPct,
      opcion: ZONA.selector.opcion({ pct: alfaPct, alfa: alfaTexto })[i],
      esDelInforme: cerca(n.alfa, g.alfa_del_informe),
      zona,
      leyenda: zona
        ? ZONA.leyenda({
            alfa: alfaPct,
            desde: u(zona.desde),
            hasta: u(zona.hasta),
          })[i]
        : ZONA.sinZona({ alfa: alfaPct })[i],
      lider,
      aplicado,
      conjunta,
      experto,
      fila: [
        `α ${alfaTexto}`,
        t.umbral === null ? EXPERTO.tabla.no[i] : u(t.umbral),
        t.cobertura === null
          ? "—"
          : `${porcentaje(t.cobertura, i)} · ${t.riesgo === null ? "—" : porcentaje(t.riesgo, i)}`,
        n.conformal.umbral === null
          ? EXPERTO.tabla.no[i]
          : u(n.conformal.umbral),
        zona
          ? zona.desde === zona.hasta
            ? u(zona.desde)
            : `${u(zona.desde)}–${u(zona.hasta)}`
          : EXPERTO.tabla.no[i],
        ...(g.umbral_aplicado === null
          ? []
          : [
              n.umbral_aplicado_en_zona
                ? EXPERTO.tabla.si[i]
                : EXPERTO.tabla.noEs[i],
            ]),
        c === null
          ? "—"
          : c.umbral === null
            ? EXPERTO.tabla.noAlcanza[i]
            : `${u(c.umbral)} (k = ${c.k})`,
      ],
    };
  });
  const noObservadas = g.etapas.filter((e) => !e.observada).map((e) => e.nodo);
  return {
    umbral: umbralId,
    seguridad,
    delta: decimal(g.delta, 2, i),
    n: g.n,
    aciertos: g.aciertos,
    porOmision: Math.max(
      0,
      niveles.findIndex((x) => x.esDelInforme),
    ),
    niveles,
    noObservadas:
      noObservadas.length > 0
        ? LIDER.noObservada({
            etapas: enumerar(
              noObservadas.map((x) => ETAPA_CORTA[x]?.[i] ?? x),
              i,
            ),
            n: noObservadas.length,
          })[i]
        : null,
    secuencia: LIDER.secuencia[i],
    etapas: EXPERTO.etapas({
      lista: g.etapas
        .map((e) =>
          e.observada
            ? EXPERTO.etapaMedida({
                etapa: ETAPA_CORTA[e.nodo]?.[i] ?? e.nodo,
                errores: e.errores,
                casos: e.casos,
              })[i]
            : EXPERTO.etapaSinVerdad({
                etapa: ETAPA_CORTA[e.nodo]?.[i] ?? e.nodo,
              })[i],
        )
        .join(" · "),
    })[i],
    tablaExperto: {
      titulo: EXPERTO.tabla.titulo[i],
      columnas: [
        EXPERTO.tabla.alfa[i],
        EXPERTO.tabla.umbral[i],
        EXPERTO.tabla.cobertura[i],
        EXPERTO.tabla.conformal[i],
        EXPERTO.tabla.zona[i],
        ...(g.umbral_aplicado === null
          ? []
          : [
              EXPERTO.tabla.aplicado({
                umbral: umbralId,
                valor: u(g.umbral_aplicado),
              })[i],
            ]),
        EXPERTO.tabla.conjunta[i],
      ],
    },
    metodo: EXPERTO.metodo({
      delta: decimal(g.delta, 2, i),
      alfa: decimal(g.alfa_del_informe, 2, i),
      n: g.n,
      aciertos: g.aciertos,
    })[i],
    alcance: EXPERTO.alcance[i],
  };
}
