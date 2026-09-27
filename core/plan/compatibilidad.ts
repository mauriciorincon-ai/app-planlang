/**
 * ¿Sirve un lote de casos generado con el plan A para correr el plan B? Sí, si B conserva EXACTAMENTE
 * los umbrales y el contrato de grafo de A: la verdad conocida de cada caso se deriva de ellos (y del
 * plan de beneficios, que tiene su propia huella). Una enmienda de solo medición — criterios, riesgos,
 * supuestos — no invalida los casos. El lado Python (`app_agents.plan.misma_verdad`) compara lo mismo,
 * sobre los objetos tal como están en disco.
 */
import { jcs } from "../formatos/jcs";

type ConVerdad = { umbrales?: unknown; contrato_de_grafo?: unknown };

export function mismaVerdad(a: unknown, b: unknown): boolean {
  const x = a as ConVerdad;
  const y = b as ConVerdad;
  if (x.umbrales === undefined || y.umbrales === undefined) return false;
  if (x.contrato_de_grafo === undefined || y.contrato_de_grafo === undefined)
    return false;
  return (
    jcs(x.umbrales) === jcs(y.umbrales) &&
    jcs(x.contrato_de_grafo) === jcs(y.contrato_de_grafo)
  );
}
