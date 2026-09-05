import React, { useState, useEffect } from 'react';
import { Users, Plus, Save, X, Edit2, Trash2, Key, Ticket } from 'lucide-react';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../context/AuthContext';
import type { Usuario, Rol } from '../types';

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
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'empleado' | 'invitacion' } | null>(null);
  
  // Para editar usuario
  const [nombre, setNombre] = useState('');
  const [rolId, setRolId] = useState<string | ''>('');

  const [personal, setPersonal] = useState<Usuario[]>([]);
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [invitacionGenerada, setInvitacionGenerada] = useState<string | null>(null);

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Activo */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
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
                        <p className="font-bold text-slate-800">{empleado.nombre}</p>
                        <p className="text-xs text-slate-500">{empleado.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                          {rolEmpleado ? rolEmpleado.nombre : 'Rol Eliminado'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenEdit(empleado)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"><Edit2 size={16} /></button>
                      <button onClick={() => empleado.id && handleDelete(empleado.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"><Trash2 size={16} /></button>
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
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
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
    </div>
  );
}
