import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { AppShell } from './layouts/AppShell';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { VagasPage } from './pages/VagasPage';
import { CandidatosPage } from './pages/CandidatosPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import { VagaDialog } from './components/VagaDialog';
import { ReviewDialog } from './components/ReviewDialog';
import { ToastContainer } from './components/ZirconMark';
import type { Opportunity } from './types/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Array<'ADMIN' | 'EMPRESA'>;
}) {
  const { accessToken, user } = useAuthStore();
  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.user_type === 'PROFISSIONAL') {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && user.user_type && !allowedRoles.includes(user.user_type as 'ADMIN' | 'EMPRESA')) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const [vagaDialogOpen, setVagaDialogOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [reviewAppId, setReviewAppId] = useState<number | null>(null);

  const openNewVaga = () => {
    setEditingOpportunity(null);
    setVagaDialogOpen(true);
  };

  const openEditVaga = (opp: Opportunity) => {
    setEditingOpportunity(opp);
    setVagaDialogOpen(true);
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/verify-email" element={<AuthPage />} />
        <Route path="/reset-password" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell onOpenNewVaga={openNewVaga} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage onOpenReview={setReviewAppId} />} />
          <Route path="vagas" element={<VagasPage onOpenNew={openNewVaga} onEditOpportunity={openEditVaga} />} />
          <Route path="candidatos" element={<CandidatosPage onOpenReview={setReviewAppId} />} />
          <Route
            path="usuarios"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UsuariosPage />
              </ProtectedRoute>
            }
          />
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <VagaDialog open={vagaDialogOpen} opportunity={editingOpportunity} onClose={() => setVagaDialogOpen(false)} />
      <ReviewDialog applicationId={reviewAppId} onClose={() => setReviewAppId(null)} />
      <ToastContainer />
    </>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
