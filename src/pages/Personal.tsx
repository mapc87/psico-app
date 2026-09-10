import React, { useState, useEffect } from 'react';
import { Users, Plus, Save, X, Edit2, Trash2, Key, Ticket, Mail, Eye, Phone, MapPin, Briefcase, CreditCard, Award, Calendar, Power } from 'lucide-react';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../context/AuthContext';
import type { Usuario, Rol } from '../types';
import ModalEnviarCorreo from '../components/common/ModalEnviarCorreo';
import Toast from '../components/common/Toast';
import { emailService } from '../services/email/emailService';

interface Invitacion {
  id: string;
  codigo: string;
  rol_asignado: string;
  usado: boolean;
  created_at: string;
}

export default function Personal() {
  const { usuarioActual } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<Usuario | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'empleado' | 'invitacion' } | null>(null);
  const [resetConfirm, setResetConfirm] = useState<{ email: string, nombre: string } | null>(null);
  
  // Para editar usuario
  const [nombre, setNombre] = useState('');
  const [rolId, setRolId] = useState<string | ''>('');

  const [personal, setPersonal] = useState<Usuario[]>([]);
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [invitacionGenerada, setInvitacionGenerada] = useState<string | null>(null);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [toastConfig, setToastConfig] = useState<{show: boolean, message: string, type: 'success' | 'error' | 'info'}>({ show: false, message: '', type: 'info' });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastConfig({ show: true, message, type });
    setTimeout(() => {
      setToastConfig(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const fetchDatos = async () => {
    if (!usuarioActual?.clinica_id) return;
    const [personalRes, rolesRes, invRes] = await Promise.all([
      supabase.from('usuarios').select('*').eq('clinica_id', usuarioActual.clinica_id),
      supabase.from('roles').select('*').eq('clinica_id', usuarioActual.clinica_id),
      supabase.from('invitaciones').select('*').eq('clinica_id', usuarioActual.clinica_id).eq('usado', false)
    ]);
    if (personalRes.data) setPersonal(personalRes.data as Usuario[]);
    if (rolesRes.data) setRoles(rolesRes.data as Rol[]);
    if (invRes.data) setInvitaciones(invRes.data as Invitacion[]);
  };

  useEffect(() => {
    fetchDatos();
  }, [usuarioActual?.clinica_id]);

  const resetForm = () => {
    setNombre('');
    setRolId('');
    setEditingUserId(null);
    setInvitacionGenerada(null);
  };

  const handleOpenEdit = (usuario: Usuario) => {
    setNombre(usuario.nombre);
    setRolId(usuario.rol_id || '');
    setEditingUserId(usuario.id || null);
    setIsModalOpen(true);
  };

  const handleOpenNewInv = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioActual || !usuarioActual.clinica_id || rolId === '') return;
    
    if (editingUserId) {
      // Editar personal existente
      const { error } = await supabase.from('usuarios').update({
        nombre,
        rol_id: rolId
      }).eq('id', editingUserId);

      if (error) {
        alert('Error al actualizar el personal');
        return;
      }
      setIsModalOpen(false);
      resetForm();
      fetchDatos();
    } else {
      // Crear nueva invitación
      const codigo = 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error } = await supabase.from('invitaciones').insert({
        clinica_id: usuarioActual.clinica_id,
        creado_por: usuarioActual.id,
        codigo: codigo,
        rol_asignado: rolId
      });

      if (error) {
        alert('Error creando la invitación');
        return;
      }
      setInvitacionGenerada(codigo);
      fetchDatos(); // Refrescar lista de invitaciones pendientes
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ id, type: 'empleado' });
  };

  const handleDeleteInv = (id: string) => {
    setDeleteConfirm({ id, type: 'invitacion' });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    if (deleteConfirm.type === 'empleado') {
      await supabase.from('usuarios').delete().eq('id', deleteConfirm.id);
    } else {
      const { error } = await supabase.from('invitaciones').delete().eq('id', deleteConfirm.id);
      if (error) {
        console.error("Error al eliminar invitación:", error);
        alert("Hubo un error al eliminar. Verifica si tienes permisos (solo Superadmin/Admin).");
      }
    }
    
    setDeleteConfirm(null);
    fetchDatos();
  };

  const handleToggleActivo = async (usuario: Usuario) => {
    // Si no tiene el campo activo definido explícitamente, asumimos que es true
    const nuevoEstado = usuario.activo === false ? true : false;
    const { error } = await supabase.from('usuarios').update({ activo: nuevoEstado }).eq('id', usuario.id);
    
    if (error) {
      showToast('Error al cambiar el estado del usuario', 'error');
    } else {
      showToast(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`, 'success');
      fetchDatos();
    }
  };

  const handleEnviarInvitacionEmail = async (email: string) => {
    if (!invitacionGenerada) return;
    
    const rol = roles.find(r => r.id === rolId);
    const rolNombre = rol ? rol.nombre : 'Empleado';
    const clinicaNombre = 'PsicoApp'; 
    
    try {
      const result = await emailService.enviarInvitacionClinica(email, {
        clinicaNombre,
        codigoInvitacion: invitacionGenerada,
        rolNombre
      });
      
      if (result.success) {
        showToast('Invitación enviada por correo electrónico', 'success');
        setShowEmailModal(false);
      } else {
        showToast('Error al enviar el correo', 'error');
      }
    } catch (error) {
      showToast('Error de red al enviar correo', 'error');
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/perfil',
      });
      if (error) throw error;
      showToast(`Correo de recuperación enviado a ${email}`, 'success');
    } catch (error: any) {
      console.error('Error enviando reseteo:', error);
      showToast(error.message || 'Error al solicitar el reseteo', 'error');
    }
  };

  if (usuarioActual?.rol !== 'admin' && usuarioActual?.rol !== 'doctor') {
    return <div className="p-8 text-center text-red-500 font-bold">No tienes acceso a esta sección.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="text-teal-600" size={32} />
            Gestión de Personal
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Administra las cuentas de tu equipo y genera invitaciones.</p>
        </div>
        <button 
          onClick={handleOpenNewInv}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-500/20 transition-all duration-300 flex items-center cursor-pointer"
        >
          <Plus size={20} className="mr-2" />
          Generar Invitación
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Activo */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 flex justify-between">
            <span>Personal Activo</span>
            <span className="bg-teal-100 text-teal-700 px-2 rounded-full text-sm">{personal.length}</span>
          </div>
          {personal && personal.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {personal.map((empleado) => {
                const rolEmpleado = roles?.find(r => r.id === empleado.rol_id);
                return (
                  <li key={empleado.id} className="p-4 hover:bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold mr-3">
                        {empleado.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 flex items-center">
                          {empleado.nombre}
                          {empleado.activo === false && <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-bold uppercase tracking-wider">Inactivo</span>}
                        </p>
                        <p className="text-xs text-slate-500">{empleado.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                          {empleado.rol === 'admin' ? 'Administrador' : (rolEmpleado ? rolEmpleado.nombre : 'Rol Eliminado')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setViewingUser(empleado)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" title="Ver detalles"><Eye size={16} /></button>
                      <button onClick={() => empleado.email && setResetConfirm({ email: empleado.email, nombre: empleado.nombre })} className="p-2 text-violet-500 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer" title="Resetear contraseña"><Key size={16} /></button>
                      <button onClick={() => handleToggleActivo(empleado)} className={`p-2 rounded-lg transition-colors cursor-pointer ${empleado.activo === false ? 'text-green-500 hover:bg-green-50' : 'text-amber-500 hover:bg-amber-50'}`} title={empleado.activo === false ? "Activar usuario" : "Desactivar/Bloquear usuario"}><Power size={16} /></button>
                      <button onClick={() => handleOpenEdit(empleado)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Editar Rol"><Edit2 size={16} /></button>
                      <button onClick={() => empleado.id && handleDelete(empleado.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Eliminar Empleado"><Trash2 size={16} /></button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">No hay personal activo.</div>
          )}
        </div>

        {/* Invitaciones Pendientes */}
        <div className="lg:col-span-1 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 flex justify-between">
            <span>Invitaciones Pendientes</span>
            <span className="bg-amber-100 text-amber-700 px-2 rounded-full text-sm">{invitaciones.length}</span>
          </div>
          {invitaciones && invitaciones.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {invitaciones.map((inv) => {
                const rolAsignado = roles?.find(r => r.id === inv.rol_asignado);
                return (
                  <li key={inv.id} className="p-4 hover:bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mr-3">
                        <Ticket size={20} />
                      </div>
                      <div>
                        <p className="font-mono font-bold text-amber-700 tracking-wider">{inv.codigo}</p>
                        <p className="text-xs text-slate-500">
                          Asignará el rol: <b>{rolAsignado ? rolAsignado.nombre : 'Desconocido'}</b>
                        </p>
                      </div>
                    </div>
                    <div>
                      <button onClick={() => handleDeleteInv(inv.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Cancelar invitación"><Trash2 size={16} /></button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">No hay invitaciones pendientes.</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-teal-50/50">
              <h3 className="text-xl font-bold text-teal-900 flex items-center">
                <Users className="mr-2 text-teal-600" size={24} />
                {editingUserId ? 'Editar Empleado' : 'Generar Código de Invitación'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {invitacionGenerada ? (
                <div className="text-center py-8">
                  <h4 className="text-lg font-bold text-slate-800 mb-2">¡Invitación Generada!</h4>
                  <p className="text-slate-500 mb-6">Comparte este código con el nuevo empleado. Podrá usarlo al registrarse para unirse a tu clínica.</p>
                  <div className="bg-slate-100 p-4 rounded-xl flex items-center justify-center font-mono text-3xl tracking-widest text-teal-700 font-bold border-2 border-teal-200 border-dashed">
                    {invitacionGenerada}
                  </div>
                  <button 
                    onClick={() => setShowEmailModal(true)}
                    type="button"
                    className="mt-6 w-full flex justify-center items-center px-4 py-3 bg-white border border-teal-200 text-teal-700 font-bold rounded-xl shadow-sm hover:bg-teal-50 transition-all duration-300 cursor-pointer"
                  >
                    <Mail size={18} className="mr-2" />
                    Enviar por correo electrónico
                  </button>
                </div>
              ) : (
                <form id="personalForm" onSubmit={handleSave} className="space-y-5">
                  {editingUserId && (
                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-2">Nombre Completo</label>
                      <input 
                        type="text"
                        required
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all duration-300 text-slate-700 font-medium"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">Selecciona el Rol Asignado</label>
                    <select
                      required
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all duration-300 text-slate-700 font-medium cursor-pointer"
                      value={rolId}
                      onChange={(e) => setRolId(e.target.value)}
                    >
                      <option value="" disabled>Selecciona un rol...</option>
                      {roles?.map(r => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                      ))}
                    </select>
                    {roles?.length === 0 && (
                      <p className="text-xs text-amber-600 mt-2 font-semibold">⚠️ No tienes roles creados. Ve a la sección de "Roles y Permisos" primero.</p>
                    )}
                  </div>
                </form>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                {invitacionGenerada ? 'Cerrar' : 'Cancelar'}
              </button>
              {!invitacionGenerada && (
                <button 
                  form="personalForm"
                  type="submit"
                  className="flex items-center px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all duration-300 shadow-md shadow-teal-500/20 cursor-pointer"
                >
                  <Save size={18} className="mr-2" />
                  {editingUserId ? 'Guardar Cambios' : 'Generar Código'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal de Confirmación de Eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {deleteConfirm.type === 'invitacion' ? '¿Cancelar Invitación?' : '¿Eliminar Empleado?'}
              </h3>
              <p className="text-slate-500">
                {deleteConfirm.type === 'invitacion' 
                  ? 'Esta acción invalidará el código y ya no podrá ser usado para registrarse.' 
                  : 'Esta acción revocará el acceso de este usuario al sistema.'}
              </p>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center space-x-3">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors cursor-pointer w-full"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-md shadow-red-500/20 cursor-pointer w-full"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles del Empleado */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
              <h3 className="text-xl font-bold text-indigo-900 flex items-center">
                <Users className="mr-2 text-indigo-600" size={24} />
                Detalles del Personal
              </h3>
              <button 
                onClick={() => setViewingUser(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-2xl">
                  {viewingUser.nombre?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-slate-800">{viewingUser.nombre}</h4>
                  <p className="text-slate-500">{viewingUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-3">
                   <h5 className="font-bold text-slate-700 flex items-center border-b border-slate-200 pb-2 mb-2"><Phone size={16} className="mr-2 text-slate-400" /> Contacto</h5>
                   <p className="text-sm"><span className="text-slate-500">Teléfono:</span> <span className="font-medium text-slate-800">{viewingUser.telefono || 'No registrado'}</span></p>
                   <p className="text-sm"><span className="text-slate-500">Dirección:</span> <span className="font-medium text-slate-800">{viewingUser.direccion || 'No registrada'}</span></p>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-3">
                   <h5 className="font-bold text-slate-700 flex items-center border-b border-slate-200 pb-2 mb-2"><CreditCard size={16} className="mr-2 text-slate-400" /> Personal</h5>
                   <p className="text-sm"><span className="text-slate-500">DPI:</span> <span className="font-medium text-slate-800">{viewingUser.dpi || 'No registrado'}</span></p>
                   <p className="text-sm"><span className="text-slate-500">Nacimiento:</span> <span className="font-medium text-slate-800">{viewingUser.fecha_nacimiento ? new Date(viewingUser.fecha_nacimiento).toLocaleDateString() : 'No registrada'}</span></p>
                   <p className="text-sm"><span className="text-slate-500">Género:</span> <span className="font-medium text-slate-800 capitalize">{viewingUser.genero ? viewingUser.genero.replace('_', ' ') : 'No registrado'}</span></p>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-3 md:col-span-2">
                   <h5 className="font-bold text-slate-700 flex items-center border-b border-slate-200 pb-2 mb-2"><Briefcase size={16} className="mr-2 text-slate-400" /> Profesional</h5>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <p className="text-sm"><span className="text-slate-500 block text-xs uppercase mb-1">Profesión</span> <span className="font-medium text-slate-800">{viewingUser.profesion || 'No registrada'}</span></p>
                     <p className="text-sm"><span className="text-slate-500 block text-xs uppercase mb-1">Especialidad</span> <span className="font-medium text-slate-800">{viewingUser.especialidad || 'No registrada'}</span></p>
                     <p className="text-sm"><span className="text-slate-500 block text-xs uppercase mb-1">No. Colegiado</span> <span className="font-medium text-slate-800">{viewingUser.no_colegiado || 'No registrado'}</span></p>
                   </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setViewingUser(null)}
                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Reseteo de Contraseña */}
      {resetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-violet-100 text-violet-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Restablecer Contraseña
              </h3>
              <p className="text-slate-500">
                ¿Estás seguro de que deseas enviar un correo de recuperación de contraseña a <b>{resetConfirm.nombre}</b> ({resetConfirm.email})?
              </p>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center space-x-3">
              <button 
                onClick={() => setResetConfirm(null)}
                className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors cursor-pointer w-full"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  handleResetPassword(resetConfirm.email);
                  setResetConfirm(null);
                }}
                className="px-5 py-2.5 bg-violet-500 hover:bg-violet-600 text-white font-bold rounded-xl transition-all shadow-md shadow-violet-500/20 cursor-pointer w-full"
              >
                Sí, enviar correo
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalEnviarCorreo
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={handleEnviarInvitacionEmail}
        title="Enviar Invitación por Correo"
        description="Ingresa el correo electrónico del nuevo empleado para enviarle el código de invitación y las instrucciones de registro."
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
