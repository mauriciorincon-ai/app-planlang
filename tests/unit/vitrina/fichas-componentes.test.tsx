/**
 * P7 Fichas renderizada (Testing Library): las dos fichas de la vitrina se pintan en la piel de CV Viva con su letra
 * solo dentro del marco y en el idioma de la ruta; el proceso del agente se lee por carril con la palabra de cada
 * tipo para el lector de pantalla; la tabla del experto está en el árbol en los dos perfiles; el inglés sin español
 * residual; y la regla 5-a: la FORMA del árbol no depende del perfil.
 */
import "../../setup.core-jsdom";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { SeccionFicha } from "@/components/fichas/ficha-cv";
import { MiradaFichas, Reproducibilidad } from "@/components/fichas/mirada";
import { hechosDelRepo, type HechosDelRepo } from "@/lib/datos/repo";
import { datosDeLosDemos, type DatosDeLosDemos } from "@/lib/datos/vitrina";
import { vistaFichas } from "@/lib/vista/fichas";
import type { Idioma } from "@core/formatos/bilingue";

const html = document.documentElement;
let ds: DatosDeLosDemos;
let repo: HechosDelRepo;
beforeAll(async () => {
  ds = await datosDeLosDemos();
  repo = hechosDelRepo();
});
afterEach(() => {
  html.removeAttribute("data-perfil");
  localStorage.clear();
});

function Pagina({ idioma }: { idioma: Idioma }) {
  const v = vistaFichas(ds, "demo-a", repo, idioma);
  return (
    <>
      <MiradaFichas v={v} idioma={idioma} />
      <Reproducibilidad v={v} idioma={idioma} />
      <SeccionFicha
        n={2}
        f={v.app}
        titulo={v.textos.seccionApp}
        idioma={idioma}
      />
      <SeccionFicha
        n={3}
        f={v.agente}
        titulo={v.textos.seccionAgente}
        idioma={idioma}
      />
    </>
  );
}

describe("las fichas en la piel de CV Viva", () => {
  it("dos fichas, cada una en el idioma de la ruta, con Fraunces solo dentro del marco", () => {
    const { container } = render(<Pagina idioma="es" />);
    const fichas = [...container.querySelectorAll("[data-ficha-cv]")];
    expect(fichas.map((f) => f.getAttribute("data-ficha-cv"))).toEqual([
      "app",
      "agente",
    ]);
    for (const f of fichas) {
      expect(f.getAttribute("lang")).toBe("es");
      expect(f.classList.contains("cv-viva")).toBe(true);
    }
    // La letra de la piel, solo dentro del marco.
    const conLetra = [...container.querySelectorAll(".cv-letra")];
    expect(conLetra.length).toBeGreaterThan(0);
    expect(conLetra.every((x) => x.closest(".cv-viva"))).toBe(true);
    expect(
      screen.getByRole("heading", {
        name: "Agente A · autorizaciones médicas",
      }),
    ).toBeTruthy();
  });

  it("cada cifra lleva su fuente en palabra y color, y la ficha de la app no dibuja proceso", () => {
    const { container } = render(<Pagina idioma="es" />);
    const app = container.querySelector('[data-ficha-cv="app"]')!;
    // Lo que se ve de cada píldora (el detalle va para el lector, no en un `title`: AU-S2-B26).
    const fuentes = [...app.querySelectorAll("[data-fuente]")].map((x) => [
      x.getAttribute("data-fuente"),
      x.firstChild?.textContent,
      x.querySelector(".sr-only")?.textContent?.trim().length ?? 0,
    ]);
    expect(fuentes.map(([f, t]) => [f, t])).toEqual([
      ["medido", "medido"],
      ["medido", "medido"],
      ["medido", "medido"],
      ["declarado", "declarado"],
      ["calculada", "calculada"],
    ]);
    for (const [, , detalle] of fuentes)
      expect(detalle as number).toBeGreaterThan(2);
    expect(app.querySelector("[data-carril]")).toBeNull();
    expect(app.textContent).not.toContain("Cómo funciona");
  });

  it("el proceso del agente: cuatro carriles y la palabra del tipo para el lector de pantalla", () => {
    const { container } = render(<Pagina idioma="es" />);
    const agente = container.querySelector('[data-ficha-cv="agente"]')!;
    expect(
      [...agente.querySelectorAll("[data-carril]")].map((c) =>
        c.getAttribute("data-carril"),
      ),
    ).toEqual(["medico", "agente", "auditor", "afiliado"]);
    const escala = [...agente.querySelectorAll('[data-paso="decision"]')].at(
      -1,
    )!;
    expect(escala.textContent).toBe("paso 10decisión: ¿Escala?");
  });
});

describe("el experto", () => {
  it("la tabla de campos y los pasos para repetir están en el árbol, ocultos al líder por atributo", () => {
    const { container } = render(<Pagina idioma="es" />);
    const tablas = container.querySelectorAll(".solo-experto [data-campo]");
    expect(tablas.length).toBe(10 + 12);
    expect(container.textContent).toContain("pnpm brecha:informe");
    expect(container.textContent).toContain("De dónde sale cada cifra");
    expect(container.textContent).toContain(
      "La ficha completa valida contra el esquema y las reglas del proceso.",
    );
  });
});

describe("inglés", () => {
  it("sin español residual en lo que se lee (salvo los nombres del código)", () => {
    const { container } = render(<Pagina idioma="en" />);
    const copia = container.cloneNode(true) as HTMLElement;
    // Lo que no se lee como texto: los comandos y nombres de archivo (`pnpm casos:generar`).
    for (const x of copia.querySelectorAll("code")) x.remove();
    const texto = copia.textContent ?? "";
    expect(texto).toContain("The records at a glance");
    expect(texto).toContain("96.2% extraction accuracy");
    expect(texto).toContain("Unsealed");
    expect(texto).toContain("Who it's for, and what it solves");
    for (const residuo of [
      "Recibe",
      "Entrega",
      "Ficha de",
      "funcionalidades",
      "Para quién",
      "Límites",
      "Nunca",
      "Dónde está",
      "Sin sellar",
      "Datos del",
      " casos",
      "decisiones",
      "segundos",
      "Médico",
      "Cabe",
      "medido",
      "calculada",
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
    expect(a).toContain("Cómo repetirla, en orden");
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
