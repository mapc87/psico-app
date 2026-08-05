import React, { useState } from 'react';
import { Users, Plus, Save, X, Edit2, Trash2, Key } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db/localDb';
import { useAuth } from '../context/AuthContext';
import type { Usuario } from '../types';

export default function Personal() {
  const { usuarioActual } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rolId, setRolId] = useState<number | ''>('');

  const personal = useLiveQuery(
    () => usuarioActual ? db.usuarios.where('medicoId').equals(usuarioActual.id!).toArray() : []
  );

  const roles = useLiveQuery(
    () => usuarioActual ? db.roles.where('medicoId').equals(usuarioActual.id!).toArray() : []
  );

  const resetForm = () => {
    setNombre('');
    setEmail('');
    setPassword('');
    setRolId('');
    setEditingUserId(null);
  };

  const handleOpenModal = (usuario?: Usuario) => {
    if (usuario) {
      setNombre(usuario.nombre);
      setEmail(usuario.email);
      setPassword(usuario.password || '');
      setRolId(usuario.rolId || '');
      setEditingUserId(usuario.id || null);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioActual || !usuarioActual.id || rolId === '') return;
    
    // Check if email already exists
    const existing = await db.usuarios.where('email').equals(email).first();
    if (existing && existing.id !== editingUserId) {
      alert('Ya existe una cuenta con ese correo electrónico.');
      return;
    }

    const userData = {
      nombre,
      email,
      password, // En producción no se guardaría en texto plano
      rol: 'personal' as const,
      rolId: Number(rolId),
      medicoId: usuarioActual.id
    };

    if (editingUserId) {
      await db.usuarios.update(editingUserId, userData);
    } else {
      await db.usuarios.add(userData);
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este miembro del personal? No podrán acceder al sistema.')) {
      await db.usuarios.delete(id);
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
          <p className="text-slate-500 mt-2 font-medium">Administra las cuentas de tu equipo clínico y administrativo.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-500/20 transition-all duration-300 flex items-center cursor-pointer"
        >
          <Plus size={20} className="mr-2" />
          Agregar Empleado
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        {personal && personal.length > 0 ? (
          <table className="w-full">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Email (Usuario)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Rol Asignado</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {personal.map((empleado) => {
                const rolEmpleado = roles?.find(r => r.id === empleado.rolId);
                return (
                  <tr key={empleado.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold mr-3">
                          {empleado.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{empleado.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{empleado.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold uppercase tracking-wider">
                        {rolEmpleado ? rolEmpleado.nombre : 'Rol Eliminado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpenModal(empleado)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-block mr-2"><Edit2 size={18} /></button>
                      <button onClick={() => empleado.id && handleDelete(empleado.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer inline-block"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-lg font-semibold text-slate-500">No hay personal registrado</p>
            <p className="text-sm text-slate-400 mt-2">Agrega a tus asistentes o secretarias para que puedan acceder al sistema.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-teal-50/50">
              <h3 className="text-xl font-bold text-teal-900 flex items-center">
                <Users className="mr-2 text-teal-600" size={24} />
                {editingUserId ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <form id="personalForm" onSubmit={handleSave} className="space-y-5">
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

                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Correo Electrónico (Usuario)</label>
                  <input 
                    type="email"
                    required
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all duration-300 text-slate-700 font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2 flex items-center">
                    Contraseña de Acceso <Key size={14} className="ml-2 text-slate-400"/>
                  </label>
                  <input 
                    type={editingUserId ? "text" : "password"}
                    required={!editingUserId}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all duration-300 text-slate-700 font-medium"
                    placeholder={editingUserId ? "Deja en blanco para no cambiar" : ""}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Rol Asignado</label>
                  <select
                    required
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all duration-300 text-slate-700 font-medium cursor-pointer"
                    value={rolId}
                    onChange={(e) => setRolId(Number(e.target.value))}
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
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                form="personalForm"
                type="submit"
                className="flex items-center px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all duration-300 shadow-md shadow-teal-500/20 cursor-pointer"
              >
                <Save size={18} className="mr-2" />
                Guardar Empleado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
