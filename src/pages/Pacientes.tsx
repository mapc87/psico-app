import { useState, useEffect } from 'react';
import { Search, Plus, User, Users, FolderOpen, Edit2, UserCog, X, Save } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../context/AuthContext';
import type { Paciente } from '../types';

export default function Pacientes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'activo' | 'baja' | 'alta' | 'todos'>('activo');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteParaEstado, setPacienteParaEstado] = useState<Paciente | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<'activo' | 'baja' | 'alta'>('activo');
  const [actualizandoEstado, setActualizandoEstado] = useState(false);
  const location = useLocation();
  const mensajeExito = location.state?.mensaje;

  const [permisos, setPermisos] = useState<Record<string, boolean> | null>(null);

  const { usuarioActual } = useAuth();

  useEffect(() => {
    const fetchPacientes = async () => {
      if (!usuarioActual?.clinica_id) return;
      
      if (usuarioActual.rol_id) {
        const { data: rData } = await supabase.from('roles').select('permisos').eq('id', usuarioActual.rol_id).single();
        if (rData) setPermisos(rData.permisos);
      }

      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setPacientes(data as Paciente[]);
      }
    };
    
    fetchPacientes();
  }, [usuarioActual?.clinica_id, usuarioActual?.rol_id]);

  const calcularEdad = (fechaNacimiento: string | undefined | null) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return Math.max(0, edad);
  };

  const handleActualizarEstado = async () => {
    if (!pacienteParaEstado) return;
    
    setActualizandoEstado(true);
    
    const { error } = await supabase
      .from('pacientes')
      .update({ estado: nuevoEstado })
      .eq('id', pacienteParaEstado.id);
      
    if (!error) {
      setPacientes(pacientes.map(p => 
        p.id === pacienteParaEstado.id ? { ...p, estado: nuevoEstado } : p
      ));
      setPacienteParaEstado(null);
    } else {
      alert('Error al actualizar el estado del paciente.');
    }
    
    setActualizandoEstado(false);
  };

  const pacientesFiltrados = pacientes.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (p.dpi && p.dpi.includes(searchTerm));
                         
    if (filtroEstado === 'todos') return matchesSearch;
    return matchesSearch && p.estado === filtroEstado;
  });

  const canEdit = usuarioActual?.rol === 'superadmin' || usuarioActual?.rol === 'admin' || permisos?.editarPaciente;
  const canChangeState = usuarioActual?.rol === 'superadmin' || usuarioActual?.rol === 'admin' || permisos?.cambiarEstadoPaciente;
  const canViewExpediente = usuarioActual?.rol === 'superadmin' || usuarioActual?.rol === 'admin' || permisos?.verExpediente;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl shadow-sm flex items-center mb-6 animate-in fade-in slide-in-from-top-2">
          <div className="bg-emerald-100 p-2 rounded-full mr-3">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <span className="font-medium">{mensajeExito}</span>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="text-violet-600" size={32} />
            Directorio de Pacientes
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Gestiona tu base de pacientes y expedientes clínicos.</p>
        </div>
        
        {/* Controles: Buscador + Agregar */}
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <div className="relative group flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Buscar paciente..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link 
            to="/pacientes/nuevo" 
            className="flex justify-center items-center px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md shadow-violet-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus size={20} className="mr-2" />
            Nuevo Paciente
          </Link>
        </div>
      </div>
      
      {/* Filtros de Estado */}
      <div className="flex flex-wrap gap-2 px-1">
        <button
          onClick={() => setFiltroEstado('activo')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            filtroEstado === 'activo' 
              ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Activos
        </button>
        <button
          onClick={() => setFiltroEstado('todos')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            filtroEstado === 'todos' 
              ? 'bg-slate-800 text-white shadow-md shadow-slate-800/20' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Todos (Histórico)
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Edad</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Ingreso</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pacientesFiltrados.map((paciente) => (
                <tr key={paciente.id} className="hover:bg-violet-50/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs mr-3">
                        {paciente.nombre.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">{paciente.nombre}</span>
                        {filtroEstado === 'todos' && (paciente.estado === 'baja' || paciente.estado === 'alta') && (
                          <span className={"text-xs font-medium " + (paciente.estado === 'baja' ? 'text-red-500' : 'text-emerald-500')}>
                            {paciente.estado === 'baja' ? 'De baja' : 'De alta'}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                    {paciente.fecha_nacimiento ? `${calcularEdad(paciente.fecha_nacimiento)} años` : <span className="text-slate-400 italic">No registrada</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{paciente.telefono}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{paciente.fecha_ingreso}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                    <div className="flex justify-end space-x-2">
                      {canChangeState && (
                        <button 
                          onClick={() => {
                            setPacienteParaEstado(paciente);
                            setNuevoEstado(paciente.estado || 'activo');
                          }}
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Cambiar Estado"
                        >
                          <UserCog size={18} />
                        </button>
                      )}
                      {canEdit && (
                        <Link 
                          to={`/pacientes/${paciente.id}/editar`}
                          className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar Paciente"
                        >
                          <Edit2 size={18} />
                        </Link>
                      )}
                      {canViewExpediente && (
                        <Link 
                          to={`/pacientes/${paciente.id}`}
                          className="p-2 text-slate-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors cursor-pointer"
                          title="Ver Expediente"
                        >
                          <FolderOpen size={18} />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {pacientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <User size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-lg font-semibold">No hay pacientes {filtroEstado !== 'todos' ? filtroEstado + 's' : ''}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para cambiar estado */}
      {pacienteParaEstado && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Cambiar Estado</h3>
              <button 
                onClick={() => setPacienteParaEstado(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Selecciona el nuevo estado para el paciente <strong className="text-slate-800">{pacienteParaEstado.nombre}</strong>:
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setNuevoEstado('activo')}
                  className={`py-3 px-2 rounded-xl transition-all border-2 ${
                    nuevoEstado === 'activo' 
                      ? 'border-violet-500 bg-violet-50 text-violet-700' 
                      : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-sm block">Activo</span>
                </button>
                <button
                  onClick={() => setNuevoEstado('baja')}
                  className={`py-3 px-2 rounded-xl transition-all border-2 ${
                    nuevoEstado === 'baja' 
                      ? 'border-red-500 bg-red-50 text-red-700' 
                      : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-sm block">De Baja</span>
                </button>
                <button
                  onClick={() => setNuevoEstado('alta')}
                  className={`py-3 px-2 rounded-xl transition-all border-2 ${
                    nuevoEstado === 'alta' 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                      : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-sm block">De Alta</span>
                </button>
              </div>
              
              <div className="mt-8 flex justify-end space-x-3">
                <button 
                  onClick={() => setPacienteParaEstado(null)}
                  className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                  disabled={actualizandoEstado}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleActualizarEstado}
                  disabled={actualizandoEstado}
                  className="flex items-center px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl transition-all shadow-md shadow-violet-500/20 hover:shadow-violet-500/40 disabled:opacity-50"
                >
                  {actualizandoEstado ? 'Guardando...' : (
                    <>
                      <Save size={18} className="mr-2" />
                      Guardar Estado
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
