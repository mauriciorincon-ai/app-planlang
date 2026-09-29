// @vitest-environment node
/**
 * Fuentes e íconos de la vitrina (design-system § 2.3 y 2.5): los woff2 son los MISMOS bytes que aprobó la
 * maqueta, cada fuente viaja con su licencia OFL, y Lucide va con la versión exacta del sistema (1.48.0).
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sha = (ruta: string) =>
  createHash("sha256").update(readFileSync(ruta)).digest("hex");
const VITRINA = "src/app/fuentes";
const MAQUETA = "docs/diseno/assets/fuentes";

describe("fuentes e íconos de la vitrina", () => {
  const woff = readdirSync(VITRINA).filter((f) => f.endsWith(".woff2"));

  it("sirve Inter y JetBrains Mono (Fraunces entra solo con Fichas)", () => {
    expect(woff.sort()).toEqual(["inter.woff2", "jetbrains-mono.woff2"]);
  });

  it.each(woff)("%s: los mismos bytes que la maqueta aprobada", (f) => {
    expect(sha(`${VITRINA}/${f}`)).toBe(sha(`${MAQUETA}/${f}`));
  });

  it.each(woff)("%s: viaja con su licencia OFL en /licencias", (f) => {
    const lic = `public/licencias/OFL-${f.replace(".woff2", "")}.txt`;
    expect(existsSync(lic), lic).toBe(true);
    expect(readFileSync(lic, "utf8")).toMatch(/SIL OPEN FONT LICENSE/i);
  });

  it("Lucide con la versión exacta del design system y su licencia", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.dependencies["lucide-react"]).toBe("1.48.0");
    expect(readFileSync("public/licencias/LICENSE-lucide.txt", "utf8")).toMatch(
      /ISC/,
    );
  });
});
