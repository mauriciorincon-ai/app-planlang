/**
 * El `beforeSend` de la vitrina (metadata-only, kit v1.2.1 y v1.33.0): sin request ni breadcrumbs, sin AbortError,
 * y de cada excepción solo su TIPO. El mensaje puede arrastrar contenido del usuario (una ruta, un nombre, un texto
 * pegado; Big-D S1 B-10). Vive fuera de `instrumentation-client.ts` para probarlo sin Sentry; el tipo es estructural
 * para no importar los de Sentry en el paquete, que lo cambia por `sin-sentry.ts` (ADR-009).
 */
export interface EventoMinimo {
  request?: unknown;
  breadcrumbs?: unknown;
  exception?: { values?: { type?: string; value?: string }[] };
}

export function limpiarEvento<E extends EventoMinimo>(event: E): E | null {
  delete event.request;
  event.breadcrumbs = undefined;
  if (event.exception?.values?.[0]?.type === "AbortError") return null;
  for (const v of event.exception?.values ?? []) v.value = v.type;
  return event;
}
