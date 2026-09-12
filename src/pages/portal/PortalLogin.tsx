import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import { KeyRound, Loader2, ArrowRight } from 'lucide-react';

export default function PortalLogin() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Intentar buscar al paciente por PIN mediante función segura (RPC)
      const { data, error: fetchError } = await supabase
        .rpc('login_portal_paciente', { p_pin_acceso: pin.trim() });

      if (fetchError || !data) {
        throw new Error('PIN incorrecto o paciente no encontrado.');
      }

      if (data.estado !== 'activo') {
        throw new Error('Esta cuenta de paciente está inactiva.');
      }

      // Guardar en localStorage
      localStorage.setItem('portalPaciente', JSON.stringify(data));
      navigate('/portal');
      
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al intentar acceder.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/30 transform -rotate-6">
          <KeyRound className="w-8 h-8 text-white rotate-6" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Portal del Paciente
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Ingresa con tu PIN de 6 dígitos proporcionado por la clínica
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-slate-700">
                PIN de Acceso
              </label>
              <div className="mt-2 relative">
                <input
                  id="pin"
                  name="pin"
                  type="text"
                  required
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} // Solo números
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-violet-500 focus:border-violet-500 text-center text-2xl tracking-[0.5em] font-bold"
                  placeholder="------"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || pin.length < 5}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Acceder a mi Portal
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
