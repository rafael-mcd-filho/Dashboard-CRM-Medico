/**
 * AccessLoading — overlay de carregamento inline.
 *
 * Plano: eliminar o uso do AccessShell (full-page shell) durante a
 * validação de sessão. Em vez disso, mostrar um overlay centralizado
 * e compacto com spinner + mensagem. Se demorar, escalar o texto.
 */
const AccessLoading = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Validando acesso, aguarde"
      className="flex min-h-screen items-center justify-center bg-slate-50"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Spinner */}
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] border border-[#DBEAFE] bg-[#EFF6FF] text-clinic-blue shadow-sm"
        >
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-clinic-blue/20 border-t-clinic-blue" />
        </span>

        {/* Texto */}
        <div className="space-y-1">
          <p className="text-[14px] font-medium text-slate-700">
            Validando acesso...
          </p>
          <p className="text-[12px] text-slate-400">
            Confirmando sua sessão e permissões.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessLoading;
