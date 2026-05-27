import type { FormEvent } from "react";
import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import AccessShell from "@/components/auth/AccessShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type LocalAdminLoginDialogProps = {
  onSubmit: (credentials: { email: string; password: string }) => Promise<void>;
  errorMessage: string | null;
  isSubmitting: boolean;
  accessArea?: "dashboard" | "operations";
};

const LocalAdminLoginDialog = ({
  onSubmit,
  errorMessage,
  isSubmitting,
  accessArea = "dashboard",
}: LocalAdminLoginDialogProps) => {
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPassword, setShowPass] = useState(false);
  const [capsLock, setCapsLock]     = useState(false);

  const isOperationsAccess = accessArea === "operations";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit({ email: email.trim(), password });
  };

  const handleKeyDown = (e: KeyboardEvent | React.KeyboardEvent) => {
    setCapsLock(e.getModifierState?.("CapsLock") ?? false);
  };

  return (
    <AccessShell
      eyebrow="Acesso seguro"
      icon={ShieldCheck}
      tone="blue"
      title={
        isOperationsAccess
          ? "Acesse a central operacional do CRM"
          : "Acesse o painel executivo do CRM"
      }
      description={
        isOperationsAccess
          ? "Entre com suas credenciais para visualizar os cards operacionais conforme sua permissão."
          : "Entre com suas credenciais para visualizar indicadores, funis e acompanhamentos em um único ambiente."
      }
      highlights={[
        {
          label: isOperationsAccess ? "Central operacional" : "Visão central",
          value: isOperationsAccess
            ? "Cards dos funis em uma tela protegida por login."
            : "Indicadores, conversão e agenda em um só painel.",
        },
        {
          label: "Acesso protegido",
          value: "Autenticação antes da exibição dos dados.",
        },
        {
          label: "Uso contínuo",
          value: isOperationsAccess
            ? "Consulte ou edite os cards conforme sua permissão."
            : "Acesso rápido ao panorama completo do CRM.",
        },
      ]}
    >
      {/* ── Formulário ── */}
      <div className="flex h-full flex-col">
        {/* Header do formulário */}
        <div className="border-b border-slate-100 bg-slate-50/60 px-7 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[#DBEAFE] bg-[#EFF6FF] text-clinic-blue shadow-sm">
              <LockKeyhole className="h-4.5 w-4.5" aria-hidden="true" />
            </div>
            <div>
              <p className="section-label before:hidden text-clinic-blue">Identificação</p>
              <h2 className="text-xl font-semibold leading-none tracking-tight text-slate-900">
                {isOperationsAccess ? "Entrar na central" : "Entrar no dashboard"}
              </h2>
            </div>
          </div>
        </div>

        {/* Corpo do formulário */}
        <div className="flex-1 space-y-5 px-7 py-6">
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-[13px] font-medium text-slate-700">
                Email
              </Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                className="h-10 rounded-[var(--radius-md)] border-slate-200 bg-white shadow-none focus-visible:ring-clinic-blue"
              />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="text-[13px] font-medium text-slate-700">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className="h-10 rounded-[var(--radius-md)] border-slate-200 bg-white pr-10 shadow-none focus-visible:ring-clinic-blue"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-none"
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                    : <Eye    className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>

              {/* Caps Lock warning */}
              {capsLock && (
                <p className="text-[11px] text-amber-600" role="alert">
                  ⚠ Caps Lock está ativado
                </p>
              )}
            </div>

            {/* Erro de autenticação */}
            {errorMessage && (
              <div
                role="alert"
                className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] leading-6 text-red-700"
              >
                {errorMessage}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className={cn(
                "h-10 w-full rounded-[var(--radius-md)] font-medium transition-all",
                "bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50",
                "focus-visible:ring-2 focus-visible:ring-clinic-blue focus-visible:ring-offset-2"
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden="true"
                  />
                  Validando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="text-[11px] leading-5 text-slate-400">
            {isOperationsAccess
              ? "Ao prosseguir, a central operacional será liberada conforme a permissão configurada."
              : "Ao prosseguir, o acesso ao dashboard será liberado conforme as regras configuradas."}
          </p>
        </div>
      </div>
    </AccessShell>
  );
};

export default LocalAdminLoginDialog;
