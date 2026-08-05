import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, FileText, Save } from 'lucide-react';

interface ModalNuevaCitaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fechaHora: string, motivo: string, pacienteId?: number) => Promise<void>;
  pacienteNombre?: string;
  pacientes?: {id: number, nombre: string}[];
}

export default function ModalNuevaCita({ isOpen, onClose, onSave, pacienteNombre, pacientes }: ModalNuevaCitaProps) {
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');
  const [pacienteIdSeleccionado, setPacienteIdSeleccionado] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha || !hora || !motivo) return;
    if (!pacienteNombre && !pacienteIdSeleccionado) {
      alert('Por favor selecciona un paciente.');
      return;
    }
    
    setIsSaving(true);
    try {
      // Combinar fecha y hora en formato ISO
      const fechaHora = new Date(`${fecha}T${hora}`).toISOString();
      await onSave(fechaHora, motivo, pacienteIdSeleccionado ? Number(pacienteIdSeleccionado) : undefined);
      onClose();
      // Limpiar formulario
      setFecha('');
      setHora('');
      setMotivo('');
      setPacienteIdSeleccionado('');
    } catch (error) {
      console.error('Error saving cita:', error);
      alert('Ocurrió un error al guardar la cita.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-800">Programar Cita</h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {pacienteNombre ? (
            <p className="text-sm text-slate-500 mb-6">
              Agendando cita para: <strong className="text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">{pacienteNombre}</strong>
            </p>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-600 mb-2">Seleccionar Paciente</label>
              <select
                required
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 text-slate-700"
                value={pacienteIdSeleccionado}
                onChange={(e) => setPacienteIdSeleccionado(e.target.value)}
              >
                <option value="">Seleccione un paciente...</option>
                {pacientes?.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Fecha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CalendarIcon size={18} className="text-slate-400" />
                </div>
                <input 
                  type="date" 
                  required
                  min={today}
                  className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 text-slate-700"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Hora</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Clock size={18} className="text-slate-400" />
                </div>
                <input 
                  type="time" 
                  required
                  className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 text-slate-700"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Motivo de la Cita</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 pt-3.5 pointer-events-none">
                  <FileText size={18} className="text-slate-400" />
                </div>
                <textarea 
                  required
                  rows={2}
                  className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 resize-none text-slate-700"
                  placeholder="Ej. Revisión mensual, Terapia cognitivo-conductual..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSaving}
                className="flex items-center px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-all duration-300 shadow-md shadow-violet-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : (
                  <>
                    <Save size={18} className="mr-2" />
                    Agendar Cita
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
