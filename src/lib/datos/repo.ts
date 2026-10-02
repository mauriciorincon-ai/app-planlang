/**
 * Hechos del repositorio que citan las fichas (no los datos del demo): cuántos sprints cerraron (un
 * `sprints/SPRINT_NNN-summary.md` por sprint cerrado), cuántas decisiones se registraron (`decisions/NNN-*.md`), la
 * versión de `package.json` y el bloque `_schema` que el contrato del export manda copiar tal cual. Solo en el
 * servidor y al compilar; lo usan P7 y `scripts/fichas.ts`.
 */
import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface HechosDelRepo {
  sprintsCerrados: number;
  adrs: number;
  version: string;
  /** El `_schema` del ejemplo canónico del contrato brochure-export 1.0.0 (copia fijada). */
  bloqueSchema: Record<string, string>;
}

const CONTRATO_EXPORT =
  "docs/contratos/hoja-de-vida/brochure-export/contrato-brochure-export-v1.0.0.md";

/** El primer bloque ```json del contrato, del que se toma `_schema` (la regla 1 del contrato: se copia tal cual). */
export function bloqueSchemaDe(md: string): Record<string, string> {
  const m = md.match(/```json\n([\s\S]*?)\n```/);
  if (!m)
    throw new Error(`fichas: ${CONTRATO_EXPORT} no trae su ejemplo en JSON.`);
  const ejemplo = JSON.parse(m[1]!) as { _schema?: Record<string, string> };
  if (!ejemplo._schema)
    throw new Error(
      `fichas: el ejemplo de ${CONTRATO_EXPORT} no trae _schema.`,
    );
  return ejemplo._schema;
}

export function hechosDelRepo(raiz: string = process.cwd()): HechosDelRepo {
  const sprints = readdirSync(join(raiz, "sprints")).filter((f) =>
    /^SPRINT_\d{3}-summary\.md$/.test(f),
  ).length;
  const adrs = readdirSync(join(raiz, "decisions")).filter((f) =>
    /^\d{3}-.+\.md$/.test(f),
  ).length;
  const pkg = JSON.parse(readFileSync(join(raiz, "package.json"), "utf8")) as {
    version: string;
  };
  return {
    sprintsCerrados: sprints,
    adrs,
    version: pkg.version,
    bloqueSchema: bloqueSchemaDe(
      readFileSync(join(raiz, CONTRATO_EXPORT), "utf8"),
    ),
  };
}
