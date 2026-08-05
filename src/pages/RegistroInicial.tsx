import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ShieldCheck } from 'lucide-react';
import { db } from '../services/db/localDb';
import { useAuth } from '../context/AuthContext';

export default function RegistroInicial() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { needsFirstAdmin, login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que realmente no haya usuarios (medida extra de seguridad)
    const count = await db.usuarios.count();
    if (count > 0) {
      alert('Error: Ya existe un administrador en el sistema.');
      navigate('/login');
      return;
    }

    try {
      await db.usuarios.add({
        nombre,
        email,
        password,
        rol: 'admin'
      });
      
      // Auto-login después de crear
      await login(email, password);
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error creando el administrador', error);
      alert('Hubo un error al crear la cuenta.');
    }
  };

  // Si ya hay usuarios, expulsarlo de aquí
  if (!needsFirstAdmin) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl max-w-md w-full border border-slate-100">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Configuración Inicial</h2>
          <p className="text-slate-500 mt-2 text-sm">Crea la cuenta de Administrador Maestro para comenzar a usar el sistema clínico.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">Nombre Completo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-slate-400" />
              </div>
              <input 
                type="text" 
                required
                className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                placeholder="Dr. Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">Correo Electrónico (Usuario)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-400" />
              </div>
              <input 
                type="email" 
                required
                className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                placeholder="admin@clinica.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-400" />
              </div>
              <input 
                type="password" 
                required
                className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                placeholder="Crea una contraseña segura"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 cursor-pointer mt-4"
          >
            Crear Administrador y Comenzar
          </button>
        </form>
      </div>
    </div>
  );
}
