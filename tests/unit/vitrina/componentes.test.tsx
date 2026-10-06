/**
 * Componentes canon de la vitrina (design-system § 5) con Testing Library: veredicto y chip dibujados, la
 * barra con sus pestañas e idiomas, el aviso de perfil (y a dónde va el foco), y la regla 5-a: la FORMA del
 * árbol no depende del perfil ni del estado del cliente.
 */
import "../../setup.core-jsdom";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { Chip } from "@/components/chip";
import { ComoFunciona } from "@/components/entrada/como-funciona";
import { Demos } from "@/components/entrada/demos";
import { LoQueNinguna } from "@/components/entrada/lo-que-ninguna";
import { Portada } from "@/components/entrada/portada";
import { Pregunta } from "@/components/entrada/pregunta";
import { Marco } from "@/components/marco/marco";
import { Veredicto, claseDeVeredicto } from "@/components/veredicto";
import { datosDeLosDemos } from "@/lib/datos/vitrina";
import { DEMOS } from "@/lib/demos";
import {
  filaDeDemo,
  vistaEntrada,
  type FilaDemo,
  type VistaEntrada,
} from "@/lib/vista/entrada";
import type { Idioma } from "@core/formatos/bilingue";

const html = document.documentElement;
let vistas: Record<Idioma, VistaEntrada>;
let filas: Record<Idioma, FilaDemo[]>;
beforeAll(async () => {
  const ds = await datosDeLosDemos();
  const d = ds["demo-a"];
  vistas = { es: vistaEntrada(d, "es"), en: vistaEntrada(d, "en") };
  filas = {
    es: DEMOS.map((id) => filaDeDemo(ds[id], "es")),
    en: DEMOS.map((id) => filaDeDemo(ds[id], "en")),
  };
});
afterEach(() => {
  html.removeAttribute("data-perfil");
  html.removeAttribute("data-theme");
  localStorage.clear();
});

function Entrada({ idioma }: { idioma: Idioma }) {
  const v = vistas[idioma];
  return (
    <Marco idioma={idioma} pagina="entrada">
      <Portada idioma={idioma} />
      <ComoFunciona vista={v} idioma={idioma} />
      <LoQueNinguna vista={v} idioma={idioma} />
      <Demos filas={filas[idioma]} idioma={idioma} />
      <Pregunta idioma={idioma} />
    </Marco>
  );
}

describe("veredicto y chip: forma + texto + color", () => {
  it.each(["cumple", "alerta", "no-cumple", "beta"] as const)(
    "veredicto %s lleva su marca dibujada y su texto",
    (c) => {
      const { container } = render(<Veredicto clase={c}>texto</Veredicto>);
      const v = container.firstElementChild as HTMLElement;
      expect(v.dataset.v).toBe(c);
      expect(v.querySelector("svg")).not.toBeNull();
      expect(v.textContent).toBe("texto");
      expect(v.className.includes("border-dashed")).toBe(c === "beta");
    },
  );
  it("el valor del informe elige la clase", () => {
    expect(claseDeVeredicto("cumple")).toBe("cumple");
    expect(claseDeVeredicto("cumple_con_alertas")).toBe("alerta");
    expect(claseDeVeredicto("no_cumple")).toBe("no-cumple");
  });
  it("el chip «declarado» no lleva punto; «maqueta» lo lleva discontinuo", () => {
    const { container } = render(
      <>
        <Chip procedencia="declarado">d</Chip>
        <Chip procedencia="maqueta">m</Chip>
        <Chip procedencia="real">r</Chip>
      </>,
    );
    const [d, m, r] = [...container.querySelectorAll("[data-procedencia]")];
    expect(d.querySelector("svg")).toBeNull();
    expect(
      m.querySelector("circle")?.getAttribute("stroke-dasharray"),
    ).toBeTruthy();
    // Punta recta: con punta redonda los huecos se cierran y lo discontinuo se lee continuo.
    expect(m.querySelector("circle")?.getAttribute("stroke-linecap")).toBe(
      "butt",
    );
    expect(r.querySelector("circle")?.getAttribute("fill")).toBe(
      "currentColor",
    );
  });
});

describe("marco: rótulo, barra y pie", () => {
  it("las siete pestañas, la actual marcada, y el idioma lleva a la misma pantalla", () => {
    render(
      <Marco idioma="es" pagina="brecha">
        <p>contenido</p>
      </Marco>,
    );
    const nav = screen.getByRole("navigation", { name: "Secciones" });
    const pestanas = within(nav).getAllByRole("link");
    expect(pestanas.map((a) => a.getAttribute("href"))).toEqual([
      "/es",
      "/es/plan",
      "/es/agente",
      "/es/brecha",
      "/es/playground",
      "/es/caso",
      "/es/fichas",
    ]);
    expect(within(nav).getByRole("link", { current: "page" }).textContent).toBe(
      "Brecha",
    );
    expect(
      screen.getByRole("link", { name: "English" }).getAttribute("href"),
    ).toBe("/en/brecha");
    expect(
      screen
        .getByRole("link", { name: "Español" })
        .getAttribute("aria-current"),
    ).toBe("true");
    expect(screen.getByText("Simulación · no operativo")).toBeInTheDocument();
  });

  it("lo primero del teclado salta al contenido y el rótulo vive en una región con nombre (AU-S2-B24)", () => {
    const { container } = render(
      <Marco idioma="en" pagina="plan">
        <p>content</p>
      </Marco>,
    );
    const primero = container.querySelector<HTMLElement>(
      "a[href], button, input, [tabindex]:not([tabindex='-1'])",
    )!;
    expect(primero.getAttribute("href")).toBe("#contenido");
    expect(primero.textContent).toBe("Skip to content");
    expect(container.querySelector("main#contenido")).not.toBeNull();
    const region = screen.getByRole("region", { name: "Simulation notice" });
    expect(region.textContent).toContain("Simulation · not operational");
  });

  it("el pie dice lo sintético y quién decidiría en producción según el demo; la entrada, los dos", () => {
    const pie = (demo?: "demo-a" | "demo-b") => {
      const { container, unmount } = render(
        <Marco idioma="es" pagina="plan" demo={demo}>
          <p>contenido</p>
        </Marco>,
      );
      const t = container.querySelector("footer")!.textContent!;
      unmount();
      return t;
    };
    const a = pie("demo-a");
    const b = pie("demo-b");
    const ambos = pie();
    expect(a).toContain("un auditor médico con el caso completo");
    expect(a).not.toMatch(/solicitante|oficial de cumplimiento/);
    expect(b).toContain("un oficial de cumplimiento con el caso completo");
    expect(b).not.toMatch(/afiliado|médico|plan de beneficios/);
    expect(ambos).toContain(
      "un auditor médico en el A, un oficial de cumplimiento en el B",
    );
  });

  it("el conmutador de tema cambia el atributo y marca el botón pulsado", async () => {
    render(
      <Marco idioma="en" pagina="plan">
        <p>content</p>
      </Marco>,
    );
    const claro = screen.getByRole("button", { name: "Light" });
    expect(claro.getAttribute("aria-pressed")).toBe("false");
    await act(async () => fireEvent.click(claro));
    expect(html.dataset.theme).toBe("claro");
    expect(claro.getAttribute("aria-pressed")).toBe("true");
    expect(
      screen.getByRole("button", { name: "Dark" }).getAttribute("aria-pressed"),
    ).toBe("false");
  });
});

describe("P1 Entrada renderizada", () => {
  it("español: la tesis, los tres pasos, la capacidad y los dos demos", () => {
    render(<Entrada idioma="es" />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Planeé, construí y medí la brecha.",
    );
    for (const t of [
      "Planeé",
      "Construí",
      "Medí la brecha",
      "Los demos",
      "Cumple con alertas",
      "En construcción",
    ])
      expect(screen.getAllByText(t).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("list", { name: /el agente del sprint 3/ }),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("listitem")
        .some((li) => li.textContent === "guardia_salida"),
    ).toBe(true);
    expect(
      screen.getByRole("img", {
        name: "10 criterios: 9 cumplen, 1 incompleto (C5)",
      }),
    ).toBeInTheDocument();
    expect(
      screen
        .getByRole("link", { name: /Ver la brecha del demo A/ })
        .getAttribute("href"),
    ).toBe("/es/brecha");
  });

  it("inglés: sin español residual en lo que se lee", () => {
    const { container } = render(<Entrada idioma="en" />);
    const texto = container.textContent ?? "";
    expect(texto).toContain("I planned, I built, and I measured the gap.");
    for (const residuo of [
      " criterios",
      "Cómo",
      "Planeé",
      " casos",
      "Simulación",
      "riesgos",
      " de 9",
    ])
      expect(texto, residuo).not.toContain(residuo);
  });

  it("el aviso de perfil cambia a experto y lleva el foco al botón de volver", async () => {
    render(<Entrada idioma="es" />);
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Ver como experto" })),
    );
    expect(html.dataset.perfil).toBe("experto");
    expect(document.activeElement?.textContent).toBe("Volver a líder");
    expect(
      screen
        .getByRole("button", { name: "Experto" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Volver a líder" })),
    );
    expect(html.dataset.perfil).toBe("lider");
    expect(document.activeElement?.textContent).toBe("Ver como experto");
  });
});

/** La forma del árbol: etiquetas y atributos, sin los que describen el estado (aria-pressed). */
function forma(el: Element): string {
  const attrs = [...el.attributes]
    .filter((a) => a.name !== "aria-pressed")
    .map((a) => `${a.name}=${a.value}`)
    .sort()
    .join(",");
  return `<${el.tagName}${attrs}>${[...el.children].map(forma).join("")}</${el.tagName}>`;
}

describe("regla 5-a: la forma no depende del perfil ni del cliente", () => {
  it("el servidor pinta lo mismo sea cual sea el perfil del visitante", () => {
    html.setAttribute("data-perfil", "lider");
    const a = renderToStaticMarkup(<Entrada idioma="es" />);
    html.setAttribute("data-perfil", "experto");
    const b = renderToStaticMarkup(<Entrada idioma="es" />);
    expect(a).toBe(b);
    // Los dos perfiles viajan pintados; el atributo del <html> oculta uno.
    expect(a).toContain("solo-lider");
    expect(a).toContain("solo-experto");
    expect(a).toContain("Cómo se sostiene cada afirmación");
  });

  it("en el cliente, líder y experto tienen el mismo árbol (solo cambia aria-pressed)", () => {
    html.setAttribute("data-perfil", "lider");
    const a = render(<Entrada idioma="es" />);
    const formaLider = forma(a.container);
    a.unmount();
    html.setAttribute("data-perfil", "experto");
    const b = render(<Entrada idioma="es" />);
    expect(forma(b.container)).toBe(formaLider);
  });
});

describe("AU-S2-6 (S3): los dos demos tienen su fila real; lo que sigue del roadmap dice «en construcción» (regla dura 15)", () => {
  it.each(["es", "en"] as const)("en %s", (idioma) => {
    const { container } = render(
      <Demos filas={filas[idioma]} idioma={idioma} />,
    );
    // Una fila por demo, con su veredicto del informe y su corrida; ninguna en construcción.
    const filasDemo = [...container.querySelectorAll("[data-demo]")];
    expect(filasDemo.map((x) => (x as HTMLElement).dataset.demo)).toEqual([
      "demo-a",
      "demo-b",
    ]);
    for (const f of filasDemo) {
      expect(f.querySelector('[data-v="beta"]')).toBeNull();
      expect(f.textContent).toContain("real · sprint");
    }
    const b = filasDemo[1]!;
    expect(
      [...b.querySelectorAll("a")].map((a) => a.getAttribute("href")),
    ).toEqual([
      `/${idioma}/demo-b/brecha`,
      `/${idioma}/demo-b/plan`,
      `/${idioma}/demo-b/agente`,
      `/${idioma}/demo-b/playground`,
      `/${idioma}/demo-b/caso`,
    ]);
    // El entrevistador ya corrió (propuso el plan B): sale del roadmap. Quedan tres, en construcción.
    const ids = [...container.querySelectorAll("[data-roadmap]")].map(
      (x) => (x as HTMLElement).dataset.roadmap,
    );
    expect(ids).toEqual([
      "comparar-dos-corridas",
      "calibracion-conformal",
      "recorrido-animado-de-un-caso",
    ]);
    for (const li of container.querySelectorAll("[data-roadmap]"))
      expect(li.querySelector('[data-v="beta"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-v="beta"]')).toHaveLength(3);
  });
});
