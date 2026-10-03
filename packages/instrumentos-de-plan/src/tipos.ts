/**
 * Tipos mínimos del reusable «instrumentos de plan» (contrato v0.2.0 § 1). Son ESTRUCTURALES: la app
 * consumidora pasa sus objetos (que pueden llevar más campos) y el paquete solo lee lo que declara aquí.
 * El paquete no conoce ningún dominio (G6) ni importa nada de la app.
 */

export type Reversibilidad = "una_via" | "costosa" | "dos_vias";
export type PrioridadDeAccion = "alta" | "media" | "baja";
export type Criticidad = "alta" | "media" | "baja";

export type TextoOMapa = string | { es: string; en: string };

/** Opción de una decisión (§ 1.1): `pros`/`contras` son opcionales desde v0.2.0 (F-002). */
export interface OpcionMinima {
  nombre: TextoOMapa;
  pros?: unknown;
  contras?: unknown;
}

export interface DecisionMinima {
  id: string;
  reversibilidad: Reversibilidad;
  depende_de?: readonly string[];
  opciones?: readonly OpcionMinima[];
}

export interface ModoDeFallaMinimo {
  id: string;
  severidad: number;
  ocurrencia: number;
  deteccion: number;
  mitigaciones?: readonly unknown[];
  /** v0.2.0 (F-003, G8): el modo protege una obligación legal ⇒ prioridad efectiva `alta` y exige mitigación. */
  control_legal?: boolean;
}

export interface SupuestoMinimo {
  id: string;
  criticidad: Criticidad;
  prueba_barata: TextoOMapa;
}

export interface Bloqueante {
  tipo:
    | "ciclo"
    | "dependencia_desconocida"
    | "prioridad_alta_sin_mitigacion"
    | "supuesto_critico_sin_prueba";
  ids: string[];
  mensaje: { es: string; en: string };
}
