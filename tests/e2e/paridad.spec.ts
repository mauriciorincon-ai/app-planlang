import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { archivoGolden, huellaDeLaIsla, ISLAS, movimientos } from "./_paridad";

/**
 * Paridad del playground de cada demo entre motores (regla dura 1, AU-S2-11): el recálculo corre en el navegador de
 * quien visita.
 * Se barren, en el export servido, los mismos valores que barre Node en `tests/unit/vitrina/playground-paridad.test.tsx`
 * (cada paso de cada deslizador y el interruptor) y lo que pinta la isla tiene que dar la misma huella que el golden
 * que escribió Node. Corre en `escritorio` (Chromium) y en `paridad-firefox` y `paridad-webkit`.
 */

type GoldenIsla = Record<string, { cifras: string; huella: string }>;

const resumir = (h: ReturnType<typeof huellaDeLaIsla>) => ({
  cifras: h.cifras,
  huella: createHash("sha256")
    .update(JSON.stringify([h.texto, h.curva]))
    .digest("hex"),
});

for (const isla of ISLAS)
  for (const idioma of ["es", "en"] as const)
    test(`la isla de ${isla.demo} pinta en este motor lo mismo que en Node, umbral por umbral (${idioma})`, async ({
      page,
    }) => {
      test.setTimeout(240_000);
      const golden = JSON.parse(
        readFileSync(archivoGolden(isla.golden, idioma), "utf8"),
      ) as GoldenIsla;
      await page.goto(`/${idioma}/${isla.ruta}`);
      // Antes de mover nada, la isla hidratada (React ya cuelga sus fibras del deslizador): un valor puesto antes se
      // perdería y mediría el HTML del servidor.
      await page.waitForFunction(() => {
        const r = document.querySelector('[id^="w-"] input[type="range"]');
        return !!r && Object.keys(r).some((k) => k.startsWith("__reactFiber"));
      });
      const huella = async () =>
        resumir(await page.evaluate(huellaDeLaIsla, undefined));
      const obtenido: GoldenIsla = { plan: await huella() };
      for (const m of await page.evaluate(movimientos, undefined)) {
        const w = page.locator(`#w-${m.umbral}`);
        if (m.tipo === "rango") {
          const input = w.locator('input[type="range"]');
          for (const v of m.valores) {
            await input.fill(v);
            obtenido[`${m.umbral}=${v}`] = await huella();
          }
          await input.fill(m.plan);
        } else {
          const sw = w.getByRole("switch");
          await sw.click();
          obtenido[`${m.umbral}=alternado`] = await huella();
          await sw.click();
        }
      }
      expect(Object.keys(obtenido)).toHaveLength(isla.huellas);
      expect(obtenido).toEqual(golden);
    });
