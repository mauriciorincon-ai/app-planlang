"""Entrevistador M2 (S3): conduce la entrevista que propone el plan de un demo y entrega un BORRADOR.

Código primero (ADR-012): la máquina de estados, el orden de las preguntas, sus ejemplos, las propuestas de
la plantilla, el origen de cada elemento, las señales que el agente tendrá que registrar y la regla «nunca
aprueba» son código. El modelo solo redacta una respuesta libre como elemento del plan, en español y en
inglés, con salida estructurada; si falla, queda la respuesta literal y la sección pendiente.
"""
