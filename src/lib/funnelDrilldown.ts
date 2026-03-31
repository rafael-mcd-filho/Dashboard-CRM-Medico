export type FunnelStageDrilldownRecord = {
  id: string;
  nome: string;
  etapa: string;
  dataAgendamento: string;
  responsavel: string;
  valor: number;
  detalhes: string[];
  dataReferencia?: string | null;
  meta?: Record<string, string | number | boolean | null | undefined>;
};
