import React, { useEffect, useState } from 'react';
import { Users, Calendar, Activity, UserPlus, CalendarPlus, ChevronRight, Cake, Clock, Building2 } from 'lucide-react';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import type { Cita, Paciente, Rol, Clinica } from '../types';

export default function Dashboard() {
  const { usuarioActual } = useAuth();
  
  // Estados para la clínica médica
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [permisos, setPermisos] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados para SuperAdmin
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [nuevaClinicaNombre, setNuevaClinicaNombre] = useState('');
  const [nuevoCodigo, setNuevoCodigo] = useState('');

  useEffect(() => {
    if (!usuarioActual) return;

    const fetchData = async () => {
      setLoading(true);

      if (usuarioActual.rol === 'superadmin') {
        // Fetch de clínicas para el superadmin
        const { data } = await supabase.from('clinicas').select('*').order('created_at', { ascending: false });
        if (data) setClinicas(data as Clinica[]);
      } else {
        // Fetch de datos médicos para admins y personal
        
        // 1. Obtener Permisos si es personal
        if (usuarioActual.rol === 'personal' && usuarioActual.rol_id) {
          const { data: rolData } = await supabase.from('roles').select('permisos').eq('id', usuarioActual.rol_id).single();
          if (rolData) setPermisos(rolData.permisos);
        } else {
          // Admin tiene todos los permisos
          setPermisos({
            verAgenda: true, verPacientes: true, verResumen: true, verCitas: true,
            verExamenes: true, verSignos: true, verHistorial: true, verDiagnosticos: true, verMedicamentos: true
          });
        }

        // 2. Cargar Pacientes y Citas
        const [pacientesRes, citasRes] = await Promise.all([
          supabase.from('pacientes').select('*'),
          supabase.from('citas').select('*')
        ]);

        if (pacientesRes.data) setPacientes(pacientesRes.data as Paciente[]);
        if (citasRes.data) setCitas(citasRes.data as Cita[]);
      }

      setLoading(false);
    };

    fetchData();
  }, [usuarioActual]);

  if (loading) {
    return <div className="flex justify-center p-12"><Activity className="animate-spin text-violet-500" size={32} /></div>;
  }

  // =======================================================================
  // VISTA SUPERADMIN (Panel de Organización)
  // =======================================================================



  // La creación de clínicas ahora se hace desde MantenimientoClinicas.tsx

  if (usuarioActual?.rol === 'superadmin') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
              Panel de Organización
            </h1>
            <p className="text-slate-500 font-medium mt-1">Supervisa todas las clínicas de tu SaaS.</p>
          </div>
          <div>
            <Link 
              to="/admin/clinicas"
              className="flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all"
            >
              <Building2 size={18} className="mr-2" />
              Ir al Mantenimiento de Clínicas
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 flex items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mr-5 flex items-center justify-center">
              <Building2 size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Clínicas Activas</p>
              <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{clinicas.length}</p>
            </div>
          </div>
        </div>

        {/* El directorio y creación de clínicas se movió a MantenimientoClinicas.tsx */}
        <div className="bg-emerald-50 rounded-3xl border border-emerald-100 p-8 text-center mt-8">
          <Building2 size={48} className="mx-auto text-emerald-300 mb-4" />
          <h3 className="text-xl font-bold text-emerald-800 mb-2">Módulo de Clínicas Movido</h3>
          <p className="text-emerald-600 mb-6">Para una mejor administración, la creación, edición y suspensión de clínicas ahora tiene su propia sección.</p>
          <Link to="/admin/clinicas" className="inline-block px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors">
            Administrar Clínicas
          </Link>
        </div>
      </div>
    );
  }


  // =======================================================================
  // VISTA CLÍNICA (Doctores y Personal)
  // =======================================================================
  const puedeVerPacientes = permisos?.verPacientes;
  const puedeVerAgenda = permisos?.verAgenda;

  const totalPacientes = pacientes.length;
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const mañana = new Date(hoy);
  mañana.setDate(mañana.getDate() + 1);

  const citasHoy = citas.filter(cita => {
    const fechaCita = new Date(cita.fecha_hora);
    return fechaCita >= hoy && fechaCita < mañana && cita.estado !== 'cancelada';
  }).sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime());

  const citasProximas = citas.filter(cita => {
    const fechaCita = new Date(cita.fecha_hora);
    return fechaCita >= hoy && cita.estado !== 'cancelada';
  });

  const pacientesRecientes = [...pacientes].sort((a, b) => new Date(b.fecha_ingreso).getTime() - new Date(a.fecha_ingreso).getTime()).slice(0, 4);

  const mesActual = new Date().getMonth();
  const cumpleañeros = pacientes.filter(p => {
    if (!p.fecha_nacimiento) return false;
    const nacimiento = new Date(p.fecha_nacimiento);
    return nacimiento.getMonth() === mesActual;
  }).sort((a, b) => {
    if (!a.fecha_nacimiento || !b.fecha_nacimiento) return 0;
    return new Date(a.fecha_nacimiento).getDate() - new Date(b.fecha_nacimiento).getDate();
  });

  const obtenerSaludo = () => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) {
      return 'Buenos días';
    } else if (hora >= 12 && hora < 19) {
      return 'Buenas tardes';
    } else {
      return 'Buenas noches';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Saludo Personalizado */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            {obtenerSaludo()}, {usuarioActual?.nombre.split(' ')[0]}
          </h1>
          <p className="text-slate-500 font-medium mt-1">Aquí tienes el resumen de tu clínica hoy.</p>
        </div>
        <div className="flex space-x-3">
          {puedeVerPacientes && (
            <Link to="/pacientes/nuevo" className="flex items-center px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 font-bold rounded-xl shadow-sm transition-all duration-300">
              <UserPlus size={18} className="mr-2" />
              Nuevo Paciente
            </Link>
          )}
          {puedeVerAgenda && (
            <Link to="/agenda" className="flex items-center px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md shadow-violet-500/20 transition-all duration-300">
              <CalendarPlus size={18} className="mr-2" />
              Agendar Cita
            </Link>
          )}
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {puedeVerPacientes && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 flex items-center hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 mr-5 shadow-inner flex items-center justify-center">
              <Users size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Pacientes</p>
              <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{totalPacientes}</p>
            </div>
          </div>
        )}

        {puedeVerAgenda && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 flex items-center hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 mr-5 shadow-inner flex items-center justify-center">
              <Calendar size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Citas para Hoy</p>
              <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{citasHoy.length}</p>
            </div>
          </div>
        )}

        {puedeVerAgenda && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 flex items-center hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-100 to-fuchsia-50 text-fuchsia-600 mr-5 shadow-inner flex items-center justify-center">
              <Activity size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Próximas (Activas)</p>
              <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{citasProximas.length}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Agenda del Día */}
          {puedeVerAgenda && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100/50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <Clock className="mr-2 text-violet-500" size={20} />
                  Agenda de Hoy
                </h3>
                <Link to="/agenda" className="text-sm font-semibold text-violet-600 hover:text-violet-700 flex items-center">
                  Ver calendario completo <ChevronRight size={16} />
                </Link>
              </div>
              <div className="p-6">
                {citasHoy.length > 0 ? (
                  <div className="space-y-4">
                    {citasHoy.map(cita => {
                      const paciente = pacientes.find(p => p.id === cita.paciente_id);
                      return (
                        <div key={cita.id} className="flex items-center p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                          <div className="w-16 text-center mr-6">
                            <p className="text-lg font-extrabold text-slate-700">
                              {new Date(cita.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="w-2 h-12 rounded-full bg-violet-200 mr-6 group-hover:bg-violet-400 transition-colors"></div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-800 text-lg">{paciente?.nombre || 'Paciente Desconocido'}</p>
                            <p className="text-sm text-slate-500">{cita.motivo}</p>
                          </div>
                          {puedeVerPacientes && (
                            <Link to={`/pacientes/${cita.paciente_id}`} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-violet-600 hover:border-violet-200 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                              <ChevronRight size={20} />
                            </Link>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar size={32} className="text-slate-300" />
                    </div>
                    <p className="text-lg font-bold text-slate-500">No hay citas para hoy</p>
                    <p className="text-slate-400 text-sm mt-1">Tu agenda está libre por el resto del día.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pacientes Recientes */}
          {puedeVerPacientes && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100/50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <Users className="mr-2 text-blue-500" size={20} />
                  Pacientes Recientes
                </h3>
                <Link to="/pacientes" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center">
                  Ver todos <ChevronRight size={16} />
                </Link>
              </div>
              <div className="p-6">
                {pacientesRecientes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pacientesRecientes.map(paciente => (
                      <Link key={paciente.id} to={`/pacientes/${paciente.id}`} className="flex items-center p-4 border border-slate-100 rounded-2xl hover:shadow-md hover:border-blue-100 transition-all bg-white group">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-xl flex items-center justify-center text-blue-600 font-bold text-lg mr-4 group-hover:scale-110 transition-transform">
                          {paciente.nombre.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{paciente.nombre}</p>
                          <p className="text-xs font-semibold text-slate-400">Ingresado: {new Date(paciente.fecha_ingreso).toLocaleDateString()}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-6">No hay pacientes registrados.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          
          {/* Cumpleaños del Mes */}
          {puedeVerPacientes && (
            <div className="bg-gradient-to-b from-fuchsia-50 to-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-fuchsia-100 overflow-hidden">
              <div className="p-6 border-b border-fuchsia-100/50">
                <h3 className="text-lg font-bold text-fuchsia-900 flex items-center">
                  <Cake className="mr-2 text-fuchsia-500" size={20} />
                  Cumpleaños del Mes
                </h3>
              </div>
              <div className="p-6">
                {cumpleañeros.length > 0 ? (
                  <div className="space-y-4">
                    {cumpleañeros.map(paciente => (
                      <div key={paciente.id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-fuchsia-50">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-fuchsia-100 text-fuchsia-600 rounded-full flex items-center justify-center font-bold mr-3">
                            {paciente.fecha_nacimiento && new Date(paciente.fecha_nacimiento).getDate()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{paciente.nombre}</p>
                            <p className="text-xs text-slate-400">{paciente.fecha_nacimiento && (new Date().getFullYear() - new Date(paciente.fecha_nacimiento).getFullYear())} años</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Cake size={32} className="mx-auto text-fuchsia-200 mb-3" />
                    <p className="text-sm font-semibold text-fuchsia-600/70">Ningún cumpleaños este mes.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
