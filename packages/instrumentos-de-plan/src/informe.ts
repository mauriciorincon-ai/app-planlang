/**
 * Informe de validación de los tres instrumentos (contrato v0.2.0 § 0): orden de ondas, decisiones de
 * una vía destacadas, prioridad de cada modo de falla (de tabla y efectiva, G8), opciones «sin
 * argumentos» (F-002, aviso, no bloquea) y los elementos bloqueantes. Determinista (G1): mismo plan,
 * mismo informe byte a byte; sin reloj ni azar.
 */
import { ordenarDecisiones } from "./decisiones";
import { evaluarModosDeFalla, type ModoEvaluado } from "./modos-de-falla";
import { supuestosInvalidos } from "./supuestos";
import type {
  Bloqueante,
  DecisionMinima,
  ModoDeFallaMinimo,
  SupuestoMinimo,
  TextoOMapa,
} from "./tipos";

export interface EntradaInstrumentos {
  decisiones: readonly DecisionMinima[];
  modos_de_falla: readonly ModoDeFallaMinimo[];
  supuestos: readonly SupuestoMinimo[];
}

/** Opción declarada sin pros ni contras (§ 1.1, F-002): la carga es válida y el informe la señala. */
export interface OpcionSinArgumentos {
  decision: string;
  indice: number;
  nombre: TextoOMapa;
}

export interface InformeInstrumentos {
  version_contrato: "0.2.0";
  ok: boolean;
  ondas: string[][];
  una_via: string[];
  ciclo: string[] | null;
  modos: ModoEvaluado[];
  opciones_sin_argumentos: OpcionSinArgumentos[];
  bloqueantes: Bloqueante[];
}

/** Un argumento falta si no viene, o viene vacío (texto, lista o mapa de idioma sin contenido). */
function argumentoVacio(x: unknown): boolean {
  if (x === undefined || x === null) return true;
  if (typeof x === "string") return x.trim() === "";
  if (Array.isArray(x)) return x.every(argumentoVacio);
  if (typeof x === "object")
    return Object.values(x as Record<string, unknown>).every(argumentoVacio);
  return false;
}

const EN = { alta: "high", media: "medium", baja: "low" } as const;

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
        mensaje:
          m.control_legal && m.prioridad_de_tabla !== "alta"
            ? {
                es: `El modo de falla ${m.id} protege una obligación legal (prioridad efectiva alta; tabla: ${m.prioridad_de_tabla}) y no tiene ninguna mitigación: el plan no se aprueba.`,
                en: `Failure mode ${m.id} protects a legal obligation (effective priority high; table: ${EN[m.prioridad_de_tabla]}) and has no mitigation: the plan cannot be approved.`,
              }
            : {
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

  const opcionesSinArgumentos: OpcionSinArgumentos[] = [];
  for (const d of entrada.decisiones)
    (d.opciones ?? []).forEach((o, i) => {
      if (argumentoVacio(o.pros) && argumentoVacio(o.contras))
        opcionesSinArgumentos.push({
          decision: d.id,
          indice: i + 1,
          nombre: o.nombre,
        });
    });

  return {
    version_contrato: "0.2.0",
    ok: bloqueantes.length === 0,
    ondas,
    una_via: unaVia,
    ciclo,
    modos,
    opciones_sin_argumentos: opcionesSinArgumentos,
    bloqueantes,
  };
}
