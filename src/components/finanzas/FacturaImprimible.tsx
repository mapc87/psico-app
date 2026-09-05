import React from 'react';
import type { Factura, Clinica } from '../../types';

interface FacturaImprimibleProps {
  factura: Factura & { pacientes?: { nombre: string; direccion?: string } };
  clinicaConfig: Partial<Clinica> | null;
}

export default function FacturaImprimible({ factura, clinicaConfig }: FacturaImprimibleProps) {
  return (
    <div id="printable-invoice" className="bg-white text-black p-2 mx-auto hidden print:block font-mono text-[12px] leading-tight w-full max-w-[80mm]">
      
      {/* Membrete Clínica */}
      <div className="text-center mb-4">
        <h1 className="font-bold text-[16px] uppercase mb-1">
          {clinicaConfig?.nombre_comercial || clinicaConfig?.nombre || 'CLÍNICA'}
        </h1>
        <p className="uppercase">{clinicaConfig?.direccion_fiscal || clinicaConfig?.direccion || 'DIRECCIÓN NO REGISTRADA'}</p>
        {clinicaConfig?.telefono_contacto && <p>TEL: {clinicaConfig.telefono_contacto}</p>}
        {clinicaConfig?.nit && <p>NIT: {clinicaConfig.nit}</p>}
      </div>
      
      <div className="border-b border-black border-dashed mb-2 pb-2">
        <p className="text-center font-bold uppercase mb-1">Factura Electrónica</p>
        <p>NO: {factura.numero_factura || factura.id.split('-')[0].toUpperCase()}</p>
        {factura.serie && <p>SERIE: {factura.serie}</p>}
        <p>FECHA: {new Date(factura.fecha_emision).toLocaleDateString()} {new Date(factura.fecha_emision).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
      </div>

      {/* Datos del Cliente */}
      <div className="border-b border-black border-dashed mb-2 pb-2 uppercase">
        <p>CLIENTE: {factura.nombre_factura || factura.pacientes?.nombre || 'CONSUMIDOR FINAL'}</p>
        <p>NIT: {factura.nit || 'C/F'}</p>
        <p>DIR: {factura.direccion || factura.pacientes?.direccion || 'CIUDAD'}</p>
      </div>

      {/* Detalle de Conceptos */}
      <div className="border-b border-black border-dashed mb-2 pb-2">
        <div className="flex justify-between font-bold mb-1">
          <span>DESCRIPCION</span>
          <span>TOTAL</span>
        </div>
        <div className="flex justify-between items-start mb-1">
          <span className="pr-2">{factura.concepto}</span>
          <span>{factura.monto_total.toFixed(2)}</span>
        </div>
      </div>

      {/* Totales */}
      <div className="border-b border-black border-dashed mb-4 pb-2">
        <div className="flex justify-between mb-1">
          <span>SUBTOTAL:</span>
          <span>Q. {factura.monto_total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-[14px] mb-1">
          <span>TOTAL:</span>
          <span>Q. {factura.monto_total.toFixed(2)}</span>
        </div>
        {factura.saldo_pendiente > 0 && (
          <div className="flex justify-between mt-1">
            <span>SALDO PENDIENTE:</span>
            <span>Q. {factura.saldo_pendiente.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Pie de página y Leyendas */}
      <div className="text-center text-[10px] space-y-1 uppercase">
        <p className="font-bold">DOCUMENTO GENERADO ELECTRONICAMENTE</p>
        <p>Este documento no genera crédito fiscal a menos que esté debidamente certificado por la SAT.</p>
        <p className="pt-2">GRACIAS POR SU PREFERENCIA</p>
        {factura.id && (
          <p className="text-[8px] mt-2">REF: {factura.id.split('-')[0]}</p>
        )}
      </div>

    </div>
  );
}
