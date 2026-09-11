import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Package, User, Search, CheckCircle, List, PlusCircle } from 'lucide-react';
import type { PaqueteSesion, Paciente } from '../types';
import Toast from '../components/common/Toast';
import CatalogoPaquetes from '../components/configuracion/CatalogoPaquetes';

export default function Paquetes() {
  const { usuarioActual } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'asignar' | 'catalogo'>('asignar');

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>('');
  
  const [paquetes, setPaquetes] = useState<PaqueteSesion[]>([]);
  const [selectedPaqueteId, setSelectedPaqueteId] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  useEffect(() => {
    if (usuarioActual?.clinica_id && activeTab === 'asignar') {
      fetchDatos();
    }
  }, [usuarioActual, activeTab]);

  const fetchDatos = async () => {
    setLoading(true);
    try {
      const [pacientesRes, paquetesRes] = await Promise.all([
        supabase.from('pacientes').select('*').order('nombre'),
        supabase.from('paquetes_sesiones').select('*').eq('clinica_id', usuarioActual!.clinica_id).eq('activo', true).order('nombre')
      ]);

      if (pacientesRes.data) setPacientes(pacientesRes.data as Paciente[]);
      if (paquetesRes.data) {
        setPaquetes(paquetesRes.data as PaqueteSesion[]);
        if (paquetesRes.data.length > 0) setSelectedPaqueteId(paquetesRes.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pacientesFiltrados = pacientes.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.dpi && p.dpi.includes(searchTerm))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioActual || !selectedPaqueteId || !selectedPacienteId) return;
    
    setIsSubmitting(true);
    const paqueteSeleccionado = paquetes.find(p => p.id === selectedPaqueteId);
    const pacienteSeleccionado = pacientes.find(p => p.id === selectedPacienteId);
    
    if (!paqueteSeleccionado || !pacienteSeleccionado) {
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Registrar el paquete al paciente
      const pacientePaquete = {
        clinica_id: usuarioActual.clinica_id,
        paciente_id: selectedPacienteId,
        paquete_id: selectedPaqueteId,
        sesiones_restantes: paqueteSeleccionado.num_sesiones,
        estado: 'activo'
      };

      const { error: errorPaquete } = await supabase.from('paciente_paquetes').insert([pacientePaquete]);
      if (errorPaquete) throw errorPaquete;

      // 2. Generar Factura Pendiente automáticamente
      const nuevaFactura = {
        clinica_id: usuarioActual.clinica_id,
        paciente_id: selectedPacienteId,
        monto_total: paqueteSeleccionado.precio,
        saldo_pendiente: paqueteSeleccionado.precio,
        estado: 'pendiente',
        concepto: `Venta de Paquete: ${paqueteSeleccionado.nombre}`,
        nombre_factura: pacienteSeleccionado.nombre,
        nit: 'C/F', // Ideally taken from paciente if available
        fecha_emision: new Date().toISOString()
      };

      const { error: errorFactura } = await supabase.from('facturas').insert([nuevaFactura]);
      if (errorFactura) throw errorFactura;

      setToast({ isVisible: true, message: 'Paquete asignado y factura generada exitosamente.', type: 'success' });
      setSelectedPacienteId(''); // Reset for next sale
      setSearchTerm('');
    } catch (error) {
      console.error('Error al vender paquete:', error);
      setToast({ isVisible: true, message: 'Hubo un error al procesar la venta del paquete.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center">
            <Package className="mr-3 text-violet-600" size={32} />
            Gestión de Paquetes
          </h2>
          <p className="text-slate-500 mt-1 ml-11">Crea nuevos paquetes o asígnalos a los pacientes.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('asignar')}
          className={`px-4 py-3 font-bold text-sm flex items-center transition-all ${
            activeTab === 'asignar' 
              ? 'text-violet-600 border-b-2 border-violet-600' 
              : 'text-slate-500 hover:text-violet-500'
          }`}
        >
          <ShoppingBag size={18} className="mr-2" />
          Asignar Paquete a Paciente
        </button>
        <button
          onClick={() => setActiveTab('catalogo')}
          className={`px-4 py-3 font-bold text-sm flex items-center transition-all ${
            activeTab === 'catalogo' 
              ? 'text-violet-600 border-b-2 border-violet-600' 
              : 'text-slate-500 hover:text-violet-500'
          }`}
        >
          <List size={18} className="mr-2" />
          Catálogo de Paquetes (Crear / Editar)
        </button>
      </div>

      {/* Tab Content: Asignar */}
      {activeTab === 'asignar' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 animate-in fade-in">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Columna Izquierda: Selección de Paciente */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <User className="mr-2 text-violet-500" size={20} />
                  1. Seleccionar Paciente
                </h3>
                
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar paciente por nombre o DPI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all font-medium text-sm"
                  />
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden h-[300px] flex flex-col">
                  <div className="overflow-y-auto flex-1 p-2 custom-scrollbar space-y-2">
                    {loading ? (
                      <div className="text-center py-8 text-slate-400 text-sm">Cargando pacientes...</div>
                    ) : pacientesFiltrados.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm">No se encontraron pacientes.</div>
                    ) : (
                      pacientesFiltrados.map(p => (
                        <label 
                          key={p.id} 
                          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedPacienteId === p.id 
                              ? 'bg-violet-50 border-violet-500 ring-1 ring-violet-500' 
                              : 'bg-white border-transparent hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paciente"
                            value={p.id!}
                            checked={selectedPacienteId === p.id}
                            onChange={(e) => setSelectedPacienteId(e.target.value)}
                            className="w-4 h-4 text-violet-600 focus:ring-violet-500 border-slate-300"
                          />
                          <div className="ml-3">
                            <span className="block text-sm font-bold text-slate-800">{p.nombre}</span>
                            {p.dpi && <span className="block text-xs text-slate-500">DPI: {p.dpi}</span>}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Selección de Paquete */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <Package className="mr-2 text-violet-500" size={20} />
                  2. Seleccionar Paquete
                </h3>

                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden h-[360px] flex flex-col p-4">
                  {loading ? (
                    <div className="text-center py-8 text-slate-400 text-sm flex-1 flex items-center justify-center">Cargando paquetes...</div>
                  ) : paquetes.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm flex-1 flex flex-col items-center justify-center">
                      <Package className="mb-2 opacity-30" size={32} />
                      No hay paquetes activos en el catálogo.
                    </div>
                  ) : (
                    <div className="overflow-y-auto flex-1 custom-scrollbar space-y-3 pr-2">
                      {paquetes.map(p => (
                        <label 
                          key={p.id} 
                          className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all duration-200 bg-white ${
                            selectedPaqueteId === p.id 
                              ? 'border-violet-500 shadow-md ring-1 ring-violet-500' 
                              : 'border-slate-200 hover:border-violet-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center h-5">
                            <input 
                              type="radio" 
                              name="paquete" 
                              value={p.id} 
                              checked={selectedPaqueteId === p.id}
                              onChange={(e) => setSelectedPaqueteId(e.target.value)}
                              className="w-4 h-4 text-violet-600 border-slate-300 focus:ring-violet-500" 
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <span className="block text-base font-bold text-slate-900">{p.nombre}</span>
                            <span className="block text-sm text-slate-500 mt-1">{p.num_sesiones} sesiones incluidas</span>
                            <div className="mt-3 text-right">
                              <span className="text-lg font-black text-violet-700">Q. {p.precio.toFixed(2)}</span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-500 flex items-center bg-amber-50 text-amber-700 px-4 py-2 rounded-lg font-medium">
                <CheckCircle size={16} className="mr-2" />
                Al confirmar, se generará una cuenta por cobrar automáticamente.
              </p>
              <button
                type="submit"
                disabled={isSubmitting || !selectedPacienteId || !selectedPaqueteId}
                className="w-full sm:w-auto px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl transition-all shadow-md shadow-violet-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center"
              >
                <ShoppingBag size={18} className="mr-2" />
                {isSubmitting ? 'Procesando Asignación...' : 'Confirmar y Asignar Paquete'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Content: Catalogo */}
      {activeTab === 'catalogo' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 animate-in fade-in">
          <CatalogoPaquetes />
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
