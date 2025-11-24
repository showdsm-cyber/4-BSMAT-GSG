import React, { useState, useEffect, useRef } from 'react';
import { getProfiles, saveProfiles, getHolidays, toggleHoliday, getGuardPoints, saveGuardPoints, getSpecialties, saveSpecialties, getRanks, saveRanks, getRoles, saveRoles, createBackup, restoreBackup } from '../services/storageService';
import { ServiceProfile, GuardPoint, Specialty, RankDefinition, RoleDefinition } from '../types';
import { Save, CalendarCheck, MapPin, Plus, Trash2, Wrench, Shield, Briefcase, Download, Upload, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const Settings: React.FC = () => {
  const [profiles, setProfiles] = useState<ServiceProfile[]>([]);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [guardPoints, setGuardPoints] = useState<GuardPoint[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [ranks, setRanks] = useState<RankDefinition[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  
  const [newHoliday, setNewHoliday] = useState('');
  const [newPointName, setNewPointName] = useState('');
  const [newPointLocation, setNewPointLocation] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newRankName, setNewRankName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    setProfiles(getProfiles());
    setHolidays(getHolidays());
    setGuardPoints(getGuardPoints());
    setSpecialties(getSpecialties());
    setRanks(getRanks());
    setRoles(getRoles());
  };

  const saveAll = () => {
    saveProfiles(profiles);
    saveGuardPoints(guardPoints);
    saveSpecialties(specialties);
    saveRanks(ranks);
    saveRoles(roles);
    alert("CONFIG SAUVEGARDÉE.");
  };

  const handleDownloadBackup = () => {
    const json = createBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_4bsmat_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && window.confirm("ATTENTION : ÉCRASEMENT TOTAL DES DONNÉES. CONTINUER ?")) {
          const success = restoreBackup(content);
          if (success) { alert("RESTAURATION TERMINÉE."); loadAllData(); } 
          else { alert("FICHIER INVALIDE."); }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const togglePointInProfile = (profileId: string, pointId: number) => {
    const updated = profiles.map(p => {
      if (p.id !== profileId) return p;
      const currentPoints = p.activePointIds || [];
      let newPoints;
      if (currentPoints.includes(pointId)) {
        newPoints = currentPoints.filter(id => id !== pointId);
      } else {
        newPoints = [...currentPoints, pointId].sort((a,b) => a - b);
      }
      return { ...p, activePointIds: newPoints, activeGuardPoints: newPoints.length };
    });
    setProfiles(updated);
  };

  const updateSpecialtyCount = (profileId: string, spec: Specialty, count: number) => {
    const updated = profiles.map(p => {
      if (p.id !== profileId) return p;
      const exists = p.requiredSpecialists.find(s => s.specialty === spec);
      let newReqs;
      if (count <= 0) {
        newReqs = p.requiredSpecialists.filter(s => s.specialty !== spec);
      } else {
        if (exists) {
           newReqs = p.requiredSpecialists.map(s => s.specialty === spec ? { ...s, count } : s);
        } else {
           newReqs = [...p.requiredSpecialists, { specialty: spec, count }];
        }
      }
      return { ...p, requiredSpecialists: newReqs };
    });
    setProfiles(updated);
  };

  const addHoliday = () => {
    if (newHoliday && !holidays.includes(newHoliday)) {
      const list = toggleHoliday(newHoliday);
      setHolidays([...list]);
      setNewHoliday('');
    }
  };

  const removeHoliday = (date: string) => {
    const list = toggleHoliday(date);
    setHolidays([...list]);
  };

  const addGuardPoint = () => {
    if (!newPointName) return;
    const newId = guardPoints.length > 0 ? Math.max(...guardPoints.map(p => p.id)) + 1 : 1;
    const newPoint: GuardPoint = { id: newId, name: newPointName, location: newPointLocation };
    setGuardPoints([...guardPoints, newPoint]);
    setNewPointName('');
    setNewPointLocation('');
  };

  const removeGuardPoint = (id: number) => {
    if (window.confirm("SUPPRIMER POINT DE GARDE ?")) {
      setGuardPoints(guardPoints.filter(p => p.id !== id));
    }
  };

  const addSpecialty = () => {
    if (newSpecialty && !specialties.includes(newSpecialty)) {
      setSpecialties([...specialties, newSpecialty]);
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (spec: string) => {
    if (window.confirm("SUPPRIMER SPÉCIALITÉ ?")) {
      setSpecialties(specialties.filter(s => s !== spec));
    }
  };

  const addRank = () => {
    if (newRankName && !ranks.find(r => r.id === newRankName)) {
      const maxOrder = ranks.length > 0 ? Math.max(...ranks.map(r => r.order)) : 0;
      setRanks([...ranks, { id: newRankName, label: newRankName, order: maxOrder + 10 }]);
      setNewRankName('');
    }
  };

  const removeRank = (id: string) => {
      if (window.confirm("SUPPRIMER GRADE ?")) {
          setRanks(ranks.filter(r => r.id !== id));
      }
  };

  const moveRank = (index: number, direction: 'up' | 'down') => {
      const newRanks = [...ranks];
      if (direction === 'up' && index > 0) {
          [newRanks[index], newRanks[index - 1]] = [newRanks[index - 1], newRanks[index]];
      } else if (direction === 'down' && index < newRanks.length - 1) {
          [newRanks[index], newRanks[index + 1]] = [newRanks[index + 1], newRanks[index]];
      }
      newRanks.forEach((r, i) => r.order = (i + 1) * 10);
      setRanks(newRanks);
  };

  const toggleRankForRole = (roleId: string, rankId: string) => {
      const updatedRoles = roles.map(role => {
          if (role.id !== roleId) return role;
          const allowed = role.allowedRanks || [];
          if (allowed.includes(rankId)) {
              return { ...role, allowedRanks: allowed.filter(r => r !== rankId) };
          } else {
              return { ...role, allowedRanks: [...allowed, rankId] };
          }
      });
      setRoles(updatedRoles);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center glass-panel p-4 rounded sticky top-0 z-10 shadow-lg">
        <h1 className="text-xl font-bold text-white uppercase tracking-wider">Règles & Configuration</h1>
        <button 
            onClick={saveAll}
            className="flex items-center px-4 py-2 bg-military-accent hover:bg-yellow-400 text-black font-bold uppercase tracking-widest rounded shadow-lg transition-all text-xs border border-yellow-600"
        >
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* DATA BACKUP ZONE */}
        <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-400 border-b border-white/10 pb-1 uppercase tracking-widest flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-military-accent" />
                Base de Données
            </h2>
            <div className="glass-panel rounded p-4 flex flex-col md:flex-row items-center gap-6">
                 <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-100 uppercase font-mono">Sauvegarde & Restauration</h3>
                    <p className="text-slate-500 text-xs mt-1">Export JSON complet. <span className="text-red-400">Restaurer écrase les données.</span></p>
                 </div>
                 <div className="flex gap-2">
                     <button onClick={handleDownloadBackup} className="flex items-center px-4 py-2 bg-black/20 hover:bg-black/40 text-slate-300 border border-white/10 rounded transition-colors text-xs font-bold uppercase tracking-wide">
                        <Download className="w-4 h-4 mr-2" /> Export
                     </button>
                     <div className="relative">
                         <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportBackup} className="hidden" id="backup-upload" />
                         <label htmlFor="backup-upload" className="flex items-center px-4 py-2 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-800 rounded cursor-pointer transition-colors text-xs font-bold uppercase tracking-wide">
                            <Upload className="w-4 h-4 mr-2" /> Import
                         </label>
                     </div>
                 </div>
            </div>
        </div>
        
        {/* Ranks Management */}
        <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-400 border-b border-white/10 pb-1 uppercase tracking-widest flex items-center">
                <Shield className="w-4 h-4 mr-2 text-military-500" />
                Grades & Hiérarchie
            </h2>
            <div className="glass-panel rounded p-4">
                <div className="space-y-1 mb-4">
                    {ranks.map((rank, idx) => (
                        <div key={rank.id} className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                            <div className="flex items-center space-x-3">
                                <span className="text-military-600 font-mono text-[10px] w-6">{rank.order}</span>
                                <span className="text-slate-200 font-bold uppercase text-xs tracking-wider">{rank.label}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button onClick={() => moveRank(idx, 'up')} className="p-1 hover:bg-white/10 rounded text-slate-500">↑</button>
                                <button onClick={() => moveRank(idx, 'down')} className="p-1 hover:bg-white/10 rounded text-slate-500">↓</button>
                                <button onClick={() => removeRank(rank.id)} className="p-1 hover:text-red-400 text-slate-600"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="NOUVEAU GRADE" 
                        className="flex-1 glass-input rounded px-3 py-2 text-slate-200 text-xs font-bold uppercase focus:border-military-accent outline-none"
                        value={newRankName}
                        onChange={e => setNewRankName(e.target.value)}
                    />
                    <button onClick={addRank} disabled={!newRankName} className="px-3 bg-white/10 hover:bg-white/20 text-white rounded border border-white/10">+</button>
                </div>
            </div>
        </div>

        {/* Roles Assignment (Matrix) */}
        <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-400 border-b border-white/10 pb-1 uppercase tracking-widest flex items-center">
                <Briefcase className="w-4 h-4 mr-2 text-blue-500" />
                Attribution Rôles
            </h2>
            <div className="glass-panel rounded p-4 overflow-x-auto">
                <div className="min-w-[400px]">
                    {roles.map(role => (
                        <div key={role.id} className="mb-4">
                            <h4 className="font-bold text-slate-100 mb-2 text-xs uppercase tracking-wider font-mono bg-black/20 px-2 py-1 inline-block border border-white/10 rounded">{role.name}</h4>
                            <div className="flex flex-wrap gap-1">
                                {ranks.map(rank => {
                                    const isSelected = role.allowedRanks.includes(rank.id);
                                    return (
                                        <button 
                                            key={rank.id}
                                            onClick={() => toggleRankForRole(role.id, rank.id)}
                                            className={`px-2 py-1 text-[10px] rounded border transition-colors font-bold uppercase ${
                                                isSelected 
                                                ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' 
                                                : 'bg-black/10 border-white/5 text-slate-600 hover:bg-white/5'
                                            }`}
                                        >
                                            {rank.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Guard Points Definition */}
        <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-400 border-b border-white/10 pb-1 uppercase tracking-widest">Points de Garde</h2>
            
            <div className="glass-panel rounded p-4">
                 <div className="space-y-2 mb-4">
                    {guardPoints.map(point => (
                        <div key={point.id} className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                            <div>
                                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wide">{point.name}</h4>
                                {point.location && <p className="text-[10px] text-slate-500 font-mono">{point.location}</p>}
                            </div>
                            <button onClick={() => removeGuardPoint(point.id)} className="text-slate-600 hover:text-red-400 p-1"><Trash2 className="w-3 h-3" /></button>
                        </div>
                    ))}
                 </div>
                 <div className="grid grid-cols-2 gap-2 mb-2">
                    <input 
                        type="text" 
                        placeholder="NOM DU POINT" 
                        className="glass-input rounded px-3 py-2 text-slate-200 text-xs font-bold uppercase focus:border-military-accent outline-none"
                        value={newPointName}
                        onChange={e => setNewPointName(e.target.value)}
                    />
                    <input 
                        type="text" 
                        placeholder="EMPLACEMENT" 
                        className="glass-input rounded px-3 py-2 text-slate-200 text-xs font-bold uppercase focus:border-military-accent outline-none"
                        value={newPointLocation}
                        onChange={e => setNewPointLocation(e.target.value)}
                    />
                 </div>
                 <button onClick={addGuardPoint} disabled={!newPointName} className="w-full py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 border border-blue-500/30 rounded text-xs font-bold uppercase tracking-widest transition-colors">AJOUTER</button>
            </div>
        </div>

        {/* Specialties Definition */}
        <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-400 border-b border-white/10 pb-1 uppercase tracking-widest">Spécialités</h2>
            <div className="glass-panel rounded p-4">
                 <div className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        placeholder="NOUVELLE SPÉCIALITÉ" 
                        className="flex-1 glass-input rounded px-3 py-2 text-slate-200 text-xs font-bold uppercase focus:border-military-accent outline-none"
                        value={newSpecialty}
                        onChange={e => setNewSpecialty(e.target.value)}
                    />
                    <button onClick={addSpecialty} disabled={!newSpecialty} className="px-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-xs font-bold uppercase hover:bg-purple-500/30">Ajouter</button>
                 </div>
                 <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {specialties.map(spec => (
                        <div key={spec} className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                            <span className="text-slate-300 font-bold text-[10px] uppercase">{spec}</span>
                            <button onClick={() => removeSpecialty(spec)} className="text-slate-600 hover:text-red-400 p-1"><Trash2 className="w-3 h-3" /></button>
                        </div>
                    ))}
                 </div>
            </div>
        </div>

        {/* Holidays Config */}
        <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-400 border-b border-white/10 pb-1 uppercase tracking-widest">Jours Fériés</h2>
            <div className="glass-panel rounded p-4">
                <div className="flex space-x-2 mb-4">
                    <input type="date" className="flex-1 glass-input rounded px-3 py-2 text-slate-200 text-sm focus:border-military-accent outline-none" value={newHoliday} onChange={(e) => setNewHoliday(e.target.value)} />
                    <button onClick={addHoliday} className="bg-white/10 hover:bg-white/20 text-slate-300 px-3 rounded text-xs font-bold uppercase border border-white/10">Ajouter</button>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                    {holidays.sort().map(date => (
                        <div key={date} className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                            <span className="flex items-center text-slate-300 text-xs font-mono">
                                <CalendarCheck className="w-3 h-3 mr-2 text-red-500" />
                                {format(parseISO(date), 'dd MMM yyyy', { locale: fr }).toUpperCase()}
                            </span>
                            <button onClick={() => removeHoliday(date)} className="text-red-500 hover:text-red-400 text-xs font-bold">X</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Profiles Config */}
        <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-400 border-b border-white/10 pb-1 uppercase tracking-widest">Profils de Service</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {profiles.map(profile => (
                    <div key={profile.id} className="glass-panel rounded p-4 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-slate-100 bg-white/10 border border-white/10 px-3 py-1 rounded text-xs uppercase tracking-widest">
                                {profile.dayType}
                            </span>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-military-500 mb-2 uppercase flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" /> Points Actifs
                                </label>
                                <div className="space-y-1 bg-black/20 p-2 rounded border border-white/5 h-32 overflow-y-auto custom-scrollbar">
                                    {guardPoints.map(point => {
                                        const isActive = (profile.activePointIds || []).includes(point.id);
                                        return (
                                            <label key={point.id} className="flex items-center space-x-2 cursor-pointer hover:bg-white/5 p-1 rounded">
                                                <input 
                                                    type="checkbox"
                                                    className="rounded border-white/20 bg-black/40 text-military-accent focus:ring-military-accent"
                                                    checked={isActive}
                                                    onChange={() => togglePointInProfile(profile.id, point.id)}
                                                />
                                                <span className={`text-xs font-bold uppercase ${isActive ? 'text-slate-200' : 'text-slate-600'}`}>
                                                    {point.name}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-military-500 mb-2 uppercase flex items-center">
                                    <Wrench className="w-3 h-3 mr-1" /> Spécialistes
                                </label>
                                <div className="space-y-1 bg-black/20 p-2 rounded border border-white/5 h-32 overflow-y-auto custom-scrollbar">
                                    {specialties.map(spec => {
                                        const req = profile.requiredSpecialists.find(s => s.specialty === spec);
                                        const count = req ? req.count : 0;
                                        return (
                                            <div key={spec} className="flex justify-between items-center py-1">
                                                <span className={`text-xs font-bold uppercase ${count > 0 ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {spec}
                                                </span>
                                                <input 
                                                    type="number"
                                                    min="0"
                                                    className="w-10 glass-input rounded text-center text-slate-200 text-xs focus:border-military-accent outline-none"
                                                    value={count}
                                                    onChange={(e) => updateSpecialtyCount(profile.id, spec, parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;