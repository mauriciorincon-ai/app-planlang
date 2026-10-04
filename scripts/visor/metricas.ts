/**
 * Genera `core/visor/metricas.json`: el avance de cada carácter de Inter (a los pesos que usa el lienzo) y de
 * JetBrains Mono, leído de los MISMOS woff2 que sirve la vitrina (G15 del contrato del diagramador; enmienda
 * propuesta: la tabla de la app es de Inter, no de Space Grotesk). Unidades de la fuente, redondeadas al
 * entero (error ≤ 0,5/2048 em por carácter). Sin kerning: cota superior (P12). La prueba de deriva regenera
 * y compara byte a byte.
 *   pnpm visor:metricas
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PESOS_DE_LETRA } from "../../core/visor/estilos";
import { leerWoff2 } from "./woff2";

export const RUTA_METRICAS = "core/visor/metricas.json";
const FUENTES = {
  letra: "src/app/fuentes/inter.woff2",
  mono: "src/app/fuentes/jetbrains-mono.woff2",
} as const;

export function generarMetricas(raiz = process.cwd()): string {
  const salida: Record<string, unknown> = {
    formato: "planlang-metricas/v1",
    nota: "Generado por scripts/visor/metricas.ts desde los woff2 de la vitrina; no se edita a mano. Avances en unidades de la fuente, sin kerning.",
  };
  const fuentes: Record<string, unknown> = {};
  for (const [familia, archivo] of Object.entries(FUENTES)) {
    const bytes = readFileSync(join(raiz, archivo));
    const f = leerWoff2(bytes);
    const puntos = [...f.cmap.keys()]
      .filter((c) => c >= 0x20 && c !== 0xfeff)
      .sort((a, b) => a - b);
    const pesos: Record<string, Record<string, number>> = {};
    for (const peso of PESOS_DE_LETRA) {
      const tabla: Record<string, number> = {};
      for (const c of puntos)
        tabla[String(c)] = Math.round(f.avance(f.cmap.get(c)!, { wght: peso }));
      pesos[String(peso)] = tabla;
    }
    fuentes[familia] = {
      archivo,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      unidades_por_em: f.unidadesPorEm,
      pesos,
    };
  }
  salida.fuentes = fuentes;
  return JSON.stringify(salida, null, 1) + "\n";
}

if (process.argv[1] && process.argv[1].endsWith("metricas.ts")) {
  writeFileSync(RUTA_METRICAS, generarMetricas());
  console.log(`visor: ${RUTA_METRICAS} regenerado.`);
}
