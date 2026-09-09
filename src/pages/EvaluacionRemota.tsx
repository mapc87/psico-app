import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase/client';
import { BrainCircuit, ClipboardCheck, Loader2 } from 'lucide-react';
import type { EvaluacionPaciente, EvaluacionPlantilla } from '../types';

export default function EvaluacionRemota() {
  const { id } = useParams<{ id: string }>();
  const [evaluacion, setEvaluacion] = useState<EvaluacionPaciente | null>(null);
  const [plantilla, setPlantilla] = useState<EvaluacionPlantilla | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    fetchEvaluacion();
  }, [id]);

  const fetchEvaluacion = async () => {
    if (!id) return;
    setLoading(true);
    
    // 1. Obtener la evaluacion pendiente
    const { data: evalData, error: evalError } = await supabase
      .from('evaluaciones_pacientes')
      .select('*')
      .eq('id', id)
      .single();

    if (evalError || !evalData) {
      setLoading(false);
      return;
    }

    setEvaluacion(evalData as EvaluacionPaciente);

    if (evalData.estado === 'completado') {
      setIsDone(true);
      setLoading(false);
      return;
    }

    // 2. Obtener la plantilla
    const { data: planData } = await supabase
      .from('evaluaciones_plantillas')
      .select('*')
      .eq('id', evalData.plantilla_id)
      .single();

    if (planData) {
      setPlantilla(planData as EvaluacionPlantilla);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 size={48} className="animate-spin text-violet-600 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Cargando evaluación...</h2>
      </div>
    );
  }

  if (!evaluacion || !plantilla) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <BrainCircuit size={48} className="text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Enlace no válido</h2>
          <p className="text-slate-600">Esta evaluación no existe o el enlace es incorrecto.</p>
        </div>
      </div>
    );
  }

  if (isDone || evaluacion.estado === 'completado') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ClipboardCheck size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Evaluación Completada!</h2>
          <p className="text-slate-600">Muchas gracias por tu tiempo. Las respuestas han sido enviadas a tu terapeuta.</p>
        </div>
      </div>
    );
  }

  const preguntas = plantilla.preguntas || [];
  const currentQuestion = preguntas[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === preguntas.length - 1;

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

    setIsSubmitting(true);
    const { total, interpretacion } = calcularResultado();

    const { error } = await supabase
      .from('evaluaciones_pacientes')
      .update({
        respuestas: respuestas,
        puntaje_total: total,
        interpretacion: interpretacion,
        estado: 'completado',
        fecha: new Date().toISOString()
      })
      .eq('id', evaluacion.id);

    setIsSubmitting(false);

    if (error) {
      alert('Hubo un error al enviar las respuestas. Por favor intenta de nuevo.');
    } else {
      setIsDone(true);
    }
  };

  const progressPercentage = ((currentQuestionIndex) / preguntas.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-white relative shrink-0">
          <div className="absolute bottom-0 left-0 h-1 bg-slate-100 w-full"></div>
          <div 
            className="absolute bottom-0 left-0 h-1 bg-violet-600 transition-all duration-300 ease-out" 
            style={{ width: `${progressPercentage}%` }}
          ></div>

          <div className="flex items-center text-slate-800">
            <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center mr-4">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{plantilla.titulo}</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Pregunta {currentQuestionIndex + 1} de {preguntas.length}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="mb-10 text-center max-w-xl mx-auto">
            <h3 className="text-3xl font-bold text-slate-800 leading-tight">
              {currentQuestion.texto}
            </h3>
          </div>

          <div className="space-y-4 max-w-xl mx-auto">
            {currentQuestion.opciones.map((opcion, idx) => {
              const isSelected = respuestas[currentQuestion.id] === opcion.puntaje;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(currentQuestion.id, opcion.puntaje)}
                  className={`w-full text-center p-5 rounded-2xl border-2 transition-all duration-200 transform ${
                    isSelected 
                      ? 'border-violet-600 bg-violet-50 text-violet-900 shadow-md scale-[1.02]' 
                      : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-slate-50 hover:scale-[1.01]'
                  }`}
                >
                  <span className="text-lg font-bold">{opcion.texto}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            Anterior
          </button>
          
          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(respuestas).length < preguntas.length}
              className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-600/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando...' : 'Finalizar y Enviar'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(preguntas.length - 1, prev + 1))}
              disabled={respuestas[currentQuestion.id] === undefined}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all disabled:opacity-30"
            >
              Siguiente
            </button>
          )}
        </div>
        
      </div>
    </div>
  );
}
