/**
 * Los enlaces de cada vista se quedan en su demo (ADR-014). `ruta()` exige el demo desde el S3: con el A por omisión,
 * la Brecha y el Plan del B enlazaban al Playground del A y la Brecha a casos `/es/caso/B-…` inexistentes. Un enlace
 * roto lo ve el export (regla 3); uno que lleva al otro demo existe y no se rompe, así que lo mira esta prueba.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { hechosDelRepo } from "@/lib/datos/repo";
import { datosDeLosDemos, type DatosDeLosDemos } from "@/lib/datos/vitrina";
import { DEMOS, SEGMENTO_DEMO, type IdDemo } from "@/lib/demos";
import { vistaAgente } from "@/lib/vista/agente";
import { vistaBrecha } from "@/lib/vista/brecha";
import { idsDeCasos, vistaCaso } from "@/lib/vista/caso";
import { vistaFichas } from "@/lib/vista/fichas";
import { vistaPlan } from "@/lib/vista/plan";
import { vistaPlayground } from "@/lib/vista/playground";
import type { Idioma } from "@core/formatos/bilingue";

let ds: DatosDeLosDemos;
beforeAll(async () => {
  ds = await datosDeLosDemos();
});

/** Toda ruta interna de la vitrina que lleva un valor de la vista (`/es/…`, `/en/…`). */
function enlaces(v: unknown): string[] {
  return [...JSON.stringify(v).matchAll(/"(\/(?:es|en)(?:\/[^"#?]*)?)/g)].map(
    (m) => m[1]!,
  );
}

function vistas(demo: IdDemo, i: Idioma): Record<string, unknown> {
  const d = ds[demo];
  const caso = idsDeCasos(d)[0]!;
  return {
    plan: vistaPlan(d, i),
    agente: vistaAgente(d, i),
    brecha: vistaBrecha(d, i),
    playground: vistaPlayground(d, i),
    caso: vistaCaso(d, caso, i),
    fichas: vistaFichas(ds, demo, hechosDelRepo(), i),
  };
}

describe.each(DEMOS)(
  "%s: los enlaces de sus vistas no salen del demo",
  (demo) => {
    it.each(["es", "en"] as const)("%s", (i) => {
      const prefijo = SEGMENTO_DEMO[demo]
        ? `/${i}/${SEGMENTO_DEMO[demo]}/`
        : `/${i}/`;
      const fuera: string[] = [];
      let n = 0;
      for (const [nombre, v] of Object.entries(vistas(demo, i)))
        for (const e of enlaces(v)) {
          n++;
          const delOtro = DEMOS.some(
            (o) =>
              o !== demo &&
              SEGMENTO_DEMO[o] &&
              e.startsWith(`/${i}/${SEGMENTO_DEMO[o]}/`),
          );
          if (e !== `/${i}` && (!e.startsWith(prefijo) || delOtro))
            fuera.push(`${nombre}: ${e}`);
        }
      expect(n).toBeGreaterThan(20);
      expect(fuera).toEqual([]);
    });
  },
);
