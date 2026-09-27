/**
 * Plan de beneficios sintético del demo A (SPRINT_001 fase 2, paso 11): legible, con huella, 40
 * procedimientos · 5 exentos · 6 exclusiones (una por causal del art. 15 de la Ley 1751) · un
 * procedimiento con costo EXACTAMENTE igual a U2 (el caso de borde de la tripleta).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { verificarHuella } from "../../../../core/formatos/huella";
import type { JsonValor } from "../../../../core/formatos/jcs";
import { presupuestoLiderBilingue } from "../../../../core/formatos/jerga";
import type { Plan } from "../../../../core/plan";
import { umbralesDelPlan } from "../../../../core/sintetico/generador";
import {
  CAUSALES,
  PlanBeneficiosSchema,
  type PlanBeneficios,
} from "../../../../core/sintetico/esquema";

const crudo = JSON.parse(
  readFileSync("data/plan-beneficios/demo-a.json", "utf8"),
) as Record<string, JsonValor>;
const pb = PlanBeneficiosSchema.parse(crudo);
const plan = JSON.parse(readFileSync("plans/demo-a/v1.json", "utf8")) as Plan;
const U2 = umbralesDelPlan(plan).U2;

describe("plan de beneficios del demo A", () => {
  it("tiene huella que verifica", async () => {
    expect((await verificarHuella(crudo)).ok).toBe(true);
  });

  it("40 procedimientos · 5 exentos · 6 excluidos, una exclusión por causal", () => {
    const por = (e: string) => pb.procedimientos.filter((p) => p.estado === e);
    expect(pb.procedimientos).toHaveLength(40);
    expect(por("exento")).toHaveLength(5);
    expect(por("excluido")).toHaveLength(6);
    expect(
      por("excluido")
        .map((p) => p.causal)
        .sort(),
    ).toEqual([...CAUSALES]);
    expect(pb.causales_de_exclusion.map((c) => c.id)).toEqual([...CAUSALES]);
    for (const c of pb.causales_de_exclusion)
      expect(c.norma).toContain("1751 de 2015, art. 15");
  });

  it("el tope de alto costo es el umbral U2 del plan y hay servicios a ambos lados y en el empate", () => {
    expect(pb.tope_alto_costo).toBe("umbral.U2");
    const autorizables = pb.procedimientos.filter(
      (p) => p.estado === "requiere_autorizacion",
    );
    expect(autorizables.filter((p) => p.costo === U2)).toHaveLength(1);
    expect(
      autorizables.filter((p) => p.costo > U2).length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      autorizables.filter((p) => p.costo < U2).length,
    ).toBeGreaterThanOrEqual(10);
    // Exentos bajo U2: un exento de alto costo pondría a C3 y C4 en conflicto por diseño del dato.
    for (const p of pb.procedimientos.filter((x) => x.estado === "exento"))
      expect(p.costo).toBeLessThanOrEqual(U2);
  });

  it("el par homónimo apunta en ambos sentidos: uno cubierto y uno excluido", () => {
    const conHomonimo = pb.procedimientos.filter((p) => p.homonimo_de !== null);
    expect(conHomonimo).toHaveLength(2);
    const [a, b] = conHomonimo as [
      PlanBeneficios["procedimientos"][number],
      PlanBeneficios["procedimientos"][number],
    ];
    expect(a.homonimo_de).toBe(b.codigo);
    expect(b.homonimo_de).toBe(a.codigo);
    expect(new Set([a.estado, b.estado])).toEqual(
      new Set(["requiere_autorizacion", "excluido"]),
    );
  });

  it("las reglas legibles respetan el presupuesto de líder en ES y EN", () => {
    for (const r of pb.reglas)
      expect(presupuestoLiderBilingue(r.texto).ok, r.id).toBe(true);
  });

  it("el esquema rechaza exclusiones sin causal, diagnósticos desconocidos y códigos repetidos", () => {
    const copia = () => structuredClone(pb) as PlanBeneficios;
    const sinCausal = copia();
    sinCausal.procedimientos[34]!.causal = null;
    expect(PlanBeneficiosSchema.safeParse(sinCausal).success).toBe(false);
    const exentoSinMotivo = copia();
    exentoSinMotivo.procedimientos[29]!.exento_motivo = null;
    expect(PlanBeneficiosSchema.safeParse(exentoSinMotivo).success).toBe(false);
    const dxRoto = copia();
    dxRoto.procedimientos[0]!.diagnosticos_compatibles = ["SYN-D-99"];
    expect(PlanBeneficiosSchema.safeParse(dxRoto).success).toBe(false);
    const repetido = copia();
    repetido.procedimientos[1]!.codigo = repetido.procedimientos[0]!.codigo;
    expect(PlanBeneficiosSchema.safeParse(repetido).success).toBe(false);
    const dxRepetido = copia();
    dxRepetido.diagnosticos[1]!.codigo = dxRepetido.diagnosticos[0]!.codigo;
    expect(PlanBeneficiosSchema.safeParse(dxRepetido).success).toBe(false);
    const homonimoRoto = copia();
    homonimoRoto.procedimientos[21]!.homonimo_de = "SYN-P-999";
    expect(PlanBeneficiosSchema.safeParse(homonimoRoto).success).toBe(false);
  });
});
