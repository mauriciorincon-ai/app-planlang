// @vitest-environment node
/**
 * El relato del caso B cuenta los documentos que ese caso trae (S10, deuda B3 del S9): tres, y cuatro en una persona
 * jurídica (el certificado de existencia). Antes decía «tres» siempre.
 */
import { describe, expect, it } from "vitest";
import { tb } from "@core/formatos/bilingue";
import { RELATO_B } from "@/textos/demo-b/caso";

const producto = tb("una cuenta", "an account");
const dice = (fondos: boolean, existencia: boolean) =>
  RELATO_B.pidio({ producto, fondos, existencia });

describe("RELATO_B.pidio", () => {
  it("una persona natural entrega tres documentos", () => {
    expect(dice(true, false).es).toContain("sus tres documentos");
    expect(dice(true, false).en).toContain("all three documents");
    expect(dice(false, false).es).toContain("dos de los tres documentos");
    expect(dice(false, false).en).toContain("two of the three documents");
  });
  it("una persona jurídica entrega cuatro, y sin fondos entrega tres de los cuatro", () => {
    expect(dice(true, true).es).toContain("sus cuatro documentos");
    expect(dice(true, true).en).toContain("all four documents");
    expect(dice(false, true).es).toContain("tres de los cuatro documentos");
    expect(dice(false, true).en).toContain("three of the four documents");
  });
});
