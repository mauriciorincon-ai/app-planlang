// @vitest-environment node
/**
 * Vista de P3 Agente sobre la corrida real: las cifras que la maqueta aprobada tomó de la corrida v1.2 salen
 * ahora calculadas de las trazas (ninguna escrita a mano), en los dos idiomas; el lienzo es el grafo (gate
 * «diagrama = grafo» sobre el mapa que dibuja la página).
 */
import { beforeAll, describe, expect, it } from "vitest";
import { datosDemo } from "@/lib/datos/vitrina";
import { vistaAgente, type VistaAgente } from "@/lib/vista/agente";

let es: VistaAgente;
let en: VistaAgente;
beforeAll(async () => {
  const d = await datosDemo();
  es = vistaAgente(d, "es");
  en = vistaAgente(d, "en");
}, 60_000);

const panel = (v: VistaAgente, id: string) => v.paneles.find((p) => p.nombre === id)!;
const campo = (v: VistaAgente, id: string, rotulo: RegExp) =>
  panel(v, id).lider.campos.find((c) => rotulo.test(c.rotulo))!.texto;

describe("P3 Agente: las cifras salen de las trazas", () => {
  it("las 7 actividades con su cifra real", () => {
    expect(es.ficha.hace.items.map((x) => x.detalle)).toEqual([
      "20 de 20 casos",
      "2 urgencias y 2 exentos",
      "16 casos",
      "3 casos, 5 preguntas",
      "15 casos, sin modelo",
      "8 de 20 a una persona",
      "5 documentos en ES y EN",
    ]);
    expect(es.ficha.hace.items.every((x) => x.corrio)).toBe(true);
  });

  it("lo que corrió frente a su plan: 8 de 8, 9 de 9 y la prueba cruzada sin diferencias", () => {
    expect(es.lienzo.comparacion.ok).toBe(true);
    expect(es.contrato.cifras[0]!.cifra).toBe("8 de 8");
    expect(en.contrato.cifras[1]!.cifra).toBe("9 of 9");
    expect(es.contrato.cifras[2]!.cifra).toMatch(/^\d+ · 0$/);
  });

  it("«En los 20 casos» de cada nodo", () => {
    expect(campo(es, "enrutador", /En los 20/)).toMatch(/^16 siguieron al extractor\. 2 urgencias y 2 servicios exentos/);
    expect(campo(es, "extractor", /En los 20/)).toMatch(/^Leyó 16 casos, 21 veces: 5 relecturas/);
    expect(campo(es, "aclaracion", /En los 20/)).toMatch(/^3 casos incompletos, 5 preguntas\./);
    expect(campo(es, "verificador_cobertura", /En los 20/)).toMatch(/^Revisó 15 casos: 5 excluidos con causal, 3 de alto costo y 1 contradicción/);
    expect(campo(es, "decision", /En los 20/)).toMatch(/^Decidió 15 casos: 8 siguieron solos al redactor y 7 pasaron a una persona/);
    expect(campo(es, "pausa_humana", /En los 20/)).toMatch(/^8 pausas: 7 desde decision y 1 por el tope.*negó 5 y aprobó 3\. Unos 96 minutos/);
    expect(campo(es, "redactor", /En los 20/)).toMatch(/^Escribió 20 respuestas; 5 negaciones/);
    expect(campo(en, "guardia_salida", /In the 20/)).toMatch(/^It checked all 20 answers: 0 findings/);
  });

  it("la arista U1: 15 casos llegaron a decision y la regla manda a una persona a los que están bajo 0,75", () => {
    expect(es.arista.puntos).toHaveLength(15);
    expect(es.arista.puntos.filter((p) => p.aPersona).every((p) => p.valor < 0.75)).toBe(true);
    expect(es.arista.filas.at(-1)!.v).toMatch(/^1 de 15 bajo U1: A-012, con 0,70$/);
  });

  it("el lienzo trae el SVG en su idioma y la lista por capa", () => {
    expect(es.lienzo.svg).toContain('lang="es"');
    expect(en.lienzo.svg).toContain('lang="en"');
    expect(es.lienzo.lista).toHaveLength(6);
    expect(es.lienzo.lista[1]!.nodos.map((n) => n.nombre)).toEqual(["enrutador", "decision"]);
    expect(es.paneles).toHaveLength(8);
    for (const p of es.paneles) expect(p.trazas.filas.length).toBeGreaterThan(0);
  });
});
