import React, { useState, useEffect } from 'react';
import { X, Receipt, Calendar, DollarSign, Tag, Users } from 'lucide-react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../context/AuthContext';

interface ModalNuevaFacturaGlobalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function ModalNuevaFacturaGlobal({ isOpen, onClose, onSave }: ModalNuevaFacturaGlobalProps) {
  const { usuarioActual } = useAuth();
  const [pacienteId, setPacienteId] = useState('');
  const [nit, setNit] = useState('CF');
  const [nombreFactura, setNombreFactura] = useState('');
  const [direccion, setDireccion] = useState('Ciudad');
  const [serie, setSerie] = useState('');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [concepto, setConcepto] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [pacientes, setPacientes] = useState<{id: string, nombre: string}[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(false);

  useEffect(() => {
    if (isOpen && usuarioActual?.clinica_id) {
      const fetchPacientes = async () => {
        setLoadingPacientes(true);
        const { data } = await supabase
          .from('pacientes')
          .select('id, nombre')
          .eq('clinica_id', usuarioActual.clinica_id)
          .order('nombre', { ascending: true });
        
        if (data) setPacientes(data);
        setLoadingPacientes(false);
      };
      fetchPacientes();
    }
  }, [isOpen, usuarioActual?.clinica_id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto || !montoTotal || !usuarioActual || !nombreFactura) return;
    
    setIsSaving(true);
    try {
      const montoNum = parseFloat(montoTotal);
      if (isNaN(montoNum) || montoNum <= 0) {
        alert("El monto debe ser un número válido mayor a 0.");
        setIsSaving(false);
        return;
      }

      const nuevaFactura = {
        clinica_id: usuarioActual.clinica_id,
        paciente_id: pacienteId || null,
        monto_total: montoNum,
        saldo_pendiente: montoNum,
        estado: 'pendiente',
        concepto,
        nit,
        nombre_factura: nombreFactura,
        direccion,
        serie: serie || null,
        numero_factura: numeroFactura || null,
        fecha_emision: new Date().toISOString().split('T')[0],
        fecha_vencimiento: fechaVencimiento || null
      };

      const { error } = await supabase.from('facturas').insert([nuevaFactura]);
      if (error) {
        console.error("Error al crear factura:", error);
        throw error;
      }
      
      onSave();
      onClose();
      // Limpiar formulario
      setPacienteId('');
      setConcepto('');
      setMontoTotal('');
      setFechaVencimiento('');
    } catch (error) {
      console.error('Error saving factura:', error);
      alert('Ocurrió un error al guardar la factura.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div className="flex items-center text-emerald-600 font-semibold">
            <Receipt className="mr-2" size={24} />
            <h2>Emitir Nueva Factura</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Paciente (Opcional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Users size={18} />
              </div>
              <select
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300 appearance-none"
                value={pacienteId}
                onChange={(e) => {
                  setPacienteId(e.target.value);
                  const selectedP = pacientes.find(p => p.id === e.target.value);
                  if (selectedP && !nombreFactura) {
                    setNombreFactura(selectedP.nombre);
                  }
                }}
                disabled={loadingPacientes}
              >
                <option value="">
                  {loadingPacientes ? "Cargando pacientes..." : "Ninguno (Factura directa)"}
                </option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">NIT</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                placeholder="CF"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nombre a facturar</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300"
                value={nombreFactura}
                onChange={(e) => setNombreFactura(e.target.value)}
                placeholder="Nombre completo"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Dirección</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ciudad"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Serie (Opcional)</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300"
                value={serie}
                onChange={(e) => setSerie(e.target.value)}
                placeholder="Ej. A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">No. Factura (Opcional)</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300"
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value)}
                placeholder="Ej. 00014"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Concepto (Ej. Terapia, Evaluación)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Tag size={18} />
              </div>
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Sesión de terapia psicológica"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Monto Total
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <span className="font-bold text-slate-400">Q.</span>
              </div>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300"
                value={montoTotal}
                onChange={(e) => setMontoTotal(e.target.value)}
                placeholder="500.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fecha de Vencimiento (Opcional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar size={18} />
              </div>
              <input
                type="date"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
              />
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
              disabled={isSaving || !nombreFactura}
              className="px-6 py-2.5 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-70 flex items-center"
            >
              {isSaving ? 'Guardando...' : 'Emitir Factura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
