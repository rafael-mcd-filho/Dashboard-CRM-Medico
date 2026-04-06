import { LoaderCircle, ShieldCheck } from "lucide-react";
import AccessShell from "@/components/auth/AccessShell";

const AccessLoading = () => {
  return (
    <AccessShell
      eyebrow="Validacao de acesso"
      icon={ShieldCheck}
      tone="blue"
      title="Estamos confirmando suas credenciais e permissoes de acesso."
      description="A validacao da sessao e das regras do dashboard leva apenas alguns instantes. Aguarde enquanto preparamos o ambiente."
      highlights={[
        {
          label: "Sessao",
          value: "Verificando autenticacao ativa para este navegador.",
        },
        {
          label: "Permissoes",
          value: "Conferindo as regras de acesso configuradas para o painel.",
        },
        {
          label: "Entrada",
          value: "Se tudo estiver correto, o dashboard sera carregado automaticamente.",
        },
      ]}
    >
      <div className="flex h-full min-h-[560px] flex-col items-center justify-center gap-6 px-8 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-[#D7E5FF] bg-[#EEF4FF] text-[#1A56DB] shadow-sm">
          <LoaderCircle className="h-7 w-7 animate-spin" aria-hidden="true" />
        </div>
        <div className="space-y-3">
          <h2 className="text-[1.9rem] font-semibold tracking-[-0.04em] text-[#0F1923]">
            Validando acesso
          </h2>
          <p className="mx-auto max-w-sm text-sm leading-7 text-[#5C6B7A]">
            O sistema esta confirmando sua sessao e as permissoes desta conta no CRM.
          </p>
        </div>
      </div>
    </AccessShell>
  );
};

export default AccessLoading;
