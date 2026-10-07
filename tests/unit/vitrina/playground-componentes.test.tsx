/**
 * P5 Playground renderizado (Testing Library): la isla hidrata sin diferencias con lo que pintó el servidor (los
 * valores del plan son el primer render; sin #418); sobre la corrida de 200 del plan v1.5, mover U1 a 0,85 manda A-089
 * y A-144 a una persona y «Volver al plan» deshace; U2 en 1600 introduce doce errores y C3 deja de cumplirse; el modo
 * Texas manda a una persona las nueve aprobaciones en parte y dice que es la revisión que exige; el inglés sin español
 * residual; y la regla 5-a: la FORMA del árbol no depende del perfil.
 */
import "../../setup.core-jsdom";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Juego } from "@/components/playground/juego";
import { Limites, MiradaPlayground } from "@/components/playground/mirada";
import { datosDemo, type DatosDemo } from "@/lib/datos/vitrina";
import { vistaCaso } from "@/lib/vista/caso";
import { vistaPlayground } from "@/lib/vista/playground";
import type { Idioma } from "@core/formatos/bilingue";

const html = document.documentElement;
let d: DatosDemo;
beforeAll(async () => {
  d = await datosDemo();
});
afterEach(() => {
  html.removeAttribute("data-perfil");
  localStorage.clear();
  vi.restoreAllMocks();
});

function Pagina({ idioma }: { idioma: Idioma }) {
  const v = vistaPlayground(d, idioma);
  return (
    <>
      <MiradaPlayground v={v} idioma={idioma} />
      <Juego datos={v.isla} />
      <Limites v={v} idioma={idioma} />
    </>
  );
}

const estado = () =>
  screen
    .getAllByRole("status")
    .map((s) => s.textContent ?? "")
    .join(" | ");
const filas = (c: HTMLElement) =>
  [...c.querySelectorAll("#cambios [data-caso]")].map((x) =>
    x.getAttribute("data-caso"),
  );

describe("la isla hidrata sobre el HTML del servidor", () => {
  it("con los valores del plan, el primer render del cliente es el del servidor", async () => {
    const isla = vistaPlayground(d, "es").isla;
    const servidor = renderToString(<Juego datos={isla} />);
    const cont = document.createElement("div");
    cont.innerHTML = servidor;
    document.body.appendChild(cont);
    // El HTML tal como lo deja el navegador al leerlo (`<input>` sin barra): contra eso se compara.
    const antes = cont.innerHTML;
    const errores: unknown[] = [];
    vi.spyOn(console, "error").mockImplementation((...a) => errores.push(a));
    let raiz: Root | undefined;
    try {
      await act(async () => {
        raiz = hydrateRoot(cont, <Juego datos={isla} />, {
          onRecoverableError: (e) => errores.push(e),
        });
      });
      expect(errores).toEqual([]);
      expect(cont.innerHTML).toBe(antes);
    } finally {
      await act(async () => raiz?.unmount());
      cont.remove();
    }
  });
});

describe("mover los umbrales", () => {
  it("U1 a 0,85 manda A-089 y A-144 a una persona; «Volver al plan» lo deshace", async () => {
    const { container } = render(<Pagina idioma="es" />);
    expect(filas(container)).toEqual([]);
    expect(estado()).toContain(
      "En los valores del plan: el recálculo reproduce el camino de los 200 casos.",
    );
    const u1 = screen.getByRole("slider", { name: /Confianza mínima/ });
    await act(async () => fireEvent.change(u1, { target: { value: "0.85" } }));
    expect(filas(container)).toEqual(["A-089", "A-144"]);
    expect(estado()).toContain("Movido: U1 0,85.");
    const fila = container.querySelector('[data-caso="A-089"]')!;
    expect(fila.textContent).toContain("confianza 0,80 menor que 0,85");
    expect(fila.textContent).toContain("revisión de más · +12 min");
    // El enlace abre la traza en el paso donde el camino se separa (AU-S2-P-5): en P6, ese paso es la decisión.
    expect(fila.querySelector("a")!.getAttribute("href")).toBe(
      "/es/caso/A-089#paso-6",
    );
    expect(vistaCaso(d, "A-089", "es").pasos.find((p) => p.n === 6)?.nodo).toBe(
      "decision",
    );
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: /Volver al plan/ })),
    );
    expect(filas(container)).toEqual([]);
    expect((u1 as HTMLInputElement).value).toBe("0.75");
  });

  it("U2 en 1600: doce casos de alto costo salen sin persona, son errores y C3 deja de cumplirse", async () => {
    const { container } = render(<Pagina idioma="es" />);
    const u2 = screen.getByRole("slider", { name: /Alto costo/ });
    await act(async () => fireEvent.change(u2, { target: { value: "1600" } }));
    expect(filas(container)).toEqual([
      "A-007",
      "A-035",
      "A-045",
      "A-059",
      "A-083",
      "A-087",
      "A-142",
      "A-156",
      "A-183",
      "A-189",
      "A-191",
      "A-196",
    ]);
    const fila = container.querySelector('[data-caso="A-007"]')!;
    expect(fila.textContent).toContain("error: debía ir a una persona");
    // A-035 no tiene página propia: la fila lo dice en lugar de enlazar.
    const sin = container.querySelector('[data-caso="A-035"]')!;
    expect(sin.querySelector("a")).toBeNull();
    expect(sin.textContent).toContain("sin página propia");
    expect(container.textContent).toContain("C3 no cumple");
    expect(container.textContent).toContain("Deja de cumplirse C3.");
  });

  it("lo que oye un lector: la línea de estado lee las cifras y el valor del deslizador se dice una vez (AU-S2-B21, B29)", async () => {
    const { container } = render(<Pagina idioma="es" />);
    const viva = container.querySelector(
      '[role="status"][aria-live="polite"]',
    )!;
    expect(viva.textContent).toContain(
      "De 200 casos, 0 cambian de camino; 0 errores introducidos y 0 evitados;",
    );
    const u2 = screen.getByRole("slider", { name: /Alto costo/ });
    await act(async () => fireEvent.change(u2, { target: { value: "1600" } }));
    expect(viva.textContent).toContain(
      "De 200 casos, 12 cambian de camino; 12 errores introducidos y 0 evitados;",
    );
    expect(viva.textContent).toMatch(/de \d+ criterios cumplen\.$/);
    const salidas = [...container.querySelectorAll("output")];
    expect(salidas.length).toBeGreaterThan(0);
    for (const o of salidas) expect(o.getAttribute("aria-live")).toBe("off");
  });

  it("el modo Texas manda a una persona las nueve aprobaciones en parte: es la revisión que exige, no una de más", async () => {
    const { container } = render(<Pagina idioma="es" />);
    const t = screen.getByRole("switch", { name: /Modo Texas/ });
    expect(t.getAttribute("aria-checked")).toBe("false");
    await act(async () => fireEvent.click(t));
    expect(t.getAttribute("aria-checked")).toBe("true");
    expect(filas(container)).toEqual([
      "A-006",
      "A-018",
      "A-073",
      "A-081",
      "A-114",
      "A-122",
      "A-140",
      "A-179",
      "A-194",
    ]);
    expect(container.textContent).not.toContain(
      "Encender el modo Texas no cambia ningún caso",
    );
    const fila = container.querySelector('[data-caso="A-006"]')!;
    expect(fila.textContent).toContain("la exige el modo Texas · +12 min");
    expect(fila.textContent).not.toContain("revisión de más");
    // La línea del experto dice el interruptor como lo evaluó el núcleo: encendido.
    expect(fila.textContent).toContain("modo_texas true → pausa_humana");
    expect(estado()).toContain("Movido: modo Texas encendido.");
    expect(estado()).toContain("De 200 casos, 9 cambian de camino;");
  });
});

describe("inglés", () => {
  it("sin español residual en lo que se lee (salvo los nombres del código)", async () => {
    const { container } = render(<Pagina idioma="en" />);
    const u1 = screen.getByRole("slider", { name: /Minimum extraction/i });
    await act(async () => fireEvent.change(u1, { target: { value: "0.9" } }));
    await act(async () =>
      fireEvent.click(screen.getByRole("switch", { name: /Texas mode/ })),
    );
    const copia = container.cloneNode(true) as HTMLElement;
    // Lo que no se lee: las citas en español y lo oculto por `hidden` (las marcas «movido» de los umbrales quietos).
    for (const x of copia.querySelectorAll('[lang="es"], [hidden]')) x.remove();
    const texto = copia.textContent ?? "";
    expect(texto).toContain("The playground at a glance");
    expect(texto).toContain("Moved: U1 0.90 · Texas mode on.");
    expect(texto).toContain("required by Texas mode");
    for (const residuo of [
      "Mueve",
      "Recibe",
      "Entrega",
      " casos",
      "errores",
      "criterios",
      "Volver",
      "persona ",
      " confianza 0",
      "Pruébalo",
    ])
      expect(texto, residuo).not.toContain(residuo);
  });
});

/** La forma del árbol: etiquetas y atributos, sin los que describen el estado. */
const ESTADO = new Set(["aria-pressed", "aria-current", "hidden", "class"]);
function forma(el: Element): string {
  const attrs = [...el.attributes]
    .filter((a) => !ESTADO.has(a.name))
    .map((a) => `${a.name}=${a.value}`)
    .sort()
    .join(",");
  return `<${el.tagName}${attrs}>${[...el.children].map(forma).join("")}</${el.tagName}>`;
}

describe("regla 5-a: la forma no depende del perfil", () => {
  it("el servidor pinta lo mismo sea cual sea el perfil y trae los dos", () => {
    html.setAttribute("data-perfil", "lider");
    const a = renderToStaticMarkup(<Pagina idioma="es" />);
    html.setAttribute("data-perfil", "experto");
    const b = renderToStaticMarkup(<Pagina idioma="es" />);
    expect(a).toBe(b);
    expect(a).toContain("solo-experto");
    expect(a).toContain("Ficha técnica del playground");
    expect(a).toContain("Las 200 decisiones, con sus señales");
  });

  it("cambiar a experto y volver no cambia la forma", async () => {
    const { container } = render(<Pagina idioma="es" />);
    const antes = forma(container);
    const grupo = screen.getByRole("group", { name: "Leer como" });
    await act(async () =>
      fireEvent.click(within(grupo).getByRole("button", { name: "Experto" })),
    );
    expect(html.getAttribute("data-perfil")).toBe("experto");
    expect(forma(container)).toBe(antes);
    await act(async () =>
      fireEvent.click(within(grupo).getByRole("button", { name: "Líder" })),
    );
    expect(forma(container)).toBe(antes);
  });
});
