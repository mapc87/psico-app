import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../context/AuthContext';
import { Wallet, Plus, ArrowDownRight, ArrowUpRight, CheckCircle, Lock, AlertCircle, RefreshCw } from 'lucide-react';
import type { Caja, MovimientoCaja } from '../../types';

export default function CajaPanel() {
  const { usuarioActual } = useAuth();
  const [cajaActiva, setCajaActiva] = useState<Caja | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para Apertura
  const [montoApertura, setMontoApertura] = useState<string>('');
  const [isAbriendo, setIsAbriendo] = useState(false);

  // Estados para Egreso (Gasto)
  const [isRegistrandoEgreso, setIsRegistrandoEgreso] = useState(false);
  const [gastoMonto, setGastoMonto] = useState<string>('');
  const [gastoConcepto, setGastoConcepto] = useState<string>('');

  // Estados para Cierre
  const [isCerrandoCaja, setIsCerrandoCaja] = useState(false);
  const [montoCierreReal, setMontoCierreReal] = useState<string>('');
  const [cierreNotas, setCierreNotas] = useState<string>('');

  const fetchCajaYMovimientos = async () => {
    if (!usuarioActual?.clinica_id) return;
    setLoading(true);
    
    // Buscar si hay caja abierta
    const { data: cajasData, error: cajaError } = await supabase
      .from('cajas')
      .select('*')
      .eq('clinica_id', usuarioActual.clinica_id)
      .eq('estado', 'abierta')
      .order('fecha_apertura', { ascending: false })
      .limit(1);

    if (cajaError) {
      console.error('Error fetching caja:', cajaError);
    } else if (cajasData && cajasData.length > 0) {
      setCajaActiva(cajasData[0] as Caja);
      
      // Fetch movimientos de esta caja
      const { data: movData } = await supabase
        .from('movimientos_caja')
        .select('*, usuarios(nombre)')
        .eq('caja_id', cajasData[0].id)
        .order('fecha', { ascending: false });
        
      if (movData) {
        setMovimientos(movData as unknown as MovimientoCaja[]);
      }
    } else {
      setCajaActiva(null);
      setMovimientos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCajaYMovimientos();
  }, [usuarioActual?.clinica_id]);

  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioActual?.clinica_id || !usuarioActual.id) return;
    
    setIsAbriendo(true);
    const monto = parseFloat(montoApertura) || 0;
    
    const { error } = await supabase.from('cajas').insert({
      clinica_id: usuarioActual.clinica_id,
      usuario_apertura_id: usuarioActual.id,
      monto_apertura: monto,
      estado: 'abierta'
    });
    
    if (!error) {
      setMontoApertura('');
      await fetchCajaYMovimientos();
    } else {
      console.error(error);
      alert('Error al abrir caja');
    }
    setIsAbriendo(false);
  };

  const handleRegistrarEgreso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cajaActiva || !usuarioActual?.clinica_id || !usuarioActual.id) return;
    
    const monto = parseFloat(gastoMonto);
    if (isNaN(monto) || monto <= 0) return;

    const { error } = await supabase.from('movimientos_caja').insert({
      caja_id: cajaActiva.id,
      clinica_id: usuarioActual.clinica_id,
      usuario_id: usuarioActual.id,
      tipo: 'egreso',
      monto,
      metodo_pago: 'efectivo', // Gastos de caja suelen ser en efectivo
      concepto: gastoConcepto
    });

    if (!error) {
      setGastoMonto('');
      setGastoConcepto('');
      setIsRegistrandoEgreso(false);
      await fetchCajaYMovimientos();
    } else {
      alert('Error al registrar gasto');
    }
  };

  const handleCerrarCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cajaActiva || !usuarioActual?.clinica_id || !usuarioActual.id) return;

    const real = parseFloat(montoCierreReal);
    if (isNaN(real)) return;

    const diferencia = real - montoEfectivoEsperado;

    // Advertir si hay descuadre
    if (diferencia !== 0) {
      const confirm = window.confirm(`Hay un ${diferencia > 0 ? 'sobrante' : 'faltante'} de Q. ${Math.abs(diferencia).toFixed(2)}. ¿Deseas cerrar la caja de todas formas?`);
      if (!confirm) return;
    }

    const { error } = await supabase.from('cajas').update({
      usuario_cierre_id: usuarioActual.id,
      monto_cierre_esperado: montoEfectivoEsperado,
      monto_cierre_real: real,
      diferencia,
      fecha_cierre: new Date().toISOString(),
      estado: 'cerrada',
      notas: cierreNotas
    }).eq('id', cajaActiva.id);

    if (!error) {
      setIsCerrandoCaja(false);
      setMontoCierreReal('');
      setCierreNotas('');
      await fetchCajaYMovimientos();
    } else {
      alert('Error al cerrar la caja');
    }
  };

  // Cálculos
  const totalIngresosEfectivo = movimientos.filter(m => m.tipo === 'ingreso' && m.metodo_pago === 'efectivo').reduce((acc, m) => acc + m.monto, 0);
  const totalEgresosEfectivo = movimientos.filter(m => m.tipo === 'egreso' && m.metodo_pago === 'efectivo').reduce((acc, m) => acc + m.monto, 0);
  const totalIngresosOtros = movimientos.filter(m => m.tipo === 'ingreso' && m.metodo_pago !== 'efectivo').reduce((acc, m) => acc + m.monto, 0);
  
  const montoEfectivoEsperado = (cajaActiva?.monto_apertura || 0) + totalIngresosEfectivo - totalEgresosEfectivo;

  if (loading) {
    return <div className="text-center py-10 text-slate-500"><RefreshCw className="animate-spin inline mr-2" /> Cargando caja...</div>;
  }

  if (!cajaActiva) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 max-w-md mx-auto text-center mt-10">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Lock size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">La caja está cerrada</h3>
        <p className="text-slate-500 mb-6 text-sm">Debes abrir una caja para iniciar tu turno y poder registrar pagos o facturas en efectivo.</p>
        
        <form onSubmit={handleAbrirCaja} className="space-y-4">
          <div className="text-left">
            <label className="block text-sm font-bold text-slate-700 mb-1">Monto de Apertura (Q.)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={montoApertura}
              onChange={e => setMontoApertura(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50"
              placeholder="Ej. 100.00"
            />
          </div>
          <button
            type="submit"
            disabled={isAbriendo}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/30 flex items-center justify-center"
          >
            {isAbriendo ? 'Abriendo...' : 'Abrir Caja'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Wallet size={120} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center">
              <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              Caja Abierta
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Abierta el {new Date(cajaActiva.fecha_apertura).toLocaleDateString()} a las {new Date(cajaActiva.fecha_apertura).toLocaleTimeString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsRegistrandoEgreso(true)}
              className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center"
            >
              <ArrowDownRight size={16} className="mr-1" />
              Gasto (Egreso)
            </button>
            <button
              onClick={() => setIsCerrandoCaja(true)}
              className="bg-slate-800 text-white hover:bg-slate-900 px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-slate-500/30 flex items-center"
            >
              <Lock size={16} className="mr-1" />
              Cerrar Caja
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Monto Inicial</p>
            <p className="text-2xl font-bold text-slate-700">Q. {cajaActiva.monto_apertura.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1 flex items-center"><ArrowUpRight size={14} className="mr-1"/> Ingresos (Efec.)</p>
            <p className="text-2xl font-bold text-emerald-600">Q. {totalIngresosEfectivo.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1 flex items-center"><ArrowDownRight size={14} className="mr-1"/> Egresos (Efec.)</p>
            <p className="text-2xl font-bold text-rose-600">Q. {totalEgresosEfectivo.toFixed(2)}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl -m-2">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Efectivo Esperado</p>
            <p className="text-3xl font-black text-emerald-700">Q. {montoEfectivoEsperado.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {isRegistrandoEgreso && (
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h4 className="font-bold text-rose-800 mb-4 flex items-center"><ArrowDownRight size={18} className="mr-2"/> Registrar Egreso Manual</h4>
          <form onSubmit={handleRegistrarEgreso} className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-rose-700 mb-1">Concepto</label>
              <input
                type="text"
                required
                value={gastoConcepto}
                onChange={e => setGastoConcepto(e.target.value)}
                placeholder="Ej. Compra de garrafón de agua"
                className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500/50 outline-none"
              />
            </div>
            <div className="w-full md:w-32">
              <label className="block text-xs font-bold text-rose-700 mb-1">Monto (Q.)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={gastoMonto}
                onChange={e => setGastoMonto(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500/50 outline-none"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl transition-colors flex-1 md:flex-none">
                Guardar
              </button>
              <button type="button" onClick={() => setIsRegistrandoEgreso(false)} className="text-rose-600 font-bold px-4 py-2.5 hover:bg-rose-100 rounded-xl transition-colors flex-1 md:flex-none">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {isCerrandoCaja && (
        <div className="bg-slate-800 rounded-3xl p-6 shadow-xl text-white animate-in zoom-in-95">
          <h4 className="font-bold text-white mb-2 flex items-center"><Lock size={18} className="mr-2"/> Cierre de Caja</h4>
          <p className="text-slate-400 text-sm mb-6">Ingresa el monto real de efectivo que hay físicamente en la caja.</p>
          
          <form onSubmit={handleCerrarCaja} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Efectivo Físico (Q.)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={montoCierreReal}
                  onChange={e => setMontoCierreReal(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-lg font-bold outline-none"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Notas (Opcional)</label>
                <input
                  type="text"
                  value={cierreNotas}
                  onChange={e => setCierreNotas(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm outline-none"
                  placeholder="Razón de descuadre, observaciones..."
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-4">
              <button type="button" onClick={() => setIsCerrandoCaja(false)} className="text-slate-300 font-bold px-4 py-2 hover:bg-slate-700 rounded-xl transition-colors">
                Cancelar
              </button>
              <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl transition-colors shadow-lg shadow-emerald-500/20">
                Confirmar Cierre
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Historial rápido del turno */}
      <div>
        <h4 className="font-bold text-slate-700 mb-4">Movimientos del Turno</h4>
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 font-bold text-slate-400">Hora</th>
                <th className="py-3 px-4 font-bold text-slate-400">Concepto</th>
                <th className="py-3 px-4 font-bold text-slate-400">Método</th>
                <th className="py-3 px-4 font-bold text-slate-400">Usuario</th>
                <th className="py-3 px-4 font-bold text-slate-400 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movimientos.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-slate-400">No hay movimientos en este turno.</td></tr>
              ) : (
                movimientos.map(mov => (
                  <tr key={mov.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-500">{new Date(mov.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{mov.concepto}</td>
                    <td className="py-3 px-4 text-slate-500 capitalize">{mov.metodo_pago}</td>
                    <td className="py-3 px-4 text-slate-500">{mov.usuarios?.nombre || '-'}</td>
                    <td className={`py-3 px-4 font-bold text-right ${mov.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {mov.tipo === 'ingreso' ? '+' : '-'} Q. {mov.monto.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
