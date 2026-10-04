/**
 * Tipos del contrato del diagramador 0.3.0 que usa el visor (copia fijada en `packages/diagramador/contrato/`).
 * El esquema JSON es la norma; aquí se tipan los campos que el visor produce o lee. Todo texto que se dibuja o
 * se lee es un mapa de idioma `{ es, en }` (§ 3.0).
 */
import type { Idioma } from "../formatos/bilingue";

export type TextoIdioma = Record<Idioma, string>;
export type DiccionarioIdioma = Record<Idioma, Record<string, string>>;

export interface BandaGramatica {
  id: string;
  nombre: TextoIdioma;
  clase: "capa" | "carril" | "transversal";
  orden: number;
  pregunta_lider: TextoIdioma;
}

export interface TipoGramatica {
  id: string;
  nombre: TextoIdioma;
  token_color: string;
  glifo: string;
  etiqueta_corta: TextoIdioma;
}

export interface ModoGramatica {
  id: string;
  nombre: TextoIdioma;
  estilo_linea: string;
  marcador: string;
  descripcion: TextoIdioma;
  exige_condicion?: boolean;
}

export interface MadurezGramatica {
  id: string;
  nombre: TextoIdioma;
  nivel: number;
  disponible: boolean;
}

export interface Gramatica {
  contrato_version: string;
  id: string;
  version: string;
  nombre: TextoIdioma;
  idiomas: Idioma[];
  idioma_base: Idioma;
  bandas: BandaGramatica[];
  tipos_de_nodo: TipoGramatica[];
  modos_de_flujo: ModoGramatica[];
  escala_madurez: MadurezGramatica[];
  limites: {
    bloques_min: number;
    bloques_max: number;
    frases_lider_max: number;
    nodos_por_banda_max: number;
  };
  terminos_a_explicar: Record<Idioma, string[]>;
}

export interface Fuente {
  url: string;
  titulo: TextoIdioma;
  fecha: string;
  tipo: "oficial" | "tercero";
}

export interface NodoMapa {
  id: string;
  banda_id: string;
  tipo_id: string;
  nombre: TextoIdioma;
  orden?: number;
  lider: TextoIdioma;
  experto: TextoIdioma;
  por_que_importa: TextoIdioma;
  terminos?: DiccionarioIdioma;
  madurez: string;
  fuentes: Fuente[];
  fecha_verificacion: string;
  refs_externas?: string[];
}

export type Operador = "<" | "<=" | "=" | "!=" | ">=" | ">";

export interface Condicion {
  senal: string;
  operador: Operador;
  valor: number | string | boolean;
}

export interface FlujoMapa {
  id: string;
  origen: string;
  destino: string;
  modo_id: string;
  que_viaja: TextoIdioma;
  lider: TextoIdioma;
  condicion?: Condicion;
}

export interface Mapa {
  contrato_version: string;
  gramatica_id: string;
  gramatica_version: string;
  sujeto_id: string;
  sujeto_nombre: TextoIdioma;
  version: string;
  fecha_actualizacion: string;
  estado: "propuesta" | "aprobada" | "rechazada";
  bloques: never[];
  nodos: NodoMapa[];
  flujos: FlujoMapa[];
  recorridos: never[];
  glosario?: DiccionarioIdioma;
  refs_externas?: string[];
}
