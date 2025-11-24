import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { getPersonnel, getExceptions } from '../services/storageService';
import { Soldier, Exception } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ElementType; color: string; subtext?: string }> = ({ title, value, icon: Icon, color, subtext }) => (
  <div className="glass-panel rounded p-6 relative overflow-hidden group hover:bg-military-800/40 transition-all duration-300">
    <div className={`absolute -top-6 -right-6 p-4 opacity-5 ${color} group-hover:opacity-10 transition-opacity duration-300 transform group-hover:scale-110`}>
        <Icon className="w-32 h-32" />
    </div>
    <div className="flex items-center justify-between mb-4 relative z-10">
      <div className={`p-2 rounded bg-opacity-10 ${color.replace('text-', 'bg-')} border border-opacity-20 ${color.replace('text-', 'border-')}`}>
        <Icon className={`w-6 h-6 ${color}`} strokeWidth={1.5} />
      </div>
    </div>
    <div className="relative z-10">
      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest font-mono">{title}</h3>
      <p className="text-3xl font-bold text-slate-100 mt-2 font-mono tracking-tighter">{value}</p>
      {subtext && <p className="text-xs text-slate-500 mt-2 border-l-2 border-white/10 pl-2">{subtext}</p>}
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

  const totalPersonnel = personnel.length;
  const activeExceptions = exceptions.filter(e => {
    const today = new Date().toISOString().split('T')[0];
    return e.startDate <= today && e.endDate >= today;
  }).length;
  
  const availablePersonnel = totalPersonnel - activeExceptions;
  const sickPersonnel = exceptions.filter(e => e.type === "Maladie" && (e.startDate <= new Date().toISOString().split('T')[0] && e.endDate >= new Date().toISOString().split('T')[0])).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-white/10 pb-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-100 uppercase tracking-wider drop-shadow-md">Tableau de Bord</h1>
            <p className="text-military-500 text-sm font-mono mt-1">SITUATION TEMPS RÉEL</p>
        </div>
        <div className="text-right">
            <span className="text-slate-400 font-mono text-sm">{format(new Date(), 'dd MMMM yyyy', { locale: fr }).toUpperCase()}</span>
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
            title="Indisponibilité Méd" 
            value={sickPersonnel} 
            icon={AlertTriangle} 
            color="text-red-500" 
            subtext="Actuellement malades"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel rounded p-6">
            <h3 className="text-sm font-bold text-slate-100 mb-4 border-b border-white/10 pb-2 uppercase tracking-wider flex items-center">
                <span className="w-2 h-2 bg-military-accent mr-2 rounded-full shadow-[0_0_5px_rgba(234,179,8,0.5)]"></span>
                État des Forces
            </h3>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm font-mono">TAUX DE DISPONIBILITÉ</span>
                    <span className="text-military-accent font-bold font-mono text-xl">{Math.round((availablePersonnel/totalPersonnel)*100)}%</span>
                </div>
                <div className="w-full bg-military-950/50 rounded-full h-4 border border-white/5 relative overflow-hidden">
                    <div className="bg-military-accent h-full rounded-full absolute top-0 left-0 shadow-[0_0_10px_rgba(234,179,8,0.3)]" style={{ width: `${(availablePersonnel/totalPersonnel)*100}%` }}></div>
                    {/* Grid lines overlay */}
                    <div className="absolute inset-0 grid grid-cols-10 pointer-events-none">
                        {[...Array(9)].map((_, i) => <div key={i} className="border-r border-black/20 h-full opacity-50"></div>)}
                    </div>
                </div>
            </div>
        </div>

        <div className="glass-panel rounded p-6">
            <h3 className="text-sm font-bold text-slate-100 mb-4 border-b border-white/10 pb-2 uppercase tracking-wider flex items-center">
                <span className="w-2 h-2 bg-red-500 mr-2 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.5)]"></span>
                Actions Requises
            </h3>
            {activeExceptions > 5 ? (
                 <div className="flex items-center p-4 mb-4 text-sm text-red-400 bg-red-950/20 border border-red-500/20 rounded" role="alert">
                    <AlertTriangle className="flex-shrink-0 inline w-5 h-5 mr-3" />
                    <div>
                        <span className="font-bold uppercase tracking-wider block text-xs mb-1">Attention</span>
                        Effectif critique réduit. Vérifiez les points de garde.
                    </div>
                 </div>
            ) : (
                <div className="text-slate-500 text-sm italic py-4">Aucune alerte critique pour le moment.</div>
            )}
            <div className="mt-4">
                 <button 
                    onClick={() => navigate('/planning')}
                    className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-slate-200 rounded text-xs font-bold uppercase tracking-widest transition-colors border border-white/10 backdrop-blur-sm"
                 >
                    Accéder au Planning
                 </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;