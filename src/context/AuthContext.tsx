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
        // Mecanismo de reintento (Retry Logic) para prevenir flicker si el trigger tarda en crear el perfil
        let perfil = null;
        for (let i = 0; i < 4; i++) {
          const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (data) {
            perfil = data;
            break;
          }
          
          // Esperar 500ms antes del próximo reintento
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (perfil) {
          if (perfil.rol === 'superadmin') {
            setUsuarioActual(perfil as Usuario);
          } else {
            // Check si la clinica está activa
            const { data: clinica } = await supabase
              .from('clinicas')
              .select('estado')
              .eq('id', perfil.clinica_id)
              .single();
              
            if (clinica && clinica.estado === 'inactiva') {
              console.error("Clínica inactiva, denegando acceso");
              alert("Tu clínica ha sido desactivada. Por favor contacta al administrador del sistema.");
              setUsuarioActual(null);
              await supabase.auth.signOut();
            } else {
              setUsuarioActual(perfil as Usuario);
            }
          }
        } else {
          console.error("No se encontró el perfil de usuario tras varios intentos");
          setUsuarioActual(null);
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
