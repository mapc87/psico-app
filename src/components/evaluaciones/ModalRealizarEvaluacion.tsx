import React, { useState } from 'react';
import { supabase } from '../../services/supabase/client';
import { X, ClipboardCheck, ArrowRight, ArrowLeft, Save } from 'lucide-react';
import type { EvaluacionPlantilla, EvaluacionPaciente } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  plantilla: EvaluacionPlantilla | null;
  pacienteId: string;
  onSuccess: (evaluacion: EvaluacionPaciente) => void;
}

export default function ModalRealizarEvaluacion({ isOpen, onClose, plantilla, pacienteId, onSuccess }: Props) {
  const { usuarioActual } = useAuth();
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !plantilla) return null;

  const preguntas = plantilla.preguntas || [];
  const currentQuestion = preguntas[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === preguntas.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleSelectOption = (preguntaId: string, puntaje: number) => {
    setRespuestas(prev => ({ ...prev, [preguntaId]: puntaje }));
  };

  const calcularResultado = () => {
    let total = 0;
    Object.values(respuestas).forEach(val => total += val);

    let interpretacion = "Sin interpretación";
    for (const escala of plantilla.escalas) {
      if (total >= escala.min && total <= escala.max) {
        interpretacion = escala.interpretacion;
        break;
      }
    }

    return { total, interpretacion };
  };

  const handleSubmit = async () => {
    if (Object.keys(respuestas).length < preguntas.length) {
      alert("Por favor responda todas las preguntas antes de finalizar.");
      return;
    }

    if (!usuarioActual) return;
    setIsSubmitting(true);

    const { total, interpretacion } = calcularResultado();

    const nuevaEvaluacion = {
      clinica_id: usuarioActual.clinica_id,
      paciente_id: pacienteId,
      medico_id: usuarioActual.id,
      plantilla_id: plantilla.id,
      respuestas: respuestas,
      puntaje_total: total,
      interpretacion: interpretacion,
      estado: 'completado'
    };

    const { data, error } = await supabase
      .from('evaluaciones_pacientes')
      .insert([nuevaEvaluacion])
      .select('*')
      .single();

    setIsSubmitting(false);

    if (error) {
      console.error('Error guardando evaluación:', error);
      alert('Hubo un error guardando los resultados.');
    } else if (data) {
      // Adjuntar la plantilla completa para que el UI pueda renderizar el título sin hacer otro fetch inmediatamente
      const evaluacionCompleta: EvaluacionPaciente = {
        ...data,
        plantilla: plantilla
      } as EvaluacionPaciente;
      
      onSuccess(evaluacionCompleta);
    }
  };

  const progressPercentage = ((currentQuestionIndex) / preguntas.length) * 100;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 relative">
          {/* Progress Bar Background */}
          <div className="absolute bottom-0 left-0 h-1 bg-slate-200 w-full"></div>
          {/* Progress Bar Fill */}
          <div 
            className="absolute bottom-0 left-0 h-1 bg-violet-600 transition-all duration-300 ease-out" 
            style={{ width: `${progressPercentage}%` }}
          ></div>

          <div className="flex items-center text-slate-800">
            <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mr-3">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{plantilla.titulo}</h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                Pregunta {currentQuestionIndex + 1} de {preguntas.length}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 bg-slate-50/30">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-800 leading-tight">
              {currentQuestion.texto}
            </h3>
          </div>

          <div className="space-y-3">
            {currentQuestion.opciones.map((opcion, idx) => {
              const isSelected = respuestas[currentQuestion.id] === opcion.puntaje;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(currentQuestion.id, opcion.puntaje)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ${
                    isSelected 
                      ? 'border-violet-600 bg-violet-50 text-violet-900 shadow-md' 
                      : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-slate-50'
                  }`}
                >
                  <span className={`font-semibold text-lg ${isSelected ? 'text-violet-700' : ''}`}>
                    {opcion.texto}
                  </span>
                  
                  {/* Radio button visual */}
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-violet-600' : 'border-slate-300 group-hover:border-violet-400'
                  }`}>
                    {isSelected && <div className="w-3 h-3 bg-violet-600 rounded-full"></div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            disabled={isFirstQuestion}
            className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              isFirstQuestion 
                ? 'text-slate-300 cursor-not-allowed' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft size={16} className="mr-2" />
            Anterior
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(respuestas).length < preguntas.length}
              className={`flex items-center px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${
                isSubmitting || Object.keys(respuestas).length < preguntas.length
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-violet-500/30'
              }`}
            >
              {isSubmitting ? 'Guardando...' : 'Finalizar y Calcular'}
              <Save size={16} className="ml-2" />
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              disabled={respuestas[currentQuestion.id] === undefined}
              className={`flex items-center px-6 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                respuestas[currentQuestion.id] === undefined
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
              }`}
            >
              Siguiente
              <ArrowRight size={16} className="ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
