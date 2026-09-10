import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw, Search, Filter } from 'lucide-react';
import type { MovimientoCaja } from '../../types';

export default function HistorialCaja() {
  const { usuarioActual } = useAuth();
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'ingreso' | 'egreso'>('todos');
  const [filtroMetodo, setFiltroMetodo] = useState<string>('todos');

  // Por defecto, mostrar el mes actual
  const fechaHoy = new Date();
  const primerDiaMes = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth(), 1).toISOString().split('T')[0];
  const ultimoDiaMes = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [fechaInicio, setFechaInicio] = useState(primerDiaMes);
  const [fechaFin, setFechaFin] = useState(ultimoDiaMes);

  const fetchHistorial = async () => {
    if (!usuarioActual?.clinica_id) return;
    setLoading(true);
    
    let query = supabase
      .from('movimientos_caja')
      .select('*, usuarios(nombre)')
      .eq('clinica_id', usuarioActual.clinica_id)
      .order('fecha', { ascending: false });

    if (fechaInicio) {
      query = query.gte('fecha', `${fechaInicio}T00:00:00`);
    }
    if (fechaFin) {
      query = query.lte('fecha', `${fechaFin}T23:59:59`);
    }

    const { data, error } = await query.limit(500);

    if (error) {
      console.error('Error fetching historial:', error);
    } else if (data) {
      setMovimientos(data as unknown as MovimientoCaja[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistorial();
  }, [usuarioActual?.clinica_id, fechaInicio, fechaFin]);

  const movimientosFiltrados = movimientos.filter(m => {
    const matchTipo = filtroTipo === 'todos' || m.tipo === filtroTipo;
    const matchMetodo = filtroMetodo === 'todos' || m.metodo_pago === filtroMetodo;
    const matchSearch = m.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (m.usuarios?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchTipo && matchMetodo && matchSearch;
  });

  if (loading) {
    return <div className="text-center py-10 text-slate-500"><RefreshCw className="animate-spin inline mr-2" /> Cargando historial...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as any)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-violet-500"
            >
              <option value="todos">Todos los Tipos</option>
              <option value="ingreso">Ingresos</option>
              <option value="egreso">Egresos</option>
            </select>
            
            <select
              value={filtroMetodo}
              onChange={(e) => setFiltroMetodo(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-violet-500"
            >
              <option value="todos">Cualquier Método</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="seguro">Seguro</option>
            </select>

            <div className="flex items-center ml-2 border-l border-slate-200 pl-4 gap-2">
              <span className="text-xs text-slate-500 font-medium">Desde:</span>
              <input 
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-violet-500"
              />
              <span className="text-xs text-slate-500 font-medium ml-2">Hasta:</span>
              <input 
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="relative w-full md:w-64 mt-4 md:mt-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar concepto o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-4 px-6 font-bold text-slate-400 uppercase tracking-wider">Fecha / Hora</th>
                <th className="py-4 px-6 font-bold text-slate-400 uppercase tracking-wider">Concepto</th>
                <th className="py-4 px-6 font-bold text-slate-400 uppercase tracking-wider text-center">Tipo</th>
                <th className="py-4 px-6 font-bold text-slate-400 uppercase tracking-wider text-center">Método</th>
                <th className="py-4 px-6 font-bold text-slate-400 uppercase tracking-wider">Usuario</th>
                <th className="py-4 px-6 font-bold text-slate-400 uppercase tracking-wider text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movimientosFiltrados.length > 0 ? (
                movimientosFiltrados.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">
                      {new Date(mov.fecha).toLocaleDateString()} <span className="text-xs ml-1">{new Date(mov.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-700">{mov.concepto}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${
                        mov.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {mov.tipo}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center text-slate-600 capitalize font-medium">{mov.metodo_pago}</td>
                    <td className="py-4 px-6 text-slate-600">{mov.usuarios?.nombre || '-'}</td>
                    <td className={`py-4 px-6 text-right font-bold ${mov.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {mov.tipo === 'ingreso' ? '+' : '-'} Q. {mov.monto.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No se encontraron movimientos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
