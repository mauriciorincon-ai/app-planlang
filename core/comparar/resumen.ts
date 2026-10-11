/**
 * Lo que mide una corrida por sí sola, para compararla con la otra: el veredicto de sus criterios y riesgos, la
 * exactitud y la latencia de la regla S3, las decisiones y pausas frente a la verdad conocida, y el presupuesto.
 */
import type { VistaDeCaso } from "../brecha/contexto";
import type { CasoDeDemo } from "../sintetico/de-demo";
import type { Traza } from "../formatos/traza";
import type { ResultadoCriterio } from "../brecha/criterios";
import type { ResultadoRiesgo } from "../brecha/detectores";
import { exactitudYLatencia, presupuestoDe } from "../brecha/supuestos";
import { veredictoDeCriteriosYRiesgos } from "../brecha/veredicto";
import {
  CATEGORIAS_DE_PAUSA,
  type CategoriaDePausa,
  type FilaDeCaso,
  type ResumenDeLado,
} from "./tipos";

const texto = (v: unknown): string | null => (typeof v === "string" ? v : null);

/** Las señales que la comparación lee de una traza: la decisión final, la propuesta y la pausa. */
export function filaDeCaso(t: Traza): FilaDeCaso {
  return {
    decision_final: texto(t.senales["decision_final"]),
    propuesta: texto(t.senales["propuesta"]),
    pausa: t.senales["pausa_humana"] === true,
  };
}

/** La verdad conocida del caso del lote. Un caso que no está en el lote es un error de la entrada, no un caso vacío. */
export function verdadDe(
  casos: ReadonlyMap<string, CasoDeDemo>,
  id: string,
): { decision: string; debe_escalar: boolean } {
  const caso = casos.get(id);
  if (!caso) throw new Error(`comparación: el caso ${id} no está en el lote`);
  return {
    decision: caso.verdad_conocida.decision,
    debe_escalar: caso.verdad_conocida.debe_escalar,
  };
}

export function categoriaDePausa(
  debeEscalar: boolean,
  pausa: boolean,
): CategoriaDePausa {
  if (debeEscalar) return pausa ? "necesaria" : "omitida";
  return pausa ? "innecesaria" : "sin_pausa_correcta";
}

export function resumenDeLado(
  trazas: readonly Traza[],
  casos: ReadonlyMap<string, CasoDeDemo>,
  vistas: readonly VistaDeCaso[],
  criterios: readonly ResultadoCriterio[],
  riesgos: readonly ResultadoRiesgo[],
): ResumenDeLado {
  const { exactitud, latencia } = exactitudYLatencia(vistas);
  const decisiones = {
    correctas: 0,
    propuesta_correcta: 0,
    propuesta_incorrecta: 0,
    propuesta_ausente: 0,
  };
  const pausas = Object.fromEntries(
    CATEGORIAS_DE_PAUSA.map((c) => [c, 0]),
  ) as Record<CategoriaDePausa, number>;
  for (const t of trazas) {
    const verdad = verdadDe(casos, t.caso_id);
    const fila = filaDeCaso(t);
    if (fila.decision_final === verdad.decision) decisiones.correctas++;
    if (fila.propuesta === null) decisiones.propuesta_ausente++;
    else if (fila.propuesta === verdad.decision)
      decisiones.propuesta_correcta++;
    else decisiones.propuesta_incorrecta++;
    pausas[categoriaDePausa(verdad.debe_escalar, fila.pausa)]++;
  }
  return {
    veredicto: veredictoDeCriteriosYRiesgos(criterios, riesgos),
    exactitud,
    latencia_mediana_s: latencia,
    decisiones,
    pausas,
    presupuesto: presupuestoDe(trazas),
  };
}
