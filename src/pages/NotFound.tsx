import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home, Search } from "lucide-react";

const QUICK_LINKS = [
  { label: "Visão Geral",         path: "/visao-geral"                },
  { label: "Consultas",           path: "/consultas"                  },
  { label: "Agenda",              path: "/agenda"                     },
  { label: "Proc. Cirúrgicos",    path: "/procedimentos-cirurgicos"   },
  { label: "Contatos",            path: "/contatos"                   },
  { label: "Operacional",         path: "/operacional"                },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "[404] Rota não encontrada:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50">
      <div className="bg-dashboard-grid absolute inset-0 opacity-25" aria-hidden="true" />

      <div className="relative w-full max-w-lg px-5 text-center">
        {/* Número 404 decorativo */}
        <p
          aria-hidden="true"
          className="select-none font-mono text-[7rem] font-bold leading-none tracking-tighter text-slate-100 md:text-[9rem]"
        >
          404
        </p>

        <div className="panel-shell -mt-6 relative overflow-hidden shadow-pop">
          <div
            className="h-px bg-gradient-to-r from-clinic-blue via-clinic-teal to-transparent"
            aria-hidden="true"
          />

          <div className="space-y-6 px-7 py-8">
            {/* Ícone */}
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] border border-[#DBEAFE] bg-[#EFF6FF] text-clinic-blue shadow-sm">
              <Search className="h-5 w-5" aria-hidden="true" />
            </span>

            <div className="space-y-2">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                Página não encontrada
              </h1>
              <p className="text-[13px] leading-6 text-slate-500">
                Não encontramos a rota{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] text-slate-700">
                  {location.pathname}
                </code>
                . Confira os atalhos abaixo ou volte ao início.
              </p>
            </div>

            {/* Ações principais */}
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                to="/visao-geral"
                className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] bg-slate-900 px-4 text-[13px] font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue"
              >
                <Home className="h-3.5 w-3.5" aria-hidden="true" />
                Visão Geral
              </Link>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Voltar
              </button>
            </div>

            {/* Links rápidos */}
            <div>
              <p className="section-label mb-2.5 before:hidden text-center justify-center">
                Ou acesse diretamente
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
