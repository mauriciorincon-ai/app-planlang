/**
 * La isla del playground barrida umbral por umbral en Node (jsdom): cada valor de cada deslizador y el interruptor,
 * con lo que pinta resumido en una huella. Es el golden que `tests/e2e/paridad.spec.ts` exige byte a byte en
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
import { datosDemo, type DatosDemo } from "@/lib/datos/vitrina";
import { vistaPlayground } from "@/lib/vista/playground";
import type { Idioma } from "@core/formatos/bilingue";
import { huellaDeLaIsla, movimientos } from "../../e2e/_paridad";

const GOLDEN_ISLA = (i: Idioma) => `tests/golden/playground/isla.${i}.json`;

type GoldenIsla = Record<string, { cifras: string; huella: string }>;

const resumir = (h: ReturnType<typeof huellaDeLaIsla>) => ({
  cifras: h.cifras,
  huella: createHash("sha256")
    .update(JSON.stringify([h.texto, h.curva]))
    .digest("hex"),
});

let d: DatosDemo;
beforeAll(async () => {
  d = await datosDemo();
});

describe.each(["es", "en"] as const)("la isla barrida en Node (%s)", (i) => {
  it("cada valor de cada umbral pinta lo que dice el golden", async () => {
    const { container } = render(<Juego datos={vistaPlayground(d, i).isla} />);
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
    // 10 valores de U1, 49 de U2, 5 de U3, el interruptor y el plan.
    expect(Object.keys(obtenido)).toHaveLength(66);
    if (process.env.PARIDAD_GOLDEN === "escribir")
      writeFileSync(GOLDEN_ISLA(i), `${JSON.stringify(obtenido, null, 2)}\n`);
    expect(obtenido).toEqual(
      JSON.parse(readFileSync(GOLDEN_ISLA(i), "utf8")) as GoldenIsla,
    );
  });
});
