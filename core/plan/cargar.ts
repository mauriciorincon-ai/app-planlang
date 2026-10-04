/**
 * Carga de un plan con verificación de huella (RF-01.7, RF-06.1): un plan aprobado cuya huella no
 * coincide se rechaza. `aprobarPlan` produce la versión aprobada con huella calculada.
 *
 * M-22 (S2): se sella el plan CANÓNICO parseado (con lo que el esquema completa, como `depende_de: []`) y se
 * verifica sobre lo que hay en disco, sin parsear. Antes se sellaba el borrador crudo y se verificaba el parseado:
 * un plan recién aprobado podía no cargar, y borrar del archivo un valor por omisión pasaba sin aviso.
 */
import { conHuella, verificarHuella } from "../formatos/huella";
import { normalizar, type JsonValor } from "../formatos/jcs";
import type { Plan } from "./esquema";
import {
  validarPlan,
  type Motivo,
  type ResultadoValidacion,
} from "./validador";

export type ResultadoCarga =
  | { ok: true; plan: Plan; huella: string; advertencias: Motivo[] }
  | { ok: false; motivos: Motivo[]; advertencias: Motivo[] };

function motivoHuella(es: string, en: string): Motivo {
  return { codigo: "HUELLA_AUSENTE", elemento: "huella", mensaje: { es, en } };
}

/** Valida y, si el plan está aprobado, verifica que su huella coincide. */
export async function cargarPlan(entrada: unknown): Promise<ResultadoCarga> {
  const v: ResultadoValidacion = validarPlan(entrada);
  if (!v.ok) return v;
  if (v.plan.estado_aprobacion !== "aprobado") {
    return {
      ok: false,
      advertencias: v.advertencias,
      motivos: [
        motivoHuella(
          "El plan está en borrador: no tiene huella que verificar. Apruébalo con aprobarPlan.",
          "The plan is a draft: there is no fingerprint to verify. Approve it with aprobarPlan.",
        ),
      ],
    };
  }
  // Sobre la entrada tal cual (lo que hay en disco), no sobre lo que el esquema completó al parsear.
  const verificacion = await verificarHuella(
    entrada as Record<string, JsonValor>,
  );
  if (!verificacion.ok) {
    return {
      ok: false,
      advertencias: v.advertencias,
      motivos: [
        motivoHuella(
          `La huella declarada (${verificacion.declarada ?? "ninguna"}) no coincide con la calculada (${verificacion.calculada}).`,
          `The declared fingerprint (${verificacion.declarada ?? "none"}) does not match the computed one (${verificacion.calculada}).`,
        ),
      ],
    };
  }
  return {
    ok: true,
    plan: v.plan,
    huella: verificacion.huella,
    advertencias: v.advertencias,
  };
}

export type ResultadoAprobacion =
  | { ok: true; plan: Plan & { huella: string }; advertencias: Motivo[] }
  | { ok: false; motivos: Motivo[]; advertencias: Motivo[] };

/** Toma un plan (borrador o no), lo valida como aprobado y le calcula la huella. */
export async function aprobarPlan(
  entrada: unknown,
  aprobacion: { por: string; el: string },
): Promise<ResultadoAprobacion> {
  const base = entrada as Record<string, JsonValor>;
  const candidato = {
    ...base,
    estado_aprobacion: "aprobado",
    aprobado_por: aprobacion.por,
    aprobado_el: aprobacion.el,
    huella: null,
  };
  const v = validarPlan(candidato);
  if (!v.ok) {
    // Un plan con huella null y estado aprobado produce HUELLA_AUSENTE: aquí es esperado, lo filtramos.
    const motivos = v.motivos.filter((m) => m.codigo !== "HUELLA_AUSENTE");
    if (motivos.length > 0)
      return { ok: false, motivos, advertencias: v.advertencias };
  }
  // M-23: una condición que lee una señal no declarada se advierte al validar y detiene la aprobación: el
  // constructor no tendría por qué registrarla y el criterio mediría sobre un campo ausente.
  const noDeclaradas = v.advertencias.filter(
    (m) => m.codigo === "SENAL_NO_DECLARADA",
  );
  if (noDeclaradas.length > 0)
    return {
      ok: false,
      motivos: noDeclaradas,
      advertencias: v.advertencias.filter(
        (m) => m.codigo !== "SENAL_NO_DECLARADA",
      ),
    };
  // La forma canónica: el esquema completa lo que el borrador omitió. Se parsea con una huella provisional (un
  // plan aprobado sin huella no valida) y se sella lo parseado, normalizado como JSON.
  const provisional = validarPlan({ ...candidato, huella: "0".repeat(64) });
  if (!provisional.ok)
    return {
      ok: false,
      motivos: provisional.motivos,
      advertencias: provisional.advertencias,
    };
  const aprobado = await conHuella(
    normalizar(provisional.plan as unknown as Record<string, JsonValor>),
  );
  const final = validarPlan(aprobado);
  if (!final.ok)
    return {
      ok: false,
      motivos: final.motivos,
      advertencias: final.advertencias,
    };
  return {
    ok: true,
    plan: final.plan as Plan & { huella: string },
    advertencias: final.advertencias,
  };
}
