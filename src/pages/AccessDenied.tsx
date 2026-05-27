import { useState } from "react";
import { Ban, ChevronDown, Mail, ShieldX } from "lucide-react";
import AccessShell from "@/components/auth/AccessShell";
import { cn } from "@/lib/utils";

type AccessDeniedProps = {
  userId: string | null;
  mode?: "userid" | "account" | "operations";
};

const AccessDenied = ({ userId, mode = "userid" }: AccessDeniedProps) => {
  const [techOpen, setTechOpen] = useState(false);
  const isOperationsDenied = mode === "operations";
  const isAccountDenied    = mode === "account";

  const receivedCredential = isOperationsDenied
    ? userId ? `email=${userId}` : "email ausente"
    : userId ? `userid=${userId}` : "userid ausente";

  /* mailto pré-formatado para solicitar acesso */
  const mailtoSubject = encodeURIComponent("Solicitação de acesso — Dashboard CRM Médico");
  const mailtoBody    = encodeURIComponent(
    `Olá,\n\nSolicito liberação de acesso.\n\nCredencial: ${receivedCredential}\nÁrea: ${mode}\n\nAguardo retorno.`
  );
  const mailtoHref = `mailto:?subject=${mailtoSubject}&body=${mailtoBody}`;

  /* Cópia simplificada do userid denied — layout mais compacto */
  if (!isAccountDenied && !isOperationsDenied) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-slate-50">
        <div className="bg-dashboard-grid absolute inset-0 opacity-25" />
        <div className="relative w-full max-w-md px-5">
          <div className="panel-shell overflow-hidden shadow-pop">
            <div className="h-px bg-gradient-to-r from-amber-500 via-amber-400 to-transparent" />
            <div className="flex flex-col items-center gap-6 px-7 py-10 text-center">
              {/* Ícone — tom âmbar (neutro, não crítico) */}
              <span className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 text-amber-600">
                <Ban className="h-6 w-6" aria-hidden="true" />
              </span>

              <div className="space-y-2">
                <p className="section-label before:hidden text-amber-600">
                  Acesso não liberado
                </p>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                  Acesso ainda não liberado
                </h1>
                <p className="text-[13px] leading-6 text-slate-500">
                  Solicite a permissão ao administrador do CRM.
                </p>
              </div>

              {/* CTA: solicitar acesso */}
              <a
                href={mailtoHref}
                className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] bg-slate-900 px-4 text-[13px] font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                Solicitar acesso
              </a>

              {/* Detalhes técnicos colapsáveis */}
              <div className="w-full">
                <button
                  type="button"
                  onClick={() => setTechOpen((v) => !v)}
                  aria-expanded={techOpen}
                  className="flex w-full items-center justify-between text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none"
                >
                  <span>Ver detalhes técnicos</span>
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 transition-transform", techOpen && "rotate-180")}
                    aria-hidden="true"
                  />
                </button>
                {techOpen && (
                  <div className="mt-2 rounded-[var(--radius-md)] bg-slate-50 px-3 py-2.5">
                    <p className="break-all font-mono text-[12px] text-slate-500">
                      {receivedCredential}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Denied com AccessShell (account / operations) ── */
  const title = isOperationsDenied
    ? "Sua conta não possui permissão para o Operacional"
    : userId
      ? "Sua conta não possui permissão para este acesso"
      : "Sua conta ainda não possui permissão para o dashboard";

  const description = isOperationsDenied
    ? "A autenticação foi concluída, mas este email não está liberado para o Operacional. Solicite a revisão ao administrador."
    : userId
      ? "A autenticação foi concluída, mas a conta atual não possui vínculo ativo com o userid informado."
      : "A autenticação foi concluída, mas nenhuma permissão ativa foi encontrada. Solicite a liberação.";

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
          value: isOperationsDenied
            ? "Autenticado, sem permissão para o Operacional."
            : "Autenticado, sem permissão para este painel.",
        },
        {
          label: "Credencial",
          value: <span className="font-mono text-[12px]">{receivedCredential}</span>,
        },
        {
          label: "Ação",
          value: isOperationsDenied
            ? "Solicite liberação em public.operations_access."
            : "Solicite associação da conta ao acesso correto.",
        },
      ]}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b border-slate-100 bg-rose-50/40 px-7 py-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-rose-200 bg-rose-50 text-rose-600 shadow-sm">
              <Ban className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="section-label before:hidden text-rose-600">Controle de acesso</p>
              <h2 className="text-lg font-semibold leading-tight text-slate-900">
                Permissão não encontrada
              </h2>
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div className="flex-1 space-y-4 px-7 py-6">
          {/* O que verificar */}
          <div className="rounded-[var(--radius-md)] border border-slate-100 bg-slate-50 p-4">
            <p className="mb-2.5 text-[12px] font-semibold text-slate-600">
              O que verificar agora
            </p>
            <ul className="space-y-1.5 text-[12px] leading-6 text-slate-500 list-none">
              {isOperationsDenied ? (
                <>
                  <li>• Confirme se entrou com o email correto.</li>
                  <li>• Verifique se está ativo em <code className="rounded bg-slate-200 px-1 font-mono text-[11px]">operations_access</code>.</li>
                  <li>• Somente emails liberados acessam o Operacional.</li>
                </>
              ) : (
                <>
                  <li>• Confirme se o link foi aberto com o <code className="rounded bg-slate-200 px-1 font-mono text-[11px]">userid</code> correto.</li>
                  <li>• Verifique se a conta está vinculada ao acesso esperado.</li>
                  <li>• Se inesperado, revise as permissões no CRM.</li>
                </>
              )}
            </ul>
          </div>

          {/* CTA */}
          <a
            href={mailtoHref}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-slate-900 text-[13px] font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            Solicitar acesso
          </a>

          {/* Detalhes técnicos colapsáveis */}
          <div>
            <button
              type="button"
              onClick={() => setTechOpen((v) => !v)}
              aria-expanded={techOpen}
              className="flex w-full items-center justify-between text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none"
            >
              <span>Ver detalhes técnicos</span>
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", techOpen && "rotate-180")}
                aria-hidden="true"
              />
            </button>
            {techOpen && (
              <div className="mt-2 rounded-[var(--radius-md)] bg-slate-50 px-3 py-2.5">
                <p className="break-all font-mono text-[12px] text-slate-500">
                  {receivedCredential}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AccessShell>
  );
};

export default AccessDenied;
