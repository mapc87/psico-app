import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase/client';
import { Calendar, ClipboardList, FileText, Loader2, Video, CheckCircle2, ExternalLink, FileSignature, Printer, X, ShieldCheck } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import DocumentoPrint from '../../components/documentos/DocumentoPrint';
import type { Cita, TareaPaciente, ArchivoPaciente, ConsentimientoFirmado } from '../../types';

export default function PortalDashboard() {
  const patientStr = localStorage.getItem('portalPaciente');
  const patient = patientStr ? JSON.parse(patientStr) : null;
  
  const [citas, setCitas] = useState<Cita[]>([]);
  const [tareas, setTareas] = useState<TareaPaciente[]>([]);
  const [archivos, setArchivos] = useState<ArchivoPaciente[]>([]);
  const [documentos, setDocumentos] = useState<ConsentimientoFirmado[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [rpcError, setRpcError] = useState<string | null>(null);

  // Documento seleccionado para ver/imprimir
  const [selectedDoc, setSelectedDoc] = useState<ConsentimientoFirmado | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: selectedDoc ? selectedDoc.titulo : 'Documento_Firmado'
  });

  useEffect(() => {
    if (patient?.id) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [patient?.id]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setRpcError(null);
    try {
      // Usar función RPC segura para cargar datos del portal sin requerir auth.uid()
      const { data, error } = await supabase.rpc('obtener_datos_portal_paciente', {
        p_paciente_id: patient.id,
        p_pin_acceso: patient.pin_acceso || null
      });

      if (error) {
        console.error("Error en RPC obtener_datos_portal_paciente:", error);
        setRpcError("Atención: Es necesario ejecutar el script SQL '14_fix_portal_paciente_rpc.sql' en el SQL Editor de tu proyecto Supabase para habilitar la lectura de datos.");
      } else if (data) {
        setCitas(data.citas || []);
        setTareas(data.tareas || []);
        setArchivos(data.archivos || []);
        setDocumentos(data.documentos || []);
      }
    } catch (error) {
      console.error("Error al cargar datos del portal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompletarTarea = async (tareaId: string) => {
    setUpdatingTaskId(tareaId);
    try {
      const { error } = await supabase.rpc('completar_tarea_portal', {
        p_tarea_id: tareaId,
        p_paciente_id: patient.id,
        p_pin_acceso: patient.pin_acceso || null
      });

      if (!error) {
        setTareas(prev => prev.map(t => t.id === tareaId ? { ...t, estado: 'completado' } : t));
      }
    } catch (err) {
      console.error("Error al marcar tarea como completada:", err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleVerArchivo = async (archivo: ArchivoPaciente) => {
    try {
      const { data, error } = await supabase.storage
        .from('pacientes_archivos')
        .createSignedUrl(archivo.ruta_storage, 3600);

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else if (error) {
        alert("No se pudo obtener el enlace de descarga del archivo.");
      }
    } catch (err) {
      console.error("Error al obtener enlace del archivo:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center text-slate-600 bg-white rounded-3xl border border-slate-200">
        No se encontró información del paciente. Por favor inicia sesión nuevamente.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">¡Hola, {patient.nombre ? patient.nombre.split(' ')[0] : 'Paciente'}!</h1>
        <p className="text-violet-100">Bienvenido a tu portal personal. Revisa tus próximas citas, tareas, recursos y documentos firmados.</p>
      </div>

      {rpcError && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-sm font-medium">
          ⚠️ {rpcError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Próximas Citas */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 shrink-0">
              <Calendar size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Próximas Citas</h2>
          </div>
          
          {citas.length === 0 ? (
            <p className="text-slate-500 text-sm">No tienes citas programadas próximamente.</p>
          ) : (
            <div className="space-y-4 flex-1">
              {citas.map(cita => (
                <div key={cita.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="font-bold text-slate-800 capitalize">
                    {new Date(cita.fecha_hora).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    {cita.modalidad === 'virtual' || cita.modalidad === 'en_linea' ? 'Videoconsulta' : 'Presencial'}
                  </span>
                  
                  {(cita.modalidad === 'virtual' || cita.modalidad === 'en_linea' || cita.enlace_video) && (
                    <a 
                      href={`/sala-virtual/${cita.enlace_video || cita.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 w-full flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                    >
                      <Video size={16} className="mr-2" />
                      Unirse a Videollamada
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tareas Pendientes */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3 shrink-0">
              <ClipboardList size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Tareas y Ejercicios</h2>
          </div>
          
          {tareas.length === 0 ? (
            <p className="text-slate-500 text-sm">¡Al día! No tienes tareas asignadas.</p>
          ) : (
            <div className="space-y-4 flex-1">
              {tareas.map(tarea => {
                const isCompleted = tarea.estado === 'completado';
                return (
                  <div 
                    key={tarea.id} 
                    className={`p-4 rounded-2xl border transition-all ${
                      isCompleted 
                        ? 'bg-emerald-50 border-emerald-100 opacity-80' 
                        : 'bg-amber-50 border-amber-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`font-bold text-slate-800 ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                          {tarea.titulo}
                        </p>
                        {tarea.descripcion && (
                          <p className="text-sm text-slate-600 mt-1">{tarea.descripcion}</p>
                        )}
                      </div>
                    </div>
                    
                    {!isCompleted && (
                      <button
                        onClick={() => handleCompletarTarea(tarea.id)}
                        disabled={updatingTaskId === tarea.id}
                        className="mt-3 flex items-center text-xs font-bold text-amber-700 hover:text-emerald-700 bg-amber-100 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {updatingTaskId === tarea.id ? (
                          <Loader2 size={14} className="animate-spin mr-1.5" />
                        ) : (
                          <CheckCircle2 size={14} className="mr-1.5 text-emerald-600" />
                        )}
                        Marcar como completada
                      </button>
                    )}
                    {isCompleted && (
                      <span className="mt-3 inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                        <CheckCircle2 size={13} className="mr-1 text-emerald-600" /> Completada
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Archivos y Recursos */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3 shrink-0">
              <FileText size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Recursos</h2>
          </div>
          
          {archivos.length === 0 ? (
            <p className="text-slate-500 text-sm">Aún no hay archivos compartidos contigo.</p>
          ) : (
            <div className="space-y-4 flex-1">
              {archivos.map(archivo => (
                <div 
                  key={archivo.id} 
                  onClick={() => handleVerArchivo(archivo)}
                  className="flex items-center p-3 bg-slate-50 hover:bg-violet-50 rounded-xl border border-slate-100 hover:border-violet-200 transition-colors cursor-pointer group"
                >
                  <FileText className="text-slate-400 group-hover:text-violet-600 mr-3 transition-colors shrink-0" size={20} />
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium text-sm text-slate-800 group-hover:text-violet-900 truncate transition-colors">
                      {archivo.nombre_original}
                    </p>
                  </div>
                  <ExternalLink className="text-slate-400 group-hover:text-violet-600 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2" size={16} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documentos Legales y Consentimientos Firmados */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 shrink-0">
              <FileSignature size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Documentos Firmados</h2>
          </div>
          
          {documentos.length === 0 ? (
            <p className="text-slate-500 text-sm">No tienes documentos o términos firmados registrados.</p>
          ) : (
            <div className="space-y-4 flex-1">
              {documentos.map(doc => (
                <div 
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="p-4 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl border border-indigo-100 hover:border-indigo-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-900 line-clamp-2">
                      {doc.titulo}
                    </p>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                      <ShieldCheck size={13} className="mr-1 text-emerald-600" /> Firmado
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(doc.fecha_firma).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal de Previsualización / Impresión de Documento Firmado */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <FileSignature size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{selectedDoc.titulo}</h3>
                  <p className="text-xs text-slate-500">Firmado el {new Date(selectedDoc.fecha_firma).toLocaleString('es-ES')}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePrint()}
                  className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
                >
                  <Printer size={16} className="mr-2" />
                  Imprimir / Descargar
                </button>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Visualización del Documento */}
            <div className="p-8 overflow-y-auto flex-1 bg-slate-100/50">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="mb-6 pb-4 border-b border-slate-200 text-center">
                  <h2 className="text-xl font-bold text-slate-800">{selectedDoc.titulo}</h2>
                  <p className="text-xs text-slate-500 mt-1">Documento Aceptado y Firmado por el Paciente</p>
                </div>

                <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed mb-8">
                  {selectedDoc.contenido_firmado}
                </div>

                {selectedDoc.firma_data_url && (
                  <div className="pt-6 border-t border-slate-200 flex flex-col items-center">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Firma Digital del Paciente</p>
                    <img 
                      src={selectedDoc.firma_data_url} 
                      alt="Firma Paciente" 
                      className="h-20 object-contain max-w-xs border border-slate-200 rounded-xl p-2 bg-slate-50" 
                    />
                    <p className="text-xs font-medium text-slate-700 mt-2">{patient.nombre}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Elemento Oculto para Impresión */}
            <div className="hidden">
              <DocumentoPrint
                ref={printRef}
                documento={selectedDoc}
                pacienteNombre={patient.nombre}
                pacienteIdentificacion={patient.dpi}
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
