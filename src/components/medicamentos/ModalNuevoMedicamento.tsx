import React, { useState } from 'react';
import { X, Pill, Save, Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';

interface ModalNuevoMedicamentoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nombre: string, dosis: string, frecuencia: string, duracion: string, indicaciones: string, fecha: string) => Promise<void>;
}

export default function ModalNuevoMedicamento({ isOpen, onClose, onSave }: ModalNuevoMedicamentoProps) {
  const today = new Date().toISOString().split('T')[0];
  const [nombre, setNombre] = useState('');
  const [dosis, setDosis] = useState('');
  const [frecuencia, setFrecuencia] = useState('');
  const [duracion, setDuracion] = useState('');
  const [indicaciones, setIndicaciones] = useState('');
  const [fecha, setFecha] = useState(today);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !dosis || !frecuencia || !duracion || !fecha) return;
    
    setIsSaving(true);
    try {
      await onSave(nombre, dosis, frecuencia, duracion, indicaciones, fecha);
      onClose();
      // Limpiar formulario
      setNombre('');
      setDosis('');
      setFrecuencia('');
      setDuracion('');
      setIndicaciones('');
      setFecha(today);
    } catch (error) {
      console.error('Error saving medicamento:', error);
      alert('Ocurrió un error al guardar el medicamento.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50/50">
          <h3 className="text-xl font-bold text-rose-900 flex items-center">
            <Pill className="mr-2 text-rose-600" size={24} />
            Prescribir Medicamento
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
              
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-600 mb-2">Nombre del Fármaco</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Pill size={18} className="text-slate-400" />
                  </div>
                  <input 
                    type="text"
                    required
                    className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all duration-300 text-slate-700 font-medium text-lg"
                    placeholder="Ej. Sertralina, Fluoxetina..."
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Dosis (Concentración)</label>
                <input 
                  type="text"
                  required
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all duration-300 text-slate-700 font-medium"
                  placeholder="Ej. 50 mg, 1 tableta..."
                  value={dosis}
                  onChange={(e) => setDosis(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Frecuencia</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Clock size={18} className="text-slate-400" />
                  </div>
                  <input 
                    type="text"
                    required
                    className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all duration-300 text-slate-700 font-medium"
                    placeholder="Ej. Cada 24 horas (noche)"
                    value={frecuencia}
                    onChange={(e) => setFrecuencia(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Duración del Tratamiento</label>
                <input 
                  type="text"
                  required
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all duration-300 text-slate-700 font-medium"
                  placeholder="Ej. 30 días, Uso continuo..."
                  value={duracion}
                  onChange={(e) => setDuracion(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Fecha de Prescripción</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <CalendarIcon size={18} className="text-slate-400" />
                  </div>
                  <input 
                    type="date" 
                    required
                    className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all duration-300 text-slate-700 font-medium"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Indicaciones Adicionales (Opcional)</label>
              <div className="relative">
                <div className="absolute top-3.5 left-4 pointer-events-none">
                  <AlertCircle size={18} className="text-slate-400" />
                </div>
                <textarea 
                  rows={2}
                  className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all duration-300 resize-none text-slate-700 leading-relaxed"
                  placeholder="Ej. Tomar con las comidas. No suspender abruptamente..."
                  value={indicaciones}
                  onChange={(e) => setIndicaciones(e.target.value)}
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
                className="flex items-center px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold rounded-xl transition-all duration-300 shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : (
                  <>
                    <Save size={18} className="mr-2" />
                    Prescribir
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
