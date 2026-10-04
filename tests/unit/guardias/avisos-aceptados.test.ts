// @vitest-environment node
/**
 * Un aviso de seguridad ignorado es una decisión, no un silencio: cada GHSA de `auditConfig.ignoreGhsas` en
 * `pnpm-workspace.yaml` está en `scripts/avisos-aceptados.json` con su razón y su fecha de revisión, y la prueba
 * falla cuando esa fecha vence (la excepción se renueva con razón o se quita). Y cada id está citado en un ADR (kit
 * v1.34.0, ADR-015). Demo en rojo (bitácora S3): el id cambiado en el ADR-015.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

interface Aviso {
  ghsa: string;
  paquete: string;
  razon: string;
  aceptado: string;
  revisar_antes: string;
}

const registro = JSON.parse(
  readFileSync("scripts/avisos-aceptados.json", "utf8"),
) as { avisos: Aviso[] };
const workspace = parse(readFileSync("pnpm-workspace.yaml", "utf8")) as {
  auditConfig?: { ignoreGhsas?: string[] };
};

export function problemasDeAvisos(
  ignorados: readonly string[],
  avisos: readonly Aviso[],
  hoy: string,
): string[] {
  const p: string[] = [];
  const ids = new Set(avisos.map((a) => a.ghsa));
  for (const g of ignorados)
    if (!ids.has(g))
      p.push(`${g} se ignora sin entrada en avisos-aceptados.json`);
  for (const a of avisos) {
    if (!ignorados.includes(a.ghsa))
      p.push(`${a.ghsa} está registrado pero el workspace no lo ignora`);
    if (a.razon.trim().length < 40) p.push(`${a.ghsa} sin razón suficiente`);
    if (a.revisar_antes <= hoy)
      p.push(
        `${a.ghsa} venció su revisión (${a.revisar_antes}): renuévala con razón o quita la excepción`,
      );
  }
  return p;
}

/** Kit v1.34.0 (ADR-015): cada id ignorado está citado en un ADR de `decisions/` (id · razón · fecha · retiro). */
export function avisosSinAdr(
  ignorados: readonly string[],
  adrs: readonly string[],
): string[] {
  return ignorados
    .filter((g) => !adrs.some((t) => t.includes(g)))
    .map((g) => `${g} se ignora sin un ADR en decisions/ que lo cite`);
}

const ADRS = readdirSync("decisions")
  .filter((f) => /^\d{3}-.+\.md$/.test(f))
  .map((f) => readFileSync(join("decisions", f), "utf8"));

describe("avisos de seguridad aceptados", () => {
  it("cada aviso ignorado tiene su ADR (kit v1.34.0)", () => {
    expect(
      avisosSinAdr(workspace.auditConfig?.ignoreGhsas ?? [], ADRS),
    ).toEqual([]);
  });

  it("cada aviso ignorado tiene razón y fecha de revisión vigente", () => {
    const hoy = new Date().toISOString().slice(0, 10);
    expect(
      problemasDeAvisos(
        workspace.auditConfig?.ignoreGhsas ?? [],
        registro.avisos,
        hoy,
      ),
    ).toEqual([]);
  });

  it("demo en rojo: un aviso ignorado sin registro y uno vencido se nombran", () => {
    expect(
      problemasDeAvisos(
        ["GHSA-xxxx-yyyy-zzzz", "GHSA-vfj7-8cjw-p6xm"],
        registro.avisos,
        "2026-12-01",
      ),
    ).toEqual([
      "GHSA-xxxx-yyyy-zzzz se ignora sin entrada en avisos-aceptados.json",
      "GHSA-vfj7-8cjw-p6xm venció su revisión (2026-11-02): renuévala con razón o quita la excepción",
    ]);
  });
});
