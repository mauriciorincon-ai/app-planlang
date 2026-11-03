/**
 * Entradas del gate de contrato de la garantía (S8, regla 19; ADR-018): `npx tsx scripts/garantia-contrato.ts`
 * escribe `tests/contrato/garantia-entradas.json` y, después, `python3 tests/contrato/garantia_fracciones.py --escribir`
 * calcula con `fractions` lo esperado. `tests/contrato/garantia.test.ts` comprueba que estas entradas siguen siendo las
 * de hoy y que el núcleo da lo mismo que Python, al bit.
 *
 * Trae la corrida publicada del demo A (las muestras de S1 tal como las arma el informe) y casos chicos hechos a mano,
 * uno por cada borde que la corrida no toca: pocos casos, el «+ 1» del conformal, la secuencia fija que no sigue tras
 * un rechazo, una tasa de error sobre α, el conformal por debajo del umbral con garantía, una etapa sin medir y un
 * operador sin garantía.
 */
import { writeFileSync } from "node:fs";
import { vistasDeCorrida, type Umbrales } from "../core/brecha/contexto";
import type {
  EntradaDeGarantia,
  MuestraDeGarantia,
} from "../core/brecha/garantia";
import { leerEntrada } from "../core/brecha/lector";
import {
  entradaDeGarantia,
  muestrasDeCalibracion,
} from "../core/brecha/supuestos";
import { jsonBonito } from "../core/formatos/huella";
import type { JsonValor } from "../core/formatos/jcs";
import { entradaDesdeDisco } from "./_corridas";

export const ARCHIVO_ENTRADAS = "tests/contrato/garantia-entradas.json";
export const FORMATO_ENTRADAS = "planlang-contrato-garantia-entradas/v1";
const PUBLICADA = {
  corrida: "runs/demo-a/suscripcion-planlang-a-002-200-v1.5",
  plan: "plans/demo-a/v1.5.2.json",
};

export interface CasoDelContrato {
  nombre: string;
  entrada: EntradaDeGarantia;
}

/** La entrada de la garantía de S1 sobre la corrida publicada del demo A, como la arma el informe. */
export async function entradaPublicada(): Promise<EntradaDeGarantia> {
  const e = await leerEntrada(
    entradaDesdeDisco(PUBLICADA.corrida, {
      plan: PUBLICADA.plan,
      base: null,
      repeticiones: [],
    }),
  );
  const umbrales = e.corrida.manifiesto.umbrales_aplicados as Umbrales;
  const vistas = vistasDeCorrida(e.corrida.trazas, e.casos, umbrales);
  const s1 = e.plan.supuestos.find((s) => s.id === "S1");
  const { muestras } = muestrasDeCalibracion(
    s1!.medible_en_trazas!.poblacion,
    vistas,
  );
  return entradaDeGarantia(muestras, e.plan, vistas, umbrales)!;
}

/** `n` muestras con la misma confianza y el mismo acierto (también en la etapa `extractor`). */
function bloque(
  prefijo: string,
  n: number,
  confianza: number,
  correcto: boolean,
): MuestraDeGarantia[] {
  return Array.from({ length: n }, (_, k) => ({
    caso_id: `${prefijo}-${String(k + 1).padStart(3, "0")}`,
    confianza,
    correcto,
    etapas: { extractor: correcto },
  }));
}

const BASE = {
  rejilla: [0.5, 0.6, 0.7, 0.8, 0.9],
  operador: "menor_que" as const,
  inclusivo: false,
  etapas: [{ nodo: "extractor", observada: true }],
  umbral_aplicado: 0.7,
};

/** Los bordes, cada uno con lo mínimo que lo provoca. */
export function casosSinteticos(): CasoDelContrato[] {
  return [
    {
      // 8 aciertos: (0,9)⁸ > 0,1, no hay umbral con garantía; a α = 0,10, ⌊9 · 0,1⌋ = 0, no hay conformal.
      nombre: "pocos-casos",
      entrada: { ...BASE, muestras: bloque("P", 8, 0.95, true) },
    },
    {
      // 19 aciertos: a α = 0,05, ⌊(19 + 1) · 0,05⌋ = 1 y hay conformal; sin el «+ 1», ⌊19 · 0,05⌋ = 0 y no lo habría.
      nombre: "conformal-justo",
      entrada: {
        ...BASE,
        muestras: [
          ...bloque("J", 19, 0.95, true),
          ...bloque("JF", 1, 0.55, false),
        ],
      },
    },
    {
      // En 0,9 respalda; en 0,7 cae (10 errores en 70); en 0,5 volvería a respaldar (10 en 270), pero la secuencia
      // fija ya paró: τ* = 0,9, nunca 0,5.
      nombre: "secuencia-rota",
      entrada: {
        ...BASE,
        rejilla: [0.5, 0.7, 0.9],
        muestras: [
          ...bloque("S", 60, 0.95, true),
          ...bloque("SF", 10, 0.8, false),
          ...bloque("SB", 200, 0.6, true),
        ],
      },
    },
    {
      // 5 errores en 20 casos de confianza alta: la tasa (25 %) no baja de ningún α; más casos no la respaldan.
      nombre: "tasa-sobre-alfa",
      entrada: {
        ...BASE,
        muestras: [
          ...bloque("T", 15, 0.95, true),
          ...bloque("TF", 5, 0.95, false),
        ],
      },
    },
    {
      // 30 aciertos en 0,55 bajan el conformal a 0,55; 15 errores en 0,65 dejan τ* en 0,7: no hay zona.
      nombre: "conformal-bajo-el-umbral",
      entrada: {
        ...BASE,
        muestras: [
          ...bloque("C", 100, 0.95, true),
          ...bloque("CB", 30, 0.55, true),
          ...bloque("CF", 15, 0.65, false),
        ],
      },
    },
    {
      // Dos etapas observadas, una sin medir en un caso (queda fuera de la población común), otra declarada observada
      // sin un solo caso medido (no entra), y una sin verdad; con `menor_o_igual_que`, el umbral también escala.
      nombre: "etapas-a-medias",
      entrada: {
        ...BASE,
        operador: "menor_o_igual_que",
        etapas: [
          { nodo: "extractor", observada: true },
          { nodo: "aclaracion", observada: true },
          { nodo: "vacia", observada: true },
          { nodo: "redactor", observada: false },
        ],
        muestras: [
          ...bloque("E", 80, 0.9, true).map((m, k) => ({
            ...m,
            etapas: { ...m.etapas, aclaracion: k === 0 ? null : k !== 1 },
          })),
          ...bloque("EF", 2, 0.7, false).map((m) => ({
            ...m,
            etapas: { ...m.etapas, aclaracion: true },
          })),
        ],
      },
    },
    {
      // La arista escala por confianza ALTA: la garantía no tiene sentido y es `null`.
      nombre: "operador-sin-garantia",
      entrada: {
        ...BASE,
        operador: "mayor_que",
        muestras: bloque("M", 30, 0.9, true),
      },
    },
  ];
}

export async function entradasDelContrato(): Promise<string> {
  const casos: CasoDelContrato[] = [
    { nombre: "publicada-demo-a", entrada: await entradaPublicada() },
    ...casosSinteticos(),
  ];
  return jsonBonito({
    formato: FORMATO_ENTRADAS,
    nota: "Generado por scripts/garantia-contrato.ts; lo esperado lo calcula tests/contrato/garantia_fracciones.py.",
    casos,
  } as unknown as JsonValor);
}

if (process.argv[1]?.endsWith("garantia-contrato.ts"))
  entradasDelContrato().then((texto) => {
    writeFileSync(ARCHIVO_ENTRADAS, texto);
    console.log(`✓ ${ARCHIVO_ENTRADAS}`);
  });
