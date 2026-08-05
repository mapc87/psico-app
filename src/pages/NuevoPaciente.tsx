import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, Mail, CreditCard, FileText, Save, X } from 'lucide-react';
import { db } from '../services/db/localDb';
import { useAuth } from '../context/AuthContext';

export default function NuevoPaciente() {
  const { usuarioActual } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    fechaNacimiento: '',
    dpi: '',
    telefono: '',
    correo: '',
    direccion: '',
    nit: 'CF',
    fechaIngreso: new Date().toISOString().split('T')[0], // Por defecto hoy
    
    // Datos del responsable (menores)
    nombreResponsable: '',
    parentesco: '',
    telefonoResponsable: '',
    ocupacionResponsable: '',
    estadoCivilPadres: '',
    notasDinamica: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioActual) {
      alert('Error: Sesión no válida.');
      return;
    }
    
    try {
      const nuevoPaciente = {
        ...formData,
        medicoId: usuarioActual.id
      };
      
      // Guardar en IndexedDB local
      await db.pacientes.add(nuevoPaciente);
      
      // Mostrar feedback y redirigir
      navigate('/pacientes', { state: { mensaje: 'Paciente guardado exitosamente.' } });
    } catch (error) {
      console.error('Error al guardar el paciente', error);
      alert('Hubo un error al guardar el paciente. Por favor intenta de nuevo.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header y Botón de Regresar */}
      <div className="flex items-center justify-between">
        <Link to="/pacientes" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-violet-600 transition-colors group">
          <ArrowLeft size={16} className="mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Volver a Pacientes
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">Agregar Nuevo Paciente</h2>
      </div>

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
                name="fechaNacimiento"
                required
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 text-slate-700"
                value={formData.fechaNacimiento}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Fecha de Ingreso al Consultorio <span className="text-red-500">*</span></label>
              <input 
                type="date" 
                name="fechaIngreso"
                required
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 text-slate-700"
                value={formData.fechaIngreso}
                onChange={handleChange}
              />
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
                name="nombreResponsable"
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300"
                placeholder="Ej. María Sánchez"
                value={formData.nombreResponsable}
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
                  name="telefonoResponsable"
                  className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300"
                  placeholder="Ej. 5555-4321"
                  value={formData.telefonoResponsable}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Ocupación</label>
              <input 
                type="text" 
                name="ocupacionResponsable"
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300"
                placeholder="Ej. Comerciante, Docente..."
                value={formData.ocupacionResponsable}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Estado Civil de los Padres</label>
              <select 
                name="estadoCivilPadres"
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 text-slate-700"
                value={formData.estadoCivilPadres}
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
                name="notasDinamica"
                rows={3}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 resize-none"
                placeholder="Ej. El niño vive principalmente con los abuelos maternos durante la semana..."
                value={formData.notasDinamica}
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
            onClick={() => navigate('/pacientes')}
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
            Guardar Paciente
          </button>
        </div>
        
      </form>
    </div>
  );
}
