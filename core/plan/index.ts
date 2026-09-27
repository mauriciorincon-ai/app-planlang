export * from "./esquema";
export { mismaVerdad } from "./compatibilidad";
export {
  validarPlan,
  CODIGOS,
  type Codigo,
  type Motivo,
  type ResultadoValidacion,
} from "./validador";
export {
  cargarPlan,
  aprobarPlan,
  type ResultadoCarga,
  type ResultadoAprobacion,
} from "./cargar";
export {
  contratoParaConstructor,
  umbralesAplicados,
  resolverValor,
  ramaPorDefecto,
  type ContratoParaConstructor,
  type AristaResuelta,
  type UmbralesAplicados,
} from "./contrato-constructor";
