// @vitest-environment node
/**
 * Fuentes e íconos de la vitrina (design-system § 2.3 y 2.5): los woff2 son los MISMOS bytes que aprobó la
 * maqueta, cada fuente viaja con su licencia OFL, y Lucide va con la versión exacta del sistema (1.48.0).
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sha = (ruta: string) =>
  createHash("sha256").update(readFileSync(ruta)).digest("hex");
const VITRINA = "src/app/fuentes";
const MAQUETA = "docs/diseno/assets/fuentes";

function archivos(dir: string, ext: RegExp): string[] {
  return readdirSync(dir).flatMap((f) => {
    const r = join(dir, f);
    return statSync(r).isDirectory()
      ? archivos(r, ext)
      : ext.test(f)
        ? [r]
        : [];
  });
}

describe("fuentes e íconos de la vitrina", () => {
  const woff = readdirSync(VITRINA).filter((f) => f.endsWith(".woff2"));

  it("sirve Inter y JetBrains Mono, y Fraunces para la piel de CV Viva de Fichas", () => {
    expect(woff.sort()).toEqual([
      "fraunces-500.woff2",
      "inter.woff2",
      "jetbrains-mono.woff2",
    ]);
  });

  it("Fraunces no es una letra de planlang: solo la declara y la usa la piel de CV Viva, que solo pinta Fichas", () => {
    const nombran = archivos("src", /\.(tsx?|css)$/).filter((f) =>
      // La familia y el archivo, no la palabra (los comentarios la nombran).
      /Fraunces CV|fraunces-500/.test(readFileSync(f, "utf8")),
    );
    expect(nombran).toEqual(["src/styles/cv-viva.css"]);
    const css = readFileSync("src/styles/cv-viva.css", "utf8");
    // Una declaración y un solo lector: el titular de la piel.
    expect(css.match(/font-family: "Fraunces CV"/g)).toHaveLength(2);
    // Entra después de la carga, como la mono (ADR-008): antes, Georgia.
    expect(css).toMatch(
      /html\[data-mono\] \.cv-viva \.cv-letra \{\s*font-family: "Fraunces CV"/,
    );
    const conLetra = archivos("src", /\.tsx$/).filter((f) =>
      /\bcv-letra\b/.test(readFileSync(f, "utf8")),
    );
    expect(conLetra).toEqual(["src/components/fichas/ficha-cv.tsx"]);
  });

  it.each(woff)("%s: los mismos bytes que la maqueta aprobada", (f) => {
    expect(sha(`${VITRINA}/${f}`)).toBe(sha(`${MAQUETA}/${f}`));
  });

  it.each(woff)("%s: viaja con su licencia OFL en /licencias", (f) => {
    // El peso no va en el nombre de la licencia: «fraunces-500.woff2» → «OFL-fraunces.txt».
    const lic = `public/licencias/OFL-${f.replace(/(-\d+)?\.woff2$/, "")}.txt`;
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
