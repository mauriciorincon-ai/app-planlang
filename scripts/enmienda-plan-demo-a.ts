/**
 * La enmienda v1 → v1.1 del plan del demo A como función pura (la usa el CLI
 * `enmendar-plan-demo-a.ts` y el test que prueba que `plans/demo-a/v1.1.json` sale de aquí).
 */
import type { Plan } from "../core/plan";

export function enmendar(v1: Plan): Record<string, unknown> {
  const contrato = v1.contrato_de_grafo;
  const aristas = contrato.aristas_condicionales.map((a) => {
    if (a.desde !== "enrutador") return a;
    const copia: Record<string, unknown> = { ...a };
    delete copia.si_falso;
    return copia as typeof a;
  });
  aristas.splice(1, 0, {
    desde: "enrutador",
    orden: 2,
    senal: "servicio_exento",
    operador: "igual_a",
    valor: true,
    inclusivo: false,
    si_verdadero: "redactor",
  });
  const senales = [...contrato.senales_obligatorias_en_traza];
  senales.splice(senales.indexOf("tipo_atencion") + 1, 0, "servicio_exento");
  const flujo = v1.flujo_objetivo.map((paso, i) =>
    i === 1
      ? {
          es: "Si es urgencia o un servicio exento, se autoriza sin verificar cobertura (ley y plan de beneficios).",
          en: "If it is an emergency or an exempt service, it is approved without a coverage check (law and benefit plan).",
        }
      : paso,
  );
  const borrador: Record<string, unknown> = {
    ...v1,
    version: "1.1.0",
    estado_aprobacion: "borrador",
    huella: null,
    flujo_objetivo: flujo,
    contrato_de_grafo: {
      ...contrato,
      aristas_condicionales: aristas,
      ramas_por_defecto: {
        ...contrato.ramas_por_defecto,
        enrutador: "extractor",
      },
      senales_obligatorias_en_traza: senales,
    },
  };
  delete borrador.aprobado_por;
  delete borrador.aprobado_el;
  return borrador;
}
