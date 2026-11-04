/**
 * Las capas de llegadas versionadas (S9, ADR-019) son lo que sale del generador, byte a byte, y sirven al lote y al plan
 * que dicen: la huella del lote, los ids de sus casos, y los días y la jornada del plan. Y NO tocan el lote: los casos y
 * su huella siguen siendo los de siempre (las corridas publicadas los citan). Corre en Node y en jsdom.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { huella } from "../../core/formatos/huella";
import type { JsonValor } from "../../core/formatos/jcs";
import { cargarPlan } from "../../core/plan";
import {
  configDeCola,
  problemasDeLaCapa,
  type CapaDeLlegadas,
} from "../../core/plazos";
import {
  LLEGADAS_VERSIONADAS,
  capaDelLote,
  rutaDeLlegadas,
} from "../../scripts/llegadas-generar";
import { rutaDeLote } from "../../scripts/lotes-versionados";

const leer = <T>(ruta: string): T =>
  JSON.parse(readFileSync(ruta, "utf8")) as T;

describe.each(LLEGADAS_VERSIONADAS)(
  "capa de llegadas de $semilla ($n casos)",
  (l) => {
    const rutaLote = rutaDeLote(l.semilla, l.n);
    const ruta = rutaDeLlegadas(l.semilla, l.n);

    it("es lo que sale del generador, con los mismos bytes", async () => {
      const esperada = await capaDelLote(rutaLote, l.plan);
      expect(leer<CapaDeLlegadas>(ruta)).toEqual(esperada);
    });

    it("su huella es la de su contenido y nombra la huella del lote al que sirve", async () => {
      const capa = leer<CapaDeLlegadas>(ruta);
      const lote = leer<{
        id: string;
        huella: string;
        casos: { id: string }[];
      }>(rutaLote);
      expect(capa.huella).toBe(await huella(capa as unknown as JsonValor));
      expect(capa.lote).toMatchObject({ id: lote.id, huella: lote.huella });
    });

    it("sirve al lote y al plan: un caso, una llegada, dentro de los días y la jornada del plan", async () => {
      const capa = leer<CapaDeLlegadas>(ruta);
      const lote = leer<{ casos: { id: string }[] }>(rutaLote);
      const carga = await cargarPlan(leer<JsonValor>(l.plan));
      if (!carga.ok) throw new Error("el plan no carga");
      const sim = carga.plan.simulacion_de_plazos!;
      expect(
        problemasDeLaCapa(
          capa,
          lote.casos.map((c) => c.id),
          sim.dias_habiles,
          configDeCola(sim).jornada_min,
        ),
      ).toEqual([]);
    });

    it("el lote no se tocó: su huella es la del contenido de siempre", async () => {
      const lote = leer<{ huella: string }>(rutaLote);
      expect(lote.huella).toBe(await huella(lote as unknown as JsonValor));
    });
  },
);
