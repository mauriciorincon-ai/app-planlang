import { afterEach, describe, expect, it, vi } from "vitest";

// K3 (planlang S1): al activar `--coverage`, `src/lib/**` entra al umbral del 80 % y este módulo
// del kit no tenía test. Se prueba lo que el kit promete: inerte sin DSN y metadata-only con DSN.
const captureMessage = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  captureMessage: (...args: unknown[]) => captureMessage(...args),
}));

describe("reportError (Sentry metadata-only, kit v1.2.1)", () => {
  afterEach(() => {
    captureMessage.mockReset();
    vi.unstubAllEnvs();
  });

  it("es inerte sin NEXT_PUBLIC_SENTRY_DSN", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    const { reportError } = await import("@/lib/observability");
    reportError("prueba/sin-dsn", { n: 1 });
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it("con DSN envía solo el tipo y los metadatos, nunca un mensaje crudo", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://ejemplo@sentry.invalid/1");
    const { reportError } = await import("@/lib/observability");
    reportError("prueba/con-dsn", { codigo: 7, ok: false });
    expect(captureMessage).toHaveBeenCalledWith("prueba/con-dsn", {
      level: "error",
      extra: { codigo: 7, ok: false },
    });
  });
});
