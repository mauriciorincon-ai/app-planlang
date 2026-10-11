/**
 * Comparación de dos corridas del mismo plan y del mismo lote (S4): la multiagente y su línea base de agente único.
 * Las dos pasan por el mismo verificador (`leerEntrada`: mismo plan, mismo lote, mismas semillas) y se miden con las
 * mismas funciones, así que cada diferencia es de la arquitectura y no de la medición. Determinista: sin reloj ni `Intl`.
 */
import { VERSION_VERIFICADOR } from "../brecha/informe";
import type { Umbrales } from "../brecha/contexto";
import { vistasDeCorrida, vistasDeSesiones } from "../brecha/contexto";
import { evaluarCriterios, type ResultadoCriterio } from "../brecha/criterios";
import { evaluarRiesgos, type ResultadoRiesgo } from "../brecha/detectores";
import {
  leerEntrada,
  type CorridaLeida,
  type EntradaVerificador,
} from "../brecha/lector";
import { conHuella } from "../formatos/huella";
import type { CasoDeDemo } from "../sintetico/de-demo";
import type { Plan } from "../plan/esquema";
import { filaDeCaso, resumenDeLado, verdadDe } from "./resumen";
import {
  FORMATO_COMPARACION,
  VERSION_COMPARACION,
  type Comparacion,
  type CasoQueDifiere,
  type CriterioComparado,
  type ResumenDeLado,
  type RiesgoComparado,
} from "./tipos";

/** La entrada no compara lo mismo con lo mismo: se nombra el motivo, no se produce una comparación a medias. */
export class ErrorDeComparacion extends Error {
  constructor(readonly motivos: readonly string[]) {
    super(`comparación: ${motivos.join("; ")}`);
    this.name = "ErrorDeComparacion";
  }
}

/** Una corrida medida por sí sola: sus vistas, sus criterios y riesgos, y su resumen. */
interface Medicion {
  criterios: ResultadoCriterio[];
  riesgos: ResultadoRiesgo[];
  resumen: ResumenDeLado;
}

function medir(
  plan: Plan,
  casos: ReadonlyMap<string, CasoDeDemo>,
  corrida: CorridaLeida,
  nLote: number,
): Medicion {
  const vistas = vistasDeCorrida(
    corrida.trazas,
    casos,
    corrida.manifiesto.umbrales_aplicados as Umbrales,
  );
  const criterios = evaluarCriterios(plan, vistas, [], nLote);
  const riesgos = evaluarRiesgos(
    plan,
    vistas,
    vistasDeSesiones(corrida.manifiesto.sesiones),
  );
  return {
    criterios,
    riesgos,
    resumen: resumenDeLado(corrida.trazas, casos, vistas, criterios, riesgos),
  };
}

/** El mismo elemento del plan en el otro lado: el plan es uno, así que falta solo si la entrada está rota. */
function par<T extends { id: string }>(xs: readonly T[], id: string): T {
  const x = xs.find((y) => y.id === id);
  if (!x) throw new ErrorDeComparacion([`falta ${id} en la línea base`]);
  return x;
}

export async function compararCorridas(
  entrada: EntradaVerificador,
): Promise<Comparacion> {
  const e = await leerEntrada(entrada);
  const multi = e.corrida;
  const base = e.base;
  if (!base)
    throw new ErrorDeComparacion(["falta la línea base de agente único"]);
  const ids = multi.manifiesto.casos_ejecutados;
  const idsBase = base.manifiesto.casos_ejecutados;
  if (ids.length !== idsBase.length || ids.some((id, i) => id !== idsBase[i]))
    throw new ErrorDeComparacion([
      "las dos corridas no ejecutaron los mismos casos, en el mismo orden",
    ]);

  const nLote = multi.manifiesto.casos.n_lote;
  const m = medir(e.plan, e.casos, multi, nLote);
  const b = medir(e.plan, e.casos, base, nLote);

  const criterios: CriterioComparado[] = m.criterios.map((c) => {
    const cb = par(b.criterios, c.id);
    return {
      id: c.id,
      enunciado: c.enunciado,
      tipo: c.tipo,
      objetivo: c.objetivo,
      por_lado: {
        multiagente: { estado: c.estado, valor_medido: c.valor_medido },
        agente_unico: { estado: cb.estado, valor_medido: cb.valor_medido },
      },
    };
  });

  const riesgos: RiesgoComparado[] = m.riesgos.map((r) => {
    const rb = par(b.riesgos, r.id);
    return {
      id: r.id,
      modo: r.modo,
      severidad: r.severidad,
      ocurre_si: r.ocurre_si,
      por_lado: {
        multiagente: {
          estado: r.estado,
          casos_marcados: r.casos.length,
          valor: r.valor,
        },
        agente_unico: {
          estado: rb.estado,
          casos_marcados: rb.casos.length,
          valor: rb.valor,
        },
      },
    };
  });

  const enBase = new Map(base.trazas.map((t) => [t.caso_id, t]));
  const casosQueDifieren: CasoQueDifiere[] = [];
  for (const t of multi.trazas) {
    const u = enBase.get(t.caso_id);
    if (!u)
      throw new ErrorDeComparacion([
        `el caso ${t.caso_id} no está en la línea base`,
      ]);
    const a = filaDeCaso(t);
    const f = filaDeCaso(u);
    if (a.pausa === f.pausa && a.decision_final === f.decision_final) continue;
    casosQueDifieren.push({
      id: t.caso_id,
      verdad: verdadDe(e.casos, t.caso_id),
      por_lado: { multiagente: a, agente_unico: f },
    });
  }

  return conHuella({
    formato: FORMATO_COMPARACION,
    version_comparacion: VERSION_COMPARACION,
    version_verificador: VERSION_VERIFICADOR,
    plan: {
      id: e.plan.id,
      version: e.plan.version,
      huella: e.huellaPlan,
      de_ejecucion: {
        version: e.planCorrida.version,
        huella: e.planCorrida.huella,
      },
    },
    lote: {
      id: multi.manifiesto.casos.id,
      huella: multi.manifiesto.casos.huella,
      n: nLote,
    },
    corridas: {
      multiagente: {
        corrida_id: multi.manifiesto.corrida_id,
        huella: multi.manifiesto.huella,
      },
      agente_unico: {
        corrida_id: base.manifiesto.corrida_id,
        huella: base.manifiesto.huella,
      },
    },
    lados: { multiagente: m.resumen, agente_unico: b.resumen },
    criterios,
    riesgos,
    casos_que_difieren: casosQueDifieren,
  });
}
