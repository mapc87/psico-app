import React, { useState, useEffect } from 'react';
import { X, Sparkles, Copy, Check } from 'lucide-react';
import { generarInterpretacionPsicometrica } from '../../services/ai/gemini';
import type { EvaluacionPaciente } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  evaluacion: EvaluacionPaciente | null;
  pacienteNombre: string;
  pacienteEdad: number;
}

export default function ModalAnalisisIA({ isOpen, onClose, evaluacion, pacienteNombre, pacienteEdad }: Props) {
  const [loading, setLoading] = useState(true);
  const [analisis, setAnalisis] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && evaluacion) {
      generarAnalisis();
    }
  }, [isOpen, evaluacion]);

  const generarAnalisis = async () => {
    setLoading(true);
    setError('');
    setAnalisis('');
    setCopied(false);

    try {
      const resultado = await generarInterpretacionPsicometrica(
        evaluacion?.plantilla?.titulo || 'Prueba Psicométrica',
        evaluacion!.puntaje_total,
        evaluacion!.interpretacion || '',
        pacienteNombre,
        pacienteEdad
      );
      setAnalisis(resultado);
    } catch (err: any) {
      setError(err.message || 'Error al generar el análisis. Verifica tu API Key.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(analisis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !evaluacion) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-violet-50 to-fuchsia-50">
          <div className="flex items-center text-slate-800">
            <div className="w-10 h-10 bg-white text-fuchsia-600 rounded-xl shadow-sm flex items-center justify-center mr-3">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-fuchsia-600">
                Análisis de Resultados con IA
              </h2>
              <p className="text-sm text-slate-600 font-medium mt-0.5">{evaluacion.plantilla?.titulo}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-fuchsia-500 border-t-transparent animate-spin"></div>
                <Sparkles size={24} className="text-fuchsia-500 animate-pulse" />
              </div>
              <p className="text-lg font-bold text-slate-700">Analizando resultados...</p>
              <p className="text-sm text-slate-500 mt-2 text-center max-w-sm">Gemini está redactando una interpretación narrativa detallada y clínica para el paciente.</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100">
              <p className="font-bold mb-2">Error de Inteligencia Artificial</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={generarAnalisis}
                className="mt-4 px-4 py-2 bg-rose-600 text-white text-sm font-bold rounded-lg hover:bg-rose-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{analisis}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
            <p className="text-xs text-slate-400 font-medium">✨ Generado por Google Gemini</p>
            <button 
              onClick={handleCopy}
              className={`flex items-center px-6 py-2.5 rounded-xl font-bold transition-all ${
                copied 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-slate-800 text-white hover:bg-slate-900 shadow-md'
              }`}
            >
              {copied ? (
                <>
                  <Check size={18} className="mr-2" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy size={18} className="mr-2" />
                  Copiar al Portapapeles
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
