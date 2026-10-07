/**
 * La revisión del borrador no nombra un demo fijo (AU-S3-24): el comando para retomar, la frase de aprobación y la
 * ruta del plan aprobado salen del `plan_id`. Y los demos que el CLI acepta entrevistar son los que el entrevistador
 * Python sabe entrevistar.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  comandoRetomar,
  contradicciones,
  demoDelPlan,
  revisarBorrador,
  textoDeRevision,
  TranscripcionSchema,
  type Transcripcion,
} from "../../../../core/plan";
import { DEMOS_ENTREVISTABLES } from "../../../../scripts/entrevistar";

const DIR = "tests/contrato/entrevista-demo-b";
const borrador = () =>
  JSON.parse(readFileSync(`${DIR}/v0-borrador.json`, "utf8"));
const transcripcion = (): Transcripcion =>
  TranscripcionSchema.parse(
    JSON.parse(readFileSync(`${DIR}/transcripcion.json`, "utf8")),
  );

describe("el demo de la revisión sale del plan_id", () => {
  it("plan-demo-<x> da <x>; otro id se detiene nombrándolo", () => {
    expect(demoDelPlan("plan-demo-b")).toBe("b");
    expect(comandoRetomar("plan-demo-c")).toBe(
      "pnpm entrevistar --demo c --retomar",
    );
    expect(() => demoDelPlan("plan-x")).toThrow("plan-x");
  });

  it("la pendiente cita el comando del demo de su plan; sin comando, dice solo «en la entrevista»", () => {
    const t = transcripcion();
    t.plan_id = "plan-demo-c";
    t.preguntas[11]!.estado = "pendiente";
    const p = revisarBorrador(borrador(), t).contradicciones.find(
      (c) => c.codigo === "PENDIENTE" && c.elemento === t.preguntas[11]!.id,
    )!;
    expect(p.mensaje.es).toContain("«pnpm entrevistar --demo c --retomar»");
    expect(p.mensaje.en).toContain("“pnpm entrevistar --demo c --retomar”");
    const sin = contradicciones(borrador(), [{ id: "P1", seccion: "x" }]).find(
      (c) => c.codigo === "PENDIENTE",
    )!;
    expect([sin.mensaje.es, sin.mensaje.en]).toEqual([
      "La pregunta P1 (x) quedó pendiente: retómala en la entrevista.",
      "Question P1 (x) is pending: resume it in the interview.",
    ]);
  });

  it("la frase de aprobación, el comando y la ruta del plan aprobado son los del demo del plan, en los dos idiomas", () => {
    const t = transcripcion();
    t.plan_id = "plan-demo-c";
    const r = revisarBorrador(borrador(), t);
    const es = textoDeRevision(borrador(), r, "es");
    const en = textoDeRevision(borrador(), r, "en");
    for (const md of [es, en]) {
      expect(md).toContain("--demo c --por");
      expect(md).toContain("`plans/demo-c/v1.json`");
      expect(md).not.toMatch(/plan B|--demo b|demo-b\/v1/);
    }
    expect(es).toContain("«apruebo el plan C»");
    expect(en).toContain("“I approve plan C”");
  });
});

describe("los demos que el CLI entrevista", () => {
  it("son los del registro del entrevistador Python (`DEMOS` de cli.py)", () => {
    const cli = readFileSync(
      "agents/src/app_agents/entrevistador/cli.py",
      "utf8",
    );
    const linea = /^DEMOS = \{(.*)\}$/m.exec(cli)?.[1];
    expect(linea, "cli.py ya no declara DEMOS en una línea").toBeDefined();
    const claves = [...linea!.matchAll(/"([a-z0-9]+)": Demo\(/g)].map(
      (m) => m[1],
    );
    expect([...DEMOS_ENTREVISTABLES].sort()).toEqual(claves.sort());
  });
});
