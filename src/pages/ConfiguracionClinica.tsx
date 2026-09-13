import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../context/AuthContext';
import { Settings, Save, Building2, Landmark, FileText, MapPin, Phone, Hash, Mail, Key, Eye, EyeOff , Upload, Image as ImageIcon} from 'lucide-react';
import Toast from '../components/common/Toast';
import type { Clinica } from '../types';

export default function ConfiguracionClinica() {
  const { usuarioActual } = useAuth();
  
  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastConfig, setToastConfig] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'info' });

  // Form State
  const [nombre, setNombre] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [abreviatura, setAbreviatura] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  
  // Email Config State
  const [resendApiKey, setResendApiKey] = useState('');
  const [emailRemitente, setEmailRemitente] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  
  // SAT State
  const [nit, setNit] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [direccionFiscal, setDireccionFiscal] = useState('');
  const [noPatente, setNoPatente] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (usuarioActual?.clinica_id) {
      fetchClinica(usuarioActual.clinica_id);
    }
  }, [usuarioActual]);

  const fetchClinica = async (clinicaId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clinicas')
      .select('*')
      .eq('id', clinicaId)
      .single();
      
    if (data && !error) {
      setClinica(data as Clinica);
      setNombre(data.nombre || '');
      setNombreComercial(data.nombre_comercial || '');
      setAbreviatura(data.abreviatura || '');
      setTelefonoContacto(data.telefono_contacto || '');
      
      setNit(data.nit || '');
      setRazonSocial(data.razon_social || '');
      setDireccionFiscal(data.direccion_fiscal || '');
      setNoPatente(data.no_patente || '');
      setLogoUrl(data.logo_url || '');

      // Email config from DB
      setResendApiKey(data.resend_api_key || '');
      setEmailRemitente(data.email_remitente || '');
    }
    setLoading(false);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastConfig({ show: true, message, type });
    setTimeout(() => {
      setToastConfig(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleGuardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioActual?.clinica_id) return;
    setSaving(true);

        let currentLogoUrl = clinica?.logo_url || '';
    if (logoFile) {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = ${usuarioActual.clinica_id}-.;
      const filePath = ${fileName};

      const { error: uploadError } = await supabase.storage
        .from('clinicas_logos')
        .upload(filePath, logoFile, { upsert: true });

      if (uploadError) {
        console.error('Error uploading logo:', uploadError);
        showToast('Error al subir el logo.', 'error');
        setSaving(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('clinicas_logos')
        .getPublicUrl(filePath);

      currentLogoUrl = publicUrl;
    }

    const updates = {
      nombre,
      nombre_comercial: nombreComercial,
      abreviatura,
      telefono_contacto: telefonoContacto,
      nit,
      razon_social: razonSocial,
      direccion_fiscal: direccionFiscal,
      no_patente: noPatente,
      resend_api_key: resendApiKey,
      email_remitente: emailRemitente,
      logo_url: currentLogoUrl,
    };

    const { error } = await supabase
      .from('clinicas')
      .update(updates)
      .eq('id', usuarioActual.clinica_id);

    if (!error) {
      showToast('Configuración de clínica actualizada correctamente.', 'success');
    } else {
      console.error(error);
      showToast('Error al guardar la configuración.', 'error');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <Settings className="text-violet-600" size={36} />
            Ajustes de Clínica
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Administra la información general y fiscal de tu clínica. Estos datos se utilizarán en facturas y consentimientos.
          </p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        <form onSubmit={handleGuardarConfiguracion} className="p-8 space-y-10">
          
          {/* Información Comercial */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-3">
              <Building2 className="text-violet-500 mr-2" size={20} />
              Información Comercial
            </h3>
            
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Section */}
              <div className="md:col-span-2 flex flex-col md:flex-row gap-6 items-center p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="w-32 h-32 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {logoUrl || logoFile ? (
                    <>
                      <img 
                        src={logoFile ? URL.createObjectURL(logoFile) : logoUrl} 
                        alt="Logo Cl�nica" 
                        className="w-full h-full object-contain p-2"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="text-white" size={24} />
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                      <ImageIcon size={32} className="mb-2" />
                      <span className="text-xs font-medium">Subir Logo</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        if (e.target.files[0].size > 2 * 1024 * 1024) {
                          showToast('El logo no debe superar los 2MB', 'error');
                          return;
                        }
                        setLogoFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Logo de la Cl�nica</h4>
                  <p className="text-sm text-slate-500 mb-3">Sube el logo de tu cl�nica para que aparezca en todas las recetas, facturas y reportes m�dicos.</p>
                  <p className="text-xs text-slate-400 bg-white px-3 py-1.5 rounded border border-slate-200 inline-block">JPG, PNG o SVG. M�ximo 2MB.</p>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Nombre de la Clínica (Interno)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Building2 size={18} />
                  </div>
                  <input 
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 font-medium text-slate-700"
                    placeholder="Ej. Clínica Bienestar"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Nombre Comercial (Público)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Building2 size={18} />
                  </div>
                  <input 
                    type="text"
                    value={nombreComercial}
                    onChange={(e) => setNombreComercial(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 font-medium text-slate-700"
                    placeholder="Nombre con el que te conocen tus pacientes"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Abreviatura / Siglas</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Hash size={18} />
                  </div>
                  <input 
                    type="text"
                    value={abreviatura}
                    onChange={(e) => setAbreviatura(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 font-medium text-slate-700"
                    placeholder="Ej. CB"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Teléfono Oficial de Contacto</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Phone size={18} />
                  </div>
                  <input 
                    type="text"
                    value={telefonoContacto}
                    onChange={(e) => setTelefonoContacto(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 font-medium text-slate-700"
                    placeholder="Ej. +502 1234 5678"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Información Fiscal (SAT) */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-3">
              <Landmark className="text-violet-500 mr-2" size={20} />
              Datos Fiscales (SAT)
            </h3>
            
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Section */}
              <div className="md:col-span-2 flex flex-col md:flex-row gap-6 items-center p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="w-32 h-32 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {logoUrl || logoFile ? (
                    <>
                      <img 
                        src={logoFile ? URL.createObjectURL(logoFile) : logoUrl} 
                        alt="Logo Cl�nica" 
                        className="w-full h-full object-contain p-2"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="text-white" size={24} />
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                      <ImageIcon size={32} className="mb-2" />
                      <span className="text-xs font-medium">Subir Logo</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        if (e.target.files[0].size > 2 * 1024 * 1024) {
                          showToast('El logo no debe superar los 2MB', 'error');
                          return;
                        }
                        setLogoFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Logo de la Cl�nica</h4>
                  <p className="text-sm text-slate-500 mb-3">Sube el logo de tu cl�nica para que aparezca en todas las recetas, facturas y reportes m�dicos.</p>
                  <p className="text-xs text-slate-400 bg-white px-3 py-1.5 rounded border border-slate-200 inline-block">JPG, PNG o SVG. M�ximo 2MB.</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">NIT</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <FileText size={18} />
                  </div>
                  <input 
                    type="text"
                    value={nit}
                    onChange={(e) => setNit(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 font-medium text-slate-700"
                    placeholder="Ej. 1234567-8"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">No. Patente de Comercio (Opcional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Hash size={18} />
                  </div>
                  <input 
                    type="text"
                    value={noPatente}
                    onChange={(e) => setNoPatente(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 font-medium text-slate-700"
                    placeholder="Número de registro mercantil"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Razón Social (Nombre Legal ante SAT)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Landmark size={18} />
                  </div>
                  <input 
                    type="text"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 font-medium text-slate-700"
                    placeholder="Ej. Servicios Médicos S.A."
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Dirección Fiscal Registrada</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 top-3 pointer-events-none text-slate-400">
                    <MapPin size={18} />
                  </div>
                  <textarea 
                    rows={3}
                    value={direccionFiscal}
                    onChange={(e) => setDireccionFiscal(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 font-medium text-slate-700 resize-none"
                    placeholder="Dirección exacta registrada en la SAT..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Configuración de Correo Electrónico */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center border-b border-slate-100 pb-3">
              <Mail className="text-violet-500 mr-2" size={20} />
              Configuración de Correo Electrónico
            </h3>
            <p className="text-sm text-slate-500 mb-6">Configura tu cuenta de <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-violet-600 font-semibold hover:underline">Resend.com</a> para enviar correos reales (consentimientos, recetas, citas). Sin esta configuración el sistema funciona en modo demo (sin envíos reales).</p>
            
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Section */}
              <div className="md:col-span-2 flex flex-col md:flex-row gap-6 items-center p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="w-32 h-32 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {logoUrl || logoFile ? (
                    <>
                      <img 
                        src={logoFile ? URL.createObjectURL(logoFile) : logoUrl} 
                        alt="Logo Cl�nica" 
                        className="w-full h-full object-contain p-2"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="text-white" size={24} />
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                      <ImageIcon size={32} className="mb-2" />
                      <span className="text-xs font-medium">Subir Logo</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        if (e.target.files[0].size > 2 * 1024 * 1024) {
                          showToast('El logo no debe superar los 2MB', 'error');
                          return;
                        }
                        setLogoFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Logo de la Cl�nica</h4>
                  <p className="text-sm text-slate-500 mb-3">Sube el logo de tu cl�nica para que aparezca en todas las recetas, facturas y reportes m�dicos.</p>
                  <p className="text-xs text-slate-400 bg-white px-3 py-1.5 rounded border border-slate-200 inline-block">JPG, PNG o SVG. M�ximo 2MB.</p>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">API Key de Resend</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Key size={18} />
                  </div>
                  <input 
                    type={showApiKey ? 'text' : 'password'}
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 font-mono text-sm text-slate-700"
                    placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(v => !v)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-violet-600"
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">Obtén tu API key gratis en <span className="font-semibold">resend.com → API Keys</span>.</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Correo Remitente (From)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email"
                    value={emailRemitente}
                    onChange={(e) => setEmailRemitente(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 font-medium text-slate-700"
                    placeholder="noreply@tuclinica.com"
                  />
                </div>
                <p className="text-xs text-slate-400">Debe ser un dominio verificado en Resend. Si lo dejas vacío, se usará <span className="font-mono">onboarding@resend.dev</span> (solo para pruebas).</p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-8 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 transition-all duration-300 disabled:opacity-50 hover:-translate-y-0.5 cursor-pointer"
            >
              {saving ? 'Guardando...' : (
                <>
                  <Save size={20} className="mr-2" />
                  Guardar Configuración
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <Toast 
        isVisible={toastConfig.show} 
        message={toastConfig.message} 
        type={toastConfig.type} 
        onClose={() => setToastConfig(prev => ({ ...prev, show: false }))} 
      />
    </div>
  );
}
