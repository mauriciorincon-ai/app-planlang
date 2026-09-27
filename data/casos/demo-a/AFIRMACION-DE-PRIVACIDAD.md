# Afirmación de privacidad · Privacy claim

> Conjunto sintético del demo A de planlang · generador v1.0.0.
> Archivo generado por `pnpm casos:generar --versionados`: no se edita a mano.
> Generated file: do not edit by hand.

## Español

Ningún caso de este conjunto describe a una persona real. Cada registro se genera desde una semilla declarada con diccionarios cerrados: nombres con apellidos inventados, prestadores rotulados como sintéticos, procedimientos y diagnósticos genéricos con códigos SYN. No existe un conjunto real de origen, así que no hay pertenencia que inferir ni registro que reidentificar. Modelo de amenaza: alguien con acceso completo al repositorio intenta vincular un identificador con una persona real, inferir si alguien real está en el conjunto o hacer creer que el demo expone datos reales. Controles: identificadores con prefijo SYN, teléfonos del rango ficticio 555-01XX, correos en example.com, edades de 89 o menos, sin fechas ni direcciones; un validador en cada PR rechaza cédulas en rango real, NIT con dígito de verificación válido y los identificadores de salud de HIPAA con formato realista. Para refutar esta afirmación basta encontrar en el conjunto un identificador con formato real. Límites: un nombre inventado puede coincidir por azar con el de alguien, pero sin otro dato no identifica; el realismo clínico no lo revisó un par del sector.

## English

No case in this set describes a real person. Every record is generated from a declared seed with closed dictionaries: first names with invented surnames, providers labelled as synthetic, generic procedures and diagnoses with SYN codes. There is no real source dataset, so there is no membership to infer and no record to re-identify. Threat model: someone with full access to the repository tries to link an identifier to a real person, to infer whether a real person is in the set, or to make people believe the demo exposes real data. Controls: identifiers with a SYN prefix, phone numbers from the fictional 555-01XX range, email addresses at example.com, ages of 89 or under, no dates or addresses; a validator on every PR rejects Colombian ID numbers in the real range, tax IDs with a valid check digit and the HIPAA health identifiers in a realistic format. To refute this claim it is enough to find one identifier with a real format in the set. Limits: an invented name may match someone's by chance, but it identifies no one without other data; the clinical realism was not reviewed by an industry peer.

## Lotes cubiertos · Batches covered

| Lote · Batch | Casos · Cases | Huella · Fingerprint (SHA-256) |
|---|---|---|
| planlang-a-001-20 | 20 | `6b03b9b42729240f83986fdf9200807d263388c824b79da174ad8453993eea33` |
| planlang-a-001-200 | 200 | `bff118020cf2e662142ab8be3d43d0eb741789fe7cd13e5c5277af3435391761` |
| planlang-a-humo-3 | 3 | `9b32b214f41a74efbbd6ce6d444611872d86b0b67cff1707092a4f8518c1e048` |
