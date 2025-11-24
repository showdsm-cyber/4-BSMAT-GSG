
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
  return (
    <AuthProvider>
        <Router>
            <AppRoutes />
        </Router>
    </AuthProvider>
  );
}

export default App;
