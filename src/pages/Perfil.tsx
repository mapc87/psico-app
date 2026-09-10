import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Save, Shield, Phone, MapPin, Briefcase, CreditCard, Award, Calendar, ChevronDown } from 'lucide-react';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/common/Toast';

const inputClass = "w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 font-medium text-slate-700";
const labelClass = "text-sm font-bold text-slate-700";
const iconWrapClass = "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400";

export default function Perfil() {
  const { usuarioActual } = useAuth();

  // --- Información Básica ---
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');

  // --- Información de Contacto ---
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  // --- Información Personal ---
  const [dpi, setDpi] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [genero, setGenero] = useState('');

  // --- Información Profesional ---
  const [profesion, setProfesion] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [noColegiado, setNoColegiado] = useState('');

  // --- Seguridad ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [toastConfig, setToastConfig] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (usuarioActual) {
      setNombre(usuarioActual.nombre || '');
      setEmail(usuarioActual.email || '');
      setTelefono(usuarioActual.telefono || '');
      setDireccion(usuarioActual.direccion || '');
      setDpi(usuarioActual.dpi || '');
      setFechaNacimiento(usuarioActual.fecha_nacimiento || '');
      setGenero(usuarioActual.genero || '');
      setProfesion(usuarioActual.profesion || '');
      setEspecialidad(usuarioActual.especialidad || '');
      setNoColegiado(usuarioActual.no_colegiado || '');
    }
  }, [usuarioActual]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastConfig({ show: true, message, type });
    setTimeout(() => setToastConfig(prev => ({ ...prev, show: false })), 3500);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioActual) return;

    if (password && password !== confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }

    setLoading(true);

    try {
      // 1. Verificar contraseña actual si se quiere cambiar
      if (password) {
        if (!currentPassword) {
          showToast('Debes ingresar tu contraseña actual para poder cambiarla', 'error');
          setLoading(false);
          return;
        }
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: usuarioActual.email || email,
          password: currentPassword
        });
        if (verifyError) {
          showToast('La contraseña actual es incorrecta', 'error');
          setLoading(false);
          return;
        }
      }

      // 2. Actualizar Auth (email y/o contraseña)
      let emailUpdated = false;
      let passwordUpdated = false;
      const authUpdates: any = {};
      if (email !== usuarioActual.email) authUpdates.email = email;
      if (password) authUpdates.password = password;

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) throw authError;
        if (authUpdates.email) emailUpdated = true;
        if (authUpdates.password) passwordUpdated = true;
      }

      // 3. Actualizar tabla usuarios con todos los campos
      const { error: dbError } = await supabase
        .from('usuarios')
        .update({
          nombre,
          email,
          telefono: telefono || null,
          direccion: direccion || null,
          dpi: dpi || null,
          fecha_nacimiento: fechaNacimiento || null,
          genero: genero || null,
          profesion: profesion || null,
          especialidad: especialidad || null,
          no_colegiado: noColegiado || null,
        })
        .eq('id', usuarioActual.id);

      if (dbError) throw dbError;

      // 4. Feedback
      if (emailUpdated) {
        showToast('Perfil actualizado. Revisa tu correo para confirmar el cambio de dirección.', 'success');
      } else {
        showToast('Perfil actualizado exitosamente', 'success');
        if (passwordUpdated) {
          setCurrentPassword('');
          setPassword('');
          setConfirmPassword('');
        }
        setTimeout(() => window.location.reload(), 1500);
      }

    } catch (error: any) {
      console.error('Error actualizando perfil:', error);
      showToast(error.message || 'Hubo un error al actualizar el perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
      <span className="text-slate-400">{icon}</span>
      {title}
    </h3>
  );

  const Field = ({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="space-y-2">
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <div className={iconWrapClass}>{icon}</div>
        {children}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-100 to-fuchsia-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <User className="text-violet-600" size={32} />
            Mi Perfil
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Administra tu información personal y credenciales de acceso.</p>
        </div>
        {/* Avatar inicial */}
        <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-violet-300/40">
          {nombre.charAt(0).toUpperCase() || '?'}
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-6">

        {/* ── Información Básica ── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8">
          <SectionTitle icon={<Shield size={20} />} title="Información Básica" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Nombre Completo" icon={<User size={18} />}>
              <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)}
                className={inputClass} placeholder="Tu nombre completo" />
            </Field>
            <Field label="Correo Electrónico" icon={<Mail size={18} />}>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className={inputClass} placeholder="tu@correo.com" />
            </Field>
          </div>
        </div>

        {/* ── Información de Contacto ── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8">
          <SectionTitle icon={<Phone size={20} />} title="Información de Contacto" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Teléfono" icon={<Phone size={18} />}>
              <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
                className={inputClass} placeholder="+502 0000-0000" />
            </Field>
            <Field label="Dirección" icon={<MapPin size={18} />}>
              <input type="text" value={direccion} onChange={e => setDireccion(e.target.value)}
                className={inputClass} placeholder="Ciudad, País" />
            </Field>
          </div>
        </div>

        {/* ── Información Personal ── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8">
          <SectionTitle icon={<CreditCard size={20} />} title="Información Personal" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="DPI / Documento de Identidad" icon={<CreditCard size={18} />}>
              <input type="text" value={dpi} onChange={e => setDpi(e.target.value)}
                className={inputClass} placeholder="0000 00000 0000" />
            </Field>
            <Field label="Fecha de Nacimiento" icon={<Calendar size={18} />}>
              <input type="date" value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)}
                className={inputClass} />
            </Field>
            <Field label="Género" icon={<User size={18} />}>
              <select value={genero} onChange={e => setGenero(e.target.value)}
                className={`${inputClass} appearance-none`}>
                <option value="">-- Seleccionar --</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
                <option value="prefiero_no_decir">Prefiero no decir</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                <ChevronDown size={16} />
              </div>
            </Field>
          </div>
        </div>

        {/* ── Información Profesional ── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8">
          <SectionTitle icon={<Briefcase size={20} />} title="Información Profesional" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Profesión" icon={<Briefcase size={18} />}>
              <input type="text" value={profesion} onChange={e => setProfesion(e.target.value)}
                className={inputClass} placeholder="Ej: Psicólogo Clínico" />
            </Field>
            <Field label="Especialidad" icon={<Award size={18} />}>
              <input type="text" value={especialidad} onChange={e => setEspecialidad(e.target.value)}
                className={inputClass} placeholder="Ej: Terapia Cognitivo-Conductual" />
            </Field>
            <Field label="No. Colegiado" icon={<Award size={18} />}>
              <input type="text" value={noColegiado} onChange={e => setNoColegiado(e.target.value)}
                className={inputClass} placeholder="Ej: 12345" />
            </Field>
          </div>
        </div>

        {/* ── Seguridad ── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8">
          <SectionTitle icon={<Lock size={20} />} title="Seguridad" />
          <p className="text-sm text-slate-500 mb-6 -mt-2">Si no deseas cambiar tu contraseña, deja estos campos en blanco.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Contraseña Actual" icon={<Lock size={18} />}>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                className={inputClass} placeholder="••••••••" />
            </Field>
            <Field label="Nueva Contraseña" icon={<Lock size={18} />}>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className={inputClass} placeholder="••••••••" />
            </Field>
            <Field label="Confirmar Nueva Contraseña" icon={<Lock size={18} />}>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className={inputClass} placeholder="••••••••" />
            </Field>
          </div>
        </div>

        {/* ── Botón Guardar ── */}
        <div className="flex justify-end pb-4">
          <button type="submit" disabled={loading}
            className="flex items-center px-8 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5">
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Guardando...
              </span>
            ) : (
              <>
                <Save size={20} className="mr-2" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>

      <Toast
        show={toastConfig.show}
        message={toastConfig.message}
        type={toastConfig.type}
        onClose={() => setToastConfig(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}
