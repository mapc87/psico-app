import React, { useEffect, useState } from 'react';
import { Users, Calendar, Activity, UserPlus, CalendarPlus, ChevronRight, Cake, Clock, Building2, ClipboardList, BrainCircuit, ClipboardCheck, FileEdit, UserMinus } from 'lucide-react';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import type { Cita, Paciente, Clinica, EvaluacionPaciente, NotaClinica } from '../types';

export default function Dashboard() {
  const { usuarioActual } = useAuth();
  
  // Estados para la clínica médica
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionPaciente[]>([]);
  const [notasRecientes, setNotasRecientes] = useState<NotaClinica[]>([]);
  const [permisos, setPermisos] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados para SuperAdmin
  const [clinicas, setClinicas] = useState<Clinica[]>([]);

  useEffect(() => {
    if (!usuarioActual) return;

    const fetchData = async () => {
      setLoading(true);

      if (usuarioActual.rol === 'superadmin') {
        const { data } = await supabase.from('clinicas').select('*').order('created_at', { ascending: false });
        if (data) setClinicas(data as Clinica[]);
      } else {
        if (usuarioActual.rol === 'personal' && usuarioActual.rol_id) {
          const { data: rolData } = await supabase.from('roles').select('permisos').eq('id', usuarioActual.rol_id).single();
          if (rolData) setPermisos(rolData.permisos);
        } else {
          setPermisos({
            verAgenda: true, verPacientes: true, verResumen: true, verCitas: true,
            verExamenes: true, verSignos: true, verHistorial: true, verDiagnosticos: true, verMedicamentos: true
          });
        }

        const hace30Dias = new Date();
        hace30Dias.setDate(hace30Dias.getDate() - 30);
        
        const hace7Dias = new Date();
        hace7Dias.setDate(hace7Dias.getDate() - 7);

        const [pacientesRes, citasRes, evalRes, notasRes] = await Promise.all([
          supabase.from('pacientes').select('*').eq('estado', 'activo'),
          supabase.from('citas').select('*').gte('fecha_hora', hace30Dias.toISOString()),
          supabase.from('evaluaciones_pacientes').select('*, plantilla:plantilla_id(*)').eq('estado', 'pendiente').order('fecha', { ascending: false }).limit(5),
          supabase.from('notas_clinicas').select('*').gte('fecha', hace7Dias.toISOString())
        ]);

        if (pacientesRes.data) setPacientes(pacientesRes.data as Paciente[]);
        if (citasRes.data) setCitas(citasRes.data as Cita[]);
        if (evalRes.data) setEvaluaciones(evalRes.data as EvaluacionPaciente[]);
        if (notasRes.data) setNotasRecientes(notasRes.data as NotaClinica[]);
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

  // Agenda de hoy
  const citasHoy = citas.filter(cita => {
    const fechaCita = new Date(cita.fecha_hora);
    return fechaCita >= hoy && fechaCita < mañana && cita.estado !== 'cancelada';
  }).sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime());

  const citasProximas = citas.filter(cita => {
    const fechaCita = new Date(cita.fecha_hora);
    return fechaCita >= hoy && cita.estado !== 'cancelada';
  });

  const obtenerSaludo = () => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return 'Buenos días';
    if (hora >= 12 && hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // --- LÓGICA DE VALOR CLÍNICO ---

  // 1. Cumpleaños Próximos (Próximos 7 días)
  const cumpleañosProximos = pacientes.filter(p => {
    if (!p.fecha_nacimiento) return false;
    try {
      const [year, month, day] = p.fecha_nacimiento.split('-');
      const fechaNac = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const cumpleEsteAno = new Date(hoy.getFullYear(), fechaNac.getMonth(), fechaNac.getDate());
      const diferenciaDias = Math.floor((cumpleEsteAno.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      
      const cumpleProximoAno = new Date(hoy.getFullYear() + 1, fechaNac.getMonth(), fechaNac.getDate());
      const diffProximo = Math.floor((cumpleProximoAno.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      
      return (diferenciaDias >= 0 && diferenciaDias <= 7) || (diffProximo >= 0 && diffProximo <= 7);
    } catch {
      return false;
    }
  });

  // 2. Notas Clínicas Pendientes
  const ahora = new Date();
  const citasPasadasRecientes = citas.filter(cita => {
    const fechaCita = new Date(cita.fecha_hora);
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    return fechaCita < ahora && fechaCita >= hace7Dias && cita.estado !== 'cancelada';
  });

  const notasPendientes = citasPasadasRecientes.filter(cita => {
    const tieneNota = notasRecientes.some(nota => nota.paciente_id === cita.paciente_id && new Date(nota.fecha) >= new Date(cita.fecha_hora));
    return !tieneNota;
  });
  
  const pacientesConNotasPendientes = Array.from(new Set(notasPendientes.map(c => c.paciente_id))).map(id => {
    return citasPasadasRecientes.find(c => c.paciente_id === id);
  }).filter(Boolean) as Cita[];

  // 3. Riesgo de Abandono (Más de 30 días sin cita y sin citas futuras)
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);
  
  const pacientesRiesgo = pacientes.filter(p => {
    const citasPaciente = citas.filter(c => c.paciente_id === p.id && c.estado !== 'cancelada');
    if (citasPaciente.length === 0) return false; 
    
    const citasFuturas = citasPaciente.filter(c => new Date(c.fecha_hora) >= hoy);
    if (citasFuturas.length > 0) return false; 

    const citasPasadas = citasPaciente.filter(c => new Date(c.fecha_hora) < hoy).sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());
    
    if (citasPasadas.length > 0) {
      const ultimaCita = new Date(citasPasadas[0].fecha_hora);
      return ultimaCita < hace30Dias;
    }
    return false;
  }).slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Saludo Personalizado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            {obtenerSaludo()}, {usuarioActual?.nombre.split(' ')[0]}
          </h1>
          <p className="text-slate-500 font-medium mt-1">Este es tu resumen clínico y operativo de hoy.</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          {puedeVerPacientes && (
            <Link to="/pacientes/nuevo" className="flex justify-center items-center px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 font-bold rounded-xl shadow-sm transition-all duration-300 w-full sm:w-auto">
              <UserPlus size={18} className="mr-2" />
              Nuevo Paciente
            </Link>
          )}
          {puedeVerAgenda && (
            <Link to="/agenda" className="flex justify-center items-center px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md shadow-violet-500/20 transition-all duration-300 w-full sm:w-auto">
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
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pacientes Activos</p>
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
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Próximas Agendadas</p>
              <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{citasProximas.length}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* COLUMNA CENTRAL: AGENDA Y ALERTAS GRANDES */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Agenda del Día */}
          {puedeVerAgenda && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100/50 flex justify-between items-center bg-gradient-to-r from-violet-50/50 to-transparent">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <Clock className="mr-2 text-violet-500" size={20} />
                  Agenda de Hoy
                </h3>
                <Link to="/agenda" className="text-sm font-semibold text-violet-600 hover:text-violet-700 flex items-center">
                  Ver calendario completo <ChevronRight size={16} />
                </Link>
              </div>
              <div className="p-4 max-h-[350px] overflow-y-auto custom-scrollbar">
                {citasHoy.length > 0 ? (
                  <div className="space-y-3">
                    {citasHoy.map(cita => {
                      const paciente = pacientes.find(p => p.id === cita.paciente_id);
                      return (
                        <div key={cita.id} className="flex items-center p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-slate-100 hover:border-violet-200 hover:shadow-sm group">
                          <div className="w-16 text-center mr-3 border-r border-slate-200 pr-3">
                            <p className="text-lg font-extrabold text-slate-700">
                              {new Date(cita.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-800 text-base">{paciente?.nombre || 'Paciente Desconocido'}</p>
                            <p className="text-xs text-slate-500 flex items-center mt-0.5">
                              {cita.modalidad === 'virtual' ? <Activity size={12} className="mr-1 text-blue-500"/> : <Users size={12} className="mr-1 text-emerald-500"/>}
                              {cita.motivo || 'Sesión programada'}
                            </p>
                          </div>
                          {puedeVerPacientes && (
                            <Link to={`/pacientes/${cita.paciente_id}`} className="p-2 bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white rounded-xl transition-all shadow-sm flex items-center opacity-0 group-hover:opacity-100">
                              <ChevronRight size={16} />
                            </Link>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar size={28} className="text-slate-300" />
                    </div>
                    <p className="text-lg font-bold text-slate-500">No hay citas para hoy</p>
                    <p className="text-slate-400 text-xs mt-1">Tu agenda está libre por el resto del día.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* COLUMNA DERECHA: ALERTAS Y WIDGETS */}
        <div className="space-y-8">

          {/* Riesgo de Abandono */}
          {puedeVerPacientes && (
            <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100 overflow-hidden">
               <div className="p-5 border-b border-rose-100/50 flex justify-between items-center">
                <h3 className="text-base font-bold text-rose-800 flex items-center">
                  <UserMinus className="mr-2 text-rose-500" size={18} />
                  Riesgo de Abandono
                </h3>
              </div>
              <div className="p-5">
                <p className="text-xs text-rose-600 mb-4 font-medium">Más de 30 días sin citas futuras.</p>
                {pacientesRiesgo.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {pacientesRiesgo.map(paciente => (
                      <Link key={paciente.id} to={`/pacientes/${paciente.id}`} className="flex items-center p-3 bg-white/60 hover:bg-white rounded-xl border border-rose-100/50 transition-all group">
                         <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center font-bold mr-3 text-sm shrink-0">
                           {paciente.nombre.charAt(0)}
                         </div>
                         <div className="flex-1 truncate">
                           <p className="font-bold text-slate-800 text-sm truncate">{paciente.nombre}</p>
                         </div>
                         <ChevronRight size={16} className="text-rose-300 group-hover:text-rose-500 transition-colors shrink-0 ml-1" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <ClipboardCheck size={20} className="mx-auto text-emerald-300 mb-2" />
                    <p className="text-xs text-emerald-600 font-medium">¡Todos al día!</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Cumpleaños Próximos */}
          {puedeVerPacientes && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
               <div className="p-5 border-b border-slate-100/50 bg-amber-50/30">
                <h3 className="text-base font-bold text-amber-700 flex items-center">
                  <Cake className="mr-2 text-amber-500" size={18} />
                  Cumpleaños (Próx. 7 días)
                </h3>
              </div>
              <div className="p-5">
                {cumpleañosProximos.length > 0 ? (
                  <div className="space-y-3">
                    {cumpleañosProximos.map(paciente => (
                      <div key={paciente.id} className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{paciente.nombre}</p>
                          <p className="text-xs text-amber-600">{new Date(paciente.fecha_nacimiento!).toLocaleDateString('es-ES', { month: 'long', day: 'numeric'})}</p>
                        </div>
                        <Link to={`/pacientes/${paciente.id}`} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors">
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">No hay cumpleaños cercanos.</p>
                )}
              </div>
            </div>
          )}

          {/* Notas Pendientes */}
          {puedeVerPacientes && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
               <div className="p-5 border-b border-slate-100/50 bg-blue-50/30">
                <h3 className="text-base font-bold text-blue-700 flex items-center">
                  <FileEdit className="mr-2 text-blue-500" size={18} />
                  Notas Pendientes
                </h3>
              </div>
              <div className="p-5">
                {pacientesConNotasPendientes.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 mb-3">Expedientes sin actualizar tras sesiones recientes:</p>
                    {pacientesConNotasPendientes.map(cita => {
                      const paciente = pacientes.find(p => p.id === cita.paciente_id);
                      return (
                        <div key={cita.id} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                          <div className="truncate pr-3">
                            <p className="font-bold text-slate-800 text-sm truncate">{paciente?.nombre}</p>
                            <p className="text-xs text-blue-600 truncate">Cita: {new Date(cita.fecha_hora).toLocaleDateString()}</p>
                          </div>
                          <Link to={`/pacientes/${cita.paciente_id}`} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors shrink-0">
                            <FileEdit size={16} />
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <ClipboardCheck size={24} className="mx-auto text-blue-200 mb-2" />
                    <p className="text-sm font-semibold text-blue-600/70">¡Todas tus notas están al día!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Evaluaciones Pendientes */}
          {puedeVerPacientes && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100/50 bg-indigo-50/30">
                <h3 className="text-base font-bold text-indigo-700 flex items-center">
                  <ClipboardList className="mr-2 text-indigo-500" size={18} />
                  Evaluaciones Pendientes
                </h3>
              </div>
              <div className="p-5">
                {evaluaciones.length > 0 ? (
                  <div className="space-y-3">
                    {evaluaciones.map(evaluacion => {
                      const paciente = pacientes.find(p => p.id === evaluacion.paciente_id);
                      return (
                        <div key={evaluacion.id} className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 group">
                          <div className="flex items-center overflow-hidden">
                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mr-3 shrink-0">
                              <BrainCircuit size={14} />
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-slate-800 text-sm truncate">{paciente?.nombre || 'Paciente'}</p>
                              <p className="text-xs text-slate-500 truncate">{evaluacion.plantilla?.titulo}</p>
                            </div>
                          </div>
                          <Link to={`/pacientes/${evaluacion.paciente_id}`} className="ml-2 p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all shrink-0">
                            <ChevronRight size={16} />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm font-semibold text-indigo-600/70">No hay evaluaciones pendientes.</p>
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
