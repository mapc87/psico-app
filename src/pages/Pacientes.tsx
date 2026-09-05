import { useState, useEffect } from 'react';
import { Search, Plus, User, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../context/AuthContext';
import type { Paciente } from '../types';

export default function Pacientes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const location = useLocation();
  const mensajeExito = location.state?.mensaje;

  const { usuarioActual } = useAuth();

  useEffect(() => {
    const fetchPacientes = async () => {
      if (!usuarioActual?.clinica_id) return;
      
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setPacientes(data as Paciente[]);
      }
    };
    
    fetchPacientes();
  }, [usuarioActual?.clinica_id]);

  // Función auxiliar para calcular edad
  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return 0;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const pacientesFiltrados = pacientes.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Directorio de Pacientes</h2>
          <p className="text-slate-500 mt-1">Gestiona y accede al expediente clínico de tus pacientes</p>
        </div>
        <Link 
          to="/pacientes/nuevo"
          className="flex items-center px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus size={20} className="mr-2" />
          Nuevo Paciente
        </Link>
      </div>

      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center animate-in fade-in slide-in-from-top-2">
          <User size={18} className="mr-2" />
          <span className="font-semibold">{mensajeExito}</span>
        </div>
      )}

      <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden relative z-0">
        {/* Header de la tabla */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar paciente..."
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-full leading-5 bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 focus:bg-white sm:text-sm transition-all duration-300 shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Edad</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Ingreso</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white/30 divide-y divide-slate-100 backdrop-blur-sm">
              {pacientesFiltrados.map((paciente) => (
                <tr key={paciente.id} className="hover:bg-violet-50/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs mr-3">
                        {paciente.nombre.charAt(0)}
                      </div>
                      <div className="text-sm font-semibold text-slate-800">{paciente.nombre}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">{calcularEdad(paciente.fecha_nacimiento || '')} años</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{paciente.telefono}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{paciente.fecha_ingreso}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                    <Link 
                      to={`/pacientes/${paciente.id}`}
                      className="inline-flex items-center text-violet-600 hover:text-fuchsia-600 font-bold transition-colors group cursor-pointer px-4 py-2 hover:bg-violet-50 rounded-lg"
                    >
                      Ver Expediente
                      <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </td>
                </tr>
              ))}
              
              {pacientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <User size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-lg font-semibold">No hay pacientes registrados</p>
                    <p className="text-sm mt-1">Crea un paciente nuevo para comenzar.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
