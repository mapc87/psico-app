import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { EvaluacionPaciente } from '../../types';

interface GraficoEvaluacionesProps {
  evaluaciones: EvaluacionPaciente[];
}

export default function GraficoEvaluaciones({ evaluaciones }: GraficoEvaluacionesProps) {
  // Filtramos solo los completados
  const completadas = evaluaciones.filter(e => e.estado === 'completado');

  const grouped = useMemo(() => {
    const map = new Map<string, { titulo: string; data: any[] }>();
    completadas.forEach(ev => {
      const pId = ev.plantilla_id;
      if (!map.has(pId)) {
        map.set(pId, { titulo: ev.plantilla?.titulo || 'Evaluación Psicométrica', data: [] });
      }
      
      map.get(pId)!.data.push({
        fecha: new Date(ev.fecha).toLocaleDateString(),
        puntaje: ev.puntaje_total,
        interpretacion: ev.interpretacion,
        timestamp: new Date(ev.fecha).getTime()
      });
    });

    // Sort data within each test group by date ascending
    Array.from(map.values()).forEach(group => {
      group.data.sort((a, b) => a.timestamp - b.timestamp);
    });

    // Only show graphs for tests taken more than once to actually see evolution
    return Array.from(map.values()).filter(g => g.data.length > 1);
  }, [completadas]);

  if (grouped.length === 0) return null;

  return (
    <div className="space-y-6 mt-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Gráficas de Evolución Longitudinal</h3>
          <p className="text-sm text-slate-500">Historial de puntajes de los tests repetidos.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {grouped.map((group, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-bold text-slate-700 mb-6 text-center">{group.titulo}</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={group.data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="fecha" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} dy={10} />
                  <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 'bold' }}
                    formatter={(value: any, name: string, props: any) => [
                      `${value} pts (${props.payload.interpretacion || ''})`, 
                      'Puntaje'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="puntaje" 
                    name="Puntaje"
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                    dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
