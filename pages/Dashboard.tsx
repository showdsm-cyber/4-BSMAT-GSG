import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { getPersonnel, getExceptions } from '../services/storageService';
import { Soldier, Exception } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ElementType; color: string; subtext?: string }> = ({ title, value, icon: Icon, color, subtext }) => (
  <div className="relative overflow-hidden rounded-xl border border-white/10 glass-panel transition-all duration-200 hover:-translate-y-0.5 hover:border-military-accent/60">
    <div className={`absolute -right-4 -top-6 opacity-10 text-slate-500 ${color}`}>
      <Icon className="w-28 h-28" />
    </div>
    <div className="relative z-10 p-6 space-y-3">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" strokeWidth={1.4} />
        </div>
        <div>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.24em]">{title}</p>
          <p className="text-3xl font-bold text-slate-100 font-mono tracking-tight">{value}</p>
        </div>
      </div>
      {subtext && <p className="text-xs text-slate-400 border-l border-white/10 pl-3">{subtext}</p>}
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState<Soldier[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);

  useEffect(() => {
    setPersonnel(getPersonnel());
    setExceptions(getExceptions());
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const totalPersonnel = personnel.length;
  const activeExceptions = exceptions.filter(e => e.startDate <= today && e.endDate >= today).length;
  const availablePersonnel = totalPersonnel - activeExceptions;
  const sickPersonnel = exceptions.filter(e => e.type === "Maladie" && (e.startDate <= today && e.endDate >= today)).length;
  const availabilityRate = totalPersonnel ? Math.round((availablePersonnel / totalPersonnel) * 100) : 0;
  const availabilityWidth = totalPersonnel ? `${(availablePersonnel / totalPersonnel) * 100}%` : '0%';

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-xl p-6 border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase text-military-500 tracking-[0.24em] font-bold">Tableau de bord</p>
          <h1 className="text-2xl font-semibold text-slate-100 leading-tight">Situation temps réel</h1>
          <p className="text-sm text-slate-400 max-w-xl">Vue synthétique des effectifs disponibles, des exceptions actives et des actions à prioriser.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-right">
            <p className="text-[10px] uppercase text-slate-500 tracking-[0.24em] font-bold">Date</p>
            <p className="text-sm font-mono text-slate-100">{format(new Date(), 'dd MMMM yyyy', { locale: fr }).toUpperCase()}</p>
          </div>
          <button 
            onClick={() => navigate('/planning')}
            className="px-4 py-3 rounded-lg border border-military-accent/50 bg-military-accent/10 text-sm font-semibold text-slate-100 hover:bg-military-accent/20 transition-colors uppercase tracking-[0.2em]"
          >
            Ouvrir le planning
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
            title="Effectif Total" 
            value={totalPersonnel} 
            icon={Users} 
            color="text-blue-500" 
            subtext="Enregistré dans la base"
        />
        <StatCard 
            title="Disponibles" 
            value={availablePersonnel} 
            icon={CheckCircle} 
            color="text-green-500" 
            subtext="Prêts pour le service"
        />
        <StatCard 
            title="Exceptions Actives" 
            value={activeExceptions} 
            icon={Calendar} 
            color="text-orange-500" 
            subtext="Missions, congés, etc."
        />
        <StatCard 
            title="Indisponibilité méd." 
            value={sickPersonnel} 
            icon={AlertTriangle} 
            color="text-red-500" 
            subtext="Actuellement malades"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel rounded-xl p-6 border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-military-accent rounded-full shadow-[0_0_5px_rgba(234,179,8,0.5)]"></span>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-[0.24em]">État des forces</h3>
            </div>
            <span className="text-xs font-mono text-slate-500 uppercase">Live</span>
          </div>
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm font-mono">Taux de disponibilité</span>
              <span className="text-military-accent font-bold font-mono text-xl">{availabilityRate}%</span>
            </div>
            <div className="w-full bg-military-950/60 rounded-full h-4 border border-white/5 relative overflow-hidden">
              <div className="bg-gradient-to-r from-military-accent to-yellow-400 h-full rounded-full absolute top-0 left-0 shadow-[0_0_10px_rgba(234,179,8,0.3)]" style={{ width: availabilityWidth }}></div>
              <div className="absolute inset-0 grid grid-cols-10 pointer-events-none">
                {[...Array(9)].map((_, i) => <div key={i} className="border-r border-black/20 h-full opacity-40"></div>)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-400">
              <div className="p-3 rounded-lg border border-white/5 bg-white/5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold">Disponibles</p>
                <p className="text-lg font-semibold text-slate-100">{availablePersonnel}</p>
              </div>
              <div className="p-3 rounded-lg border border-white/5 bg-white/5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold">Indisponibilités méd.</p>
                <p className="text-lg font-semibold text-slate-100">{sickPersonnel}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <span className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.5)]"></span>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-[0.24em]">Actions requises</h3>
          </div>
          {activeExceptions > 5 ? (
            <div className="flex items-center p-4 text-sm text-red-300 bg-red-500/10 border border-red-400/30 rounded-lg" role="alert">
              <AlertTriangle className="flex-shrink-0 inline w-5 h-5 mr-3" />
              <div>
                <span className="font-bold uppercase tracking-[0.2em] block text-xs mb-1">Attention</span>
                Effectif critique réduit. Vérifiez les points de garde.
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-sm italic py-2">Aucune alerte critique pour le moment.</div>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg border border-white/5 bg-white/5 text-slate-300">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold">Exceptions actives</p>
              <p className="text-lg font-semibold text-slate-100">{activeExceptions}</p>
            </div>
            <div className="p-3 rounded-lg border border-white/5 bg-white/5 text-slate-300">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold">Effectif total</p>
              <p className="text-lg font-semibold text-slate-100">{totalPersonnel}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/planning')}
            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-[0.2em] transition-colors border border-white/10 backdrop-blur-sm"
          >
            Accéder au planning
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
