/**
 * P4 Brecha renderizada (Testing Library): el informe en una mirada con lo que falló (S3 y las respuestas fuera de
 * formato) y lo que quedó sin probar (S1, con su borde discontinuo) al frente; las nueve secciones en su orden con su
 * ancla; el inglés sin español residual; y la regla 5-a: la FORMA del árbol no depende del perfil.
 */
import "../../setup.core-jsdom";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { MiradaBrecha } from "@/components/brecha/mirada";
import {
  Brechas,
  Criterios,
  Ejemplares,
  Ficha,
  PlanEnBreve,
  Playground,
  Resumen,
  Riesgos,
  Supuestos,
} from "@/components/brecha/secciones";
import { datosDemo, type DatosDemo } from "@/lib/datos/vitrina";
import { vistaBrecha } from "@/lib/vista/brecha";
import { noCumple } from "./_brecha-no-cumple";
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

function Pagina({ idioma, datos }: { idioma: Idioma; datos?: DatosDemo }) {
  const v = vistaBrecha(datos ?? d, idioma);
  return (
    <>
      <MiradaBrecha v={v} idioma={idioma} />
      <Resumen v={v} idioma={idioma} />
      <PlanEnBreve v={v} idioma={idioma} />
      <Criterios v={v} idioma={idioma} />
      <Riesgos v={v} idioma={idioma} />
      <Brechas v={v} idioma={idioma} />
      <Supuestos v={v} idioma={idioma} />
      <Ejemplares v={v} idioma={idioma} />
      <Playground v={v} idioma={idioma} />
      <Ficha v={v} idioma={idioma} />
    </>
  );
}

describe("el informe en una mirada", () => {
  it("lo que falló y lo sin probar van al frente, con su ancla", () => {
    const { container } = render(<Pagina idioma="es" />);
    expect(container.querySelector("#f-S2")).not.toBeNull();
    expect(container.querySelector("#f-S3")).not.toBeNull();
    expect(container.querySelector("#f-np")).not.toBeNull();
    const c5 = container.querySelector("#f-C5")!;
    expect(c5).not.toBeNull();
    // Lo que no se pudo decidir se dibuja discontinuo, con su palabra (el color nunca va solo): C5 se midió con una
    // corrida de las tres que pide pass^k, así que es «Incompleto», no «Sin probar».
    const chip = within(c5 as HTMLElement).getAllByText("Incompleto")[0]!;
    expect(chip.closest("span")!.className).toContain("border-dashed");
  });

  it("las nueve secciones del informe, en su orden", () => {
    const { container } = render(<Pagina idioma="es" />);
    // El ancla es el título de cada sección (lo enlaza el índice); la sección se nombra con él.
    const ids = [...container.querySelectorAll("section[aria-labelledby]")]
      .map((x) => x.getAttribute("aria-labelledby")!)
      .filter((id) => /^b\d$/.test(id));
    for (const id of ids)
      expect(container.querySelector(`h2#${id}`)).not.toBeNull();
    expect(ids).toEqual(["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9"]);
  });

  it("el playground del informe lleva al playground", () => {
    render(<Pagina idioma="es" />);
    const a = screen.getAllByRole("link", { name: /playground/i });
    expect(a.map((x) => x.getAttribute("href"))).toContain("/es/playground");
  });
});

describe("un informe que no cumple", () => {
  it("se pinta con el sello «No cumple» y C7 y R2 en lo que falló, con sus casos enlazados", () => {
    const { container } = render(<Pagina idioma="es" datos={noCumple(d)} />);
    expect(screen.getAllByText("No cumple").length).toBeGreaterThan(0);
    for (const id of ["f-C7", "f-R2", "f-S3"])
      expect(container.querySelector(`#${id}`), id).not.toBeNull();
    const r2 = container.querySelector("#f-R2")!;
    expect(
      [...r2.querySelectorAll("a")].map((a) => a.getAttribute("href")),
    ).toContain("/es/caso/A-015");
    expect(container.querySelector("#f-C6")).not.toBeNull();
  });
});

describe("inglés", () => {
  it("sin español residual en lo que se lee (salvo los nombres del código)", () => {
    const { container } = render(<Pagina idioma="en" />);
    const copia = container.cloneNode(true) as HTMLElement;
    for (const x of copia.querySelectorAll('[lang="es"], [hidden]')) x.remove();
    const texto = copia.textContent ?? "";
    expect(texto).toContain("The report at a glance");
    for (const residuo of [
      "Recibe",
      "Entrega",
      "Lo que falló",
      "Sin probar",
      " casos",
      "Cumple",
      "criterios",
      "sesión",
      "Supuestos",
      // Estados, criticidad y conectores que se colaban crudos en las líneas del experto (AU-S2-B18, B19).
      "refutado",
      "confirmado",
      "sin_probar",
      "cumple_con_alertas",
      "criticidad",
      "frente a",
      "indefinid",
      "corridas",
      "reintentos",
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
    expect(a).toContain("solo-lider");
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
