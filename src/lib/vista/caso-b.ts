/**
 * El perfil del demo B (vinculación con debida diligencia) en P6 Caso: los tres documentos con la instrucción escondida
 * marcada, la solicitud; qué hizo cada nodo; el relato; la pausa del oficial, el documento de rechazo y el expediente
 * con la cita de cada conclusión.
 */
import type { Idioma, TextoBilingue } from "@core/formatos/bilingue";
import type { Traza } from "@core/formatos/traza";
import type { CasoB } from "@core/sintetico/demo-b/esquema";
import {
  DocumentoRechazoVistaSchema,
  leerParaVista,
  PayloadPausaBSchema,
} from "@/lib/datos/esquemas";
import type { DatosDemoB } from "@/lib/datos/vitrina";
import { HIZO, RELATO, SI_NO } from "@/textos/caso";
import { PRODUCTO_B, VALORES_B } from "@/textos/demo-b/agente";
import {
  CABECERA_B,
  DOCUMENTO_B,
  ENTREGA_B,
  EXPEDIENTE_B,
  FICHA_CASO_B,
  HIZO_B,
  MOTIVO_B,
  PAUSA_B,
  PRODUCTO_PEDIDO_B,
  RAMA_B,
  RECIBE_B,
  RELATO_B,
  SALIDA_B,
} from "@/textos/demo-b/caso";
import { valorLeido, type PerfilCaso } from "./caso-comun";
import { decimal, decimalesDe } from "./formato";
import {
  categoriaDeRegla,
  reglaDeLaPausa,
  textoDeCategoria,
} from "./motivo-pausa";
import { pausaUnica } from "./plan-comun";
import { delVocabulario } from "./vocabulario";

const X = (t: TextoBilingue, i: Idioma) => t[i];
const DOCUMENTOS = ["identidad", "actividad", "fondos"] as const;

/** Un documento partido para marcar la instrucción escondida (índices impares), si la trae. */
function partido(texto: string, carga: string | undefined): string[] {
  return carga && texto.includes(carga)
    ? [
        texto.slice(0, texto.indexOf(carga)),
        carga,
        texto.slice(texto.indexOf(carga) + carga.length),
      ]
    : [texto];
}

export function perfilCasoB(
  d: DatosDemoB,
  t: Traza,
  c: CasoB,
  i: Idioma,
): PerfilCaso {
  const id = t.caso_id;
  const s = t.senales;
  const final = String(s.decision_final);
  const persona = s.pausa_humana === true;
  const v = c.verdad_conocida;
  const decisionTb = (x: string): TextoBilingue =>
    VALORES_B[x] ?? { es: x, en: x };
  const docs = c.entrada.documentos;
  const producto = c.entrada.solicitud.producto;
  const mejor = t.coincidencias?.mejor ?? null;
  const faltan = t.extraccion?.campos_faltantes.length ?? 0;
  const pt = t.puntaje;
  const exp = t.expediente;
  const carga = s.carga_detectada === true;
  const visito = (n: string) => t.nodos_visitados.includes(n);

  // ── lo que recibe ────────────────────────────────────────────────────────────────────────────────
  const titulos = {
    identidad: RECIBE_B.identidad,
    actividad: RECIBE_B.actividad,
    fondos: RECIBE_B.fondos,
  };
  const documentos = DOCUMENTOS.flatMap((k) => {
    const doc = docs[k];
    if (!doc) return [];
    const plantada =
      c.adversario?.vector === k ? c.adversario.carga[i] : undefined;
    return [{ titulo: X(titulos[k], i), partes: partido(doc[i], plantada) }];
  });

  // ── qué hizo cada nodo ───────────────────────────────────────────────────────────────────────────
  const reglasDe = (nodo: string) =>
    d.plan.contrato_de_grafo.aristas_condicionales.filter(
      (a) => a.desde === nodo,
    ).length;
  const pausa = pausaUnica(t.pausas_humanas, `el caso ${t.caso_id}`);
  const hizo: PerfilCaso["hizo"] = (p) => {
    const sinRespuesta =
      p.error_proveedor !== null ? HIZO.sinRespuesta(p.error_proveedor) : null;
    let h: TextoBilingue;
    switch (p.nodo) {
      case "enrutador":
        h = HIZO_B.enrutador(carga);
        break;
      case "extractor":
        h = sinRespuesta ?? HIZO_B.extractor(faltan);
        break;
      case "verificador_listas":
        h = HIZO_B.verificador(
          mejor
            ? {
                similitud: decimal(
                  mejor.similitud,
                  decimalesDe(mejor.similitud),
                  i,
                ),
                entrada: mejor.entrada_id,
                lista: mejor.lista_id,
                vinculante: mejor.vinculante,
              }
            : null,
        );
        break;
      case "investigador":
        h =
          sinRespuesta ??
          HIZO_B.investigador({
            misma: t.investigacion?.conclusion === "misma_persona",
            entrada: t.investigacion?.entrada_id ?? "—",
          });
        break;
      case "puntaje":
        h = HIZO_B.puntaje({
          total: pt?.total ?? 0,
          inconsistencias: pt?.inconsistencias.length ?? 0,
          propuesta: decisionTb(String(s.propuesta)),
        });
        break;
      case "decision":
        h = HIZO_B.decision(reglasDe("decision"));
        break;
      case "pausa_humana":
        h = HIZO_B.pausa(
          decisionTb(String(pausa?.respuesta_simulada.decision)),
        );
        break;
      case "redactor":
        h = HIZO_B.redactor({
          conclusiones: exp?.conclusiones.length ?? 0,
          documento: t.documento_adverso !== null,
        });
        break;
      case "guardia_salida":
        h = HIZO.guardia({
          hallazgos: t.guardia_salida?.hallazgos.length ?? 0,
          severidad: t.guardia_salida?.severidad_accion ?? 0,
        });
        break;
      default:
        throw new Error(
          `vitrina: el nodo «${p.nodo}» de ${id} no tiene su frase en src/lib/vista/caso-b.ts (hizo)`,
        );
    }
    return { hizo: X(h, i), dialogo: [] };
  };

  // ── el relato ────────────────────────────────────────────────────────────────────────────────────
  const motivoPausa = (): TextoBilingue =>
    textoDeCategoria(
      MOTIVO_B,
      categoriaDeRegla(
        reglaDeLaPausa(
          t.caso_id,
          pausa?.payload.motivo,
          t.decisiones_de_arista,
        ),
        d.id,
      ),
      "MOTIVO_B (src/textos/demo-b/caso.ts)",
    );
  const relato: TextoBilingue[] = [
    RELATO_B.pidio({
      producto: delVocabulario(
        PRODUCTO_PEDIDO_B,
        producto,
        "PRODUCTO_PEDIDO_B (src/textos/demo-b/caso.ts)",
      ),
      fondos: docs.fondos !== null,
    }),
  ];
  if (carga) relato.push(RELATO_B.carga);
  if (visito("extractor")) relato.push(RELATO_B.leyo(faltan));
  if (visito("verificador_listas"))
    relato.push(
      RELATO_B.listas(
        mejor
          ? {
              similitud: decimal(
                mejor.similitud,
                decimalesDe(mejor.similitud),
                i,
              ),
              entrada: mejor.entrada_id,
              vinculante: mejor.vinculante,
              investigado: visito("investigador"),
            }
          : null,
      ),
    );
  if (t.investigacion)
    relato.push(
      RELATO_B.investigo(t.investigacion.conclusion === "misma_persona"),
    );
  if (pt)
    relato.push(
      RELATO_B.puntuo({
        total: pt.total,
        inconsistencias: pt.inconsistencias.length,
      }),
    );
  relato.push(
    persona
      ? RELATO_B.aPersona({
          motivo: motivoPausa(),
          decision: decisionTb(final),
        })
      : RELATO_B.solo(decisionTb(final)),
    RELATO_B.cierre({
      conclusiones: exp?.conclusiones.length ?? 0,
      sinCita: exp?.conclusiones_sin_cita ?? 0,
      documento: t.documento_adverso !== null,
      hallazgos: t.guardia_salida?.hallazgos.length ?? 0,
    }),
    RELATO.tardo(decimal(Number(s.latencia_total_s), 1, i)),
  );

  // ── pausa, documento y expediente ───────────────────────────────────────────────────────────────
  const payload = pausa
    ? leerParaVista(
        PayloadPausaBSchema,
        pausa.payload,
        `el payload de la pausa de ${id}`,
      )
    : undefined;
  const doc = t.documento_adverso
    ? leerParaVista(
        DocumentoRechazoVistaSchema,
        t.documento_adverso,
        `el documento de rechazo de ${id}`,
      )
    : null;
  const huella = (h: string) => `\`${h.slice(0, 12)}…\``;

  return {
    decision: decisionTb,
    noAprobado: CABECERA_B.rechazado,
    recibe: {
      documentos,
      datos: [
        {
          icono: "orden",
          titulo: X(RECIBE_B.solicitud, i),
          detalle: X(
            RECIBE_B.solicitudTexto({
              id: c.entrada.solicitud.id,
              producto: delVocabulario(
                PRODUCTO_B,
                producto,
                "PRODUCTO_B (src/textos/demo-b/agente.ts)",
              ),
            }),
            i,
          ),
        },
        ...(docs.fondos === null
          ? [
              {
                icono: "orden" as const,
                titulo: X(RECIBE_B.fondos, i),
                detalle: X(RECIBE_B.sinFondos, i),
              },
            ]
          : []),
        {
          icono: "persona",
          titulo: X(RECIBE_B.contacto, i),
          detalle: X(RECIBE_B.minimizado, i),
        },
      ],
    },
    hizo,
    ramas: RAMA_B,
    dondeRamas: "src/textos/demo-b/caso.ts",
    relato: relato.map((x) => X(x, i)),
    verdad: X(
      FICHA_CASO_B.verdadTexto({
        decision: v.decision,
        escalar: v.debe_escalar,
        vinculante: v.en_lista_vinculante,
        entrada: v.entrada_lista,
      }),
      i,
    ),
    pausa:
      pausa && payload
        ? {
            motivo: motivoPausa(),
            motivoTecnico: payload.motivo,
            senal: payload.senal,
            umbral: payload.umbral,
            evidencia: payload.evidencia,
            contraevidencia: payload.contraevidencia,
            leyo: payload.extraccion
              ? Object.entries(payload.extraccion.campos)
                  .map(([k, x]) => `${k} ${valorLeido(x, i)}`)
                  .join(" · ")
              : X(PAUSA_B.sinExtraccion, i),
            nota: X(PAUSA_B.simulado(pausa.respuesta_simulada.politica), i),
          }
        : null,
    documento: doc
      ? {
          encabezado: `${id} · ${doc.causal.id}`,
          filas: [
            { k: X(DOCUMENTO_B.decision, i), v: X(DOCUMENTO_B.rechazada, i) },
            {
              k: X(DOCUMENTO_B.causa, i),
              v: X(doc.causal.resumen, i),
              nota: doc.causal.norma,
            },
            {
              k: X(DOCUMENTO_B.regla, i),
              v: `\`${doc.regla.id}\` ${X(doc.regla.texto, i)}`,
            },
            { k: X(DOCUMENTO_B.datos, i), v: doc.datos_usados.join(" · ") },
            {
              k: X(DOCUMENTO_B.version, i),
              v: `${doc.version.plan.id} ${doc.version.plan.version} ${huella(doc.version.plan.huella)} · ${doc.version.listas.id} ${doc.version.listas.version} ${huella(doc.version.listas.huella)}`,
            },
            {
              k: X(DOCUMENTO_B.revisado, i),
              v: X(doc.revisado_por_persona ? SI_NO.si : SI_NO.no, i),
            },
            {
              k: X(DOCUMENTO_B.contradecir, i),
              v: X(doc.via_de_contradiccion, i),
            },
          ],
          // El documento del B no trae aviso de IA propio: la vista no lo inventa (hallazgo en la bitácora del S3).
          aviso: null,
          completo: X(
            DOCUMENTO_B.completo({
              completo: doc.completo,
              idiomas: doc.idiomas.join(" · "),
              persona: doc.revisado_por_persona,
            }),
            i,
          ),
        }
      : null,
    expediente: exp
      ? {
          titulo: X(EXPEDIENTE_B.titulo, i),
          chip: X(EXPEDIENTE_B.chip, i),
          lectura: X(EXPEDIENTE_B.lectura, i),
          cabecera: X(EXPEDIENTE_B.cabecera, i),
          encabezado: `${exp.solicitud} · ${id}`,
          conclusiones: exp.conclusiones.map((k) => {
            const lista = k.cita?.lista as
              { id: string; version: string; fecha: string } | undefined;
            const cita = k.cita
              ? `${X(
                  delVocabulario(
                    EXPEDIENTE_B.cita,
                    k.cita.tipo,
                    "EXPEDIENTE_B.cita (src/textos/demo-b/caso.ts)",
                  )(k.cita.ref),
                  i,
                )}${lista ? ` · ${X(EXPEDIENTE_B.lista(lista), i)}` : ""}`
              : X(EXPEDIENTE_B.sinCita, i);
            return {
              id: k.id,
              texto: X(k.texto, i),
              cita,
              citada: k.cita !== null,
            };
          }),
          cuenta: X(
            EXPEDIENTE_B.cuenta({
              n: exp.conclusiones.length,
              sinCita: exp.conclusiones_sin_cita,
            }),
            i,
          ),
        }
      : null,
    entrega: [
      { titulo: X(ENTREGA_B.respuesta, i) },
      ...(doc ? [{ titulo: X(ENTREGA_B.documento, i) }] : []),
      ...(exp ? [{ titulo: X(ENTREGA_B.expediente, i) }] : []),
    ],
    textos: {
      pausaTitulo: X(PAUSA_B.titulo, i),
      pausaLectura: X(PAUSA_B.lectura, i),
      pausaRespondio: X(PAUSA_B.respondio, i),
      salidaRecibe: X(SALIDA_B.recibe, i),
      documentoTitulo: X(DOCUMENTO_B.titulo, i),
      documentoLectura: X(DOCUMENTO_B.lectura, i),
      documentoCabecera: X(DOCUMENTO_B.cabecera, i),
    },
  };
}
