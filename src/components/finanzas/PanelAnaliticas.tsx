import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import type { Factura } from '../../types';

interface PanelAnaliticasProps {
  facturas: Factura[];
}

export default function PanelAnaliticas({ facturas }: PanelAnaliticasProps) {
  
  // 1. Procesar Datos: Ingresos por Mes (Últimos 6 meses o todos si son pocos)
  const monthlyData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    
    facturas.forEach(f => {
      // f.fecha_emision is 'YYYY-MM-DD'
      if (!f.fecha_emision) return;
      const date = new Date(f.fecha_emision);
      // Ensure month sorting works by using YYYY-MM first, then formatting
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!dataMap[key]) {
        dataMap[key] = 0;
      }
      dataMap[key] += f.monto_total;
    });

    // Sort by key (YYYY-MM) ascending
    const sortedKeys = Object.keys(dataMap).sort();
    
    return sortedKeys.map(key => {
      const [year, month] = key.split('-');
      const dateObj = new Date(Number(year), Number(month) - 1, 1);
      const label = dateObj.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      return {
        name: label.charAt(0).toUpperCase() + label.slice(1),
        Total: Number(dataMap[key].toFixed(2))
      };
    });
  }, [facturas]);

  // 2. Procesar Datos: Estado de Cartera
  const statusData = useMemo(() => {
    let pagadas = 0;
    let parciales = 0;
    let pendientes = 0;

    facturas.forEach(f => {
      if (f.estado === 'pagada') pagadas += f.monto_total;
      else if (f.estado === 'parcial') {
        pagadas += (f.monto_total - f.saldo_pendiente);
        parciales += f.saldo_pendiente;
      }
      else if (f.estado === 'pendiente') pendientes += f.saldo_pendiente;
    });

    return [
      { name: 'Cobrado (Pagado)', value: Number(pagadas.toFixed(2)), color: '#10b981' }, // emerald-500
      { name: 'Por Cobrar (Parcial)', value: Number(parciales.toFixed(2)), color: '#f59e0b' }, // amber-500
      { name: 'Por Cobrar (Pendiente)', value: Number(pendientes.toFixed(2)), color: '#f43f5e' } // rose-500
    ].filter(item => item.value > 0);
  }, [facturas]);

  // Cálculos rápidos para las tarjetas top
  const totalFacturadoGlobal = facturas.reduce((acc, f) => acc + f.monto_total, 0);
  const totalPendienteGlobal = facturas.reduce((acc, f) => acc + f.saldo_pendiente, 0);
  const totalCobradoGlobal = totalFacturadoGlobal - totalPendienteGlobal;
  const porcentajeCobro = totalFacturadoGlobal > 0 ? ((totalCobradoGlobal / totalFacturadoGlobal) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Tarjetas Top KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mr-3">
              <CheckCircle size={20} />
            </div>
            <h4 className="font-bold text-slate-500">Liquidez Real</h4>
          </div>
          <h2 className="text-3xl font-black text-slate-800">Q. {totalCobradoGlobal.toLocaleString('es-GT', {minimumFractionDigits: 2})}</h2>
          <p className="text-sm font-medium text-emerald-600 mt-2 flex items-center">
             Dinero cobrado y en caja
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 mr-3">
              <AlertCircle size={20} />
            </div>
            <h4 className="font-bold text-slate-500">Riesgo de Cartera</h4>
          </div>
          <h2 className="text-3xl font-black text-slate-800">Q. {totalPendienteGlobal.toLocaleString('es-GT', {minimumFractionDigits: 2})}</h2>
          <p className="text-sm font-medium text-rose-500 mt-2 flex items-center">
             Saldos pendientes de cobro
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mr-3">
              <TrendingUp size={20} />
            </div>
            <h4 className="font-bold text-slate-500">Efectividad de Cobro</h4>
          </div>
          <h2 className="text-3xl font-black text-slate-800">{porcentajeCobro}%</h2>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${porcentajeCobro}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfica de Tendencia de Ingresos */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="flex items-center mb-6">
             <BarChart3 className="text-indigo-500 mr-3" size={24} />
             <h3 className="text-lg font-bold text-slate-800">Tendencia de Facturación</h3>
          </div>
          
          <div className="h-72 w-full">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `Q${value}`} />
                  <RechartsTooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`Q. ${value.toFixed(2)}`, 'Facturado']}
                  />
                  <Bar dataKey="Total" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                No hay datos suficientes
              </div>
            )}
          </div>
        </div>

        {/* Gráfica de Distribución de Cartera */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="flex items-center mb-6">
             <PieChartIcon className="text-indigo-500 mr-3" size={24} />
             <h3 className="text-lg font-bold text-slate-800">Estado de Cartera</h3>
          </div>
          
          <div className="h-72 w-full">
             {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`Q. ${value.toFixed(2)}`, 'Monto']}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-slate-400">
                 No hay datos suficientes
               </div>
             )}
          </div>
        </div>
      </div>

    </div>
  );
}
