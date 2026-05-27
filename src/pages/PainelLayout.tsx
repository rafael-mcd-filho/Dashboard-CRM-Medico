import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { FiltersProvider } from "@/contexts/FiltersContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { GlobalFilters } from "@/components/layout/GlobalFilters";

const PainelLayout = () => {
  const location = useLocation();

  const hidesGlobalFilters =
    location.pathname.startsWith("/agenda") ||
    location.pathname.startsWith("/operacional") ||
    location.pathname.startsWith("/em-desenvolvimento");

  /* Lock body scroll while PainelLayout is active.
     Prevents html/body from acquiring scroll range (e.g. from DPI-scaled
     fractional-pixel rounding on Windows), which would show as a second
     "phantom" scroll layer behind the <main> scroll container. */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  return (
    <FiltersProvider>
      {/* Skip-link acessibilidade */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-[var(--radius-md)] focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-clinic-blue focus:shadow-pop focus:outline-none"
      >
        Pular para o conteúdo
      </a>

      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {!hidesGlobalFilters ? <GlobalFilters /> : null}
          <main
            id="main"
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-5 lg:p-6"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </FiltersProvider>
  );
};

export default PainelLayout;
