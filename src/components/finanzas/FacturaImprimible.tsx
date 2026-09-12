import React from 'react';
import type { Factura, Clinica } from '../../types';

interface FacturaImprimibleProps {
  factura: Factura & { pacientes?: { nombre: string; direccion?: string } };
  clinicaConfig: Partial<Clinica> | null;
}

export default function FacturaImprimible({ factura, clinicaConfig }: FacturaImprimibleProps) {
  return (
    <div id="printable-invoice" className="bg-white text-black p-8 mx-auto hidden print:block font-sans text-sm w-full max-w-3xl">
      
      {/* Membrete Clínica */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-200">
        <div>
          <h1 className="font-black text-2xl uppercase tracking-wide text-slate-800 mb-2">
            {clinicaConfig?.nombre_comercial || clinicaConfig?.nombre || 'CLÍNICA'}
          </h1>
          <p className="text-slate-500 uppercase text-xs font-semibold">{clinicaConfig?.direccion_fiscal || clinicaConfig?.direccion || 'DIRECCIÓN NO REGISTRADA'}</p>
          {clinicaConfig?.telefono_contacto && <p className="text-slate-500 text-xs font-semibold mt-1">TEL: {clinicaConfig.telefono_contacto}</p>}
          {clinicaConfig?.nit && <p className="text-slate-500 text-xs font-semibold mt-1">NIT: {clinicaConfig.nit}</p>}
        </div>
        <div className="text-right">
          <p className="text-slate-400 font-bold uppercase text-xs mb-1">Factura Electrónica</p>
          <p className="font-bold text-lg text-slate-800">NO: {factura.numero_factura || factura.id.split('-')[0].toUpperCase()}</p>
          {factura.serie && <p className="text-slate-600 font-medium">SERIE: {factura.serie}</p>}
          <p className="text-slate-500 text-xs mt-2">FECHA: {new Date(factura.fecha_emision).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Datos del Cliente */}
      <div className="bg-slate-50 p-4 rounded-xl mb-8 border border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Facturar a:</p>
        <p className="font-bold text-lg text-slate-800 uppercase mb-2">{factura.nombre_factura || factura.pacientes?.nombre || 'CONSUMIDOR FINAL'}</p>
        <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
          <p><span className="font-bold text-slate-400 mr-2">NIT:</span> {factura.nit || 'C/F'}</p>
          <p><span className="font-bold text-slate-400 mr-2">DIR:</span> {factura.direccion || factura.pacientes?.direccion || 'CIUDAD'}</p>
        </div>
      </div>

      {/* Detalle de Conceptos */}
      <div className="mb-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="py-3 font-bold text-slate-400 uppercase text-xs w-3/4">Descripción</th>
              <th className="py-3 font-bold text-slate-400 uppercase text-xs text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-4 font-semibold text-slate-700">{factura.concepto}</td>
              <td className="py-4 text-right font-medium text-slate-700">Q. {factura.monto_total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div className="flex justify-end mb-12">
        <div className="w-1/2 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
          <div className="flex justify-between text-slate-500 font-medium">
            <span>SUBTOTAL:</span>
            <span>Q. {factura.monto_total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-black text-xl text-slate-800 border-t border-slate-200 pt-2 mt-2">
            <span>TOTAL:</span>
            <span>Q. {factura.monto_total.toFixed(2)}</span>
          </div>
          {factura.saldo_pendiente > 0 && (
            <div className="flex justify-between text-rose-600 font-bold text-sm pt-2">
              <span>SALDO PENDIENTE:</span>
              <span>Q. {factura.saldo_pendiente.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pie de página y Leyendas */}
      <div className="text-center text-xs text-slate-400 space-y-1 mt-16 pt-8 border-t border-slate-200">
        <p className="font-bold text-slate-500 uppercase tracking-wider">DOCUMENTO GENERADO ELECTRONICAMENTE</p>
        <p>Este documento no genera crédito fiscal a menos que esté debidamente certificado por la SAT.</p>
        <p className="pt-2 font-medium">¡Gracias por su preferencia!</p>
        {factura.id && (
          <p className="text-[10px] mt-4 opacity-50">REF: {factura.id.split('-')[0]}</p>
        )}
      </div>

    </div>
  );
}
