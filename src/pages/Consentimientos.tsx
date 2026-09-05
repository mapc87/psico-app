import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../context/AuthContext';
import { FileSignature, Plus, Edit2, Trash2, Save, X, BookOpen } from 'lucide-react';
import type { PlantillaDocumento } from '../types';

const PLANTILLA_DEFECTO = `CONSENTIMIENTO INFORMADO PARA EVALUACIÓN Y TRATAMIENTO PSICOLÓGICO

1. IDENTIFICACIÓN
Yo, {{PACIENTE_NOMBRE}}, autorizo libre y voluntariamente a participar en el proceso de evaluación y tratamiento psicológico.

2. NATURALEZA DEL SERVICIO
Entiendo que el tratamiento psicológico es una relación colaborativa. Los resultados dependen en gran medida de mi participación activa. El profesional utilizará técnicas basadas en evidencia científica orientadas a mi bienestar.

3. CONFIDENCIALIDAD
Toda la información revelada durante las sesiones será estrictamente confidencial. Las únicas excepciones legales para romper esta confidencialidad son:
- Riesgo inminente contra mi propia vida o la vida de terceros.
- Sospecha de abuso a menores de edad o personas vulnerables.
- Requerimiento u orden de un juez.

4. POLÍTICAS DE CANCELACIÓN Y HONORARIOS
Me comprometo a notificar cualquier cancelación con al menos 24 horas de anticipación. De lo contrario, la sesión podrá ser cobrada en su totalidad. Entiendo las tarifas acordadas y me comprometo a cumplir con los pagos de manera oportuna.

5. VOLUNTARIEDAD
Entiendo que mi participación es totalmente voluntaria y tengo el derecho de retirar este consentimiento y finalizar el tratamiento en el momento que lo considere necesario, sin que esto implique penalización alguna.

Con mi firma abajo, declaro que he leído, comprendido y aceptado las condiciones aquí expuestas, habiendo tenido la oportunidad de aclarar cualquier duda con mi terapeuta.`;

export default function Consentimientos() {
  const { usuarioActual } = useAuth();
  const [plantillas, setPlantillas] = useState<PlantillaDocumento[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlantilla, setCurrentPlantilla] = useState<Partial<PlantillaDocumento>>({});
  
  useEffect(() => {
    fetchPlantillas();
  }, [usuarioActual]);

  const fetchPlantillas = async () => {
    if (!usuarioActual?.clinica_id) return;
    const { data } = await supabase
      .from('plantillas_documentos')
      .select('*')
      .eq('clinica_id', usuarioActual.clinica_id)
      .order('created_at', { ascending: false });
    
    if (data) {
      if (data.length === 0) {
        // Crear plantilla por defecto si no hay ninguna
        crearPlantillaDefecto();
      } else {
        setPlantillas(data);
      }
    }
  };

  const crearPlantillaDefecto = async () => {
    if (!usuarioActual?.clinica_id) return;
    const nuevaPlantilla = {
      clinica_id: usuarioActual.clinica_id,
      titulo: 'Consentimiento Informado General (Adultos)',
      contenido: PLANTILLA_DEFECTO
    };
    const { data, error } = await supabase.from('plantillas_documentos').insert([nuevaPlantilla]).select();
    if (!error && data) {
      setPlantillas(data);
    }
  };

  const handleSave = async () => {
    if (!currentPlantilla.titulo || !currentPlantilla.contenido || !usuarioActual?.clinica_id) return;

    if (currentPlantilla.id) {
      // Update
      const { error } = await supabase
        .from('plantillas_documentos')
        .update({ titulo: currentPlantilla.titulo, contenido: currentPlantilla.contenido })
        .eq('id', currentPlantilla.id);
      
      if (!error) {
        fetchPlantillas();
        setIsEditing(false);
      } else {
        alert("Error al actualizar la plantilla");
      }
    } else {
      // Create
      const { error } = await supabase
        .from('plantillas_documentos')
        .insert([{
          clinica_id: usuarioActual.clinica_id,
          titulo: currentPlantilla.titulo,
          contenido: currentPlantilla.contenido
        }]);
        
      if (!error) {
        fetchPlantillas();
        setIsEditing(false);
      } else {
        alert("Error al crear la plantilla");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta plantilla?")) {
      const { error } = await supabase.from('plantillas_documentos').delete().eq('id', id);
      if (!error) {
        fetchPlantillas();
      }
    }
  };

  const openEditor = (plantilla?: PlantillaDocumento) => {
    if (plantilla) {
      setCurrentPlantilla(plantilla);
    } else {
      setCurrentPlantilla({ titulo: '', contenido: '' });
    }
    setIsEditing(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center">
            <FileSignature className="mr-3 text-indigo-500" size={32} />
            Plantillas de Consentimiento
          </h2>
          <p className="text-slate-500 mt-1">Configura los documentos legales que firmarán tus pacientes</p>
        </div>
        
        {!isEditing && (
          <button 
            onClick={() => openEditor()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-indigo-600/20 flex items-center hover:scale-105"
          >
            <Plus size={18} className="mr-2" />
            Nueva Plantilla
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-indigo-100 flex flex-col gap-6 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold text-slate-800">
              {currentPlantilla.id ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
            </h3>
            <button onClick={() => setIsEditing(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Título del Documento</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              placeholder="Ej. Consentimiento Menores de Edad"
              value={currentPlantilla.titulo || ''}
              onChange={(e) => setCurrentPlantilla({...currentPlantilla, titulo: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Contenido de la Plantilla</label>
            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg mb-3 flex items-start">
              <BookOpen size={16} className="mr-2 flex-shrink-0 mt-0.5" />
              <p>Puedes usar la etiqueta <strong>{`{{PACIENTE_NOMBRE}}`}</strong> para que se reemplace automáticamente por el nombre del paciente al momento de firmar.</p>
            </div>
            <textarea 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none h-96 resize-none"
              placeholder="Escribe aquí el texto legal..."
              value={currentPlantilla.contenido || ''}
              onChange={(e) => setCurrentPlantilla({...currentPlantilla, contenido: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 flex items-center">
              <Save size={18} className="mr-2" />
              Guardar Plantilla
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {plantillas.map(plantilla => (
            <div key={plantilla.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow group flex flex-col h-64">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mr-3">
                    <FileSignature size={20} />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">{plantilla.titulo}</h3>
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                  <button onClick={() => openEditor(plantilla)} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" title="Editar">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(plantilla.id)} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors" title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <p className="text-slate-500 text-sm whitespace-pre-wrap leading-relaxed">{plantilla.contenido}</p>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
              </div>
            </div>
          ))}
          {plantillas.length === 0 && (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
              <FileSignature size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-lg font-semibold text-slate-500">No hay plantillas creadas</p>
              <p className="text-sm text-slate-400 mt-2">Haz clic en "Nueva Plantilla" para comenzar.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
