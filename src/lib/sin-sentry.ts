/**
 * Lo que el paquete para hoja-de-vida compila en lugar de `@sentry/nextjs` (ADR-009, `next.config.ts`): el paquete
 * no reporta errores a ningún sitio y no lleva un byte de Sentry. `instrumentation-client.ts` solo lo importa con
 * DSN, y el paquete se compila sin DSN; el alias cubre el chunk que el `import()` deja aunque nunca se cargue.
 */
export function init(): void {}
