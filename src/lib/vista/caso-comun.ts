/**
 * Lo que P6 Caso comparte entre demos: cómo se lee un valor de la traza y el perfil que cada demo aporta al
 * esqueleto de `caso.ts` (lo que recibió, qué hizo cada nodo, el relato, la pausa, el documento y el expediente).
 */
import type { Idioma, TextoBilingue } from "@core/formatos/bilingue";
import type { DecisionDeArista, Traza } from "@core/formatos/traza";
import { MOTIVO_TECNICO, SI_NO } from "@/textos/caso";
import { decimal, decimalesDe } from "./formato";
import type { PasoCaso, VistaCaso } from "./caso";

/** Un nodo de la traza que no está en el grafo publicado ni trae su tipo: la página no lo dibuja sin glifo (AU-S2-16). */
export function sinTipo(nodo: string): never {
  throw new Error(
    `vitrina: el nodo «${nodo}» de la traza no está en el grafo de la corrida ni trae su tipo`,
  );
}

/**
 * Un valor de la traza como se lee: booleanos en palabras, decimales con coma en español, listas con flechas. Las
 * cadenas quedan como las escribió el código (`ambulatoria`, `negar`) en los dos idiomas, como en la maqueta: se
 * comparan contra la regla del plan, que también está en código.
 */
export function valorLeido(v: unknown, i: Idioma): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return (v ? SI_NO.si : SI_NO.no)[i];
  if (typeof v === "number")
    return Number.isInteger(v) ? String(v) : decimal(v, decimalesDe(v), i);
  if (Array.isArray(v)) return v.map(String).join(" → ");
  return String(v);
}

/** Lo que vio la persona en la pausa, ya leído con el esquema del demo. */
export interface PausaLeida {
  /** Por qué se detuvo, en palabras llanas (la categoría de la regla que registra el motivo). */
  motivo: TextoBilingue;
  motivoTecnico: TextoBilingue;
  senal: string;
  umbral: { declarado: unknown; aplicado: unknown };
  evidencia: TextoBilingue[];
  contraevidencia: TextoBilingue[];
  leyo: string;
  /** El resto del caso que viajó en la pausa (M-8: orden, cobertura, aclaraciones); vacío si la traza no lo trae. */
  caso: string[];
  nota: string;
}

/** Lo que cada demo aporta al esqueleto de P6 para un caso. */
export interface PerfilCaso {
  /** Cómo se dice una decisión de la traza (`aprobar`, `negar`, `rechazar`). */
  decision: (x: string) => TextoBilingue;
  /** El veredicto cuando la decisión final no es aprobar. */
  noAprobado: TextoBilingue;
  /** El valor de una decisión en parte y su veredicto (A, plan v1.5: `aprobar_parcial`); sin él, el demo no la tiene. */
  parcial?: { valor: string; veredicto: TextoBilingue };
  recibe: VistaCaso["recibe"];
  /** Qué hizo el nodo de un paso y el diálogo, si lo hubo (puede llevar estado: la n-ésima visita). */
  hizo: (p: Traza["pasos"][number]) => {
    hizo: string;
    dialogo: PasoCaso["dialogo"];
  };
  /** Por qué tomó cada rama, por nodo y por la categoría de la regla que se cumplió (o `defecto`). */
  ramas: Readonly<
    Record<string, Readonly<Record<string, TextoBilingue>> | undefined>
  >;
  dondeRamas: string;
  relato: string[];
  verdad: string;
  pausa: PausaLeida | null;
  documento: VistaCaso["documento"];
  /** Si el aviso de IA de la respuesta promete más de lo que la corrida cumplió (F22); `null` si es exacto. */
  avisoInexacto: VistaCaso["salida"]["avisoInexacto"];
  expediente: VistaCaso["expediente"];
  /** Lo que entrega, sin la traza (el esqueleto la añade al final). */
  entrega: Array<{ titulo: string; detalle?: string }>;
  textos: VistaCaso["textos"];
}

/** Un valor dentro del motivo técnico, como lo escribe el plan: `true`, `false`, `null`; decimal con coma en español. */
function valorDelMotivo(v: unknown): TextoBilingue {
  if (typeof v === "boolean") {
    const x = v ? "true" : "false";
    return { es: x, en: x };
  }
  if (v === null || v === undefined) return { es: "null", en: "null" };
  if (typeof v === "number" && !Number.isInteger(v))
    return {
      es: decimal(v, decimalesDe(v), "es"),
      en: decimal(v, decimalesDe(v), "en"),
    };
  const x = typeof v === "string" ? v : JSON.stringify(v);
  return { es: x, en: x };
}

/**
 * El motivo técnico de una pausa (AU-S3-06): la arista que se cumplió, escrita desde lo que registró la traza y no
 * desde el texto que guardó Python (que en las corridas anteriores al arreglo decía `True`).
 */
export function motivoTecnico(d: DecisionDeArista): TextoBilingue {
  if (d.tipo === "funcion") {
    const ent = d.entradas ?? {};
    const llamada = (i: Idioma) =>
      `${d.funcion ?? "?"}(${Object.keys(ent)
        .sort()
        .map((k) => `${k}=${valorDelMotivo(ent[k])[i]}`)
        .join(", ")})`;
    return MOTIVO_TECNICO.funcion({
      orden: d.orden_arista,
      desde: d.desde,
      llamada: { es: llamada("es"), en: llamada("en") },
    });
  }
  if (d.operador === null || d.senal === null)
    throw new Error(
      `vitrina: la arista ${d.orden_arista} de ${d.desde} es una tripleta sin señal u operador en la traza`,
    );
  return MOTIVO_TECNICO.tripleta({
    orden: d.orden_arista,
    desde: d.desde,
    senal: d.senal,
    observado: valorDelMotivo(d.valor_observado),
    operador: MOTIVO_TECNICO.operador[d.operador],
    declarado: valorDelMotivo(d.valor_declarado),
    aplicado: valorDelMotivo(d.umbral_aplicado),
  });
}
