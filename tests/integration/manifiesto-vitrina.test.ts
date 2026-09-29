/**
 * La vitrina muestra lo que declara `data/vitrina/manifiesto.json` (orden del S2): el plan, la corrida con sus
 * repeticiones y su línea base, y el informe. Este gate comprueba cada huella contra su archivo y regenera el
 * informe (el plan declarado sobre esas corridas, ADR-005 si el plan no es el de la corrida): si alguien toca el
 * verificador, el plan o una traza sin regenerar, lo nombra. Regenerar:
 * `pnpm brecha:informe --corrida <ruta> --plan <plan> --salida data/vitrina/<demo>/<corrida>`.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { generarInforme } from "../../core/brecha/informe";
import { renderizarInforme } from "../../core/brecha/render-md";
import { jsonBonito } from "../../core/formatos/huella";
import type { JsonValor } from "../../core/formatos/jcs";
import { entradaDesdeDisco } from "../../scripts/_corridas";

interface Ref {
  huella: string;
}
interface Demo {
  plan: Ref & { archivo: string };
  corrida: Ref & { ruta: string };
  repeticiones: (Ref & { ruta: string })[];
  linea_base: (Ref & { ruta: string }) | null;
  informe: Ref & { archivo: string };
}
const manifiesto = JSON.parse(
  readFileSync("data/vitrina/manifiesto.json", "utf8"),
) as { formato: string; demos: Record<string, Demo> };
const huellaDe = (archivo: string) =>
  (JSON.parse(readFileSync(archivo, "utf8")) as { huella: string }).huella;

describe("manifiesto de la vitrina", () => {
  it("declara su formato y al menos el demo A", () => {
    expect(manifiesto.formato).toBe("planlang-vitrina/v1");
    expect(Object.keys(manifiesto.demos)).toContain("demo-a");
  });
  it.each(Object.entries(manifiesto.demos))(
    "%s: cada huella coincide con su archivo",
    (_, d) => {
      expect(huellaDe(d.plan.archivo)).toBe(d.plan.huella);
      for (const c of [
        d.corrida,
        ...d.repeticiones,
        ...(d.linea_base ? [d.linea_base] : []),
      ])
        expect(huellaDe(join(c.ruta, "corrida.json")), c.ruta).toBe(c.huella);
      expect(huellaDe(d.informe.archivo)).toBe(d.informe.huella);
    },
  );
  it.each(Object.entries(manifiesto.demos))(
    "%s: el informe está al día con el plan y las corridas declaradas",
    async (_, d) => {
      const inf = await generarInforme(
        entradaDesdeDisco(d.corrida.ruta, {
          plan: d.plan.archivo,
          base: d.linea_base?.ruta ?? null,
          repeticiones: d.repeticiones.map((r) => r.ruta),
        }),
      );
      const dir = dirname(d.informe.archivo);
      expect(jsonBonito(inf as unknown as JsonValor)).toBe(
        readFileSync(d.informe.archivo, "utf8"),
      );
      for (const i of ["es", "en"] as const)
        expect(renderizarInforme(inf, i)).toBe(
          readFileSync(join(dir, `informe.${i}.md`), "utf8"),
        );
    },
  );
});
