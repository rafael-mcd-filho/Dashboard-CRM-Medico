import type { FormEvent } from "react";
import { useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import AccessShell from "@/components/auth/AccessShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isLocalAdminCredentialsValid } from "@/lib/accessControl";

type LocalAdminLoginDialogProps = {
  onAuthenticated: () => void;
};

const LocalAdminLoginDialog = ({ onAuthenticated }: LocalAdminLoginDialogProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLocalAdminCredentialsValid(username.trim(), password)) {
      setErrorMessage("Usuario ou senha invalidos.");
      return;
    }

    setErrorMessage(null);
    onAuthenticated();
  };

  return (
    <AccessShell
      eyebrow="Acesso seguro"
      icon={ShieldCheck}
      tone="blue"
      title={
        <>
          Acesse o painel executivo
          <br />
          do CRM com seguranca
        </>
      }
      description="Entre com suas credenciais para visualizar indicadores, funis e acompanhamentos operacionais em um unico ambiente protegido."
      highlights={[
        {
          label: "Visao central",
          value: "Acompanhe indicadores, conversao e agenda em um so painel.",
        },
        {
          label: "Acesso protegido",
          value: "A entrada depende de autenticacao antes da exibicao dos dados.",
        },
        {
          label: "Uso continuo",
          value: "Retome sua rotina com acesso rapido ao panorama do CRM.",
        },
      ]}
    >
      <div className="relative overflow-hidden">
        <div className="border-b border-[#E6EDF5] bg-[linear-gradient(180deg,#F7FAFD_0%,#FFFFFF_100%)] px-7 py-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-[#D7E5FF] bg-[#EEF4FF] text-[#1A56DB] shadow-sm">
              <LockKeyhole className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9BAAB8]">
                Identificacao
              </p>
              <h2 className="text-[1.9rem] font-semibold leading-none tracking-[-0.04em] text-[#0F1923]">
                Entrar no dashboard
              </h2>
              <p className="max-w-sm text-sm leading-7 text-[#5C6B7A]">
                Informe seus dados de acesso para continuar.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-7 py-7">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label className="text-[#314356]" htmlFor="local-admin-username">Usuario</Label>
              <Input
                id="local-admin-username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Digite seu usuario"
                className="h-12 rounded-[18px] border-[#D8E2EE] bg-[#F8FBFD] px-4 shadow-none focus-visible:ring-clinic-blue"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#314356]" htmlFor="local-admin-password">Senha</Label>
              <Input
                id="local-admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite sua senha"
                className="h-12 rounded-[18px] border-[#D8E2EE] bg-[#F8FBFD] px-4 shadow-none focus-visible:ring-clinic-blue"
              />
            </div>

            {errorMessage ? (
              <p className="rounded-[18px] border border-[#F2C9CC] bg-[#FFF5F5] px-4 py-3 text-sm leading-6 text-[#B42318]">
                {errorMessage}
              </p>
            ) : null}

            <Button className="h-12 w-full rounded-[18px] bg-[#1A56DB] text-white shadow-[0_16px_36px_rgba(26,86,219,0.28)] hover:bg-[#164CC3]" type="submit">
              Entrar
            </Button>
          </form>

          <p className="text-xs leading-6 text-[#7A8794]">
            Ao prosseguir, o acesso ao dashboard sera liberado conforme as regras configuradas para este ambiente.
          </p>
        </div>
      </div>
    </AccessShell>
  );
};

export default LocalAdminLoginDialog;
