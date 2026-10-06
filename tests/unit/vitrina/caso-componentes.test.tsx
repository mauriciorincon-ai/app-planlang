/**
 * P6 Caso renderizado (Testing Library), sobre la corrida de 200 del plan v1.5: la página de un caso con pausa y
 * documento (A-017) y la de uno sin ellos (A-001); la marca de la instrucción escondida (A-016) y el diálogo de
 * aclaración (A-013); el selector enlaza solo los casos con página y marca el actual; el inglés sin español residual;
 * y la regla 5-a: la FORMA del árbol no depende del perfil.
 */
import "../../setup.core-jsdom";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { MiradaCaso } from "@/components/caso/cabecera";
import { Caso } from "@/components/caso/caso";
import { datosDemo, type DatosDemo } from "@/lib/datos/vitrina";
import { chipsDeCasos, vistaCaso } from "@/lib/vista/caso";
import type { Idioma } from "@core/formatos/bilingue";

const html = document.documentElement;
let d: DatosDemo;
beforeAll(async () => {
  d = await datosDemo();
});
afterEach(() => {
  html.removeAttribute("data-perfil");
  localStorage.clear();
});

function Pagina({ id, idioma }: { id: string; idioma: Idioma }) {
  return (
    <>
      <MiradaCaso
        chips={chipsDeCasos(d, idioma)}
        total={d.corrida.trazas.length}
        actual={id}
        idioma={idioma}
        demo="demo-a"
      />
      <Caso v={vistaCaso(d, id, idioma)} idioma={idioma} />
    </>
  );
}

const titulo = (name: string | RegExp) =>
  screen.queryByRole("heading", { name, hidden: true });

describe("un caso con pausa y documento, uno sin ellos", () => {
  it("A-017 trae la pausa, el documento, sus 7 pasos y las 18 señales", () => {
    const { container } = render(<Pagina id="A-017" idioma="es" />);
    expect(titulo("La pausa humana: lo que vio el auditor")).not.toBeNull();
    expect(titulo("El documento de decisión adversa")).not.toBeNull();
    expect(titulo(/^Las 18 señales que deja la traza$/)).not.toBeNull();
    const pasos = container.querySelectorAll(
      "section[aria-labelledby=c-rec] ol > li",
    );
    expect(pasos).toHaveLength(7);
    // Cada paso es un ancla: el playground enlaza al paso donde el camino se separa (AU-S2-P-5).
    expect([...pasos].map((li) => li.id)).toEqual(
      [1, 2, 3, 4, 5, 6, 7].map((n) => `paso-${n}`),
    );
    // El documento es un artículo con su aviso de IA al pie.
    const doc = container.querySelector(
      "section[aria-labelledby=c-doc] article",
    )!;
    expect(doc.querySelector("footer")!.textContent!.length).toBeGreaterThan(
      20,
    );
  });

  it("A-001 no tuvo pausa ni documento y no los inventa", () => {
    const { container } = render(<Pagina id="A-001" idioma="es" />);
    expect(titulo("La pausa humana: lo que vio el auditor")).toBeNull();
    expect(titulo("El documento de decisión adversa")).toBeNull();
    expect(titulo("La respuesta y la guardia")).not.toBeNull();
    expect(container.querySelector("#c-pausa, #c-doc")).toBeNull();
  });

  it("A-016 marca la instrucción escondida; A-013 muestra el diálogo y ninguna marca", () => {
    const a = render(<Pagina id="A-016" idioma="es" />);
    const marcas = a.container.querySelectorAll("mark");
    expect(marcas).toHaveLength(1);
    expect(marcas[0]!.textContent).toContain("instrucción escondida");
    a.unmount();

    const b = render(<Pagina id="A-013" idioma="es" />);
    expect(b.container.querySelectorAll("mark")).toHaveLength(0);
    const preguntas = screen.getAllByText("Pregunta");
    expect(preguntas.length).toBeGreaterThanOrEqual(1);
    // El texto del modelo queda en su idioma original y lo dice.
    const cita = preguntas[0]!.parentElement!.querySelector("[lang]")!;
    expect(cita.getAttribute("lang")).toBe("es");
  });
});

describe("el selector", () => {
  it("enlaza a los casos con página (no a los 200) y marca solo el actual", () => {
    render(<Pagina id="A-013" idioma="en" />);
    const nav = screen.getByRole("navigation", { name: "Cases" });
    const enlaces = within(nav).getAllByRole("link");
    expect(enlaces).toHaveLength(chipsDeCasos(d, "en").length);
    expect(enlaces.length).toBeLessThan(d.corrida.trazas.length);
    const actuales = enlaces.filter((a) => a.getAttribute("aria-current"));
    expect(actuales.map((a) => a.getAttribute("href"))).toEqual([
      "/en/caso/A-013",
    ]);
  });
});

describe("inglés", () => {
  it("sin español residual en lo que se lee (salvo las citas del modelo y los nombres del código)", () => {
    const { container } = render(<Pagina id="A-017" idioma="en" />);
    const copia = container.cloneNode(true) as HTMLElement;
    for (const x of copia.querySelectorAll('[lang="es"]')) x.remove();
    const texto = copia.textContent ?? "";
    expect(texto).toContain("The case at a glance");
    for (const residuo of [
      "Recibe",
      "Entrega",
      "Pregunta",
      "Respuesta",
      " casos",
      "La pausa",
      "negado",
      "aprobado",
      "Paso ",
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
    const a = renderToStaticMarkup(<Pagina id="A-017" idioma="es" />);
    html.setAttribute("data-perfil", "experto");
    const b = renderToStaticMarkup(<Pagina id="A-017" idioma="es" />);
    expect(a).toBe(b);
    expect(a).toContain("solo-experto");
    expect(a).toContain("Las 18 señales que deja la traza");
  });

  it("cambiar a experto y volver no cambia la forma", async () => {
    const { container } = render(<Pagina id="A-017" idioma="es" />);
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

describe("el documento de rechazo del B sin aviso de IA (regla dura 12, AU-S3-07)", () => {
  it("B-005, B-006 y B-014 dicen la falla con su marca, en los dos idiomas; un documento del A con aviso no la dice", async () => {
    const b = await datosDemo("demo-b");
    for (const id of ["B-005", "B-006", "B-014"])
      for (const [idioma, chip, frase] of [
        ["es", "Sin aviso de IA", "Este documento no trae su aviso de IA"],
        ["en", "No AI notice", "This document carries no AI notice"],
      ] as const) {
        const { container, unmount } = render(
          <Caso v={vistaCaso(b, id, idioma)} idioma={idioma} />,
        );
        const falla = container.querySelector('[data-falla="aviso-ia"]');
        expect(falla, `${id} (${idioma})`).not.toBeNull();
        expect(falla!.querySelector('[data-v="no-cumple"]')!.textContent).toBe(
          chip,
        );
        expect(falla!.textContent).toContain(frase);
        unmount();
      }
    const { container } = render(
      <Caso v={vistaCaso(d, "A-017", "es")} idioma="es" />,
    );
    expect(container.querySelector('[data-falla="aviso-ia"]')).toBeNull();
  });
});
