import React, { useState } from 'react';
import { Shield, Plus, Save, X, Edit2, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db/localDb';
import { useAuth } from '../context/AuthContext';
import type { Permisos, Rol } from '../types';

export default function Roles() {
  const { usuarioActual } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRolId, setEditingRolId] = useState<number | null>(null);
  
  const [nombre, setNombre] = useState('');
  const [permisos, setPermisos] = useState<Permisos>({
    verAgenda: false,
    verPacientes: false,
    verResumen: false,
    verCitas: false,
    verExamenes: false,
    verSignos: false,
    verHistorial: false,
    verDiagnosticos: false,
    verMedicamentos: false
  });

  const roles = useLiveQuery(
    () => usuarioActual ? db.roles.where('medicoId').equals(usuarioActual.id!).toArray() : []
  );

  const resetForm = () => {
    setNombre('');
    setPermisos({
      verAgenda: false,
      verPacientes: false,
      verResumen: false,
      verCitas: false,
      verExamenes: false,
      verSignos: false,
      verHistorial: false,
      verDiagnosticos: false,
      verMedicamentos: false
    });
    setEditingRolId(null);
  };

  const handleOpenModal = (rol?: Rol) => {
    if (rol) {
      setNombre(rol.nombre);
      setPermisos(rol.permisos);
      setEditingRolId(rol.id || null);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleTogglePermiso = (key: keyof Permisos) => {
    setPermisos(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioActual || !usuarioActual.id) return;
    
    if (editingRolId) {
      await db.roles.update(editingRolId, { nombre, permisos });
    } else {
      await db.roles.add({
        medicoId: usuarioActual.id,
        nombre,
        permisos
      });
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este rol? Los usuarios asignados a él perderán sus accesos.')) {
      await db.roles.delete(id);
    }
  };

  const modulosPrincipales = [
    { key: 'verAgenda', label: 'Agenda y Calendario' },
    { key: 'verPacientes', label: 'Lista de Pacientes' }
  ];

  const modulosExpediente = [
    { key: 'verResumen', label: 'Resumen del Paciente' },
    { key: 'verCitas', label: 'Citas del Paciente' },
    { key: 'verExamenes', label: 'Exámenes y Órdenes' },
    { key: 'verSignos', label: 'Signos Vitales y Triage' },
    { key: 'verHistorial', label: 'Historial / Notas Clínicas' },
    { key: 'verDiagnosticos', label: 'Diagnósticos / Plan Tratamiento' },
    { key: 'verMedicamentos', label: 'Recetas / Medicamentos' }
  ];

  if (usuarioActual?.rol !== 'admin' && usuarioActual?.rol !== 'doctor') {
    return <div className="p-8 text-center text-red-500 font-bold">No tienes acceso a esta sección.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Shield className="text-violet-600" size={32} />
            Roles y Permisos
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Configura qué módulos puede ver tu personal.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md shadow-violet-500/20 transition-all duration-300 flex items-center cursor-pointer"
        >
          <Plus size={20} className="mr-2" />
          Crear Nuevo Rol
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles?.map(rol => (
          <div key={rol.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-800">{rol.nombre}</h3>
              <div className="flex space-x-2">
                <button onClick={() => handleOpenModal(rol)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"><Edit2 size={16} /></button>
                <button onClick={() => rol.id && handleDelete(rol.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accesos Activos:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(rol.permisos).map(([key, value]) => {
                  if (value) {
                    return <span key={key} className="px-2 py-1 bg-violet-100 text-violet-700 text-xs font-semibold rounded-md border border-violet-200">
                      {key.replace('ver', '')}
                    </span>
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        ))}
        {roles?.length === 0 && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <Shield size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-lg font-semibold text-slate-500">No hay roles creados</p>
            <p className="text-sm text-slate-400 mt-2">Crea un rol como "Enfermera" o "Secretaria" para asignarlo a tu personal.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-violet-50/50 shrink-0">
              <h3 className="text-xl font-bold text-violet-900 flex items-center">
                <Shield className="mr-2 text-violet-600" size={24} />
                {editingRolId ? 'Editar Rol' : 'Nuevo Rol'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="rolForm" onSubmit={handleSave} className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Nombre del Rol</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 text-slate-700 font-medium"
                    placeholder="Ej. Secretaria, Enfermera..."
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-600 mb-4 pb-2 border-b border-slate-100">Permisos de Módulos Principales</h4>
                  <div className="space-y-3">
                    {modulosPrincipales.map(mod => (
                      <label key={mod.key} className="flex items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 text-violet-600 rounded border-slate-300 focus:ring-violet-500 cursor-pointer"
                          checked={permisos[mod.key as keyof Permisos]}
                          onChange={() => handleTogglePermiso(mod.key as keyof Permisos)}
                        />
                        <span className="ml-3 font-semibold text-slate-700">{mod.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-600 mb-4 pb-2 border-b border-slate-100">Permisos dentro del Expediente Clínico</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {modulosExpediente.map(mod => (
                      <label key={mod.key} className="flex items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 text-violet-600 rounded border-slate-300 focus:ring-violet-500 cursor-pointer"
                          checked={permisos[mod.key as keyof Permisos]}
                          onChange={() => handleTogglePermiso(mod.key as keyof Permisos)}
                        />
                        <span className="ml-3 font-semibold text-slate-700 text-sm">{mod.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3 shrink-0">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                form="rolForm"
                type="submit"
                className="flex items-center px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all duration-300 shadow-md shadow-violet-500/20 cursor-pointer"
              >
                <Save size={18} className="mr-2" />
                Guardar Rol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
