import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase/client';
import { LayoutDashboard, Users, Calendar, LogOut, FileSignature, Shield, Activity, UsersRound, Wallet, Settings, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Permisos } from '../types';

export default function MainLayout() {
  const { usuarioActual, logout } = useAuth();
  const navigate = useNavigate();
  const [permisos, setPermisos] = useState<Permisos | null>(null);

  useEffect(() => {
    const fetchPermisos = async () => {
      if (usuarioActual?.rol_id) {
        const { data } = await supabase.from('roles').select('permisos').eq('id', usuarioActual.rol_id).single();
        if (data && data.permisos) {
          setPermisos(data.permisos as Permisos);
        }
      }
    };
    fetchPermisos();
  }, [usuarioActual?.rol_id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filtrado de navegación
  const navItems = [];
  
  if (usuarioActual?.rol === 'superadmin') {
    navItems.push({ icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' });
    navItems.push({ icon: <Building2 size={20} />, label: 'Clínicas', path: '/admin/clinicas' });
  } else if (usuarioActual?.rol === 'admin') {
    navItems.push({ icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' });
    navItems.push({ icon: <Users size={20} />, label: 'Pacientes', path: '/pacientes' });
    navItems.push({ icon: <Calendar size={20} />, label: 'Agenda', path: '/agenda' });
    navItems.push({ icon: <Wallet size={20} />, label: 'Facturación', path: '/finanzas' });
    navItems.push({ icon: <FileSignature size={20} />, label: 'Documentos', path: '/consentimientos' });
  } else if (usuarioActual?.rol === 'personal' && permisos) {
    if (permisos.verAgenda) navItems.push({ icon: <Calendar size={20} />, label: 'Agenda', path: '/agenda' });
    if (permisos.verPacientes) navItems.push({ icon: <Users size={20} />, label: 'Pacientes', path: '/pacientes' });
    if (permisos.verFinanzas) navItems.push({ icon: <Wallet size={20} />, label: 'Facturación', path: '/finanzas' });
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white/50 backdrop-blur-xl border-r border-slate-100 flex flex-col relative">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50/50 to-transparent pointer-events-none"></div>
        
        <div className="p-8 flex items-center relative z-10">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 mr-3">
            <Activity className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">PsicoApp</h1>
        </div>
        
        <nav className="flex-1 py-8 space-y-2 px-4 relative z-10">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30' 
                    : 'text-slate-500 hover:bg-white hover:shadow-sm hover:text-violet-600'
                }`
              }
            >
              <div className="mr-3 transition-transform group-hover:scale-110">{item.icon}</div>
              <span className="font-semibold text-sm">{item.label}</span>
            </NavLink>
          ))}

          {/* Opciones de Administración (Admin) */}
          {usuarioActual?.rol === 'admin' && (
            <div className="mt-8 pt-6 border-t border-slate-200/50">
              <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Administración</p>
              
              <NavLink
                to="/roles"
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'text-slate-500 hover:bg-amber-50 hover:text-amber-600'
                  }`
                }
              >
                <div className="mr-3 transition-transform group-hover:scale-110"><Shield size={20} /></div>
                <span className="font-semibold text-sm">Roles y Permisos</span>
              </NavLink>

              <NavLink
                to="/personal"
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 mt-1 rounded-xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'text-slate-500 hover:bg-amber-50 hover:text-amber-600'
                  }`
                }
              >
                <div className="mr-3 transition-transform group-hover:scale-110"><UsersRound size={20} /></div>
                <span className="font-semibold text-sm">Personal</span>
              </NavLink>

              <NavLink
                to="/configuracion"
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 mt-1 rounded-xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'text-slate-500 hover:bg-amber-50 hover:text-amber-600'
                  }`
                }
              >
                <div className="mr-3 transition-transform group-hover:scale-110"><Settings size={20} /></div>
                <span className="font-semibold text-sm">Ajustes de Clínica</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 mt-auto relative z-10">
          <div className="bg-white/80 p-4 rounded-2xl shadow-sm border border-slate-100 backdrop-blur-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-md uppercase">
                {usuarioActual?.nombre ? usuarioActual.nombre.charAt(0) : 'U'}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-bold text-slate-800 truncate">{usuarioActual?.nombre}</p>
                <p className="text-xs text-slate-400 capitalize">{usuarioActual?.rol}</p>
              </div>
            </div>
            <Link 
              to="/perfil"
              className="mt-4 w-full flex items-center justify-center py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-violet-600 rounded-lg transition-colors cursor-pointer"
            >
              <Settings size={14} className="mr-2" />
              Mi Perfil
            </Link>
            <button 
              onClick={handleLogout}
              className="mt-1 w-full flex items-center justify-center py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut size={14} className="mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative z-0 pb-20">
        <div className="p-8 md:p-12 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
