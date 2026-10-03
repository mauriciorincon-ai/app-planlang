"""JSON canónico (RFC 8785) y huella SHA-256 — el espejo Python de `core/formatos/{jcs,huella}.ts`.

Regla compartida: `huella = sha256(JCS(objeto sin la clave "huella"))`, hex minúscula. Los archivos en
disco se escriben «bonitos» (indentación 2, claves ordenadas, UTF-8, salto final) y ambos lados
parsean antes de hashear, así que el formato en disco no afecta la huella.

Perfil del emisor (lo que Python garantiza para que TypeScript recalcule lo mismo):
  - números finitos (NaN/±inf → error); `-0.0` → `0`; enteros con |n| ≤ 2**53 − 1;
  - cadenas en NFC; sin sustitutos sueltos (UTF-8 estricto);
  - sin `int` vs `float` como contrato: `1.0` y `1` serializan igual (`1`).

CLI: `python -m app_agents.canonico --escribir-fixture <ruta>` escribe el fixture de valores difíciles
del gate de contrato (`tests/contrato/jcs-valores-tramposos.json`) con el serializador REAL.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
import unicodedata
from pathlib import Path
from typing import Any

import rfc8785

CLAVE_HUELLA = "huella"
LIMITE_ENTERO = 2**53 - 1  # dominio seguro de JSON (rfc8785 rechaza 2**53 exacto)


class ValorNoCanonico(ValueError):
    pass


class HuellaInvalida(ValueError):
    pass


def normalizar(valor: Any, ruta: str = "$") -> Any:
    """Copia normalizada según el perfil del emisor. Lanza `ValorNoCanonico` si no es representable."""
    if valor is None or isinstance(valor, bool):
        return valor
    if isinstance(valor, int):
        if abs(valor) > LIMITE_ENTERO:
            raise ValorNoCanonico(f"{ruta}: entero fuera de ±(2^53 − 1)")
        return valor
    if isinstance(valor, float):
        if math.isnan(valor) or math.isinf(valor):
            raise ValorNoCanonico(f"{ruta}: número no finito")
        if valor == 0.0:
            return 0
        if valor.is_integer() and abs(valor) <= LIMITE_ENTERO:
            return int(valor)
        return valor
    if isinstance(valor, str):
        return unicodedata.normalize("NFC", valor)
    if isinstance(valor, list | tuple):
        return [normalizar(v, f"{ruta}[{i}]") for i, v in enumerate(valor)]
    if isinstance(valor, dict):
        salida: dict[str, Any] = {}
        for k, v in valor.items():
            if not isinstance(k, str):
                raise ValorNoCanonico(f"{ruta}: clave no textual {k!r}")
            salida[unicodedata.normalize("NFC", k)] = normalizar(v, f"{ruta}.{k}")
        return salida
    raise ValorNoCanonico(f"{ruta}: tipo {type(valor).__name__} no representable")


def jcs_bytes(valor: Any) -> bytes:
    return rfc8785.dumps(normalizar(valor))


def jcs_texto(valor: Any) -> str:
    return jcs_bytes(valor).decode("utf-8")


def sin_huella(valor: Any) -> Any:
    if isinstance(valor, dict):
        return {k: v for k, v in valor.items() if k != CLAVE_HUELLA}
    return valor


def huella(valor: Any) -> str:
    return hashlib.sha256(jcs_bytes(sin_huella(valor))).hexdigest()


def con_huella(valor: dict[str, Any]) -> dict[str, Any]:
    base = normalizar(sin_huella(valor))
    base[CLAVE_HUELLA] = huella(base)
    return base


def texto_bonito(valor: Any) -> str:
    """Formato de archivo versionado: claves ordenadas, indentación 2, UTF-8, salto final."""
    return json.dumps(normalizar(valor), indent=2, sort_keys=True, ensure_ascii=False) + "\n"


def escribir_con_huella(ruta: str | Path, valor: dict[str, Any]) -> dict[str, Any]:
    """Escribe `valor` con su huella calculada. Devuelve el objeto escrito."""
    objeto = con_huella(valor)
    Path(ruta).parent.mkdir(parents=True, exist_ok=True)
    Path(ruta).write_text(texto_bonito(objeto), encoding="utf-8")
    return objeto


def escribir_bonito(ruta: str | Path, valor: Any) -> None:
    Path(ruta).parent.mkdir(parents=True, exist_ok=True)
    Path(ruta).write_text(texto_bonito(valor), encoding="utf-8")


def leer_json(ruta: str | Path) -> Any:
    with open(ruta, encoding="utf-8") as f:
        return json.load(f)


def leer_verificando(ruta: str | Path) -> dict[str, Any]:
    """Lee un archivo con huella y la verifica (RF-06.1 lado Python). Lanza `HuellaInvalida`."""
    objeto = leer_json(ruta)
    if not isinstance(objeto, dict):
        raise HuellaInvalida(f"{ruta}: no es un objeto")
    declarada = objeto.get(CLAVE_HUELLA)
    calculada = huella(objeto)
    if declarada != calculada:
        raise HuellaInvalida(f"{ruta}: huella declarada {declarada!r} ≠ calculada {calculada}")
    return objeto


# ------------------------------------------------------------------ fixture del gate de contrato

VALORES_TRAMPOSOS: list[tuple[str, Any]] = [
    ("entero_uno", 1),
    ("flotante_uno_punto_cero", 1.0),
    ("suma_flotante", 0.1 + 0.2),
    ("exponente_grande", 1e21),
    ("exponente_limite", 1e20),
    ("exponente_pequeno", 1e-7),
    ("decimal_pequeno", 0.000001),
    ("entero_seguro_maximo", 2**53 - 1),
    ("menos_cero", -0.0),
    ("negativo", -12.5),
    ("nfc_y_nfd_como_claves", {"é": "nfd", "é": "nfc"}),
    ("orden_de_claves_utf16", {"z": 1, "Z": 2, "ñ": 3, "€": 4, "￿": 5, "\U0001d11e": 6}),
    ("controles_y_escapes", 'tab\tnl\nquote"barra\\slash/\u001f fin'),
    ("vacios", {"objeto": {}, "lista": [], "cadena": ""}),
    ("anidado", {"b": [1, {"y": None, "x": [True, False]}], "a": {"c": "é"}}),
    ("booleanos_y_nulo", [True, False, None]),
    ("cadena_con_unicode", "español ¿qué? — \U0001f600"),
    # M-13: una cadena en NFD (e + acento combinante) que los dos lados deben normalizar a NFC.
    ("cadena_nfd", "cafe\u0301 y pin\u0303a"),
]


def texto_fixture(fixture: dict[str, Any]) -> str:
    """El fixture del gate de contrato tal cual, sin `normalizar`.

    Su `crudo` debe llegar al lado TS como entró (M-13).
    """
    return json.dumps(fixture, indent=2, sort_keys=True, ensure_ascii=False) + "\n"


def fixture_tramposo() -> dict[str, Any]:
    casos = []
    for nombre, valor in VALORES_TRAMPOSOS:
        # `crudo` es el valor tal como entra (claves NFD, -0.0, 1.0); `valor`, ya normalizado. El lado TS
        # debe dar el mismo JCS y la misma huella desde los dos (M-13: antes solo recibía el normalizado).
        casos.append(
            {
                "nombre": nombre,
                "crudo": valor,
                "valor": normalizar(valor),
                "jcs": jcs_texto(valor),
                "huella": huella(valor),
            }
        )
    return {"formato": "planlang-contrato-jcs/v1", "casos": casos}


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="JSON canónico y huellas (RFC 8785 + SHA-256)")
    p.add_argument("--escribir-fixture", metavar="RUTA", help="escribe el fixture del gate de contrato")
    p.add_argument("--huella", metavar="RUTA", help="imprime la huella calculada del archivo")
    p.add_argument("--verificar", metavar="RUTA", help="verifica la huella declarada del archivo")
    args = p.parse_args(argv)
    if args.escribir_fixture:
        destino = Path(args.escribir_fixture)
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(texto_fixture(fixture_tramposo()), encoding="utf-8")
        print(f"fixture escrito: {args.escribir_fixture}")
    if args.huella:
        print(huella(leer_json(args.huella)))
    if args.verificar:
        try:
            leer_verificando(args.verificar)
        except HuellaInvalida as e:
            print(str(e), file=sys.stderr)
            return 1
        print(f"huella OK: {args.verificar}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
