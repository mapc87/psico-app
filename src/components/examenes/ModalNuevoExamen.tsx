import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, ClipboardList, Save } from 'lucide-react';

interface ModalNuevoExamenProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tipoExamen: string, fechaSolicitud: string) => Promise<void>;
  pacienteNombre: string;
}

export default function ModalNuevoExamen({ isOpen, onClose, onSave, pacienteNombre }: ModalNuevoExamenProps) {
  const today = new Date().toISOString().split('T')[0];
  const [tipoExamen, setTipoExamen] = useState('');
  const [fechaSolicitud, setFechaSolicitud] = useState(today);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipoExamen || !fechaSolicitud) return;
    
    setIsSaving(true);
    try {
      await onSave(tipoExamen, fechaSolicitud);
      onClose();
      // Limpiar formulario
      setTipoExamen('');
      setFechaSolicitud(today);
    } catch (error) {
      console.error('Error saving examen:', error);
      alert('Ocurrió un error al guardar la orden de examen.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
          <h3 className="text-xl font-bold text-blue-900 flex items-center">
            <ClipboardList className="mr-2 text-blue-600" size={24} />
            Nueva Orden de Examen
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-6">
            Prescribiendo para: <strong className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">{pacienteNombre}</strong>
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Examen Solicitado</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 pt-3.5 pointer-events-none">
                  <ClipboardList size={18} className="text-slate-400" />
                </div>
                <textarea 
                  required
                  rows={2}
                  className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-300 resize-none text-slate-700"
                  placeholder="Ej. Hemograma completo, Glucosa en ayunas..."
                  value={tipoExamen}
                  onChange={(e) => setTipoExamen(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Fecha de Solicitud</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CalendarIcon size={18} className="text-slate-400" />
                </div>
                <input 
                  type="date" 
                  required
                  className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-300 text-slate-700"
                  value={fechaSolicitud}
                  onChange={(e) => setFechaSolicitud(e.target.value)}
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
                className="flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all duration-300 shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : (
                  <>
                    <Save size={18} className="mr-2" />
                    Crear Orden
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
