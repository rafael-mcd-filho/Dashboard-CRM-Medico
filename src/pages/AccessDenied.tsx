import { Ban, ShieldX, TriangleAlert } from "lucide-react";
import AccessShell from "@/components/auth/AccessShell";

type AccessDeniedProps = {
  userId: string | null;
  mode?: "userid" | "account";
};

const AccessDenied = ({ userId, mode = "userid" }: AccessDeniedProps) => {
  const receivedCredential = userId ? `userid=${userId}` : "userid ausente";
  const isAccountDenied = mode === "account";

  if (!isAccountDenied) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#F3F7FB] text-[#0F1923]">
        <div className="absolute left-[-8rem] top-[-6rem] h-[26rem] w-[26rem] rounded-full bg-[rgba(185,28,28,0.14)] blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-[rgba(245,158,11,0.12)] blur-3xl" />
        <div className="bg-dashboard-grid absolute inset-0 opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(243,247,251,0.18),rgba(243,247,251,0.92))]" />

        <div className="relative mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-8 md:px-10">
          <section className="panel-shell animate-slide-up w-full max-w-3xl overflow-hidden border-white/85 bg-white/88 shadow-[0_35px_120px_rgba(15,25,35,0.12)] backdrop-blur-xl">
            <div className="h-px bg-gradient-to-r from-[#B42318] via-[#F59E0B] to-transparent" />
            <div className="flex flex-col items-center gap-8 px-8 py-12 text-center md:px-14 md:py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-[#F4D7D7] bg-[#FFF1F1] text-[#B42318] shadow-sm">
                <Ban className="h-7 w-7" aria-hidden="true" />
              </div>

              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C07E6A]">
                  Acesso restrito
                </p>
                <h1 className="mx-auto max-w-2xl text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.05em] md:text-[3.2rem]">
                  Voce nao tem permissao para acessar esta aba.
                </h1>
                <p className="mx-auto max-w-xl text-[15px] leading-8 text-[#5C6B7A] md:text-[16px]">
                  Se voce acredita que isso e um engano, contacte o administrador do CRM.
                </p>
              </div>

              <div className="rounded-[22px] border border-[#F0E4E0] bg-[#FFF8F5] px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C07E6A]">
                  Credencial recebida
                </p>
                <p className="mt-3 break-all font-mono text-sm leading-7 text-[#7A2E1F]">
                  {receivedCredential}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

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
