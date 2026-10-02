/**
 * La forma de lo que planlang entrega a hoja-de-vida: la ficha técnica (contrato v1.3.1, frente Agentes) y el
 * `brochure-export.json` (contrato 1.0.0, del que la planeadora arma la ficha de la app). Tipos escritos a mano
 * desde las copias fijadas en `docs/contratos/hoja-de-vida/`; `contrato.ts` valida contra esas copias.
 */
export type Fuente = "medido" | "calculada" | "declarado" | "estimacion";

export interface CifraFicha {
  clave: string;
  valor: number;
  unidad?: string;
  etiqueta: string;
  fuente: Fuente;
  detalle: string;
}

export interface PasoBpmn {
  id: string;
  tipo: "inicio" | "tarea" | "decision" | "fin";
  carril: string;
  texto: string;
}

export interface ProcesoBpmn {
  titulo: string;
  carriles: { id: string; nombre: string }[];
  pasos: PasoBpmn[];
  flujos: { de: string; a: string; etiqueta?: string }[];
  anotaciones: { paso: string; texto: string }[];
}

export interface FichaTecnica {
  schema_version: string;
  actualizado: string;
  pieza: {
    slug: string;
    nombre: string;
    frente: "apps" | "agentes" | "investigaciones" | "tableros";
    estado: "inicial" | "sellado";
    ciclo: string;
    version: string;
    sellado_en: string | null;
    sprints_cerrados: number;
  };
  promesa: { tagline: string; intro: string; para_quien: string };
  titular: string;
  stack: { nombre: string; papel: string }[];
  cifras: CifraFicha[];
  bloques: { orden: number; nombre: string; linea: string; cuenta: number }[];
  proceso?: ProcesoBpmn;
  procedencia_proceso?: "app" | "cv-viva" | "planeadora";
  limites: string[];
  nunca: string[];
  hitos: { valor: string; etiqueta: string }[];
}

export interface FeatureExport {
  id: string;
  nombre: string;
  que_hace: string;
  seccion_manual: string;
}

export interface BrochureExport {
  _schema: Record<string, string>;
  schema_version: string;
  actualizado: string;
  app: {
    slug: string;
    nombre: string;
    ciclo: string;
    estado: "inicial" | "sellado";
    sellado_en: string | null;
    sprints_cerrados: number;
    version_repo: string;
  };
  promesa: {
    tagline: string;
    intro: string;
    para_quien: string;
    diferencial: string;
  };
  funcionalidades: {
    total: number;
    fuente_del_conteo: string;
    descartadas: { id: string; nombre: string; fecha: string; razon: string }[];
    grupos: {
      orden: number;
      estrella: boolean;
      nombre: string;
      linea: string;
      features: FeatureExport[];
    }[];
  };
  metricas: {
    clave: string;
    etiqueta: string;
    valor: number;
    unidad: string;
    fuente: Fuente;
    detalle: string;
  }[];
  stack: { nombre: string; papel: string }[];
  privacidad: { detalle: string } & Record<string, string | boolean>;
  enlaces: {
    produccion: null;
    razon: string;
    repositorio: null;
    razon_repositorio: string;
    brochure_archivo: string;
    brochure_ruta_local: string;
  };
}
