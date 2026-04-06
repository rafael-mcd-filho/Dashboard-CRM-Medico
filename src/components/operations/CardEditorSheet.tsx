import { useEffect, useState, type ReactNode } from "react";
import { ExternalLink, Save } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FUNNEL_CARD_META,
  createFunnelCardDraft,
  getCardTypeValue,
  type FunnelCardDraft,
  type UnifiedFunnelCard,
} from "@/lib/funnelCards";

type CardEditorSheetMode = "view" | "edit";

type CardEditorSheetProps = {
  card: UnifiedFunnelCard | null;
  mode: CardEditorSheetMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: FunnelCardDraft) => Promise<void>;
  isSaving: boolean;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A97A6]">
        {label}
      </span>
      {children}
    </label>
  );
}

function ReadonlyInput({ value }: { value: string }) {
  return (
    <Input
      value={value}
      readOnly
      className="h-11 rounded-xl border-[#D8E0E8] bg-[#F7F9FB] text-[#40505F]"
    />
  );
}

function emptyLabel(value: string | null | undefined, fallback = "Nao informado") {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

export function CardEditorSheet({
  card,
  mode,
  open,
  onOpenChange,
  onSave,
  isSaving,
}: CardEditorSheetProps) {
  const [draft, setDraft] = useState<FunnelCardDraft | null>(null);

  useEffect(() => {
    setDraft(card ? createFunnelCardDraft(card) : null);
  }, [card]);

  if (!card || !draft) {
    return null;
  }

  const meta = FUNNEL_CARD_META[card.funnel];
  const Icon = meta.icon;
  const isEditMode = mode === "edit";
  const typeValue = getCardTypeValue(card);

  const updateField = <K extends keyof FunnelCardDraft>(
    field: K,
    value: FunnelCardDraft[K]
  ) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l border-[#E2E6EB] bg-white p-0 sm:max-w-[760px]"
      >
        <div className="flex min-h-full flex-col">
          <SheetHeader className="border-b border-[#E2E6EB] px-6 py-5 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium ${meta.soft}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {meta.label}
              </span>
              <span className="rounded-full border border-[#E2E6EB] bg-[#FAFBFC] px-3 py-1 text-[11px] font-medium text-[#5C6B7A]">
                CRM key:{" "}
                <span className="font-mono text-[#0F1923]">
                  {card.key || "-"}
                </span>
              </span>
              <span className="rounded-full border border-[#E2E6EB] bg-[#FAFBFC] px-3 py-1 text-[11px] font-medium text-[#5C6B7A]">
                Card:{" "}
                <span className="font-mono text-[#0F1923]">
                  {card.id_do_card || "-"}
                </span>
              </span>
            </div>

            <SheetTitle className="mt-3 text-[1.45rem] font-semibold tracking-[-0.04em] text-[#0F1923]">
              {isEditMode ? "Editar card operacional" : "Visualizar card operacional"}
            </SheetTitle>
            <SheetDescription className="max-w-[60ch] text-[13px] leading-6 text-[#5C6B7A]">
              {isEditMode
                ? "Somente data de pagamento, valor e descricao podem ser alterados nesta tela."
                : "Consulte os dados consolidados do card. Para ajustes, use a acao de editar."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-6 px-6 py-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] border border-[#DCE7F8] bg-[linear-gradient(180deg,#FFFFFF_0%,#F7FAFF_100%)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A97A6]">
                  Contato
                </p>
                <p className="mt-3 text-base font-semibold text-[#0F1923]">
                  {emptyLabel(card.nome_contato, "Sem nome")}
                </p>
                <p className="mt-1 font-mono text-[12px] text-[#5C6B7A]">
                  {emptyLabel(card.contato_id, "-")}
                </p>
              </div>

              <div className="rounded-[22px] border border-[#E2E6EB] bg-[#FAFBFC] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A97A6]">
                  Agendamento
                </p>
                <p className="mt-3 text-base font-semibold text-[#0F1923]">
                  {emptyLabel(card.data_agendamento, "Nao agendado")}
                </p>
                <p className="mt-1 text-[12px] text-[#5C6B7A]">
                  {emptyLabel(card.horario_agendamento, "Sem horario")}
                </p>
              </div>

              <div className="rounded-[22px] border border-[#E2E6EB] bg-[#FAFBFC] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A97A6]">
                  Pagamento
                </p>
                <p className="mt-3 text-base font-semibold text-[#0F1923]">
                  {card.data_pagamento ? "Pago" : "Pendente"}
                </p>
                <p className="mt-1 text-[12px] text-[#5C6B7A]">
                  {emptyLabel(card.data_pagamento, "Sem data de pagamento")}
                </p>
              </div>
            </div>

            <section className="rounded-[24px] border border-[#E2E6EB] bg-white p-5 shadow-[0_16px_36px_rgba(15,25,35,0.04)]">
              <div className="mb-4">
                <h3 className="text-[15px] font-semibold text-[#0F1923]">
                  Dados do card
                </h3>
                <p className="mt-1 text-[13px] text-[#5C6B7A]">
                  Os campos abaixo servem para consulta operacional. Apenas os
                  campos de pagamento, valor e descricao podem ser alterados.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Funil">
                  <ReadonlyInput value={meta.label} />
                </Field>
                <Field label="Contato">
                  <ReadonlyInput value={emptyLabel(draft.nome_contato, "Sem nome")} />
                </Field>
                <Field label="Responsavel">
                  <ReadonlyInput
                    value={emptyLabel(draft.responsavel, "Nao informado")}
                  />
                </Field>
                <Field label="Tipo de paciente">
                  <ReadonlyInput value={emptyLabel(typeValue, "Nao informado")} />
                </Field>
                <Field label="Modalidade de pagamento">
                  <ReadonlyInput
                    value={emptyLabel(
                      draft.modalidade_pagamento,
                      "Nao informada"
                    )}
                  />
                </Field>
                <Field label="Agendamento">
                  <ReadonlyInput
                    value={[
                      emptyLabel(draft.data_agendamento, "Nao agendado"),
                      emptyLabel(draft.horario_agendamento, "Sem horario"),
                    ].join("  |  ")}
                  />
                </Field>
                <Field label="Data de pagamento">
                  <Input
                    value={draft.data_pagamento}
                    onChange={(event) =>
                      updateField("data_pagamento", event.target.value)
                    }
                    readOnly={!isEditMode}
                    placeholder="DD/MM/AAAA"
                    className={`h-11 rounded-xl border-[#D8E0E8] ${
                      isEditMode ? "bg-white" : "bg-[#F7F9FB] text-[#40505F]"
                    }`}
                  />
                </Field>
                <Field label="Valor">
                  <Input
                    value={draft.valor_atribuido}
                    onChange={(event) =>
                      updateField("valor_atribuido", event.target.value)
                    }
                    readOnly={!isEditMode}
                    placeholder="Ex.: 1500 ou R$ 1.500,00"
                    className={`h-11 rounded-xl border-[#D8E0E8] ${
                      isEditMode ? "bg-white" : "bg-[#F7F9FB] text-[#40505F]"
                    }`}
                  />
                </Field>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Link da conversa">
                  <ReadonlyInput
                    value={emptyLabel(draft.link_da_conversa, "Nao informado")}
                  />
                </Field>
                <Field label="Tabela de origem">
                  <ReadonlyInput value={draft.table} />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Descricao">
                  <Textarea
                    value={draft.descricao_card}
                    onChange={(event) =>
                      updateField("descricao_card", event.target.value)
                    }
                    readOnly={!isEditMode}
                    className={`min-h-[152px] rounded-2xl border-[#D8E0E8] ${
                      isEditMode ? "bg-white" : "bg-[#F7F9FB] text-[#40505F]"
                    }`}
                  />
                </Field>
              </div>

              {!isEditMode ? (
                <div className="mt-4 rounded-2xl border border-[#E6ECF2] bg-[#FAFBFC] px-4 py-3 text-[13px] text-[#5C6B7A]">
                  Esta visualizacao e somente leitura.
                </div>
              ) : null}
            </section>
          </div>

          <div className="border-t border-[#E2E6EB] bg-white px-6 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                {draft.link_da_conversa ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-xl border-[#D8E0E8]"
                    asChild
                  >
                    <a
                      href={draft.link_da_conversa}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir conversa
                      <ExternalLink data-icon="inline-end" />
                    </a>
                  </Button>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl border-[#D8E0E8]"
                  onClick={() => onOpenChange(false)}
                >
                  Fechar
                </Button>
                {isEditMode ? (
                  <Button
                    type="button"
                    className="h-10 rounded-xl bg-clinic-blue px-5"
                    onClick={() => void onSave(draft)}
                    disabled={isSaving}
                  >
                    <Save data-icon="inline-start" />
                    {isSaving ? "Salvando..." : "Salvar alteracoes"}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
