import React, { useState, useEffect } from 'react';
import { getPersonnel, getExceptions, saveExceptions } from '../services/storageService';
import { Soldier, Exception, ExceptionType } from '../types';
import { Plus, Trash2, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';

const Exceptions: React.FC = () => {
  const [personnel, setPersonnel] = useState<Soldier[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  
  const [selectedSoldier, setSelectedSoldier] = useState('');
  const [type, setType] = useState<ExceptionType>(ExceptionType.Maladie);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    setPersonnel(getPersonnel());
    setExceptions(getExceptions());
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSoldier || !startDate || !endDate) return;

    const newException: Exception = {
        id: Date.now().toString(),
        soldierId: selectedSoldier,
        type,
        startDate,
        endDate,
        comment
    };

    const updated = [...exceptions, newException];
    setExceptions(updated);
    saveExceptions(updated);
    
    setComment('');
    setSelectedSoldier('');
  };

  const handleDelete = (id: string) => {
      const updated = exceptions.filter(ex => ex.id !== id);
      setExceptions(updated);
      saveExceptions(updated);
  };

  const getSoldierName = (id: string) => {
      const s = personnel.find(p => p.id === id);
      return s ? `${s.rank} ${s.lastName}` : 'Inconnu';
  };

  const getTypeColor = (t: ExceptionType) => {
      switch(t) {
          case ExceptionType.Maladie: return "text-red-400 bg-red-950/30 border-red-900";
          case ExceptionType.Mission: return "text-blue-400 bg-blue-950/30 border-blue-900";
          case ExceptionType.Conge: return "text-green-400 bg-green-950/30 border-green-900";
          default: return "text-slate-400 bg-military-900 border-military-700";
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <h2 className="text-lg font-bold text-white uppercase tracking-widest border-b border-military-800 pb-2">Nouvelle Exception</h2>
        <div className="bg-military-900 border border-military-800 rounded-sm p-6 shadow-lg">
            <form onSubmit={handleAdd} className="space-y-4">
                <div>
                    <label className="block text-[10px] font-bold uppercase text-military-500 mb-1">Militaire</label>
                    <select 
                        required
                        className="w-full bg-military-950 border border-military-800 rounded-sm px-3 py-2 text-slate-200 text-sm focus:border-military-accent outline-none"
                        value={selectedSoldier}
                        onChange={e => setSelectedSoldier(e.target.value)}
                    >
                        <option value="">SÉLECTIONNER...</option>
                        {personnel.map(p => (
                            <option key={p.id} value={p.id}>{p.rank} {p.lastName} {p.firstName}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase text-military-500 mb-1">Type</label>
                    <select 
                        required
                        className="w-full bg-military-950 border border-military-800 rounded-sm px-3 py-2 text-slate-200 text-sm focus:border-military-accent outline-none"
                        value={type}
                        onChange={e => setType(e.target.value as ExceptionType)}
                    >
                        {Object.values(ExceptionType).map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-military-500 mb-1">Début</label>
                        <input 
                            type="date" 
                            required
                            className="w-full bg-military-950 border border-military-800 rounded-sm px-3 py-2 text-slate-200 text-sm focus:border-military-accent outline-none"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-military-500 mb-1">Fin</label>
                        <input 
                            type="date" 
                            required
                            className="w-full bg-military-950 border border-military-800 rounded-sm px-3 py-2 text-slate-200 text-sm focus:border-military-accent outline-none"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase text-military-500 mb-1">Motif / Commentaire</label>
                    <textarea 
                        className="w-full bg-military-950 border border-military-800 rounded-sm px-3 py-2 text-slate-200 text-sm focus:border-military-accent outline-none h-20 resize-none font-mono"
                        placeholder="..."
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                    ></textarea>
                </div>

                <button 
                    type="submit"
                    className="w-full flex items-center justify-center py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-sm transition-colors border border-blue-600"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Enregistrer
                </button>
            </form>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-lg font-bold text-white uppercase tracking-widest border-b border-military-800 pb-2">Exceptions Actives</h2>
        
        <div className="space-y-2">
            {exceptions.length === 0 ? (
                <div className="text-center p-8 bg-military-900 border border-military-800 border-dashed rounded-sm text-slate-500 font-mono text-sm">
                    AUCUNE ENREGISTRÉE
                </div>
            ) : (
                exceptions.sort((a,b) => b.startDate.localeCompare(a.startDate)).map(ex => (
                    <div key={ex.id} className="bg-military-900 border border-military-800 rounded-sm p-4 flex flex-col md:flex-row items-start md:items-center justify-between group hover:border-military-600 transition-colors">
                        <div className="flex items-start space-x-4 mb-4 md:mb-0">
                            <div className={`p-2 rounded-sm border ${getTypeColor(ex.type)}`}>
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-200 uppercase font-mono tracking-tight">{getSoldierName(ex.soldierId)}</h4>
                                <div className="flex items-center text-xs text-slate-400 mt-1">
                                    <span className={`mr-3 px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase border ${getTypeColor(ex.type)}`}>{ex.type}</span>
                                    <span className="flex items-center font-mono">
                                        {format(new Date(ex.startDate), 'dd/MM')} → {format(new Date(ex.endDate), 'dd/MM')}
                                    </span>
                                </div>
                                {ex.comment && <p className="text-xs text-slate-500 mt-1 italic border-l-2 border-military-700 pl-2">"{ex.comment}"</p>}
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDelete(ex.id)}
                            className="p-2 text-slate-600 hover:text-red-400 hover:bg-military-950 rounded-sm transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default Exceptions;