/**
 * P2 Plan renderizado (Testing Library): las cifras y el índice llevan a secciones que existen; «Ver N más» abre y
 * cierra el resto; lo que se abre bajo un renglón es un `<details>` nativo; y la regla 5-a: la FORMA del árbol no
 * depende del perfil, de «Ver N más» ni de abrir un renglón.
 */
import "../../setup.core-jsdom";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  IndicePlan,
  MiradaPlan,
  SeccionContrato,
  SeccionDelPlan,
} from "@/components/plan/secciones";
import { datosDemo } from "@/lib/datos/vitrina";
import { vistaPlan, type VistaPlan } from "@/lib/vista/plan";
import type { Idioma } from "@core/formatos/bilingue";

const html = document.documentElement;
let vistas: Record<Idioma, VistaPlan>;
beforeAll(async () => {
  const d = await datosDemo();
  vistas = { es: vistaPlan(d, "es"), en: vistaPlan(d, "en") };
});
afterEach(() => {
  html.removeAttribute("data-perfil");
  localStorage.clear();
});

function Pagina({ idioma }: { idioma: Idioma }) {
  const v = vistas[idioma];
  return (
    <>
      <MiradaPlan v={v} idioma={idioma} />
      <IndicePlan v={v} idioma={idioma} />
      {v.secciones.map((s) => (
        <SeccionDelPlan key={s.id} s={s} idioma={idioma} />
      ))}
      <SeccionContrato v={v} idioma={idioma} />
    </>
  );
}

describe("navegar el plan", () => {
  it("las cifras y el índice llevan a secciones que existen", () => {
    const { container } = render(<Pagina idioma="es" />);
    const nav = screen.getByRole("navigation", { name: "Partes del plan" });
    const destinos = [
      ...within(nav).getAllByRole("link"),
      ...within(
        screen.getByRole("list", { name: "El plan en cifras" }),
      ).getAllByRole("link"),
    ].map((a) => a.getAttribute("href")!);
    expect(destinos).toHaveLength(11);
    for (const h of destinos)
      expect(container.querySelector(h), h).not.toBeNull();
  });

  it("«Ver N más» abre el resto y lo vuelve a cerrar", async () => {
    render(<Pagina idioma="es" />);
    const boton = screen.getByRole("button", { name: "Ver 3 más: R7, R4, R8" });
    const resto = document.getElementById(
      boton.getAttribute("aria-controls")!,
    )!;
    expect(resto.hidden).toBe(true);
    expect(within(resto).getByText("Bucle de aclaraciones")).toBeTruthy();
    await act(async () => fireEvent.click(boton));
    expect(resto.hidden).toBe(false);
    expect(boton.getAttribute("aria-expanded")).toBe("true");
    expect(boton.textContent).toContain("Ver menos");
  });

  it("umbrales: «Moverlo» lleva al playground y dice cuál", () => {
    render(<Pagina idioma="en" />);
    const u1 = screen.getByRole("link", {
      name: "Move it: U1 in the playground",
    });
    expect(u1.getAttribute("href")).toBe("/en/playground");
  });

  it("todo nombre accesible contiene la etiqueta que se ve (WCAG 2.5.3, AU-S2-B20)", () => {
    for (const idioma of ["es", "en"] as const) {
      const { container, unmount } = render(<Pagina idioma={idioma} />);
      for (const el of container.querySelectorAll(
        "a[aria-label], button[aria-label]",
      )) {
        const visible = (el.textContent ?? "").replace(/\s+/g, " ").trim();
        if (visible) expect(el.getAttribute("aria-label")).toContain(visible);
      }
      unmount();
    }
  });
});

/** La forma del árbol: etiquetas y atributos, sin los que describen el estado. */
const ESTADO = new Set([
  "aria-pressed",
  "aria-expanded",
  "hidden",
  "open",
  "class",
]);
function forma(el: Element): string {
  const attrs = [...el.attributes]
    .filter((a) => !ESTADO.has(a.name))
    .map((a) => `${a.name}=${a.value}`)
    .sort()
    .join(",");
  return `<${el.tagName}${attrs}>${[...el.children].map(forma).join("")}</${el.tagName}>`;
}

describe("regla 5-a: la forma no depende del perfil ni del cliente", () => {
  it("el servidor pinta lo mismo sea cual sea el perfil, con todo lo del experto dentro", () => {
    html.setAttribute("data-perfil", "lider");
    const a = renderToStaticMarkup(<Pagina idioma="es" />);
    html.setAttribute("data-perfil", "experto");
    const b = renderToStaticMarkup(<Pagina idioma="es" />);
    expect(a).toBe(b);
    expect(a).toContain("Ficha técnica del plan");
    expect(a).toContain("Las 9 aristas condicionales, en orden");
    // Lo que va tras «Ver N más» también está en el HTML del servidor.
    expect(a).toContain("Cuota de la suscripción agotada a mitad de lote");
  });

  it("cambiar de perfil, abrir «Ver N más» y abrir un renglón no cambia la forma", async () => {
    const { container } = render(<Pagina idioma="es" />);
    const antes = forma(container);
    await act(async () =>
      fireEvent.click(
        within(screen.getByRole("group", { name: "Leer como" })).getByRole(
          "button",
          {
            name: "Experto",
          },
        ),
      ),
    );
    for (const b of screen.getAllByRole("button", { name: /^Ver \d+ más/ }))
      await act(async () => fireEvent.click(b));
    const details = container.querySelector("details")!;
    await act(async () => fireEvent.click(details.querySelector("summary")!));
    expect(html.getAttribute("data-perfil")).toBe("experto");
    expect(forma(container)).toBe(antes);
  });
});

describe("inglés", () => {
  it("sin español residual en lo que se lee (salvo el código del plan)", () => {
    const { container } = render(<Pagina idioma="en" />);
    const copia = container.cloneNode(true) as HTMLElement;
    for (const x of copia.querySelectorAll(".font-mono")) x.remove();
    const texto = copia.textContent ?? "";
    expect(texto).toContain("The plan at a glance");
    for (const residuo of [
      "Decisiones",
      "Riesgos",
      "Supuestos",
      "Ver ",
      "Por qué",
      "Qué ",
      "criticidad",
      "Objetivo",
      "Moverlo",
      "piezas",
    ])
      expect(texto, residuo).not.toContain(residuo);
  });
});
