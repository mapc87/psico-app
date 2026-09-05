import React, { useState } from 'react';
import { X, CreditCard, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../context/AuthContext';
import type { Factura } from '../../types';

interface ModalRegistrarPagoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  factura: Factura;
}

export default function ModalRegistrarPago({ isOpen, onClose, onSave, factura }: ModalRegistrarPagoProps) {
  const { usuarioActual } = useAuth();
  const [monto, setMonto] = useState(factura?.saldo_pendiente?.toString() || '');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'seguro'>('efectivo');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !factura) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || !usuarioActual) return;
    
    setIsSaving(true);
    try {
      const montoNum = parseFloat(monto);
      if (isNaN(montoNum) || montoNum <= 0) {
        alert("El monto debe ser mayor a 0.");
        setIsSaving(false);
        return;
      }
      
      if (montoNum > factura.saldo_pendiente) {
        alert("El monto no puede ser mayor al saldo pendiente de la factura.");
        setIsSaving(false);
        return;
      }

      // 1. Guardar el pago
      const nuevoPago = {
        clinica_id: usuarioActual.clinica_id,
        factura_id: factura.id,
        monto: montoNum,
        metodo_pago: metodoPago,
        fecha_pago: new Date().toISOString()
      };

      const { error: errorPago } = await supabase.from('pagos').insert([nuevoPago]);
      if (errorPago) throw errorPago;

      // 2. Actualizar la factura
      const nuevoSaldo = factura.saldo_pendiente - montoNum;
      let nuevoEstado = factura.estado;
      
      if (nuevoSaldo === 0) {
        nuevoEstado = 'pagada';
      } else if (nuevoSaldo < factura.monto_total) {
        nuevoEstado = 'parcial';
      }

      const { error: errorFactura } = await supabase
        .from('facturas')
        .update({ 
          saldo_pendiente: nuevoSaldo,
          estado: nuevoEstado 
        })
        .eq('id', factura.id);
        
      if (errorFactura) throw errorFactura;
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving pago:', error);
      alert('Ocurrió un error al registrar el pago.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div className="flex items-center text-teal-600 font-semibold">
            <CreditCard className="mr-2" size={24} />
            <h2>Registrar Pago</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
            <div className="text-sm text-slate-500 mb-1">Concepto de Factura</div>
            <div className="font-medium text-slate-800">{factura.concepto}</div>
            <div className="flex justify-between mt-3 pt-3 border-t border-slate-200">
              <span className="text-sm text-slate-500">Saldo Pendiente:</span>
              <span className="font-bold text-rose-600">Q. {factura.saldo_pendiente.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Monto a Pagar
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <span className="font-bold text-slate-400">Q.</span>
              </div>
              <input
                type="number"
                required
                min="0.01"
                max={factura.saldo_pendiente}
                step="0.01"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all duration-300"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Método de Pago
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['efectivo', 'tarjeta', 'transferencia', 'seguro'] as const).map((metodo) => (
                <button
                  key={metodo}
                  type="button"
                  onClick={() => setMetodoPago(metodo)}
                  className={`p-3 rounded-xl border font-medium text-sm transition-all duration-300 ${
                    metodoPago === metodo
                      ? 'bg-teal-50 border-teal-200 text-teal-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-teal-200 hover:bg-slate-50'
                  }`}
                >
                  {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20 disabled:opacity-70 flex items-center"
            >
              {isSaving ? 'Registrando...' : 'Confirmar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
