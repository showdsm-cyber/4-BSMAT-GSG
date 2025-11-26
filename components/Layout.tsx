import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, CalendarDays, Users, AlertOctagon, Settings, LogOut, Sun, Moon, UserCog } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const [isDark, setIsDark] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'BS';
  const todayLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(new Date());

  useEffect(() => {
    // Check local storage or preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Tableau de bord", role: ['ADMIN', 'MANAGER'] },
    { to: "/planning", icon: CalendarDays, label: "Organisation journalière", role: ['ADMIN', 'MANAGER'] },
    { to: "/personnel", icon: Users, label: "Effectifs & gestion", role: ['ADMIN', 'MANAGER'] },
    { to: "/exceptions", icon: AlertOctagon, label: "Gestion des exceptions", role: ['ADMIN', 'MANAGER'] },
    { to: "/settings", icon: Settings, label: "Règles & config", role: ['ADMIN'] },
    { to: "/users", icon: UserCog, label: "Utilisateurs", role: ['ADMIN'] },
  ];

  return (
    <div className="relative flex h-screen overflow-hidden font-sans text-slate-200">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(234,179,8,0.06),transparent_32%),radial-gradient(circle_at_82%_14%,rgba(56,189,248,0.06),transparent_30%),radial-gradient(circle_at_50%_85%,rgba(94,234,212,0.05),transparent_36%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:34px_34px] mix-blend-screen"></div>
      </div>

      {/* Sidebar - Glass Style */}
      <aside className="relative z-10 w-72 flex flex-col border-r border-white/5 bg-military-900/50 backdrop-blur-2xl shadow-2xl print:hidden">
        <div className="px-5 pt-6 pb-5 border-b border-white/5 bg-gradient-to-br from-white/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-military-accent to-yellow-500 text-black flex items-center justify-center shadow-[0_0_24px_rgba(234,179,8,0.4)]">
              <Shield className="w-6 h-6" strokeWidth={1.6} />
            </div>
            <div>
              <p className="text-[10px] uppercase text-military-500 font-bold tracking-[0.26em]">4e BSMAT</p>
              <h1 className="font-semibold text-lg tracking-tight text-slate-100">Gestion des gardes</h1>
              <p className="text-[11px] text-slate-500 font-mono uppercase tracking-[0.2em]">Poste de commandement</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <p className="px-2 text-[11px] uppercase text-slate-500 tracking-[0.24em] font-bold">Navigation</p>
          {navItems.filter(item => user && item.role.includes(user.role)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => {
                const base = "group relative flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200";
                const active = isDark
                  ? "bg-white/5 text-slate-50 border-white/10 shadow-lg shadow-black/30"
                  : "bg-white text-slate-900 border-military-accent/60 shadow-lg shadow-black/10";
                const inactive = isDark
                  ? "border-transparent text-slate-400 hover:text-slate-100 hover:border-white/10 hover:bg-white/5"
                  : "border-transparent text-slate-700 hover:text-slate-900 hover:border-slate-300/60 hover:bg-white/80";
                return `${base} ${isActive ? active : inactive}`;
              }}
            >
              <span
                className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-full ${item.to === "/" ? "rounded-l-lg" : ""} ${
                  location.pathname === item.to
                    ? "bg-military-accent"
                    : isDark
                      ? "bg-transparent group-hover:bg-white/40"
                      : "bg-transparent group-hover:bg-slate-300"
                }`}
              ></span>
              <div className={`h-9 w-9 rounded-md border flex items-center justify-center ${isDark ? "border-white/5 bg-white/5" : "border-slate-200 bg-white/90 text-slate-800"}`}>
                <item.icon className="w-5 h-5" strokeWidth={1.4} />
              </div>
              <span className="font-medium text-sm tracking-wide">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-5 border-t border-white/5 bg-white/5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-military-800 to-military-700 border border-white/10 flex items-center justify-center text-slate-100 font-bold">
              {initials}
            </div>
            <div>
              <p className="text-[10px] uppercase text-military-500 tracking-[0.24em] font-bold">Connecté</p>
              <p className="text-sm font-semibold text-slate-100 leading-tight">{user?.displayName}</p>
              <p className="text-[11px] text-slate-500 font-mono uppercase">Rôle {user?.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-white/10 text-slate-200 hover:text-slate-50 hover:border-military-accent/60 hover:bg-military-800/40 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              Mode {isDark ? 'Clair' : 'Sombre'}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-white/10 text-slate-300 hover:text-red-300 hover:border-red-400/40 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Quitter
            </button>
          </div>

          <p className="text-[10px] text-slate-600 font-mono text-center">v1.2 - Dev: A/C DIHI - FAR@2026</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Header - Glass Style */}
        <header className="print:hidden sticky top-0 z-20">
          <div className="glass-panel mx-8 mt-6 px-6 py-5 rounded-xl border border-white/5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase text-military-500 tracking-[0.3em] font-bold">Centre de commandement</p>
                <h2 className="text-2xl font-semibold text-slate-100 tracking-tight">4e Bataillon de Soutien des Matériels</h2>
                <p className="text-sm text-slate-400">Coordination des gardes, effectifs et alertes en temps réel.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-md border border-white/10 bg-white/5">
                  <span className="h-2 w-2 rounded-full bg-military-accent animate-pulse shadow-[0_0_10px_rgba(234,179,8,0.45)]"></span>
                  <span className="text-[11px] font-mono text-slate-200 uppercase tracking-[0.2em]">Système opérationnel</span>
                </div>
                <div className="px-4 py-3 rounded-md border border-white/10 bg-white/5 text-right">
                  <p className="text-[10px] uppercase text-slate-500 tracking-[0.24em] font-bold">Aujourd'hui</p>
                  <p className="text-sm font-mono text-slate-100">{todayLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 print:p-0 print:overflow-visible">
          <div className="max-w-7xl mx-auto print:max-w-none">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
