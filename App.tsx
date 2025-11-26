import React from 'react';
import { MemoryRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import Layout from './components/Layout';
import TitleBar from './components/TitleBar';
import Dashboard from './pages/Dashboard';
import Planning from './pages/Planning';
import Personnel from './pages/Personnel';
import Exceptions from './pages/Exceptions';
import Settings from './pages/Settings';
import UsersPage from './pages/Users';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="planning" element={<Planning />} />
        <Route path="personnel" element={<Personnel />} />
        <Route path="exceptions" element={<Exceptions />} />

        {/* Admin Only Routes */}
        <Route
          path="settings"
          element={
            <AdminRoute>
              <Settings />
            </AdminRoute>
          }
        />
        <Route
          path="users"
          element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setError("Délai d'attente dépassé pour la base de données.");
      setReady(true);
    }, 5000);

    import('./services/storageService')
      .then(({ initializeStorage }) => initializeStorage())
      .then(() => setReady(true))
      .catch(err => {
        setError("Erreur d'initialisation : " + err.message);
        setReady(true);
      })
      .finally(() => clearTimeout(timer));
  }, []);

  if (!ready) {
    return (
      <div className="relative flex items-center justify-center min-h-screen bg-military-950 text-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(234,179,8,0.08),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.06),transparent_30%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30"></div>
        <div className="relative glass-panel px-8 py-10 rounded-2xl border border-white/10 shadow-2xl w-[420px] text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-military-accent to-yellow-500 text-black flex items-center justify-center shadow-[0_0_24px_rgba(234,179,8,0.35)]">
              <Shield className="w-6 h-6" strokeWidth={1.6} />
            </div>
            <div className="text-left">
              <p className="text-[11px] uppercase text-military-500 tracking-[0.28em] font-bold">Initialisation</p>
              <p className="text-lg font-semibold text-slate-100">Système de garde</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
              <div className="relative h-full w-1/2 bg-military-accent/70 rounded-full" style={{ animation: 'loaderSlide 1.6s ease-in-out infinite' }}></div>
            </div>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-[0.2em]">Chargement de la base de données</p>
          </div>
          <p className="text-[11px] text-slate-500">Merci de patienter, nous sécurisons vos données.</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Rendering with error:", error);
  }

  return (
    <AuthProvider>
      <TitleBar />
      <div className="pt-8 h-screen flex flex-col">
        <Router>
          <AppRoutes />
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
