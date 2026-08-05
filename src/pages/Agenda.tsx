import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, Plus } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db/localDb';
import { useAuth } from '../context/AuthContext';
import ModalNuevaCita from '../components/citas/ModalNuevaCita';
import type { Cita, Paciente } from '../types';

interface CitaConPaciente extends Cita {
  paciente?: Paciente;
}

export default function Agenda() {
  const { usuarioActual } = useAuth();
  
  // Obtener citas del médico actual
  const citasDb = useLiveQuery(
    () => {
      if (!usuarioActual?.id) return [];
      return db.citas.where('medicoId').equals(usuarioActual.id).toArray();
    },
    [usuarioActual?.id]
  );
  
  // Obtener pacientes para cruzar datos
  const pacientesDb = useLiveQuery(
    () => {
      if (!usuarioActual?.id) return [];
      return db.pacientes.where('medicoId').equals(usuarioActual.id).toArray();
    },
    [usuarioActual?.id]
  );

  const [citasHoy, setCitasHoy] = useState<CitaConPaciente[]>([]);
  const [citasProximas, setCitasProximas] = useState<CitaConPaciente[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (citasDb && pacientesDb) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);

      const cruzadas: CitaConPaciente[] = citasDb.map(cita => ({
        ...cita,
        paciente: pacientesDb.find(p => p.id === cita.pacienteId)
      }));

      // Separar por fecha y ordenar por hora
      const hoyCitas = cruzadas.filter(c => {
        const fechaCita = new Date(c.fechaHora);
        return fechaCita >= hoy && fechaCita < manana;
      }).sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());

      const proximasCitas = cruzadas.filter(c => {
        const fechaCita = new Date(c.fechaHora);
        return fechaCita >= manana;
      }).sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());

      setCitasHoy(hoyCitas);
      setCitasProximas(proximasCitas);
    }
  }, [citasDb, pacientesDb]);

  const cambiarEstadoCita = async (citaId: number, nuevoEstado: 'completada' | 'cancelada') => {
    try {
      await db.citas.update(citaId, { estado: nuevoEstado });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  const handleSaveCita = async (fechaHora: string, motivo: string, pacienteId?: number) => {
    if (!usuarioActual || !pacienteId) return;
    try {
      await db.citas.add({
        pacienteId: pacienteId,
        medicoId: usuarioActual.id,
        fechaHora,
        motivo,
        estado: 'programada'
      });
    } catch (error) {
      console.error('Error al guardar nueva cita:', error);
      throw error;
    }
  };

  const renderTarjetaCita = (cita: CitaConPaciente, destacada: boolean = false) => {
    const isPasada = new Date(cita.fechaHora) < new Date() && cita.estado === 'programada';
    
    return (
      <div 
        key={cita.id} 
        className={`bg-white p-6 rounded-2xl border transition-all duration-300 ${
          destacada 
            ? 'shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-violet-100/50 hover:shadow-[0_8px_30px_rgb(139,92,246,0.12)]' 
            : 'shadow-sm border-slate-100 hover:shadow-md'
        } ${cita.estado === 'cancelada' ? 'opacity-50' : ''}`}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center text-violet-600 font-bold">
            <Clock size={destacada ? 20 : 16} className="mr-2" />
            <span className={destacada ? 'text-lg' : 'text-md'}>
              {new Date(cita.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
            cita.estado === 'programada' 
              ? isPasada ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700' 
              : cita.estado === 'completada' ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-rose-100 text-rose-700'
          }`}>
            {isPasada && cita.estado === 'programada' ? 'Atrasada' : cita.estado}
          </span>
        </div>
        
        <h4 className={`font-extrabold text-slate-800 flex items-center mb-1 ${destacada ? 'text-xl' : 'text-lg'}`}>
          <User size={18} className="mr-2 text-slate-400" />
          {cita.paciente?.nombre || 'Paciente Desconocido'}
        </h4>
        <p className="text-slate-500 font-medium mb-6">{cita.motivo}</p>

        {cita.estado === 'programada' && (
          <div className="flex space-x-3 pt-4 border-t border-slate-50">
            <button 
              onClick={() => cita.id && cambiarEstadoCita(cita.id, 'completada')}
              className="flex-1 flex justify-center items-center py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold rounded-xl transition-colors cursor-pointer"
            >
              <CheckCircle size={18} className="mr-2" />
              Completar
            </button>
            <button 
              onClick={() => cita.id && cambiarEstadoCita(cita.id, 'cancelada')}
              className="flex items-center justify-center p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl transition-colors cursor-pointer"
              title="Cancelar Cita"
            >
              <XCircle size={18} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center">
            <Calendar className="mr-3 text-violet-600" size={32} />
            Agenda Clínica
          </h2>
          <p className="text-slate-500 mt-1 ml-11">Control de tus citas programadas</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-all duration-300 shadow-md shadow-violet-500/20 cursor-pointer"
        >
          <Plus size={20} className="mr-2" />
          Nueva Cita
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Hoy */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2">
            Citas de Hoy <span className="text-sm font-medium text-slate-400 ml-2">({new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })})</span>
          </h3>
          
          {citasHoy.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {citasHoy.map(cita => renderTarjetaCita(cita, true))}
            </div>
          ) : (
            <div className="p-12 bg-white/50 border border-slate-100 border-dashed rounded-3xl text-center text-slate-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-bold text-slate-500">No hay citas programadas para hoy</p>
              <p className="text-sm">Puedes descansar o programar nuevas citas desde el expediente del paciente.</p>
            </div>
          )}
        </div>

        {/* Columna Próximas */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2">
            Próximos Días
          </h3>
          
          {citasProximas.length > 0 ? (
            <div className="space-y-4">
              {citasProximas.map(cita => (
                <div key={cita.id} className="relative pl-4 border-l-4 border-violet-200">
                  <div className="absolute -left-1.5 top-2 w-2 h-2 bg-violet-500 rounded-full"></div>
                  <p className="text-xs font-bold text-violet-600 mb-1 uppercase tracking-wider">
                    {new Date(cita.fechaHora).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                  {renderTarjetaCita(cita)}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-slate-50/50 rounded-2xl text-center text-slate-400 text-sm border border-slate-100">
              No hay citas programadas para el futuro.
            </div>
          )}
        </div>

      </div>

      <ModalNuevaCita 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCita}
        pacientes={pacientesDb}
      />
    </div>
  );
}
