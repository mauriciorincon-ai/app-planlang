/**
 * La isla del playground de cada demo barrida umbral por umbral en Node (jsdom): cada valor de cada deslizador y el
 * interruptor, con lo que pinta resumido en una huella. Es el golden que `tests/e2e/paridad.spec.ts` exige byte a byte en
 * Chromium, Firefox y WebKit (regla dura 1, AU-S2-11).
 * Regenerar (tras un cambio deliberado de la isla o de los datos):
 * `PARIDAD_GOLDEN=escribir pnpm vitest run tests/unit/vitrina/playground-paridad.test.tsx`.
 */
import "../../setup.core-jsdom";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { act, fireEvent, render } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { Juego } from "@/components/playground/juego";
import { datosDeLosDemos, type DatosDeLosDemos } from "@/lib/datos/vitrina";
import { DEMOS, SEGMENTO_DEMO } from "@/lib/demos";
import { vistaPlayground } from "@/lib/vista/playground";
import type { Idioma } from "@core/formatos/bilingue";
import {
  archivoGolden,
  huellaDeLaIsla,
  ISLAS,
  movimientos,
} from "../../e2e/_paridad";

type GoldenIsla = Record<string, { cifras: string; huella: string }>;

const resumir = (h: ReturnType<typeof huellaDeLaIsla>) => ({
  cifras: h.cifras,
  huella: createHash("sha256")
    .update(JSON.stringify([h.texto, h.curva]))
    .digest("hex"),
});

let ds: DatosDeLosDemos;
beforeAll(async () => {
  ds = await datosDeLosDemos();
});

describe.each(
  DEMOS.flatMap((demo) =>
    (["es", "en"] as const).map((i) => [demo, i] as const),
  ),
)("la isla de %s barrida en Node (%s)", (demo, i) => {
  it("cada valor de cada umbral pinta lo que dice el golden", async () => {
    const { container } = render(
      <Juego datos={vistaPlayground(ds[demo], i).isla} />,
    );
    const obtenido: GoldenIsla = { plan: resumir(huellaDeLaIsla(container)) };
    for (const m of movimientos(container)) {
      const w = container.querySelector(`#w-${m.umbral}`)!;
      if (m.tipo === "rango") {
        const input = w.querySelector("input")!;
        for (const v of m.valores) {
          await act(async () =>
            fireEvent.change(input, { target: { value: v } }),
          );
          obtenido[`${m.umbral}=${v}`] = resumir(huellaDeLaIsla(container));
        }
        await act(async () =>
          fireEvent.change(input, { target: { value: m.plan } }),
        );
      } else {
        const sw = w.querySelector('[role="switch"]')!;
        await act(async () => fireEvent.click(sw));
        obtenido[`${m.umbral}=alternado`] = resumir(huellaDeLaIsla(container));
        await act(async () => fireEvent.click(sw));
      }
    }
    // De vuelta en el plan, lo mismo que al abrir: el barrido no deja estado.
    expect(resumir(huellaDeLaIsla(container))).toEqual(obtenido.plan);
    const isla = ISLAS.find((x) => x.demo === demo)!;
    expect(Object.keys(obtenido)).toHaveLength(isla.huellas);
    if (process.env.PARIDAD_GOLDEN === "escribir")
      writeFileSync(
        archivoGolden(isla.golden, i),
        `${JSON.stringify(obtenido, null, 2)}\n`,
      );
    expect(obtenido).toEqual(
      JSON.parse(
        readFileSync(archivoGolden(isla.golden, i), "utf8"),
      ) as GoldenIsla,
    );
  });
});

describe("la tabla de islas de la paridad", () => {
  it("tiene un demo por cada demo de la vitrina, en la ruta de su segmento (ADR-014)", () => {
    expect(ISLAS.map((x) => x.demo)).toEqual([...DEMOS]);
    for (const x of ISLAS)
      expect(x.ruta).toBe(
        [SEGMENTO_DEMO[x.demo], "playground"].filter(Boolean).join("/"),
      );
  });
});
