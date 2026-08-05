import React, { forwardRef } from 'react';
import type { Medicamento } from '../../types';

interface RecetaPrintProps {
  pacienteNombre: string;
  pacienteEdad: number;
  fecha: string;
  medicamentos: Medicamento[];
  medicoNombre?: string; // Asumiremos que se lo podemos pasar
}

const RecetaPrint = forwardRef<HTMLDivElement, RecetaPrintProps>(
  ({ pacienteNombre, pacienteEdad, fecha, medicamentos, medicoNombre = 'Dr. Médico Psiquiatra' }, ref) => {
    return (
      <div ref={ref} className="p-12 max-w-4xl mx-auto bg-white min-h-[1056px] text-slate-800" style={{ fontFamily: "'Inter', sans-serif" }}>
        
        {/* Cabecera de la Clínica */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">CLÍNICA <span className="text-slate-400 font-light">MENTAL</span></h1>
            <p className="text-sm font-semibold tracking-widest text-slate-500 uppercase mt-1">Salud Mental y Bienestar</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-slate-800">{medicoNombre}</h2>
            <p className="text-sm text-slate-500">Colegiado No. 12345</p>
            <p className="text-xs text-slate-400 mt-1">Av. Principal 123, Ciudad</p>
            <p className="text-xs text-slate-400">Tel: (555) 123-4567</p>
          </div>
        </div>

        {/* Título y Datos del Paciente */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-widest uppercase border-y border-slate-200 py-3 mb-8">Receta Médica</h2>
          
          <div className="flex flex-wrap justify-between text-left text-sm">
            <div className="w-full md:w-1/2 mb-4">
              <span className="font-bold text-slate-500 uppercase text-xs tracking-wider block mb-1">Paciente</span>
              <p className="font-semibold text-lg border-b border-slate-300 pb-1 mr-4">{pacienteNombre}</p>
            </div>
            <div className="w-1/2 md:w-1/4 mb-4">
              <span className="font-bold text-slate-500 uppercase text-xs tracking-wider block mb-1">Edad</span>
              <p className="font-semibold text-lg border-b border-slate-300 pb-1 mr-4">{pacienteEdad} años</p>
            </div>
            <div className="w-1/2 md:w-1/4 mb-4">
              <span className="font-bold text-slate-500 uppercase text-xs tracking-wider block mb-1">Fecha</span>
              <p className="font-semibold text-lg border-b border-slate-300 pb-1">{new Date(fecha).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Símbolo Rx */}
        <div className="text-5xl font-serif font-bold italic mb-6 text-slate-300">
          Rx
        </div>

        {/* Lista de Medicamentos */}
        <div className="min-h-[400px]">
          {medicamentos.length > 0 ? (
            <div className="space-y-8">
              {medicamentos.map((med, index) => (
                <div key={med.id || index} className="pl-8 relative">
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-slate-800 text-white text-[10px] flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="mb-1">
                    <span className="font-bold text-xl text-slate-900">{med.nombre}</span>
                    <span className="text-lg font-medium text-slate-600 ml-3">{med.dosis}</span>
                  </div>
                  <div className="text-slate-700 mb-1">
                    <span className="font-semibold">Tomar:</span> {med.frecuencia} por {med.duracion}
                  </div>
                  {med.indicaciones && (
                    <div className="text-sm text-slate-500 italic border-l-2 border-slate-300 pl-3 mt-2">
                      "{med.indicaciones}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 italic mt-12">
              No hay medicamentos prescritos.
            </div>
          )}
        </div>

        {/* Pie de página y Firma */}
        <div className="mt-20 flex justify-between items-end border-t-2 border-slate-800 pt-8 relative">
          <div className="w-1/3 text-xs text-slate-500 leading-relaxed">
            <p>Válido por 30 días a partir de la fecha de emisión.</p>
            <p className="mt-1">Favor de no sustituir el medicamento sin consultar al médico tratante.</p>
          </div>
          
          <div className="w-1/3 text-center">
            <div className="border-b-2 border-slate-400 mb-2 h-16 relative">
              {/* Espacio para firma física */}
            </div>
            <p className="font-bold text-sm uppercase tracking-wider">{medicoNombre}</p>
            <p className="text-xs text-slate-500">Firma y Sello</p>
          </div>
        </div>

      </div>
    );
  }
);

RecetaPrint.displayName = 'RecetaPrint';

export default RecetaPrint;
