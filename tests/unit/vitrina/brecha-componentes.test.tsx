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
    // La corrida publicada no deja nada sin decidir (verificador 1.3.0: C5 se mide en una corrida en el lote de 200).
    expect(within(container).queryAllByText("Incompleto")).toHaveLength(0);
  });

  it("lo que no se pudo decidir se dibuja discontinuo, con su palabra (el color nunca va solo)", () => {
    const incompleto = { ...d, informe: structuredClone(d.informe) };
    incompleto.informe.criterios.find((c) => c.id === "C5")!.estado =
      "incompleto";
    const { container } = render(<Pagina idioma="es" datos={incompleto} />);
    const c5 = container.querySelector("#f-C5")!;
    expect(c5).not.toBeNull();
    // «Incompleto», no «Sin probar»: se midió, con menos corridas de las que pide pass^k.
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

/** La vitrina une la cifra y su signo con un espacio duro; aquí se lee con espacio normal. */
const llano = (t: string | null | undefined) =>
  (t ?? "").replaceAll("\u00a0", " ");

describe("S1 con su garantía (S8, ADR-018)", () => {
  it("en llano: el nivel que el informe declara, dónde cae el umbral de la corrida y lo que los datos no alcanzan", () => {
    const { container } = render(<Pagina idioma="es" />);
    const s1 = container.querySelector("#s-S1")!;
    const g = s1.querySelector('[data-garantia="s1"]')!;
    expect(llano(g.textContent)).toContain(
      "Zona respaldada con 10 % de error: confianza mínima de 0,50 a 0,90.",
    );
    expect(llano(g.textContent)).toContain(
      "El U1 de la corrida (0,75) cae dentro.",
    );
    expect(llano(g.textContent)).toContain(
      "no se respalda con la secuencia que parte del umbral más alto",
    );
    expect(llano(g.textContent)).toContain("secuencia fija");
    expect(llano(g.textContent)).toContain("harían falta 268 casos");
    expect(llano(g.textContent)).toContain(
      "La etapa redactor no tiene verdad conocida",
    );
    // La zona respaldada también se ve en la curva de S1 (trama; el color nunca va solo).
    expect(
      s1.querySelector('#curva-S1 [data-zona="respaldada"]'),
    ).not.toBeNull();
    expect(s1.querySelector("#curva-S1 desc")!.textContent).toBe(
      "zona respaldada de 0,50 a 0,90",
    );
    // Solo S1 trae garantía.
    expect(container.querySelectorAll('[data-garantia="s1"]')).toHaveLength(1);
  });

  it("para el experto: la tabla de los tres niveles de α con el del informe marcado, el método, las pruebas y el alcance", () => {
    const { container } = render(<Pagina idioma="es" />);
    const g = container.querySelector('[data-garantia="s1"]')!;
    const solo = g.querySelector(".solo-experto")!;
    const filas = [...solo.querySelectorAll("[data-alfa]")];
    expect(filas.map((f) => f.getAttribute("data-alfa"))).toEqual([
      "0.05",
      "0.1",
      "0.2",
    ]);
    expect(llano(filas[1]!.textContent)).toContain("α 0,10 · el del informe");
    expect(llano(filas[1]!.textContent)).toContain("0,50–0,90");
    expect(llano(filas[1]!.textContent)).toContain("no alcanza");
    expect(llano(filas[2]!.textContent)).toContain("0,50 (k = 2)");
    const texto = llano(solo.textContent);
    expect(texto).toContain("Learn then Test, secuencia fija");
    expect(texto).toContain(
      "Cobertura conjunta (Bonferroni): extractor, aclaración",
    );
    expect(texto).toContain("Pruebas a α = 0,10");
    expect(texto).toContain("Alcance: vale para casos intercambiables");
  });

  it("en inglés, redactado y con los números en inglés", () => {
    const { container } = render(<Pagina idioma="en" />);
    const g = container.querySelector('[data-garantia="s1"]')!;
    const texto = llano(g.textContent);
    expect(texto).toContain(
      "Backed zone at 10% error: minimum confidence from 0.50 to 0.90.",
    );
    expect(texto).toContain("The run's U1 (0.75) falls inside.");
    expect(texto).toContain("it would take 268 cases");
    expect(texto).toContain(
      "Joint coverage (Bonferroni): extractor, clarification",
    );
    for (const residuo of [
      "Zona",
      "caso",
      "Alcance",
      "Pruebas",
      "el del informe",
    ])
      expect(texto, residuo).not.toContain(residuo);
  });

  it("sin garantía en el informe, S1 es el de antes: sin bloque ni banda", () => {
    const sin = { ...d, informe: structuredClone(d.informe) };
    for (const s of sin.informe.supuestos) s.garantia = null;
    const { container } = render(<Pagina idioma="es" datos={sin} />);
    expect(container.querySelector('[data-garantia="s1"]')).toBeNull();
    expect(
      container.querySelector('#curva-S1 [data-zona="respaldada"]'),
    ).toBeNull();
    expect(container.querySelector("#curva-S1")).not.toBeNull();
  });

  it("la forma del árbol no depende del perfil", () => {
    html.setAttribute("data-perfil", "lider");
    const a = renderToStaticMarkup(<Pagina idioma="es" />);
    html.setAttribute("data-perfil", "experto");
    const b = renderToStaticMarkup(<Pagina idioma="es" />);
    expect(a).toBe(b);
    expect(a).toContain("Cobertura conjunta (Bonferroni)");
  });
});
