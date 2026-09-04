import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ActivitySquare, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase/client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { needsFirstAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Credenciales incorrectas. Inténtalo de nuevo.');
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  if (needsFirstAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto text-violet-600 mb-4">
            <ActivitySquare size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">¡Bienvenido a PsicoApp!</h2>
          <p className="text-slate-600">Hemos detectado que es la primera vez que abres el sistema. Necesitas crear el usuario Administrador para comenzar.</p>
          <Link 
            to="/registro-inicial"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-violet-500/50 hover:-translate-y-0.5"
          >
            Configurar Sistema Ahora
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-300/30 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-300/30 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="bg-white/70 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white max-w-md w-full relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-violet-500/30">
            <ActivitySquare size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 text-center">Acceso Clínico</h2>
          <p className="text-slate-500 mt-2 text-sm text-center">Ingresa tus credenciales para acceder a los expedientes.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start text-red-600 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} className="mr-2 mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-400" />
              </div>
              <input 
                type="email" 
                required
                className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300"
                placeholder="doctor@clinica.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-400" />
              </div>
              <input 
                type="password" 
                required
                className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer mt-4"
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>

          <div className="text-center mt-6">
            <p className="text-sm text-slate-500">
              ¿Tienes un código de invitación?{' '}
              <Link to="/registro" className="text-violet-600 font-bold hover:underline">
                Únete aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
