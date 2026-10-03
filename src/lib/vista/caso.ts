/**
 * Vista de P6 Caso: un caso de punta a punta desde su traza (`planlang-trace/v1`, verificada con la corrida), su
 * caso sintético (texto, orden, afiliado, verdad conocida) y el plan. El relato, lo que hizo cada nodo y por qué
 * tomó cada rama se arman con las plantillas de `src/textos/caso.ts`: nada de un caso se escribe a mano. Pura.
 */
import type { Idioma, TextoBilingue } from "@core/formatos/bilingue";
import { z } from "zod";
import {
  AclaracionTrazaSchema,
  CasosEjemplaresSchema,
  DocumentoAdversoVistaSchema,
  leerParaVista,
  PayloadPausaSchema,
} from "@/lib/datos/esquemas";
import type { DatosDemo } from "@/lib/datos/vitrina";
import { ruta } from "@/lib/ruta";
import { VALORES } from "@/textos/agente";
import {
  CABECERA,
  CAMPO,
  CIFRAS,
  DOCUMENTO,
  EJEMPLAR,
  ENTREGA,
  FICHA,
  HACE,
  HIZO,
  MOTIVO,
  PAUSA,
  PORTADA,
  RAMA,
  RECIBE,
  RECORRIDO,
  RELATO,
  SALIDA,
  SENALES,
  SI_NO,
  SUBTIPO,
  PIE_CASO,
} from "@/textos/caso";
import { decimal, entero, enumerar } from "./formato";
import { pausaUnica } from "./plan-comun";
import {
  categoriaDeRegla,
  reglaDeLaPausa,
  textoDeCategoria,
} from "./motivo-pausa";
import type { Fila } from "./agente";

export interface ChipCaso {
  id: string;
  descriptor: string;
  enlace: string;
}

export interface FilaRegla {
  n: number;
  senal: string;
  regla: string;
  observado: string;
  cumple: boolean;
  rama: string | null;
  funcion: boolean;
}

export interface PasoCaso {
  n: number;
  nodo: string;
  tipo: string;
  medida: string;
  hizo: string;
  dialogo: Array<{ pregunta: string; respuesta: string }>;
  tecnico: string;
  rama: string | null;
  reglas: FilaRegla[];
}

export interface VistaCaso {
  id: string;
  descriptor: string;
  ejemplar: string | null;
  aprobado: boolean;
  veredicto: string;
  persona: boolean;
  personaTexto: string;
  coincide: boolean;
  coincideTexto: string;
  debia: string;
  paso: string;
  recibe: {
    /** El texto del médico partido para marcar la instrucción escondida (índices impares). */
    texto: string[];
    orden: string;
    afiliado: string;
  };
  hace: {
    sub: string;
    nodos: Array<{ nombre: string; tipo: string }>;
    relato: string;
  };
  entrega: Array<{ titulo: string; detalle?: string }>;
  cifras: Array<{ cifra: string; texto: string }>;
  ficha: Fila[];
  pasos: PasoCaso[];
  pausa: {
    porQue: string;
    motivoTecnico: string;
    senal: string;
    evidencia: string[];
    contraevidencia: string[];
    leyo: string;
    respuesta: string;
    nota: string;
  } | null;
  salida: { respuesta: string; aviso: string; guardia: Fila[] };
  documento: {
    encabezado: string;
    filas: Array<Fila & { nota?: string }>;
    aviso: string;
    completo: string;
  } | null;
  senales: Fila[];
  senalesTitulo: string;
}

const X = (t: TextoBilingue, i: Idioma) => t[i];

/** Un nodo de la traza que no está en el grafo publicado ni trae su tipo: la página no lo dibuja sin glifo (AU-S2-16). */
function sinTipo(nodo: string): never {
  throw new Error(
    `vitrina: el nodo «${nodo}» de la traza no está en el grafo de la corrida ni trae su tipo`,
  );
}

/** El documento de decisión adversa como lo escribe el grafo (`planlang-documento-adverso/v1`). */
const OPERADOR: Record<string, string> = {
  menor_que: "<",
  menor_o_igual_que: "≤",
  mayor_que: ">",
  mayor_o_igual_que: "≥",
  igual_a: "=",
  distinto_de: "≠",
};

/**
 * Un valor de la traza como se lee: booleanos en palabras, decimales con coma en español, listas con flechas. Las
 * cadenas quedan como las escribió el código (`ambulatoria`, `negar`) en los dos idiomas, como en la maqueta: se
 * comparan contra la regla del plan, que también está en código.
 */
function valorLeido(v: unknown, i: Idioma): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return X(v ? SI_NO.si : SI_NO.no, i);
  if (typeof v === "number")
    return Number.isInteger(v) ? String(v) : decimal(v, 2, i);
  if (Array.isArray(v)) return v.map(String).join(" → ");
  return String(v);
}

/** El valor como lo declara la regla (código: `true`, `urgencia`, `U1 = 0,75`). */
function valorDeclarado(
  declarado: unknown,
  aplicado: unknown,
  i: Idioma,
): string {
  if (typeof declarado === "string" && declarado.startsWith("umbral."))
    return `${declarado.slice("umbral.".length)} = ${
      typeof aplicado === "number" && !Number.isInteger(aplicado)
        ? decimal(aplicado, 2, i)
        : String(aplicado)
    }`;
  return String(declarado);
}

/** Los 20 casos para el selector, en el orden de la corrida. */
export function chipsDeCasos(d: DatosDemo, i: Idioma): ChipCaso[] {
  const casos = new Map(d.lote.casos.map((c) => [c.id, c]));
  return d.corrida.trazas.map((t) => {
    const c = casos.get(t.caso_id)!;
    return {
      id: t.caso_id,
      descriptor: X(SUBTIPO[c.subtipo] ?? { es: c.subtipo, en: c.subtipo }, i),
      enlace: ruta(i, "caso", t.caso_id),
    };
  });
}

export function idsDeCasos(d: DatosDemo): string[] {
  return d.corrida.trazas.map((t) => t.caso_id);
}

/** El pie de las páginas que leen la corrida (Casos, Plan): qué corrida, de qué sprint, cuántos casos y con qué modelo. */
export function pieDeCorrida(d: DatosDemo, i: Idioma): string {
  return X(
    PIE_CASO({
      corrida: d.corrida.manifiesto.corrida_id,
      sprint: d.manifiesto.corrida.sprint,
      fecha: d.corrida.manifiesto.fecha,
      n: d.corrida.trazas.length,
      repeticiones: 1 + d.manifiesto.repeticiones.length,
      base: d.manifiesto.linea_base !== null,
      modelo: d.corrida.manifiesto.modelo,
    }),
    i,
  );
}

export function portadaCasos(d: DatosDemo, i: Idioma) {
  return {
    antetitulo: X(PORTADA.antetitulo(d.corrida.manifiesto.corrida_id), i),
    antetituloIndice: X(
      PORTADA.antetituloIndice({
        corrida: d.corrida.manifiesto.corrida_id,
        n: d.corrida.trazas.length,
      }),
      i,
    ),
    pie: pieDeCorrida(d, i),
  };
}

export function vistaCaso(d: DatosDemo, id: string, i: Idioma): VistaCaso {
  const t = d.corrida.trazas.find((x) => x.caso_id === id);
  const c = d.lote.casos.find((x) => x.id === id);
  if (!t || !c) throw new Error(`vitrina: la corrida no trae el caso «${id}»`);
  const s = t.senales;
  const final = String(s.decision_final);
  const aprobado = final === "aprobar";
  const persona = s.pausa_humana === true;
  const v = c.verdad_conocida;
  const coincide = final === v.decision && persona === v.debe_escalar;
  const pb = d.planBeneficios;
  const tipoDe = new Map(
    d.plan.contrato_de_grafo.nodos_esperados.map(
      (n) => [n.id, n.tipo] as const,
    ),
  );
  const decisionTb = (x: string): TextoBilingue =>
    VALORES[x] ?? { es: x, en: x };
  const ex = t.extraccion;
  const conf = ex ? decimal(ex.confianza, 2, i) : "—";
  const cob = (t.cobertura ?? {}) as Record<string, unknown>;
  const e = c.entrada;
  const mujer = e.afiliado.sexo === "F";
  const servicio = pb.procedimientos.find(
    (p) => p.codigo === e.orden_adjunta.codigo_procedimiento,
  )?.nombre ?? {
    es: e.orden_adjunta.codigo_procedimiento,
    en: e.orden_adjunta.codigo_procedimiento,
  };

  // ── ejemplar del informe ──────────────────────────────────────────────────────────────────────────
  const ejemplares =
    leerParaVista(
      CasosEjemplaresSchema,
      (d.informe as { casos_ejemplares?: unknown }).casos_ejemplares,
      "casos_ejemplares del informe",
    ) ?? {};
  const ejemplar = Object.entries(ejemplares).find(
    ([, x]) => x?.caso_id === id,
  )?.[0];

  // ── la instrucción escondida, marcada ───────────────────────────────────────────────────────────
  const texto = e.texto_medico[i];
  const carga = c.adversario?.carga[i];
  const partes =
    carga && texto.includes(carga)
      ? [
          texto.slice(0, texto.indexOf(carga)),
          carga,
          texto.slice(texto.indexOf(carga) + carga.length),
        ]
      : [texto];

  // ── los pasos ────────────────────────────────────────────────────────────────────────────────────
  const reglasDelPlan = (nodo: string) =>
    d.plan.contrato_de_grafo.aristas_condicionales.filter(
      (a) => a.desde === nodo,
    ).length;
  let visitaExtractor = 0;
  let ciclo = 0;
  const aclaraciones = leerParaVista(
    z.array(AclaracionTrazaSchema),
    t.aclaraciones,
    `las aclaraciones de ${id}`,
  );
  const pasos: PasoCaso[] = t.pasos.map((p) => {
    const tokens = p.tokens.entrada + p.tokens.salida;
    const dec = t.decisiones_de_arista
      .filter((x) => x.paso === p.orden)
      .sort((a, b) => a.orden_arista - b.orden_arista);
    const decisora = dec.find((x) => x.resultado);
    const reglas: FilaRegla[] = dec.map((x, k) => ({
      n: x.orden_arista,
      senal:
        x.tipo === "funcion"
          ? `${x.funcion}(${Object.keys(x.entradas ?? {}).join(", ")})`
          : String(x.senal),
      regla:
        x.tipo === "funcion"
          ? X(RECORRIDO.funcion, i)
          : `${OPERADOR[String(x.operador)] ?? x.operador} ${valorDeclarado(x.valor_declarado, x.umbral_aplicado, i)}`,
      observado:
        x.tipo === "funcion"
          ? Object.entries(x.entradas ?? {})
              .map(([kk, vv]) => `${kk} = ${String(vv)}`)
              .join(", ")
          : valorLeido(x.valor_observado, i),
      cumple: x.resultado === true,
      rama:
        x === decisora || (!decisora && k === dec.length - 1)
          ? x.rama_tomada
          : null,
      funcion: x.tipo === "funcion",
    }));
    const nodo = p.nodo;
    let hizo = "";
    const dialogo: PasoCaso["dialogo"] = [];
    switch (nodo) {
      case "enrutador":
        hizo = X(HIZO.enrutador(decisionTb(String(s.tipo_atencion))), i);
        break;
      case "extractor":
        hizo = X(
          p.error_proveedor !== null
            ? HIZO.sinRespuesta(p.error_proveedor)
            : visitaExtractor === 0
              ? HIZO.extractor
              : HIZO.extractorOtraVez,
          i,
        );
        visitaExtractor++;
        break;
      case "aclaracion": {
        const a = aclaraciones[ciclo];
        ciclo++;
        hizo = X(
          p.error_proveedor !== null
            ? HIZO.sinRespuesta(p.error_proveedor)
            : HIZO.aclaracion(a?.ciclo ?? ciclo),
          i,
        );
        if (a) dialogo.push({ pregunta: a.pregunta, respuesta: a.respuesta });
        break;
      }
      case "verificador_cobertura":
        hizo = X(
          HIZO.verificador({
            estado: decisionTb(String(cob.estado_servicio)),
            causal: (cob.causal as string | null) ?? null,
            propuesta: decisionTb(String(cob.propuesta)),
          }),
          i,
        );
        break;
      case "decision":
        hizo = X(HIZO.decision(reglasDelPlan("decision")), i);
        break;
      case "pausa_humana":
        hizo = X(
          HIZO.pausa(
            decisionTb(
              String(
                pausaUnica(t.pausas_humanas, `el caso ${t.caso_id}`)
                  ?.respuesta_simulada.decision,
              ),
            ),
          ),
          i,
        );
        break;
      case "redactor":
        hizo = X(HIZO.redactor(t.documento_adverso !== null), i);
        break;
      case "guardia_salida":
        hizo = X(
          HIZO.guardia({
            hallazgos: t.guardia_salida?.hallazgos.length ?? 0,
            severidad: t.guardia_salida?.severidad_accion ?? 0,
          }),
          i,
        );
        break;
    }
    let rama: string | null = null;
    if (dec.length) {
      const r = RAMA[nodo as keyof typeof RAMA] as
        Record<string, TextoBilingue> | undefined;
      if (r)
        rama = X(
          textoDeCategoria(
            r,
            decisora ? categoriaDeRegla(decisora) : "defecto",
            `RAMA.${nodo} (src/textos/caso.ts)`,
          ),
          i,
        );
    }
    return {
      n: p.orden,
      nodo,
      tipo: tipoDe.get(nodo) ?? p.tipo_nodo ?? sinTipo(nodo),
      medida:
        tokens > 0
          ? X(
              RECORRIDO.medida({
                s: decimal(p.duracion_ms / 1000, 1, i),
                tokens: entero(tokens, i),
              }),
              i,
            )
          : X(RECORRIDO.sinModelo, i),
      hizo,
      dialogo,
      tecnico: X(
        RECORRIDO.tecnico({
          tipo: p.tipo_nodo ?? "—",
          entrada: p.tokens.entrada,
          salida: p.tokens.salida,
          ms: p.duracion_ms,
          usd: p.costo_nominal_usd.toFixed(6),
          reintentos: p.reintentos_esquema,
        }),
        i,
      ),
      rama,
      reglas,
    };
  });

  // ── el relato ────────────────────────────────────────────────────────────────────────────────────
  const pausa = pausaUnica(t.pausas_humanas, `el caso ${t.caso_id}`);
  const motivoPausa = (): TextoBilingue =>
    textoDeCategoria(
      MOTIVO,
      categoriaDeRegla(
        reglaDeLaPausa(
          t.caso_id,
          pausa?.payload.motivo,
          t.decisiones_de_arista,
        ),
      ),
      "MOTIVO (src/textos/caso.ts)",
    );
  const visito = (n: string) => t.nodos_visitados.includes(n);
  const relato: string[] = [
    X(RELATO.pidio({ servicio, mujer, edad: e.afiliado.edad }), i),
  ];
  if (!visito("extractor"))
    relato.push(
      X(s.tipo_atencion === "urgencia" ? RELATO.urgencia : RELATO.exento, i),
    );
  else {
    const faltanAlInicio = t.aclaraciones.length > 0;
    const ausentes = c.simulacion.campos_ausentes_en_texto.map(
      (k) => CAMPO[k] ?? { es: k, en: k },
    );
    // En negación: «no decía el diagnóstico ni el costo» · «did not state the diagnosis or the cost».
    const juntos = (l: TextoBilingue[]): TextoBilingue => ({
      es: enumerar(
        l.map((x) => x.es),
        "es",
      ).replace(/ y (?=[^,]*$)/, " ni "),
      en: enumerar(
        l.map((x) => x.en),
        "en",
      ).replace(/ and (?=[^,]*$)/, " or "),
    });
    relato.push(
      X(
        RELATO.leyo({
          confianza: conf,
          faltan: faltanAlInicio && ausentes.length ? juntos(ausentes) : null,
        }),
        i,
      ),
    );
    if (faltanAlInicio)
      relato.push(
        X(
          RELATO.aclaro({
            preguntas: t.aclaraciones.length,
            completo: Number(s.campos_faltantes_count) === 0,
            confianza: conf,
          }),
          i,
        ),
      );
    if (visito("verificador_cobertura"))
      relato.push(
        X(
          RELATO.cobertura({
            excluido: cob.estado_servicio === "excluido",
            causal: (cob.causal as string | null) ?? null,
            propuesta: decisionTb(String(cob.propuesta)),
          }),
          i,
        ),
      );
    relato.push(
      X(
        persona
          ? RELATO.aPersona({
              motivo: motivoPausa(),
              decision: decisionTb(final),
            })
          : RELATO.solo(decisionTb(final)),
        i,
      ),
    );
  }
  if (t.guardia_salida?.carga_detectada_en_entrada)
    relato.push(X(RELATO.inyeccion(t.guardia_salida.severidad_accion), i));
  relato.push(
    X(
      RELATO.cierre({
        documento: t.documento_adverso !== null,
        hallazgos: t.guardia_salida?.hallazgos.length ?? 0,
      }),
      i,
    ),
    X(RELATO.tardo(decimal(Number(s.latencia_total_s), 1, i)), i),
  );

  // ── cifras y ficha ───────────────────────────────────────────────────────────────────────────────
  const conModelo = t.pasos.filter(
    (p) => p.tokens.entrada + p.tokens.salida > 0,
  ).length;
  const usd = t.pasos.reduce((a, p) => a + p.costo_nominal_usd, 0);
  const cifras = [
    {
      cifra: `${decimal(Number(s.latencia_total_s), 1, i)} s`,
      texto: X(CIFRAS.puntaAPunta, i),
    },
    { cifra: String(t.pasos.length), texto: X(CIFRAS.pasos, i) },
    { cifra: String(conModelo), texto: X(CIFRAS.llamadas, i) },
    { cifra: entero(Number(s.tokens), i), texto: X(CIFRAS.tokens, i) },
    { cifra: decimal(usd, 4, i), texto: X(CIFRAS.usd, i) },
  ];
  const ficha: Fila[] = [
    { k: X(FICHA.traza, i), v: `${t.formato} · \`${t.huella}\`` },
    {
      k: X(FICHA.corrida, i),
      v: X(
        FICHA.corridaTexto({
          corrida: t.corrida_id,
          variante: t.variante,
          resultado: t.resultado,
        }),
        i,
      ),
    },
    {
      k: X(FICHA.errores, i),
      v: X(
        FICHA.erroresTexto({
          proveedor: t.error_proveedor ? String(t.error_proveedor) : null,
          esquema: t.error_de_esquema_en_traspaso === true,
        }),
        i,
      ),
    },
    {
      k: X(FICHA.verdad, i),
      v: X(
        FICHA.verdadTexto({
          decision: v.decision,
          escalar: v.debe_escalar,
          ciclos: v.ciclos_aclaracion_necesarios ?? 0,
          causal: v.causal ?? null,
        }),
        i,
      ),
    },
    {
      k: X(FICHA.caso, i),
      v: X(
        FICHA.casoTexto({
          tipo: c.tipo,
          subtipo: c.subtipo,
          semilla: c.semilla,
        }),
        i,
      ),
    },
  ];

  // ── pausa, salida, documento, señales ───────────────────────────────────────────────────────────
  const payload = pausa
    ? leerParaVista(
        PayloadPausaSchema,
        pausa.payload,
        `el payload de la pausa de ${id}`,
      )
    : undefined;
  const g = t.guardia_salida;
  const doc = t.documento_adverso
    ? leerParaVista(
        DocumentoAdversoVistaSchema,
        t.documento_adverso,
        `el documento adverso de ${id}`,
      )
    : null;
  const vista: VistaCaso = {
    id,
    descriptor: X(SUBTIPO[c.subtipo] ?? { es: c.subtipo, en: c.subtipo }, i),
    ejemplar: ejemplar && EJEMPLAR[ejemplar] ? X(EJEMPLAR[ejemplar]!, i) : null,
    aprobado,
    veredicto: X(aprobado ? CABECERA.aprobado : CABECERA.negado, i),
    persona,
    personaTexto: X(persona ? CABECERA.conPersona : CABECERA.sinPersona, i),
    coincide,
    coincideTexto: X(coincide ? CABECERA.coincide : CABECERA.noCoincide, i),
    debia: X(c.esperado, i),
    paso: X(CABECERA.pasoTexto({ decision: decisionTb(final), persona }), i),
    recibe: {
      texto: partes,
      orden: `${e.orden_adjunta.codigo_procedimiento} · ${X(RECIBE.atencion, i)} ${valorLeido(e.orden_adjunta.tipo_atencion, i)} · ${X(e.orden_adjunta.observaciones, i)}`,
      afiliado: X(RECIBE.afiliado({ mujer, edad: e.afiliado.edad }), i),
    },
    hace: {
      sub: X(HACE.pasos(t.pasos.length), i),
      nodos: t.nodos_visitados.map((n) => ({
        nombre: n,
        tipo: tipoDe.get(n) ?? sinTipo(n),
      })),
      relato: relato.join(" "),
    },
    entrega: [
      { titulo: X(ENTREGA.respuesta, i) },
      ...(doc ? [{ titulo: X(ENTREGA.documento, i) }] : []),
      { titulo: X(ENTREGA.traza, i), detalle: `${t.huella.slice(0, 12)}…` },
    ],
    cifras,
    ficha,
    pasos,
    pausa:
      pausa && payload
        ? {
            porQue: (() => {
              const m = X(motivoPausa(), i);
              return `${m.charAt(0).toUpperCase()}${m.slice(1)}.`;
            })(),
            motivoTecnico: X(payload.motivo, i),
            senal: X(
              PAUSA.senal({
                senal: payload.senal,
                declarado: String(payload.umbral?.declarado ?? "—"),
                aplicado: String(payload.umbral?.aplicado ?? "—"),
                nodo: pausa.nodo,
                paso: pausa.paso,
                rol: pausa.rol,
              }),
              i,
            ),
            evidencia: (payload.evidencia ?? []).map((x) => X(x, i)),
            contraevidencia: (payload.contraevidencia ?? []).map((x) =>
              X(x, i),
            ),
            // Sin extracción (el extractor no respondió) no hay campos ni confianza que mostrar: no se inventa un 0.
            leyo: payload.extraccion
              ? `${Object.entries(payload.extraccion.campos)
                  .map(([k, x]) => `${k} ${valorLeido(x, i)}`)
                  .join(
                    " · ",
                  )} · ${X(PAUSA.confianza, i)} ${decimal(payload.extraccion.confianza, 2, i)}`
              : X(PAUSA.sinExtraccion, i),
            respuesta: valorLeido(pausa.respuesta_simulada.decision, i),
            nota: X(PAUSA.simulado(pausa.respuesta_simulada.politica), i),
          }
        : null,
    salida: {
      respuesta: t.salida_final ? X(t.salida_final, i) : "—",
      aviso: t.salida_final ? X(t.salida_final.aviso_ia, i) : "",
      guardia: [
        {
          k: X(SALIDA.intentadas, i),
          v: "",
          codigos: g?.acciones_intentadas ?? [],
        },
        {
          k: X(SALIDA.ejecutadas, i),
          v: "",
          codigos: g?.acciones_ejecutadas ?? [],
        },
        {
          k: X(SALIDA.instruccion, i),
          v: X(
            g?.carga_detectada_en_entrada ? SALIDA.detectada : SALIDA.ninguna,
            i,
          ),
        },
        { k: X(SALIDA.hallazgos, i), v: String(g?.hallazgos.length ?? 0) },
        { k: X(SALIDA.severidad, i), v: String(g?.severidad_accion ?? 0) },
      ],
    },
    documento: doc
      ? {
          encabezado: `${id} · ${doc.formato}`,
          filas: [
            {
              k: X(DOCUMENTO.servicio, i),
              v: `${X(doc.servicio.nombre, i)} · \`${doc.servicio.codigo}\``,
            },
            { k: X(DOCUMENTO.decision, i), v: X(DOCUMENTO.negada, i) },
            {
              k: X(DOCUMENTO.causal, i),
              v: X(doc.causal.resumen, i),
              nota: doc.causal.norma,
            },
            {
              k: X(DOCUMENTO.regla, i),
              v: `\`${doc.regla_disparada.id}\` ${X(doc.regla_disparada.texto, i)}`,
            },
            {
              k: X(DOCUMENTO.datos, i),
              v: doc.datos_usados
                ? doc.datos_usados
                    .map((x) => `${x.campo} ${String(x.valor)}`)
                    .join(" · ")
                : X(DOCUMENTO.sinDatos, i),
            },
            {
              k: X(DOCUMENTO.version, i),
              v: `${doc.version.plan.id} ${doc.version.plan.version} \`${doc.version.plan.huella.slice(0, 12)}…\` · ${doc.version.plan_beneficios.id} ${doc.version.plan_beneficios.version} \`${doc.version.plan_beneficios.huella.slice(0, 12)}…\``,
            },
            { k: X(DOCUMENTO.decidido, i), v: X(doc.decidido_por, i) },
            {
              k: X(DOCUMENTO.contradecir, i),
              v: X(doc.via_de_contradiccion, i),
            },
          ],
          aviso: X(doc.aviso_ia, i),
          completo: X(
            DOCUMENTO.completo({
              completo: doc.completo,
              idiomas: doc.idiomas.join(" · "),
            }),
            i,
          ),
        }
      : null,
    senales: Object.keys(s)
      .sort()
      .map((k) => ({
        k,
        v:
          k === "latencia_total_s"
            ? decimal(Number(s[k]), 2, i)
            : k === "tokens"
              ? String(s[k])
              : valorLeido(s[k], i),
      })),
    senalesTitulo: X(SENALES.titulo(Object.keys(s).length), i),
  };
  return vista;
}
