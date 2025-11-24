
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, CalendarDays, Users, AlertOctagon, Settings, LogOut, Sun, Moon, UserCog } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const [isDark, setIsDark] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    { to: "/", icon: LayoutDashboard, label: "Tableau de Bord", role: ['ADMIN', 'MANAGER'] },
    { to: "/planning", icon: CalendarDays, label: "Organisation Journalière", role: ['ADMIN', 'MANAGER'] },
    { to: "/personnel", icon: Users, label: "Effectifs & Gestion", role: ['ADMIN', 'MANAGER'] },
    { to: "/exceptions", icon: AlertOctagon, label: "Gestion des Exceptions", role: ['ADMIN', 'MANAGER'] },
    { to: "/settings", icon: Settings, label: "Règles & Config", role: ['ADMIN'] },
    { to: "/users", icon: UserCog, label: "Utilisateurs", role: ['ADMIN'] },
  ];

  return (
    <div className="flex h-screen overflow-hidden font-sans text-slate-200">
      {/* Sidebar - Glass Style */}
      <aside className="w-64 flex flex-col z-20 print:hidden transition-colors duration-200 glass-panel border-r-0 border-r-white/5 relative">
        <div className="h-16 flex items-center px-6 border-b border-white/5 bg-military-900/20 backdrop-blur-sm">
          <Shield className="w-8 h-8 text-military-accent mr-3 drop-shadow-lg" />
          <div>
            <h1 className="font-bold text-lg tracking-wider text-slate-100 uppercase font-mono">4°BSMAT</h1>
            <p className="text-[10px] text-military-500 font-bold uppercase tracking-widest">Gestion de Garde</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.filter(item => user && item.role.includes(user.role)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-sm transition-all duration-200 group border-l-2 relative overflow-hidden ${
                  isActive
                    ? "bg-military-800/60 text-military-accent border-military-accent shadow-md backdrop-blur-sm"
                    : "border-transparent text-slate-400 hover:bg-military-800/40 hover:text-slate-100 hover:border-military-600/50"
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} />
              <span className="font-medium text-sm tracking-wide">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2 bg-military-900/10">
          <div className="px-4 py-2 mb-2 text-xs font-mono text-center text-military-500 uppercase tracking-widest">
              Connecté en tant que<br/>
              <span className="text-slate-200 font-bold">{user?.displayName}</span>
          </div>

          <button 
            onClick={toggleTheme}
            className="flex items-center w-full px-4 py-2 text-sm text-slate-400 hover:text-slate-100 hover:bg-military-800/50 rounded-sm transition-colors uppercase tracking-wider font-bold text-xs"
          >
            {isDark ? <Sun className="w-4 h-4 mr-3" /> : <Moon className="w-4 h-4 mr-3" />}
            Mode {isDark ? 'Clair' : 'Sombre'}
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-military-800/50 rounded-sm transition-colors uppercase tracking-wider font-bold text-xs"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header - Glass Style */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 glass-panel z-10 print:hidden sticky top-0">
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-widest drop-shadow-md">
            4ème Bataillon de Soutien des Matériels
          </h2>
          <div className="flex items-center space-x-3 bg-military-950/30 px-3 py-1 rounded-sm border border-white/5 transition-colors duration-200 backdrop-blur-sm">
             <div className="h-2 w-2 rounded-full bg-military-accent animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.6)]"></div>
             <span className="text-[10px] font-mono text-military-500 uppercase tracking-widest">Système Opérationnel</span>
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
