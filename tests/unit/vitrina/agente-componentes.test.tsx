/**
 * P3 Agente renderizado (Testing Library): la selección compartida entre el lienzo, la lista por capa y el detalle;
 * las pestañas de un panel (Líder · Experto = perfil de la página; Código · Trazas, del panel); «Ver N más»; el
 * conmutador lienzo · lista; y la regla 5-a: la FORMA del árbol no depende del perfil ni del estado del cliente.
 */
import "../../setup.core-jsdom";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { Detalle } from "@/components/agente/detalle";
import { FichaAgente } from "@/components/agente/ficha";
import { SeccionGrafo } from "@/components/agente/grafo";
import { Seleccion } from "@/components/agente/seleccion";
import { datosDemo } from "@/lib/datos/vitrina";
import { vistaAgente, type VistaAgente } from "@/lib/vista/agente";
import type { Idioma } from "@core/formatos/bilingue";

const html = document.documentElement;
let vistas: Record<Idioma, VistaAgente>;
beforeAll(async () => {
  const d = await datosDemo();
  vistas = { es: vistaAgente(d, "es"), en: vistaAgente(d, "en") };
});
afterEach(() => {
  html.removeAttribute("data-perfil");
  localStorage.clear();
});

function Pagina({ idioma }: { idioma: Idioma }) {
  const v = vistas[idioma];
  const inicial = v.paneles[0]!.id;
  const seleccionables = new Set([...v.paneles.map((p) => p.id), v.arista.id]);
  return (
    <>
      <FichaAgente vista={v} idioma={idioma} />
      <Seleccion inicial={inicial}>
        <SeccionGrafo
          lienzo={v.lienzo}
          svg={v.lienzo.svg}
          seleccionables={seleccionables}
          idioma={idioma}
        />
        <Detalle vista={v} idioma={idioma} />
      </Seleccion>
    </>
  );
}

const detalle = (id: string) =>
  document.getElementById(`detalle-${id}`) as HTMLElement;

describe("selección: lienzo, lista y detalle", () => {
  it("abre con el primer nodo del contrato y sin anuncio", () => {
    const { container } = render(<Pagina idioma="es" />);
    expect(detalle("enrutador").hidden).toBe(false);
    for (const p of vistas.es.paneles.slice(1))
      expect(detalle(p.id).hidden, p.id).toBe(true);
    expect(detalle(vistas.es.arista.id).hidden).toBe(true);
    expect(
      container
        .querySelector('[data-sel-id="enrutador"]')
        ?.getAttribute("data-sel"),
    ).toBe("true");
    expect(container.querySelector("[aria-live]")?.textContent).toBe("");
  });

  it("tocar un nodo del lienzo muestra su panel, mueve la marca y lo anuncia", async () => {
    const { container } = render(<Pagina idioma="es" />);
    const nodo = container.querySelector('[data-sel-id="extractor"]')!;
    await act(async () => fireEvent.click(nodo));
    expect(detalle("extractor").hidden).toBe(false);
    expect(detalle("enrutador").hidden).toBe(true);
    expect(nodo.getAttribute("data-sel")).toBe("true");
    expect(nodo.getAttribute("aria-pressed")).toBe("true");
    expect(
      container
        .querySelector('[data-sel-id="enrutador"]')
        ?.hasAttribute("data-sel"),
    ).toBe(false);
    expect(container.querySelector("[aria-live]")?.textContent).toBe(
      "Detalle: extractor",
    );
  });

  it("con el teclado: Enter sobre la regla U1 abre su panel", async () => {
    const { container } = render(<Pagina idioma="es" />);
    const regla = container.querySelector(
      `[data-sel-id="${vistas.es.arista.id}"]`,
    )!;
    await act(async () => fireEvent.keyDown(regla, { key: "Enter" }));
    expect(detalle(vistas.es.arista.id).hidden).toBe(false);
    expect(
      within(detalle(vistas.es.arista.id)).getByRole("img", {
        name: /U1 = 0,75/,
      }),
    ).toBeInTheDocument();
  });

  it("la lista por capa también elige: su nodo es un botón que controla el detalle", async () => {
    render(<Pagina idioma="es" />);
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Lista por capa" })),
    );
    const boton = screen
      .getAllByRole("button")
      .find((b) => b.getAttribute("aria-controls") === "detalle-decision")!;
    await act(async () => fireEvent.click(boton));
    expect(detalle("decision").hidden).toBe(false);
    expect(boton.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("el lienzo y la lista", () => {
  it("el conmutador oculta uno y muestra el otro", async () => {
    const { container } = render(<Pagina idioma="es" />);
    const lienzo = container.querySelector(
      '[data-vista-panel="lienzo"]',
    ) as HTMLElement;
    const lista = container.querySelector(
      '[data-vista-panel="lista"]',
    ) as HTMLElement;
    expect([lienzo.hidden, lista.hidden]).toEqual([false, true]);
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Lista por capa" })),
    );
    expect([lienzo.hidden, lista.hidden]).toEqual([true, false]);
    expect(
      within(lista).getAllByRole("listitem").length,
    ).toBeGreaterThanOrEqual(6);
  });

  it("el índice de capas nombra cada capa y el SVG es el que generó el núcleo", () => {
    render(<Pagina idioma="es" />);
    for (const n of ["01", "02", "03", "04", "05", "06"])
      expect(
        screen.getByRole("button", { name: `Ir a la capa ${n}` }),
      ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /Diagrama del agente/ }),
    ).toBeInTheDocument();
  });
});

describe("pestañas de un panel", () => {
  it("Código y Trazas son del panel; Líder y Experto, el perfil de la página", async () => {
    render(<Pagina idioma="es" />);
    const panel = within(detalle("enrutador"));
    const vista = (id: string) =>
      detalle("enrutador").querySelector(
        `[data-vista-panel="${id}"]`,
      ) as HTMLElement;
    await act(async () =>
      fireEvent.click(panel.getByRole("button", { name: "Código" })),
    );
    expect([vista("perfil").hidden, vista("codigo").hidden]).toEqual([
      true,
      false,
    ]);
    expect(
      panel
        .getByRole("button", { name: "Código" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    await act(async () =>
      fireEvent.click(panel.getByRole("button", { name: "Experto" })),
    );
    expect(html.dataset.perfil).toBe("experto");
    expect(vista("perfil").hidden).toBe(false);
    expect(vista("codigo").hidden).toBe(true);
    expect(
      panel
        .getByRole("button", { name: "Experto" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("«Ver N más» abre el resto de las trazas y cambia su rótulo", async () => {
    render(<Pagina idioma="es" />);
    const panel = within(detalle("enrutador"));
    await act(async () =>
      fireEvent.click(panel.getByRole("button", { name: /^Trazas · 20$/ })),
    );
    const mas = panel.getByRole("button", {
      name: "Ver 15 más: A-006 … A-020",
    });
    const resto = document.getElementById(mas.getAttribute("aria-controls")!)!;
    expect(resto.hidden).toBe(true);
    expect(resto.querySelectorAll("details")).toHaveLength(15);
    await act(async () => fireEvent.click(mas));
    expect(resto.hidden).toBe(false);
    expect(mas.getAttribute("aria-expanded")).toBe("true");
    expect(mas.textContent).toBe("Ver menos");
  });

  it("cada traza enlaza a su caso de punta a punta", () => {
    render(<Pagina idioma="en" />);
    const enlaces = within(detalle("enrutador")).getAllByRole("link", {
      name: /See the case end to end/,
      hidden: true, // viven en la pestaña Trazas, cerrada
    });
    expect(enlaces).toHaveLength(20);
    expect(enlaces[0]!.getAttribute("href")).toBe("/en/caso/A-001");
  });
});

describe("inglés", () => {
  it("sin español residual en lo que se lee (salvo nombres del código)", () => {
    const { container } = render(<Pagina idioma="en" />);
    const texto = container.textContent ?? "";
    expect(texto).toContain("The agent at a glance");
    for (const residuo of [
      "Recibe",
      "Entrega",
      " casos",
      "corrida v",
      "Lista por capa",
      "Para qué existe",
      "Ver el caso",
    ])
      expect(texto, residuo).not.toContain(residuo);
  });
});

/** La forma del árbol: etiquetas y atributos, sin los que describen el estado. */
const ESTADO = new Set([
  "aria-pressed",
  "aria-expanded",
  "aria-current",
  "hidden",
  "data-sel",
  "data-vista-actual",
  "data-cabe",
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
  it("el servidor pinta lo mismo sea cual sea el perfil y trae los dos", () => {
    html.setAttribute("data-perfil", "lider");
    const a = renderToStaticMarkup(<Pagina idioma="es" />);
    html.setAttribute("data-perfil", "experto");
    const b = renderToStaticMarkup(<Pagina idioma="es" />);
    expect(a).toBe(b);
    expect(a).toContain("solo-lider");
    expect(a).toContain("solo-experto");
    expect(a).toContain("Qué del plan toca a cada nodo");
  });

  it("elegir otro nodo, otra pestaña o abrir trazas no cambia la forma", async () => {
    const { container } = render(<Pagina idioma="es" />);
    const antes = forma(container);
    await act(async () =>
      fireEvent.click(container.querySelector('[data-sel-id="decision"]')!),
    );
    await act(async () =>
      fireEvent.click(
        within(detalle("decision")).getByRole("button", { name: "Código" }),
      ),
    );
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Lista por capa" })),
    );
    expect(forma(container)).toBe(antes);
  });
});
