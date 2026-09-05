import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Usuario } from '../types';
import { supabase } from '../services/supabase/client';

interface AuthContextType {
  usuarioActual: Usuario | null;
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
    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Obtener el perfil extendido de la tabla usuarios
        const { data: perfil, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (perfil) {
          setUsuarioActual(perfil as Usuario);
        } else {
          console.error("No se encontró el perfil de usuario", error);
          setUsuarioActual(null);
          // Si hay una sesión activa pero no hay perfil (ej. usuario borrado manualmente en Supabase)
          // cerramos la sesión local para limpiar el caché.
          await supabase.auth.signOut();
        }
      } else {
        setUsuarioActual(null);
        // Reevaluar si no hay usuarios
        const { data: hasUsers, error } = await supabase.rpc('check_has_users');
        if (error) {
          console.error("Error chequeando usuarios (AuthChange):", error);
          setNeedsFirstAdmin(false);
        } else {
          setNeedsFirstAdmin(hasUsers === false);
        }
      }
      setIsLoading(false);
    });

    // Check inicial
    const checkInitial = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Verificar si la tabla de usuarios está vacía usando la función RPC segura
        const { data: hasUsers, error } = await supabase.rpc('check_has_users');
        if (error) {
          console.error("Error chequeando usuarios (Initial):", error);
          setNeedsFirstAdmin(false);
        } else {
          setNeedsFirstAdmin(hasUsers === false);
        }
        setIsLoading(false);
      }
    };

    checkInitial();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUsuarioActual(null);
  };

  return (
    <AuthContext.Provider value={{ usuarioActual, logout, isLoading, needsFirstAdmin }}>
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
