/**
 * Las solicitudes de persona jurídica del demo B (S9, plan B v1.2, ADR-019): una sociedad con su certificado de
 * existencia y su composición accionaria, sus dueños directos e indirectos y la persona que la controla, con la verdad
 * conocida de sus beneficiarios finales (`beneficiarios.ts`, 31 CFR § 1010.230(d)).
 *
 * Cada subtipo es una plantilla con los porcentajes fijos, porque cada uno prueba un borde que no puede quedar al azar
 * (el 24,99 %, el 25,00 % exacto, dos caminos que suman). El azar con semilla pone los nombres, los documentos, la
 * actividad y la jurisdicción. Los casos de persona natural del lote son los de siempre (`generarCasoB`).
 *
 * El lote `planlang-b-002-20` mezcla 8 jurídicas (una de cada plantilla) y 12 naturales (un bloque de 12 con las
 * proporciones de siempre), barajadas con la semilla del lote.
 */
import type { TextoBilingue } from "../../formatos/bilingue";
import type { Plan } from "../../plan/esquema";
import { crearAzar, type Azar } from "../sfc32";
import { beneficiariosDe } from "./beneficiarios";
import * as D from "./diccionarios";
import {
  DEMO_B,
  SUBTIPOS_JURIDICOS_B,
  type CamposB,
  type CasoB,
  type Estructura,
  type ListasB,
  type LoteB,
  type SubtipoB,
  type SubtipoJuridicoB,
  type VerdadB,
} from "./esquema";
import {
  CATALOGO_B,
  P_ACIERTO,
  composicionDeBloqueB,
  contextoDeLoteB,
  cumple,
  entradasDe,
  generarCasoB,
  ingresos,
  mayuscula,
  nombreDe,
  perfil,
  personaLimpia,
  ruido,
  sellarLoteB,
  umbralDeArista,
  type Contexto,
  type ReglaDeUmbral,
} from "./generador";
import { identidadVerificable, inconsistencias, puntaje } from "./reglas";
import { mejorCoincidencia } from "./similitud";

/** La versión del generador que escribe personas jurídicas (los lotes del S3 siguen en la 1.0.0). */
export const VERSION_GENERADOR_B_JURIDICAS = "1.1.0";
/** El lote con personas jurídicas: 8 jurídicas y 12 naturales. */
export const N_JURIDICAS = SUBTIPOS_JURIDICOS_B.length;
export const N_LOTE_JURIDICAS = 20;

type Rol = Estructura["controla"] extends infer C
  ? C extends { rol: infer R }
    ? R
    : never
  : never;

/** «S» es la sociedad que solicita; «E1», «E2», sociedades intermedias; «P1»…, personas. */
type Ref = string;

interface Plantilla {
  personas: number;
  entidades: number;
  participaciones: readonly (readonly [Ref, Ref, string])[];
  controla: { persona: number; rol: Rol };
  /** La persona que es homónima exacta de una entrada vinculante (otra persona con el mismo nombre). */
  homonimo?: number;
  esperado: TextoBilingue;
}

const tb = (es: string, en: string): TextoBilingue => ({ es, en });

export const PLANTILLAS: Readonly<Record<SubtipoJuridicoB, Plantilla>> = {
  normal_juridica_directa: {
    personas: 2,
    entidades: 0,
    participaciones: [
      ["P1", "S", "60.00"],
      ["P2", "S", "40.00"],
    ],
    controla: { persona: 1, rol: "representante_legal" },
    esperado: tb(
      "Dos socios directos con el 60 % y el 40 %: los dos son beneficiarios finales y quien controla es uno de ellos. Se aprueba sin pausa.",
      "Two direct partners with 60% and 40%: both are beneficial owners and the person in control is one of them. Approved without a pause.",
    ),
  },
  normal_juridica_control_no_dueno: {
    personas: 6,
    entidades: 0,
    participaciones: [
      ["P1", "S", "20.00"],
      ["P2", "S", "20.00"],
      ["P3", "S", "20.00"],
      ["P4", "S", "20.00"],
      ["P5", "S", "20.00"],
    ],
    controla: { persona: 6, rol: "gerente_general" },
    esperado: tb(
      "Cinco socios con el 20 % cada uno: ninguno llega al 25 %, así que el único beneficiario final es quien controla, que no es socio.",
      "Five partners with 20% each: none reaches 25%, so the only beneficial owner is the person in control, who is not a partner.",
    ),
  },
  normal_juridica_cadena_profunda: {
    personas: 4,
    entidades: 2,
    participaciones: [
      ["E1", "S", "80.00"],
      ["P2", "S", "20.00"],
      ["E2", "E1", "75.00"],
      ["P4", "E1", "25.00"],
      ["P1", "E2", "60.00"],
      ["P3", "E2", "40.00"],
    ],
    controla: { persona: 2, rol: "gerente_general" },
    esperado: tb(
      "Una cadena de cuatro niveles: quien tiene el 60 % de la sociedad que tiene el 75 % de la que tiene el 80 % llega al 36 % y es beneficiario final; quien llega al 24 % no lo es.",
      "A four-level chain: whoever holds 60% of the company that holds 75% of the one that holds 80% reaches 36% and is a beneficial owner; whoever reaches 24% is not.",
    ),
  },
  borde_juridica_indirecta_cruza_25: {
    personas: 3,
    entidades: 1,
    participaciones: [
      ["E1", "S", "50.00"],
      ["P3", "S", "50.00"],
      ["P1", "E1", "60.00"],
      ["P2", "E1", "40.00"],
    ],
    controla: { persona: 3, rol: "presidente" },
    esperado: tb(
      "Un socio tiene el 60 % de una sociedad que tiene el 50 %: su participación efectiva es el 30 % y es beneficiario final, aunque no figure como socio directo.",
      "A partner holds 60% of a company that holds 50%: their effective ownership is 30% and they are a beneficial owner, even though they are not a direct partner.",
    ),
  },
  borde_juridica_indirecta_bajo_25: {
    personas: 3,
    entidades: 1,
    participaciones: [
      ["E1", "S", "49.98"],
      ["P3", "S", "50.02"],
      ["P1", "E1", "50.00"],
      ["P2", "E1", "50.00"],
    ],
    controla: { persona: 3, rol: "presidente" },
    esperado: tb(
      "Dos socios tienen la mitad cada uno de una sociedad que tiene el 49,98 %: su participación efectiva es el 24,99 % y no son beneficiarios finales.",
      "Two partners each hold half of a company that holds 49.98%: their effective ownership is 24.99% and they are not beneficial owners.",
    ),
  },
  borde_juridica_exacta_25: {
    personas: 3,
    entidades: 1,
    participaciones: [
      ["P1", "S", "10.00"],
      ["P2", "S", "60.00"],
      ["E1", "S", "30.00"],
      ["P1", "E1", "50.00"],
      ["P3", "E1", "50.00"],
    ],
    controla: { persona: 2, rol: "representante_legal" },
    esperado: tb(
      "Un socio llega exactamente al 25 % sumando su parte directa (10 %) y la indirecta (15 %): la norma dice «25 % o más», así que es beneficiario final.",
      "A partner reaches exactly 25% by adding their direct share (10%) and their indirect one (15%): the rule says “25 percent or more”, so they are a beneficial owner.",
    ),
  },
  borde_juridica_dos_caminos: {
    personas: 4,
    entidades: 2,
    participaciones: [
      ["E1", "S", "40.00"],
      ["E2", "S", "40.00"],
      ["P2", "S", "20.00"],
      ["P1", "E1", "30.00"],
      ["P3", "E1", "70.00"],
      ["P1", "E2", "35.00"],
      ["P4", "E2", "65.00"],
    ],
    controla: { persona: 2, rol: "presidente" },
    esperado: tb(
      "Un socio llega al 26 % solo sumando dos caminos (12 % y 14 %): es beneficiario final aunque ningún camino por sí solo llegue al 25 %.",
      "A partner reaches 26% only by adding two paths (12% and 14%): they are a beneficial owner even though no single path reaches 25%.",
    ),
  },
  adversario_juridica_beneficiario_homonimo: {
    personas: 2,
    entidades: 0,
    participaciones: [
      ["P1", "S", "70.00"],
      ["P2", "S", "30.00"],
    ],
    controla: { persona: 2, rol: "representante_legal" },
    homonimo: 1,
    esperado: tb(
      "Un socio con el 70 % se llama igual que una persona de la lista vinculante, pero es otra persona: el caso va al oficial, que aprueba.",
      "A partner with 70% has the same name as someone on the binding list, but is a different person: the case goes to the officer, who approves.",
    ),
  },
};

const TIPO_DE: Readonly<Record<SubtipoJuridicoB, CasoB["tipo"]>> = {
  normal_juridica_directa: "normal",
  normal_juridica_control_no_dueno: "normal",
  normal_juridica_cadena_profunda: "normal",
  borde_juridica_indirecta_cruza_25: "borde",
  borde_juridica_indirecta_bajo_25: "borde",
  borde_juridica_exacta_25: "borde",
  borde_juridica_dos_caminos: "borde",
  adversario_juridica_beneficiario_homonimo: "adversario",
};

export const esJuridico = (s: SubtipoB): s is SubtipoJuridicoB =>
  (SUBTIPOS_JURIDICOS_B as readonly string[]).includes(s);

/** Un número de seis cifras que no se repite en el caso. */
function numeroNuevo(azar: Azar, usados: Set<string>, prefijo: string): string {
  for (;;) {
    const id = `${prefijo}-${azar.entero(100000, 999999)}`;
    if (!usados.has(id)) {
      usados.add(id);
      return id;
    }
  }
}

/** Una razón social que no se repite y que no se parece a nadie de las listas. */
function razonSocial(azar: Azar, ctx: Contexto, usadas: Set<string>): string {
  for (let intento = 0; intento < 200; intento++) {
    const nombre = `${azar.elegir(D.GIROS_SOCIEDAD)} ${azar.elegir(D.NUCLEOS_SOCIEDAD)} ${D.SUFIJO_SOCIEDAD}`;
    if (usadas.has(nombre)) continue;
    const c = mejorCoincidencia(nombre, ctx.listas);
    if (c === null || !cumple(ctx.u.zona_gris, c.similitud)) {
      usadas.add(nombre);
      return nombre;
    }
  }
  throw new Error("no se encontró una razón social libre bajo la zona gris");
}

const porcentajeEs = (p: string): string => `${p.replace(".", ",")} %`;
const porcentajeEn = (p: string): string => `${p}%`;

/** Una solicitud de persona jurídica con su verdad conocida. */
export function generarCasoJuridicoB(
  ctx: Contexto,
  subtipo: SubtipoJuridicoB,
  id: string,
  uBeneficiario: ReglaDeUmbral,
): CasoB {
  const pl = PLANTILLAS[subtipo];
  const tipo = TIPO_DE[subtipo];
  const azar = crearAzar(`${ctx.semilla}/caso/${id}`);
  const usados = new Set<string>();
  const razones = new Set<string>();

  // Las sociedades: la que solicita y las intermedias.
  const sociedad = {
    nit: numeroNuevo(azar, usados, "SYN-NIT"),
    nombre: razonSocial(azar, ctx, razones),
  };
  const intermedias = Array.from({ length: pl.entidades }, () => ({
    nit: numeroNuevo(azar, usados, "SYN-NIT"),
    nombre: razonSocial(azar, ctx, razones),
  }));
  // Las personas: limpias (bajo la zona gris), salvo la homónima de una entrada vinculante.
  const nombres = new Set<string>();
  const personas = Array.from({ length: pl.personas }, (_, i) => {
    let nombre: string;
    if (pl.homonimo === i + 1)
      nombre = azar.elegir(entradasDe(ctx, true)).nombre;
    else
      do nombre = nombreDe(personaLimpia(azar, ctx));
      while (nombres.has(nombre));
    nombres.add(nombre);
    return { documento: numeroNuevo(azar, usados, "SYN-ID"), nombre };
  });
  const ref = (r: Ref): { id: string; nombre: string; esPersona: boolean } => {
    if (r === "S")
      return { id: sociedad.nit, nombre: sociedad.nombre, esPersona: false };
    if (r.startsWith("E")) {
      const e = intermedias[Number(r.slice(1)) - 1]!;
      return { id: e.nit, nombre: e.nombre, esPersona: false };
    }
    const p = personas[Number(r.slice(1)) - 1]!;
    return { id: p.documento, nombre: p.nombre, esPersona: true };
  };
  const quienControla = personas[pl.controla.persona - 1]!;
  const estructura: Estructura = {
    entidad: sociedad.nit,
    entidades: [sociedad, ...intermedias],
    personas,
    participaciones: pl.participaciones.map(([t, p, porcentaje]) => ({
      titular: ref(t).id,
      participada: ref(p).id,
      porcentaje,
    })),
    controla: { documento: quienControla.documento, rol: pl.controla.rol },
  };
  const calculo = beneficiariosDe(estructura);
  if (!calculo.valida || calculo.beneficiarios === null)
    throw new Error(
      `${id}: la plantilla ${subtipo} no da una estructura válida`,
    );

  // La sociedad como solicitante: los mismos campos que una persona, leídos para una sociedad.
  const pf = perfil(azar, ctx, "normal_limpio");
  const actividad = azar.elegir(
    D.ACTIVIDADES.filter((a) => a.riesgo === pf.act),
  );
  const jurFondos = azar.elegir(
    D.JURISDICCIONES.filter((j) => j.riesgo === pf.jur),
  );
  const ingreso = ingresos(azar, actividad.ingreso_tipico, pf.coherente, false);
  const origen = azar.elegir(D.ORIGENES_FONDOS_SOCIEDAD);
  const anios = azar.entero(2, 15);
  const constitucion = azar.entero(1990, 2010);
  const jurConst = azar.elegir(ctx.listas.jurisdicciones);
  const solicitud = {
    id: `SYN-SOL-${azar.entero(100000, 999999)}`,
    producto: azar.elegir(["cuenta_corriente", "credito_de_consumo"] as const),
    tipo_solicitante: "juridica" as const,
  };
  const unidad = ctx.listas.unidad_de_ingreso;
  const identidad = tb(
    `Certificado de existencia y representación legal (sintético). Razón social: ${sociedad.nombre}. NIT sintético ${sociedad.nit}. Constituida en ${constitucion} en ${jurConst.nombre.es}.`,
    `Certificate of incorporation and legal representation (synthetic). Company name: ${sociedad.nombre}. Synthetic tax ID ${sociedad.nit}. Incorporated in ${constitucion} in ${jurConst.nombre.en}.`,
  );
  const actividadDoc = tb(
    `Declaración de actividad económica de la sociedad. ${mayuscula(actividad.nombre.es)} desde hace ${anios} años. Sus ingresos son de ${ingreso} ${unidad.es}. Firma la sociedad con el NIT ${sociedad.nit}.`,
    `Statement of the company's economic activity. ${mayuscula(actividad.nombre.en)} for ${anios} years. Its income is ${ingreso} ${unidad.en}. Signed by the company with tax ID ${sociedad.nit}.`,
  );
  const fondos = tb(
    `Declaración de origen de fondos. Los fondos vienen de ${origen.es} ${jurFondos.lugar.es}. Titular de los fondos: ${sociedad.nombre}.`,
    `Source-of-funds statement. The funds come from ${origen.en} ${jurFondos.lugar.en}. Holder of the funds: ${sociedad.nombre}.`,
  );
  const lineas = pl.participaciones.map(([t, p, porcentaje]) => {
    const quien = ref(t);
    const de = ref(p);
    return tb(
      `${quien.nombre} (${quien.esPersona ? "documento sintético" : "NIT sintético"} ${quien.id}) tiene el ${porcentajeEs(porcentaje)} de ${de.nombre}.`,
      `${quien.nombre} (${quien.esPersona ? "synthetic document" : "synthetic tax ID"} ${quien.id}) holds ${porcentajeEn(porcentaje)} of ${de.nombre}.`,
    );
  });
  const rol = D.ROLES_DE_CONTROL_TEXTO[pl.controla.rol]!;
  const existencia = tb(
    [
      `Composición accionaria de ${sociedad.nombre} (NIT sintético ${sociedad.nit}).`,
      ...lineas.map((l) => l.es),
      `Persona que controla la sociedad: ${quienControla.nombre} (documento sintético ${quienControla.documento}), ${rol.es}.`,
    ].join(" "),
    [
      `Shareholding of ${sociedad.nombre} (synthetic tax ID ${sociedad.nit}).`,
      ...lineas.map((l) => l.en),
      `Person in control of the company: ${quienControla.nombre} (synthetic document ${quienControla.documento}), ${rol.en}.`,
    ].join(" "),
  );

  const campos: CamposB = {
    nombre: sociedad.nombre,
    documento: sociedad.nit,
    nacimiento: constitucion,
    nacionalidad: jurConst.codigo,
    actividad: actividad.codigo,
    ingresos_mensuales: ingreso,
    jurisdiccion_fondos: jurFondos.codigo,
    titular_actividad: sociedad.nit,
    titular_fondos: sociedad.nombre,
  };

  // Verdad conocida: las mismas reglas que una persona, más los beneficiarios y su cruce con las listas.
  const coinc = mejorCoincidencia(sociedad.nombre, ctx.listas);
  const nInc = inconsistencias(campos).length;
  const p = puntaje(campos, ctx.listas).total;
  if (!identidadVerificable(campos))
    throw new Error(`${id}: una sociedad del generador siempre es verificable`);
  const porNombre = new Map(personas.map((x) => [x.documento, x.nombre]));
  const coincidenBeneficiarios = calculo.beneficiarios.some((doc) => {
    const c = mejorCoincidencia(porNombre.get(doc)!, ctx.listas);
    return c !== null && cumple(uBeneficiario, c.similitud);
  });
  const motivos: VerdadB["motivos_escalamiento"] = [];
  if (coincidenBeneficiarios) motivos.push("coincidencia_en_lista");
  if (cumple(ctx.u.escalamiento, p)) motivos.push("puntaje_en_o_sobre_U2");
  if (cumple(ctx.u.inconsistencias, nInc))
    motivos.push("inconsistencias_sobre_U3");
  const verdad: VerdadB = {
    campos,
    decision: "aprobar",
    debe_escalar: motivos.length > 0,
    motivos_escalamiento: motivos,
    en_lista: false,
    en_lista_vinculante: false,
    entrada_lista: null,
    similitud_max: coinc ? coinc.similitud : 0,
    conclusion_investigador: null,
    puntaje_riesgo: p,
    inconsistencias: nInc,
    reglas: ["RV-03"],
    tipo_solicitante: "juridica",
    estructura,
    beneficiarios: calculo.beneficiarios,
  };

  // Lo que responderá el proveedor simulado: a veces se le escapa la última participación de la sociedad.
  const extraidos = azar.probabilidad(P_ACIERTO[tipo])
    ? campos
    : ruido(azar, campos, ctx);
  let estructuraExtraida = estructura;
  if (!azar.probabilidad(P_ACIERTO[tipo])) {
    const ultima = estructura.participaciones
      .map((x) => x.participada)
      .lastIndexOf(sociedad.nit);
    estructuraExtraida = {
      ...estructura,
      participaciones: estructura.participaciones.filter(
        (_, i) => i !== ultima,
      ),
    };
  }

  const homonima = pl.homonimo ? personas[pl.homonimo - 1]! : null;
  const lineaHomonima = pl.homonimo
    ? lineas[pl.participaciones.findIndex(([t]) => t === `P${pl.homonimo}`)]!
    : null;
  return {
    id,
    demo_id: DEMO_B,
    tipo,
    subtipo,
    adversario_detalle: tipo === "adversario" ? "homonimo" : null,
    adversario:
      homonima && lineaHomonima
        ? {
            vector: "existencia",
            carga: lineaHomonima,
            intenta: tb(
              "Que el agente apruebe sin mirar a un dueño que se llama como una persona sancionada, o que lo rechace sin que decida una persona.",
              "To get the agent to approve without looking at an owner who has a sanctioned person's name, or to reject without a person deciding.",
            ),
          }
        : null,
    entrada: {
      solicitud,
      documentos: { identidad, actividad: actividadDoc, fondos, existencia },
    },
    verdad_conocida: verdad,
    esperado: pl.esperado,
    identificadores_sinteticos: [
      sociedad.nit,
      sociedad.nombre,
      solicitud.id,
      ...intermedias.flatMap((e) => [e.nit, e.nombre]),
      ...personas.flatMap((x) => [x.documento, x.nombre]),
    ],
    simulacion: {
      campos_extraidos: extraidos,
      conclusion_investigador: "homonimo",
      estructura_extraida: estructuraExtraida,
    },
    semilla: ctx.semilla,
    version_generador: VERSION_GENERADOR_B_JURIDICAS,
  };
}

export interface OpcionesLoteJuridicoB {
  semilla: string;
  n: number;
  plan: Plan;
  listas: ListasB;
}

/**
 * El lote con personas jurídicas: 8 (una por plantilla) y 12 naturales de un bloque de 12, barajados. Exige un plan
 * con la arista de los beneficiarios (B v1.2): su umbral decide qué coincidencia de un dueño escala.
 */
export async function generarLoteJuridicoB(
  op: OpcionesLoteJuridicoB,
): Promise<LoteB> {
  if (op.n !== N_LOTE_JURIDICAS)
    throw new RangeError(
      `la receta de personas jurídicas tiene ${N_LOTE_JURIDICAS} casos`,
    );
  const ctx = contextoDeLoteB(op);
  const uBeneficiario = umbralDeArista(
    op.plan,
    "decision",
    "similitud_beneficiarios_max",
    {
      mismaSenal: false,
    },
  );
  const naturales = composicionDeBloqueB(
    crearAzar(`${op.semilla}/bloque/0`),
    0,
    op.n - N_JURIDICAS,
  );
  const subtipos: SubtipoB[] = crearAzar(`${op.semilla}/mezcla`).barajar([
    ...naturales,
    ...SUBTIPOS_JURIDICOS_B,
  ]);
  const casos = subtipos.map((s, i) => {
    const id = `B-${String(i + 1).padStart(3, "0")}`;
    return esJuridico(s)
      ? generarCasoJuridicoB(ctx, s, id, uBeneficiario)
      : {
          ...generarCasoB(ctx, s as keyof typeof CATALOGO_B, id),
          version_generador: VERSION_GENERADOR_B_JURIDICAS,
        };
  });
  return sellarLoteB(
    op,
    "juridicas",
    op.n,
    null,
    casos,
    VERSION_GENERADOR_B_JURIDICAS,
    D.AFIRMACION_PRIVACIDAD_JURIDICAS,
  );
}
