// @vitest-environment node
/**
 * AU-S2-B36: el modo paquete solo lo enciende `pnpm paquete:vitrina`. `PLANLANG_PAQUETE=1` sola (olvidada en el
 * entorno) detiene el build en lugar de exportar a `.next-paquete/` y dejar que `pnpm start` sirva un `out/` viejo.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { MARCA_PAQUETE } from "../../../scripts/paquete/marca";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("next.config y el modo paquete", () => {
  it("sin variables, el export normal (sin base)", async () => {
    vi.stubEnv("PLANLANG_PAQUETE", "");
    const c = (await import("../../../next.config")).default;
    expect(c.basePath).toBeUndefined();
  });

  it("PLANLANG_PAQUETE=1 sin la marca se rechaza nombrando el remedio", async () => {
    vi.stubEnv("PLANLANG_PAQUETE", "1");
    vi.stubEnv("PLANLANG_PAQUETE_MARCA", "");
    await expect(import("../../../next.config")).rejects.toThrow(
      /unset PLANLANG_PAQUETE/,
    );
  });

  it("con la marca de paquete-vitrina, la base del paquete", async () => {
    vi.stubEnv("PLANLANG_PAQUETE", "1");
    vi.stubEnv("PLANLANG_PAQUETE_MARCA", MARCA_PAQUETE);
    const c = (await import("../../../next.config")).default;
    expect(c.basePath).toBe("/piezas/planlang");
    expect(c.distDir).toBe(".next-paquete");
  });
});
