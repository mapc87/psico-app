import React, { forwardRef } from 'react';
import type { ConsentimientoFirmado } from '../../types';
import { FileSignature } from 'lucide-react';

interface Props {
  documento: ConsentimientoFirmado;
  pacienteNombre: string;
  pacienteIdentificacion?: string;
  clinicaNombre?: string;
  clinicaDireccion?: string;
  clinicaTelefono?: string;
  clinicaLogo?: string;
}

const DocumentoPrint = forwardRef<HTMLDivElement, Props>(({ 
  documento, 
  pacienteNombre, 
  pacienteIdentificacion, 
  clinicaNombre, 
  clinicaDireccion, 
  clinicaTelefono, 
  clinicaLogo 
}, ref) => {
  if (!documento) return null;

  return (
    <div ref={ref} className="p-12 bg-white text-black w-full max-w-4xl mx-auto min-h-[1056px]" style={{ fontFamily: 'Arial, sans-serif' }}>
      
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
            .content-firmado p {
              margin-bottom: 1rem;
              text-align: justify;
              line-height: 1.6;
            }
            .content-firmado ul {
              margin-left: 2rem;
              list-style-type: disc;
              margin-bottom: 1rem;
            }
          }
        `}
      </style>

      {/* Encabezado */}
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
        <div className="flex items-center">
          {clinicaLogo ? (
            <img src={clinicaLogo} alt="Logo Clínica" className="h-16 object-contain mr-4" />
          ) : (
            <FileSignature size={32} className="mr-3 text-slate-800" />
          )}
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wide">
              {clinicaNombre || 'Documento Legal'}
            </h1>
            {(clinicaDireccion || clinicaTelefono) && (
              <div className="text-sm text-slate-600 mt-1">
                {clinicaDireccion && <p>{clinicaDireccion}</p>}
                {clinicaTelefono && <p>Tel: {clinicaTelefono}</p>}
              </div>
            )}
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="font-bold text-slate-800 uppercase tracking-wider text-xs mb-1">Registro de Documento</p>
          <p><strong>Emisión:</strong> {new Date().toLocaleDateString()}</p>
          <p className="text-xs text-slate-500 mt-1 uppercase">ID: {documento.id.split('-')[0]}</p>
        </div>
      </div>

      {/* Título del Documento */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900 uppercase underline decoration-slate-300 underline-offset-8">
          {documento.titulo}
        </h2>
      </div>

      {/* Contenido Legal */}
      <div 
        className="text-sm text-slate-800 mb-16 content-firmado prose max-w-none"
        dangerouslySetInnerHTML={{ __html: documento.contenido_firmado.replace(/\n/g, '<br/>') }}
      />

      {/* Área de Firmas */}
      <div className="mt-auto pt-16 grid grid-cols-2 gap-12 border-t border-slate-300">
        
        {/* Firma Paciente */}
        <div className="text-center">
          {documento.firma_data_url ? (
            <div className="flex justify-center mb-2">
              <img src={documento.firma_data_url} alt="Firma del Paciente" className="h-24 object-contain" />
            </div>
          ) : (
            <div className="h-24 mb-2 flex items-end justify-center">
              <div className="w-full border-b border-slate-400"></div>
            </div>
          )}
          {!documento.firma_data_url && <div className="w-full border-b-2 border-slate-800 mb-2"></div>}
          <p className="font-bold text-slate-800">{pacienteNombre}</p>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Firma del Paciente / Encargado</p>
          {pacienteIdentificacion && (
            <p className="text-xs text-slate-500 mt-1">DPI/Identificación: {pacienteIdentificacion}</p>
          )}
        </div>

        {/* Firma Clínica/Profesional (Opcional, espacio en blanco para firmar) */}
        <div className="text-center flex flex-col justify-end">
          <div className="h-24 mb-2 flex items-end justify-center">
            <div className="w-full border-b border-slate-400"></div>
          </div>
          <p className="font-bold text-slate-800 uppercase tracking-wider text-xs">Sello y Firma de la Clínica</p>
          <p className="text-xs text-slate-500 mt-1">{clinicaNombre}</p>
        </div>
        
      </div>
      
    </div>
  );
});

DocumentoPrint.displayName = 'DocumentoPrint';
export default DocumentoPrint;
