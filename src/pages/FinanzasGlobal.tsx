import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, AlertCircle, Search, Filter, Receipt, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../context/AuthContext';
import type { Factura } from '../types';
import ModalRegistrarPago from '../components/finanzas/ModalRegistrarPago';
import ModalNuevaFacturaGlobal from '../components/finanzas/ModalNuevaFacturaGlobal';

interface FacturaExtendida extends Factura {
  pacientes?: {
    nombre: string;
  };
}

export default function FinanzasGlobal() {
  const { usuarioActual } = useAuth();
  const [facturas, setFacturas] = useState<FacturaExtendida[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'pendiente' | 'parcial' | 'pagada'>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isNuevaFacturaModalOpen, setIsNuevaFacturaModalOpen] = useState(false);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);

  const fetchData = async () => {
    if (!usuarioActual?.clinica_id) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('facturas')
      .select('*, pacientes(nombre)')
      .eq('clinica_id', usuarioActual.clinica_id)
      .order('fecha_emision', { ascending: false });

    if (error) {
      console.error('Error fetching facturas:', error);
    } else if (data) {
      setFacturas(data as unknown as FacturaExtendida[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [usuarioActual?.clinica_id]);

  // Cálculos de KPIs
  const totalFacturado = facturas.reduce((acc, f) => acc + f.monto_total, 0);
  const totalPendiente = facturas.reduce((acc, f) => acc + f.saldo_pendiente, 0);
  const totalCobrado = totalFacturado - totalPendiente;

  const facturasFiltradas = facturas.filter(f => {
    const matchEstado = filtroEstado === 'todas' || f.estado === filtroEstado;
    const nombreBuscado = (f.nombre_factura || f.pacientes?.nombre || '').toLowerCase();
    const matchSearch = nombreBuscado.includes(searchTerm.toLowerCase()) || 
                        f.concepto.toLowerCase().includes(searchTerm.toLowerCase());
    return matchEstado && matchSearch;
  });

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Cargando datos financieros...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center">
            <Wallet className="mr-3 text-emerald-500" size={32} />
            Finanzas y Facturación
          </h2>
          <p className="text-slate-500 mt-1">Gestión centralizada de cuentas por cobrar y pagos de la clínica</p>
        </div>
        
        <button 
          onClick={() => setIsNuevaFacturaModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-600/20 flex items-center hover:scale-105"
        >
          <Receipt size={18} className="mr-2" />
          Emitir Factura
        </button>
      </div>

      {/* Tarjetas de Resumen (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mr-5">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Ingresos</p>
            <h4 className="text-3xl font-black text-slate-800">Q. {totalCobrado.toFixed(2)}</h4>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center">
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mr-5">
            <AlertCircle size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Por Cobrar</p>
            <h4 className="text-3xl font-black text-rose-600">Q. {totalPendiente.toFixed(2)}</h4>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-6 shadow-lg shadow-violet-500/20 text-white flex items-center">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mr-5">
            <Receipt size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-violet-100 uppercase tracking-wider mb-1">Facturas Emitidas</p>
            <h4 className="text-3xl font-black">{facturas.length}</h4>
          </div>
        </div>
      </div>

      {/* Filtros y Tabla */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-2">
            {(['todas', 'pendiente', 'parcial', 'pagada'] as const).map(estado => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
                  filtroEstado === estado 
                    ? 'bg-slate-800 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {estado}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="py-4 px-6 font-bold text-sm text-slate-400 uppercase tracking-wider">Paciente</th>
                <th className="py-4 px-6 font-bold text-sm text-slate-400 uppercase tracking-wider">Concepto</th>
                <th className="py-4 px-6 font-bold text-sm text-slate-400 uppercase tracking-wider text-right">Total</th>
                <th className="py-4 px-6 font-bold text-sm text-slate-400 uppercase tracking-wider text-right">Saldo</th>
                <th className="py-4 px-6 font-bold text-sm text-slate-400 uppercase tracking-wider text-center">Estado</th>
                <th className="py-4 px-6 font-bold text-sm text-slate-400 uppercase tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {facturasFiltradas.length > 0 ? (
                facturasFiltradas.map((factura) => (
                  <tr key={factura.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">{factura.nombre_factura || factura.pacientes?.nombre || 'Factura Directa'}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {factura.nit && factura.nit !== 'CF' && (
                          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">NIT: {factura.nit}</span>
                        )}
                        {(factura.serie || factura.numero_factura) && (
                          <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {factura.serie ? `Serie ${factura.serie}` : ''} {factura.numero_factura ? `#${factura.numero_factura}` : ''}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center mt-1"><Calendar size={12} className="mr-1" /> {new Date(factura.fecha_emision).toLocaleDateString()}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">{factura.concepto}</td>
                    <td className="py-4 px-6 text-right font-bold text-slate-700">Q. {factura.monto_total.toFixed(2)}</td>
                    <td className={`py-4 px-6 text-right font-bold ${factura.saldo_pendiente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      Q. {factura.saldo_pendiente.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${
                        factura.estado === 'pagada' ? 'bg-emerald-100 text-emerald-700' :
                        factura.estado === 'parcial' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {factura.estado}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {(factura.estado === 'pendiente' || factura.estado === 'parcial') ? (
                        <button 
                          onClick={() => {
                            setFacturaSeleccionada(factura as Factura);
                            setIsPagoModalOpen(true);
                          }}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center"
                        >
                          <span className="font-bold mr-1">Q.</span>
                          Cobrar
                        </button>
                      ) : (
                        <span className="text-slate-300 text-sm font-medium">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No se encontraron facturas con esos criterios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {facturaSeleccionada && (
        <ModalRegistrarPago 
          isOpen={isPagoModalOpen}
          onClose={() => {
            setIsPagoModalOpen(false);
            setFacturaSeleccionada(null);
          }}
          onSave={() => {
            fetchData();
          }}
          factura={facturaSeleccionada}
        />
      )}

      <ModalNuevaFacturaGlobal
        isOpen={isNuevaFacturaModalOpen}
        onClose={() => setIsNuevaFacturaModalOpen(false)}
        onSave={() => {
          fetchData();
        }}
      />
    </div>
  );
}
