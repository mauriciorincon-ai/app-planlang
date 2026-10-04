// @vitest-environment node
/**
 * El mapa que la vitrina dibuja (el del demo A y el del spike) pasa la fase 1 del contrato del diagramador 0.5.0 en
 * el build: el esquema JSON fijado (`packages/diagramador/contrato/esquema/mapa.schema.json`, Ajv 2020). Antes del
 * S3 solo lo pasaba el mapa de las pruebas; el que se publicaba no se validaba contra el esquema.
 */
import { describe, expect, it } from "vitest";
import { datosDemo } from "@/lib/datos/vitrina";
import { vistaAgente } from "@/lib/vista/agente";
import { erroresDeEsquema } from "@/lib/vista/visor";
import { mapaDemo } from "../core/visor/_demo";

describe("el mapa publicado pasa el esquema del contrato 0.5.0 (fase 1, en el build)", () => {
  it("el del demo A y el del spike se dibujan: los dos pasan el esquema y las reglas", async () => {
    const d = await datosDemo();
    const v = vistaAgente(d, "es");
    expect(v.lienzo.svg).toContain("<svg");
    expect(v.spike?.lienzo.svg).toContain("<svg");
  }, 60_000);

  it("el esquema nombra lo que falla: fecha sin formato, versión no semver, una condición con dos formas", () => {
    expect(erroresDeEsquema(mapaDemo())).toEqual([]);
    const m = structuredClone(mapaDemo()) as unknown as Record<string, unknown>;
    m.fecha_actualizacion = "04/10/2026";
    m.version = "1.4";
    const flujos = m.flujos as Array<Record<string, unknown>>;
    flujos[0]!.condicion = { por_defecto: true, senal: "x" };
    const e = erroresDeEsquema(m).join("\n");
    expect(e).toMatch(/\/fecha_actualizacion/);
    expect(e).toMatch(/\/version/);
    expect(e).toMatch(/\/flujos\/0\/condicion/);
  });

  it("rojo en el build si el mapa del spike no pasa el esquema (fecha sin formato)", async () => {
    const d = await datosDemo();
    const otro = {
      ...d,
      plan: structuredClone(d.plan),
      spike: structuredClone(d.spike),
    };
    otro.plan.huella = "otra-huella-para-no-usar-el-dibujo-en-memoria-esquema";
    otro.spike!.fecha = "04/10/2026";
    expect(() => vistaAgente(otro, "es")).toThrow(
      /el mapa no pasa el esquema del contrato \(fase 1\): \/fecha_actualizacion/,
    );
  }, 60_000);
});
