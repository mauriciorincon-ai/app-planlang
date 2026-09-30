/**
 * Ids del mapa ↔ ids del código. El contrato exige `^[a-z0-9]+(-[a-z0-9]+)*$` y el grafo de LangGraph usa
 * guion bajo (`verificador_cobertura`): la conversión cambia `_` por `-` y es inyectiva mientras ningún id del
 * código traiga guion (se comprueba; ADR-010).
 */
export const PATRON_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function idDeMapa(idCodigo: string): string {
  if (idCodigo.includes("-"))
    throw new Error(
      `visor: el id «${idCodigo}» trae guion; la conversión dejaría de ser inyectiva`,
    );
  const id = idCodigo.replaceAll("_", "-");
  if (!PATRON_ID.test(id))
    throw new Error(
      `visor: «${idCodigo}» no produce un id válido del mapa («${id}»)`,
    );
  return id;
}

export function idDeCodigo(idMapa: string): string {
  return idMapa.replaceAll("-", "_");
}
