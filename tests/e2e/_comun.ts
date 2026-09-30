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

/** axe sin violaciones críticas ni serias, con la página quieta. */
export async function sinViolacionesSerias(page: Page) {
  // axe mide colores: una transición a medias (150 ms) daría un contraste que nadie ve quieto.
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== "running"),
  );
  const scan = await new AxeBuilder({ page }).analyze();
  const serias = scan.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(
    serias,
    JSON.stringify(serias.map((v) => [v.id, v.nodes.map((n) => n.target)])),
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
