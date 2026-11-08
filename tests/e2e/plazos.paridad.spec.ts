import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { expect, test } from "@playwright/test";
import ts from "typescript";
import {
  configDeCola,
  llegadasDelLote,
  resumirPorClase,
  simularCola,
  type CapaDeLlegadas,
  type ConfigDeCola,
  type SolicitudDeCola,
} from "../../core/plazos";
import type { Plan } from "../../core/plan";

/**
 * Paridad del reloj y la cola entre motores (P1, S9; ADR-019): las llegadas y la cola del auditor tienen que dar los
 * mismos bytes en Node (aquí), Chromium (`escritorio`), Firefox y WebKit. Se empaqueta `core/plazos/index.ts` con lo que
 * importa por valor (incluido `sfc32`, transpilado con el `typescript` del repo, sin dependencias nuevas), se evalúa en
 * la página y se compara el JSON con el de Node: las llegadas sorteadas de un lote, y la cola del lote publicado del demo
 * A a cada capacidad jugable (5 a 60), con lo que cada caso pausó en la corrida de 200.
 */

/** Un empaquetado mínimo: cada módulo como función CommonJS, los `require` relativos resueltos a su ruta. */
function empaquetar(entrada: string): string {
  const modulos = new Map<string, string>();
  const pendientes = [normalize(entrada)];
  while (pendientes.length) {
    const archivo = pendientes.pop()!;
    if (modulos.has(archivo)) continue;
    const { outputText } = ts.transpileModule(readFileSync(archivo, "utf8"), {
      fileName: archivo,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    });
    modulos.set(
      archivo,
      outputText.replace(/require\("(\.[^"]+)"\)/g, (_, m: string) => {
        const k = normalize(
          join(dirname(archivo), m.endsWith(".ts") ? m : `${m}.ts`),
        );
        pendientes.push(k);
        return `require(${JSON.stringify(k)})`;
      }),
    );
  }
  const defs = [...modulos]
    .map(
      ([k, codigo]) =>
        `${JSON.stringify(k)}: function (require, module, exports) {\n${codigo}\n}`,
    )
    .join(",\n");
  return `(() => {
  const defs = {${defs}};
  const cache = {};
  const require = (k) => {
    if (!cache[k]) {
      const module = { exports: {} };
      cache[k] = module;
      defs[k](require, module, module.exports);
    }
    return cache[k].exports;
  };
  return require(${JSON.stringify(normalize(entrada))});
})()`;
}

const CORRIDA = "runs/demo-a/suscripcion-planlang-a-002-200-v1.5/trazas";
const CAPACIDADES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

const plan = JSON.parse(
  readFileSync("plans/demo-a/v1.6.1.json", "utf8"),
) as Plan;
const capa = JSON.parse(
  readFileSync("data/casos/demo-a/planlang-a-002-200.llegadas.json", "utf8"),
) as CapaDeLlegadas;
const llegadaDe = new Map(capa.llegadas.map((l) => [l.caso_id, l]));

/** Cada caso del lote publicado: su clase, su llegada y si pausó en la corrida. */
const solicitudes: SolicitudDeCola[] = readdirSync(CORRIDA)
  .sort()
  .map((f) => {
    const t = JSON.parse(readFileSync(join(CORRIDA, f), "utf8")) as {
      caso_id: string;
      senales: { tipo_atencion: string };
      pausas_humanas: unknown[];
    };
    return {
      caso_id: t.caso_id,
      clase: t.senales.tipo_atencion,
      llegada: llegadaDe.get(t.caso_id)!,
      pausa: t.pausas_humanas.length > 0,
    };
  });
const config = configDeCola(plan.simulacion_de_plazos!);
const ids = solicitudes.map((s) => s.caso_id);

type Plazos = {
  llegadasDelLote: typeof llegadasDelLote;
  simularCola: typeof simularCola;
  resumirPorClase: typeof resumirPorClase;
};

/** Lo que se compara, en el mismo orden en Node y en el motor. */
function calcular(
  p: Plazos,
  cfg: ConfigDeCola,
  ss: SolicitudDeCola[],
  caps: number[],
  lote: { id: string; huella: string; semilla: string },
  nombres: string[],
): string {
  return JSON.stringify({
    llegadas: p.llegadasDelLote({
      lote,
      ids: nombres,
      dias_habiles: 5,
      minutos_de_jornada: 540,
    }),
    colas: caps.map((c) => {
      const rs = p.simularCola(cfg, ss, c);
      return { capacidad: c, resumen: p.resumirPorClase(cfg, rs), rs };
    }),
  });
}

test("el reloj y la cola dan en este motor los mismos bytes que en Node", async ({
  page,
}) => {
  const enNode = calcular(
    { llegadasDelLote, simularCola, resumirPorClase },
    config,
    solicitudes,
    CAPACIDADES,
    capa.lote,
    ids,
  );
  await page.goto("about:blank");
  const enElMotor = (await page.evaluate(
    `(${calcular.toString()})(${empaquetar("core/plazos/index.ts")}, ${JSON.stringify(config)}, ${JSON.stringify(solicitudes)}, ${JSON.stringify(CAPACIDADES)}, ${JSON.stringify(capa.lote)}, ${JSON.stringify(ids)})`,
  )) as string;
  expect(solicitudes).toHaveLength(200);
  expect(solicitudes.some((s) => s.pausa)).toBe(true);
  expect(enElMotor).toBe(enNode);
  // Y no es la cola vacía: algo esperó al auditor a la capacidad mínima.
  expect(
    JSON.parse(enElMotor).colas[0].resumen.some(
      (r: { en_cola: number }) => r.en_cola > 0,
    ),
  ).toBe(true);
});
