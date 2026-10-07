// @vitest-environment node
/**
 * Kit v1.37.0 (README de diseño): la pasada de capturas recorre la maqueta y la app SERVIDAS, entrando por el índice,
 * nunca abriendo `file://` (planlang: el índice sin barra final resolvía sus enlaces contra la raíz y cuatro miradas
 * no lo vieron). Cada arnés `scripts/capturar-*.mjs` sirve su árbol con `scripts/servidor-estatico.mjs` y ninguno
 * navega a un `file:`. Demo en rojo (bitácora S3): `capturar-maqueta.mjs` vuelto a `pathToFileURL`.
 */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ARNESES = readdirSync("scripts").filter((f) =>
  /^capturar-.+\.mjs$/.test(f),
);

describe("arneses de capturas sobre páginas servidas (kit v1.37.0)", () => {
  it("hay arneses que vigilar", () => {
    expect(ARNESES).toEqual(
      expect.arrayContaining(["capturar-maqueta.mjs", "capturar-vitrina.mjs"]),
    );
  });

  it.each(ARNESES)("%s sirve su árbol y no abre file://", (f) => {
    const s = readFileSync(`scripts/${f}`, "utf8");
    expect(s).toContain('from "./servidor-estatico.mjs"');
    expect(s).not.toMatch(/pathToFileURL\s*\(/);
    expect(s).not.toMatch(/goto\(\s*[`"']file:/);
  });
});

describe("el servidor de los arneses no sale de su árbol (AU-S3-15)", () => {
  it("una carpeta hermana con el mismo prefijo (`out` → `out-x`) recibe 403 y aborta; lo de adentro, 200", async () => {
    const { mkdtempSync, mkdirSync, writeFileSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const { servidor, escuchar } =
      (await import("../../../scripts/servidor-estatico.mjs")) as {
        servidor: (
          base: string,
          arnes: string,
          o: { abortar: () => void },
        ) => import("node:http").Server;
        escuchar: (s: import("node:http").Server) => Promise<number>;
      };
    const dir = mkdtempSync(join(tmpdir(), "planlang-servidor-"));
    mkdirSync(join(dir, "out"));
    mkdirSync(join(dir, "out-x"));
    writeFileSync(join(dir, "out", "es.html"), "<p>adentro</p>");
    writeFileSync(join(dir, "out-x", "secreto.html"), "<p>afuera</p>");
    const abortos: number[] = [];
    const s = servidor(join(dir, "out"), "prueba", {
      abortar: () => abortos.push(1),
    });
    const consola = console.error;
    console.error = () => {};
    try {
      const puerto = await escuchar(s);
      const pedir = (r: string) =>
        fetch(`http://127.0.0.1:${puerto}${r}`).then((x) => x.status);
      expect(await pedir("/es")).toBe(200);
      expect(await pedir("/..%2Fout-x/secreto")).toBe(403);
      expect(abortos).toHaveLength(1);
    } finally {
      console.error = consola;
      s.close();
    }
  });
});
