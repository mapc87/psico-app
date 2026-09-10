import React, { useState } from 'react';
import { X, Plus, Trash2, Save, HelpCircle, GripVertical } from 'lucide-react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../context/AuthContext';
import type { EvaluacionPlantilla, PreguntaEvaluacion, OpcionEvaluacion, EscalaEvaluacion } from '../../types';

interface FormularioPruebaProps {
  plantilla: EvaluacionPlantilla | null;
  onClose: () => void;
  onSave: () => void;
}

export default function FormularioPrueba({ plantilla, onClose, onSave }: FormularioPruebaProps) {
  const { usuarioActual } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const [titulo, setTitulo] = useState(plantilla?.titulo || '');
  const [descripcion, setDescripcion] = useState(plantilla?.descripcion || '');
  const [preguntas, setPreguntas] = useState<PreguntaEvaluacion[]>(
    plantilla?.preguntas && plantilla.preguntas.length > 0
      ? plantilla.preguntas
      : [{ id: 'q_' + Math.random().toString(36).substr(2, 9), texto: '', opciones: [{ texto: '', puntaje: 0 }] }]
  );
  const [escalas, setEscalas] = useState<EscalaEvaluacion[]>(
    plantilla?.escalas && plantilla.escalas.length > 0
      ? plantilla.escalas
      : [{ min: 0, max: 10, interpretacion: '' }]
  );

  // --- Manejo de Preguntas ---
  const addPregunta = () => {
    setPreguntas([
      ...preguntas,
      { id: 'q_' + Math.random().toString(36).substr(2, 9), texto: '', opciones: [{ texto: '', puntaje: 0 }] }
    ]);
  };

  const updatePregunta = (index: number, texto: string) => {
    const newPreguntas = [...preguntas];
    newPreguntas[index].texto = texto;
    setPreguntas(newPreguntas);
  };

  const removePregunta = (index: number) => {
    const newPreguntas = [...preguntas];
    newPreguntas.splice(index, 1);
    setPreguntas(newPreguntas);
  };

  // --- Manejo de Opciones ---
  const addOpcion = (qIndex: number) => {
    const newPreguntas = [...preguntas];
    newPreguntas[qIndex].opciones.push({ texto: '', puntaje: 0 });
    setPreguntas(newPreguntas);
  };

  const updateOpcion = (qIndex: number, oIndex: number, field: 'texto' | 'puntaje', value: string | number) => {
    const newPreguntas = [...preguntas];
    newPreguntas[qIndex].opciones[oIndex] = {
      ...newPreguntas[qIndex].opciones[oIndex],
      [field]: field === 'puntaje' ? Number(value) : value
    };
    setPreguntas(newPreguntas);
  };

  const removeOpcion = (qIndex: number, oIndex: number) => {
    const newPreguntas = [...preguntas];
    newPreguntas[qIndex].opciones.splice(oIndex, 1);
    setPreguntas(newPreguntas);
  };

  // --- Manejo de Escalas ---
  const addEscala = () => {
    setEscalas([...escalas, { min: 0, max: 0, interpretacion: '' }]);
  };

  const updateEscala = (index: number, field: keyof EscalaEvaluacion, value: string | number) => {
    const newEscalas = [...escalas];
    newEscalas[index] = {
      ...newEscalas[index],
      [field]: typeof value === 'string' && field !== 'interpretacion' ? Number(value) : value
    };
    setEscalas(newEscalas);
  };

  const removeEscala = (index: number) => {
    const newEscalas = [...escalas];
    newEscalas.splice(index, 1);
    setEscalas(newEscalas);
  };

  // --- Guardado ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioActual?.clinica_id) return;
    setIsSaving(true);

    const payload = {
      clinica_id: usuarioActual.clinica_id,
      titulo,
      descripcion,
      preguntas,
      escalas
    };

    try {
      if (plantilla?.id) {
        const { error } = await supabase.from('evaluaciones_plantillas').update(payload).eq('id', plantilla.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('evaluaciones_plantillas').insert(payload);
        if (error) throw error;
      }
      onSave();
    } catch (error) {
      console.error('Error guardando plantilla:', error);
      alert('Ocurrió un error al guardar la plantilla.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full max-w-3xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            {plantilla ? 'Editar Prueba' : 'Crear Nueva Prueba'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <form id="pruebaForm" onSubmit={handleSave} className="space-y-8">
            
            {/* Detalles Generales */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">1. Detalles Generales</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Título de la Prueba</label>
                  <input
                    type="text"
                    required
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ej. Inventario de Ansiedad de Beck"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Descripción</label>
                  <textarea
                    rows={2}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="Breve explicación del objetivo de esta prueba..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Preguntas y Opciones */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <h3 className="text-lg font-bold text-slate-800">2. Preguntas y Opciones</h3>
                <button type="button" onClick={addPregunta} className="text-indigo-600 text-sm font-bold flex items-center hover:text-indigo-700">
                  <Plus size={16} className="mr-1" /> Añadir Pregunta
                </button>
              </div>

              <div className="space-y-6">
                {preguntas.map((q, qIndex) => (
                  <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                    <button 
                      type="button" 
                      onClick={() => removePregunta(qIndex)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={18} />
                    </button>
                    
                    <div className="mb-4 pr-8">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pregunta {qIndex + 1}</label>
                      <input
                        type="text"
                        required
                        value={q.texto}
                        onChange={(e) => updatePregunta(qIndex, e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                        placeholder="Escribe la pregunta o afirmación..."
                      />
                    </div>

                    <div className="pl-4 border-l-2 border-indigo-200 space-y-2">
                      {q.opciones.map((opcion, oIndex) => (
                        <div key={oIndex} className="flex items-center space-x-2">
                          <GripVertical size={16} className="text-slate-300 cursor-move hidden md:block" />
                          <input
                            type="text"
                            required
                            value={opcion.texto}
                            onChange={(e) => updateOpcion(qIndex, oIndex, 'texto', e.target.value)}
                            className="flex-1 p-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                            placeholder={`Opción ${oIndex + 1}`}
                          />
                          <div className="flex items-center space-x-1">
                            <span className="text-xs font-bold text-slate-400">Pts:</span>
                            <input
                              type="number"
                              required
                              value={opcion.puntaje}
                              onChange={(e) => updateOpcion(qIndex, oIndex, 'puntaje', e.target.value)}
                              className="w-16 p-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-center"
                            />
                          </div>
                          {q.opciones.length > 1 && (
                            <button type="button" onClick={() => removeOpcion(qIndex, oIndex)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg">
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => addOpcion(qIndex)} className="mt-2 text-indigo-500 text-xs font-bold flex items-center hover:text-indigo-700">
                        <Plus size={14} className="mr-1" /> Añadir Opción
                      </button>
                    </div>
                  </div>
                ))}
                {preguntas.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No hay preguntas agregadas.</p>
                )}
              </div>
            </div>

            {/* Escalas de Interpretación */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  3. Escalas de Interpretación
                  <div className="group relative ml-2">
                    <HelpCircle size={16} className="text-slate-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-slate-800 text-white text-xs p-2 rounded-lg shadow-xl z-10">
                      Define los rangos de puntaje y el significado clínico para mostrar en los resultados. Ej: 0 a 5 = Nivel Bajo.
                    </div>
                  </div>
                </h3>
                <button type="button" onClick={addEscala} className="text-indigo-600 text-sm font-bold flex items-center hover:text-indigo-700">
                  <Plus size={16} className="mr-1" /> Añadir Rango
                </button>
              </div>

              <div className="space-y-3">
                {escalas.map((escala, index) => (
                  <div key={index} className="flex flex-col md:flex-row items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-600">De</span>
                      <input
                        type="number"
                        required
                        value={escala.min}
                        onChange={(e) => updateEscala(index, 'min', e.target.value)}
                        className="w-20 p-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-center"
                      />
                      <span className="text-sm font-bold text-slate-600">a</span>
                      <input
                        type="number"
                        required
                        value={escala.max}
                        onChange={(e) => updateEscala(index, 'max', e.target.value)}
                        className="w-20 p-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-center"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      value={escala.interpretacion}
                      onChange={(e) => updateEscala(index, 'interpretacion', e.target.value)}
                      className="flex-1 w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                      placeholder="Ej. Depresión Severa"
                    />
                    {escalas.length > 1 && (
                      <button type="button" onClick={() => removeEscala(index)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
                {escalas.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No hay escalas agregadas.</p>
                )}
              </div>
            </div>

          </form>
        </div>

        {/* Footer actions */}
        <div className="p-6 bg-white border-t border-slate-200 flex justify-end space-x-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="pruebaForm"
            disabled={isSaving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
            ) : (
              <Save size={18} className="mr-2" />
            )}
            Guardar Prueba
          </button>
        </div>
      </div>
    </div>
  );
}
