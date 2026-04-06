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
  isBroncoscopiaCard,
  isProcedimentoCard,
  type FunnelCardDraft,
  type UnifiedFunnelCard,
} from "@/lib/funnelCards";

type CardEditorSheetProps = {
  card: UnifiedFunnelCard | null;
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
    <label className="space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A97A6]">
        {label}
      </span>
      {children}
    </label>
  );
}

export function CardEditorSheet({
  card,
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

  const updateField = <K extends keyof FunnelCardDraft>(
    field: K,
    value: FunnelCardDraft[K]
  ) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const typeValue = getCardTypeValue(card);

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
                <span className="font-mono text-[#0F1923]">{card.key || "—"}</span>
              </span>
              <span className="rounded-full border border-[#E2E6EB] bg-[#FAFBFC] px-3 py-1 text-[11px] font-medium text-[#5C6B7A]">
                Card:{" "}
                <span className="font-mono text-[#0F1923]">
                  {card.id_do_card || "—"}
                </span>
              </span>
            </div>
            <SheetTitle className="mt-3 text-[1.45rem] font-semibold tracking-[-0.04em] text-[#0F1923]">
              Editar card operacional
            </SheetTitle>
            <SheetDescription className="max-w-[60ch] text-[13px] leading-6 text-[#5C6B7A]">
              Ajuste os campos do card selecionado e salve para refletir a alteracao diretamente no banco.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-6 px-6 py-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-[#DCE7F8] bg-[linear-gradient(180deg,#FFFFFF_0%,#F7FAFF_100%)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A97A6]">
                  Identificacao
                </p>
                <div className="mt-3 space-y-2 text-sm text-[#40505F]">
                  <p>
                    <span className="font-medium text-[#0F1923]">Contato ID:</span>{" "}
                    <span className="font-mono">{card.contato_id || "—"}</span>
                  </p>
                  <p>
                    <span className="font-medium text-[#0F1923]">Tipo atual:</span>{" "}
                    {typeValue || "Nao definido"}
                  </p>
                  <p>
                    <span className="font-medium text-[#0F1923]">Tabela:</span>{" "}
                    <span className="font-mono">{card.table}</span>
                  </p>
                </div>
              </div>

              <div className="rounded-[22px] border border-[#E2E6EB] bg-[#FAFBFC] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A97A6]">
                  Regras desta tela
                </p>
                <div className="mt-3 space-y-2 text-sm leading-6 text-[#5C6B7A]">
                  <p>Campos vazios sao salvos como nulo.</p>
                  <p>Datas podem ser informadas no mesmo formato que voce importa hoje.</p>
                  <p>Essa edicao atua apenas no card do funil, nao no cadastro de contatos.</p>
                </div>
              </div>
            </div>

            <section className="rounded-[24px] border border-[#E2E6EB] bg-white p-5 shadow-[0_16px_36px_rgba(15,25,35,0.04)]">
              <div className="mb-4">
                <h3 className="text-[15px] font-semibold text-[#0F1923]">
                  Campos principais
                </h3>
                <p className="mt-1 text-[13px] text-[#5C6B7A]">
                  Edite os dados comuns do card antes de ajustar os campos especificos do funil.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome do contato">
                  <Input
                    value={draft.nome_contato}
                    onChange={(event) =>
                      updateField("nome_contato", event.target.value)
                    }
                    className="h-11 rounded-xl border-[#D8E0E8]"
                  />
                </Field>
                <Field label="Responsavel">
                  <Input
                    value={draft.responsavel}
                    onChange={(event) =>
                      updateField("responsavel", event.target.value)
                    }
                    className="h-11 rounded-xl border-[#D8E0E8]"
                  />
                </Field>
                <Field label="Etapa no CRM">
                  <Input
                    value={draft.etapa_no_crm}
                    onChange={(event) =>
                      updateField("etapa_no_crm", event.target.value)
                    }
                    className="h-11 rounded-xl border-[#D8E0E8]"
                  />
                </Field>
                <Field label="Modalidade de pagamento">
                  <Input
                    value={draft.modalidade_pagamento}
                    onChange={(event) =>
                      updateField("modalidade_pagamento", event.target.value)
                    }
                    className="h-11 rounded-xl border-[#D8E0E8]"
                  />
                </Field>
                <Field label="Data de agendamento">
                  <Input
                    value={draft.data_agendamento}
                    onChange={(event) =>
                      updateField("data_agendamento", event.target.value)
                    }
                    placeholder="DD/MM/AAAA"
                    className="h-11 rounded-xl border-[#D8E0E8]"
                  />
                </Field>
                <Field label="Horario de agendamento">
                  <Input
                    value={draft.horario_agendamento}
                    onChange={(event) =>
                      updateField("horario_agendamento", event.target.value)
                    }
                    placeholder="HH:MM"
                    className="h-11 rounded-xl border-[#D8E0E8]"
                  />
                </Field>
                <Field label="Data de pagamento">
                  <Input
                    value={draft.data_pagamento}
                    onChange={(event) =>
                      updateField("data_pagamento", event.target.value)
                    }
                    placeholder="DD/MM/AAAA"
                    className="h-11 rounded-xl border-[#D8E0E8]"
                  />
                </Field>
                <Field label="Valor atribuido">
                  <Input
                    value={draft.valor_atribuido}
                    onChange={(event) =>
                      updateField("valor_atribuido", event.target.value)
                    }
                    placeholder="Ex.: 1500 ou R$ 1.500,00"
                    className="h-11 rounded-xl border-[#D8E0E8]"
                  />
                </Field>
                <Field label="Link da conversa">
                  <Input
                    value={draft.link_da_conversa}
                    onChange={(event) =>
                      updateField("link_da_conversa", event.target.value)
                    }
                    className="h-11 rounded-xl border-[#D8E0E8]"
                  />
                </Field>
                <Field label="Contato ID">
                  <Input
                    value={draft.contato_id}
                    readOnly
                    className="h-11 rounded-xl border-[#D8E0E8] bg-[#F7F9FB] font-mono text-[#5C6B7A]"
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Descricao do card">
                  <Textarea
                    value={draft.descricao_card}
                    onChange={(event) =>
                      updateField("descricao_card", event.target.value)
                    }
                    className="min-h-[140px] rounded-2xl border-[#D8E0E8]"
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-[24px] border border-[#E2E6EB] bg-[#FCFDFE] p-5">
              <div className="mb-4">
                <h3 className="text-[15px] font-semibold text-[#0F1923]">
                  Campos do funil
                </h3>
                <p className="mt-1 text-[13px] text-[#5C6B7A]">
                  Ajustes especificos para {meta.label.toLowerCase()}.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {card.funnel === "consultas" ? (
                  <Field label="Tipo de consulta">
                    <Input
                      value={draft.tipo_consulta}
                      onChange={(event) =>
                        updateField("tipo_consulta", event.target.value)
                      }
                      className="h-11 rounded-xl border-[#D8E0E8]"
                    />
                  </Field>
                ) : null}

                {isBroncoscopiaCard(card) || isProcedimentoCard(card) ? (
                  <Field label="Tipo de paciente">
                    <Input
                      value={draft.tipo_paciente}
                      onChange={(event) =>
                        updateField("tipo_paciente", event.target.value)
                      }
                      className="h-11 rounded-xl border-[#D8E0E8]"
                    />
                  </Field>
                ) : null}

                {isBroncoscopiaCard(card) ? (
                  <Field label="Quantidade de codigos">
                    <Input
                      value={draft.quantidade_codigos}
                      onChange={(event) =>
                        updateField("quantidade_codigos", event.target.value)
                      }
                      className="h-11 rounded-xl border-[#D8E0E8]"
                    />
                  </Field>
                ) : null}

                {isProcedimentoCard(card) ? (
                  <>
                    <Field label="Custo hospital">
                      <Input
                        value={draft.custo_hospital}
                        onChange={(event) =>
                          updateField("custo_hospital", event.target.value)
                        }
                        className="h-11 rounded-xl border-[#D8E0E8]"
                      />
                    </Field>
                    <Field label="Custo anestesia">
                      <Input
                        value={draft.custo_anestesia}
                        onChange={(event) =>
                          updateField("custo_anestesia", event.target.value)
                        }
                        className="h-11 rounded-xl border-[#D8E0E8]"
                      />
                    </Field>
                    <Field label="Custo comissao">
                      <Input
                        value={draft.custo_comissao}
                        onChange={(event) =>
                          updateField("custo_comissao", event.target.value)
                        }
                        className="h-11 rounded-xl border-[#D8E0E8]"
                      />
                    </Field>
                    <Field label="Custo instrumentacao">
                      <Input
                        value={draft.custo_instrumentacao}
                        onChange={(event) =>
                          updateField("custo_instrumentacao", event.target.value)
                        }
                        className="h-11 rounded-xl border-[#D8E0E8]"
                      />
                    </Field>
                    <Field label="Impostos">
                      <Input
                        value={draft.impostos}
                        onChange={(event) =>
                          updateField("impostos", event.target.value)
                        }
                        className="h-11 rounded-xl border-[#D8E0E8]"
                      />
                    </Field>
                  </>
                ) : null}
              </div>
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
                      <ExternalLink className="h-4 w-4" />
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
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="h-10 rounded-xl bg-clinic-blue px-5"
                  onClick={() => void onSave(draft)}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Salvando..." : "Salvar alteracoes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
