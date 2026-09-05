import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase/client';
import { CheckCircle, Eraser, AlertCircle, FileSignature } from 'lucide-react';
import type { ConsentimientoFirmado } from '../types';

export default function FirmaRemota() {
  const { id } = useParams();
  const [consentimiento, setConsentimiento] = useState<ConsentimientoFirmado | null>(null);
  const [errorStr, setErrorStr] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      // Solo traemos consentimientos pendientes (ya se controlará por RLS)
      const { data, error } = await supabase
        .from('consentimientos_firmados')
        .select('*')
        .eq('id', id)
        .eq('estado', 'pendiente')
        .single();
      
      if (error || !data) {
        setErrorStr('El documento no existe o ya ha sido firmado.');
      } else {
        setConsentimiento(data as ConsentimientoFirmado);
      }
      setLoading(false);
    };

    fetchDoc();
  }, [id]);

  useEffect(() => {
    if (consentimiento && !success && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#1e293b';
      }
      setIsEmpty(true);
    }
  }, [consentimiento, success]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setIsEmpty(false);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
      }
    }
  };

  const handleSave = async () => {
    if (!consentimiento || !canvasRef.current) return;
    
    const dataUrl = canvasRef.current.toDataURL('image/png');
    
    const { error } = await supabase.from('consentimientos_firmados').update({
      firma_data_url: dataUrl,
      estado: 'firmado',
      fecha_firma: new Date().toISOString()
    }).eq('id', consentimiento.id);
    
    if (error) {
      alert('Hubo un error al guardar tu firma. Por favor, intenta de nuevo.');
    } else {
      setSuccess(true);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Cargando documento...</div>;
  }

  if (errorStr) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Aviso</h2>
          <p className="text-slate-600">{errorStr}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Documento Firmado!</h2>
          <p className="text-slate-600 mb-6">Gracias por firmar el consentimiento. Tu psicólogo ya ha recibido el documento, puedes cerrar esta ventana con seguridad.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        
        <div className="bg-indigo-600 p-6 text-white text-center">
          <FileSignature size={48} className="mx-auto mb-4 opacity-80" />
          <h1 className="text-2xl font-bold">{consentimiento?.titulo}</h1>
          <p className="mt-2 text-indigo-100 font-medium">Por favor, lee el documento y firma al final.</p>
        </div>

        <div className="p-8">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed mb-8 shadow-inner">
            {consentimiento?.contenido_firmado}
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">Tu firma aquí:</h3>
            
            <div className="border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden bg-white touch-none">
              <canvas
                ref={canvasRef}
                width={500}
                height={200}
                className="w-full h-[200px] cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handleClear}
                className="flex items-center px-4 py-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-medium"
              >
                <Eraser size={18} className="mr-2" />
                Limpiar
              </button>

              <button
                onClick={handleSave}
                disabled={isEmpty}
                className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                <CheckCircle size={20} className="mr-2" />
                Aceptar y Firmar
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
