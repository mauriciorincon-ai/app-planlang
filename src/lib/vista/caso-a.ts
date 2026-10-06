/**
 * El perfil del demo A (autorización previa) en P6 Caso: el texto del médico con la instrucción escondida marcada, la
 * orden adjunta y el afiliado; qué hizo cada nodo; el relato; la pausa del auditor y el documento de decisión adversa.
 */
import type { Idioma, TextoBilingue } from "@core/formatos/bilingue";
import { extraccionA, type Traza } from "@core/formatos/traza";
import type { Caso } from "@core/sintetico/esquema";
import { z } from "zod";
import {
  AclaracionTrazaSchema,
  DocumentoAdversoVistaSchema,
  leerParaVista,
  PayloadPausaSchema,
  type PayloadPausa,
} from "@/lib/datos/esquemas";
import type { DatosDemoA } from "@/lib/datos/vitrina";
import { VALORES } from "@/textos/agente";
import {
  CABECERA,
  CAMPO,
  DOCUMENTO,
  ENTREGA,
  FICHA,
  HIZO,
  MOTIVO,
  PAUSA,
  RAMA,
  RECIBE,
  RELATO,
  SALIDA,
} from "@/textos/caso";
import { motivoTecnico, valorLeido, type PerfilCaso } from "./caso-comun";
import { decimal, enumerar } from "./formato";
import {
  categoriaDeRegla,
  reglaDeLaPausa,
  textoDeCategoria,
} from "./motivo-pausa";
import { pausaUnica } from "./plan-comun";

const X = (t: TextoBilingue, i: Idioma) => t[i];

export function perfilCasoA(
  d: DatosDemoA,
  t: Traza,
  c: Caso,
  i: Idioma,
): PerfilCaso {
  const id = t.caso_id;
  const s = t.senales;
  const final = String(s.decision_final);
  const persona = s.pausa_humana === true;
  const v = c.verdad_conocida;
  const pb = d.planBeneficios;
  const decisionTb = (x: string): TextoBilingue =>
    VALORES[x] ?? { es: x, en: x };
  const ex = extraccionA(t);
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

  // ── qué hizo cada nodo ───────────────────────────────────────────────────────────────────────────
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
  const hizo: PerfilCaso["hizo"] = (p) => {
    let h = "";
    const dialogo: Array<{ pregunta: string; respuesta: string }> = [];
    switch (p.nodo) {
      case "enrutador":
        h = X(HIZO.enrutador(decisionTb(String(s.tipo_atencion))), i);
        break;
      case "extractor":
        h = X(
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
        h = X(
          p.error_proveedor !== null
            ? HIZO.sinRespuesta(p.error_proveedor)
            : HIZO.aclaracion(a?.ciclo ?? ciclo),
          i,
        );
        if (a) dialogo.push({ pregunta: a.pregunta, respuesta: a.respuesta });
        break;
      }
      case "verificador_cobertura":
        h = X(
          HIZO.verificador({
            estado: decisionTb(String(cob.estado_servicio)),
            causal: (cob.causal as string | null) ?? null,
            propuesta: decisionTb(String(cob.propuesta)),
          }),
          i,
        );
        break;
      case "decision":
        h = X(HIZO.decision(reglasDelPlan("decision")), i);
        break;
      case "pausa_humana":
        h = X(
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
        h = X(HIZO.redactor(t.documento_adverso !== null), i);
        break;
      case "guardia_salida":
        h = X(
          HIZO.guardia({
            hallazgos: t.guardia_salida?.hallazgos.length ?? 0,
            severidad: t.guardia_salida?.severidad_accion ?? 0,
          }),
          i,
        );
        break;
    }
    return { hizo: h, dialogo };
  };

  // ── el relato ────────────────────────────────────────────────────────────────────────────────────
  const pausa = pausaUnica(t.pausas_humanas, `el caso ${t.caso_id}`);
  const categoriaPausa = (): string =>
    categoriaDeRegla(
      reglaDeLaPausa(t.caso_id, pausa?.payload.motivo, t.decisiones_de_arista),
      "demo-a",
    );
  const motivoPausa = (): TextoBilingue =>
    textoDeCategoria(MOTIVO, categoriaPausa(), "MOTIVO (src/textos/caso.ts)");
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
            conTope: cob.propuesta === "aprobar_parcial",
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
  // Si la pausa fue por la carga, su frase ya contó que la guardia la marcó: aquí solo va lo que pasó después.
  if (t.guardia_salida?.carga_detectada_en_entrada)
    relato.push(
      X(
        (persona && categoriaPausa() === "carga"
          ? RELATO.inyeccionYaContada
          : RELATO.inyeccion)(t.guardia_salida.severidad_accion),
        i,
      ),
    );
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

  // ── pausa y documento ────────────────────────────────────────────────────────────────────────────
  const payload = pausa
    ? leerParaVista(
        PayloadPausaSchema,
        pausa.payload,
        `el payload de la pausa de ${id}`,
      )
    : undefined;
  const doc = t.documento_adverso
    ? leerParaVista(
        DocumentoAdversoVistaSchema,
        t.documento_adverso,
        `el documento adverso de ${id}`,
      )
    : null;

  return {
    decision: decisionTb,
    noAprobado: CABECERA.negado,
    parcial: { valor: "aprobar_parcial", veredicto: CABECERA.parcial },
    recibe: {
      documentos: [{ titulo: X(RECIBE.texto, i), partes }],
      datos: [
        {
          icono: "orden",
          titulo: X(RECIBE.orden, i),
          detalle: `${e.orden_adjunta.codigo_procedimiento} · ${X(RECIBE.atencion, i)} ${valorLeido(e.orden_adjunta.tipo_atencion, i)} · ${X(e.orden_adjunta.observaciones, i)}`,
        },
        {
          icono: "persona",
          titulo: X(RECIBE.afiliado({ mujer, edad: e.afiliado.edad }), i),
          detalle: X(RECIBE.enmascarado, i),
        },
      ],
    },
    hizo,
    ramas: RAMA,
    dondeRamas: "src/textos/caso.ts",
    relato,
    verdad: X(
      FICHA.verdadTexto({
        decision: v.decision,
        escalar: v.debe_escalar,
        ciclos: v.ciclos_aclaracion_necesarios ?? 0,
        causal: v.causal ?? null,
      }),
      i,
    ),
    pausa:
      pausa && payload
        ? {
            motivo: motivoPausa(),
            motivoTecnico: motivoTecnico(
              reglaDeLaPausa(t.caso_id, payload.motivo, t.decisiones_de_arista),
            ),
            senal: payload.senal,
            umbral: payload.umbral,
            evidencia: payload.evidencia,
            contraevidencia: payload.contraevidencia,
            // Sin extracción (el extractor no respondió) no hay campos ni confianza que mostrar: no se inventa un 0.
            leyo: payload.extraccion
              ? `${Object.entries(payload.extraccion.campos)
                  .map(([k, x]) => `${k} ${valorLeido(x, i)}`)
                  .join(
                    " · ",
                  )} · ${X(PAUSA.confianza, i)} ${decimal(payload.extraccion.confianza, 2, i)}`
              : X(PAUSA.sinExtraccion, i),
            caso: casoDeLaPausa(payload, i),
            nota: X(PAUSA.simulado(pausa.respuesta_simulada.politica), i),
          }
        : null,
    documento: doc
      ? {
          encabezado: `${id} · ${doc.formato}`,
          filas: [
            {
              k: X(DOCUMENTO.servicio, i),
              v: `${X(doc.servicio.nombre, i)} · \`${doc.servicio.codigo}\``,
            },
            {
              k: X(DOCUMENTO.decision, i),
              v: X(doc.monto ? DOCUMENTO.parcial : DOCUMENTO.negada, i),
            },
            // M-15 (plan v1.5): la aprobación parcial dice cuánto se pidió, cuánto se aprobó y cuánto se negó.
            ...(doc.monto
              ? [
                  {
                    k: X(DOCUMENTO.monto, i),
                    v: X(DOCUMENTO.montoDetalle(doc.monto), i),
                  },
                ]
              : []),
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
          avisoFalta: null,
          completo: X(
            DOCUMENTO.completo({
              completo: doc.completo,
              idiomas: doc.idiomas.join(" · "),
            }),
            i,
          ),
        }
      : null,
    expediente: null,
    entrega: [
      { titulo: X(ENTREGA.respuesta, i) },
      ...(doc ? [{ titulo: X(ENTREGA.documento, i) }] : []),
    ],
    textos: {
      pausaTitulo: X(PAUSA.titulo, i),
      pausaLectura: X(PAUSA.lectura, i),
      pausaRespondio: X(PAUSA.respondio, i),
      salidaRecibe: X(SALIDA.recibe, i),
      documentoTitulo: X(DOCUMENTO.titulo, i),
      documentoLectura: X(DOCUMENTO.lectura, i),
      documentoCabecera: X(DOCUMENTO.cabecera, i),
    },
  };
}

/** M-8 (plan v1.5): la orden, la cobertura y las aclaraciones que viajaron en la pausa, una línea cada una. */
function casoDeLaPausa(p: PayloadPausa, i: Idioma): string[] {
  if (!p.orden_adjunta) return [];
  const o = p.orden_adjunta;
  const c = p.cobertura;
  const cobertura = c
    ? [
        `${X(PAUSA.cobertura, i)}: ${X(PAUSA.estadoServicio[c.estado_servicio] ?? { es: c.estado_servicio, en: c.estado_servicio }, i)}`,
        ...(c.alto_costo ? [X(PAUSA.altoCosto, i)] : []),
        ...(c.reglas_disparadas.length
          ? [`${X(PAUSA.reglas, i)} ${c.reglas_disparadas.join(", ")}`]
          : []),
      ].join(" · ")
    : X(PAUSA.sinCobertura, i);
  return [
    `${X(PAUSA.orden, i)}: ${o.codigo_procedimiento} · ${X(RECIBE.atencion, i)} ${valorLeido(o.tipo_atencion, i)} · ${X(o.observaciones, i)}`,
    cobertura,
    X(PAUSA.aclaraciones((p.aclaraciones ?? []).length), i),
  ];
}
