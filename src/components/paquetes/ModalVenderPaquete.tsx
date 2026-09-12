import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../context/AuthContext';
import { X, ShoppingBag, Package } from 'lucide-react';
import type { PaqueteSesion } from '../../types';

interface ModalVenderPaqueteProps {
  isOpen: boolean;
  onClose: () => void;
  pacienteId: string;
  onVentaCompletada: () => void;
}

export default function ModalVenderPaquete({ isOpen, onClose, pacienteId, onVentaCompletada }: ModalVenderPaqueteProps) {
  const { usuarioActual } = useAuth();
  const [paquetes, setPaquetes] = useState<PaqueteSesion[]>([]);
  const [selectedPaqueteId, setSelectedPaqueteId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && usuarioActual) {
      fetchPaquetesActivos();
    }
  }, [isOpen, usuarioActual]);

  const fetchPaquetesActivos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('paquetes_sesiones')
      .select('*')
      .eq('clinica_id', usuarioActual!.clinica_id)
      .eq('activo', true)
      .order('nombre');
    
    if (data) {
      setPaquetes(data as PaqueteSesion[]);
      if (data.length > 0) {
        setSelectedPaqueteId(data[0].id);
      }
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioActual || !selectedPaqueteId) return;
    
    setIsSubmitting(true);
    const paqueteSeleccionado = paquetes.find(p => p.id === selectedPaqueteId);
    
    if (!paqueteSeleccionado) {
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Registrar el paquete al paciente
      const pacientePaquete = {
        clinica_id: usuarioActual.clinica_id,
        paciente_id: pacienteId,
        paquete_id: selectedPaqueteId,
        sesiones_restantes: paqueteSeleccionado.num_sesiones,
        estado: 'activo'
      };

      const { error: errorPaquete } = await supabase.from('paciente_paquetes').insert([pacientePaquete]);
      if (errorPaquete) throw errorPaquete;

      // 2. Generar Factura Pendiente automáticamente
      const nuevaFactura = {
        clinica_id: usuarioActual.clinica_id,
        paciente_id: pacienteId,
        monto_total: paqueteSeleccionado.precio,
        saldo_pendiente: paqueteSeleccionado.precio,
        estado: 'pendiente',
        concepto: `Venta de Paquete: ${paqueteSeleccionado.nombre}`,
        nombre_factura: 'C/F',
        nit: 'C/F',
        fecha_emision: new Date().toISOString()
      };

      const { error: errorFactura } = await supabase.from('facturas').insert([nuevaFactura]);
      if (errorFactura) throw errorFactura;

      onVentaCompletada();
      onClose();
    } catch (error) {
      console.error('Error al vender paquete:', error);
      alert('Hubo un error al procesar la venta del paquete.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <ShoppingBag className="mr-2 text-violet-600" size={24} />
            Vender Paquete de Sesiones
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {loading ? (
            <div className="py-8 text-center text-slate-500">Cargando paquetes disponibles...</div>
          ) : paquetes.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <Package className="mx-auto mb-3 opacity-30" size={48} />
              No hay paquetes activos configurados en la clínica.
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Selecciona el paquete</label>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {paquetes.map(p => (
                  <label key={p.id} className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all duration-200 ${selectedPaqueteId === p.id ? 'border-violet-500 bg-violet-50/50 ring-1 ring-violet-500' : 'border-slate-200 hover:bg-slate-50'}`}>
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
                    <div className="ml-3 flex-1 flex justify-between">
                      <div>
                        <span className="block text-sm font-bold text-slate-900">{p.nombre}</span>
                        <span className="block text-xs text-slate-500">{p.num_sesiones} sesiones</span>
                      </div>
                      <span className="text-sm font-black text-violet-700">Q. {p.precio.toFixed(2)}</span>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-4 text-center">
                * Esto asignará las sesiones al paciente y creará automáticamente una Factura Pendiente de Cobro.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || paquetes.length === 0}
              className="px-5 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isSubmitting ? 'Procesando...' : 'Confirmar Venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
