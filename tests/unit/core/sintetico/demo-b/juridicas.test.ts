/**
 * El lote de personas jurídicas del demo B (S9): 8 jurídicas, una por plantilla, y 12 naturales; cada borde del 25 %
 * queda donde la plantilla dice; la verdad de los beneficiarios es la del cálculo; los documentos van en los dos
 * idiomas; y el generador exige el plan B v1.2, que es el que declara la arista de los beneficiarios.
 */
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import type { Plan } from "../../../../../core/plan";
import { beneficiariosDe } from "../../../../../core/sintetico/demo-b/beneficiarios";
import {
  ListasSchema,
  SUBTIPOS_JURIDICOS_B,
  type CasoB,
  type LoteB,
} from "../../../../../core/sintetico/demo-b/esquema";
import {
  esJuridico,
  generarLoteJuridicoB,
  PLANTILLAS,
} from "../../../../../core/sintetico/demo-b/juridicas";
import { generarLoteB } from "../../../../../core/sintetico/demo-b/generador";
import { validarIdentificadores } from "../../../../../core/sintetico/validador-identificadores";

const leer = <T>(ruta: string): T =>
  JSON.parse(readFileSync(ruta, "utf8")) as T;
const plan = leer<Plan>("plans/demo-b/v1.2.json");
const planV1 = leer<Plan>("plans/demo-b/v1.json");
const listas = ListasSchema.parse(leer("data/listas/demo-b.json"));

let lote: LoteB;
beforeAll(async () => {
  lote = await generarLoteJuridicoB({
    plan,
    listas,
    semilla: "planlang-b-002",
    n: 20,
  });
});

const juridicos = () =>
  lote.casos.filter((c) => c.verdad_conocida.tipo_solicitante === "juridica");
const delSubtipo = (s: string): CasoB =>
  lote.casos.find((c) => c.subtipo === s)!;
const efectiva = (c: CasoB, doc: string) =>
  beneficiariosDe(c.verdad_conocida.estructura!).participaciones.find(
    (x) => x.documento === doc,
  )!.porcentaje;
const persona = (c: CasoB, n: number) =>
  c.verdad_conocida.estructura!.personas[n - 1]!.documento;

describe("lote de personas jurídicas", () => {
  it("trae 8 jurídicas, una por plantilla, y 12 naturales, con ids seguidos y la receta declarada", () => {
    expect(lote.receta).toBe("juridicas");
    expect(lote.version_generador).toBe("1.1.0");
    expect(lote.casos.map((c) => c.id)).toEqual(
      Array.from(
        { length: 20 },
        (_, i) => `B-${String(i + 1).padStart(3, "0")}`,
      ),
    );
    expect(
      juridicos()
        .map((c) => c.subtipo)
        .sort(),
    ).toEqual([...SUBTIPOS_JURIDICOS_B].sort());
    expect(lote.casos.filter((c) => !esJuridico(c.subtipo))).toHaveLength(12);
  });

  it("la verdad de los beneficiarios es la del cálculo, y cada estructura es válida", () => {
    for (const c of juridicos()) {
      const r = beneficiariosDe(c.verdad_conocida.estructura!);
      expect(r.valida, c.id).toBe(true);
      expect(c.verdad_conocida.beneficiarios, c.id).toEqual(r.beneficiarios);
      expect(c.entrada.solicitud.tipo_solicitante).toBe("juridica");
    }
  });

  it("cada borde queda donde su plantilla dice", () => {
    const cruza = delSubtipo("borde_juridica_indirecta_cruza_25");
    expect(efectiva(cruza, persona(cruza, 1))).toBe("30.00");
    const bajo = delSubtipo("borde_juridica_indirecta_bajo_25");
    expect(efectiva(bajo, persona(bajo, 1))).toBe("24.99");
    expect(bajo.verdad_conocida.beneficiarios).not.toContain(persona(bajo, 1));
    const exacta = delSubtipo("borde_juridica_exacta_25");
    expect(efectiva(exacta, persona(exacta, 1))).toBe("25.00");
    expect(exacta.verdad_conocida.beneficiarios).toContain(persona(exacta, 1));
    const dos = delSubtipo("borde_juridica_dos_caminos");
    expect(efectiva(dos, persona(dos, 1))).toBe("26.00");
    const cadena = delSubtipo("normal_juridica_cadena_profunda");
    expect(efectiva(cadena, persona(cadena, 1))).toBe("36.00");
    const control = delSubtipo("normal_juridica_control_no_dueno");
    expect(control.verdad_conocida.beneficiarios).toEqual([
      persona(control, 6),
    ]);
  });

  it("el dueño homónimo de la lista vinculante escala al oficial, que aprueba", () => {
    const c = delSubtipo("adversario_juridica_beneficiario_homonimo");
    const homonimo = c.verdad_conocida.estructura!.personas[0]!.nombre;
    const vinculantes = listas.listas
      .filter((l) => l.vinculante)
      .flatMap((l) => l.entradas.map((e) => e.nombre));
    expect(vinculantes).toContain(homonimo);
    expect(c.verdad_conocida).toMatchObject({
      decision: "aprobar",
      debe_escalar: true,
      motivos_escalamiento: ["coincidencia_en_lista"],
    });
    expect(c.adversario_detalle).toBe("homonimo");
    expect(c.adversario?.vector).toBe("existencia");
    // Los demás no escalan: la única pausa del lote jurídico es la del dueño homónimo.
    for (const otro of juridicos().filter((x) => x.id !== c.id))
      expect(otro.verdad_conocida.debe_escalar, otro.subtipo).toBe(false);
  });

  it("el certificado de existencia trae cada participación y quien controla, en los dos idiomas", () => {
    for (const c of juridicos()) {
      const doc = c.entrada.documentos.existencia!;
      for (const x of c.verdad_conocida.estructura!.participaciones) {
        expect(doc.es).toContain(x.titular);
        expect(doc.en).toContain(x.titular);
      }
      expect(doc.es).toContain("Persona que controla la sociedad");
      expect(doc.en).toContain("Person in control of the company");
      expect(doc.es).toMatch(/\d+,\d{2} %/);
      expect(doc.en).toMatch(/\d+\.\d{2}%/);
    }
  });

  it("los porcentajes de cada plantilla suman como mucho el 100 % por sociedad", () => {
    for (const [s, pl] of Object.entries(PLANTILLAS)) {
      const suma = new Map<string, number>();
      for (const [, participada, p] of pl.participaciones)
        suma.set(
          participada,
          (suma.get(participada) ?? 0) + Math.round(Number(p) * 100),
        );
      for (const [participada, total] of suma)
        expect(total, `${s} ${participada}`).toBeLessThanOrEqual(10000);
    }
  });

  it("no lleva ningún identificador real (E-11)", () => {
    expect(validarIdentificadores(lote)).toEqual([]);
  });

  it("exige 20 casos y el plan con la arista de los beneficiarios; la receta estándar no la acepta", async () => {
    await expect(
      generarLoteJuridicoB({ plan, listas, semilla: "x", n: 19 }),
    ).rejects.toThrow(/20 casos/);
    await expect(
      generarLoteJuridicoB({ plan: planV1, listas, semilla: "x", n: 20 }),
    ).rejects.toThrow(/similitud_beneficiarios_max/);
    await expect(
      generarLoteB({ plan, listas, semilla: "x", n: 20, receta: "juridicas" }),
    ).rejects.toThrow(/generarLoteJuridicoB/);
  });
});
