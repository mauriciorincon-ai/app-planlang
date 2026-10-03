import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Junta los errores de consola y de página (un #418 de hidratación sale aquí). */
export function consolaLimpia(page: Page): string[] {
  const errores: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errores.push(m.text());
  });
  page.on("pageerror", (e) => errores.push(String(e)));
  return errores;
}

/**
 * axe sin violaciones críticas, serias ni moderadas, con la página quieta (AU-S2-B15: «axe verde» incluye las
 * moderadas; solo las menores quedan fuera, y se dice).
 */
export const IMPACTOS_QUE_FALLAN = ["critical", "serious", "moderate"] as const;

export async function sinViolacionesAxe(page: Page) {
  // axe mide colores: una transición a medias (150 ms) daría un contraste que nadie ve quieto.
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== "running"),
  );
  const scan = await new AxeBuilder({ page }).analyze();
  const fallan = scan.violations.filter((v) =>
    (IMPACTOS_QUE_FALLAN as readonly string[]).includes(v.impact ?? ""),
  );
  expect(
    fallan,
    JSON.stringify(
      fallan.map((v) => [v.id, v.impact, v.nodes.map((n) => n.target)]),
    ),
  ).toEqual([]);
}

/** Cuánto se desplaza la PÁGINA de lado (0 o menos: nada). */
export function desbordeLateral(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
}
