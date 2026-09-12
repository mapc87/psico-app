import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { Calendar, ClipboardList, FileText, Loader2 } from 'lucide-react';
import type { Cita, TareaPaciente, ArchivoPaciente } from '../../types';

export default function PortalDashboard() {
  const patientStr = localStorage.getItem('portalPaciente');
  const patient = patientStr ? JSON.parse(patientStr) : null;
  
  const [citas, setCitas] = useState<Cita[]>([]);
  const [tareas, setTareas] = useState<TareaPaciente[]>([]);
  const [archivos, setArchivos] = useState<ArchivoPaciente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patient) {
      fetchDashboardData();
    }
  }, [patient?.id]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Obtener próximas citas
      const { data: citasData } = await supabase
        .from('citas')
        .select('*')
        .eq('paciente_id', patient.id)
        .eq('estado', 'programada')
        .gte('fecha_hora', new Date().toISOString())
        .order('fecha_hora', { ascending: true })
        .limit(3);
        
      if (citasData) setCitas(citasData);

      // 2. Obtener tareas pendientes
      const { data: tareasData } = await supabase
        .from('tareas_paciente')
        .select('*')
        .eq('paciente_id', patient.id)
        .eq('estado', 'pendiente');
        
      if (tareasData) setTareas(tareasData);

      // 3. Obtener archivos
      const { data: archivosData } = await supabase
        .from('archivos_paciente')
        .select('*')
        .eq('paciente_id', patient.id)
        .order('fecha_subida', { ascending: false })
        .limit(5);
        
      if (archivosData) setArchivos(archivosData);
      
    } catch (error) {
      console.error("Error al cargar datos del portal:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">¡Hola, {patient.nombre.split(' ')[0]}!</h1>
        <p className="text-violet-100">Bienvenido a tu portal de paciente. Aquí puedes revisar tu progreso.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Próximas Citas */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
              <Calendar size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Próximas Citas</h2>
          </div>
          
          {citas.length === 0 ? (
            <p className="text-slate-500 text-sm">No tienes citas programadas próximamente.</p>
          ) : (
            <div className="space-y-4">
              {citas.map(cita => (
                <div key={cita.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="font-bold text-slate-800">
                    {new Date(cita.fecha_hora).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    {cita.modalidad === 'virtual' ? 'Videoconsulta' : 'Presencial'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tareas Pendientes */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3">
              <ClipboardList size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Tareas Pendientes</h2>
          </div>
          
          {tareas.length === 0 ? (
            <p className="text-slate-500 text-sm">¡Al día! No tienes tareas asignadas.</p>
          ) : (
            <div className="space-y-4">
              {tareas.map(tarea => (
                <div key={tarea.id} className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="font-bold text-slate-800">{tarea.titulo}</p>
                  {tarea.descripcion && (
                    <p className="text-sm text-slate-600 mt-1">{tarea.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Archivos y Recursos */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3">
              <FileText size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Recursos</h2>
          </div>
          
          {archivos.length === 0 ? (
            <p className="text-slate-500 text-sm">Aún no hay archivos compartidos contigo.</p>
          ) : (
            <div className="space-y-4">
              {archivos.map(archivo => (
                <div key={archivo.id} className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <FileText className="text-slate-400 mr-3" size={20} />
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium text-sm text-slate-800 truncate">{archivo.nombre_original}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
