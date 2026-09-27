/**
 * Mini-lenguaje de condiciones del plan (criterios, detectores de riesgo, supuestos).
 *
 * El plan es el contrato: las reglas de medición se escriben como texto en el plan y este módulo
 * las interpreta, de modo que el verificador no lleva reglas «a medida» por criterio. El validador
 * del plan (fase 1) parsea toda condición al cargar; una condición que no parsea rechaza el plan.
 *
 * Gramática (precedencia de menor a mayor):
 *   implica := or ( "IMPLICA" implica )?                 (asociativa a la derecha)
 *   or      := and ( "OR" and )*
 *   and     := not ( "AND" not )*
 *   not     := "NOT" not | comparacion
 *   comparacion := suma ( ("=="|"!="|"<"|"<="|">"|">=") suma
 *                       | "IN" lista | "CONTIENE" suma )?
 *   suma    := primario                                  (sin aritmética: las señales ya vienen calculadas)
 *   primario := numero | cadena | true | false | null | lista | identificador ( "(" args ")" )? | "(" implica ")"
 *   identificador := letra (letra | dígito | "_" | ".")*   → ruta con puntos: `extraccion.campos`, `umbral.U2`
 *
 * Semántica:
 *   - Un identificador que no existe en el contexto es un ERROR de evaluación (`ErrorEvaluacion`),
 *     no `false`: así una señal faltante se reporta como brecha (M9), no como cumplimiento.
 *   - Una señal que existe pero vale `null` (el nodo que la escribe no corrió en ese caso: p. ej. la
 *     confianza del extractor en una urgencia) lanza `ErrorNulo` al ordenarla, negarla o buscar en ella.
 *     El verificador lo distingue: en una POBLACIÓN significa «no aplica»; en una CONDICIÓN, «no evaluable».
 *     Una ruta que atraviesa un `null` (`extraccion.costo_estimado` sin extracción) vale `null`.
 *   - Comparar con `==`/`!=` dos objetos con claves distintas, o un objeto con un escalar, lanza
 *     `ErrorComparacionSospechosa`: esa comparación es siempre desigual y casi siempre un error del plan
 *     (comparar la extracción entera con sus campos). El verificador marca la regla como mal formada.
 *   - `==`/`!=` comparan en profundidad (por JCS) cuando algún lado es objeto o lista.
 *   - `a CONTIENE b`: a cadena y b cadena → subcadena; a cadena y b lista → alguna subcadena;
 *     a lista y b escalar → pertenencia; a lista y b lista → TODOS los elementos de b están en a.
 *   - `a IN [..]` → pertenencia. `NOT`, `AND`, `OR`, `IMPLICA` sobre booleanos (un no-booleano es error).
 *   - Funciones: solo las registradas en el contexto (p. ej. `identificador_sintetico(caso)`).
 */
import { jcs, type JsonValor } from "../formatos/jcs";

// ---------------------------------------------------------------- Tokens

type Token =
  | { tipo: "num"; valor: number }
  | { tipo: "str"; valor: string }
  | { tipo: "id"; valor: string }
  | { tipo: "op"; valor: string }
  | {
      tipo: "kw";
      valor:
        | "AND"
        | "OR"
        | "NOT"
        | "IN"
        | "CONTIENE"
        | "IMPLICA"
        | "true"
        | "false"
        | "null";
    }
  | { tipo: "fin" };

const PALABRAS: ReadonlySet<string> = new Set([
  "AND",
  "OR",
  "NOT",
  "IN",
  "CONTIENE",
  "IMPLICA",
  "true",
  "false",
  "null",
]);

export class ErrorSintaxis extends Error {
  constructor(
    mensaje: string,
    public readonly posicion: number,
  ) {
    super(`posición ${posicion}: ${mensaje}`);
    this.name = "ErrorSintaxis";
  }
}

export class ErrorEvaluacion extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorEvaluacion";
  }
}

/** Un identificador que no existe en el contexto: una señal que falta en la traza. */
export class ErrorIdentificador extends ErrorEvaluacion {
  constructor(public readonly ruta: string) {
    super(`identificador desconocido: ${ruta}`);
    this.name = "ErrorIdentificador";
  }
}

/** Una señal presente pero nula donde se necesitaba un valor (ver la cabecera). */
export class ErrorNulo extends ErrorEvaluacion {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorNulo";
  }
}

/** `==`/`!=` entre estructuras que no pueden ser iguales (ver la cabecera). */
export class ErrorComparacionSospechosa extends ErrorEvaluacion {
  constructor(
    public readonly clavesIzq: string,
    public readonly clavesDer: string,
  ) {
    super(
      `se comparan estructuras distintas: {${clavesIzq}} vs {${clavesDer}}`,
    );
    this.name = "ErrorComparacionSospechosa";
  }
}

function esLetra(c: string): boolean {
  return /[A-Za-z_]/.test(c);
}
function esIdent(c: string): boolean {
  return /[A-Za-z0-9_.]/.test(c);
}

export function tokenizar(texto: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < texto.length) {
    const c = texto[i] as string;
    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i++;
      continue;
    }
    if (c === "'" || c === '"') {
      const cierre = c;
      let j = i + 1;
      let valor = "";
      while (j < texto.length && texto[j] !== cierre) {
        valor += texto[j];
        j++;
      }
      if (j >= texto.length) throw new ErrorSintaxis("cadena sin cerrar", i);
      tokens.push({ tipo: "str", valor });
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(c) || (c === "-" && /[0-9]/.test(texto[i + 1] ?? ""))) {
      const m = /^-?[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?/.exec(texto.slice(i));
      if (!m) throw new ErrorSintaxis("número malformado", i);
      tokens.push({ tipo: "num", valor: Number(m[0]) });
      i += m[0].length;
      continue;
    }
    if (esLetra(c)) {
      let j = i;
      while (j < texto.length && esIdent(texto[j] as string)) j++;
      const palabra = texto.slice(i, j);
      if (PALABRAS.has(palabra))
        tokens.push({
          tipo: "kw",
          valor: palabra as Extract<Token, { tipo: "kw" }>["valor"],
        });
      else tokens.push({ tipo: "id", valor: palabra });
      i = j;
      continue;
    }
    const dos = texto.slice(i, i + 2);
    if (dos === "==" || dos === "!=" || dos === "<=" || dos === ">=") {
      tokens.push({ tipo: "op", valor: dos });
      i += 2;
      continue;
    }
    if ("<>()[],".includes(c)) {
      tokens.push({ tipo: "op", valor: c });
      i++;
      continue;
    }
    throw new ErrorSintaxis(`carácter inesperado «${c}»`, i);
  }
  tokens.push({ tipo: "fin" });
  return tokens;
}

// ---------------------------------------------------------------- AST

export type Nodo =
  | { tipo: "literal"; valor: JsonValor }
  | { tipo: "lista"; elementos: Nodo[] }
  | { tipo: "id"; ruta: string }
  | { tipo: "llamada"; nombre: string; args: Nodo[] }
  | { tipo: "no"; operando: Nodo }
  | {
      tipo: "binario";
      op:
        | "AND"
        | "OR"
        | "IMPLICA"
        | "=="
        | "!="
        | "<"
        | "<="
        | ">"
        | ">="
        | "IN"
        | "CONTIENE";
      izq: Nodo;
      der: Nodo;
    };

class Parser {
  private pos = 0;
  constructor(private readonly tokens: Token[]) {}

  private ver(): Token {
    return this.tokens[this.pos] as Token;
  }
  private avanzar(): Token {
    return this.tokens[this.pos++] as Token;
  }
  private esKw(v: string): boolean {
    const t = this.ver();
    return t.tipo === "kw" && t.valor === v;
  }
  private esOp(v: string): boolean {
    const t = this.ver();
    return t.tipo === "op" && t.valor === v;
  }
  private esperarOp(v: string): void {
    if (!this.esOp(v)) throw new ErrorSintaxis(`se esperaba «${v}»`, this.pos);
    this.avanzar();
  }

  parsear(): Nodo {
    const n = this.implica();
    if (this.ver().tipo !== "fin")
      throw new ErrorSintaxis("texto sobrante tras la expresión", this.pos);
    return n;
  }
  private implica(): Nodo {
    const izq = this.or();
    if (this.esKw("IMPLICA")) {
      this.avanzar();
      return { tipo: "binario", op: "IMPLICA", izq, der: this.implica() };
    }
    return izq;
  }
  private or(): Nodo {
    let izq = this.and();
    while (this.esKw("OR")) {
      this.avanzar();
      izq = { tipo: "binario", op: "OR", izq, der: this.and() };
    }
    return izq;
  }
  private and(): Nodo {
    let izq = this.not();
    while (this.esKw("AND")) {
      this.avanzar();
      izq = { tipo: "binario", op: "AND", izq, der: this.not() };
    }
    return izq;
  }
  private not(): Nodo {
    if (this.esKw("NOT")) {
      this.avanzar();
      return { tipo: "no", operando: this.not() };
    }
    return this.comparacion();
  }
  private comparacion(): Nodo {
    const izq = this.primario();
    const t = this.ver();
    if (
      t.tipo === "op" &&
      ["==", "!=", "<", "<=", ">", ">="].includes(t.valor)
    ) {
      this.avanzar();
      return {
        tipo: "binario",
        op: t.valor as "==",
        izq,
        der: this.primario(),
      };
    }
    if (t.tipo === "kw" && (t.valor === "IN" || t.valor === "CONTIENE")) {
      this.avanzar();
      return { tipo: "binario", op: t.valor, izq, der: this.primario() };
    }
    return izq;
  }
  private primario(): Nodo {
    const t = this.avanzar();
    switch (t.tipo) {
      case "num":
        return { tipo: "literal", valor: t.valor };
      case "str":
        return { tipo: "literal", valor: t.valor };
      case "kw":
        if (t.valor === "true") return { tipo: "literal", valor: true };
        if (t.valor === "false") return { tipo: "literal", valor: false };
        if (t.valor === "null") return { tipo: "literal", valor: null };
        throw new ErrorSintaxis(
          `palabra reservada «${t.valor}» fuera de lugar`,
          this.pos - 1,
        );
      case "id":
        if (this.esOp("(")) {
          this.avanzar();
          const args: Nodo[] = [];
          if (!this.esOp(")")) {
            args.push(this.implica());
            while (this.esOp(",")) {
              this.avanzar();
              args.push(this.implica());
            }
          }
          this.esperarOp(")");
          return { tipo: "llamada", nombre: t.valor, args };
        }
        return { tipo: "id", ruta: t.valor };
      case "op":
        if (t.valor === "(") {
          const n = this.implica();
          this.esperarOp(")");
          return n;
        }
        if (t.valor === "[") {
          const elementos: Nodo[] = [];
          if (!this.esOp("]")) {
            elementos.push(this.implica());
            while (this.esOp(",")) {
              this.avanzar();
              elementos.push(this.implica());
            }
          }
          this.esperarOp("]");
          return { tipo: "lista", elementos };
        }
        throw new ErrorSintaxis(
          `operador «${t.valor}» inesperado`,
          this.pos - 1,
        );
      case "fin":
        throw new ErrorSintaxis("expresión incompleta", this.pos - 1);
    }
  }
}

export function parsear(texto: string): Nodo {
  if (texto.trim().length === 0) throw new ErrorSintaxis("condición vacía", 0);
  return new Parser(tokenizar(texto)).parsear();
}

/** Identificadores (rutas) y funciones que una condición usa — para validar referencias al cargar. */
export function referencias(nodo: Nodo): {
  rutas: string[];
  funciones: string[];
} {
  const rutas = new Set<string>();
  const funciones = new Set<string>();
  const visitar = (n: Nodo): void => {
    switch (n.tipo) {
      case "id":
        rutas.add(n.ruta);
        break;
      case "llamada":
        funciones.add(n.nombre);
        n.args.forEach(visitar);
        break;
      case "lista":
        n.elementos.forEach(visitar);
        break;
      case "no":
        visitar(n.operando);
        break;
      case "binario":
        visitar(n.izq);
        visitar(n.der);
        break;
      case "literal":
        break;
    }
  };
  visitar(nodo);
  return { rutas: [...rutas].sort(), funciones: [...funciones].sort() };
}

// ---------------------------------------------------------------- Evaluación

export type Funcion = (...args: JsonValor[]) => JsonValor;

export interface Contexto {
  /** Devuelve el valor de una ruta con puntos, o `undefined` si no existe. */
  resolver: (ruta: string) => JsonValor | undefined;
  funciones?: Record<string, Funcion>;
}

/** Contexto a partir de un objeto anidado (`a.b.c` → `obj.a.b.c`). */
export function contextoDesdeObjeto(
  obj: Record<string, JsonValor>,
  funciones?: Record<string, Funcion>,
): Contexto {
  return {
    resolver: (ruta) => {
      let actual: JsonValor | undefined = obj;
      for (const parte of ruta.split(".")) {
        if (actual === null) return null;
        if (typeof actual !== "object" || Array.isArray(actual))
          return undefined;
        actual = (actual as Record<string, JsonValor>)[parte];
        if (actual === undefined) return undefined;
      }
      return actual;
    },
    funciones,
  };
}

function esObjeto(v: JsonValor): v is { [clave: string]: JsonValor } {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function clavesDe(v: { [clave: string]: JsonValor }): string {
  return Object.keys(v).sort().join(", ");
}

function iguales(a: JsonValor, b: JsonValor): boolean {
  if (a === null || b === null) return a === b;
  if (esObjeto(a) || esObjeto(b)) {
    const izq = esObjeto(a) ? clavesDe(a) : "";
    const der = esObjeto(b) ? clavesDe(b) : "";
    if (!esObjeto(a) || !esObjeto(b) || izq !== der)
      throw new ErrorComparacionSospechosa(izq, der);
  }
  if (typeof a === "object" || typeof b === "object") return jcs(a) === jcs(b);
  return a === b;
}

function booleano(v: JsonValor, op: string): boolean {
  if (v === null) throw new ErrorNulo(`${op} sobre una señal nula`);
  if (typeof v !== "boolean")
    throw new ErrorEvaluacion(`${op} exige booleanos; se recibió ${typeof v}`);
  return v;
}

function numero(v: JsonValor, op: string): number {
  if (v === null) throw new ErrorNulo(`${op} sobre una señal nula`);
  if (typeof v !== "number")
    throw new ErrorEvaluacion(`${op} exige números; se recibió ${typeof v}`);
  return v;
}

function contiene(a: JsonValor, b: JsonValor): boolean {
  if (a === null || b === null)
    throw new ErrorNulo("CONTIENE sobre una señal nula");
  if (typeof a === "string") {
    if (typeof b === "string") return a.includes(b);
    if (Array.isArray(b))
      return b.some((x) => typeof x === "string" && a.includes(x));
    throw new ErrorEvaluacion(
      "CONTIENE sobre cadena exige cadena o lista de cadenas",
    );
  }
  if (Array.isArray(a)) {
    if (Array.isArray(b)) return b.every((x) => a.some((y) => iguales(x, y)));
    return a.some((y) => iguales(b, y));
  }
  throw new ErrorEvaluacion("CONTIENE exige cadena o lista a la izquierda");
}

export function evaluar(nodo: Nodo, ctx: Contexto): JsonValor {
  switch (nodo.tipo) {
    case "literal":
      return nodo.valor;
    case "lista":
      return nodo.elementos.map((e) => evaluar(e, ctx));
    case "id": {
      const v = ctx.resolver(nodo.ruta);
      if (v === undefined) throw new ErrorIdentificador(nodo.ruta);
      return v;
    }
    case "llamada": {
      const f = ctx.funciones?.[nodo.nombre];
      if (!f) throw new ErrorEvaluacion(`función desconocida: ${nodo.nombre}`);
      return f(...nodo.args.map((a) => evaluar(a, ctx)));
    }
    case "no":
      return !booleano(evaluar(nodo.operando, ctx), "NOT");
    case "binario": {
      if (nodo.op === "AND")
        return (
          booleano(evaluar(nodo.izq, ctx), "AND") &&
          booleano(evaluar(nodo.der, ctx), "AND")
        );
      if (nodo.op === "OR")
        return (
          booleano(evaluar(nodo.izq, ctx), "OR") ||
          booleano(evaluar(nodo.der, ctx), "OR")
        );
      if (nodo.op === "IMPLICA") {
        const a = booleano(evaluar(nodo.izq, ctx), "IMPLICA");
        return !a || booleano(evaluar(nodo.der, ctx), "IMPLICA");
      }
      const a = evaluar(nodo.izq, ctx);
      const b = evaluar(nodo.der, ctx);
      switch (nodo.op) {
        case "==":
          return iguales(a, b);
        case "!=":
          return !iguales(a, b);
        case "<":
          return numero(a, "<") < numero(b, "<");
        case "<=":
          return numero(a, "<=") <= numero(b, "<=");
        case ">":
          return numero(a, ">") > numero(b, ">");
        case ">=":
          return numero(a, ">=") >= numero(b, ">=");
        case "IN":
          if (b === null) throw new ErrorNulo("IN sobre una lista nula");
          if (!Array.isArray(b))
            throw new ErrorEvaluacion("IN exige una lista a la derecha");
          return b.some((x) => iguales(a, x));
        case "CONTIENE":
          return contiene(a, b);
      }
    }
  }
}

/** Evalúa una condición esperando un booleano. */
export function evaluarBooleano(texto: string, ctx: Contexto): boolean {
  const v = evaluar(parsear(texto), ctx);
  if (typeof v !== "boolean")
    throw new ErrorEvaluacion(`la condición «${texto}» no produjo un booleano`);
  return v;
}
