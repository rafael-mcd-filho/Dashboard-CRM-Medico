import { Outlet, useLocation } from "react-router-dom";
import { FiltersProvider } from "@/contexts/FiltersContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { GlobalFilters } from "@/components/layout/GlobalFilters";

const PainelLayout = () => {
  const location = useLocation();
  const isAgendaRoute = location.pathname.startsWith("/agenda");

  return (
    <FiltersProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-clinic-blue focus:shadow-card focus:outline-none"
      >
        Pular para o conteúdo
      </a>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          {!isAgendaRoute ? <GlobalFilters /> : null}
          <main id="main" className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </FiltersProvider>
  );
};

export default PainelLayout;
