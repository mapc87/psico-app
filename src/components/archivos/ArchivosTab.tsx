import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../context/AuthContext';
import { FileText, Image as ImageIcon, Music, Trash2, Download, UploadCloud, X, Loader2, ExternalLink } from 'lucide-react';
import type { ArchivoPaciente } from '../../types';

interface ArchivosTabProps {
  pacienteId: string;
}

export default function ArchivosTab({ pacienteId }: ArchivosTabProps) {
  const { usuarioActual } = useAuth();
  const [archivos, setArchivos] = useState<ArchivoPaciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchArchivos();
  }, [pacienteId]);

  const fetchArchivos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('archivos_paciente')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha_subida', { ascending: false });

    if (!error && data) {
      setArchivos(data);
    }
    setLoading(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) return <Music className="w-8 h-8 text-purple-500" />;
    return <FileText className="w-8 h-8 text-red-500" />;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !usuarioActual?.clinica_id) return;

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert("El archivo no puede pesar más de 10MB.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${usuarioActual.clinica_id}/${pacienteId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pacientes_archivos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: dbData, error: dbError } = await supabase
        .from('archivos_paciente')
        .insert([{
          clinica_id: usuarioActual.clinica_id,
          paciente_id: pacienteId,
          nombre_original: file.name,
          ruta_storage: filePath,
          tipo_mime: file.type,
          tamano_bytes: file.size,
          subido_por: usuarioActual.id
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      if (dbData) {
        setArchivos([dbData, ...archivos]);
      }
    } catch (error: any) {
      console.error("Error al subir archivo:", error);
      alert("Error al subir el archivo: " + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (archivo: ArchivoPaciente) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${archivo.nombre_original}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      // 1. Delete from storage
      const { error: storageError } = await supabase.storage
        .from('pacientes_archivos')
        .remove([archivo.ruta_storage]);

      if (storageError) throw storageError;

      // 2. Delete from DB
      const { error: dbError } = await supabase
        .from('archivos_paciente')
        .delete()
        .eq('id', archivo.id);

      if (dbError) throw dbError;

      setArchivos(archivos.filter(a => a.id !== archivo.id));
    } catch (error: any) {
      console.error("Error al eliminar:", error);
      alert("Error al eliminar el archivo: " + error.message);
    }
  };

  const handleDownload = async (archivo: ArchivoPaciente) => {
    try {
      const { data, error } = await supabase.storage
        .from('pacientes_archivos')
        .createSignedUrl(archivo.ruta_storage, 60); // 60 seconds valid

      if (error) throw error;
      
      // Abrir en nueva pestaña
      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      console.error("Error al generar link:", error);
      alert("Error al descargar el archivo: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Archivos y Anexos</h2>
          <p className="text-slate-500 mt-1">Sube resultados médicos, audios o documentos PDF del paciente.</p>
        </div>
        <div>
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            accept=".pdf,.jpg,.jpeg,.png,.mp3,.wav"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
            {uploading ? 'Subiendo...' : 'Subir Archivo'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Cargando archivos...</p>
          </div>
        ) : archivos.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <UploadCloud className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">No hay archivos adjuntos</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Aún no se han subido documentos para este paciente. Utiliza el botón superior para subir el primero.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {archivos.map((archivo) => (
              <div key={archivo.id} className="group relative bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all">
                
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <button 
                    onClick={() => handleDelete(archivo)}
                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    {getFileIcon(archivo.tipo_mime)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate" title={archivo.nombre_original}>
                      {archivo.nombre_original}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatFileSize(archivo.tamano_bytes)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(archivo.fecha_subida).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleDownload(archivo)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir Archivo
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
