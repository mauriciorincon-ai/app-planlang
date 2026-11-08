// @vitest-environment node
/**
 * El diseño de despliegue sobre las corridas publicadas (S10): el mapa riesgo → componente cubre cada riesgo del plan, la
 * capacidad que se muestra es la que sale de recalcular la cola (no solo la que el informe dice), el B declara «no
 * medido» donde no hay plazos, la evidencia de «implementado» existe en el código y el lienzo pasa el contrato.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { medirPlazos } from "@core/brecha/plazos";
import { COMPONENTES_DEL_DISENO } from "@core/despliegue/diseno";
import { datosDemo } from "@/lib/datos/vitrina";
import { DEMOS } from "@/lib/demos";
import { CONTROLES, vistaDespliegue } from "@/lib/vista/despliegue";

describe.each(DEMOS)("%s", (demo) => {
  it("cada riesgo del plan tiene su lectura de componente, y ninguna sobra", async () => {
    const d = await datosDemo(demo);
    expect(Object.keys(CONTROLES[demo]).sort()).toEqual(
      d.plan.riesgos.map((r) => r.id).sort(),
    );
  });

  it("la vista sale en los dos idiomas con los siete componentes y todos los riesgos", async () => {
    const d = await datosDemo(demo);
    for (const i of ["es", "en"] as const) {
      const v = vistaDespliegue(d, i);
      expect(v.componentes).toHaveLength(7);
      expect(v.riesgos.map((r) => r.id)).toEqual(
        d.plan.riesgos.map((r) => r.id),
      );
      expect(v.lienzo.svg).toContain('data-visor="despliegue"');
      // Cada componente del lienzo está en el texto equivalente (G10).
      expect(v.componentes.map((c) => c.id)).toEqual(
        COMPONENTES_DEL_DISENO.map((c) => c.id),
      );
    }
  });

  it("la latencia por nodo se recalcula de las trazas, aparte de la función del diseño", async () => {
    const d = await datosDemo(demo);
    const v = vistaDespliegue(d, "en");
    const [nodo, veces, p50] = v.medido.latencia[0] as string[];
    const ms = d.corrida.trazas
      .flatMap((t) => t.pasos)
      .filter((p) => p.nodo === nodo)
      .map((p) => p.duracion_ms)
      .sort((a, b) => a - b);
    expect(String(ms.length)).toBe(veces);
    const m =
      ms.length % 2
        ? ms[(ms.length - 1) / 2]!
        : (ms[ms.length / 2 - 1]! + ms[ms.length / 2]!) / 2;
    expect(p50).toBe((m / 1000).toFixed(2));
  });
});

describe("la capacidad", () => {
  it("A: la mínima que se muestra sale de volver a correr la cola, y es la que publicó el informe", async () => {
    const d = await datosDemo("demo-a");
    const sim = d.plan.simulacion_de_plazos!;
    const medido = medirPlazos(sim, d.llegadas!, d.corrida.trazas);
    expect(medido.capacidadMinima).toEqual(d.informe.plazos!.capacidad_minima);
    const v = vistaDespliegue(d, "es");
    const lineas = (v.medido.capacidad as { lineas: string[] }).lineas;
    expect(lineas[1]).toContain(
      `${medido.capacidadMinima!.valor} casos por día hábil`,
    );
  });

  it("B: el plan no declara plazos, así que la capacidad dice «no medido» y no trae cifra", async () => {
    const d = await datosDemo("demo-b");
    expect(d.informe.plazos).toBeNull();
    for (const i of ["es", "en"] as const) {
      const c = vistaDespliegue(d, i).medido.capacidad;
      expect("noMedida" in c).toBe(true);
      expect(JSON.stringify(c)).not.toMatch(/[0-9]/);
    }
  });
});

describe("los componentes «implementados» tienen su código", () => {
  it.each(COMPONENTES_DEL_DISENO.filter((c) => c.evidencia.length))(
    "$id: cada archivo existe y contiene su símbolo",
    (c) => {
      for (const e of c.evidencia)
        expect(readFileSync(e.archivo, "utf8"), e.archivo).toContain(e.simbolo);
    },
  );
});
