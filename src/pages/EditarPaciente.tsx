import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, Mail, CreditCard, FileText, Save, X, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/common/Toast';

export default function EditarPaciente() {
  const { id } = useParams();
  const { usuarioActual } = useAuth();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    fecha_nacimiento: '',
    dpi: '',
    telefono: '',
    correo: '',
    direccion: '',
    nit: 'CF',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    
    nombre_responsable: '',
    parentesco: '',
    telefono_responsable: '',
    ocupacion_responsable: '',
    estado_civil_padres: '',
    notas_dinamica: '',
    estado: 'activo',
    pin_acceso: ''
  });

  const [permisos, setPermisos] = useState<Record<string, boolean> | null>(null);
  const [showPinConfirm, setShowPinConfirm] = useState(false);
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type?: 'success' | 'error' | 'info' }>({
    isVisible: false,
    message: ''
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3500);
  };

  useEffect(() => {
    const fetchPermisos = async () => {
      if (usuarioActual?.rol_id) {
        const { data: rData } = await supabase.from('roles').select('permisos').eq('id', usuarioActual.rol_id).single();
        if (rData) setPermisos(rData.permisos);
      }
    };
    fetchPermisos();
  }, [usuarioActual?.rol_id]);

  useEffect(() => {
    const fetchPaciente = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase.from('pacientes').select('*').eq('id', id).single();
        if (error) throw error;
        if (data) {
          // Fill form data with existing data, handling nulls
          setFormData({
            nombre: data.nombre || '',
            fecha_nacimiento: data.fecha_nacimiento || '',
            dpi: data.dpi || '',
            telefono: data.telefono || '',
            correo: data.correo || '',
            direccion: data.direccion || '',
            nit: data.nit || 'CF',
            fecha_ingreso: data.fecha_ingreso || new Date().toISOString().split('T')[0],
            nombre_responsable: data.nombre_responsable || '',
            parentesco: data.parentesco || '',
            telefono_responsable: data.telefono_responsable || '',
            ocupacion_responsable: data.ocupacion_responsable || '',
            estado_civil_padres: data.estado_civil_padres || '',
            notas_dinamica: data.notas_dinamica || '',
            estado: data.estado || 'activo',
            pin_acceso: data.pin_acceso || ''
          });
        }
      } catch (error) {
        console.error('Error al cargar el paciente:', error);
      } finally {
        setCargando(false);
      }
    };
    fetchPaciente();
  }, [id]);

  const canEdit = usuarioActual?.rol === 'superadmin' || usuarioActual?.rol === 'admin' || (permisos && permisos.editarPaciente);

  if (permisos !== null && !canEdit) {
    return (
      <div className="p-12 text-center text-red-500">
        <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
        <p>No tienes permiso para editar los datos de pacientes.</p>
        <Link to="/pacientes" className="mt-4 inline-block px-4 py-2 bg-violet-100 text-violet-700 rounded-lg font-bold">
          Volver a Pacientes
        </Link>
      </div>
    );
  }

  if (cargando) {
    return <div className="p-12 text-center text-slate-500">Cargando datos del paciente...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioActual || !id) {
      showToast('Error: Sesión no válida o paciente no encontrado.', 'error');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('pacientes')
        .update(formData)
        .eq('id', id);
      
      if (error) throw error;
      
      showToast('Paciente actualizado exitosamente.', 'success');
      setTimeout(() => {
        navigate(`/pacientes`, { state: { mensaje: 'Paciente actualizado exitosamente.' } });
      }, 1500);
    } catch (error) {
      console.error('Error al actualizar el paciente', error);
      showToast('Hubo un error al actualizar el paciente. Por favor intenta de nuevo.', 'error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!usuarioActual?.clinica_id) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 mt-12 p-8 bg-red-50 border border-red-200 rounded-2xl text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error Crítico: Clínica no asignada</h2>
        <p className="text-slate-700">Tu usuario actual ({usuarioActual?.email}) <strong>NO tiene una clínica asignada</strong> (clinica_id es nulo).</p>
        <p className="text-slate-700 mt-2">Por las reglas de seguridad (RLS), es imposible guardar un paciente sin asignar a qué clínica pertenece. Si estás usando la cuenta "SuperAdmin" del sistema, recuerda que los SuperAdmins no pueden crear pacientes directamente; debes crear una clínica y luego iniciar sesión con el administrador de esa clínica.</p>
        <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700">Regresar</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header y Botón de Regresar */}
      <div className="flex items-center justify-between">
        <Link to={`/pacientes`} className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-violet-600 transition-colors group">
          <ArrowLeft size={16} className="mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Volver a Pacientes
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">Editar Paciente</h2>
      </div>

      {cargando ? (
        <div className="p-12 text-center text-slate-500">Cargando expediente...</div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* SECCIÓN 1: Datos Personales */}
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 mr-4">
              <User size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Datos Personales</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-600 mb-2">DPI (Documento de Identificación)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FileText size={18} className="text-slate-400" />
                </div>
                <input 
                  type="text" 
                  name="dpi"
                  className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300"
                  placeholder="Ej. 1234 56789 0101 (Opcional)"
                  value={formData.dpi}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-600 mb-2">PIN de Acceso (Portal del Paciente)</label>
              <div className="p-4 bg-violet-50 text-violet-700 font-bold rounded-xl border border-violet-100 flex items-center justify-between">
                <span className="tracking-[0.2em] text-xl">{formData.pin_acceso || 'No asignado'}</span>
                <button
                  type="button"
                  onClick={() => setShowPinConfirm(true)}
                  className="px-4 py-2 bg-white rounded-lg text-sm hover:bg-violet-100 transition-colors cursor-pointer"
                >
                  Generar Nuevo
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-600 mb-2">Nombre Completo <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="nombre"
                required
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300"
                placeholder="Ej. Juan Pérez"
                value={formData.nombre}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Fecha de Nacimiento <span className="text-red-500">*</span></label>
              <input 
                type="date" 
                name="fecha_nacimiento"
                required
                min="1900-01-01"
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 text-slate-700"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Fecha de Ingreso al Consultorio <span className="text-red-500">*</span></label>
              <input 
                type="date" 
                name="fecha_ingreso"
                required
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 text-slate-700"
                value={formData.fecha_ingreso}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Estado del Paciente</label>
              <select 
                name="estado"
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 text-slate-700"
                value={formData.estado}
                onChange={handleChange}
              >
                <option value="activo">Activo</option>
                <option value="baja">De Baja</option>
                <option value="alta">De Alta</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Datos del Responsable (Opcional - Para Menores) */}
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mr-4">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Datos del Responsable</h3>
              <p className="text-sm text-slate-500">Opcional. Llenar solo si el paciente es menor de edad.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-600 mb-2">Nombre Completo del Responsable</label>
              <input 
                type="text" 
                name="nombre_responsable"
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300"
                placeholder="Ej. María Sánchez"
                value={formData.nombre_responsable}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Parentesco</label>
              <select 
                name="parentesco"
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 text-slate-700"
                value={formData.parentesco}
                onChange={handleChange as any}
              >
                <option value="">Seleccione...</option>
                <option value="madre">Madre</option>
                <option value="padre">Padre</option>
                <option value="abuelo">Abuelo(a)</option>
                <option value="tutor">Tutor Legal</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Teléfono del Responsable</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone size={18} className="text-slate-400" />
                </div>
                <input 
                  type="text" 
                  name="telefono_responsable"
                  className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300"
                  placeholder="Ej. 5555-4321"
                  value={formData.telefono_responsable}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Ocupación</label>
              <input 
                type="text" 
                name="ocupacion_responsable"
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300"
                placeholder="Ej. Comerciante, Docente..."
                value={formData.ocupacion_responsable}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Estado Civil de los Padres</label>
              <select 
                name="estado_civil_padres"
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 text-slate-700"
                value={formData.estado_civil_padres}
                onChange={handleChange as any}
              >
                <option value="">Seleccione...</option>
                <option value="casados">Casados</option>
                <option value="separados">Separados</option>
                <option value="divorciados">Divorciados</option>
                <option value="union_libre">Unión Libre</option>
                <option value="soltero">Madre/Padre Soltero</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-600 mb-2">Notas de Dinámica Familiar</label>
              <textarea 
                name="notas_dinamica"
                rows={3}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 resize-none"
                placeholder="Ej. El niño vive principalmente con los abuelos maternos durante la semana..."
                value={formData.notas_dinamica}
                onChange={handleChange as any}
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Datos de Contacto */}
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
              <Phone size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Datos de Contacto</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Teléfono <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone size={18} className="text-slate-400" />
                </div>
                <input 
                  type="text" 
                  name="telefono"
                  required
                  className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300"
                  placeholder="Ej. 5555-1234"
                  value={formData.telefono}
                  onChange={handleChange}
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
                  name="correo"
                  className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300"
                  placeholder="Ej. paciente@correo.com"
                  value={formData.correo}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-600 mb-2">Dirección de Residencia</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 pt-3.5 pointer-events-none">
                  <MapPin size={18} className="text-slate-400" />
                </div>
                <input 
                  type="text" 
                  name="direccion"
                  className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300"
                  placeholder="Ej. 5ta Avenida 3-15 Zona 1, Ciudad"
                  value={formData.direccion}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Datos de Facturación */}
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-4">
              <CreditCard size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Datos de Facturación</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">NIT</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FileText size={18} className="text-slate-400" />
                </div>
                <input 
                  type="text" 
                  name="nit"
                  className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300"
                  placeholder="Ej. 123456-7"
                  value={formData.nit}
                  onChange={handleChange}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">Si el paciente no proporciona NIT, se usará CF (Consumidor Final).</p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end space-x-4 pt-4 pb-12">
          <button 
            type="button"
            onClick={() => navigate(`/pacientes`)}
            className="flex items-center px-6 py-3 text-slate-600 font-bold hover:bg-white rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200"
          >
            <X size={18} className="mr-2" />
            Cancelar
          </button>
          <button 
            type="submit"
            className="flex items-center px-8 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 cursor-pointer"
          >
            <Save size={18} className="mr-2" />
            Actualizar Paciente
          </button>
        </div>
        
      </form>
      )}

      {/* Modal Confirmación de PIN */}
      {showPinConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4 text-amber-600">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">¿Generar nuevo PIN?</h3>
              <p className="text-slate-600 text-sm mb-6">
                El paciente ya no podrá acceder a su portal con el PIN anterior. Deberás comunicarle el nuevo código generado.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPinConfirm(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const nuevoPin = Math.floor(100000 + Math.random() * 900000).toString();
                    setFormData({...formData, pin_acceso: nuevoPin});
                    setShowPinConfirm(false);
                    
                    // Auto-guardar el PIN en la base de datos
                    if (id) {
                      try {
                        const { error } = await supabase.from('pacientes').update({ pin_acceso: nuevoPin }).eq('id', id);
                        if (error) throw error;
                        showToast('El nuevo PIN ha sido generado y guardado exitosamente.', 'success');
                      } catch (err) {
                        console.error('Error auto-guardando PIN:', err);
                        showToast('El PIN se generó pero hubo un error al guardarlo automáticamente. Por favor, presiona "Actualizar Paciente".', 'error');
                      }
                    }
                  }}
                  className="px-4 py-2 font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors shadow-lg shadow-amber-500/30"
                >
                  Generar Nuevo PIN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast 
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
