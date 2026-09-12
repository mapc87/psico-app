import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, FileText, Globe, Building2, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../context/AuthContext';
import type { EvaluacionPlantilla } from '../types';
import Toast from '../components/common/Toast';
import FormularioPrueba from '../components/evaluaciones/FormularioPrueba';
import ModalConfirmacion from '../components/common/ModalConfirmacion';

export default function GestorPruebas() {
  const { usuarioActual } = useAuth();
  const [plantillas, setPlantillas] = useState<EvaluacionPlantilla[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlantilla, setEditingPlantilla] = useState<EvaluacionPlantilla | null>(null);
  
  const [toastConfig, setToastConfig] = useState<{show: boolean, message: string, type: 'success' | 'error' | 'info'}>({ show: false, message: '', type: 'info' });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastConfig({ show: true, message, type });
    setTimeout(() => {
      setToastConfig(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const [modalConfirmacion, setModalConfirmacion] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const abrirConfirmacion = (title: string, message: string, onConfirm: () => void) => {
    setModalConfirmacion({ isOpen: true, title, message, onConfirm });
  };
  const cerrarConfirmacion = () => setModalConfirmacion(prev => ({ ...prev, isOpen: false }));

  const fetchPlantillas = async () => {
    setIsLoading(true);
    try {
      // Obtener plantillas globales y las de la clínica actual (RLS ya filtra, pero podemos ser explícitos)
      const { data, error } = await supabase
        .from('evaluaciones_plantillas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlantillas(data as EvaluacionPlantilla[]);
    } catch (error: any) {
      console.error('Error fetching plantillas:', error);
      showToast('Error al cargar las plantillas', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (usuarioActual?.clinica_id) {
      fetchPlantillas();
    }
  }, [usuarioActual?.clinica_id]);

  const handleCreateNew = () => {
    setEditingPlantilla(null);
    setIsFormOpen(true);
  };

  const handleEdit = (plantilla: EvaluacionPlantilla) => {
    setEditingPlantilla(plantilla);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    abrirConfirmacion(
      "Eliminar Prueba",
      "¿Estás seguro de eliminar esta prueba? Esta acción es irreversible.",
      async () => {
        try {
          const { error } = await supabase.from('evaluaciones_plantillas').delete().eq('id', id);
          if (error) throw error;
          showToast('Prueba eliminada exitosamente', 'success');
          fetchPlantillas();
        } catch (error: any) {
          console.error('Error deleting plantilla:', error);
          showToast('Error al eliminar la prueba', 'error');
        }
        cerrarConfirmacion();
      }
    );
  };

  const plantillasGlobales = plantillas.filter(p => p.clinica_id === null);
  const plantillasClinica = plantillas.filter(p => p.clinica_id === usuarioActual?.clinica_id);

  if (usuarioActual?.rol !== 'admin' && usuarioActual?.rol !== 'doctor') {
    return <div className="p-8 text-center text-red-500 font-bold">No tienes acceso a esta sección.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <ClipboardList className="text-indigo-600" size={32} />
            Gestor de Pruebas
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Administra y crea nuevas plantillas de evaluaciones psicométricas.</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all duration-300 flex items-center cursor-pointer"
        >
          <Plus size={20} className="mr-2" />
          Nueva Prueba
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pruebas de la Clínica */}
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center mb-4 px-2">
              <Building2 className="text-indigo-500 mr-2" size={24} />
              Pruebas de la Clínica
              <span className="ml-3 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">{plantillasClinica.length}</span>
            </h3>
            
            {plantillasClinica.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plantillasClinica.map(plantilla => (
                  <div key={plantilla.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col h-full group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => handleEdit(plantilla)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Editar Prueba">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => plantilla.id && handleDelete(plantilla.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Eliminar Prueba">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">{plantilla.titulo}</h4>
                    <p className="text-slate-500 text-sm flex-grow line-clamp-3">{plantilla.descripcion}</p>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-400">
                      <span>{plantilla.preguntas.length} Preguntas</span>
                      <span>{plantilla.escalas.length} Escalas</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center border-dashed border-2">
                <FileText className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-slate-500 font-medium">Aún no has creado ninguna prueba personalizada.</p>
                <button onClick={handleCreateNew} className="mt-4 text-indigo-600 font-bold hover:underline cursor-pointer">Crea la primera ahora</button>
              </div>
            )}
          </div>

          {/* Pruebas Globales */}
          <div className="pt-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center mb-4 px-2">
              <Globe className="text-teal-500 mr-2" size={24} />
              Pruebas Globales (Sistema)
              <span className="ml-3 bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-bold">{plantillasGlobales.length}</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plantillasGlobales.map(plantilla => (
                <div key={plantilla.id} className="bg-slate-50/80 p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-teal-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">GLOBAL</div>
                  <div className="p-3 bg-teal-100 text-teal-600 rounded-xl w-max mb-4">
                    <FileText size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 mb-2">{plantilla.titulo}</h4>
                  <p className="text-slate-600 text-sm flex-grow">{plantilla.descripcion}</p>
                  <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-500">
                    <span>{plantilla.preguntas.length} Preguntas</span>
                    <span>{plantilla.escalas.length} Escalas</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <FormularioPrueba 
          plantilla={editingPlantilla} 
          onClose={() => setIsFormOpen(false)} 
          onSave={() => {
            setIsFormOpen(false);
            fetchPlantillas();
            showToast(`Prueba ${editingPlantilla ? 'actualizada' : 'creada'} exitosamente`, 'success');
          }} 
        />
      )}

      <ModalConfirmacion 
        isOpen={modalConfirmacion.isOpen}
        title={modalConfirmacion.title}
        message={modalConfirmacion.message}
        onConfirm={modalConfirmacion.onConfirm}
        onCancel={cerrarConfirmacion}
        confirmText="Sí, eliminar"
      />

      <Toast 
        show={toastConfig.show} 
        message={toastConfig.message} 
        type={toastConfig.type} 
        onClose={() => setToastConfig(prev => ({ ...prev, show: false }))} 
      />
    </div>
  );
}
