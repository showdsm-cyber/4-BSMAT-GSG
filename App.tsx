
import React from 'react';
import { MemoryRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
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

            <Route path="/" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="planning" element={<Planning />} />
                <Route path="personnel" element={<Personnel />} />
                <Route path="exceptions" element={<Exceptions />} />

                {/* Admin Only Routes */}
                <Route path="settings" element={
                    <AdminRoute>
                        <Settings />
                    </AdminRoute>
                } />
                <Route path="users" element={
                    <AdminRoute>
                        <UsersPage />
                    </AdminRoute>
                } />

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
        console.log("App mounted, starting initialization...");

        const timer = setTimeout(() => {
            if (!ready) {
                console.warn("Initialization timed out, forcing ready state.");
                setError("Délai d'attente dépassé pour la base de données.");
                setReady(true);
            }
        }, 5000);

        import('./services/storageService')
            .then(({ initializeStorage }) => {
                console.log("storageService imported, calling initializeStorage...");
                return initializeStorage();
            })
            .then(() => {
                console.log("initializeStorage completed.");
                setReady(true);
            })
            .catch(err => {
                console.error("Initialization failed:", err);
                setError("Erreur d'initialisation: " + err.message);
                setReady(true);
            })
            .finally(() => clearTimeout(timer));
    }, []);

    if (!ready) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-200 font-mono">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-military-500 mx-auto mb-4"></div>
                    <p>INITIALISATION DU SYSTÈME...</p>
                    <p className="text-xs text-slate-500 mt-2">Chargement de la base de données...</p>
                </div>
            </div>
        );
    }

    if (error) {
        console.error("Rendering with error:", error);
    }

    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
}

export default App;
