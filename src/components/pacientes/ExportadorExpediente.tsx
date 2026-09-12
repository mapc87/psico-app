import React from 'react';
import type { Paciente, NotaClinica, Diagnostico, Medicamento, Examen, SignoVital } from '../../types';

interface ExportadorExpedienteProps {
  paciente: Paciente;
  notas: NotaClinica[];
  diagnosticos: Diagnostico[];
  medicamentos: Medicamento[];
  examenes: Examen[];
  signos: SignoVital[];
}

export const ExportadorExpediente = React.forwardRef<HTMLDivElement, ExportadorExpedienteProps>(
  ({ paciente, notas, diagnosticos, medicamentos, examenes, signos }, ref) => {
    return (
      <div className="hidden">
        <div ref={ref} className="p-10 bg-white text-black font-sans w-full max-w-4xl mx-auto print:block print:p-0">
          
          {/* Encabezado */}
          <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold uppercase tracking-wider text-slate-900">Historia Clínica</h1>
              <p className="text-slate-500 mt-1">Expediente Médico y Psicológico</p>
            </div>
            <div className="text-right text-sm text-slate-600">
              <p>Fecha de Emisión: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Datos del Paciente */}
          <section className="mb-10">
            <h2 className="text-xl font-bold border-b border-slate-300 pb-2 mb-4">Datos Demográficos</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-bold">Nombre:</span> {paciente.nombre}</div>
              <div><span className="font-bold">DPI:</span> {paciente.dpi || 'N/A'}</div>
              <div><span className="font-bold">Fecha de Nacimiento:</span> {paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-bold">Teléfono:</span> {paciente.telefono || 'N/A'}</div>
              <div><span className="font-bold">Correo:</span> {paciente.correo || 'N/A'}</div>
              <div><span className="font-bold">Fecha de Ingreso:</span> {new Date(paciente.fecha_ingreso).toLocaleDateString()}</div>
              {paciente.nombre_responsable && (
                <div className="col-span-2"><span className="font-bold">Responsable:</span> {paciente.nombre_responsable} ({paciente.parentesco})</div>
              )}
            </div>
          </section>

          {/* Diagnósticos */}
          <section className="mb-10">
            <h2 className="text-xl font-bold border-b border-slate-300 pb-2 mb-4">Diagnósticos Actuales e Históricos</h2>
            {diagnosticos && diagnosticos.length > 0 ? (
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-2">Fecha</th>
                    <th className="border border-slate-300 p-2">Enfermedad / CIE-10</th>
                    <th className="border border-slate-300 p-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnosticos.map(d => (
                    <tr key={d.id}>
                      <td className="border border-slate-300 p-2">{new Date(d.fecha).toLocaleDateString()}</td>
                      <td className="border border-slate-300 p-2 font-semibold">{d.enfermedad}</td>
                      <td className="border border-slate-300 p-2">{d.estado.toUpperCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-slate-500">Sin diagnósticos registrados.</p>
            )}
          </section>



          {/* Evolución Clínica (Notas) */}
          <section className="mb-10">
            <h2 className="text-xl font-bold border-b border-slate-300 pb-2 mb-4">Evolución Clínica (Notas SOAP)</h2>
            {notas && notas.length > 0 ? (
              <div className="space-y-6">
                {notas.map(nota => (
                  <div key={nota.id} className="border border-slate-200 p-4 rounded-lg bg-slate-50 break-inside-avoid">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold">{nota.titulo || 'Nota de Evolución'}</h3>
                      <span className="text-xs text-slate-500">{new Date(nota.fecha).toLocaleString()}</span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{nota.contenido}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No hay notas clínicas registradas.</p>
            )}
          </section>

          {/* Medicamentos (Solo si existen) */}
          {medicamentos && medicamentos.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold border-b border-slate-300 pb-2 mb-4">Tratamiento Farmacológico</h2>
              <ul className="list-disc pl-5 text-sm space-y-2">
                {medicamentos.map(m => (
                  <li key={m.id}>
                    <strong>{m.nombre}</strong> - {m.dosis} c/{m.frecuencia} durante {m.duracion}. 
                    <em> (Estado: {m.estado})</em>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Pie de página legal */}
          <div className="mt-20 pt-8 border-t border-slate-800 text-center break-inside-avoid">
            <p className="text-xs text-slate-500 mb-8">
              Este documento es estrictamente confidencial y contiene información médica amparada por el secreto profesional.
            </p>
            <div className="w-64 border-t border-slate-800 mx-auto pt-2">
              <p className="text-sm font-bold">Firma del Profesional Tratante</p>
            </div>
          </div>

        </div>
      </div>
    );
  }
);
