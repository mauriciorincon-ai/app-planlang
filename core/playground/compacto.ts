/**
 * El compacto del playground: lo ÚNICO de la corrida que viaja al navegador. Lo arma `compactar.ts` en el build
 * desde la corrida verificada (huellas, esquema y RF-09.2 ya pasaron) y lo lee `consecuencias.ts` en cada
 * movimiento de un umbral. Solo tipos y constantes: importarlo no carga Zod ni el verificador.
 *
 * Qué trae y por qué:
 * - las visitas de cada caso a los nodos escritores, con las señales que observaron y la rama que registró el
 *   agente: el intérprete de aristas las rehace con los umbrales nuevos;
 * - el desenlace de cada rama posible (a una persona, solo hasta el final, o «no observado»), calculado sobre el
 *   grafo compilado;
 * - la verdad conocida que hace falta para decir si un cambio evita o introduce un error (`debe_escalar`, DA-04);
 * - por cada criterio, su resultado en lo registrado y en cada camino posible: así el navegador vuelve a medir los
 *   criterios con la regla del plan sin cargar el evaluador de reglas ni los textos de salida de los casos.
 */
import type { JsonValor } from "../formatos/jcs";
import type { AristaCondicional } from "../plan/esquema";
import type { EstadoCriterio } from "../brecha/criterios";
import type { Senales } from "./aristas";

/** A dónde lleva una rama: a una persona, al final sin persona, o a algo que la traza no registró. */
export type Desenlace = "persona" | "solo" | "no_observado";

/**
 * Resultado de una regla del plan sobre un caso: dentro y se cumple (`v`), dentro y no (`f`), fuera de la
 * población (`fuera`), fuera por una señal nula (`nulo`) o no evaluable (`ne`: falta lo que la regla lee).
 */
export type Resultado = "v" | "f" | "fuera" | "nulo" | "ne";

/** Resultado de un criterio en un caso; `m` es el valor de la métrica (criterios con métrica). */
export interface Evaluacion {
  r: Resultado;
  m?: number | null;
}

export interface UmbralCompacto {
  id: string;
  senal: string;
  valor_en_plan: number | boolean;
  rango: { min: number; max: number; paso: number } | "booleano";
}

export interface VisitaCompacta {
  paso: number;
  desde: string;
  /** Las señales que observó la visita, tal como las registró la traza. */
  senales: Senales;
  /** La rama que tomó el agente. */
  rama: string;
}

export interface CasoCompacto {
  id: string;
  subtipo: string;
  /** Verdad conocida: el caso debía pasar por una persona (con las reglas y los umbrales del plan). */
  debe_escalar: boolean;
  /** Lo que hizo el agente. */
  registrado: "persona" | "solo";
  /** Valor final de la señal de cada umbral en la traza (lo que el informe llama «observados»). */
  senales_de_umbral: Record<string, JsonValor>;
  visitas: VisitaCompacta[];
  /**
   * Por criterio (en el orden de `criterios`): su evaluación en lo registrado y, por cada camino posible, la del
   * caso si el camino cambia en la visita `i` y lleva a ese desenlace (clave `"i:desenlace"`).
   */
  evaluaciones: {
    registrado: Evaluacion[];
    caminos: Record<string, Evaluacion[]>;
  };
}

export interface CriterioCompacto {
  id: string;
  agregacion: string;
  tipo: string;
  objetivo: number | boolean;
  /** Si se mide con una métrica (mediana, promedio o máximo de un valor por caso). */
  con_metrica: boolean;
  estado_informe: EstadoCriterio;
  valor_informe: number | boolean | null;
}

/**
 * Lo que el playground necesita saber de un demo y no dicen ni el plan ni el formato de traza. Lo declara el
 * manifiesto de la vitrina por demo (`data/vitrina/manifiesto.json`, `playground`): el núcleo no conoce nombres de
 * ningún demo (RNF-06, AU-S2-18).
 */
export interface OpcionesDeDemo {
  /** La señal con la propuesta del agente: si el caso sigue solo, es su decisión final. */
  senal_propuesta: string;
  /** El valor favorable de la propuesta; cualquier otro es adverso (negar, rechazar) y exige una persona. */
  valor_favorable: string;
  /**
   * Una propuesta adversa que el plan deja salir sin persona mientras una señal esté apagada (plan v1.5 del A: la
   * aprobación parcial con el modo Texas apagado). Si la señal está ligada a un umbral, cuenta el valor jugado.
   */
  parcial?: PropuestaParcial;
  /** Claves que se conocen al decidir además de las señales que leen las aristas (las escribe un nodo escritor). */
  claves_previas: string[];
  /**
   * Señales propias del demo que se escriben DESPUÉS de decidir (el redactor, la guardia de salida): en un camino que
   * el agente no tomó no se conocen. El núcleo trae las del formato de traza; las del demo las declara su manifiesto.
   */
  claves_del_desenlace?: string[];
}

export interface PropuestaParcial {
  valor: string;
  senal_que_exige_persona: string;
}

export interface Compacto {
  /** La corrida de la que salió: el playground recalcula SUS decisiones (las de su prueba cruzada RF-09.2). */
  corrida_id: string;
  umbrales: UmbralCompacto[];
  aristas: AristaCondicional[];
  ramas_por_defecto: Record<string, string>;
  ligaduras: Record<string, string>;
  /** Los nodos escritores cuyas aristas leen un umbral: solo ahí puede cambiar el camino. */
  nodos_jugables: string[];
  /** El desenlace de cada rama posible de un nodo jugable. */
  desenlace_de_rama: Record<string, Desenlace>;
  /**
   * Minutos de una persona por caso que pasa por la pausa (costo humano que el plan declara en sus umbrales); `null`
   * si el plan no lo declara: el playground cuenta los casos que van a una persona y no inventa sus minutos.
   */
  minutos_por_persona: number | null;
  /** La señal de la propuesta del agente y su valor favorable (del manifiesto del demo). */
  propuesta: { senal: string; favorable: string; parcial?: PropuestaParcial };
  casos: CasoCompacto[];
  criterios: CriterioCompacto[];
}
