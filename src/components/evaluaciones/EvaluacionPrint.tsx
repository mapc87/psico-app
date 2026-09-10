import React, { forwardRef } from 'react';
import type { EvaluacionPaciente } from '../../types';
import { BrainCircuit } from 'lucide-react';

interface Props {
  evaluacion: EvaluacionPaciente;
  pacienteNombre: string;
  pacienteEdad: number;
  medicoNombre?: string;
  clinicaNombre?: string;
}

const EvaluacionPrint = forwardRef<HTMLDivElement, Props>(({ evaluacion, pacienteNombre, pacienteEdad, medicoNombre, clinicaNombre }, ref) => {
  if (!evaluacion || !evaluacion.plantilla) return <div ref={ref}></div>;

  const { plantilla, respuestas, puntaje_total, interpretacion, fecha } = evaluacion;

  return (
    <div ref={ref} className="p-10 bg-white text-black max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      
      {/* Encabezado */}
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center">
            <BrainCircuit size={32} className="mr-3" />
            INFORME PSICOMÉTRICO
          </h1>
          <p className="text-slate-600 mt-2 font-medium">{clinicaNombre || 'Clínica Psicológica'}</p>
        </div>
        <div className="text-right text-sm">
          <p><strong>Fecha de Emisión:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>Fecha de Evaluación:</strong> {new Date(fecha).toLocaleDateString()}</p>
          <p><strong>Profesional:</strong> {medicoNombre || 'No especificado'}</p>
        </div>
      </div>

      {/* Datos del Paciente */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
        <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Datos del Paciente</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <p><strong>Nombre:</strong> {pacienteNombre}</p>
          <p><strong>Edad:</strong> {pacienteEdad} años</p>
        </div>
      </div>

      {/* Resumen del Test */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{plantilla.titulo}</h2>
        <p className="text-slate-600 mb-6">{plantilla.descripcion}</p>

        <div className="flex gap-6">
          <div className="flex-1 bg-violet-50 p-6 rounded-2xl border border-violet-100 text-center">
            <p className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-2">Puntaje Directo</p>
            <p className="text-5xl font-black text-violet-900">{puntaje_total}</p>
          </div>
          <div className="flex-1 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center flex flex-col justify-center">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Interpretación Clínica</p>
            <p className="text-2xl font-bold text-slate-800">{interpretacion}</p>
          </div>
        </div>
      </div>

      {/* Detalle de Escalas */}
      {plantilla.escalas && plantilla.escalas.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Baremos / Escalas del Instrumento</h3>
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-3 border border-slate-200 font-bold">Rango de Puntaje</th>
                <th className="p-3 border border-slate-200 font-bold">Nivel / Interpretación</th>
              </tr>
            </thead>
            <tbody>
              {plantilla.escalas.map((escala, idx) => (
                <tr key={idx} className={puntaje_total >= escala.min && puntaje_total <= escala.max ? "bg-violet-100 font-bold" : ""}>
                  <td className="p-3 border border-slate-200">{escala.min} - {escala.max}</td>
                  <td className="p-3 border border-slate-200">{escala.interpretacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Firmas */}
      <div className="mt-24 pt-8 border-t border-slate-300 flex justify-center text-center">
        <div>
          <p className="font-bold text-slate-800">{medicoNombre || 'Profesional Responsable'}</p>
          <p className="text-sm text-slate-500 mt-1">Firma y Sello</p>
        </div>
      </div>

    </div>
  );
});

EvaluacionPrint.displayName = 'EvaluacionPrint';
export default EvaluacionPrint;
