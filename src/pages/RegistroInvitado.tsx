import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Key, ActivitySquare, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase/client';

export default function RegistroInvitado() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codigoInvitacion, setCodigoInvitacion] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Registrar usuario pasando el código al trigger de base de datos
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre: nombre,
            codigo_invitacion: codigoInvitacion
          }
        }
      });

      if (authError) {
        throw authError;
      }

      // Si se crea el usuario, entra directamente
      navigate('/dashboard');
      
    } catch (error: any) {
      console.error('Error en registro', error);
      setError(error.message || 'El código de invitación es inválido o hubo un error.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-500/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl max-w-md w-full relative z-10 border border-slate-100">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-600 mb-4 shadow-sm">
            <ActivitySquare size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Únete a la Clínica</h2>
          <p className="text-slate-500 mt-2 text-sm">Ingresa tu código de invitación para crear tu cuenta en la nube.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start text-red-600">
            <AlertCircle size={18} className="mr-2 mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">Código de Invitación</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Key size={18} className="text-violet-400" />
              </div>
              <input 
                type="text" 
                required
                className="w-full pl-11 pr-5 py-3 bg-violet-50 border border-violet-100 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all uppercase font-bold text-violet-700 tracking-wider"
                placeholder="CLINICA-XXXXXX"
                value={codigoInvitacion}
                onChange={(e) => setCodigoInvitacion(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">Tu Nombre</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-slate-400" />
              </div>
              <input 
                type="text" 
                required
                className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all"
                placeholder="Dr. Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-400" />
              </div>
              <input 
                type="email" 
                required
                className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all"
                placeholder="doctor@clinica.com"
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
                minLength={6}
                className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 cursor-pointer mt-4"
          >
            {loading ? 'Validando Código...' : 'Registrarme y Entrar'}
          </button>

          <div className="text-center mt-6">
            <p className="text-sm text-slate-500">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-violet-600 font-bold hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
