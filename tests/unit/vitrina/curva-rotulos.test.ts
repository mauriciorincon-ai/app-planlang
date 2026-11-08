/**
 * Los rótulos de los grupos de la curva mini (lote del S10, `curva.tsx`): con la cobertura entre 84 y 99 % los grupos
 * quedan a pocos píxeles y sus rótulos se pisaban; cada uno toma la primera fila libre y ninguno toca al de su fila.
 */
import { describe, expect, it } from "vitest";
import { rotulosDeGrupos } from "@/components/curva";

const rotulo = (u: number[]) => `U${u.join("+U")}`;
const fy = (r: number) => 204 - r * 100;
const grupo = (cobertura: number, u: number) => ({
  umbrales: [u],
  cobertura,
  riesgo: 0.1,
});

describe("rótulos de grupos de la curva mini", () => {
  it("tres grupos a 1-2 % de cobertura de distancia no comparten fila", () => {
    const r = rotulosDeGrupos(
      [grupo(0.84, 1), grupo(0.86, 2), grupo(0.88, 3)],
      rotulo,
      fy,
    );
    expect(new Set(r.map((x) => x.fila)).size).toBeGreaterThan(1);
    const porFila = new Map<number, typeof r>();
    for (const x of r) porFila.set(x.fila, [...(porFila.get(x.fila) ?? []), x]);
    for (const fila of porFila.values())
      for (let i = 1; i < fila.length; i++) {
        const a = fila[i - 1]!;
        const b = fila[i]!;
        const finA = a.x + (a.texto.length * 6.6 + 6) / 2;
        const iniB = b.x - (b.texto.length * 6.6 + 6) / 2;
        expect(iniB).toBeGreaterThan(finA);
      }
  });

  it("grupos lejanos quedan en la primera fila y el del borde derecho se alinea a su final", () => {
    const r = rotulosDeGrupos([grupo(0.2, 1), grupo(0.99, 2)], rotulo, fy);
    expect(r[0]!.fila).toBe(186);
    expect(r[0]!.borde).toBe(false);
    expect(r[1]!.borde).toBe(true);
    expect(r[1]!.fila).toBe(140);
  });
});
