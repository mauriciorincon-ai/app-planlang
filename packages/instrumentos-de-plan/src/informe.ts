/**
 * Informe de validación de los tres instrumentos (contrato § 0): orden de ondas, decisiones de una
 * vía destacadas, prioridad de cada modo de falla, y los elementos bloqueantes. Determinista (G1):
 * mismo plan, mismo informe byte a byte; sin reloj ni azar.
 */
import { ordenarDecisiones } from "./decisiones";
import { evaluarModosDeFalla, type ModoEvaluado } from "./modos-de-falla";
import { supuestosInvalidos } from "./supuestos";
import type {
  Bloqueante,
  DecisionMinima,
  ModoDeFallaMinimo,
  SupuestoMinimo,
} from "./tipos";

export interface EntradaInstrumentos {
  decisiones: readonly DecisionMinima[];
  modos_de_falla: readonly ModoDeFallaMinimo[];
  supuestos: readonly SupuestoMinimo[];
}

export interface InformeInstrumentos {
  version_contrato: "0.1.0";
  ok: boolean;
  ondas: string[][];
  una_via: string[];
  ciclo: string[] | null;
  modos: ModoEvaluado[];
  bloqueantes: Bloqueante[];
}

export function informeDeInstrumentos(
  entrada: EntradaInstrumentos,
): InformeInstrumentos {
  const bloqueantes: Bloqueante[] = [];
  const orden = ordenarDecisiones(entrada.decisiones);
  let ondas: string[][] = [];
  let unaVia: string[] = [];
  let ciclo: string[] | null = null;
  if (orden.ok) {
    ondas = orden.ondas;
    unaVia = orden.una_via;
  } else if (orden.motivo === "ciclo") {
    ciclo = orden.ciclo;
    bloqueantes.push({
      tipo: "ciclo",
      ids: orden.ciclo,
      mensaje: {
        es: `Ciclo entre decisiones: ${orden.ciclo.join(" → ")}. Rompe la dependencia para poder ordenar.`,
        en: `Cycle between decisions: ${orden.ciclo.join(" → ")}. Break the dependency so they can be ordered.`,
      },
    });
  } else {
    bloqueantes.push({
      tipo: "dependencia_desconocida",
      ids: [orden.decision, orden.dependencia],
      mensaje: {
        es: `La decisión ${orden.decision} depende de ${orden.dependencia}, que no existe.`,
        en: `Decision ${orden.decision} depends on ${orden.dependencia}, which does not exist.`,
      },
    });
  }

  const modos = evaluarModosDeFalla(entrada.modos_de_falla);
  for (const m of modos) {
    if (m.bloqueante) {
      bloqueantes.push({
        tipo: "prioridad_alta_sin_mitigacion",
        ids: [m.id],
        mensaje: {
          es: `El modo de falla ${m.id} tiene prioridad de acción alta y ninguna mitigación: el plan no se aprueba.`,
          en: `Failure mode ${m.id} has high action priority and no mitigation: the plan cannot be approved.`,
        },
      });
    }
  }

  for (const id of supuestosInvalidos(entrada.supuestos)) {
    bloqueantes.push({
      tipo: "supuesto_critico_sin_prueba",
      ids: [id],
      mensaje: {
        es: `El supuesto ${id} es de criticidad alta y no declara prueba barata.`,
        en: `Assumption ${id} is high-criticality and declares no cheap test.`,
      },
    });
  }

  return {
    version_contrato: "0.1.0",
    ok: bloqueantes.length === 0,
    ondas,
    una_via: unaVia,
    ciclo,
    modos,
    bloqueantes,
  };
}
