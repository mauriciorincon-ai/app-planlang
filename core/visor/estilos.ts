/**
 * Estilos de texto del lienzo del visor. La geometría se calcula con ellos y con la tabla de métricas
 * (`metricas.json`, G15 del contrato del diagramador): el navegador pinta con la misma letra y el mismo peso,
 * así que lo que el núcleo mide es lo que se ve. Piso de 12 u (G11): la maqueta usaba 10,5 y 11,5 px.
 */
export type Familia = "letra" | "mono";

export interface EstiloDeTexto {
  familia: Familia;
  peso: 400 | 500 | 600 | 700;
  /** Tamaño en unidades del SVG (a escala 1, píxeles). */
  tam: number;
  /** Distancia entre líneas consecutivas. */
  interlinea: number;
}

export const ESTILOS = {
  bandaNumero: { familia: "mono", peso: 500, tam: 12, interlinea: 16 },
  bandaNombre: { familia: "letra", peso: 600, tam: 13, interlinea: 17 },
  bandaPregunta: { familia: "letra", peso: 400, tam: 12, interlinea: 16 },
  nodoCodigo: { familia: "mono", peso: 500, tam: 12, interlinea: 16 },
  nodoNombre: { familia: "letra", peso: 500, tam: 13, interlinea: 17 },
  flujoRegla: { familia: "mono", peso: 400, tam: 12, interlinea: 16 },
  flujoSuave: { familia: "letra", peso: 400, tam: 12, interlinea: 16 },
  terminal: { familia: "letra", peso: 400, tam: 12, interlinea: 16 },
  insignia: { familia: "letra", peso: 500, tam: 12, interlinea: 16 },
} as const satisfies Record<string, EstiloDeTexto>;

export type NombreDeEstilo = keyof typeof ESTILOS;

/** Pesos de la letra que la tabla debe traer (los que usan los estilos). */
export const PESOS_DE_LETRA = [400, 500, 600, 700] as const;
