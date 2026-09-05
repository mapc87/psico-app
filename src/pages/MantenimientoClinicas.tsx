import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../context/AuthContext';
import { Building2, Save, X, Edit, Power, PowerOff, ShieldAlert, Activity, Trash2, AlertTriangle } from 'lucide-react';
import Toast from '../components/common/Toast';
import type { Clinica } from '../types';

export default function MantenimientoClinicas() {
  const { usuarioActual } = useAuth();
  
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [nuevaClinicaNombre, setNuevaClinicaNombre] = useState('');
  const [nuevoCodigo, setNuevoCodigo] = useState('');
  
  const [editingClinica, setEditingClinica] = useState<Clinica | null>(null);
  
  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clinicaToDelete, setClinicaToDelete] = useState<Clinica | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  
  // Toggle state
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [clinicaToToggle, setClinicaToToggle] = useState<Clinica | null>(null);
  
  const [toastConfig, setToastConfig] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    fetchClinicas();
  }, []);

  const fetchClinicas = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('clinicas')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setClinicas(data as Clinica[]);
    setLoading(false);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastConfig({ show: true, message, type });
    setTimeout(() => {
      setToastConfig(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleGuardarClinica = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaClinicaNombre) return;

    if (editingClinica) {
      // Edit mode
      const { error } = await supabase
        .from('clinicas')
        .update({ nombre: nuevaClinicaNombre })
        .eq('id', editingClinica.id);
        
      if (!error) {
        setClinicas(clinicas.map(c => c.id === editingClinica.id ? { ...c, nombre: nuevaClinicaNombre } : c));
        setShowModal(false);
        showToast('Clínica actualizada correctamente', 'success');
      } else {
        showToast('Error al actualizar clínica', 'error');
      }
    } else {
      // Create mode
      const { data: clinicaData, error: clinicaError } = await supabase
        .from('clinicas')
        .insert({ nombre: nuevaClinicaNombre, estado: 'activa' })
        .select()
        .single();

      if (clinicaData && !clinicaError) {
        const codigo = 'CLINICA-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const { error: inviteError } = await supabase
          .from('invitaciones')
          .insert({
            clinica_id: clinicaData.id,
            creado_por: usuarioActual?.id,
            codigo: codigo,
            rol_asignado: 'admin'
          });

        if (!inviteError) {
          setClinicas([clinicaData as Clinica, ...clinicas]);
          setNuevoCodigo(codigo);
          setNuevaClinicaNombre('');
          showToast('Clínica creada correctamente', 'success');
        } else {
          showToast('Error creando invitación de la clínica', 'error');
        }
      } else {
        showToast('Error creando la clínica', 'error');
      }
    }
  };

  const promptToggleEstado = (clinica: Clinica) => {
    if (clinica.estado === 'activa') {
      setClinicaToToggle(clinica);
      setShowToggleModal(true);
    } else {
      // Si está inactiva, la activamos de una vez sin tanta advertencia
      executeToggle(clinica);
    }
  };

  const executeToggle = async (clinica: Clinica) => {
    const nuevoEstado = clinica.estado === 'activa' ? 'inactiva' : 'activa';
    
    const { error } = await supabase
      .from('clinicas')
      .update({ estado: nuevoEstado })
      .eq('id', clinica.id);

    if (!error) {
      setClinicas(clinicas.map(c => c.id === clinica.id ? { ...c, estado: nuevoEstado } : c));
      setShowToggleModal(false);
      showToast(`Clínica ${nuevoEstado === 'activa' ? 'activada' : 'desactivada'} exitosamente`, 'success');
    } else {
      showToast('Error al cambiar el estado', 'error');
    }
  };

  const handleDeleteClinica = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicaToDelete || deleteConfirmName !== clinicaToDelete.nombre) return;

    const { error } = await supabase
      .from('clinicas')
      .delete()
      .eq('id', clinicaToDelete.id);

    if (!error) {
      setClinicas(clinicas.filter(c => c.id !== clinicaToDelete.id));
      setShowDeleteModal(false);
      showToast('Clínica eliminada permanentemente', 'success');
    } else {
      showToast('Error al eliminar clínica', 'error');
    }
  };

  const openEditModal = (clinica: Clinica) => {
    setEditingClinica(clinica);
    setNuevaClinicaNombre(clinica.nombre);
    setNuevoCodigo('');
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingClinica(null);
    setNuevaClinicaNombre('');
    setNuevoCodigo('');
    setShowModal(true);
  };

  const openDeleteModal = (clinica: Clinica) => {
    setClinicaToDelete(clinica);
    setDeleteConfirmName('');
    setShowDeleteModal(true);
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Activity className="animate-spin text-emerald-500" size={32} /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <ShieldAlert className="text-emerald-600" size={36} />
            Mantenimiento de Clínicas
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Administra las clínicas registradas en el sistema. Puedes editar sus datos o suspender su acceso.
          </p>
        </div>
        <div>
          <button 
            onClick={openCreateModal}
            className="flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Building2 size={18} className="mr-2" />
            Nueva Clínica
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-lg">Directorio de Clínicas SaaS</h3>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
            Total: {clinicas.length}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-sm border-b border-slate-100">
                <th className="px-6 py-4 font-semibold">Nombre de Clínica</th>
                <th className="px-6 py-4 font-semibold">Estado Actual</th>
                <th className="px-6 py-4 font-semibold">Fecha de Registro</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clinicas.map(clinica => (
                <tr key={clinica.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3">
                        <Building2 size={16} />
                      </div>
                      {clinica.nombre}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center ${
                      clinica.estado === 'activa' 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                        : 'bg-rose-100 text-rose-700 border border-rose-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${clinica.estado === 'activa' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      {clinica.estado === 'activa' ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm font-medium">
                    {new Date(clinica.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(clinica)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar Clínica"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => promptToggleEstado(clinica)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          clinica.estado === 'activa'
                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={clinica.estado === 'activa' ? 'Desactivar Clínica' : 'Activar Clínica'}
                      >
                        {clinica.estado === 'activa' ? <PowerOff size={18} /> : <Power size={18} />}
                      </button>
                      <button
                        onClick={() => openDeleteModal(clinica)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar Clínica"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {clinicas.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No hay clínicas registradas en el sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva/Editar Clínica */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                {editingClinica ? 'Editar Clínica' : 'Registrar Nueva Clínica'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-white rounded-full p-1 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {nuevoCodigo ? (
                <div className="text-center py-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">¡Clínica Registrada!</h3>
                  <p className="text-slate-500 mb-6 text-sm">
                    Comparte este código con el administrador de la clínica para que configure su cuenta maestra.
                  </p>
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-4 rounded-2xl font-mono text-2xl font-bold text-slate-700 tracking-wider">
                    {nuevoCodigo}
                  </div>
                </div>
              ) : (
                <form id="clinicaForm" onSubmit={handleGuardarClinica} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de la Clínica</label>
                    <input 
                      type="text"
                      required
                      value={nuevaClinicaNombre}
                      onChange={(e) => setNuevaClinicaNombre(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700"
                      placeholder="Ej. Clínica Psicológica Bienestar"
                    />
                  </div>
                </form>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                {nuevoCodigo ? 'Cerrar' : 'Cancelar'}
              </button>
              {!nuevoCodigo && (
                <button 
                  form="clinicaForm"
                  type="submit"
                  className="flex items-center px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Save size={18} className="mr-2" />
                  {editingClinica ? 'Guardar Cambios' : 'Generar Clínica'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Clínica */}
      {showDeleteModal && clinicaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-red-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-red-100 flex justify-between items-center bg-red-50/50">
              <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle size={24} />
                Eliminar Clínica
              </h2>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-white rounded-full p-1 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleDeleteClinica}>
              <div className="p-6">
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800 font-medium">
                    <strong>¡Atención!</strong> Esta acción es <strong>completamente irreversible</strong>. 
                    Se eliminará de forma permanente toda la información relacionada con la clínica: 
                    pacientes, citas, personal, documentos y facturación.
                  </p>
                </div>
                
                <p className="text-slate-600 text-sm mb-4">
                  Para confirmar la eliminación, por favor escribe el nombre completo de la clínica: 
                  <strong className="block mt-1 text-slate-800 text-base">{clinicaToDelete.nombre}</strong>
                </p>
                
                <div>
                  <input 
                    type="text"
                    required
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/50 focus:border-red-500 outline-none transition-all font-medium text-slate-700"
                    placeholder="Escribe el nombre aquí..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={deleteConfirmName !== clinicaToDelete.nombre}
                  className="flex items-center px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-md shadow-red-500/20 cursor-pointer"
                >
                  <Trash2 size={18} className="mr-2" />
                  Eliminar Definitivamente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Desactivar Clínica */}
      {showToggleModal && clinicaToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-rose-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-rose-100 flex justify-between items-center bg-rose-50/50">
              <h2 className="text-xl font-bold text-rose-700 flex items-center gap-2">
                <PowerOff size={24} />
                Desactivar Clínica
              </h2>
              <button 
                onClick={() => setShowToggleModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-white rounded-full p-1 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                ¿Suspender acceso a {clinicaToToggle.nombre}?
              </h3>
              <p className="text-slate-500 text-sm">
                Al desactivar esta clínica, <strong>ningún usuario</strong> asociado a ella podrá iniciar sesión en el sistema. Los datos permanecerán intactos y podrás reactivarla en cualquier momento.
              </p>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
              <button 
                onClick={() => setShowToggleModal(false)}
                className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={() => executeToggle(clinicaToToggle)}
                className="flex items-center px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-md shadow-rose-500/20 cursor-pointer"
              >
                <PowerOff size={18} className="mr-2" />
                Sí, Desactivar
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast 
        show={toastConfig.show} 
        message={toastConfig.message} 
        type={toastConfig.type} 
        onClose={() => setToastConfig(prev => ({ ...prev, show: false }))} 
      />
    </div>
  );
}
