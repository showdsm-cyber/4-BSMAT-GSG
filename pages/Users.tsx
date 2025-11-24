
import React, { useState, useEffect } from 'react';
import { getUsers, saveUsers } from '../services/storageService';
import { User, UserRole } from '../types';
import { Plus, Trash2, UserCog, Shield, Lock } from 'lucide-react';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('MANAGER');

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm("Supprimer cet utilisateur ?")) {
        const updated = users.filter(u => u.id !== id);
        setUsers(updated);
        saveUsers(updated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !displayName) return;

    const newUser: User = {
        id: Date.now().toString(),
        username,
        password,
        displayName,
        role
    };

    const updated = [...users, newUser];
    setUsers(updated);
    saveUsers(updated);
    setIsFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
      setUsername('');
      setPassword('');
      setDisplayName('');
      setRole('MANAGER');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
            <h1 className="text-xl font-bold text-slate-100 uppercase tracking-widest">Gestion des Utilisateurs</h1>
            <p className="text-military-500 text-xs font-mono mt-1">CONTRÔLE D'ACCÈS ET RÔLES</p>
        </div>
        <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-sm transition-colors text-xs font-bold uppercase tracking-wider shadow-lg"
        >
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Utilisateur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(user => (
              <div key={user.id} className="glass-panel p-4 rounded-sm border border-white/10 relative group">
                  <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-sm ${user.role === 'ADMIN' ? 'bg-military-accent/20 text-military-accent' : 'bg-blue-500/20 text-blue-400'}`}>
                              {user.role === 'ADMIN' ? <Shield className="w-6 h-6" /> : <UserCog className="w-6 h-6" />}
                          </div>
                          <div>
                              <h3 className="text-slate-200 font-bold uppercase tracking-wide">{user.displayName}</h3>
                              <p className="text-slate-500 text-xs font-mono">@{user.username}</p>
                          </div>
                      </div>
                      {user.id !== '1' && ( // Prevent deleting main admin
                          <button onClick={() => handleDelete(user.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1">
                              <Trash2 className="w-4 h-4" />
                          </button>
                      )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-sm border ${
                          user.role === 'ADMIN' 
                          ? 'border-yellow-600/50 text-yellow-500 bg-yellow-900/20' 
                          : 'border-blue-600/50 text-blue-400 bg-blue-900/20'
                      }`}>
                          {user.role === 'ADMIN' ? 'Administrateur' : 'Gestionnaire'}
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono flex items-center">
                          <Lock className="w-3 h-3 mr-1" /> Sécurisé
                      </span>
                  </div>
              </div>
          ))}
      </div>

      {isFormOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
              <div className="glass-panel rounded-sm max-w-md w-full border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                  <div className="p-4 bg-black/20 border-b border-white/10 flex justify-between items-center">
                      <h2 className="text-lg font-bold text-white uppercase tracking-widest">Nouvel Accès</h2>
                      <button onClick={() => setIsFormOpen(false)} className="text-slate-500 hover:text-white">✕</button>
                  </div>
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                      <div>
                          <label className="block text-[10px] font-bold uppercase text-military-500 mb-1">Nom d'affichage</label>
                          <input 
                              type="text" 
                              required
                              className="w-full glass-input rounded-sm px-3 py-2 text-slate-200 text-sm focus:border-military-accent outline-none"
                              value={displayName}
                              onChange={e => setDisplayName(e.target.value)}
                              placeholder="ex: Sergent Dupont"
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold uppercase text-military-500 mb-1">Identifiant (Login)</label>
                          <input 
                              type="text" 
                              required
                              className="w-full glass-input rounded-sm px-3 py-2 text-slate-200 text-sm focus:border-military-accent outline-none font-mono"
                              value={username}
                              onChange={e => setUsername(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold uppercase text-military-500 mb-1">Mot de passe</label>
                          <input 
                              type="password" 
                              required
                              className="w-full glass-input rounded-sm px-3 py-2 text-slate-200 text-sm focus:border-military-accent outline-none font-mono"
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold uppercase text-military-500 mb-1">Rôle</label>
                          <div className="grid grid-cols-2 gap-2">
                              <label className={`cursor-pointer border rounded-sm p-2 text-center transition-colors ${role === 'ADMIN' ? 'bg-military-accent/20 border-military-accent text-military-accent' : 'bg-black/20 border-white/10 text-slate-500'}`}>
                                  <input type="radio" className="hidden" checked={role === 'ADMIN'} onChange={() => setRole('ADMIN')} />
                                  <span className="text-xs font-bold uppercase">Admin</span>
                              </label>
                              <label className={`cursor-pointer border rounded-sm p-2 text-center transition-colors ${role === 'MANAGER' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-black/20 border-white/10 text-slate-500'}`}>
                                  <input type="radio" className="hidden" checked={role === 'MANAGER'} onChange={() => setRole('MANAGER')} />
                                  <span className="text-xs font-bold uppercase">Gestionnaire</span>
                              </label>
                          </div>
                      </div>
                      <button 
                          type="submit" 
                          className="w-full py-3 bg-military-accent hover:bg-yellow-400 text-black font-bold uppercase tracking-widest rounded-sm transition-colors text-sm shadow-lg shadow-yellow-900/20 mt-4"
                      >
                          Créer l'utilisateur
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default UsersPage;
