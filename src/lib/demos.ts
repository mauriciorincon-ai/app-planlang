/**
 * Los demos de la vitrina (ADR-014). El A conserva las URL del S2 (`/es/plan`); el B cuelga de su prefijo
 * (`/es/demo-b/plan`). Lo usan el servidor (datos) y el cliente (enlaces): no importa nada del servidor.
 */
export const DEMOS = ["demo-a", "demo-b"] as const;
export type IdDemo = (typeof DEMOS)[number];

/** El segmento de ruta de cada demo: vacío para el A (sus URL no cambian). */
export const SEGMENTO_DEMO: Readonly<Record<IdDemo, string>> = {
  "demo-a": "",
  "demo-b": "demo-b",
};

export function esIdDemo(x: string): x is IdDemo {
  return (DEMOS as readonly string[]).includes(x);
}
