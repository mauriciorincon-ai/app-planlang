// @vitest-environment node
/**
 * Regla de la casa (2026-11-02, S8): todo servidor que planlang abre escucha en 127.0.0.1, nunca en todas las interfaces,
 * y usa sus puertos: 3200 (la app, el e2e y Lighthouse) y 3201 (el paquete y las capturas del brochure). El 3000 y el
 * 3100 son de otras apps de la máquina. Estas pruebas leen los archivos que arrancan servidores; un `serve out -l 3000`
 * o un `localhost` vuelto a escribir las pone en rojo. Demo en rojo (cierre del S8): `start` vuelto a `serve out -l 3000`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const leer = (ruta: string) => readFileSync(ruta, "utf8");
const pkg = JSON.parse(leer("package.json")) as {
  scripts: Record<string, string>;
};

describe("puertos y servidores de planlang: 127.0.0.1, 3200 y 3201", () => {
  it("`pnpm start` sirve out/ en tcp://127.0.0.1:3200 y `pnpm dev` en -H 127.0.0.1 -p 3200", () => {
    expect(pkg.scripts.start).toBe("serve out -l tcp://127.0.0.1:3200");
    expect(pkg.scripts.dev).toBe("next dev -H 127.0.0.1 -p 3200");
  });

  it("el e2e usa 3200 y 127.0.0.1 en la URL del servidor, la base y el comando", () => {
    const c = leer("playwright.config.ts");
    expect(c).toContain('?? "3200"');
    expect(c).toContain("baseURL: `http://127.0.0.1:${PUERTO}`");
    expect(c).toContain("serve out -l tcp://127.0.0.1:${PUERTO}");
    expect(c).toContain("url: `http://127.0.0.1:${PUERTO}`");
    expect(c).not.toMatch(/localhost|:3000|:3100/);
  });

  it("el e2e del paquete usa 3201 y 127.0.0.1, y su aserción de origen lo sigue", () => {
    const c = leer("playwright.paquete.config.ts");
    expect(c).toContain('baseURL: "http://127.0.0.1:3201"');
    expect(c).toContain("-l tcp://127.0.0.1:3201");
    expect(c).toContain(
      'url: "http://127.0.0.1:3201/piezas/planlang/index.html"',
    );
    expect(c).not.toMatch(/localhost|:3100/);
    expect(leer("tests/e2e-paquete/paquete.spec.ts")).toContain(
      'u.host !== "127.0.0.1:3201"',
    );
  });

  it("Lighthouse en la CI mide http://127.0.0.1:3200 y arranca el servidor con `pnpm start`", () => {
    const ci = leer(".github/workflows/ci.yml");
    expect(ci).toContain("--url=http://127.0.0.1:3200'+u");
    expect(ci).toContain('--startServerCommand="pnpm start"');
    expect(ci).not.toMatch(/localhost:3000/);
  });

  it("las capturas del brochure sirven en 127.0.0.1:3201 y cierran su servidor", () => {
    const s = leer("scripts/capturas-cv-viva.mjs");
    expect(s).toContain("const PUERTO = 3201;");
    expect(s).toContain('from "./servidor-estatico.mjs"');
    expect(s).toContain("await escuchar(s, PUERTO)");
    expect(s).toContain("s.close(ok)");
    expect(s).not.toMatch(/0\.0\.0\.0|localhost:\d/);
    // El servidor estático que usan todos los arneses solo escucha en 127.0.0.1.
    expect(leer("scripts/servidor-estatico.mjs")).toContain(
      's.listen(puerto, "127.0.0.1"',
    );
  });
});
