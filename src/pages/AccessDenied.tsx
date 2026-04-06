import { Ban, ShieldX, TriangleAlert } from "lucide-react";
import AccessShell from "@/components/auth/AccessShell";

type AccessDeniedProps = {
  userId: string | null;
  mode?: "userid" | "account";
};

const AccessDenied = ({ userId, mode = "userid" }: AccessDeniedProps) => {
  const receivedCredential = userId ? `userid=${userId}` : "userid ausente";
  const isAccountDenied = mode === "account";

  const title = isAccountDenied
    ? userId
      ? "Sua conta nao possui permissao para este acesso."
      : "Sua conta ainda nao possui permissao para acessar o dashboard."
    : "Voce nao tem permissao para acessar esta aba.";

  const description = isAccountDenied
    ? userId
      ? "A autenticacao foi concluida, mas a conta atual nao possui vinculo ativo com o userid informado. Se isso estiver incorreto, solicite a revisao do acesso ao administrador do CRM."
      : "A autenticacao foi concluida, mas nenhuma permissao ativa foi encontrada para a conta atual. Solicite a liberacao ao administrador do CRM."
    : "Se voce acredita que isso e um engano, contacte o administrador do CRM.";

  const statusText = isAccountDenied
    ? "Autenticacao concluida, mas sem permissao ativa para este painel."
    : "Acesso negado.";

  const actionText = isAccountDenied
    ? "Solicite a associacao da sua conta com o acesso correto no CRM."
    : "Solicite a liberacao do seu usuario junto ao administrador do CRM.";

  const detailText = isAccountDenied
    ? userId
      ? "A conta autenticada nao possui vinculo com o userid solicitado."
      : "Nenhuma permissao ativa foi localizada para a conta autenticada."
    : "O userid informado nao possui acesso a esta aba.";

  return (
    <AccessShell
      eyebrow="Acesso restrito"
      icon={ShieldX}
      tone="rose"
      title={title}
      description={description}
      highlights={[
        {
          label: "Status",
          value: statusText,
        },
        {
          label: "Parametro",
          value: <span className="font-mono text-[13px]">{receivedCredential}</span>,
        },
        {
          label: "Acao",
          value: actionText,
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
                {detailText}
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
                  {isAccountDenied ? (
                    <>
                      <p>Confirme se o link foi aberto com o <span className="font-mono">userid</span> correto.</p>
                      <p>Verifique se a conta autenticada esta vinculada ao acesso esperado.</p>
                      <p>Se o bloqueio nao era esperado, revise as permissoes configuradas no CRM.</p>
                    </>
                  ) : (
                    <>
                      <p>Voce nao tem permissao para acessar esta aba.</p>
                      <p>Se acredita que isso e um engano, contacte o administrador do CRM.</p>
                    </>
                  )}
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
