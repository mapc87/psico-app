import React from 'react';
import type { Factura, Clinica } from '../../types';

interface FacturaImprimibleProps {
  factura: Factura & { pacientes?: { nombre: string; direccion?: string } };
  clinicaConfig: Partial<Clinica> | null;
}

export default function FacturaImprimible({ factura, clinicaConfig }: FacturaImprimibleProps) {
  return (
    <div id="printable-invoice" className="bg-white text-slate-800 p-8 max-w-4xl mx-auto hidden print:block text-sm">
      
      {/* Membrete Clínica */}
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
            {clinicaConfig?.nombre_comercial || clinicaConfig?.nombre || 'Clínica'}
          </h1>
          <p className="text-slate-600 mt-1 max-w-sm">
            {clinicaConfig?.direccion_fiscal || clinicaConfig?.direccion || 'Dirección no registrada'}
          </p>
          <div className="mt-2 text-slate-600">
            {clinicaConfig?.telefono_contacto && <p>Tel: {clinicaConfig.telefono_contacto}</p>}
            {clinicaConfig?.nit && <p>NIT: <span className="font-bold">{clinicaConfig.nit}</span></p>}
          </div>
        </div>
        
        <div className="text-right">
          <h2 className="text-2xl font-bold text-slate-400 uppercase tracking-widest mb-2">Factura</h2>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 inline-block text-left">
            <p className="text-slate-500 text-xs uppercase font-bold mb-1">Detalles del Documento</p>
            <p className="font-mono font-bold text-slate-800">
              No. <span className="text-lg">{factura.numero_factura || factura.id.split('-')[0].toUpperCase()}</span>
            </p>
            {factura.serie && <p className="font-mono text-slate-600 text-xs mt-1">Serie: {factura.serie}</p>}
            <p className="text-xs text-slate-500 mt-2">
              Fecha: <span className="font-bold text-slate-700">{new Date(factura.fecha_emision).toLocaleDateString()}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Datos del Cliente */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Facturado A:</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500">Nombre / Razón Social</p>
            <p className="font-bold text-slate-800 text-lg uppercase">
              {factura.nombre_factura || factura.pacientes?.nombre || 'Consumidor Final'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">NIT</p>
            <p className="font-bold text-slate-800 text-lg">
              {factura.nit || 'C/F'}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-slate-500">Dirección</p>
            <p className="font-semibold text-slate-700 uppercase">
              {factura.direccion || factura.pacientes?.direccion || 'Ciudad'}
            </p>
          </div>
        </div>
      </div>

      {/* Detalle de Conceptos */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-slate-800 text-slate-500 text-xs uppercase">
            <th className="py-3 text-left font-bold">Descripción / Concepto</th>
            <th className="py-3 text-right font-bold w-32">Total (Q.)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-200">
            <td className="py-4 text-slate-800 font-medium">
              {factura.concepto}
            </td>
            <td className="py-4 text-right font-bold text-slate-800">
              {factura.monto_total.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Totales */}
      <div className="flex justify-end mb-12">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b border-slate-200 text-slate-600">
            <span>Subtotal:</span>
            <span>Q. {factura.monto_total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-3 text-xl font-black text-slate-900 border-b-2 border-slate-800">
            <span>TOTAL:</span>
            <span>Q. {factura.monto_total.toFixed(2)}</span>
          </div>
          {factura.saldo_pendiente > 0 && (
            <div className="flex justify-between py-2 mt-2 text-rose-600 font-bold bg-rose-50 px-3 rounded">
              <span>Saldo Pendiente:</span>
              <span>Q. {factura.saldo_pendiente.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pie de página y Leyendas */}
      <div className="border-t border-slate-200 pt-6 text-center text-xs text-slate-500 space-y-2">
        <p className="font-bold text-slate-600 uppercase">Documento generado electrónicamente</p>
        <p>Este documento no genera crédito fiscal a menos que esté debidamente certificado por un certificador autorizado por la SAT.</p>
        {factura.id && (
          <p className="font-mono text-[10px] text-slate-400 mt-4">
            Ref interna: {factura.id}
          </p>
        )}
      </div>

    </div>
  );
}
