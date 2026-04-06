import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PainelLayout from "./pages/PainelLayout";
import NotFound from "./pages/NotFound";
import AbaGeral from "./pages/AbaGeral";
import AbaContatos from "./pages/AbaContatos";
import AgendaIsolada from "./pages/AgendaIsolada";
import AbaConsultas from "./pages/AbaConsultas";
import AbaBroncoscopia from "./pages/AbaBroncoscopia";
import AbaEspirometria from "./pages/AbaEspirometria";
import AbaProcedimentosCirurgicos from "./pages/AbaProcedimentosCirurgicos";
import EmDesenvolvimentoIsolada from "./pages/EmDesenvolvimentoIsolada";

const queryClient = new QueryClient();

const RootRedirect = () => {
  const location = useLocation();

  return <Navigate to={{ pathname: "/visao-geral", search: location.search }} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <PainelLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RootRedirect />} />
            <Route path="visao-geral" element={<AbaGeral />} />
            <Route path="contatos" element={<AbaContatos />} />
            <Route path="consultas" element={<AbaConsultas />} />
            <Route path="broncoscopia" element={<AbaBroncoscopia />} />
            <Route path="espirometria" element={<AbaEspirometria />} />
            <Route path="procedimentos-cirurgicos" element={<AbaProcedimentosCirurgicos />} />
          </Route>
          <Route
            path="em-desenvolvimento/isolada"
            element={
              <ProtectedRoute allowRecognizedUserIdAccess={false}>
                <EmDesenvolvimentoIsolada />
              </ProtectedRoute>
            }
          />
          <Route
            path="agenda/isolada"
            element={
              <ProtectedRoute>
                <AgendaIsolada />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
