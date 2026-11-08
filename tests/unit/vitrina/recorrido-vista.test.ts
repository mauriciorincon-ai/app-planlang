/**
 * La vista del recorrido de un caso (S10): para cada caso con página de los dos demos, en los dos idiomas, el recorrido
 * se arma desde su traza y el contrafactual del compacto del playground (nada escrito a mano). Un desajuste entre la
 * traza y el compacto no se disimula: la vista falla con el paso y el caso.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { datosDemo, type DatosDemo } from "@/lib/datos/vitrina";
import { idsDeCasos } from "@/lib/vista/caso";
import {
  CONTENEDOR_RECORRIDO,
  NS_RECORRIDO,
  vistaRecorrido,
  type PasoDelRecorrido,
} from "@/lib/vista/recorrido";

const demos = ["demo-a", "demo-b"] as const;
const datos = {} as Record<(typeof demos)[number], DatosDemo>;
beforeAll(async () => {
  for (const id of demos) datos[id] = await datosDemo(id);
}, 60_000);

const trazaDe = (d: DatosDemo, id: string) =>
  d.corrida.trazas.find((t) => t.caso_id === id)!;

describe.each(demos)("el recorrido de cada caso con página (%s)", (id) => {
  it("tiene un paso por visita, numerados desde 1, con el contenedor y las reglas por data-paso", () => {
    const d = datos[id];
    const ids = idsDeCasos(d);
    expect(ids.length).toBeGreaterThan(0);
    for (const caso of ids) {
      const t = trazaDe(d, caso);
      const v = vistaRecorrido(d, t, "es");
      expect(v.contenedor).toBe(CONTENEDOR_RECORRIDO);
      expect(v.ns).toBe(NS_RECORRIDO);
      expect(v.pasos.map((p) => p.k)).toEqual(v.pasos.map((_, n) => n + 1));
      expect(v.pasos.length).toBeGreaterThan(0);
      expect(v.css).toContain(`#${CONTENEDOR_RECORRIDO}[data-paso="1"]`);
      expect(v.css).toContain("[data-panel] { display: none; }");
      expect(v.movimiento).toContain("transition");
      expect(v.lienzo.svg).toContain("<svg");
      for (const p of v.pasos) {
        expect(p.posicion).toContain(String(v.pasos.length));
        expect(p.nombre.length).toBeGreaterThan(0);
      }
    }
  }, 120_000);

  it("en los dos idiomas dice lo mismo con distintas palabras y el enlace al playground lleva el valor", () => {
    const d = datos[id];
    const todos: PasoDelRecorrido[] = [];
    for (const caso of idsDeCasos(d)) {
      const t = trazaDe(d, caso);
      const es = vistaRecorrido(d, t, "es");
      const en = vistaRecorrido(d, t, "en");
      expect(en.pasos).toHaveLength(es.pasos.length);
      es.pasos.forEach((p, n) => {
        const q = en.pasos[n]!;
        expect(q.k).toBe(p.k);
        expect(q.nodo).toBe(p.nodo);
        expect(q.contrafactuales.map((c) => c.umbral)).toEqual(
          p.contrafactuales.map((c) => c.umbral),
        );
        const sinIdioma = (e: string | null) =>
          e === null ? null : e.replace(/^\/(es|en)\//, "/");
        expect(q.contrafactuales.map((c) => sinIdioma(c.enlace))).toEqual(
          p.contrafactuales.map((c) => sinIdioma(c.enlace)),
        );
        p.contrafactuales.forEach((c, m) => {
          expect(c.texto.length).toBeGreaterThan(0);
          expect(q.contrafactuales[m]!.texto.length).toBeGreaterThan(0);
          // Con enlace hay «probar»; sin él, el texto dice por qué no hay valor (P15): nunca uno inventado.
          expect(c.enlace === null).toBe(c.probar === null);
          if (c.enlace)
            expect(c.enlace).toMatch(
              new RegExp(`/playground\\?u=${c.umbral}:([0-9.]+|true|false)$`),
            );
        });
      });
      todos.push(...es.pasos);
    }
    // El lote enseña los casos que pausan, los que cambian de rama y los que no leen ningún umbral.
    expect(todos.some((p) => p.pausa !== null)).toBe(true);
    expect(todos.some((p) => p.contrafactuales.some((c) => c.enlace))).toBe(
      true,
    );
  }, 240_000);

  it("rojo: si la traza no coincide con el compacto del playground, falla nombrando el paso y el caso", () => {
    const d = datos[id];
    const caso = idsDeCasos(d).find((c) =>
      vistaRecorrido(d, trazaDe(d, c), "es").pasos.some(
        (p) => p.contrafactuales.length > 0,
      ),
    )!;
    const t = trazaDe(d, caso);
    expect(() =>
      vistaRecorrido(d, { ...t, caso_id: "NO-ESTA-EN-EL-COMPACTO" }, "es"),
    ).toThrow(/NO-ESTA-EN-EL-COMPACTO|compacto/);
  }, 60_000);
});
