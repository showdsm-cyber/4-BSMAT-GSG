
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { getUsers } from '../services/storageService';

interface AuthContextType {
  user: User | null;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('session_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse session user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password?: string): Promise<boolean> => {
    // In a real app, verify password hash. Here we mock it by checking the stored users
    // Note: For this local-only demo, we trust the 'getUsers' source.
    const users = getUsers();
    const foundUser = users.find(u => u.username === username);

    if (foundUser) {
        // Simple password check (mock)
        if (password && foundUser.password !== password) {
            return false;
        }
        
        setUser(foundUser);
        localStorage.setItem('session_user', JSON.stringify(foundUser));
        return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('session_user');
  };

  if (loading) {
      return <div className="h-screen w-screen flex items-center justify-center bg-military-950 text-military-accent font-mono">INITIALISATION...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
