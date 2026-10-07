// Sentry client-only, metadata-only (kit-app v1.2.1 — patrón validado en nutri-kids S1 y ds S1).
// INERTE SIN DSN: si NEXT_PUBLIC_SENTRY_DSN no está definida (CI, local sin configurar, el paquete para
// hoja-de-vida), no se descarga ni se inicializa nada. planlang S2 (ADR-008): la importación es DINÁMICA y
// va detrás del `if`, que el build resuelve al compilar; con la importación estática del kit, la vitrina
// cargaba 148 KB comprimidos de Sentry sin DSN. La vitrina navega con `<a>` (sitio de varias páginas), así
// que el gancho de transiciones del router del kit no aplica.
// S3: la limpieza del evento (`src/lib/sentry-evento.ts`) también va detrás del `if`, importada con Sentry. Una
// importación estática, aunque pese 100 bytes, entra al primer pedazo de JS de cada página: con ella el LCP de
// `/es/agente` en CI pasó de cumplir a 2.630 ms (PR #14).
// Server-side Sentry (instrumentation.ts) se añade cuando la app tenga backend, por ADR.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  void Promise.all([
    import("@sentry/nextjs"),
    import("@/lib/sentry-evento"),
  ]).then(([Sentry, { limpiarEvento }]) =>
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "local",
      // Sin tracing ni replay: error tracking puro (presupuesto y privacidad).
      tracesSampleRate: 0,
      // Privacidad (metadata-only): nunca enviar requests, breadcrumbs ni el MENSAJE de una excepción, que
      // pueden arrastrar contenido del usuario (kit v1.33.0). Reportar errores vía src/lib/observability.ts.
      beforeSend: (event) => limpiarEvento(event),
    }),
  );
}
