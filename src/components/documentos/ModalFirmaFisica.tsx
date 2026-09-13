import React, { useState } from 'react';
import { supabase } from '../../services/supabase/client';
import { X, Upload, FileText, CheckCircle2 } from 'lucide-react';
import Toast from '../common/Toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  documentoId: string;
  clinicaId: string;
  onSuccess: () => void;
}

export default function ModalFirmaFisica({ isOpen, onClose, documentoId, clinicaId, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'info' });

  if (!isOpen) return null;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleConfirmar = async () => {
    setLoading(true);
    try {
      let archivoUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${documentoId}-${Math.random()}.${fileExt}`;
        const filePath = `${clinicaId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documentos_escaneados')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documentos_escaneados')
          .getPublicUrl(filePath);

        archivoUrl = publicUrl;
      }

      const { error: updateError } = await supabase
        .from('consentimientos_firmados')
        .update({
          estado: 'firmado',
          metodo_firma: 'fisica',
          archivo_adjunto_url: archivoUrl,
          firma_data_url: '[FIRMA FÍSICA]',
          fecha_firma: new Date().toISOString()
        })
        .eq('id', documentoId);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al guardar firma física:', error);
      showToast('Ocurrió un error al guardar. Inténtalo de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center">
            <CheckCircle2 size={18} className="mr-2 text-indigo-600" />
            Confirmar Firma Física
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 mb-6">
            Confirma que el paciente ha firmado físicamente el documento. El estado pasará a "Firmado".
          </p>

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Adjuntar respaldo escaneado (Opcional)
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,image/png,image/jpeg"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    if (e.target.files[0].size > 5 * 1024 * 1024) {
                      showToast('El archivo no debe superar los 5MB', 'error');
                      return;
                    }
                    setFile(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                {file ? (
                  <>
                    <FileText size={32} className="text-indigo-500 mb-2" />
                    <span className="text-sm font-medium text-slate-700">{file.name}</span>
                    <span className="text-xs text-indigo-600 mt-1 hover:underline">Cambiar archivo</span>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-slate-700">Haz clic para subir un archivo</span>
                    <span className="text-xs text-slate-500 mt-1">PDF o Imagen (Máx. 5MB)</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-bold flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Confirmar Firma'
              )}
            </button>
          </div>
        </div>
      </div>
      <Toast
        isVisible={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}
