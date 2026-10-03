/**
 * Ids del mapa ↔ ids del código. El contrato exige `^[a-z0-9]+(-[a-z0-9]+)*$` y el grafo de LangGraph usa
 * guion bajo (`verificador_cobertura`): la conversión cambia `_` por `-` y es inyectiva mientras ningún id del
 * código traiga guion (se comprueba; ADR-010).
 */
export const PATRON_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Los ids de los terminales del lienzo (`inicio`, `fin`): ningún nodo del código puede llamarse así (AU-S2-B47). */
export const IDS_RESERVADOS: readonly string[] = ["inicio", "fin"];

export function idDeMapa(idCodigo: string): string {
  if (idCodigo.includes("-"))
    throw new Error(
      `visor: el id «${idCodigo}» trae guion; la conversión dejaría de ser inyectiva`,
    );
  const id = idCodigo.replaceAll("_", "-");
  if (IDS_RESERVADOS.includes(id))
    throw new Error(
      `visor: el nodo «${idCodigo}» choca con un terminal del lienzo («${id}» está reservado)`,
    );
  if (!PATRON_ID.test(id))
    throw new Error(
      `visor: «${idCodigo}» no produce un id válido del mapa («${id}»)`,
    );
  return id;
}

export function idDeCodigo(idMapa: string): string {
  return idMapa.replaceAll("-", "_");
}
