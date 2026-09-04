import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase/client';
import type { Rol } from '../types';

export default function ProtectedRoute({ requireAdmin = false, children }: { requireAdmin?: boolean, children?: React.ReactNode }) {
  const { usuarioActual, isLoading } = useAuth();
  const location = useLocation();

  const [rolActual, setRolActual] = useState<Rol | null | undefined>(undefined);

  useEffect(() => {
    if (usuarioActual?.rol === 'personal' && usuarioActual.rol_id) {
      supabase.from('roles').select('*').eq('id', usuarioActual.rol_id).single()
        .then(({ data }) => setRolActual(data as Rol || null))
        .catch(() => setRolActual(null));
    } else {
      setRolActual(null);
    }
  }, [usuarioActual]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Cargando sesión...</div>;
  }

  // Si no hay usuario logueado, expulsar al Login
  if (!usuarioActual) {
    return <Navigate to="/login" replace />;
  }

  // Si la ruta requiere administrador y el usuario no lo es, enviarlo al dashboard
  if (requireAdmin && usuarioActual.rol !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Control de Acceso Basado en Roles (RBAC) para el Personal
  if (usuarioActual.rol === 'personal') {
    // Si aún está cargando el rol de Dexie, mostramos loader o esperamos (para evitar redirecciones falsas)
    // Dexie react-hooks devuelve undefined mientras carga
    if (rolActual === undefined && usuarioActual.rol_id) {
      return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Verificando accesos...</div>;
    }

    const permisos = rolActual?.permisos;
    
    if (permisos) {
      const path = location.pathname;
      
      // Proteger rutas principales
      if (path.startsWith('/agenda') && !permisos.verAgenda) {
        return <Navigate to="/dashboard" replace />;
      }
      if (path.startsWith('/pacientes') && !permisos.verPacientes) {
        return <Navigate to="/dashboard" replace />;
      }
      
      // Proteger rutas de administración que intenten acceder por URL
      if (path.startsWith('/roles') || path.startsWith('/personal') || path.startsWith('/admin')) {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  // Doctores tampoco deberían ver /admin si solo es para Master Admin
  if (usuarioActual.rol === 'doctor') {
    const path = location.pathname;
    if (path.startsWith('/admin')) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Si todo está bien, renderizar hijos o Outlet
  return children ? <>{children}</> : <Outlet />;
}
