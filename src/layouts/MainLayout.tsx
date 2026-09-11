import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase/client';
import { LayoutDashboard, Users, Calendar, LogOut, FileSignature, Shield, Activity, UsersRound, Wallet, Settings, Building2, HelpCircle, ClipboardList, Menu, X, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { APP_MODULES } from '../config/modules';
import type { Permisos } from '../types';
import { useInactivityTimeout } from '../hooks/useInactivityTimeout';
import CentroAyuda from '../components/help/CentroAyuda';

export default function MainLayout() {
  const { usuarioActual, logout } = useAuth();
  const navigate = useNavigate();
  const [permisos, setPermisos] = useState<Permisos | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Inicializar el timeout de inactividad
  useInactivityTimeout();

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
  const mainNavItems: any[] = [];
  const contabilidadNavItems: any[] = [];
  
  if (usuarioActual?.rol === 'superadmin') {
    mainNavItems.push({ icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/dashboard' });
    mainNavItems.push({ icon: <Building2 size={18} />, label: 'Clínicas', path: '/admin/clinicas' });
  } else {
    APP_MODULES.forEach(mod => {
      const tieneAcceso = usuarioActual?.rol === 'admin' || (permisos && permisos[mod.id]);
      if (tieneAcceso && mod.path && mod.icon) {
        const IconComponent = mod.icon;
        const item = { icon: <IconComponent size={18} />, label: mod.label, path: mod.path };
        if (mod.category === 'main') {
          mainNavItems.push(item);
        } else if (mod.category === 'contabilidad') {
          contabilidadNavItems.push(item);
        }
      }
    });
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Overlay para móvil */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 ${isSidebarCollapsed ? 'w-20' : 'w-[260px]'} bg-white/90 backdrop-blur-xl border-r border-slate-100 flex flex-col z-50 transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50/50 to-transparent pointer-events-none"></div>
        
        {/* Toggle Button for Desktop */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden md:flex absolute -right-3 top-8 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-violet-600 hover:border-violet-300 shadow-sm z-50 transition-colors"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`p-6 flex items-center relative z-10 ${isSidebarCollapsed ? 'justify-center px-4' : ''}`}>
          <div className={`w-9 h-9 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0 ${isSidebarCollapsed ? '' : 'mr-3'}`}>
            <Activity className="text-white" size={20} />
          </div>
          {!isSidebarCollapsed && (
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight transition-opacity duration-300">PsicoApp</h1>
          )}
        </div>
        
        <nav className="flex-1 py-2 space-y-0.5 px-3 relative z-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Main Section */}
          {mainNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-xl transition-all duration-300 group relative ${
                  isActive 
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-violet-600'
                }`
              }
              onClick={() => setIsMobileMenuOpen(false)}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <div className={`${isSidebarCollapsed ? '' : 'mr-3'} transition-transform group-hover:scale-110 shrink-0`}>{item.icon}</div>
              {!isSidebarCollapsed && <span className="font-semibold text-sm whitespace-nowrap overflow-hidden">{item.label}</span>}
            </NavLink>
          ))}

          {/* Contabilidad Section */}
          {contabilidadNavItems.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200/50">
              {!isSidebarCollapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contabilidad</p>
              )}
              {contabilidadNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-xl transition-all duration-300 group relative ${
                      isActive 
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-600'
                    }`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <div className={`${isSidebarCollapsed ? '' : 'mr-3'} transition-transform group-hover:scale-110 shrink-0`}>{item.icon}</div>
                  {!isSidebarCollapsed && <span className="font-semibold text-sm whitespace-nowrap overflow-hidden">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          )}

          {/* Opciones de Administración (Admin) */}
          {usuarioActual?.rol === 'admin' && (
            <div className="mt-4 pt-3 border-t border-slate-200/50">
              {!isSidebarCollapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Administración</p>
              )}
              
              <NavLink
                to="/roles"
                className={({ isActive }) =>
                  `flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'text-slate-500 hover:bg-amber-50 hover:text-amber-600'
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}
                title={isSidebarCollapsed ? "Roles y Permisos" : undefined}
              >
                <div className={`${isSidebarCollapsed ? '' : 'mr-3'} transition-transform group-hover:scale-110 shrink-0`}><Shield size={18} /></div>
                {!isSidebarCollapsed && <span className="font-semibold text-sm whitespace-nowrap overflow-hidden">Roles y Permisos</span>}
              </NavLink>

              <NavLink
                to="/personal"
                className={({ isActive }) =>
                  `flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 mt-0.5 rounded-xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'text-slate-500 hover:bg-amber-50 hover:text-amber-600'
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}
                title={isSidebarCollapsed ? "Personal" : undefined}
              >
                <div className={`${isSidebarCollapsed ? '' : 'mr-3'} transition-transform group-hover:scale-110 shrink-0`}><UsersRound size={18} /></div>
                {!isSidebarCollapsed && <span className="font-semibold text-sm whitespace-nowrap overflow-hidden">Personal</span>}
              </NavLink>

              <NavLink
                to="/configuracion"
                className={({ isActive }) =>
                  `flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 mt-0.5 rounded-xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'text-slate-500 hover:bg-amber-50 hover:text-amber-600'
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}
                title={isSidebarCollapsed ? "Ajustes de Clínica" : undefined}
              >
                <div className={`${isSidebarCollapsed ? '' : 'mr-3'} transition-transform group-hover:scale-110 shrink-0`}><Settings size={18} /></div>
                {!isSidebarCollapsed && <span className="font-semibold text-sm whitespace-nowrap overflow-hidden">Ajustes de Clínica</span>}
              </NavLink>
            </div>
          )}
        </nav>

        {/* User Profile Footer */}
        <div className={`p-3 mt-auto relative z-10 ${isSidebarCollapsed ? 'px-2' : ''}`}>
          <div className={`bg-white/80 ${isSidebarCollapsed ? 'p-2' : 'p-3'} rounded-2xl shadow-sm border border-slate-100 backdrop-blur-sm`}>
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 text-sm rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-md uppercase shrink-0">
                {usuarioActual?.nombre ? usuarioActual.nombre.charAt(0) : 'U'}
              </div>
              {!isSidebarCollapsed && (
                <div className="ml-2 overflow-hidden">
                  <p className="text-[13px] font-bold text-slate-800 truncate leading-tight">{usuarioActual?.nombre}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{usuarioActual?.rol}</p>
                </div>
              )}
            </div>
            
            {!isSidebarCollapsed ? (
              <div className="mt-3 flex gap-1 border-t border-slate-100 pt-2">
                <button
                  onClick={() => setIsHelpOpen(true)}
                  className="flex-1 flex flex-col items-center justify-center py-1.5 text-[10px] font-bold text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                  title="Centro de Ayuda"
                >
                  <HelpCircle size={14} className="mb-0.5" />
                  Ayuda
                </button>
                <Link 
                  to="/perfil"
                  className="flex-1 flex flex-col items-center justify-center py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-violet-600 rounded-lg transition-colors cursor-pointer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  title="Mi Perfil"
                >
                  <Settings size={14} className="mb-0.5" />
                  Perfil
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex-1 flex flex-col items-center justify-center py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar Sesión"
                >
                  <LogOut size={14} className="mb-0.5" />
                  Salir
                </button>
              </div>
            ) : (
              <div className="mt-2 space-y-1">
                <button onClick={() => setIsHelpOpen(true)} className="w-full flex justify-center p-1.5 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="Centro de Ayuda">
                  <HelpCircle size={16} />
                </button>
                <Link to="/perfil" className="w-full flex justify-center p-1.5 text-slate-600 hover:bg-slate-50 hover:text-violet-600 rounded-lg transition-colors" title="Mi Perfil">
                  <Settings size={16} />
                </Link>
                <button onClick={handleLogout} className="w-full flex justify-center p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Cerrar Sesión">
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative z-0 pb-20 flex flex-col h-screen">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="ml-3 flex items-center font-bold text-slate-800 text-lg">
            <Activity className="text-violet-600 mr-2" size={20} />
            PsicoApp
          </div>
        </div>

        <div className="p-4 sm:p-8 md:p-12 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* Centro de Ayuda */}
      <CentroAyuda
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        rol={usuarioActual?.rol as 'superadmin' | 'admin' | 'personal' || 'personal'}
        permisos={permisos}
      />
    </div>
  );
}
