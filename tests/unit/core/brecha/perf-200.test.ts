/**
 * Presupuesto de performance del verificador (DoD S1): informe de 200 casos en menos de 2 s en Node.
 * Sin corrida real de 200 todavía, se arma una de 200 trazas sobre el lote versionado de 200: las 20
 * trazas reales se replican sobre los casos A-021…A-200 (re-selladas, con sus ramas recalculadas), así
 * que el verificador hace TODO el trabajo: 200+ huellas, reglas del plan por caso, contrato y RF-09.2.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generarInforme } from "../../../../core/brecha/informe";
import { conHuella, sinHuella } from "../../../../core/formatos/huella";
import type { JsonValor } from "../../../../core/formatos/jcs";
import type { Traza } from "../../../../core/formatos/traza";
import {
  ramasEsperadas,
  type Umbrales,
} from "../../../../core/playground/interprete";
import { copia, entradaReal } from "../../../helpers/corridas";

type O = Record<string, JsonValor>;
export const PRESUPUESTO_MS = 2000;

async function corridaDe200() {
  const e = entradaReal();
  // Desde el S2 el lote de 200 se genera con la v1.4 (AU-9), cuyo contrato de grafo la corrida del S1 no corrió. Sus
  // casos son los mismos que con la v1.1 (el de 20 es su primer bloque), así que aquí se re-sella con la referencia al
  // plan del lote de 20: el verificador los lee como el lote de la corrida que replica.
  const lote20 = e.casos as O;
  const lote200 = await conHuella(
    sinHuella({
      ...(JSON.parse(
        readFileSync("data/casos/demo-a/planlang-a-001-200.json", "utf8"),
      ) as O),
      plan: lote20["plan"] as JsonValor,
    }),
  );
  const c = copia(e.corrida);
  const m = c.corrida as O & { trazas: O[]; casos: O };
  const originales = m.trazas.map((d) => c.trazas[d["archivo"] as string] as O);
  const trazas: Record<string, unknown> = {};
  const declaradas: O[] = [];
  for (let i = 1; i <= 200; i++) {
    const id = `A-${String(i).padStart(3, "0")}`;
    const t = await conHuella(
      sinHuella({ ...(originales[(i - 1) % 20] as O), caso_id: id }),
    );
    trazas[`trazas/${id}.json`] = t;
    declaradas.push({
      archivo: `trazas/${id}.json`,
      caso_id: id,
      huella: t.huella,
      resultado: (t as O)["resultado"] as string,
    });
  }
  const ramas = await ramasEsperadas(
    m["corrida_id"] as string,
    Object.values(trazas) as Traza[],
    c.grafo as never,
    m["umbrales_aplicados"] as Umbrales,
    (c.ramas as O)["fuente"] as string,
  );
  const ids = declaradas.map((d) => d["caso_id"] as string);
  const manifiesto = await conHuella(
    sinHuella({
      ...m,
      trazas: declaradas,
      casos_ejecutados: ids,
      casos: {
        ...m.casos,
        archivo: "data/casos/demo-a/planlang-a-001-200.json",
        huella: lote200["huella"] as string,
        id: "planlang-a-001-200",
        n_lote: 200,
      },
      sesiones: [{ ...(m["sesiones"] as O[])[0], casos_ejecutados: ids }],
      ramas_esperadas: {
        archivo: "ramas-esperadas.json",
        huella: ramas.huella,
      },
    } as O),
  );
  return {
    ...e,
    casos: lote200,
    base: null,
    corrida: { ...c, corrida: manifiesto, ramas, trazas },
  };
}

describe("performance del verificador", () => {
  it(`informe de 200 casos en menos de ${PRESUPUESTO_MS} ms`, async () => {
    const entrada = await corridaDe200();
    const t0 = performance.now();
    const inf = await generarInforme(entrada);
    const ms = performance.now() - t0;
    expect(inf.ficha_reproducibilidad.corrida.casos_ejecutados).toBe(200);
    expect(inf.contrato_de_grafo.rf_09_2[0]?.coincide).toBe(true);
    console.info(
      `[perf] informe de 200 casos: ${ms.toFixed(0)} ms (presupuesto ${PRESUPUESTO_MS} ms)`,
    );
    expect(ms).toBeLessThan(PRESUPUESTO_MS);
  }, 20000);
});
