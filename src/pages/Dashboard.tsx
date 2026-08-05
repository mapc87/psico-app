import React from 'react';
import { Users, Calendar, Activity, UserPlus, CalendarPlus, ChevronRight, Cake, Clock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db/localDb';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import type { Cita, Paciente } from '../types';

export default function Dashboard() {
  const { usuarioActual } = useAuth();

  // Permisos para empleados
  const rolActual = useLiveQuery(
    () => usuarioActual?.rolId ? db.roles.get(usuarioActual.rolId) : null,
    [usuarioActual?.rolId]
  );
  
  const permisos = rolActual?.permisos;
  const esPersonal = usuarioActual?.rol === 'personal';
  
  const puedeVerPacientes = !esPersonal || permisos?.verPacientes;
  const puedeVerAgenda = !esPersonal || permisos?.verAgenda;

  const medicoIdFiltro = usuarioActual?.rol === 'personal' ? usuarioActual.medicoId : usuarioActual?.id;

  // Consultas
  const pacientes = useLiveQuery(
    () => medicoIdFiltro ? db.pacientes.where('medicoId').equals(medicoIdFiltro).toArray() : [],
    [medicoIdFiltro]
  );

  const citas = useLiveQuery(
    () => medicoIdFiltro ? db.citas.where('medicoId').equals(medicoIdFiltro).toArray() : [],
    [medicoIdFiltro]
  );

  // Cálculos de métricas
  const totalPacientes = pacientes?.length || 0;
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const mañana = new Date(hoy);
  mañana.setDate(mañana.getDate() + 1);

  const citasHoy = citas?.filter(cita => {
    const fechaCita = new Date(cita.fechaHora);
    return fechaCita >= hoy && fechaCita < mañana && cita.estado !== 'cancelada';
  }).sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime()) || [];

  const citasProximas = citas?.filter(cita => {
    const fechaCita = new Date(cita.fechaHora);
    return fechaCita >= hoy && cita.estado !== 'cancelada';
  }) || [];

  // Pacientes Recientes
  const pacientesRecientes = pacientes ? [...pacientes].sort((a, b) => new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime()).slice(0, 4) : [];

  // Cumpleaños del Mes
  const mesActual = new Date().getMonth();
  const cumpleañeros = pacientes?.filter(p => {
    if (!p.fechaNacimiento) return false;
    const nacimiento = new Date(p.fechaNacimiento);
    return nacimiento.getMonth() === mesActual;
  }).sort((a, b) => new Date(a.fechaNacimiento).getDate() - new Date(b.fechaNacimiento).getDate()) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Saludo Personalizado */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            Buenos días, {usuarioActual?.nombre.split(' ')[0]}
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
        {/* Columna Izquierda (Agenda y Pacientes Recientes) */}
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
                      const paciente = pacientes?.find(p => p.id === cita.pacienteId);
                      return (
                        <div key={cita.id} className="flex items-center p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                          <div className="w-16 text-center mr-6">
                            <p className="text-lg font-extrabold text-slate-700">
                              {new Date(cita.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="w-2 h-12 rounded-full bg-violet-200 mr-6 group-hover:bg-violet-400 transition-colors"></div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-800 text-lg">{paciente?.nombre || 'Paciente Desconocido'}</p>
                            <p className="text-sm text-slate-500">{cita.motivo}</p>
                          </div>
                          {puedeVerPacientes && (
                            <Link to={`/pacientes/${cita.pacienteId}`} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-violet-600 hover:border-violet-200 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all">
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
                          <p className="text-xs font-semibold text-slate-400">Ingresado: {new Date(paciente.fechaIngreso).toLocaleDateString()}</p>
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

        {/* Columna Derecha (Cumpleaños y Avisos) */}
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
                            {new Date(paciente.fechaNacimiento).getDate()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{paciente.nombre}</p>
                            <p className="text-xs text-slate-400">{new Date().getFullYear() - new Date(paciente.fechaNacimiento).getFullYear()} años</p>
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

          {/* Quick Tip / Info */}
          <div className="bg-slate-800 text-white rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
            
            <Activity size={32} className="text-violet-400 mb-4" />
            <h4 className="text-lg font-bold mb-2">Mantén tus expedientes al día</h4>
            <p className="text-sm text-slate-300 mb-6 line-clamp-3">Recuerda registrar las notas de evolución y diagnósticos después de cada sesión para llevar un control clínico preciso de tus pacientes.</p>
            
            <button className="text-sm font-bold text-violet-300 hover:text-white transition-colors flex items-center">
              Ir a la documentación <ChevronRight size={16} className="ml-1" />
            </button>
          </div>

        </div>
      </div>
      
    </div>
  );
}
