import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, ChevronRight, Activity, Lock, BadgeCheck } from 'lucide-react';

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
    <div className="min-h-screen w-full flex items-center justify-center bg-military-950 relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(234,179,8,0.08),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.06),transparent_35%)]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:34px_34px] opacity-40"></div>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="hidden md:flex flex-col justify-between p-8 bg-gradient-to-br from-white/5 to-transparent border-r border-white/5">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] uppercase tracking-[0.18em] text-slate-200 font-bold">
                  <Shield className="w-4 h-4" />
                  4e BSMAT
                </div>
                <h1 className="text-3xl font-semibold text-slate-50 leading-tight">Accès sécurisé à la gestion des gardes</h1>
                <p className="text-slate-400 text-sm max-w-md">
                  Console dédiée aux responsables de garde. Les accès sont consignés et surveillés pour garantir l'intégrité des opérations.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-slate-300">
                  <div className="h-9 w-9 rounded-full bg-military-accent/10 border border-military-accent/30 flex items-center justify-center text-military-accent">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Suivi temps réel</p>
                    <p className="text-xs text-slate-500">Effectifs, exceptions et alertes synchronisés en permanence.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-slate-300">
                  <div className="h-9 w-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-slate-100">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Protection des accès</p>
                    <p className="text-xs text-slate-500">Authentification renforcée et journalisation des connexions.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[11px] uppercase text-military-500 tracking-[0.24em] font-bold">Espace privé</p>
                  <h2 className="text-xl font-semibold text-slate-100">Connexion</h2>
                </div>
                <div className="px-3 py-1 rounded-md border border-white/10 bg-white/5 text-[11px] text-slate-400 uppercase tracking-[0.2em]">v1.2</div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1 tracking-[0.2em]">Identifiant</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full glass-input rounded-lg px-4 py-3 text-slate-200 text-sm focus:border-military-accent outline-none transition-colors"
                    placeholder="ex : officier"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1 tracking-[0.2em]">Mot de passe</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full glass-input rounded-lg px-4 py-3 text-slate-200 text-sm focus:border-military-accent outline-none transition-colors"
                    placeholder="********"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-400/40 rounded-lg text-red-300 text-xs font-bold uppercase text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-military-accent hover:bg-yellow-400 text-black font-bold uppercase tracking-[0.24em] rounded-lg transition-all duration-200 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                >
                  Connexion <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </form>

              <div className="mt-8 text-center border-t border-white/5 pt-4 space-y-2">
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.18em]">Système restreint - usage officiel uniquement</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-white/10 bg-white/5 text-xs text-slate-200">
                  <BadgeCheck className="w-4 h-4 text-military-accent" />
                  <span>Contactez A/C DIHI en cas de blocage</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
