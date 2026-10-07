/**
 * Validador de identificadores (E-11 · RF-03.4 · legal F13). Recorre cualquier valor JSON y reporta
 * todo lo que PAREZCA un identificador real:
 *  - cédula en rango real (1–99.999.999 y NUIP 1.000.000.000–1.999.999.999; Circular RNEC 001/2023);
 *  - NIT con dígito de verificación VÁLIDO (módulo 11 con pesos primos; algoritmo de fuentes secundarias);
 *  - los identificadores de HIPAA 45 CFR § 164.514(b)(2) con formato realista: SSN, teléfono (salvo el
 *    rango ficticio 555-01XX), correo y URL (salvo dominios reservados example.*, .test, .invalid),
 *    IP (salvo rangos de documentación), fechas con día y mes, edad > 89, direcciones, placas; y el
 *    comodín «cualquier otro número identificador»: todo campo identificador debe llevar prefijo SYN-.
 *  - nombres de persona fuera de los diccionarios cerrados del generador (del A: afiliado, médico, prestador; del
 *    B: entradas de las listas, campos extraídos y titulares, sin distinguir mayúsculas porque un modelo real puede
 *    devolver el nombre en otra caja).
 * Si algo aparece, el conjunto no se publica: el test que lo corre sobre `data/` y `runs/` es un gate.
 */
import * as D from "./diccionarios";
import { VOCABULARIO_PERSONAS_B } from "./demo-b/diccionarios";
import { normalizarNombre } from "./demo-b/similitud";

export type ReglaIdentificador =
  | "cedula_rango_real"
  | "nit_dv_valido"
  | "hipaa_ssn"
  | "hipaa_telefono"
  | "hipaa_correo"
  | "hipaa_url"
  | "hipaa_ip"
  | "hipaa_fecha"
  | "hipaa_edad_mayor_89"
  | "hipaa_direccion"
  | "hipaa_placa"
  | "identificador_sin_prefijo_sintetico"
  | "nombre_fuera_de_lista";

export interface HallazgoIdentificador {
  regla: ReglaIdentificador;
  ruta: string;
  fragmento: string;
}

const PESOS_NIT = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

/** Dígito de verificación del NIT (DIAN, módulo 11 con pesos primos desde la derecha). */
export function dvNit(base: string): number {
  if (!/^\d{1,15}$/.test(base))
    throw new RangeError(`base de NIT inválida: ${base}`);
  let suma = 0;
  const digitos = base.split("").reverse();
  digitos.forEach((d, i) => {
    suma += Number(d) * (PESOS_NIT[i] as number);
  });
  const r = suma % 11;
  return r < 2 ? r : 11 - r;
}

export function enRangoRealDeCedula(n: number): boolean {
  return (
    (n >= 1 && n <= 99_999_999) || (n >= 1_000_000_000 && n <= 1_999_999_999)
  );
}

const MESES_ES =
  "enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre";
const MESES_EN =
  "january|february|march|april|may|june|july|august|september|october|november|december";

const DOMINIO_RESERVADO =
  /(^|\.)(example\.(com|org|net)|example|test|invalid|localhost)$/;
const IP_DOCUMENTACION = [/^192\.0\.2\./, /^198\.51\.100\./, /^203\.0\.113\./];
const TELEFONO_FICTICIO = /^(\+1[\s-]?)?555-01\d{2}$/;

interface Regla {
  regla: ReglaIdentificador | null;
  patron: RegExp;
  /** Devuelve la regla a reportar, o null si el fragmento es aceptable (se consume igual). */
  juzgar: (m: RegExpExecArray) => ReglaIdentificador | null;
}

const digitos = (s: string): string => s.replace(/\D/g, "");

/** En orden: una coincidencia consume su tramo y las reglas siguientes no lo vuelven a juzgar. */
const REGLAS_TEXTO: readonly Regla[] = [
  {
    regla: "hipaa_ssn",
    patron: /(?<![\w-])\d{3}-\d{2}-\d{4}(?![\w-])/g,
    juzgar: () => "hipaa_ssn",
  },
  {
    regla: "nit_dv_valido",
    patron: /(?<![\w.-])(\d{3})\.?(\d{3})\.?(\d{3})\s?-\s?(\d)(?![\w-])/g,
    juzgar: (m) =>
      dvNit(`${m[1]}${m[2]}${m[3]}`) === Number(m[4]) ? "nit_dv_valido" : null,
  },
  {
    regla: "cedula_rango_real",
    patron:
      /(?:\bc\.\s?c\.?|\bcc\b|\bc[eé]dula(?:\s+de\s+ciudadan[ií]a)?|\bnuip\b|\bdocumento(?:\s+de\s+identidad)?|\bnational\s+id\b|\bid\s+number\b)\s*(?:n[oº°]\.?|n[uú]mero|number|#)?\s*:?\s*(\d{1,3}(?:[.\s]?\d{3}){0,3})(?![\w-])/giu,
    juzgar: (m) =>
      enRangoRealDeCedula(Number(digitos(m[1] ?? "")))
        ? "cedula_rango_real"
        : null,
  },
  {
    regla: "cedula_rango_real",
    patron: /(?<![\w.-])\d{1,3}(?:\.\d{3}){2,3}(?![\w-]|\.\d)/g,
    juzgar: (m) =>
      enRangoRealDeCedula(Number(digitos(m[0]))) ? "cedula_rango_real" : null,
  },
  {
    regla: "hipaa_ip",
    patron: /(?<![\w.])(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?![\w.])/g,
    juzgar: (m) => {
      const octetos = [m[1], m[2], m[3], m[4]].map(Number);
      if (octetos.some((o) => o > 255)) return null;
      return IP_DOCUMENTACION.some((r) => r.test(m[0])) ? null : "hipaa_ip";
    },
  },
  {
    regla: "hipaa_correo",
    patron: /[\p{L}\p{N}._%+-]+@([\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+)/gu,
    juzgar: (m) =>
      DOMINIO_RESERVADO.test((m[1] ?? "").toLowerCase())
        ? null
        : "hipaa_correo",
  },
  {
    regla: "hipaa_url",
    patron: /\b(?:https?:\/\/|www\.)([^\s"'<>/:?#]+)[^\s"'<>]*/giu,
    juzgar: (m) => {
      const host = (m[1] ?? "").toLowerCase().replace(/^www\./, "");
      return DOMINIO_RESERVADO.test(host) ? null : "hipaa_url";
    },
  },
  {
    regla: "hipaa_fecha",
    patron: new RegExp(
      [
        String.raw`(?<!\d)\d{4}-\d{2}-\d{2}(?!\d)`,
        String.raw`(?<!\d)\d{1,2}[/-]\d{1,2}[/-]\d{2,4}(?!\d)`,
        String.raw`\b\d{1,2}\s+de\s+(?:${MESES_ES})\b`,
        String.raw`\b(?:${MESES_EN})\s+\d{1,2}(?:st|nd|rd|th)?\b`,
        String.raw`\b\d{1,2}\s+(?:${MESES_EN})\b`,
      ].join("|"),
      "giu",
    ),
    juzgar: () => "hipaa_fecha",
  },
  {
    regla: "hipaa_direccion",
    patron:
      /\b(?:calle|carrera|cra\.?|cl\.?|avenida|av\.?|diagonal|dg\.?|transversal|tv\.?)\s*\d+\s*[a-z]?\s*(?:#|n[oº°]\.?)\s*\d+/giu,
    juzgar: () => "hipaa_direccion",
  },
  {
    regla: "hipaa_direccion",
    patron:
      /\b\d{1,5}\s+(?:[A-Z][a-z]+\s+){1,3}(?:Street|St\.|Avenue|Ave\.|Road|Rd\.|Boulevard|Blvd\.|Lane|Ln\.)(?!\w)/gu,
    juzgar: () => "hipaa_direccion",
  },
  {
    regla: "hipaa_placa",
    patron: /(?<![\w-])(?!SYN)[A-Z]{3}[- ]?\d{3}(?![\w-])/g,
    juzgar: () => "hipaa_placa",
  },
  {
    regla: "hipaa_telefono",
    patron: /(?<![\w-])\+?\(?\d[\d\s().-]{5,}\d(?![\w-])/g,
    juzgar: (m) => {
      const n = digitos(m[0]).length;
      if (n < 7 || n > 15) return null;
      return TELEFONO_FICTICIO.test(m[0].trim()) ? null : "hipaa_telefono";
    },
  },
];

/** Hallazgos en una cadena de texto libre. */
export function hallazgosEnTexto(
  texto: string,
  ruta: string,
): HallazgoIdentificador[] {
  const consumidos: [number, number][] = [];
  const solapa = (a: number, b: number) =>
    consumidos.some(([x, y]) => a < y && x < b);
  const salida: HallazgoIdentificador[] = [];
  for (const r of REGLAS_TEXTO) {
    r.patron.lastIndex = 0;
    for (let m = r.patron.exec(texto); m !== null; m = r.patron.exec(texto)) {
      const inicio = m.index;
      const fin = inicio + m[0].length;
      if (m[0].length === 0) {
        r.patron.lastIndex++;
        continue;
      }
      if (solapa(inicio, fin)) continue;
      const veredicto = r.juzgar(m);
      if (veredicto === null && r.regla === "hipaa_telefono") {
        const n = digitos(m[0]).length;
        if (n < 7 || n > 15) continue; // no era un teléfono: no consume
      }
      consumidos.push([inicio, fin]);
      if (veredicto) salida.push({ regla: veredicto, ruta, fragmento: m[0] });
    }
  }
  return salida;
}

/** Campos que por nombre son identificadores y deben llevar prefijo sintético. */
const CLAVES_IDENTIFICADOR = new Set([
  "documento",
  "historia_clinica",
  "registro",
  "nit",
  "numero_afiliacion",
  "titular_actividad",
]);
const PREFIJO_SINTETICO = /^SYN-[A-Z]+-[0-9A-Z-]+$/;

const VOCABULARIO_PERSONAS = new Set<string>([
  ...D.NOMBRES_F,
  ...D.NOMBRES_M,
  ...D.APELLIDOS,
  ...D.TITULOS_MEDICO,
]);
const PRESTADORES = new Set<string>(D.PRESTADORES);

/** Demo B: claves que llevan el nombre de una persona y los padres donde aparecen. */
const CLAVES_NOMBRE_B = new Set(["nombre", "titular_fondos", "alias"]);
const PADRES_NOMBRE_B = new Set(["entradas", "campos", "campos_extraidos"]);
/** Sin tildes ni mayúsculas (la normalización de la similitud): un modelo que devuelve «SORBELIN» no inventó a nadie. */
const VOCABULARIO_B = new Set(VOCABULARIO_PERSONAS_B.map(normalizarNombre));

function nombreEnListaB(nombre: string): boolean {
  const tokens = normalizarNombre(nombre)
    .split(" ")
    .filter((t) => t.length > 0);
  return tokens.length > 0 && tokens.every((t) => VOCABULARIO_B.has(t));
}

function nombreEnLista(padre: string | undefined, nombre: string): boolean {
  if (padre === "prestador") return PRESTADORES.has(nombre);
  return nombre.split(/\s+/).every((p) => VOCABULARIO_PERSONAS.has(p));
}

/**
 * Claves de METADATO que se saltan: la huella y las fechas de la ejecución o de verificación de una
 * norma. HIPAA protege fechas de una PERSONA; una fecha dentro de un texto del caso sigue disparando.
 */
const CLAVES_METADATO = new Set([
  "huella",
  "fecha",
  "aprobado_el",
  "verificada",
  "vigencia",
]);

/** Recorre un valor JSON completo (lote, plan de beneficios, traza) y devuelve todos los hallazgos. */
export function validarIdentificadores(
  valor: unknown,
  ruta = "$",
  clave?: string,
  padre?: string,
): HallazgoIdentificador[] {
  if (clave !== undefined && CLAVES_METADATO.has(clave)) return [];
  if (typeof valor === "string") {
    const salida: HallazgoIdentificador[] = [];
    if (
      clave !== undefined &&
      CLAVES_IDENTIFICADOR.has(clave) &&
      !PREFIJO_SINTETICO.test(valor) &&
      // Demo B: un modelo puede escribir un NOMBRE donde iba un documento (la línea base del lote real lo hizo).
      // Si el nombre entero sale del diccionario cerrado, no es un identificador real; uno de fuera sigue en rojo.
      !(
        padre !== undefined &&
        PADRES_NOMBRE_B.has(padre) &&
        nombreEnListaB(valor)
      )
    )
      salida.push({
        regla: "identificador_sin_prefijo_sintetico",
        ruta,
        fragmento: valor,
      });
    if (
      clave === "nombre" &&
      (padre === "afiliado" || padre === "medico" || padre === "prestador") &&
      !nombreEnLista(padre, valor)
    )
      salida.push({ regla: "nombre_fuera_de_lista", ruta, fragmento: valor });
    if (
      clave !== undefined &&
      CLAVES_NOMBRE_B.has(clave) &&
      padre !== undefined &&
      PADRES_NOMBRE_B.has(padre) &&
      !nombreEnListaB(valor)
    )
      salida.push({ regla: "nombre_fuera_de_lista", ruta, fragmento: valor });
    return [...salida, ...hallazgosEnTexto(valor, ruta)];
  }
  if (typeof valor === "number") {
    if (clave === "edad" && valor > 89)
      return [{ regla: "hipaa_edad_mayor_89", ruta, fragmento: String(valor) }];
    return [];
  }
  if (Array.isArray(valor))
    return valor.flatMap((v, i) =>
      validarIdentificadores(v, `${ruta}[${i}]`, clave, padre),
    );
  if (valor !== null && typeof valor === "object")
    return Object.keys(valor)
      .sort()
      .flatMap((k) =>
        validarIdentificadores(
          (valor as Record<string, unknown>)[k],
          `${ruta}.${k}`,
          k,
          clave,
        ),
      );
  return [];
}
