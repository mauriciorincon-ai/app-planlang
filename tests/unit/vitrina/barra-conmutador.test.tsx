// @vitest-environment node
/**
 * El conmutador de demo de la barra (ADR-014) y las páginas que no existen en todos los demos (S7, B-5). En las
 * pantallas del B lleva a la misma pantalla del A; en `comparar` (solo A) y `planes` (de ninguno) no hay a dónde ir,
 * así que la barra no lo ofrece: antes lo habría armado con una ruta que no existe y el build habría caído.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Barra } from "@/components/marco/barra";
import type { IdDemo } from "@/lib/demos";
import type { Pagina } from "@/lib/ruta";

const html = (pagina: Pagina, demo: IdDemo, id?: string) =>
  renderToStaticMarkup(
    <Barra idioma="es" pagina={pagina} demo={demo} id={id} />,
  );
const conmutador = (h: string) => h.includes('aria-label="Demo"');

describe("el conmutador de demo de la barra", () => {
  it("en una pantalla del B ofrece los dos demos y lleva a la misma pantalla del A (regresión)", () => {
    const h = html("brecha", "demo-b");
    expect(conmutador(h)).toBe(true);
    expect(h).toContain('href="/es/brecha"');
    expect(h).toContain('href="/es/demo-b/brecha"');
  });

  it("en el A la barra no lleva conmutador (la del S2)", () => {
    expect(conmutador(html("brecha", "demo-a"))).toBe(false);
  });

  it("en «comparar», que solo existe en el A, no lo ofrece", () => {
    const h = html("comparar", "demo-a");
    expect(conmutador(h)).toBe(false);
    expect(h).not.toContain("demo-b");
  });

  it("en «planes», que no es de ningún demo, tampoco", () => {
    expect(conmutador(html("planes", "demo-a", "hackguard-agentes"))).toBe(
      false,
    );
  });
});
