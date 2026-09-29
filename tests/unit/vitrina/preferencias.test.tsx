/**
 * Preferencias de lectura (ADR-008): el script previo del `<head>` fija tema y perfil antes de pintar, el de
 * `/` elige idioma, y los conmutadores cambian el atributo sin cambiar la forma del árbol.
 */
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fijarPreferencia, usePreferencia } from "@/lib/preferencias/cliente";
import { CUERPO_SCRIPT_IDIOMA } from "@/lib/preferencias/script-idioma";
import { SCRIPT_PREVIO } from "@/lib/preferencias/script-previo";

const html = document.documentElement;

function limpiar() {
  for (const a of ["data-theme", "data-perfil", "data-idioma"])
    html.removeAttribute(a);
  html.className = "";
  localStorage.clear();
  window.history.replaceState(null, "", "/");
}

function claroDelSistema(claro: boolean) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: claro && q.includes("light"),
    media: q,
  })) as unknown as typeof window.matchMedia;
}

const correr = () => new Function(SCRIPT_PREVIO)();

describe("script previo: tema y perfil antes de pintar", () => {
  beforeEach(() => {
    limpiar();
    claroDelSistema(false);
  });
  afterEach(limpiar);

  it("sin nada guardado: tema del sistema (oscuro) y perfil líder", () => {
    correr();
    expect(html.dataset.theme).toBe("oscuro");
    expect(html.dataset.perfil).toBe("lider");
  });

  it("el sistema en claro da tema claro", () => {
    claroDelSistema(true);
    correr();
    expect(html.dataset.theme).toBe("claro");
  });

  it("lo guardado gana al sistema", () => {
    claroDelSistema(true);
    localStorage.setItem("planlang.tema", "oscuro");
    localStorage.setItem("planlang.perfil", "experto");
    correr();
    expect(html.dataset.theme).toBe("oscuro");
    expect(html.dataset.perfil).toBe("experto");
  });

  it("la URL gana a lo guardado y se recuerda", () => {
    localStorage.setItem("planlang.tema", "oscuro");
    window.history.replaceState(null, "", "/es?tema=claro&perfil=experto");
    correr();
    expect(html.dataset.theme).toBe("claro");
    expect(html.dataset.perfil).toBe("experto");
    expect(localStorage.getItem("planlang.tema")).toBe("claro");
    expect(localStorage.getItem("planlang.perfil")).toBe("experto");
  });

  it("valores desconocidos en la URL o guardados se ignoran", () => {
    localStorage.setItem("planlang.perfil", "jefe");
    window.history.replaceState(null, "", "/es?tema=rosa");
    correr();
    expect(html.dataset.theme).toBe("oscuro");
    expect(html.dataset.perfil).toBe("lider");
  });

  it("recuerda el idioma solo en las páginas de un idioma", () => {
    correr();
    expect(localStorage.getItem("planlang.idioma")).toBeNull();
    html.setAttribute("data-idioma", "en");
    correr();
    expect(localStorage.getItem("planlang.idioma")).toBe("en");
  });

  it("con el almacenamiento bloqueado pinta los valores por defecto sin lanzar", () => {
    const get = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("bloqueado");
      });
    const set = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("bloqueado");
      });
    window.history.replaceState(null, "", "/es?perfil=experto");
    expect(correr).not.toThrow();
    expect(html.dataset.theme).toBe("oscuro");
    expect(html.dataset.perfil).toBe("experto");
    get.mockRestore();
    set.mockRestore();
  });
});

describe("script de `/`: elige idioma", () => {
  const ir = (
    search: string,
    guardado: string | null,
    idiomas: string[],
    lanza = false,
  ) => {
    const location = { search, replace: vi.fn() };
    const almacen = {
      getItem: () => {
        if (lanza) throw new Error("bloqueado");
        return guardado;
      },
    };
    new Function("location", "localStorage", "navigator", CUERPO_SCRIPT_IDIOMA)(
      location,
      almacen,
      {
        languages: idiomas,
        language: idiomas[0],
      },
    );
    return location.replace.mock.calls.map((c) => c[0]);
  };

  it("lleva al último idioma usado", () => {
    expect(ir("", "en", ["es-CO"])).toEqual(["/en"]);
  });
  it("sin memoria, el primero del navegador que sea español o inglés", () => {
    expect(ir("", null, ["fr-FR", "en-US", "es"])).toEqual(["/en"]);
    expect(ir("", null, ["es-CO", "en"])).toEqual(["/es"]);
  });
  it("sin ninguno de los dos, español", () => {
    expect(ir("", null, ["fr-FR", "de"])).toEqual(["/es"]);
    expect(ir("", null, [])).toEqual(["/es"]);
  });
  it("con ?elegir no lleva a ninguna parte", () => {
    expect(ir("?elegir", "en", ["en"])).toEqual([]);
    expect(ir("?x=1&elegir=1", "en", ["en"])).toEqual([]);
  });
  it("con el almacenamiento bloqueado usa el navegador", () => {
    expect(ir("", null, ["en-GB"], true)).toEqual(["/en"]);
  });
});

function Lector() {
  const tema = usePreferencia("tema");
  const perfil = usePreferencia("perfil");
  return <p data-testid="lector">{`${tema}|${perfil}`}</p>;
}

describe("conmutadores: fijarPreferencia y usePreferencia", () => {
  beforeEach(limpiar);
  afterEach(() => {
    vi.useRealTimers();
    limpiar();
  });

  it("fija el atributo, lo recuerda y el lector se entera", async () => {
    render(<Lector />);
    expect(screen.getByTestId("lector").textContent).toBe("null|null");
    await act(async () => fijarPreferencia("tema", "claro"));
    await act(async () => fijarPreferencia("perfil", "experto"));
    expect(html.dataset.theme).toBe("claro");
    expect(localStorage.getItem("planlang.perfil")).toBe("experto");
    expect(screen.getByTestId("lector").textContent).toBe("claro|experto");
  });

  it("el cambio de perfil marca `perfil-cambio` un momento (el fundido); repetir el mismo no", () => {
    vi.useFakeTimers();
    fijarPreferencia("perfil", "experto");
    expect(html.classList.contains("perfil-cambio")).toBe(true);
    vi.advanceTimersByTime(700);
    expect(html.classList.contains("perfil-cambio")).toBe(false);
    fijarPreferencia("perfil", "experto");
    expect(html.classList.contains("perfil-cambio")).toBe(false);
  });

  it("con el almacenamiento bloqueado la preferencia dura lo que la página", () => {
    const set = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("bloqueado");
      });
    expect(() => fijarPreferencia("tema", "claro")).not.toThrow();
    expect(html.dataset.theme).toBe("claro");
    set.mockRestore();
  });
});
