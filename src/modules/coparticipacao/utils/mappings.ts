import type {
  CopayDateFormat,
  CopayOperator,
  CopayOwnerType,
  ProcessingStatus,
} from "@/modules/coparticipacao/types/copay.types";

export const DEFAULT_ACTIVE_TOKENS = ["ATIVO", "ATIVA", "ACTIVE"];
export const DEFAULT_AUTONOMOUS_TOKENS = ["AUTONOMO", "AUTONOMA", "RPA", "PJ"];
export const MINIMUM_ELIGIBLE_SALARY = 5;

export const STATUS_LABELS: Record<ProcessingStatus, string> = {
  OK: "OK",
  OK_MANUAL: "OK manual",
  NAO_ENCONTRADO: "Nao encontrado",
  AMBIGUO: "Ambiguo",
  INELEGIVEL: "Inelegivel",
  INVALIDO: "Invalido",
};

const EVENT_CODE_MAP: Record<CopayOperator, Record<CopayOwnerType, string>> = {
  UNIMED: {
    TITULAR: "0607",
    DEPENDENTE: "0607",
  },
  AMIL: {
    TITULAR: "0843",
    DEPENDENTE: "0843",
  },
  SULAMERICA: {
    TITULAR: "9496",
    DEPENDENTE: "9497",
  },
};

export const getEventCode = (
  operator: CopayOperator,
  ownerType: CopayOwnerType,
) => EVENT_CODE_MAP[operator][ownerType];

export const formatCompetenciaDate = (
  competencia: string,
  format: CopayDateFormat,
) => {
  const date = new Date(`${competencia}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());

  if (format === "DDMMAAAA") {
    return `${day}${month}${year}`;
  }

  return `${day}/${month}/${year}`;
};

export const buildOutputFilename = (
  competencia: string,
  operator: CopayOperator,
  extension: string,
) => {
  const compactDate = competencia.replace(/-/g, "");
  return `copay_${compactDate}_${operator.toLowerCase()}.${extension}`;
};
