import React, { forwardRef } from 'react';
import type { Paciente, Usuario, Examen } from '../../types';
import { Activity } from 'lucide-react';

interface OrdenExamenPrintProps {
  examen: Examen | null;
  paciente: Paciente | undefined;
  medico: Usuario | null;
}

const OrdenExamenPrint = forwardRef<HTMLDivElement, OrdenExamenPrintProps>(({ examen, paciente, medico }, ref) => {
  if (!examen || !paciente || !medico) return null;

  return (
    <div ref={ref} className="bg-white p-12 text-slate-800 print-container" style={{ width: '100%', minHeight: '100vh' }}>
      {/* Estilos específicos de impresión */}
      <style>
        {`
          @media print {
            @page {
              size: letter;
              margin: 20mm;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
      </style>

      {/* Encabezado */}
      <div className="flex justify-between items-start border-b-2 border-slate-200 pb-8 mb-8">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg text-white mr-4">
            <Activity size={36} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">PsicoApp</h1>
            <p className="text-slate-500 font-medium">Clínica de Especialidades Psicológicas</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-slate-800">Dr(a). {medico.nombre}</h2>
          <p className="text-slate-500">{medico.rol === 'admin' ? 'Director Médico' : 'Especialista'}</p>
          <p className="text-slate-500">{medico.email}</p>
        </div>
      </div>

      {/* Título del Documento */}
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-widest">Orden de Exámenes Médicos</h2>
        <p className="text-slate-500 mt-2">Fecha: {new Date(examen.fechaSolicitud).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Datos del Paciente */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-10">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Datos del Paciente</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-500">Nombre Completo</p>
            <p className="font-bold text-lg text-slate-800">{paciente.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">DPI / Identificación</p>
            <p className="font-bold text-lg text-slate-800">{paciente.dpi || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Teléfono</p>
            <p className="font-bold text-lg text-slate-800">{paciente.telefono}</p>
          </div>
        </div>
      </div>

      {/* Detalle de Exámenes */}
      <div className="mb-20">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Estudios Solicitados</h3>
        <div className="p-8 border-2 border-blue-100 bg-blue-50/30 rounded-2xl">
          <p className="text-xl text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
            {examen.tipoExamen}
          </p>
        </div>
        <p className="text-sm text-slate-500 mt-4 italic">Favor realizar los estudios arriba mencionados e informar los resultados a la brevedad posible.</p>
      </div>

      {/* Firmas */}
      <div className="mt-32 pt-8 flex justify-center border-t border-slate-200 w-64 mx-auto text-center">
        <div>
          <p className="font-bold text-slate-800">Firma y Sello</p>
          <p className="text-sm text-slate-500">Dr(a). {medico.nombre}</p>
        </div>
      </div>
      
    </div>
  );
});

OrdenExamenPrint.displayName = 'OrdenExamenPrint';

export default OrdenExamenPrint;
