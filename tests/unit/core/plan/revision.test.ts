/**
 * Revisión de un borrador con huecos (M2): lo que M1 rechaza, lo que bloquea la aprobación aunque M1 lo deje pasar
 * (una señal no declarada, M-23), lo pendiente y el documento ES/EN cuando faltan secciones.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  impideAprobar,
  MARCA_PENDIENTE,
  pendientesDe,
  revisarBorrador,
  textoDeRevision,
  TranscripcionSchema,
  type Transcripcion,
} from "../../../../core/plan";

const DIR = "tests/contrato/entrevista-demo-b";
const base = () => JSON.parse(readFileSync(`${DIR}/v0-borrador.json`, "utf8"));
const transcripcion = (): Transcripcion =>
  TranscripcionSchema.parse(
    JSON.parse(readFileSync(`${DIR}/transcripcion.json`, "utf8")),
  );

function conHuecos() {
  const b = base();
  delete b.contrato_de_grafo;
  delete b.lotes;
  b.problema = { es: "Algo.", en: MARCA_PENDIENTE };
  b.riesgos[0].detector_en_trazas = null;
  b.riesgos[0].no_detectable_en_trazas = {
    es: "No se ve.",
    en: "Not visible.",
  };
  b.decisiones[0].estado = "abierta";
  delete b.decisiones[0].opcion_elegida;
  delete b.decisiones[0].justificacion;
  b.umbrales[0].valor_en_plan = null;
  b.umbrales[1].rango_jugable = { tipo: "booleano" };
  return b;
}

describe("revisión de un borrador", () => {
  it("M1 rechaza lo incompleto y lo pendiente impide aprobar aunque se acepten las contradicciones", () => {
    const t = transcripcion();
    t.preguntas[11]!.estado = "pendiente";
    const r = revisarBorrador(conHuecos(), t);
    expect(r.m1.ok).toBe(false);
    expect(r.m1.motivos.map((m) => m.elemento)).toEqual(
      expect.arrayContaining([
        "contrato_de_grafo",
        "lotes",
        "umbrales.0.valor_en_plan",
      ]),
    );
    expect(r.pendientes).toEqual([{ id: "P12", seccion: "umbrales" }]);
    expect(impideAprobar(r, true)).toBe(true);
    expect(pendientesDe(t)).toHaveLength(1);
  });

  it("con M1 conforme, una sola pregunta pendiente basta para impedir la aprobación", () => {
    const t = transcripcion();
    t.preguntas[13]!.estado = "pendiente";
    const r = revisarBorrador(base(), t);
    expect(r.m1.ok).toBe(true);
    expect(r.contradicciones.map((c) => c.codigo)).toEqual([
      "SEVERIDAD_SIN_CRITERIO",
      "PENDIENTE",
    ]);
    expect(impideAprobar(r, true)).toBe(true);
  });

  it("una señal que nadie declara bloquea la aprobación aunque M1 solo la advierta (M-23)", () => {
    const b = base();
    b.criterios_aceptacion[4].regla_de_medicion.condicion =
      "senal_inventada == true";
    const r = revisarBorrador(b, transcripcion());
    expect(r.m1.ok).toBe(false);
    expect(r.m1.motivos.map((m) => m.codigo)).toEqual(["SENAL_NO_DECLARADA"]);
    expect(
      r.m1.advertencias.every((m) => m.codigo !== "SENAL_NO_DECLARADA"),
    ).toBe(true);
  });

  it("el documento con huecos marca lo pendiente en cada idioma y no se rompe sin contrato ni lotes", () => {
    const t = transcripcion();
    t.senales_derivadas = [];
    for (const p of t.preguntas) for (const x of p.turnos) delete x.redaccion;
    const b = conHuecos();
    const r = revisarBorrador(b, t);
    const es = textoDeRevision(b, r, "es");
    const en = textoDeRevision(b, r, "en");
    expect(es).toContain("M1 todavía no lo acepta");
    expect(en).toContain("M1 does not accept it yet");
    expect(es).toContain("_pendiente_");
    expect(en).toContain("_pending_");
    expect(es).toContain("No se ve.");
    expect(es).toContain("_abierta_");
    expect(es).toContain("booleano");
    expect(es).not.toContain(MARCA_PENDIENTE);
    // Vacías: lo redactado por el entrevistador, las señales derivadas y, desde AU-S3-01/13, las advertencias de M1
    // y lo que el código restauró.
    expect(es.match(/^Ninguna\.$/gm)?.length).toBe(4);
    expect(en.match(/^None\.$/gm)?.length).toBe(4);
    for (const [texto, vacio] of [
      [es, "Ninguna."],
      [en, "None."],
    ] as const)
      expect(
        texto
          .split(/^## /m)
          .filter((x) => x.trimEnd().endsWith(`\n\n${vacio}`))
          .map((x) => x.split("\n")[0]),
      ).toHaveLength(4);
    // Sin borrador legible el documento igual sale.
    expect(textoDeRevision(null, r, "es")).toContain("### Problema");
  });

  it("el contrato con una arista de función y sin ramas por defecto se escribe entero", () => {
    const b = base();
    b.contrato_de_grafo.aristas_condicionales.push({
      desde: "decision",
      orden: 7,
      funcion: { nombre: "f", entradas: ["a", "b"] },
      si_verdadero: "pausa_humana",
    });
    delete b.contrato_de_grafo.ramas_por_defecto;
    b.criterios_aceptacion[0].regla_de_medicion = {
      poblacion: "todos",
      metrica: "m",
      agregacion: "mediana",
    };
    const r = revisarBorrador(b, transcripcion());
    const en = textoDeRevision(b, r, "en");
    expect(en).toContain("`decision` #7: `f(a, b)` → `pausa_humana`");
    expect(en).not.toContain("by default");
    expect(en).toContain("`todos` → `m` (mediana)");
  });
});
