import { DatabaseZap, TriangleAlert } from "lucide-react";
import AccessShell from "@/components/auth/AccessShell";

type AccessConfigurationErrorProps = {
  details?: string;
};

const AccessConfigurationError = ({ details }: AccessConfigurationErrorProps) => {
  return (
    <AccessShell
      eyebrow="Configuracao pendente"
      icon={DatabaseZap}
      tone="rose"
      title="A estrutura segura de acesso ainda nao foi concluida."
      description="O login foi processado, mas o backend ainda nao encontrou a configuracao de permissoes esperada para liberar a leitura do dashboard."
      highlights={[
        {
          label: "Provavel causa",
          value: "A migration de acesso ainda nao foi executada no Supabase.",
        },
        {
          label: "Proximo passo",
          value: "Aplique a migration e cadastre as permissoes da conta autenticada.",
        },
        {
          label: "Impacto",
          value: "Sem essa etapa, a aplicacao nao consegue validar o acesso no backend.",
        },
      ]}
    >
      <div className="space-y-6 px-7 py-7">
        <div className="rounded-[22px] border border-[#F0E4E0] bg-[#FFF8F5] p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-[#B42318] shadow-sm">
              <TriangleAlert className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[#0F1923]">Como concluir a configuracao</p>
              <div className="space-y-2 text-sm leading-7 text-[#5C6B7A]">
                <p>Execute a migration de acesso no Supabase.</p>
                <p>Crie o usuario no Supabase Auth.</p>
                <p>Cadastre uma linha em <span className="font-mono">public.dashboard_access</span> ligando o usuario autenticado ao <span className="font-mono">userid</span> permitido.</p>
              </div>
            </div>
          </div>
        </div>

        {details ? (
          <div className="rounded-[22px] border border-[#E7ECF2] bg-[#FAFCFD] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9BAAB8]">
              Detalhe tecnico
            </p>
            <p className="mt-3 break-words font-mono text-xs leading-6 text-[#5C6B7A]">
              {details}
            </p>
          </div>
        ) : null}
      </div>
    </AccessShell>
  );
};

export default AccessConfigurationError;
