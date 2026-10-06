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
export {
  contradicciones,
  rutasPendientes,
  MARCA_PENDIENTE,
  SEVERIDAD_QUE_EXIGE_CRITERIO,
  CODIGOS_CONTRADICCION,
  type Contradiccion,
  type CodigoContradiccion,
  type PreguntaPendiente,
} from "./contradicciones";
export {
  comandoRetomar,
  demoDelPlan,
  revisarBorrador,
  textoDeRevision,
  impideAprobar,
  pendientesDe,
  TranscripcionSchema,
  type Transcripcion,
  type Revision,
} from "./revision";
