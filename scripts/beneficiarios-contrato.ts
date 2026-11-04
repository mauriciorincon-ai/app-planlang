/**
 * Entradas del gate de contrato de los beneficiarios finales (S9, regla 19; ADR-019): `npx tsx
 * scripts/beneficiarios-contrato.ts` escribe `tests/contrato/beneficiarios-entradas.json` y, después,
 * `agents/.venv/bin/python tests/contrato/beneficiarios_agente.py --escribir` calcula lo esperado con el NODO del
 * agente (`app_agents.demo_b.beneficiarios`). `tests/contrato/beneficiarios.test.ts` comprueba que estas entradas
 * siguen siendo las de hoy y que el gemelo de verdad en TS da lo mismo que Python, al bit.
 *
 * Trae lo que el serializador real produce —la estructura verdadera de cada persona jurídica del lote
 * `planlang-b-002-20` y la que devolverá el proveedor simulado— y casos chicos hechos a mano, uno por cada borde: el
 * 25 % exacto, el 24,99 %, un 24,995 % que se muestra como 25,00, dos caminos, cuatro niveles, un ciclo, una suma de
 * más del 100 %, porcentajes mal escritos, referencias rotas, ids repetidos, sin entidad, solo control y sin control.
 */
import { readFileSync, writeFileSync } from "node:fs";
import type { EstructuraLeida } from "../core/sintetico/demo-b/beneficiarios";
import type { LoteB } from "../core/sintetico/demo-b/esquema";
import { jsonBonito } from "../core/formatos/huella";
import type { JsonValor } from "../core/formatos/jcs";
import { rutaDeLoteB } from "./lotes-versionados";

export const ARCHIVO_ENTRADAS = "tests/contrato/beneficiarios-entradas.json";
export const FORMATO_ENTRADAS = "planlang-contrato-beneficiarios-entradas/v1";

export interface CasoDelContrato {
  nombre: string;
  estructura: EstructuraLeida;
}

const S = "SYN-NIT-100000";
const E1 = "SYN-NIT-200000";
const E2 = "SYN-NIT-300000";
const P = (n: number) => `SYN-ID-${String(n).padStart(6, "0")}`;

function a_mano(
  participaciones: [string, string, string][],
  personas: number,
  controla: number | null,
  cambios: Partial<EstructuraLeida> = {},
): EstructuraLeida {
  return {
    entidad: S,
    entidades: [S, E1, E2].map((nit) => ({ nit, nombre: `Sociedad ${nit}` })),
    personas: Array.from({ length: personas }, (_, i) => ({
      documento: P(i + 1),
      nombre: `Persona ${i + 1}`,
    })),
    participaciones: participaciones.map(
      ([titular, participada, porcentaje]) => ({
        titular,
        participada,
        porcentaje,
      }),
    ),
    controla:
      controla === null
        ? null
        : { documento: P(controla), rol: "gerente_general" },
    ...cambios,
  };
}

/** Los casos hechos a mano: cada uno fuerza un borde que el lote no toca, o lo toca una sola vez. */
export const CASOS_A_MANO: readonly CasoDelContrato[] = [
  {
    nombre: "borde-25-exacto-por-dos-vias",
    estructura: a_mano(
      [
        [P(1), S, "10.00"],
        [P(2), S, "60.00"],
        [E1, S, "30.00"],
        [P(1), E1, "50.00"],
        [P(3), E1, "50.00"],
      ],
      3,
      2,
    ),
  },
  {
    nombre: "borde-24-99",
    estructura: a_mano(
      [
        [E1, S, "49.98"],
        [P(3), S, "50.02"],
        [P(1), E1, "50.00"],
        [P(2), E1, "50.00"],
      ],
      3,
      3,
    ),
  },
  {
    nombre: "borde-24-995-se-muestra-25-y-no-llega",
    estructura: a_mano(
      [
        [E1, S, "49.99"],
        [P(2), S, "50.01"],
        [P(1), E1, "50.00"],
      ],
      2,
      null,
    ),
  },
  {
    nombre: "dos-caminos-suman-26",
    estructura: a_mano(
      [
        [E1, S, "40.00"],
        [E2, S, "40.00"],
        [P(2), S, "20.00"],
        [P(1), E1, "30.00"],
        [P(3), E1, "70.00"],
        [P(1), E2, "35.00"],
        [P(4), E2, "65.00"],
      ],
      4,
      2,
    ),
  },
  {
    nombre: "cadena-de-cuatro-niveles",
    estructura: a_mano(
      [
        [E1, S, "80.00"],
        [P(2), S, "20.00"],
        [E2, E1, "75.00"],
        [P(4), E1, "25.00"],
        [P(1), E2, "60.00"],
        [P(3), E2, "40.00"],
      ],
      4,
      2,
    ),
  },
  {
    nombre: "tercios-redondeo",
    estructura: a_mano(
      [
        [E1, S, "100"],
        [P(1), E1, "33.33"],
        [P(2), E1, "33.33"],
        [P(3), E1, "33.34"],
      ],
      3,
      null,
    ),
  },
  {
    nombre: "solo-control",
    estructura: a_mano(
      [1, 2, 3, 4, 5].map(
        (n) => [P(n), S, "20.00"] as [string, string, string],
      ),
      6,
      6,
    ),
  },
  {
    nombre: "sin-control-ni-dueno-sobre-25",
    estructura: a_mano(
      [1, 2, 3, 4, 5].map((n) => [P(n), S, "20"] as [string, string, string]),
      5,
      null,
    ),
  },
  {
    nombre: "ciclo",
    estructura: a_mano(
      [
        [E1, S, "50.00"],
        [P(1), S, "50.00"],
        [E2, E1, "50.00"],
        [E1, E2, "50.00"],
      ],
      1,
      1,
    ),
  },
  {
    nombre: "suma-sobre-100",
    estructura: a_mano(
      [
        [P(1), S, "60.00"],
        [P(2), S, "50.00"],
      ],
      2,
      1,
    ),
  },
  {
    nombre: "porcentaje-tres-decimales-y-cero",
    estructura: a_mano(
      [
        [P(1), S, "33.333"],
        [P(2), S, "0"],
        [P(3), S, "60,5"],
      ],
      3,
      1,
    ),
  },
  {
    nombre: "referencias-rotas",
    estructura: a_mano(
      [
        [P(9), S, "50"],
        [P(1), "SYN-NIT-999999", "50"],
      ],
      1,
      8,
    ),
  },
  {
    nombre: "sin-entidad",
    estructura: a_mano([[P(1), S, "50"]], 1, 1, { entidad: null }),
  },
  {
    nombre: "id-repetido",
    estructura: a_mano([[P(1), S, "50"]], 1, 1, {
      personas: [
        { documento: P(1), nombre: "Persona 1" },
        { documento: P(1), nombre: "Persona 1 bis" },
      ],
    }),
  },
];

/** Lo que el serializador real produce: la estructura verdadera y la simulada de cada persona jurídica del lote. */
export function casosDelLote(): CasoDelContrato[] {
  const lote = JSON.parse(
    readFileSync(rutaDeLoteB("planlang-b-002", 20), "utf8"),
  ) as LoteB;
  return lote.casos.flatMap((c) => {
    const v = c.verdad_conocida.estructura;
    if (!v) return [];
    const salida: CasoDelContrato[] = [
      { nombre: `lote:${c.id}:${c.subtipo}`, estructura: v },
    ];
    const sim = c.simulacion.estructura_extraida;
    if (sim && JSON.stringify(sim) !== JSON.stringify(v))
      salida.push({ nombre: `simulada:${c.id}:${c.subtipo}`, estructura: sim });
    return salida;
  });
}

export function entradasDelContrato(): string {
  return jsonBonito({
    formato: FORMATO_ENTRADAS,
    casos: [...casosDelLote(), ...CASOS_A_MANO],
  } as unknown as JsonValor);
}

if (process.argv[1]?.endsWith("beneficiarios-contrato.ts")) {
  writeFileSync(ARCHIVO_ENTRADAS, entradasDelContrato(), "utf8");
  console.log(`escrito ${ARCHIVO_ENTRADAS}`);
}
