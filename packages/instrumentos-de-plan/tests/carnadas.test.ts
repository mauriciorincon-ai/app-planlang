/**
 * Carnadas C01–C06 y C03-bis del contrato v0.2.0 (C03/C03-bis nacieron como enmienda del S1 de planlang;
 * C06 y las opciones «sin argumentos» llegan con la v0.2.0).
 * Cada carnada vive como DATO en `../carnadas/`; este test la carga y compara con lo esperado.
 */
import { describe, expect, it } from "vitest";
import C01 from "../carnadas/C01-ciclo.json";
import C02 from "../carnadas/C02-una-via-primero.json";
import C03bis from "../carnadas/C03-bis-rpn-no-discrimina.json";
import C03 from "../carnadas/C03-severidad-primero.json";
import C04 from "../carnadas/C04-alta-sin-mitigacion.json";
import C05 from "../carnadas/C05-supuesto-sin-prueba.json";
import C06 from "../carnadas/C06-control-legal.json";
import {
  evaluarModosDeFalla,
  informeDeInstrumentos,
  ordenarDecisiones,
  prioridadDeAccion,
  prioridades,
  rpn,
  supuestosInvalidos,
  TABLA_AIAG_VDA,
  textoVacio,
  type DecisionMinima,
  type ModoDeFallaMinimo,
  type SupuestoMinimo,
} from "../src";

describe("carnadas del contrato instrumentos-de-plan v0.2.0", () => {
  it("C01 — un ciclo rechaza la carga y muestra el ciclo completo", () => {
    const r = ordenarDecisiones(C01.decisiones as DecisionMinima[]);
    expect(r).toEqual({
      ok: false,
      motivo: "ciclo",
      ciclo: C01.esperado.ciclo,
    });
    const informe = informeDeInstrumentos({
      decisiones: C01.decisiones as DecisionMinima[],
      modos_de_falla: [],
      supuestos: [],
    });
    expect(informe.ok).toBe(false);
    expect(informe.ciclo).toEqual(["A", "B", "A"]);
    expect(informe.bloqueantes[0]?.mensaje.es).toContain("A → B → A");
  });

  it("C02 — la decisión de una vía va en la onda 1 y el informe la destaca", () => {
    const r = ordenarDecisiones(C02.decisiones as DecisionMinima[]);
    expect(r).toEqual({
      ok: true,
      ondas: C02.esperado.ondas,
      una_via: C02.esperado.una_via,
    });
  });

  it("C03 — S8·O6·D2 es prioridad alta con RPN 96", () => {
    const m = C03.modo as ModoDeFallaMinimo;
    expect(prioridadDeAccion(m.severidad, m.ocurrencia, m.deteccion)).toBe(
      C03.esperado.prioridad_de_accion,
    );
    expect(rpn(m)).toBe(96);
  });

  it("C03-bis — S8·O3·D4 tiene el mismo RPN 96 y prioridad baja: el RPN no discrimina", () => {
    const m = C03bis.modo as ModoDeFallaMinimo;
    expect(prioridadDeAccion(m.severidad, m.ocurrencia, m.deteccion)).toBe(
      C03bis.esperado.prioridad_de_accion,
    );
    expect(rpn(m)).toBe(96);
  });

  it("C04 — prioridad alta sin mitigación bloquea y el informe nombra el modo", () => {
    const informe = informeDeInstrumentos({
      decisiones: [],
      modos_de_falla: C04.modos as ModoDeFallaMinimo[],
      supuestos: [],
    });
    expect(informe.ok).toBe(false);
    expect(informe.bloqueantes.map((b) => b.ids[0])).toEqual(
      C04.esperado.bloqueantes,
    );
    expect(informe.bloqueantes[0]?.mensaje.en).toContain("R9");
    expect(informe.modos[0]).toEqual({
      id: "R9",
      prioridad_de_accion: "alta",
      prioridad_de_tabla: "alta",
      control_legal: false,
      rpn: 180,
      bloqueante: true,
    });
  });

  it("C06 — control legal: prioridad efectiva alta con la de tabla visible, y sin mitigación el plan no se aprueba", () => {
    const m = C06.modo as ModoDeFallaMinimo;
    expect(prioridades(m)).toEqual({
      prioridad_de_accion: C06.esperado.prioridad_de_accion,
      prioridad_de_tabla: C06.esperado.prioridad_de_tabla,
      control_legal: C06.esperado.control_legal,
    });
    const informe = informeDeInstrumentos({
      decisiones: [],
      modos_de_falla: [m],
      supuestos: [],
    });
    expect(informe.ok).toBe(C06.esperado.ok);
    expect(informe.bloqueantes.map((b) => b.ids[0])).toEqual(
      C06.esperado.bloqueantes,
    );
    expect(informe.bloqueantes[0]?.mensaje.es).toContain("obligación legal");
    expect(informe.bloqueantes[0]?.mensaje.en).toContain("table: low");
    // Con una mitigación deja de bloquear, pero la prioridad efectiva sigue alta.
    const mitigado = informeDeInstrumentos({
      decisiones: [],
      modos_de_falla: [{ ...m, mitigaciones: [{}] }],
      supuestos: [],
    });
    expect(mitigado.ok).toBe(true);
    expect(mitigado.modos[0]?.prioridad_de_accion).toBe("alta");
  });

  it("F-002 — opciones sin pros ni contras: la carga es válida y el informe las señala", () => {
    const informe = informeDeInstrumentos({
      decisiones: [
        {
          id: "D1",
          reversibilidad: "dos_vias",
          opciones: [
            { nombre: "A", pros: ["rápido"] },
            { nombre: { es: "B", en: "B" } },
            { nombre: "C", pros: [], contras: { es: " ", en: "" } },
          ],
        },
      ],
      modos_de_falla: [],
      supuestos: [],
    });
    expect(informe.ok).toBe(true);
    expect(informe.opciones_sin_argumentos).toEqual([
      { decision: "D1", indice: 2, nombre: { es: "B", en: "B" } },
      { decision: "D1", indice: 3, nombre: "C" },
    ]);
  });

  it("C05 — supuesto de criticidad alta sin prueba barata (en cualquier idioma) se rechaza", () => {
    expect(supuestosInvalidos(C05.supuestos as SupuestoMinimo[])).toEqual(
      C05.esperado.invalidos,
    );
    const informe = informeDeInstrumentos({
      decisiones: [],
      modos_de_falla: [],
      supuestos: C05.supuestos as SupuestoMinimo[],
    });
    expect(informe.bloqueantes.map((b) => b.tipo)).toEqual([
      "supuesto_critico_sin_prueba",
      "supuesto_critico_sin_prueba",
    ]);
    expect(textoVacio(undefined)).toBe(true);
    expect(textoVacio({ es: "a", en: "b" })).toBe(false);
  });
});

describe("tabla de prioridad de acción y determinismo", () => {
  it("severidad manda, pero no sola: S10 con O2·D2 es baja y con O4·D2 alta; S2 con O10·D10 es solo media", () => {
    expect(prioridadDeAccion(10, 2, 2)).toBe("baja"); // O 2-3 · D 2-4 bajo S 9-10 → baja en la tabla
    expect(prioridadDeAccion(10, 4, 2)).toBe("alta");
    expect(prioridadDeAccion(2, 10, 10)).toBe("media");
    expect(prioridadDeAccion(1, 10, 10)).toBe("baja");
    expect(prioridadDeAccion(5, 9, 2)).toBe("media");
  });

  it("la tabla en datos cubre las 5×5×4 bandas y declara su fuente", () => {
    const t = TABLA_AIAG_VDA;
    expect(Object.keys(t.tabla)).toHaveLength(5);
    for (const fila of Object.values(t.tabla)) {
      expect(Object.keys(fila)).toHaveLength(5);
      for (const celda of Object.values(fila))
        expect(Object.keys(celda)).toHaveLength(4);
    }
    expect((t as unknown as { fuente: string }).fuente).toContain("AIAG");
  });

  it("valores fuera de escala son error, no una prioridad silenciosa", () => {
    expect(() => prioridadDeAccion(0, 5, 5)).toThrow(RangeError);
    expect(() => prioridadDeAccion(5, 11, 5)).toThrow(RangeError);
    expect(() => prioridadDeAccion(5, 5, 2.5)).toThrow(RangeError);
    expect(() =>
      prioridadDeAccion(5, 5, 5, { bandas: TABLA_AIAG_VDA.bandas, tabla: {} }),
    ).toThrow(/sin entrada/);
    expect(() =>
      prioridadDeAccion(5, 5, 5, {
        bandas: { ...TABLA_AIAG_VDA.bandas, deteccion: {} },
        tabla: {},
      }),
    ).toThrow(/sin banda/);
  });

  it("los modos salen ordenados por prioridad, luego RPN descendente, luego id", () => {
    const modos: ModoDeFallaMinimo[] = [
      { id: "b", severidad: 3, ocurrencia: 2, deteccion: 2, mitigaciones: [] },
      { id: "a", severidad: 3, ocurrencia: 2, deteccion: 2, mitigaciones: [] },
      {
        id: "c",
        severidad: 9,
        ocurrencia: 9,
        deteccion: 9,
        mitigaciones: [{}],
      },
      {
        id: "d",
        severidad: 8,
        ocurrencia: 6,
        deteccion: 2,
        mitigaciones: [{}],
      },
    ];
    expect(evaluarModosDeFalla(modos).map((m) => m.id)).toEqual([
      "c",
      "d",
      "a",
      "b",
    ]);
    expect(evaluarModosDeFalla(modos).every((m) => !m.bloqueante)).toBe(true);
  });

  it("una dependencia desconocida se reporta con la decisión y la dependencia", () => {
    const r = ordenarDecisiones([
      { id: "A", reversibilidad: "costosa", depende_de: ["Z"] },
    ]);
    expect(r).toEqual({
      ok: false,
      motivo: "dependencia_desconocida",
      decision: "A",
      dependencia: "Z",
    });
    const informe = informeDeInstrumentos({
      decisiones: [{ id: "A", reversibilidad: "costosa", depende_de: ["Z"] }],
      modos_de_falla: [],
      supuestos: [],
    });
    expect(informe.bloqueantes[0]?.tipo).toBe("dependencia_desconocida");
  });

  it("G1: el informe es idéntico byte a byte en dos corridas", () => {
    const entrada = {
      decisiones: [
        { id: "D3", reversibilidad: "dos_vias", depende_de: ["D2"] },
        { id: "D2", reversibilidad: "una_via", depende_de: ["D1"] },
        { id: "D1", reversibilidad: "costosa" },
      ] as DecisionMinima[],
      modos_de_falla: [
        {
          id: "R1",
          severidad: 9,
          ocurrencia: 3,
          deteccion: 3,
          mitigaciones: [{}],
        },
      ],
      supuestos: [
        { id: "S1", criticidad: "media", prueba_barata: "" },
      ] as SupuestoMinimo[],
    };
    const a = JSON.stringify(informeDeInstrumentos(entrada));
    const b = JSON.stringify(informeDeInstrumentos(entrada));
    expect(a).toBe(b);
    expect(informeDeInstrumentos(entrada)).toMatchObject({
      ok: true,
      ondas: [["D1"], ["D2"], ["D3"]],
      una_via: ["D2"],
    });
  });

  it("un ciclo que no arranca en el primer id se muestra igual", () => {
    const r = ordenarDecisiones([
      { id: "A", reversibilidad: "dos_vias", depende_de: [] },
      { id: "B", reversibilidad: "dos_vias", depende_de: ["C"] },
      { id: "C", reversibilidad: "dos_vias", depende_de: ["D"] },
      { id: "D", reversibilidad: "dos_vias", depende_de: ["B"] },
    ]);
    expect(r).toEqual({
      ok: false,
      motivo: "ciclo",
      ciclo: ["B", "C", "D", "B"],
    });
  });
});
