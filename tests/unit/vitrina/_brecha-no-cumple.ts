/**
 * Un informe que NO cumple (estado «no cumple» de la maqueta de Brecha), armado sobre el del demo: C7 con un objetivo
 * de 10 s que la mediana (11,8 s) no alcanza, R2 ocurrido en A-015, C6 sin casos que lo prueben y R5 sin poder
 * medirse. Lo usan las pruebas de la vista y de los componentes de P4.
 */
import type { DatosDemo } from "@/lib/datos/vitrina";

export function noCumple(d: DatosDemo): DatosDemo {
  const otro = structuredClone(d);
  const lento = otro.corrida.trazas
    .filter((t) => (t.senales.latencia_total_s as number) > 10)
    .map((t) => t.caso_id);
  otro.plan.criterios_aceptacion.find((c) => c.id === "C7")!.valor_objetivo =
    10;
  Object.assign(
    otro.informe.criterios.find((c) => c.id === "C7")!,
    {
      estado: "incumple",
      objetivo: 10,
      casos_que_incumplen: lento,
    },
  );
  Object.assign(
    otro.informe.criterios.find((c) => c.id === "C6")!,
    {
      estado: "sin_poblacion",
      n_poblacion: 0,
      casos_que_incumplen: [],
    },
  );
  Object.assign(
    otro.informe.riesgos.find((r) => r.id === "R2")!,
    {
      estado: "ocurrio",
      valor: 1,
      casos: ["A-015"],
    },
  );
  Object.assign(
    otro.informe.riesgos.find((r) => r.id === "R5")!,
    {
      estado: "indeterminado",
      valor: null,
    },
  );
  otro.informe.veredicto = {
    valor: "no_cumple",
    bloqueantes: [{ es: "C7 no se cumplió.", en: "C7 was not met." }],
    alertas: d.informe.veredicto.alertas,
  };
  return otro;
}
