import React, { useState } from 'react';
import { X, Activity, Save, Calendar as CalendarIcon, FileText } from 'lucide-react';

interface ModalNuevoDiagnosticoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (enfermedad: string, planTratamiento: string, fecha: string) => Promise<void>;
}

export default function ModalNuevoDiagnostico({ isOpen, onClose, onSave }: ModalNuevoDiagnosticoProps) {
  const today = new Date().toISOString().split('T')[0];
  const [enfermedad, setEnfermedad] = useState('');
  const [planTratamiento, setPlanTratamiento] = useState('');
  const [fecha, setFecha] = useState(today);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enfermedad || !planTratamiento || !fecha) return;
    
    setIsSaving(true);
    try {
      await onSave(enfermedad, planTratamiento, fecha);
      onClose();
      // Limpiar formulario
      setEnfermedad('');
      setPlanTratamiento('');
      setFecha(today);
    } catch (error) {
      console.error('Error saving diagnostico:', error);
      alert('Ocurrió un error al guardar el diagnóstico.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
          <h3 className="text-xl font-bold text-blue-900 flex items-center">
            <Activity className="mr-2 text-blue-600" size={24} />
            Nuevo Diagnóstico
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Patología / Trastorno</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 pt-3.5 pointer-events-none">
                    <Activity size={18} className="text-slate-400" />
                  </div>
                  <input 
                    type="text"
                    required
                    className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-300 text-slate-700 font-medium"
                    placeholder="Ej. Trastorno de Ansiedad..."
                    value={enfermedad}
                    onChange={(e) => setEnfermedad(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Fecha de Diagnóstico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <CalendarIcon size={18} className="text-slate-400" />
                  </div>
                  <input 
                    type="date" 
                    required
                    className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-300 text-slate-700 font-medium"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Plan de Tratamiento y Enfoque</label>
              <div className="relative">
                <div className="absolute top-3.5 left-4 pointer-events-none">
                  <FileText size={18} className="text-slate-400" />
                </div>
                <textarea 
                  required
                  rows={4}
                  className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-300 resize-none text-slate-700 leading-relaxed"
                  placeholder="Describa el plan de tratamiento, sesiones sugeridas, objetivos terapéuticos..."
                  value={planTratamiento}
                  onChange={(e) => setPlanTratamiento(e.target.value)}
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
                    Registrar Diagnóstico
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
