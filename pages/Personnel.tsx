import React, { useState, useEffect } from 'react';
import { getPersonnel, savePersonnel, getSpecialties, getAllSchedules, getRanks, getGuardPoints } from '../services/storageService';
import { Soldier, Specialty, RankDefinition, GuardPoint } from '../types';
import { Search, Plus, UserX, UserCheck, Stethoscope, Clock, Shield, Calendar, X, Pencil, Trash2, CheckSquare, Square, Save } from 'lucide-react';
import { parseISO, format } from 'date-fns';

interface HistoryEntry {
  date: string;
  role: string;
  details: string;
}

const Personnel: React.FC = () => {
  const [personnel, setPersonnel] = useState<Soldier[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [ranks, setRanks] = useState<RankDefinition[]>([]);
  const [guardPoints, setGuardPoints] = useState<GuardPoint[]>([]);
  const [lastDutyMap, setLastDutyMap] = useState<Map<string, string>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState<string>('All');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('All');

  const [selectedSoldierHistory, setSelectedSoldierHistory] = useState<Soldier | null>(null);
  const [soldierHistory, setSoldierHistory] = useState<HistoryEntry[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Soldier>>({
    firstName: '',
    lastName: '',
    rank: '',
    specialties: [],
    medicalRestriction: false,
    exempt: false
  });

  useEffect(() => {
    setPersonnel(getPersonnel());
    setSpecialties(getSpecialties());
    setRanks(getRanks());
    setGuardPoints(getGuardPoints());
    calculateLastDuties();
  }, []);

  const calculateLastDuties = () => {
      const allSchedules = getAllSchedules();
      const map = new Map<string, string>();
      const sortedDates = Object.keys(allSchedules).sort((a,b) => b.localeCompare(a)); 

      const foundSet = new Set<string>();
      
      for (const date of sortedDates) {
          const schedule = allSchedules[date];
          const participants = new Set<string>();
          if (schedule.policeStation.chiefId) participants.add(schedule.policeStation.chiefId);
          if (schedule.policeStation.deputyId) participants.add(schedule.policeStation.deputyId);
          if (schedule.permanence.officerId) participants.add(schedule.permanence.officerId);
          if (schedule.permanence.ncoId) participants.add(schedule.permanence.ncoId);
          schedule.specialists.forEach(s => participants.add(s.soldierId));
          schedule.guardPoints.forEach(gp => gp.soldiers.forEach(s => participants.add(s)));

          participants.forEach(pid => {
              if (!foundSet.has(pid)) {
                  map.set(pid, date);
                  foundSet.add(pid);
              }
          });
      }
      setLastDutyMap(map);
  };

  const getSoldierHistory = (id: string): HistoryEntry[] => {
      const allSchedules = getAllSchedules();
      const history: HistoryEntry[] = [];
      Object.values(allSchedules).forEach(schedule => {
          let role = '';
          let details = '';
          let found = false;

          if (schedule.policeStation.chiefId === id) { role = 'Chef de Poste'; found = true; } 
          else if (schedule.policeStation.deputyId === id) { role = 'Adjoint Poste'; found = true; } 
          else if (schedule.permanence.officerId === id) { role = 'Officier Perm'; found = true; } 
          else if (schedule.permanence.ncoId === id) { role = 'Adjoint Perm'; found = true; } 
          else {
              const spec = schedule.specialists.find(s => s.soldierId === id);
              if (spec) { role = spec.specialty; found = true; } 
              else {
                  const gp = schedule.guardPoints.find(p => p.soldiers.includes(id));
                  if (gp) {
                      role = 'Garde';
                      const point = guardPoints.find(p => p.id === gp.pointId);
                      details = point ? point.name : `Point #${gp.pointId}`;
                      found = true;
                  }
              }
          }
          if (found) history.push({ date: schedule.date, role, details });
      });
      return history.sort((a,b) => b.date.localeCompare(a.date));
  };

  const handleAddNew = () => {
      setEditingId(null);
      setFormData({
        firstName: '',
        lastName: '',
        rank: ranks[0]?.id || '',
        specialties: [],
        medicalRestriction: false,
        exempt: false
      });
      setIsFormOpen(true);
  };

  const handleEdit = (e: React.MouseEvent, soldier: Soldier) => {
      e.stopPropagation();
      setEditingId(soldier.id);
      setFormData({
          firstName: soldier.firstName,
          lastName: soldier.lastName,
          rank: soldier.rank,
          specialties: soldier.specialties,
          medicalRestriction: soldier.medicalRestriction,
          exempt: soldier.exempt
      });
      setIsFormOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm("CONFIRMER LA SUPPRESSION DÉFINITIVE ?")) {
          const updated = personnel.filter(p => p.id !== id);
          setPersonnel(updated);
          savePersonnel(updated);
      }
  };

  const handleSaveForm = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.lastName || !formData.firstName || !formData.rank) return;

      let updatedList: Soldier[];
      if (editingId) {
          updatedList = personnel.map(p => p.id === editingId ? { ...p, ...formData } as Soldier : p);
      } else {
          const newSoldier: Soldier = {
              id: Date.now().toString(),
              firstName: formData.firstName!,
              lastName: formData.lastName!,
              rank: formData.rank!,
              specialties: formData.specialties || [],
              medicalRestriction: formData.medicalRestriction || false,
              exempt: formData.exempt || false
          };
          updatedList = [...personnel, newSoldier];
      }
      setPersonnel(updatedList);
      savePersonnel(updatedList);
      setIsFormOpen(false);
  };

  const toggleFormSpecialty = (spec: string) => {
      const current = formData.specialties || [];
      if (current.includes(spec)) {
          setFormData({ ...formData, specialties: current.filter(s => s !== spec) });
      } else {
          setFormData({ ...formData, specialties: [...current, spec] });
      }
  };

  const openHistoryModal = (soldier: Soldier) => {
      setSelectedSoldierHistory(soldier);
      setSoldierHistory(getSoldierHistory(soldier.id));
  };

  const filteredPersonnel = personnel.filter(p => {
    const matchesSearch = p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || p.firstName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRank = filterRank === 'All' || p.rank === filterRank;
    const matchesSpecialty = filterSpecialty === 'All' || p.specialties.includes(filterSpecialty);
    return matchesSearch && matchesRank && matchesSpecialty;
  });

  const toggleMedical = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = personnel.map(p => p.id === id ? { ...p, medicalRestriction: !p.medicalRestriction } : p);
    setPersonnel(updated);
    savePersonnel(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold text-slate-100 uppercase tracking-widest">Effectifs & Gestion</h1>
        <button 
            onClick={handleAddNew}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors text-xs font-bold uppercase tracking-wider shadow-lg"
        >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
        </button>
      </div>

      <div className="glass-panel rounded p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input 
                type="text" 
                placeholder="Rechercher matricule ou nom..." 
                className="w-full pl-10 pr-4 py-2 glass-input rounded text-slate-200 text-sm focus:outline-none focus:border-military-accent font-mono transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex gap-2">
          <select 
              className="px-3 py-2 glass-input rounded text-slate-200 text-sm focus:outline-none focus:border-military-accent"
              value={filterRank}
              onChange={(e) => setFilterRank(e.target.value)}
          >
              <option value="All" className="bg-military-950">TOUS GRADES</option>
              {ranks.map(r => <option key={r.id} value={r.id} className="bg-military-950">{r.label.toUpperCase()}</option>)}
          </select>

          <select 
              className="px-3 py-2 glass-input rounded text-slate-200 text-sm focus:outline-none focus:border-military-accent"
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
          >
              <option value="All" className="bg-military-950">TOUTES SPÉCIALITÉS</option>
              {specialties.map(s => <option key={s} value={s} className="bg-military-950">{s}</option>)}
          </select>
        </div>
      </div>

      <div className="glass-panel rounded overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-black/20 text-xs uppercase text-military-500 font-bold tracking-widest border-b border-white/5">
                    <tr>
                        <th className="p-4">Identité</th>
                        <th className="p-4">Grade</th>
                        <th className="p-4">Qualification</th>
                        <th className="p-4 font-mono">DERNIER SERVICE</th>
                        <th className="p-4">APTITUDE</th>
                        <th className="p-4 text-center">ACTIONS</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                    {filteredPersonnel.map(soldier => {
                        const lastDate = lastDutyMap.get(soldier.id);
                        return (
                        <tr 
                            key={soldier.id} 
                            onClick={() => openHistoryModal(soldier)}
                            className="hover:bg-white/5 transition-colors cursor-pointer group"
                        >
                            <td className="p-4 font-bold text-slate-200 font-mono tracking-tight group-hover:text-white">
                                {soldier.lastName.toUpperCase()} {soldier.firstName}
                            </td>
                            <td className="p-4">
                                <span className="text-xs font-bold uppercase text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/5">
                                    {soldier.rank}
                                </span>
                            </td>
                            <td className="p-4">
                                <div className="flex gap-1 flex-wrap">
                                    {soldier.specialties.map(s => (
                                        <span key={s} className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="p-4 font-mono text-xs">
                                {lastDate ? (
                                    <span className="text-slate-300">
                                        {format(parseISO(lastDate), 'dd/MM/yyyy')}
                                    </span>
                                ) : (
                                    <span className="text-slate-600">---</span>
                                )}
                            </td>
                            <td className="p-4">
                                {soldier.medicalRestriction ? (
                                    <span className="text-red-500 text-xs font-bold uppercase flex items-center">
                                        RESTREINT
                                    </span>
                                ) : (
                                    <span className="text-green-500 text-xs font-bold uppercase flex items-center">
                                        APTE
                                    </span>
                                )}
                            </td>
                            <td className="p-4 text-center">
                                <div className="flex items-center justify-center space-x-1">
                                    <button 
                                        onClick={(e) => toggleMedical(e, soldier.id)}
                                        className={`p-1.5 rounded border transition-colors ${
                                            soldier.medicalRestriction 
                                            ? 'border-green-800 bg-green-950/50 text-green-500 hover:bg-green-900' 
                                            : 'border-red-800 bg-red-950/50 text-red-500 hover:bg-red-900'
                                        }`}
                                        title="Basculer statut médical"
                                    >
                                        <Stethoscope className="w-3 h-3" />
                                    </button>
                                    <button onClick={(e) => handleEdit(e, soldier)} className="p-1.5 rounded border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10">
                                        <Pencil className="w-3 h-3" />
                                    </button>
                                    <button onClick={(e) => handleDelete(e, soldier.id)} className="p-1.5 rounded border border-white/10 bg-white/5 text-slate-400 hover:text-red-400 hover:bg-white/10">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
        </div>
      </div>

      {/* History Modal */}
      {selectedSoldierHistory && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md" onClick={() => setSelectedSoldierHistory(null)}>
              <div className="glass-panel rounded max-w-xl w-full border border-white/10 shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                  <div className="p-4 bg-black/20 border-b border-white/10 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-sm font-bold text-military-accent border border-white/10 font-mono">
                               {selectedSoldierHistory.lastName.substring(0,2)}
                          </div>
                          <div>
                              <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider">{selectedSoldierHistory.rank} {selectedSoldierHistory.lastName}</h2>
                          </div>
                      </div>
                      <button onClick={() => setSelectedSoldierHistory(null)} className="text-slate-500 hover:text-white">✕</button>
                  </div>
                  <div className="p-4 overflow-y-auto custom-scrollbar">
                      <h3 className="text-xs font-bold text-military-500 uppercase tracking-widest mb-4">Historique de Service</h3>
                      {soldierHistory.length > 0 ? (
                        <div className="space-y-2 border-l border-white/10 ml-2 pl-4">
                            {soldierHistory.map((entry, idx) => (
                                <div key={idx} className="relative">
                                    <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-military-600"></div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-mono text-military-accent text-sm">{format(parseISO(entry.date), 'dd/MM/yyyy')}</span>
                                        <span className="font-bold text-slate-300 text-sm uppercase">{entry.role}</span>
                                    </div>
                                    {entry.details && <p className="text-xs text-slate-500 mt-0.5">{entry.details}</p>}
                                </div>
                            ))}
                        </div>
                      ) : (
                          <div className="text-center p-4 text-slate-600 font-mono text-xs italic border border-dashed border-white/10">Aucun historique.</div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Add/Edit Modal */}
      {isFormOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
              <div className="glass-panel rounded max-w-lg w-full border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                  <div className="p-4 bg-black/20 border-b border-white/10 flex justify-between items-center">
                      <h2 className="text-lg font-bold text-white uppercase tracking-widest">
                          {editingId ? "Édition Dossier" : "Nouveau Dossier"}
                      </h2>
                      <button onClick={() => setIsFormOpen(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
                  </div>
                  
                  <form onSubmit={handleSaveForm} className="p-6 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-1">
                              <label className="block text-[10px] font-bold uppercase text-military-500 mb-1">Grade</label>
                              <select 
                                  required
                                  className="w-full glass-input rounded px-3 py-2 text-slate-200 text-sm focus:border-military-accent outline-none"
                                  value={formData.rank}
                                  onChange={e => setFormData({...formData, rank: e.target.value})}
                              >
                                  <option value="" className="bg-military-950">---</option>
                                  {ranks.map(r => <option key={r.id} value={r.id} className="bg-military-950">{r.label}</option>)}
                              </select>
                          </div>
                          <div className="col-span-2">
                              <label className="block text-[10px] font-bold uppercase text-military-500 mb-1">Nom</label>
                              <input 
                                  type="text" 
                                  required
                                  className="w-full glass-input rounded px-3 py-2 text-slate-200 text-sm focus:border-military-accent outline-none uppercase font-mono"
                                  value={formData.lastName}
                                  onChange={e => setFormData({...formData, lastName: e.target.value.toUpperCase()})}
                              />
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-[10px] font-bold uppercase text-military-500 mb-1">Prénom</label>
                          <input 
                              type="text" 
                              required
                              className="w-full glass-input rounded px-3 py-2 text-slate-200 text-sm focus:border-military-accent outline-none capitalize"
                              value={formData.firstName}
                              onChange={e => setFormData({...formData, firstName: e.target.value})}
                          />
                      </div>

                      <div>
                          <label className="block text-[10px] font-bold uppercase text-military-500 mb-2">Qualifications</label>
                          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 bg-black/20 border border-white/10 rounded">
                              {specialties.map(spec => {
                                  const isSelected = (formData.specialties || []).includes(spec);
                                  return (
                                      <div 
                                          key={spec} 
                                          onClick={() => toggleFormSpecialty(spec)}
                                          className={`flex items-center space-x-2 p-1.5 rounded cursor-pointer border transition-colors ${isSelected ? 'bg-military-800/60 border-military-600 text-slate-200' : 'border-transparent hover:bg-white/5 text-slate-500'}`}
                                      >
                                          <div className={`w-3 h-3 border ${isSelected ? 'bg-military-accent border-military-accent' : 'border-military-600'} flex items-center justify-center`}>
                                              {isSelected && <div className="w-1.5 h-1.5 bg-black"></div>}
                                          </div>
                                          <span className="text-xs font-bold uppercase">{spec}</span>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                          <label className={`flex items-center justify-center p-3 rounded border cursor-pointer transition-colors ${formData.medicalRestriction ? 'bg-red-950/40 border-red-800 text-red-400' : 'bg-black/20 border-white/10 text-slate-500 hover:bg-white/5'}`}>
                              <input 
                                  type="checkbox" 
                                  className="hidden"
                                  checked={formData.medicalRestriction}
                                  onChange={e => setFormData({...formData, medicalRestriction: e.target.checked})}
                              />
                              <span className="text-xs font-bold uppercase">Restriction Médicale</span>
                          </label>

                          <label className={`flex items-center justify-center p-3 rounded border cursor-pointer transition-colors ${formData.exempt ? 'bg-orange-950/40 border-orange-800 text-orange-400' : 'bg-black/20 border-white/10 text-slate-500 hover:bg-white/5'}`}>
                              <input 
                                  type="checkbox" 
                                  className="hidden"
                                  checked={formData.exempt}
                                  onChange={e => setFormData({...formData, exempt: e.target.checked})}
                              />
                              <span className="text-xs font-bold uppercase">Exemption Totale</span>
                          </label>
                      </div>

                      <button 
                          type="submit" 
                          className="w-full py-3 bg-military-accent hover:bg-yellow-400 text-black font-bold uppercase tracking-widest rounded transition-colors text-sm shadow-lg shadow-yellow-900/20"
                      >
                          {editingId ? "Mettre à jour" : "Enregistrer"}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Personnel;