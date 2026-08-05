import React, { useState, useEffect } from 'react';
import { X, Heart, Thermometer, Wind, Scale, Activity, Save } from 'lucide-react';
import type { SignosVitales } from '../../types';

interface ModalNuevoSignoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<SignosVitales, 'id' | 'pacienteId'>) => Promise<void>;
}

export default function ModalNuevoSigno({ isOpen, onClose, onSave }: ModalNuevoSignoProps) {
  const [presionArterial, setPresionArterial] = useState('');
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState('');
  const [saturacionOxigeno, setSaturacionOxigeno] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [peso, setPeso] = useState('');
  const [talla, setTalla] = useState('');
  const [imc, setImc] = useState('0.0');
  const [isSaving, setIsSaving] = useState(false);

  // Autocalcular IMC cuando cambian peso o talla
  useEffect(() => {
    const p = parseFloat(peso);
    const t = parseFloat(talla);
    if (!isNaN(p) && !isNaN(t) && t > 0) {
      const imcCalc = p / (t * t);
      setImc(imcCalc.toFixed(1));
    } else {
      setImc('0.0');
    }
  }, [peso, talla]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        fecha: new Date().toISOString(),
        presionArterial: presionArterial || 'N/A',
        frecuenciaCardiaca: parseFloat(frecuenciaCardiaca) || 0,
        saturacionOxigeno: parseFloat(saturacionOxigeno) || 0,
        temperatura: parseFloat(temperatura) || 0,
        peso: parseFloat(peso) || 0,
        talla: parseFloat(talla) || 0,
        imc: parseFloat(imc) || 0
      });
      
      // Limpiar y cerrar
      setPresionArterial('');
      setFrecuenciaCardiaca('');
      setSaturacionOxigeno('');
      setTemperatura('');
      setPeso('');
      setTalla('');
      setImc('0.0');
      onClose();
    } catch (error) {
      console.error('Error saving signos vitales:', error);
      alert('Error al guardar los signos vitales');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
          <h3 className="text-xl font-bold text-emerald-900 flex items-center">
            <Heart className="mr-2 text-emerald-600" size={24} />
            Nueva Toma de Signos Vitales
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-6">
              {/* Presión Arterial */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Presión Arterial</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Activity size={18} className="text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Ej. 120/80"
                    className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300 text-slate-700 font-medium"
                    value={presionArterial}
                    onChange={(e) => setPresionArterial(e.target.value)}
                  />
                </div>
              </div>

              {/* Frecuencia Cardíaca */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Frecuencia Cardíaca (LPM)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Heart size={18} className="text-slate-400" />
                  </div>
                  <input 
                    type="number" 
                    placeholder="Ej. 75"
                    className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300 text-slate-700 font-medium"
                    value={frecuenciaCardiaca}
                    onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                  />
                </div>
              </div>

              {/* Saturación Oxígeno */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Saturación Oxígeno (%)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Wind size={18} className="text-slate-400" />
                  </div>
                  <input 
                    type="number" 
                    placeholder="Ej. 98"
                    className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300 text-slate-700 font-medium"
                    value={saturacionOxigeno}
                    onChange={(e) => setSaturacionOxigeno(e.target.value)}
                  />
                </div>
              </div>

              {/* Temperatura */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Temperatura (°C)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Thermometer size={18} className="text-slate-400" />
                  </div>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="Ej. 37.0"
                    className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300 text-slate-700 font-medium"
                    value={temperatura}
                    onChange={(e) => setTemperatura(e.target.value)}
                  />
                </div>
              </div>

              {/* Peso */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Peso (kg)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Scale size={18} className="text-slate-400" />
                  </div>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="Ej. 70.5"
                    className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300 text-slate-700 font-medium"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                  />
                </div>
              </div>

              {/* Talla */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Talla (m)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Scale size={18} className="text-slate-400" />
                  </div>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Ej. 1.70"
                    className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300 text-slate-700 font-medium"
                    value={talla}
                    onChange={(e) => setTalla(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* IMC Autocalculado */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">IMC Calculado</span>
                <span className="text-xs text-slate-400">Índice de Masa Corporal</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-700">
                {imc}
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100">
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
                className="flex items-center px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl transition-all duration-300 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : (
                  <>
                    <Save size={18} className="mr-2" />
                    Registrar Toma
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
