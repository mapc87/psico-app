import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, Shield, User } from 'lucide-react';
import { db } from '../services/db/localDb';

export default function CrearUsuario() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<"superadmin" | "admin" | "personal">('doctor');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validar si el correo ya existe
      const existe = await db.usuarios.where('email').equalsIgnoreCase(email).count();
      if (existe > 0) {
        alert('Este correo electrónico ya está registrado.');
        return;
      }

      await db.usuarios.add({
        nombre,
        email,
        password,
        rol
      });
      
      alert(`Usuario ${nombre} creado exitosamente como ${rol}.`);
      navigate('/dashboard'); // Por ahora lo enviamos al dashboard
      
    } catch (error) {
      console.error('Error creando usuario', error);
      alert('Hubo un error al crear la cuenta.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Crear Nuevo Usuario</h2>
          <p className="text-slate-500 mt-1">Invita a nuevos doctores o administradores al sistema clínico</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Nombre Completo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-slate-400" />
              </div>
              <input 
                type="text" 
                required
                className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all"
                placeholder="Dr. Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-400" />
              </div>
              <input 
                type="email" 
                required
                className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all"
                placeholder="doctor@clinica.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Contraseña Temporal</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-400" />
              </div>
              <input 
                type="password" 
                required
                className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all"
                placeholder="Ingresa una contraseña para este usuario"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Rol en el Sistema</label>
            <div className="grid grid-cols-2 gap-4">
              <div 
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${rol === 'admin' ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white hover:border-violet-200'}`}
                onClick={() => setRol('doctor')}
              >
                <div className="flex items-center mb-2">
                  <UserPlus size={20} className={rol === 'admin' ? 'text-violet-600' : 'text-slate-400'} />
                  <span className={`font-bold ml-2 ${rol === 'admin' ? 'text-violet-900' : 'text-slate-600'}`}>Doctor</span>
                </div>
                <p className="text-xs text-slate-500">Solo puede ver y editar expedientes de pacientes.</p>
              </div>

              <div 
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${rol === 'admin' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:border-amber-200'}`}
                onClick={() => setRol('admin')}
              >
                <div className="flex items-center mb-2">
                  <Shield size={20} className={rol === 'admin' ? 'text-amber-600' : 'text-slate-400'} />
                  <span className={`font-bold ml-2 ${rol === 'admin' ? 'text-amber-900' : 'text-slate-600'}`}>Administrador</span>
                </div>
                <p className="text-xs text-slate-500">Acceso total. Puede invitar a otros usuarios.</p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
            >
              Invitar y Crear Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
