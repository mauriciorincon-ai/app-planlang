/**
 * Los demos de la vitrina (ADR-014). El A conserva las URL del S2 (`/es/plan`); el B cuelga de su prefijo
 * (`/es/demo-b/plan`). Lo usan el servidor (datos) y el cliente (enlaces): no importa nada del servidor.
 */
export const DEMOS = ["demo-a", "demo-b"] as const;
export type IdDemo = (typeof DEMOS)[number];

/** El demo de las rutas sin prefijo (`/es/plan`…) y de las pantallas que no son de un demo: el A conserva sus URL y
 * su barra del S2 (ADR-014). */
export const DEMO_PUBLICADO: IdDemo = "demo-a";

/** Qué demos llevan el conmutador en su barra: el A conserva la barra del S2; el conmutador vive en las del B (ADR-014). */
export const CONMUTADOR_EN: Readonly<Record<IdDemo, boolean>> = {
  "demo-a": false,
  "demo-b": true,
};

/** El segmento de ruta de cada demo: vacío para el A (sus URL no cambian). */
export const SEGMENTO_DEMO: Readonly<Record<IdDemo, string>> = {
  "demo-a": "",
  "demo-b": "demo-b",
};

export function esIdDemo(x: string): x is IdDemo {
  return (DEMOS as readonly string[]).includes(x);
}

/**
 * El `default` de todo despacho por demo (ADR-014): con un demo nuevo en `DEMOS`, TypeScript nombra cada `switch` que
 * no lo atiende, porque el valor deja de ser `never`. En ejecución, un id fuera de la lista se detiene con su nombre.
 */
export function demoSinDespacho(x: never, donde: string): never {
  throw new Error(`vitrina: ${donde} no sabe atender el demo «${String(x)}».`);
}
