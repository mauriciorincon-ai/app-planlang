import { readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { expect, test } from "@playwright/test";
import ts from "typescript";
import {
  colaBinomial,
  garantiaDeCalibracion,
  type EntradaDeGarantia,
} from "../../core/brecha/garantia";

/**
 * Paridad de la garantía entre motores (P1, S8; ADR-018): lo que el informe promete se calcula con `BigInt` y tiene que
 * dar los mismos bytes en Node (aquí), Chromium (`escritorio`), Firefox y WebKit. Se empaqueta `core/brecha/garantia.ts`
 * con lo que importa por valor (transpilado con el `typescript` del repo, sin dependencias nuevas), se evalúa en la
 * página y se compara el JSON de cada caso del contrato — la garantía y cada cola exacta — con el de Node. El contrato
 * con Python (`tests/contrato/garantia.test.ts`) cierra el círculo: Node = Python, y aquí cada motor = Node.
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

type Caso = { nombre: string; entrada: EntradaDeGarantia };
type Cola = { n: number; e: number; alfa: string };

const casos = (
  JSON.parse(readFileSync("tests/contrato/garantia-entradas.json", "utf8")) as {
    casos: Caso[];
  }
).casos;
const colas = (
  JSON.parse(readFileSync("tests/contrato/garantia-esperada.json", "utf8")) as {
    casos: { colas: Cola[] }[];
  }
).casos.flatMap((c) => c.colas);

/** Lo que se compara, en el mismo orden en Node y en el motor: cada garantía y cada cola como «num/den». */
function calcular(
  g: {
    garantiaDeCalibracion: typeof garantiaDeCalibracion;
    colaBinomial: typeof colaBinomial;
  },
  cs: Caso[],
  qs: Cola[],
): string {
  return JSON.stringify({
    garantias: cs.map((c) => [c.nombre, g.garantiaDeCalibracion(c.entrada)]),
    colas: qs.map((q) => {
      const [num, den] = q.alfa.split("/").map(Number) as [number, number];
      const p = g.colaBinomial(q.n, q.e, { num, den });
      return `${q.n} ${q.e} ${q.alfa} ${p.num}/${p.den}`;
    }),
  });
}

test("la garantía da en este motor los mismos bytes que en Node, caso por caso", async ({
  page,
}) => {
  const enNode = calcular(
    { garantiaDeCalibracion, colaBinomial },
    casos,
    colas,
  );
  await page.goto("about:blank");
  const enElMotor = (await page.evaluate(
    `(${calcular.toString()})(${empaquetar("core/brecha/garantia.ts")}, ${JSON.stringify(casos)}, ${JSON.stringify(colas)})`,
  )) as string;
  expect(colas.length).toBeGreaterThan(50);
  expect(enElMotor).toBe(enNode);
});
