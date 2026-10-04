/**
 * Plan v1.5 del A: aprobar en parte es una determinación adversa que sale sola con el modo Texas apagado (D2). El
 * playground solo la cuenta como «error introducido» si sale sin persona con el modo Texas encendido; sin la
 * declaración `parcial` del demo, toda propuesta distinta de la favorable sigue siendo adversa (como en el S2).
 */
import { describe, expect, it } from "vitest";
import type { Compacto } from "@core/playground/compacto";
import { propuestaAdversa } from "@core/playground/consecuencias";

// Solo lo que la función lee del compacto.
const base = {
  propuesta: { senal: "propuesta", favorable: "aprobar" },
  ligaduras: { modo_texas: "U4" },
} as unknown as Compacto;
const conParcial = {
  ...base,
  propuesta: {
    ...base.propuesta,
    parcial: {
      valor: "aprobar_parcial",
      senal_que_exige_persona: "modo_texas",
    },
  },
} as unknown as Compacto;
const senales = (propuesta: string) => ({ propuesta, modo_texas: false });

describe("propuesta adversa en el playground", () => {
  it("la favorable nunca; negar siempre", () => {
    expect(propuestaAdversa(conParcial, senales("aprobar"), { U4: true })).toBe(
      false,
    );
    expect(propuestaAdversa(conParcial, senales("negar"), { U4: false })).toBe(
      true,
    );
  });

  it("aprobar en parte es adversa solo con el modo Texas jugado encendido (la ligadura manda sobre lo registrado)", () => {
    expect(
      propuestaAdversa(conParcial, senales("aprobar_parcial"), { U4: false }),
    ).toBe(false);
    expect(
      propuestaAdversa(conParcial, senales("aprobar_parcial"), { U4: true }),
    ).toBe(true);
  });

  it("sin la declaración del demo, toda propuesta no favorable es adversa", () => {
    expect(
      propuestaAdversa(base, senales("aprobar_parcial"), { U4: false }),
    ).toBe(true);
    expect(propuestaAdversa(base, {}, { U4: false })).toBe(false);
  });
});
