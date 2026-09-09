import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { X, ClipboardList, Search } from 'lucide-react';
import type { EvaluacionPlantilla } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (plantilla: EvaluacionPlantilla, mode: 'presencial' | 'remoto') => void;
  clinicaId: string;
}

export default function ModalAsignarEvaluacion({ isOpen, onClose, onSelect, clinicaId }: Props) {
  const [plantillas, setPlantillas] = useState<EvaluacionPlantilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPlantillas();
    }
  }, [isOpen]);

  const fetchPlantillas = async () => {
    setLoading(true);
    // Traer plantillas globales (clinica_id IS NULL) y plantillas propias de la clínica
    const { data, error } = await supabase
      .from('evaluaciones_plantillas')
      .select('*')
      .or(`clinica_id.is.null,clinica_id.eq.${clinicaId}`);

    if (error) {
      console.error('Error fetching plantillas:', error);
    } else if (data) {
      setPlantillas(data as EvaluacionPlantilla[]);
    }
    setLoading(false);
  };

  const filteredPlantillas = plantillas.filter(p => 
    p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center text-slate-800">
            <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mr-3">
              <ClipboardList size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Asignar Evaluación Psicométrica</h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">Selecciona el test a aplicar</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar evaluación (Ej. Ansiedad, PHQ-9...)" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all outline-none"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
          {loading ? (
            <div className="text-center py-10 text-slate-500">Cargando evaluaciones...</div>
          ) : filteredPlantillas.length > 0 ? (
            <div className="grid gap-4">
              {filteredPlantillas.map((plantilla) => (
                <div 
                  key={plantilla.id}
                  className="bg-white border border-slate-200 p-5 rounded-xl hover:border-violet-400 hover:shadow-md transition-all duration-200 group relative overflow-hidden"
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-violet-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-violet-700 transition-colors">{plantilla.titulo}</h3>
                  {plantilla.descripcion && (
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">{plantilla.descripcion}</p>
                  )}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onSelect(plantilla, 'presencial')}
                      className="flex-1 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold transition-colors"
                    >
                      Realizar Ahora
                    </button>
                    <button 
                      onClick={() => onSelect(plantilla, 'remoto')}
                      className="flex-1 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold transition-colors"
                    >
                      Enviar al Paciente
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">
              No se encontraron evaluaciones que coincidan con la búsqueda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
