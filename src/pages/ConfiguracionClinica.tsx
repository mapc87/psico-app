import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../context/AuthContext';
import { Settings, Save, Building2, Landmark, FileText, MapPin, Phone, Hash } from 'lucide-react';
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
  
  // SAT State
  const [nit, setNit] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [direccionFiscal, setDireccionFiscal] = useState('');
  const [noPatente, setNoPatente] = useState('');

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

    const updates = {
      nombre,
      nombre_comercial: nombreComercial,
      abreviatura,
      telefono_contacto: telefonoContacto,
      nit,
      razon_social: razonSocial,
      direccion_fiscal: direccionFiscal,
      no_patente: noPatente
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
        show={toastConfig.show} 
        message={toastConfig.message} 
        type={toastConfig.type} 
        onClose={() => setToastConfig(prev => ({ ...prev, show: false }))} 
      />
    </div>
  );
}
