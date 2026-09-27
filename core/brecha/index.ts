export * from "./condiciones";
export {
  leerEntrada,
  ErrorDeLectura,
  CODIGOS_LECTURA,
  type ArchivosDeCorrida,
  type EntradaVerificador,
  type EntradaLeida,
  type CorridaLeida,
  type MotivoLectura,
} from "./lector";
export {
  generarInforme,
  FORMATO_INFORME,
  VERSION_VERIFICADOR,
  type Informe,
} from "./informe";
export { renderizarInforme } from "./render-md";
export {
  verificarContrato,
  rf092,
  ramasResueltas,
  type ResultadoContrato,
} from "./contrato-grafo";
export { veredicto, type Veredicto } from "./veredicto";
