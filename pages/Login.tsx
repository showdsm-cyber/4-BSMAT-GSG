
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, ChevronRight } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(username, password);
    if (success) {
      navigate('/');
    } else {
      setError('Identifiants invalides.');
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-military-950 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-military-900/50 to-military-950 z-0"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-military-accent to-transparent opacity-50"></div>

      <div className="relative z-10 w-full max-w-md p-8">
        <div className="glass-panel rounded-sm border border-white/10 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-military-accent/10 p-4 rounded-full mb-4 border border-military-accent/20">
              <Shield className="w-12 h-12 text-military-accent" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 uppercase tracking-widest font-mono">ACCÈS SÉCURISÉ</h1>
            <p className="text-military-500 text-xs uppercase tracking-widest mt-1">4ème BSMAT - Système de Garde</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase text-military-500 mb-1">Identifiant</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full glass-input rounded-sm px-4 py-3 text-slate-200 text-sm focus:border-military-accent outline-none transition-colors"
                placeholder="ex: admin"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-military-500 mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input rounded-sm px-4 py-3 text-slate-200 text-sm focus:border-military-accent outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-sm text-red-400 text-xs font-bold uppercase text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-military-accent hover:bg-yellow-400 text-black font-bold uppercase tracking-widest rounded-sm transition-all duration-200 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]"
            >
              Connexion <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/5 pt-4">
            <p className="text-[10px] text-slate-600 font-mono">SYSTÈME RESTREINT - USAGE OFFICIEL UNIQUEMENT</p>
            <p className="text-[9px] text-slate-700 font-mono mt-1 opacity-50">v1.2 - Dev: A/C DIHI - FAR@2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
