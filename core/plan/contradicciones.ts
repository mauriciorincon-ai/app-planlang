/**
 * Contradicciones de un plan en borrador (M2, RF-02.5): lo que el entrevistador señala por código antes de que el
 * usuario apruebe. No reemplaza a M1 (`validarPlan`), que decide si el plan es un contrato completo; aquí se nombran
 * las incoherencias que M1 deja pasar (un riesgo grave sin criterio que lo controle, una pausa que ningún umbral
 * activa, un umbral que no mueve ninguna arista, un texto en un solo idioma, un supuesto que el verificador no podrá
 * decidir, una línea base exigida que nada mide) y lo que la entrevista dejó pendiente.
 *
 * Trabaja sobre un borrador que puede no pasar el esquema todavía (un umbral sin valor, una sección vacía): lee con
 * cuidado y no lanza. Determinista: mismo borrador → mismas contradicciones en el mismo orden.
 */
import type { TextoBilingue } from "../formatos/bilingue";
import {
  CLAVES_DECIDIBLES,
  COMPARACION_LINEA_BASE,
  familiaDeSupuesto,
} from "./supuesto-medible";

/** Marca de un texto que la entrevista no pudo redactar (el otro idioma sin modelo, p. ej.). La escribe Python. */
export const MARCA_PENDIENTE = "⟨pendiente · pending⟩";

/** RF-02.5: «un riesgo de severidad 9 sin criterio que lo controle». */
export const SEVERIDAD_QUE_EXIGE_CRITERIO = 9;

export const CODIGOS_CONTRADICCION = [
  "SEVERIDAD_SIN_CRITERIO",
  "PAUSA_SIN_UMBRAL",
  "UMBRAL_SIN_SENAL",
  "UMBRAL_SIN_ARISTA",
  "CRITERIO_SIN_REGLA",
  "SOLO_UN_IDIOMA",
  "SUPUESTO_NO_DECIDIBLE",
  "SIN_LINEA_BASE",
  "PENDIENTE",
] as const;
export type CodigoContradiccion = (typeof CODIGOS_CONTRADICCION)[number];

export interface Contradiccion {
  codigo: CodigoContradiccion;
  elemento: string;
  mensaje: TextoBilingue;
}

/** Una pregunta que la entrevista dejó pendiente (sale de la transcripción). */
export interface PreguntaPendiente {
  id: string;
  seccion: string;
}

type Objeto = Record<string, unknown>;
const esObjeto = (v: unknown): v is Objeto =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const lista = (v: unknown): Objeto[] =>
  Array.isArray(v) ? v.filter(esObjeto) : [];
const texto = (v: unknown): string => (typeof v === "string" ? v : "");
const objetoOVacio = (v: unknown): Objeto => (esObjeto(v) ? v : {});
const REFERENCIA_UMBRAL = /^umbral\.([A-Za-z0-9_-]+)$/;
const CONDICIONALES = new Set(["todos_cumplen", "pass^k", "tasa"]);

function c(
  codigo: CodigoContradiccion,
  elemento: string,
  es: string,
  en: string,
): Contradiccion {
  return { codigo, elemento, mensaje: { es, en } };
}

/** Las rutas de todo texto que lleva la marca de pendiente, en orden de recorrido. */
export function rutasPendientes(valor: unknown, ruta = ""): string[] {
  if (typeof valor === "string")
    return valor.includes(MARCA_PENDIENTE) ? [ruta || "$"] : [];
  if (Array.isArray(valor))
    return valor.flatMap((v, i) => rutasPendientes(v, `${ruta}[${i}]`));
  if (esObjeto(valor))
    return Object.keys(valor).flatMap((k) =>
      rutasPendientes(valor[k], ruta ? `${ruta}.${k}` : k),
    );
  return [];
}

/**
 * `comandoRetomar` es el comando que retoma la entrevista de ESTE plan (lo arma quien sabe de qué demo es: la revisión
 * lo deriva del `plan_id`); sin él, las pendientes dicen solo «retómala en la entrevista» (AU-S3-24).
 */
export function contradicciones(
  borrador: unknown,
  pendientes: readonly PreguntaPendiente[] = [],
  comandoRetomar?: string,
): Contradiccion[] {
  const plan = esObjeto(borrador) ? borrador : {};
  const riesgos = lista(plan.riesgos);
  const criterios = lista(plan.criterios_aceptacion);
  const umbrales = lista(plan.umbrales);
  const contrato = esObjeto(plan.contrato_de_grafo)
    ? plan.contrato_de_grafo
    : {};
  const aristas = lista(contrato.aristas_condicionales);
  const senales = new Set(
    (Array.isArray(contrato.senales_obligatorias_en_traza)
      ? contrato.senales_obligatorias_en_traza
      : []
    ).map(texto),
  );
  const salida: Contradiccion[] = [];

  // 1. Riesgo de severidad ≥ 9 sin criterio que diga controlarlo.
  const controlados = new Set(
    criterios.flatMap((k) =>
      Array.isArray(k.riesgos_controlados)
        ? k.riesgos_controlados.map(texto)
        : [],
    ),
  );
  for (const r of riesgos) {
    const sev = typeof r.severidad === "number" ? r.severidad : 0;
    const id = texto(r.id);
    if (sev >= SEVERIDAD_QUE_EXIGE_CRITERIO && !controlados.has(id))
      salida.push(
        c(
          "SEVERIDAD_SIN_CRITERIO",
          id,
          `El riesgo ${id} tiene severidad ${sev} y ningún criterio de aceptación dice controlarlo.`,
          `Risk ${id} has severity ${sev} and no acceptance criterion claims to control it.`,
        ),
      );
  }

  // Qué umbral lee cada arista: por su valor `umbral.X`, o por la señal de un umbral (tripleta o entrada de función).
  const porSenal = new Map<string, string[]>();
  for (const u of umbrales) {
    const s = texto(u.senal);
    if (s) porSenal.set(s, [...(porSenal.get(s) ?? []), texto(u.id)]);
  }
  const idsUmbral = new Set(umbrales.map((u) => texto(u.id)));
  const umbralesDeArista = (a: Objeto): string[] => {
    const ids: string[] = [];
    const m = REFERENCIA_UMBRAL.exec(texto(a.valor));
    if (m && idsUmbral.has(m[1]!)) ids.push(m[1]!);
    const funcion = esObjeto(a.funcion) ? a.funcion : null;
    const leidas = funcion
      ? (Array.isArray(funcion.entradas) ? funcion.entradas : []).map(texto)
      : [];
    for (const s of leidas) ids.push(...(porSenal.get(s) ?? []));
    return ids;
  };

  // 2. Pausa humana que ninguna arista ligada a un umbral activa.
  for (const p of lista(contrato.pausas_humanas)) {
    const nodo = texto(p.nodo);
    const activada = aristas.some(
      (a) => texto(a.si_verdadero) === nodo && umbralesDeArista(a).length > 0,
    );
    if (!activada)
      salida.push(
        c(
          "PAUSA_SIN_UMBRAL",
          nodo,
          `La pausa humana «${nodo}» no la activa ninguna arista ligada a un umbral: nadie podrá moverla en el playground.`,
          `Human pause “${nodo}” is not triggered by any edge tied to a threshold: no one will be able to move it in the playground.`,
        ),
      );
  }

  // 3 y 4. Umbral sin señal registrada; umbral que ninguna arista lee.
  const leidos = new Set(aristas.flatMap(umbralesDeArista));
  for (const u of umbrales) {
    const id = texto(u.id);
    const s = texto(u.senal);
    if (!s || s.includes(MARCA_PENDIENTE) || !senales.has(s))
      salida.push(
        c(
          "UMBRAL_SIN_SENAL",
          id,
          s
            ? `El umbral ${id} usa la señal «${s}», que el contrato no exige registrar en la traza.`
            : `El umbral ${id} no declara la señal que el agente tiene que registrar.`,
          s
            ? `Threshold ${id} uses signal “${s}”, which the contract does not require in the trace.`
            : `Threshold ${id} declares no signal for the agent to record.`,
        ),
      );
    if (!leidos.has(id))
      salida.push(
        c(
          "UMBRAL_SIN_ARISTA",
          id,
          `Ninguna arista del contrato lee el umbral ${id}: moverlo no cambiaría ningún caso.`,
          `No contract edge reads threshold ${id}: moving it would change no case.`,
        ),
      );
  }

  // 5. Criterio sin regla de medición que se pueda calcular.
  for (const k of criterios) {
    const id = texto(k.id);
    const r = esObjeto(k.regla_de_medicion) ? k.regla_de_medicion : null;
    const agregacion = r ? texto(r.agregacion) : "";
    const falta = !r
      ? "regla"
      : !texto(r.poblacion)
        ? "poblacion"
        : CONDICIONALES.has(agregacion)
          ? texto(r.condicion)
            ? null
            : "condicion"
          : texto(r.metrica)
            ? null
            : "metrica";
    if (falta)
      salida.push(
        c(
          "CRITERIO_SIN_REGLA",
          id,
          `El criterio ${id} no tiene ${falta === "regla" ? "regla de medición" : `«${falta}» en su regla de medición`}: no se podrá medir.`,
          `Criterion ${id} has no ${falta === "regla" ? "measurement rule" : `“${falta}” in its measurement rule`}: it cannot be measured.`,
        ),
      );
  }

  // 6. Textos que el plan lleva en un solo idioma (regla 20, M-25): la vitrina en inglés los mostraría en español.
  for (const [elemento, rutas] of textosDeUnIdioma(plan))
    salida.push(
      c(
        "SOLO_UN_IDIOMA",
        elemento,
        `${elemento} tiene ${rutas.length} texto(s) en un solo idioma (${rutas.join(", ")}): cada texto del plan se redacta en español y en inglés.`,
        `${elemento} has ${rutas.length} text(s) in a single language (${rutas.join(", ")}): every plan text is written in Spanish and in English.`,
      ),
    );

  // 7. Supuesto que el verificador no podrá decidir: su umbral de confirmación usa claves que no sabe leer.
  const supuestos = lista(plan.supuestos);
  for (const s of supuestos) {
    const m = esObjeto(s.medible_en_trazas) ? s.medible_en_trazas : null;
    if (!m) continue;
    const familia = familiaDeSupuesto({
      comparacion: texto(m.comparacion) || undefined,
      metricas: Array.isArray(m.metricas) ? m.metricas.map(texto) : [],
    });
    const decidibles = CLAVES_DECIDIBLES[familia];
    const claves = Object.keys(objetoOVacio(m.umbral_confirmacion));
    const ajenas = claves.filter((k) => !decidibles.includes(k));
    // La comparación con la línea base sin claves usa la regla por defecto («no peor»): se decide igual.
    const sinUmbral = claves.length === 0 && familia !== "linea_base";
    if (ajenas.length > 0 || sinUmbral) {
      const id = texto(s.id);
      const lista_ = decidibles.join(", ");
      salida.push(
        c(
          "SUPUESTO_NO_DECIDIBLE",
          id,
          sinUmbral
            ? `El supuesto ${id} no declara umbral de confirmación: el verificador lo medirá pero nunca lo confirmará ni lo refutará. Claves que sabe decidir: ${lista_}.`
            : `El supuesto ${id} declara su umbral con ${ajenas.join(", ")}, que el verificador no sabe decidir: quedará «sin probar». Claves que sabe decidir: ${lista_}.`,
          sinUmbral
            ? `Assumption ${id} declares no confirmation threshold: the verifier will measure it but never confirm or refute it. Keys it can decide: ${lista_}.`
            : `Assumption ${id} declares its threshold with ${ajenas.join(", ")}, which the verifier cannot decide: it will stay “untested”. Keys it can decide: ${lista_}.`,
        ),
      );
    }
  }

  // 8. El contrato exige una línea base de agente único (regla dura 10) y ningún supuesto la compara.
  const lineaBase = objetoOVacio(contrato.linea_base);
  const comparada = supuestos.some(
    (s) =>
      texto(objetoOVacio(s.medible_en_trazas).comparacion) ===
      COMPARACION_LINEA_BASE,
  );
  if (lineaBase.agente_unico === true && !comparada)
    salida.push(
      c(
        "SIN_LINEA_BASE",
        "contrato_de_grafo.linea_base",
        "El contrato exige una línea base de agente único y ningún supuesto la compara con el multiagente: el informe no podrá decir si la arquitectura rinde.",
        "The contract requires a single-agent baseline and no assumption compares it with the multi-agent: the report will not be able to say whether the architecture pays off.",
      ),
    );

  // 9. Lo que la entrevista dejó pendiente: preguntas sin respuesta útil, umbrales sin valor y textos sin redactar.
  for (const p of pendientes)
    salida.push(
      c(
        "PENDIENTE",
        p.id,
        comandoRetomar
          ? `La pregunta ${p.id} (${p.seccion}) quedó pendiente: retómala con «${comandoRetomar}».`
          : `La pregunta ${p.id} (${p.seccion}) quedó pendiente: retómala en la entrevista.`,
        comandoRetomar
          ? `Question ${p.id} (${p.seccion}) is pending: resume it with “${comandoRetomar}”.`
          : `Question ${p.id} (${p.seccion}) is pending: resume it in the interview.`,
      ),
    );
  for (const u of umbrales)
    if (u.valor_en_plan === null || u.valor_en_plan === undefined)
      salida.push(
        c(
          "PENDIENTE",
          `${texto(u.id)}.valor_en_plan`,
          `El umbral ${texto(u.id)} no tiene valor: lo fija el usuario.`,
          `Threshold ${texto(u.id)} has no value: the user sets it.`,
        ),
      );
  for (const ruta of rutasPendientes(plan))
    salida.push(
      c(
        "PENDIENTE",
        ruta,
        `El texto de ${ruta} quedó sin redactar.`,
        `The text at ${ruta} was left unwritten.`,
      ),
    );
  return salida;
}

/**
 * Los campos de texto libre del plan (los que el esquema aún acepta como cadena por los planes anteriores a la v1.3
 * del A) que llegaron en un solo idioma, agrupados por el elemento que los contiene (D1, R3, U2…).
 */
function textosDeUnIdioma(plan: Objeto): [string, string[]][] {
  const grupos: [string, string[]][] = [];
  const anotar = (elemento: string, rutas: string[]) => {
    if (rutas.length > 0) grupos.push([elemento, rutas]);
  };
  const cadenas = (o: Objeto, campos: readonly string[], prefijo: string) =>
    campos
      .filter((k) => typeof o[k] === "string")
      .map((k) => `${prefijo}${k}`);
  for (const d of lista(plan.decisiones))
    anotar(texto(d.id), [
      ...lista(d.opciones).flatMap((o, i) =>
        cadenas(o, ["nombre", "pros", "contras"], `opciones[${i}].`),
      ),
      ...cadenas(d, ["opcion_elegida"], ""),
    ]);
  for (const r of lista(plan.riesgos))
    anotar(texto(r.id), [
      ...lista(r.mitigaciones).flatMap((m, i) =>
        cadenas(
          m,
          ["accion", "momento", "efecto_esperado"],
          `mitigaciones[${i}].`,
        ),
      ),
      ...cadenas(r, ["no_detectable_en_trazas"], ""),
    ]);
  for (const u of lista(plan.umbrales))
    anotar(texto(u.id), cadenas(u, ["unidad"], ""));
  return grupos;
}
