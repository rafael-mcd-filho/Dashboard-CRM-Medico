import { Ban, ShieldX, TriangleAlert } from "lucide-react";
import AccessShell from "@/components/auth/AccessShell";

type AccessDeniedProps = {
  userId: string | null;
};

const AccessDenied = ({ userId }: AccessDeniedProps) => {
  const receivedCredential = userId ? `userid=${userId}` : "userid ausente";

  return (
    <AccessShell
      eyebrow="Acesso restrito"
      icon={ShieldX}
      tone="rose"
      title="Este usuario nao esta liberado para acessar o dashboard."
      description="O conteudo deste painel e exibido apenas para usuarios previamente autorizados. Se voce recebeu este link e acredita que o bloqueio e indevido, valide o userid informado e contate o administrador do CRM."
      highlights={[
        {
          label: "Status",
          value: "Acesso negado para a credencial informada.",
        },
        {
          label: "Parametro",
          value: <span className="font-mono text-[13px]">{receivedCredential}</span>,
        },
        {
          label: "Acao",
          value: "Solicite a liberacao do seu usuario junto ao administrador do CRM.",
        },
      ]}
    >
      <div className="relative overflow-hidden">
        <div className="border-b border-[#F0E4E0] bg-[linear-gradient(180deg,#FFF8F5_0%,#FFFFFF_100%)] px-7 py-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-[#F4D7D7] bg-[#FFF1F1] text-[#B42318] shadow-sm">
              <Ban className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C07E6A]">
                Controle de acesso
              </p>
              <h2 className="text-[1.9rem] font-semibold leading-none tracking-[-0.04em] text-[#0F1923]">
                Permissao nao encontrada
              </h2>
              <p className="max-w-sm text-sm leading-7 text-[#6A5B58]">
                O painel reconheceu a requisicao, mas o usuario nao faz parte da allowlist atual.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-7 py-7">
          <div className="rounded-[22px] border border-[#F0E4E0] bg-[#FFF8F5] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C07E6A]">
              Credencial recebida
            </p>
            <p className="mt-3 break-all font-mono text-sm leading-7 text-[#7A2E1F]">
              {receivedCredential}
            </p>
          </div>

          <div className="rounded-[22px] border border-[#E7ECF2] bg-[#FAFCFD] p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-[#B42318] shadow-sm">
                <TriangleAlert className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#0F1923]">O que verificar agora</p>
                <div className="space-y-2 text-sm leading-7 text-[#5C6B7A]">
                  <p>Confirme se o link foi aberto com o <span className="font-mono">userid</span> correto.</p>
                  <p>Se o identificador estiver certo, solicite a liberacao com o administrador do CRM.</p>
                  <p>Se o acesso era esperado, revise a allowlist configurada no deploy.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccessShell>
  );
};

export default AccessDenied;
