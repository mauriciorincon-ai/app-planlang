/**
 * Validador de identificadores (E-11): cada regla dispara con su patrón real y calla con su versión
 * ficticia. Los dígitos de verificación del NIT de referencia los calculó una implementación
 * independiente en Python.
 */
import { describe, expect, it } from "vitest";
import {
  dvNit,
  enRangoRealDeCedula,
  hallazgosEnTexto,
  validarIdentificadores,
} from "../../../../core/sintetico/validador-identificadores";

const reglas = (texto: string) =>
  hallazgosEnTexto(texto, "$").map((h) => h.regla);

describe("dígito de verificación del NIT", () => {
  it("coincide con la referencia calculada en Python", () => {
    expect(dvNit("900123456")).toBe(8);
    expect(dvNit("800197268")).toBe(4);
    expect(dvNit("860034313")).toBe(7);
    expect(dvNit("899999068")).toBe(1);
    expect(() => dvNit("12a")).toThrow(RangeError);
  });
});

describe("rango real de cédula", () => {
  it("cubre 1–99.999.999 y el NUIP 1.000.000.000–1.999.999.999", () => {
    expect(enRangoRealDeCedula(1)).toBe(true);
    expect(enRangoRealDeCedula(99_999_999)).toBe(true);
    expect(enRangoRealDeCedula(100_000_000)).toBe(false);
    expect(enRangoRealDeCedula(1_000_000_000)).toBe(true);
    expect(enRangoRealDeCedula(1_999_999_999)).toBe(true);
    expect(enRangoRealDeCedula(2_000_000_000)).toBe(false);
    expect(enRangoRealDeCedula(0)).toBe(false);
  });
});

describe("reglas de texto: dispara con lo real, calla con lo ficticio", () => {
  it.each([
    ["C.C. 1.023.456.789", "cedula_rango_real"],
    ["cédula de ciudadanía No. 52345678", "cedula_rango_real"],
    ["documento de identidad: 12345", "cedula_rango_real"],
    ["national ID 1023456789", "cedula_rango_real"],
    ["se registró 79.456.123 en el formulario", "cedula_rango_real"],
    ["NIT 900.123.456-8", "nit_dv_valido"],
    ["SSN 123-45-6789", "hipaa_ssn"],
    ["llamar al 310 555 1234", "hipaa_telefono"],
    ["call (212) 555-2368", "hipaa_telefono"],
    ["correo juan.perez@gmail.com", "hipaa_correo"],
    ["ver https://clinica-real.co/paciente", "hipaa_url"],
    ["desde la IP 10.20.30.40", "hipaa_ip"],
    ["nació el 12/03/1980", "hipaa_fecha"],
    ["ingresó 2025-03-12", "hipaa_fecha"],
    ["cita el 5 de marzo", "hipaa_fecha"],
    ["seen on March 5th", "hipaa_fecha"],
    ["vive en Calle 45 # 12-30", "hipaa_direccion"],
    ["lives at 221 Baker Street", "hipaa_direccion"],
    ["vehículo de placa ABC-123", "hipaa_placa"],
  ])("«%s» → %s", (texto, regla) => {
    expect(reglas(texto)).toContain(regla);
  });

  it.each([
    "documento SYN-A-123456, teléfono 555-0142, correo ana.valdrena.123@example.com",
    "NIT SYN-NIT-900123456-X",
    "NIT 900.123.456-7",
    "ver https://www.example.org/caso y http://demo.test/x",
    "IP de documentación 192.0.2.10",
    "cédula de 2.100.000.000 (fuera de todo rango)",
    "Costo estimado: 1300 unidades sintéticas. Terapia física (10 sesiones). Paciente de 54 años.",
    "Monitoreo Holter de 24 horas; 24-hour Holter monitoring.",
    "SYN-P-012 · SYN-D-07 · A-001 · AH-003",
    "huella c8b92541962acdc2655812b1f0eebb6511c849f4be3d4b9e268474b53c2cd2f2",
  ])("«%s» no dispara nada", (texto) => {
    expect(reglas(texto)).toEqual([]);
  });

  it("un tramo consumido no se juzga dos veces (el NIT no se reporta también como teléfono)", () => {
    expect(reglas("NIT 900123456-8")).toEqual(["nit_dv_valido"]);
  });
});

describe("reglas por campo", () => {
  it("identificadores sin prefijo sintético, edad > 89 y nombres fuera de los diccionarios", () => {
    const h = validarIdentificadores({
      afiliado: { documento: "52345678", nombre: "Juan Pérez", edad: 93 },
      medico: { nombre: "Dra. Ana Valdrena", registro: "RM-1234" },
      prestador: { nombre: "Clínica del Country", nit: "SYN-NIT-900000000-X" },
    }).map((x) => `${x.regla}@${x.ruta}`);
    expect(h).toContain(
      "identificador_sin_prefijo_sintetico@$.afiliado.documento",
    );
    expect(h).toContain("nombre_fuera_de_lista@$.afiliado.nombre");
    expect(h).toContain("hipaa_edad_mayor_89@$.afiliado.edad");
    expect(h).toContain(
      "identificador_sin_prefijo_sintetico@$.medico.registro",
    );
    expect(h).toContain("nombre_fuera_de_lista@$.prestador.nombre");
    expect(h.some((x) => x.includes("$.medico.nombre"))).toBe(false);
    expect(h.some((x) => x.includes("$.prestador.nit"))).toBe(false);
  });

  it("ignora la clave huella, recorre listas y no toca números que no son edad", () => {
    expect(
      validarIdentificadores({
        huella: "123-45-6789",
        costo: 99_999_999,
        lista: ["ok", { texto: "SSN 123-45-6789" }],
        nulo: null,
        bandera: true,
      }).map((x) => x.ruta),
    ).toEqual(["$.lista[1].texto"]);
  });
});
