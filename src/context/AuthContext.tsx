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

  const cargarPerfil = async (sessionUser: any) => {
    try {
      const userId = sessionUser.id;
      let perfil: Usuario | null = null;
      
      // 1. Intentar consultar perfil en public.usuarios
      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        perfil = data as Usuario;
      } else {
        console.warn("Perfil no encontrado en public.usuarios. Creando/reparando automáticamente...");
        
        let clinicaId = null;
        let rolAsignado = 'admin';
        let rolId = null;

        const codigoInv = sessionUser.user_metadata?.codigo_invitacion;
        if (codigoInv) {
          const { data: inv } = await supabase
            .from('invitaciones')
            .select('*')
            .eq('codigo', codigoInv.trim().toUpperCase())
            .maybeSingle();

          if (inv) {
            clinicaId = inv.clinica_id;
            if (['superadmin', 'admin', 'personal', 'doctor'].includes(inv.rol_asignado)) {
              rolAsignado = inv.rol_asignado;
            } else {
              rolAsignado = 'personal';
              rolId = inv.rol_asignado;
            }
          }
        }

        // Auto-creación/reparación del registro en la tabla de usuarios
        const { data: nuevoPerfil } = await supabase
          .from('usuarios')
          .upsert({
            id: userId,
            email: sessionUser.email,
            nombre: sessionUser.user_metadata?.nombre || sessionUser.email?.split('@')[0] || 'Usuario',
            rol: rolAsignado,
            clinica_id: clinicaId,
            rol_id: rolId
          }, { onConflict: 'id' })
          .select('*')
          .maybeSingle();

        if (nuevoPerfil) {
          perfil = nuevoPerfil as Usuario;
        } else {
          // Objeto en memoria como respaldo para garantizar que el usuario ingrese
          perfil = {
            id: userId,
            email: sessionUser.email || '',
            nombre: sessionUser.user_metadata?.nombre || 'Usuario',
            rol: rolAsignado as any,
            clinica_id: clinicaId,
            rol_id: rolId,
            created_at: new Date().toISOString()
          };
        }
      }

      if (perfil.activo === false) {
        alert("Tu cuenta ha sido desactivada. Por favor contacta al administrador de tu clínica.");
        setUsuarioActual(null);
        await supabase.auth.signOut();
        return;
      }

      // 2. Si tiene clinica_id, verificar que la clínica esté activa
      if (perfil.clinica_id && perfil.rol !== 'superadmin') {
        try {
          const { data: clinica } = await supabase
            .from('clinicas')
            .select('estado')
            .eq('id', perfil.clinica_id)
            .maybeSingle();

          if (clinica && clinica.estado === 'inactiva') {
            alert("Tu clínica ha sido desactivada. Por favor contacta al administrador del sistema.");
            setUsuarioActual(null);
            await supabase.auth.signOut();
            return;
          }
        } catch (e) {
          console.warn("No se pudo verificar el estado de la clínica:", e);
        }
      }

      setUsuarioActual(perfil);
    } catch (err) {
      console.error("Error en cargarPerfil:", err);
    }
  };

  const verificarPrimerAdmin = async () => {
    try {
      const { data: hasUsers, error } = await supabase.rpc('check_has_users');
      if (error) {
        const { count } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
        setNeedsFirstAdmin(count === 0);
      } else {
        setNeedsFirstAdmin(hasUsers === false);
      }
    } catch (e) {
      console.error("Error verificando usuarios iniciales:", e);
      setNeedsFirstAdmin(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await cargarPerfil(session.user);
        } else {
          setUsuarioActual(null);
          await verificarPrimerAdmin();
        }
      } catch (err) {
        console.error("Error en inicialización de Auth:", err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          await cargarPerfil(session.user);
        } else {
          setUsuarioActual(null);
          await verificarPrimerAdmin();
        }
      } catch (err) {
        console.error("Error en cambio de sesión Auth:", err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUsuarioActual(null);
    setIsLoading(false);
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
