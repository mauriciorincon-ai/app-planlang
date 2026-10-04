import { describe, expect, it } from "vitest";
import { limpiarEvento } from "@/lib/sentry-evento";

// El `beforeSend` de instrumentation-client.ts (kit v1.33.0): a Sentry solo viaja el TIPO de la excepción.
// Demo en rojo (bitácora S3): sin la línea `v.value = v.type`, el mensaje con la ruta y el nombre llega entero.
describe("limpiarEvento (beforeSend metadata-only)", () => {
  it("deja solo el tipo de cada excepción, sin request ni breadcrumbs", () => {
    const e = limpiarEvento({
      request: { url: "/es/caso/A-001" },
      breadcrumbs: [{ message: "clic en Ana Pérez" }],
      exception: {
        values: [
          {
            type: "TypeError",
            value: "no se pudo leer /es/caso/A-001 de Ana Pérez",
          },
          { type: "Error", value: "texto pegado por el usuario" },
        ],
      },
    });
    expect(e).not.toBeNull();
    expect(e!.request).toBeUndefined();
    expect(e!.breadcrumbs).toBeUndefined();
    expect(e!.exception!.values!.map((v) => v.value)).toEqual([
      "TypeError",
      "Error",
    ]);
    expect(JSON.stringify(e)).not.toMatch(/Ana|A-001|pegado/);
  });

  it("descarta los AbortError y deja pasar un evento sin excepción", () => {
    expect(
      limpiarEvento({
        exception: { values: [{ type: "AbortError", value: "x" }] },
      }),
    ).toBeNull();
    expect(limpiarEvento({})).toEqual({ breadcrumbs: undefined });
  });
});
