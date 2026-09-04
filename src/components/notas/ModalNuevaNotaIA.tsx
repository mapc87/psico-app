import React, { useState } from 'react';
import { X, Sparkles, BrainCircuit, FileText } from 'lucide-react';

interface ModalNuevaNotaIAProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (titulo: string, contenido: string, fecha: string) => void;
}

export default function ModalNuevaNotaIA({ isOpen, onClose, onSave }: ModalNuevaNotaIAProps) {
  const [ideas, setIdeas] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNote, setGeneratedNote] = useState('');
  const [titulo, setTitulo] = useState('');
  const [showResult, setShowResult] = useState(false);
  
  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!ideas.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI processing time (mock)
    setTimeout(() => {
      const soapMock = `S: (Subjetivo)
El paciente refiere sentirse ansioso y con dificultades para conciliar el sueño. Menciona que ha tenido problemas laborales recientes que han incrementado su estrés. "Me siento abrumado por las noches".

O: (Objetivo)
Paciente consciente, orientado en tiempo, espacio y persona. Lenguaje coherente y fluido. Se observa inquietud motora leve (movimientos constantes de las manos). Afecto restringido, acorde a ideación ansiosa.

A: (Análisis)
Trastorno de ansiedad generalizada en exacerbación debido a estresores psicosociales agudos (ámbito laboral). Mantiene buen juicio y comprensión de su estado actual.

P: (Plan)
1. Terapia Cognitivo Conductual: Técnicas de relajación y respiración diafragmática.
2. Explorar técnicas de higiene del sueño.
3. Cita de seguimiento en 2 semanas.`;

      setGeneratedNote(soapMock);
      setTitulo(`Evolución ${new Date().toLocaleDateString()}`);
      setIsGenerating(false);
      setShowResult(true);
    }, 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatedNote.trim() || !titulo.trim()) return;
    
    onSave(titulo, generatedNote, new Date().toISOString());
    
    // Reset state for next time
    setIdeas('');
    setGeneratedNote('');
    setTitulo('');
    setShowResult(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-fuchsia-50">
          <div className="flex items-center text-violet-700 font-semibold">
            <BrainCircuit className="mr-2" size={24} />
            <h2>Redactor de Notas con IA</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-white/50 p-1 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {!showResult ? (
            <div className="space-y-6">
              <div className="bg-violet-50 border border-violet-100 p-4 rounded-xl text-sm text-violet-800 flex">
                <Sparkles size={20} className="mr-3 flex-shrink-0 mt-0.5" />
                <p>
                  Escribe ideas sueltas, frases cortas o tu borrador rápido de la sesión. 
                  Nuestra Inteligencia Artificial se encargará de estructurarlo profesionalmente en el 
                  <strong> formato clínico SOAP</strong> en segundos.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Borrador de la Sesión</label>
                <textarea
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 min-h-[250px] resize-none"
                  placeholder="Ej: El paciente llegó muy ansioso. Peleó con su jefe. No está durmiendo bien. Trabajamos técnicas de respiración. Le dejé tarea de escribir diario. Próxima cita en 1 semana."
                  value={ideas}
                  onChange={(e) => setIdeas(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!ideas.trim() || isGenerating}
                  className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 transition-all shadow-lg shadow-violet-600/20 disabled:opacity-70 flex items-center group"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                      Analizando y Redactando...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} className="mr-2 group-hover:animate-pulse" />
                      Estructurar Nota con IA
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-sm text-emerald-800 flex items-center">
                <Sparkles size={20} className="mr-3 text-emerald-600" />
                <p>¡Nota estructurada exitosamente! Puedes editarla si lo deseas antes de guardarla.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Título de la Nota</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 font-semibold"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nota Clínica (Formato SOAP)</label>
                <textarea
                  required
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 min-h-[350px] leading-relaxed"
                  value={generatedNote}
                  onChange={(e) => setGeneratedNote(e.target.value)}
                />
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={() => setShowResult(false)}
                  className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Modificar Borrador Original
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center"
                >
                  <FileText size={18} className="mr-2" />
                  Guardar en Expediente
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
