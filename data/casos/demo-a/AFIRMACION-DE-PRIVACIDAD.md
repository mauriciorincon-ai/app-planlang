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
| planlang-a-001-20 | 20 | `886e36e5dff396ab9cd74a03615782d320c5287afe8702e8a6dcff5a2eee359c` |
| planlang-a-001-200 | 200 | `1ea71b9c29a1fbafb625b3fa6858fe236e5765c61a355546d2a87eff2e0369dd` |
| planlang-a-humo-3 | 3 | `b63d36da8176fab642b5d6a6bd66ff73b6d722c7a960621da5cdb07704ce011a` |
| planlang-a-002-200 | 200 | `5e76ef4cf562852c25aab2e041d55f17f809043450fe48e35c045cb419c8e62f` |
