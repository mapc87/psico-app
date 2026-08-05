import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Usuario } from '../types';
import { db } from '../services/db/localDb';

interface AuthContextType {
  usuarioActual: Usuario | null;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  needsFirstAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsFirstAdmin, setNeedsFirstAdmin] = useState(false);

  useEffect(() => {
    // 1. Verificar si hay sesión activa (para simplificar, guardamos en localStorage el ID)
    const checkSession = async () => {
      try {
        const userIdStr = localStorage.getItem('psico_auth_id');
        if (userIdStr) {
          const user = await db.usuarios.get(Number(userIdStr));
          if (user) {
            setUsuarioActual(user);
          } else {
            localStorage.removeItem('psico_auth_id');
          }
        }
        
        // 2. Verificar si no existe NINGÚN usuario en el sistema (primer arranque)
        const totalUsers = await db.usuarios.count();
        if (totalUsers === 0) {
          setNeedsFirstAdmin(true);
        } else {
          setNeedsFirstAdmin(false);
        }
      } catch (error) {
        console.error("Error comprobando sesión", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      // En Dexie, simulamos la validación. En producción real (Supabase), enviaríamos la contraseña encriptada.
      const users = await db.usuarios.where('email').equalsIgnoreCase(email).toArray();
      const user = users[0];
      
      if (user && user.password === password) {
        setUsuarioActual(user);
        localStorage.setItem('psico_auth_id', String(user.id));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error en login", error);
      return false;
    }
  };

  const logout = () => {
    setUsuarioActual(null);
    localStorage.removeItem('psico_auth_id');
  };

  return (
    <AuthContext.Provider value={{ usuarioActual, login, logout, isLoading, needsFirstAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
