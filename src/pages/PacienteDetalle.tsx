import React, { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Camera, Calendar, Phone, Mail, MapPin, Activity, CalendarPlus, Pill, Edit2, CheckCircle2, ChevronLeft, CreditCard, Droplets, Printer, Eye, Lock, BrainCircuit, Heart, ClipboardList, Shield, Video, ArrowLeft, User, Thermometer, Wind, Scale, AlertTriangle, Wallet, DollarSign, Receipt, AlertCircle, Sparkles, FileSignature, CheckCircle, Copy, Link as LinkIcon, PenTool, X, FileText, Clock, Paperclip, Package } from 'lucide-react';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { emailService } from '../services/email/emailService';
import ModalNuevaCita from '../components/citas/ModalNuevaCita';
import ModalNuevoExamen from '../components/examenes/ModalNuevoExamen';
import OrdenExamenPrint from '../components/examenes/OrdenExamenPrint';
import ModalNuevoSigno from '../components/signos/ModalNuevoSigno';
import ModalNuevaNota from '../components/historial/ModalNuevaNota';
import ModalNuevaNotaIA from '../components/notas/ModalNuevaNotaIA';
import ModalNuevoDiagnostico from '../components/diagnosticos/ModalNuevoDiagnostico';
import ModalNuevoMedicamento from '../components/medicamentos/ModalNuevoMedicamento';
import RecetaPrint from '../components/medicamentos/RecetaPrint';
import ModalFirma from '../components/documentos/ModalFirma';
import ModalEnviarCorreo from '../components/common/ModalEnviarCorreo';
import ModalAsignarEvaluacion from '../components/evaluaciones/ModalAsignarEvaluacion';
import ModalRealizarEvaluacion from '../components/evaluaciones/ModalRealizarEvaluacion';
import GraficoEvaluaciones from '../components/evaluaciones/GraficoEvaluaciones';
import EvaluacionPrint from '../components/evaluaciones/EvaluacionPrint';
import ModalAnalisisIA from '../components/evaluaciones/ModalAnalisisIA';
import ModalNuevaTarea from '../components/tareas/ModalNuevaTarea';
import Toast from '../components/common/Toast';
import ArchivosTab from '../components/archivos/ArchivosTab';
import { useReactToPrint } from 'react-to-print';
import type { Examen, SignosVitales, ConsentimientoFirmado, PlantillaDocumento, EvaluacionPaciente, EvaluacionPlantilla, TareaPaciente } from '../types';
import type { SendEmailResult } from '../services/email/emailService';

export default function PacienteDetalle() {
  const { id } = useParams();
  const { usuarioActual } = useAuth();
  const [activeTab, setActiveTab] = useState('resumen');
  const [isCitaModalOpen, setIsCitaModalOpen] = useState(false);
  const [isExamenModalOpen, setIsExamenModalOpen] = useState(false);
  const [isSignoModalOpen, setIsSignoModalOpen] = useState(false);
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [isNotaIAModalOpen, setIsNotaIAModalOpen] = useState(false);
  const [isAnalisisIAModalOpen, setIsAnalisisIAModalOpen] = useState(false);
  const [isTareaModalOpen, setIsTareaModalOpen] = useState(false);
  const [evaluacionParaAnalisis, setEvaluacionParaAnalisis] = useState<EvaluacionPaciente | null>(null);
  
  const [isDiagnosticoModalOpen, setIsDiagnosticoModalOpen] = useState(false);
  const [isMedicamentoModalOpen, setIsMedicamentoModalOpen] = useState(false);
  const [examenParaImprimir, setExamenParaImprimir] = useState<Examen | null>(null);
  const [evaluacionParaImprimir, setEvaluacionParaImprimir] = useState<EvaluacionPaciente | null>(null);
  
  const printRef = useRef<HTMLDivElement>(null);
  const recetaPrintRef = useRef<HTMLDivElement>(null);
  const evaluacionPrintRef = useRef<HTMLDivElement>(null);

  const handlePrintExamen = useReactToPrint({
    contentRef: printRef,
  });

  const handlePrintEvaluacion = useReactToPrint({
    contentRef: evaluacionPrintRef,
  });

  const [paciente, setPaciente] = useState<any>(undefined);
  const [paqueteActivo, setPaqueteActivo] = useState<any>(null);
  const [permisos, setPermisos] = useState<any>(null);
  const [citas, setCitas] = useState<any[]>([]);
  const [isHistorialCitasOpen, setIsHistorialCitasOpen] = useState(false);
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [signos, setSignos] = useState<SignosVitales[]>([]);
  const [notas, setNotas] = useState<any[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [tareas, setTareas] = useState<TareaPaciente[]>([]);
  const [consentimientos, setConsentimientos] = useState<ConsentimientoFirmado[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaDocumento[]>([]);
  const [clinicaData, setClinicaData] = useState<any>(null);;
  const [isFirmaModalOpen, setIsFirmaModalOpen] = useState(false);
  const [isGestorDocumentosOpen, setIsGestorDocumentosOpen] = useState(false);
  const [consentimientoActivo, setConsentimientoActivo] = useState<ConsentimientoFirmado | null>(null);

  // Evaluaciones Psicométricas
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionPaciente[]>([]);
  const [isAsignarEvaluacionModalOpen, setIsAsignarEvaluacionModalOpen] = useState(false);
  const [isRealizarEvaluacionModalOpen, setIsRealizarEvaluacionModalOpen] = useState(false);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<EvaluacionPlantilla | null>(null);

  const [modalCorreoState, setModalCorreoState] = useState<{
    isOpen: boolean;
    titulo: string;
    subtitulo?: string;
    emailDefault?: string;
    onSend: (email: string) => Promise<SendEmailResult>;
  }>({
    isOpen: false,
    titulo: '',
    onSend: async () => ({ success: false, mode: 'demo' }),
  });

  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type?: 'success' | 'error' | 'info' }>({
    isVisible: false,
    message: '',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 4000);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !usuarioActual?.clinica_id) return;
      
      const pId = id;
      
      const { data: pData } = await supabase.from('pacientes').select('*').eq('id', pId).single();
      setPaciente(pData || null);
      
      if (usuarioActual.rol_id) {
        const { data: rData } = await supabase.from('roles').select('permisos').eq('id', usuarioActual.rol_id).single();
        if (rData) setPermisos(rData.permisos);
      }

      const { data: cData } = await supabase.from('citas').select('*').eq('paciente_id', pId).order('fecha_hora', { ascending: false });
      if (cData) setCitas(cData);

      const { data: eData } = await supabase.from('examenes').select('*').eq('paciente_id', pId).order('fecha_solicitud', { ascending: false });
      if (eData) setExamenes(eData);

      const { data: sData } = await supabase.from('signos_vitales').select('*').eq('paciente_id', pId).order('fecha', { ascending: false });
      if (sData) setSignos(sData);

      const { data: nData } = await supabase.from('notas_clinicas').select('*').eq('paciente_id', pId).order('fecha', { ascending: false });
      if (nData) setNotas(nData);

      const { data: dData } = await supabase.from('diagnosticos').select('*').eq('paciente_id', pId).order('fecha', { ascending: false });
      if (dData) setDiagnosticos(dData);

      const { data: mData } = await supabase.from('medicamentos').select('*').eq('paciente_id', pId).order('fecha_prescripcion', { ascending: false });
      if (mData) setMedicamentos(mData);

      const { data: tData } = await supabase.from('tareas_paciente').select('*').eq('paciente_id', pId).order('fecha_asignacion', { ascending: false });
      if (tData) setTareas(tData);
      
      const { data: consentimientosData } = await supabase.from('consentimientos_firmados').select('*').eq('paciente_id', pId).order('fecha_firma', { ascending: false });
      if (consentimientosData) setConsentimientos(consentimientosData);

      const { data: evalsData } = await supabase.from('evaluaciones_pacientes').select('*, evaluaciones_plantillas(*)').eq('paciente_id', pId).order('fecha', { ascending: false });
      if (evalsData) {
        // Mapear la relación para que coincida con la interfaz del Frontend
        const mappedEvals = evalsData.map(e => ({
          ...e,
          plantilla: e.evaluaciones_plantillas
        }));
        setEvaluaciones(mappedEvals as EvaluacionPaciente[]);
      }

      if (usuarioActual.clinica_id) {
        const { data: plData } = await supabase.from('plantillas_documentos').select('*').eq('clinica_id', usuarioActual.clinica_id);
        if (plData) setPlantillas(plData);

        // Cargar datos de la clínica para los documentos imprimibles
        const { data: clinicaRes } = await supabase.from('clinicas').select('*').eq('id', usuarioActual.clinica_id).single();
        if (clinicaRes) setClinicaData(clinicaRes);
      }

      // Obtener paquete activo
      const { data: paqueteData } = await supabase.from('paciente_paquetes')
        .select(`*, paquete:paquetes_sesiones(*)`)
        .eq('paciente_id', pId)
        .eq('estado', 'activo')
        .single();
      if (paqueteData) setPaqueteActivo(paqueteData);
    };
    
    fetchData();
  }, [id, usuarioActual?.clinica_id, usuarioActual?.rol_id]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Orden_Examen_${paciente?.nombre?.replace(/\s+/g, '_') || 'Paciente'}`,
  });

  const ultimoSigno = signos && signos.length > 0 ? signos[0] : null;

  const handleSaveCita = async (fecha_hora: string, motivo: string, pacienteId?: string, modalidad?: 'presencial' | 'virtual', enlace_video?: string) => {
    if (!usuarioActual) return;
    const nuevaCita = {
      clinica_id: usuarioActual.clinica_id,
      paciente_id: id,
      medico_id: usuarioActual.id,
      fecha_hora,
      motivo,
      estado: 'programada',
      modalidad: modalidad || 'presencial',
      enlace_video
    };
    const { data, error } = await supabase.from('citas').insert([nuevaCita]).select().single();
    if (error) {
      console.error("Error exacto de Supabase:", error);
      throw new Error(error.message);
    }
    if (data) setCitas([data, ...citas].sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime()));
  };

  const handleSaveExamen = async (tipo_examen: string, fecha_solicitud: string) => {
    if (!usuarioActual) return;
    const nuevoExamen = {
      clinica_id: usuarioActual.clinica_id,
      paciente_id: id,
      medico_id: usuarioActual.id,
      tipo_examen,
      fecha_solicitud,
      estado: 'pendiente'
    };
    const { data, error } = await supabase.from('examenes').insert([nuevoExamen]).select().single();
    if (error) {
      console.error("Error exacto de Supabase:", error);
      throw new Error(error.message);
    }
    if (data) setExamenes([data, ...examenes].sort((a, b) => new Date(b.fecha_solicitud).getTime() - new Date(a.fecha_solicitud).getTime()));
  };

  const cambiarEstadoExamen = async (examenId: string, nuevoEstado: 'pendiente' | 'completado') => {
    const { data } = await supabase.from('examenes').update({ estado: nuevoEstado }).eq('id', examenId).select().single();
    if (data) setExamenes(examenes.map(e => e.id === examenId ? data : e));
  };

  const handleSaveSignos = async (data: any) => {
    if (!usuarioActual) return;
    const nuevoSigno = {
      clinica_id: usuarioActual.clinica_id,
      paciente_id: id,
      fecha: new Date().toISOString(),
      presion_arterial: data.presion_arterial,
      frecuencia_cardiaca: data.frecuencia_cardiaca,
      saturacion_oxigeno: data.saturacion_oxigeno,
      temperatura: data.temperatura,
      peso: data.peso,
      talla: data.talla,
      imc: data.imc
    };
    const { data: res, error } = await supabase.from('signos_vitales').insert([nuevoSigno]).select().single();
    if (error) {
      console.error("Error exacto de Supabase:", error);
      throw new Error(error.message);
    }
    if (res) setSignos([res, ...signos].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
  };

  const handleSaveNota = async (titulo: string, contenido: string, fecha: string) => {
    if (!usuarioActual) return;
    const nuevaNota = {
      clinica_id: usuarioActual.clinica_id,
      paciente_id: id,
      medico_id: usuarioActual.id,
      titulo,
      contenido,
      fecha
    };
    const { data, error } = await supabase.from('notas_clinicas').insert([nuevaNota]).select().single();
    if (error) {
      console.error("Error exacto de Supabase:", error);
      throw new Error(error.message);
    }
    if (data) setNotas([data, ...notas].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
  };

  const handleSaveDiagnostico = async (enfermedad: string, plan_tratamiento: string, fecha: string) => {
    if (!usuarioActual) return;
    const nuevoDiag = {
      clinica_id: usuarioActual.clinica_id,
      paciente_id: id,
      medico_id: usuarioActual.id,
      enfermedad,
      plan_tratamiento,
      fecha,
      estado: 'activo'
    };
    const { data, error } = await supabase.from('diagnosticos').insert([nuevoDiag]).select().single();
    if (error) {
      console.error("Error exacto de Supabase:", error);
      throw new Error(error.message);
    }
    if (data) setDiagnosticos([data, ...diagnosticos].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
  };

  const handleSaveTarea = async (titulo: string, descripcion: string) => {
    if (!usuarioActual) return;
    const nuevaTarea = {
      clinica_id: usuarioActual.clinica_id,
      paciente_id: id,
      medico_id: usuarioActual.id,
      titulo,
      descripcion,
      estado: 'pendiente'
    };
    const { data, error } = await supabase.from('tareas_paciente').insert([nuevaTarea]).select().single();
    if (error) {
      console.error("Error exacto de Supabase:", error);
      throw new Error(error.message);
    }
    if (data) setTareas([data, ...tareas].sort((a, b) => new Date(b.fecha_asignacion).getTime() - new Date(a.fecha_asignacion).getTime()));
  };

  const cambiarEstadoTarea = async (tareaId: string, nuevoEstado: 'pendiente' | 'completada') => {
    const { data } = await supabase.from('tareas_paciente').update({ 
      estado: nuevoEstado,
      fecha_completada: nuevoEstado === 'completada' ? new Date().toISOString() : null
    }).eq('id', tareaId).select().single();
    if (data) setTareas(tareas.map(t => t.id === tareaId ? data : t));
  };

  const cambiarEstadoDiagnostico = async (diagnosticoId: string, nuevoEstado: 'activo' | 'resuelto') => {
    const { data } = await supabase.from('diagnosticos').update({ estado: nuevoEstado }).eq('id', diagnosticoId).select().single();
    if (data) setDiagnosticos(diagnosticos.map(d => d.id === diagnosticoId ? data : d));
  };

  const handleSaveMedicamento = async (nombre: string, dosis: string, frecuencia: string, duracion: string, indicaciones: string, fecha_prescripcion: string) => {
    if (!usuarioActual) return;
    const nuevoMed = {
      clinica_id: usuarioActual.clinica_id,
      paciente_id: id,
      medico_id: usuarioActual.id,
      nombre,
      dosis,
      frecuencia,
      duracion,
      indicaciones,
      fecha_prescripcion,
      estado: 'activo'
    };
    const { data, error } = await supabase.from('medicamentos').insert([nuevoMed]).select().single();
    if (error) {
      console.error("Error exacto de Supabase:", error);
      throw new Error(error.message);
    }
    if (data) setMedicamentos([data, ...medicamentos].sort((a, b) => new Date(b.fecha_prescripcion).getTime() - new Date(a.fecha_prescripcion).getTime()));
  };

  const suspenderMedicamento = async (medicamentoId: string) => {
    const { data } = await supabase.from('medicamentos').update({ estado: 'suspendido' }).eq('id', medicamentoId).select().single();
    if (data) setMedicamentos(medicamentos.map(m => m.id === medicamentoId ? data : m));
  };

  const handlePrintReceta = useReactToPrint({
    contentRef: recetaPrintRef,
    documentTitle: `Receta_${paciente?.nombre?.replace(/\s+/g, '_') || 'Paciente'}_${new Date().toISOString().split('T')[0]}`
  });

  const handleEnviarRecetaEmail = () => {
    const medsActivos = medicamentos?.filter(m => m.estado === 'activo') || [];
    if (medsActivos.length === 0) {
      showToast('No hay medicamentos activos para enviar en la receta.', 'error');
      return;
    }

    setModalCorreoState({
      isOpen: true,
      titulo: 'Enviar Receta Médica por Correo',
      subtitulo: 'Se enviará la receta médica digital con todos los tratamientos activos prescritos.',
      emailDefault: paciente?.email || '',
      onSend: async (correo) => {
        const res = await emailService.enviarRecetaMedica(correo, {
          pacienteNombre: paciente?.nombre || 'Paciente',
          medicamentos: medsActivos,
          doctorNombre: usuarioActual?.nombre || 'Doctor Atendiente',
        });
        if (res.success) {
          showToast(`Receta médica enviada a ${correo}`);
        }
        return res;
      },
    });
  };

  const handleEnviarFirmaEmail = (doc: ConsentimientoFirmado) => {
    setModalCorreoState({
      isOpen: true,
      titulo: 'Enviar Enlace de Firma Remota',
      subtitulo: `Documento: "${doc.titulo}". El paciente recibirá un enlace seguro para firmar.`,
      emailDefault: paciente?.email || '',
      onSend: async (correo) => {
        const urlFirma = `${window.location.origin}/firmar/${doc.id}`;
        const res = await emailService.enviarFirmaRemota(correo, {
          pacienteNombre: paciente?.nombre || 'Paciente',
          documentoTitulo: doc.titulo,
          urlFirma,
        });
        if (res.success) {
          showToast(`Enlace de firma enviado a ${correo}`);
        }
        return res;
      },
    });
  };

  const handleCrearYEnviarDocumentoRemoto = (p: PlantillaDocumento) => {
    setModalCorreoState({
      isOpen: true,
      titulo: 'Generar y Enviar Documento por Correo',
      subtitulo: `Plantilla: "${p.titulo}". Se registrará el consentimiento legal y se enviará por correo.`,
      emailDefault: paciente?.email || '',
      onSend: async (correo) => {
        const { data, error } = await supabase.from('consentimientos_firmados').insert({
          clinica_id: usuarioActual!.clinica_id,
          paciente_id: id!,
          plantilla_id: p.id,
          titulo: p.titulo,
          contenido_firmado: p.contenido.replace(/{{PACIENTE_NOMBRE}}/g, paciente?.nombre || ''),
          firma_data_url: '',
          estado: 'pendiente',
          fecha_firma: new Date().toISOString()
        }).select().single();

        if (error) {
          return { success: false, error: error.message, mode: 'resend' };
        }

        if (data) {
          setConsentimientos([data, ...consentimientos]);
          const urlFirma = `${window.location.origin}/firmar/${data.id}`;
          const res = await emailService.enviarFirmaRemota(correo, {
            pacienteNombre: paciente?.nombre || 'Paciente',
            documentoTitulo: data.titulo,
            urlFirma,
          });
          if (res.success) {
            showToast(`Documento generado y correo enviado a ${correo}`);
          }
          return res;
        }
        return { success: false, error: 'Error creando consentimiento', mode: 'resend' };
      },
    });
  };

  const handleAsignarEvaluacion = async (plantilla: PlantillaDocumento | any, mode: 'presencial' | 'remoto') => {
    setIsAsignarEvaluacionModalOpen(false);
    
    if (mode === 'presencial') {
      setPlantillaSeleccionada(plantilla);
      setIsRealizarEvaluacionModalOpen(true);
    } else {
      // Modo Remoto
      if (!usuarioActual) return;
      const nuevaEvaluacion = {
        clinica_id: usuarioActual.clinica_id,
        paciente_id: id!,
        medico_id: usuarioActual.id,
        plantilla_id: plantilla.id,
        respuestas: {},
        puntaje_total: 0,
        estado: 'pendiente',
        fecha: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('evaluaciones_pacientes')
        .insert([nuevaEvaluacion])
        .select('*')
        .single();

      if (error) {
        alert('Error al asignar la evaluación remota: ' + error.message);
        return;
      }
      
      const link = `${window.location.origin}/evaluacion/${data.id}`;
      navigator.clipboard.writeText(link);
      showToast('Enlace de evaluación copiado al portapapeles. ¡Envíalo al paciente!');
      // Refetch for the list
      const { data: evalData } = await supabase.from('evaluaciones_pacientes')
        .select(`*, plantilla:evaluaciones_plantillas(*)`)
        .eq('paciente_id', id!)
        .order('fecha', { ascending: false });
      if (evalData) setEvaluaciones(evalData);
    }
  };

  const calcularEdad = (fechaNacimiento?: string | null) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return Math.max(0, edad);
  };

  const handleSaveFirma = async (dataUrl: string) => {
    if (!consentimientoActivo) return;
    
    // Si es un consentimiento temporal (nuevo), hacemos insert
    if (consentimientoActivo.id.startsWith('temp-')) {
      const { error } = await supabase.from('consentimientos_firmados').insert({
        clinica_id: consentimientoActivo.clinica_id,
        paciente_id: consentimientoActivo.paciente_id,
        plantilla_id: consentimientoActivo.plantilla_id,
        titulo: consentimientoActivo.titulo,
        contenido_firmado: consentimientoActivo.contenido_firmado,
        firma_data_url: dataUrl,
        estado: 'firmado',
        fecha_firma: new Date().toISOString()
      });
      if (error) alert('Error al guardar la firma');
    } else {
      // Si ya existía como pendiente, hacemos update
      const { error } = await supabase.from('consentimientos_firmados').update({
        firma_data_url: dataUrl,
        estado: 'firmado',
        fecha_firma: new Date().toISOString()
      }).eq('id', consentimientoActivo.id);
      if (error) alert('Error al actualizar la firma');
    }
    
    // Refetch
    const { data: consentimientosData } = await supabase.from('consentimientos_firmados').select('*').eq('paciente_id', id!).order('fecha_firma', { ascending: false });
    if (consentimientosData) setConsentimientos(consentimientosData);
    
    setIsFirmaModalOpen(false);
    setConsentimientoActivo(null);
  };

  const recargarPaqueteActivo = async () => {
    const { data: paqueteData } = await supabase.from('paciente_paquetes')
      .select(`*, paquete:paquetes_sesiones(*)`)
      .eq('paciente_id', id)
      .eq('estado', 'activo')
      .single();
    if (paqueteData) setPaqueteActivo(paqueteData);
    else setPaqueteActivo(null);
  };

  const allTabs = [
    { id: 'resumen', label: 'Resumen', icon: <User size={18} />, key: 'verResumen' },
    { id: 'archivos', label: 'Archivos', icon: <Paperclip size={18} />, key: 'verResumen' },
    { id: 'diagnosticos', label: 'Diagnósticos', icon: <Activity size={18} />, key: 'verDiagnosticos' },
    { id: 'evaluaciones', label: 'Evaluaciones', icon: <BrainCircuit size={18} />, key: 'verHistorial' }, // Evaluaciones como 4ta opción
    { id: 'tareas', label: 'Tareas', icon: <ClipboardList size={18} />, key: 'verHistorial' },
    { id: 'examenes', label: 'Exámenes', icon: <ClipboardList size={18} />, key: 'verExamenes' },
    { id: 'signos', label: 'Signos Vitales', icon: <Heart size={18} />, key: 'verSignos' },
    { id: 'medicamentos', label: 'Medicamentos', icon: <Pill size={18} />, key: 'verMedicamentos' }
  ];

  // Filtrar tabs según permisos
  const tabs = allTabs.filter(tab => {
    if (usuarioActual?.rol === 'superadmin' || usuarioActual?.rol === 'admin' || usuarioActual?.rol === 'admin') return true;
    if (usuarioActual?.rol === 'personal' && permisos) {
      return permisos[tab.key as keyof typeof permisos] === true;
    }
    return false;
  });

  if (paciente === undefined) {
    return <div className="p-12 text-center text-slate-500">Cargando expediente...</div>;
  }

  if (paciente === null) {
    return <div className="p-12 text-center text-red-500">Paciente no encontrado.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Botón de Regresar y Acciones Globales */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link to="/pacientes" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-violet-600 transition-colors group">
          <ArrowLeft size={16} className="mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Volver a Pacientes
        </Link>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsHistorialCitasOpen(true)}
            className="flex items-center px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 hover:text-violet-600 rounded-xl border border-slate-200 shadow-sm text-sm font-bold transition-all cursor-pointer"
          >
            <Calendar size={16} className="mr-2" />
            Citas
          </button>
          <button 
            onClick={() => setIsGestorDocumentosOpen(true)}
            className="flex items-center px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-xl border border-slate-200 shadow-sm text-sm font-bold transition-all cursor-pointer"
          >
            <FileSignature size={16} className="mr-2" />
            Documentos Legales
          </button>
        </div>
      </div>

      {/* Header del Expediente */}
      <div className="bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col lg:flex-row items-center lg:items-start justify-between relative overflow-hidden gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-200/40 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        {/* Izquierda: Info principal */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left z-10 w-full lg:w-auto shrink-0">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-fuchsia-50 rounded-2xl flex items-center justify-center text-violet-600 text-3xl font-extrabold sm:mr-6 mb-4 sm:mb-0 shadow-inner border border-violet-100/50 shrink-0">
            {paciente.nombre.charAt(0)}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{paciente.nombre}</h2>
            <p className="text-slate-500 flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start mt-2 font-medium gap-2 sm:gap-0">
              <span className="sm:mr-6 flex items-center"><User size={16} className="mr-2 opacity-70"/> Edad: {paciente.fecha_nacimiento ? `${calcularEdad(paciente.fecha_nacimiento)} años` : 'No registrada'}</span>
              <span className="flex items-center"><Phone size={16} className="mr-2 opacity-70"/> Teléfono: {paciente.telefono}</span>
            </p>
            {paciente.nombre_responsable && (
              <p className="text-slate-500 flex items-center justify-center sm:justify-start mt-1 text-sm">
                <Shield size={14} className="mr-1.5 opacity-70" />
                Resp: <span className="font-semibold text-slate-700 ml-1">{paciente.nombre_responsable}</span> 
                {paciente.parentesco && <span className="ml-1 text-slate-400">({paciente.parentesco})</span>}
                {paciente.telefono_responsable && <span className="ml-2 px-2 py-0.5 bg-slate-100 rounded-md text-xs">{paciente.telefono_responsable}</span>}
              </p>
            )}
          </div>
        </div>

        {/* Derecha: Tarjetas de resumen */}
        <div className="z-10 flex flex-wrap lg:flex-nowrap gap-3 w-full lg:w-auto lg:justify-end mt-4 lg:mt-0">
          {/* Paquete Activo */}
          {paqueteActivo && (
            <div className="p-3 bg-fuchsia-50/80 backdrop-blur-sm rounded-xl border border-fuchsia-200 flex-1 min-w-[140px] max-w-[220px] flex items-center shadow-sm">
              <div className="p-1.5 bg-fuchsia-100 rounded-lg mr-2 text-fuchsia-600 shrink-0">
                <Package size={16} />
              </div>
              <div className="min-w-0">
                <h4 className="text-[10px] font-bold text-fuchsia-500 uppercase tracking-wider mb-0.5 truncate" title={paqueteActivo.paquete.nombre}>{paqueteActivo.paquete.nombre}</h4>
                <p className="text-fuchsia-700 font-bold text-xs truncate">{paqueteActivo.sesiones_restantes} sesiones</p>
              </div>
            </div>
          )}

          {/* Próxima Cita */}
          <div className="p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200 flex-1 min-w-[160px] max-w-[240px] flex items-center shadow-sm">
            <div className="p-1.5 bg-violet-100 rounded-lg mr-2 text-violet-600 shrink-0">
              <Calendar size={16} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Próxima Cita</h4>
              {(() => {
                const proxima = citas?.find(c => c.estado === 'programada');
                if (!proxima) return <p className="text-slate-600 font-semibold text-xs truncate">Sin citas</p>;
                const raw = proxima.fecha_hora || proxima.fechaHora;
                const dateObj = raw ? new Date(raw) : null;
                const fechaStr = dateObj && !isNaN(dateObj.getTime())
                  ? dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Pendiente';
                return <p className="text-violet-700 font-bold text-xs truncate capitalize" title={fechaStr}>{fechaStr}</p>;
              })()}
            </div>
          </div>
          
          {/* Ingreso */}
          <div className="p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200 flex-1 min-w-[160px] max-w-[240px] flex items-center shadow-sm">
            <div className="p-1.5 bg-emerald-100 rounded-lg mr-2 text-emerald-600 shrink-0">
              <FileText size={16} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Ingreso</h4>
              <p className="text-emerald-700 font-bold text-xs truncate">
                {paciente.fecha_ingreso ? new Date(paciente.fecha_ingreso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sistema de Pestañas */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden">
        <div className="border-b border-slate-100 flex overflow-x-auto px-2 pt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 md:px-3 lg:px-5 py-3.5 text-sm font-bold transition-all duration-300 border-b-2 cursor-pointer rounded-t-xl mx-0.5 md:mx-1 whitespace-nowrap shrink-0 ${
                activeTab === tab.id 
                  ? 'border-violet-600 text-violet-700 bg-violet-50/50 shadow-[inset_0_-2px_10px_rgba(139,92,246,0.05)]' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
              }`}
            >
              <span className={`mr-2 transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido de las Pestañas */}
        <div className="p-6 min-h-[300px]">
          
          {/* Pestaña: Resumen */}
          {activeTab === 'resumen' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              


              {/* --- Inicio Historial integrado en Resumen --- */}
              <div className="mt-4">

              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Notas Clínicas y Evolución</h3>
                  <p className="text-sm text-slate-500">Historial médico del paciente.</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsNotaModalOpen(true)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-sm rounded-xl text-sm font-bold transition-all cursor-pointer"
                  >
                    + Nota Manual
                  </button>
                  <button 
                    onClick={() => setIsNotaIAModalOpen(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-600/20 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center"
                  >
                    <Sparkles size={16} className="mr-2" />
                    Redactar con IA
                  </button>
                </div>
              </div>
              
              {notas && notas.length > 0 ? (
                <div className="relative pl-8 border-l-2 border-violet-200/50 space-y-8 py-2">
                  {notas.map((nota) => (
                    <div key={nota.id} className="relative group">
                      <div className="absolute -left-[41px] bg-white w-5 h-5 rounded-full border-4 border-violet-500 shadow-sm group-hover:scale-125 transition-transform duration-300"></div>
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 group-hover:border-violet-200 group-hover:shadow-md transition-all duration-300">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-bold text-violet-700 bg-violet-100 px-3 py-1 rounded-full flex items-center">
                            {nota.titulo.toLowerCase().includes('ia') || nota.titulo.toLowerCase().includes('soap') ? <BrainCircuit size={14} className="mr-1.5" /> : <FileText size={14} className="mr-1.5" />}
                            {nota.titulo}
                          </span>
                          <span className="text-sm font-medium text-slate-400">
                            {new Date(nota.fecha).toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{nota.contenido}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-semibold text-slate-500">Aún no hay notas clínicas</p>
                  <p className="text-sm text-slate-400 mt-2">Usa "+ Nota Manual" o "Redactar con IA" para registrar la primera evolución del paciente.</p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Pestaña: Archivos */}
          {activeTab === 'archivos' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <ArchivosTab pacienteId={id!} />
            </div>
          )}


          {/* Pestaña: Exámenes */}
          {activeTab === 'examenes' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Exámenes Solicitados</h3>
                <button 
                  onClick={() => setIsExamenModalOpen(true)}
                  className="px-5 py-2.5 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:shadow-sm rounded-full text-sm font-bold transition-all cursor-pointer"
                >
                  + Nueva Orden
                </button>
              </div>
              
              {examenes && examenes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {examenes.map((examen) => (
                    <div key={examen.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center">
                          <ClipboardList size={20} className="text-blue-500 mr-2" />
                          <h4 className="font-bold text-slate-800">{examen.tipo_examen}</h4>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md ${
                          examen.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {examen.estado}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-4">Solicitado: {new Date(examen.fecha_solicitud).toLocaleDateString()}</p>
                      
                      <div className="flex flex-col space-y-2 mt-auto">
                        <button 
                          onClick={() => {
                            setExamenParaImprimir(examen);
                            setTimeout(() => handlePrint(), 50); // Pequeño delay para asegurar que el estado se actualizó
                          }}
                          className="w-full py-2 bg-violet-50 hover:bg-violet-100 text-violet-600 border border-violet-200 hover:border-violet-300 rounded-xl text-sm font-bold transition-colors cursor-pointer flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                          Imprimir Orden
                        </button>
                        
                        {examen.estado === 'pendiente' && (
                          <button 
                            onClick={() => examen.id && cambiarEstadoExamen(examen.id, 'completado')}
                            className="w-full py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                          >
                            Marcar como Recibido/Completado
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 text-center text-slate-500">
                  <ClipboardList size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-semibold">No hay exámenes solicitados</p>
                  <p className="text-sm mt-1">Prescribe un nuevo examen médico para este paciente.</p>
                </div>
              )}
            </div>
          )}


          {/* Pestaña: Diagnósticos */}
          {activeTab === 'diagnosticos' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Plan de Tratamiento</h3>
                <button 
                  onClick={() => setIsDiagnosticoModalOpen(true)}
                  className="px-5 py-2.5 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:shadow-sm rounded-full text-sm font-bold transition-all cursor-pointer"
                >
                  + Agregar Diagnóstico
                </button>
              </div>
              
              {diagnosticos && diagnosticos.length > 0 ? (
                <div className="space-y-4">
                  {diagnosticos.map(diag => (
                    <div key={diag.id} className={`p-6 border rounded-2xl transition-all duration-300 ${diag.estado === 'activo' ? 'border-blue-100 bg-blue-50/50 hover:shadow-md' : 'border-slate-200 bg-slate-50 opacity-75'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center">
                          <Activity size={24} className={`${diag.estado === 'activo' ? 'text-blue-600' : 'text-slate-500'} mr-3`} />
                          <div>
                            <h4 className={`font-bold text-lg ${diag.estado === 'activo' ? 'text-blue-900' : 'text-slate-600'}`}>{diag.enfermedad}</h4>
                            <p className="text-sm text-slate-500">
                              Diagnosticado el {new Date(diag.fecha).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md mb-2 ${
                            diag.estado === 'activo' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {diag.estado}
                          </span>
                          {diag.estado === 'activo' && diag.id && (
                            <button 
                              onClick={() => cambiarEstadoDiagnostico(diag.id!, 'resuelto')}
                              className="text-xs text-slate-400 hover:text-blue-600 underline font-semibold transition-colors cursor-pointer"
                            >
                              Marcar como Resuelto
                            </button>
                          )}
                        </div>
                      </div>
                      <p className={`leading-relaxed whitespace-pre-wrap ${diag.estado === 'activo' ? 'text-blue-800' : 'text-slate-500'}`}>
                        {diag.plan_tratamiento || diag.planTratamiento}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 text-center text-slate-500">
                  <Activity size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-semibold">No hay diagnósticos</p>
                  <p className="text-sm mt-1">Registra el primer diagnóstico clínico para este paciente.</p>
                </div>
              )}
            </div>
          )}

          {/* Pestaña: Tareas */}
          {activeTab === 'tareas' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Tareas Entre-Sesiones</h3>
                <button 
                  onClick={() => setIsTareaModalOpen(true)}
                  className="px-5 py-2.5 bg-violet-100 text-violet-700 hover:bg-violet-200 hover:shadow-sm rounded-full text-sm font-bold transition-all cursor-pointer flex items-center"
                >
                  <ClipboardList size={16} className="mr-2" />
                  Asignar Tarea
                </button>
              </div>
              
              {tareas && tareas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tareas.map(tarea => (
                    <div key={tarea.id} className={`p-5 border rounded-2xl transition-all duration-300 ${tarea.estado === 'pendiente' ? 'border-amber-100 bg-amber-50/30 hover:shadow-md hover:border-amber-200' : 'border-emerald-100 bg-emerald-50/50 opacity-90'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center">
                          <ClipboardList size={20} className={`${tarea.estado === 'pendiente' ? 'text-amber-500' : 'text-emerald-500'} mr-2`} />
                          <h4 className={`font-bold ${tarea.estado === 'pendiente' ? 'text-slate-800' : 'text-emerald-900'}`}>{tarea.titulo}</h4>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md ${
                          tarea.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {tarea.estado}
                        </span>
                      </div>
                      
                      {tarea.descripcion && (
                        <p className={`text-sm mb-4 leading-relaxed whitespace-pre-wrap ${tarea.estado === 'pendiente' ? 'text-slate-600' : 'text-emerald-700/80'}`}>
                          {tarea.descripcion}
                        </p>
                      )}
                      
                      <div className="text-xs font-medium text-slate-400 mb-4">
                        Asignada: {new Date(tarea.fecha_asignacion).toLocaleDateString()}
                        {tarea.fecha_completada && ` • Completada: ${new Date(tarea.fecha_completada).toLocaleDateString()}`}
                      </div>
                      
                      {tarea.estado === 'pendiente' && (
                        <div className="mt-auto pt-2 border-t border-amber-100">
                          <button 
                            onClick={() => cambiarEstadoTarea(tarea.id, 'completada')}
                            className="w-full py-2 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-100 hover:border-emerald-200 rounded-xl text-sm font-bold transition-colors cursor-pointer flex items-center justify-center"
                          >
                            <CheckCircle2 size={16} className="mr-2" />
                            Marcar como Completada
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 text-center text-slate-500">
                  <ClipboardList size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-semibold">No hay tareas asignadas</p>
                  <p className="text-sm mt-1">Asigna lecturas, diarios o ejercicios para que el paciente los complete en casa.</p>
                </div>
              )}
            </div>
          )}


          {/* Pestaña: Signos Vitales */}
          {activeTab === 'signos' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Triage Clínico</h3>
                  {ultimoSigno ? (
                    <p className="text-sm text-slate-500">Última toma: {new Date(ultimoSigno.fecha).toLocaleString()}</p>
                  ) : (
                    <p className="text-sm text-slate-500">Aún no hay registros de signos vitales.</p>
                  )}
                </div>
                <button 
                  onClick={() => setIsSignoModalOpen(true)}
                  className="px-5 py-2.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:shadow-sm rounded-full text-sm font-bold transition-all cursor-pointer"
                >
                  + Nueva Toma
                </button>
              </div>

              {/* Dashboard de Signos Vitales */}
              {ultimoSigno ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  
                  {/* Presión Arterial */}
                  <div className={`p-6 rounded-2xl border shadow-sm relative overflow-hidden group ${
                    ultimoSigno.presion_arterial.includes('150') || ultimoSigno.presion_arterial.includes('160') ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform"><Activity size={100} /></div>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-bold uppercase tracking-wider flex items-center ${
                        ultimoSigno.presion_arterial.includes('150') || ultimoSigno.presion_arterial.includes('160') ? 'text-red-700' : 'text-slate-600'
                      }`}>
                        Presión Arterial
                      </span>
                    </div>
                    <p className={`text-3xl font-extrabold tracking-tight ${
                      ultimoSigno.presion_arterial.includes('150') || ultimoSigno.presion_arterial.includes('160') ? 'text-red-600' : 'text-slate-800'
                    }`}>{ultimoSigno.presion_arterial}</p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">mmHg</p>
                  </div>

                  {/* Frecuencia Cardíaca */}
                  <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform"><Heart size={100} /></div>
                    <span className="text-sm font-bold text-emerald-700 uppercase tracking-wider block mb-2">Ritmo Cardíaco</span>
                    <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{ultimoSigno.frecuencia_cardiaca}</p>
                    <p className="text-xs font-medium text-emerald-600 mt-1">LPM</p>
                  </div>

                  {/* Saturación Oxígeno */}
                  <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform"><Wind size={100} /></div>
                    <span className="text-sm font-bold text-blue-700 uppercase tracking-wider block mb-2">Oxígeno (SpO2)</span>
                    <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{ultimoSigno.saturacion_oxigeno}<span className="text-xl text-blue-400">%</span></p>
                  </div>

                  {/* Temperatura */}
                  <div className={`p-6 rounded-2xl border shadow-sm relative overflow-hidden group ${
                    (ultimoSigno.temperatura || 0) > 37.5 ? 'bg-orange-50/50 border-orange-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform"><Thermometer size={100} /></div>
                    <span className={`text-sm font-bold uppercase tracking-wider block mb-2 ${
                      (ultimoSigno.temperatura || 0) > 37.5 ? 'text-orange-700' : 'text-slate-600'
                    }`}>Temperatura</span>
                    <p className={`text-3xl font-extrabold tracking-tight ${
                      (ultimoSigno.temperatura || 0) > 37.5 ? 'text-orange-600' : 'text-slate-800'
                    }`}>{(ultimoSigno.temperatura || 0)}<span className={`text-xl ${(ultimoSigno.temperatura || 0) > 37.5 ? 'text-orange-400' : 'text-slate-400'}`}>°C</span></p>
                    {(ultimoSigno.temperatura || 0) > 37.5 && <p className="text-xs font-semibold text-orange-600 mt-1">Febrícula / Fiebre</p>}
                  </div>

                  {/* IMC y Peso */}
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 flex items-center relative overflow-hidden">
                    <div className="p-4 bg-white rounded-xl shadow-sm text-slate-500 mr-6 z-10">
                      <Scale size={32} />
                    </div>
                    <div className="flex-1 flex justify-between items-center z-10">
                      <div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider block">Peso</span>
                        <p className="text-xl font-bold text-slate-800">{ultimoSigno.peso} kg</p>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider block">Talla</span>
                        <p className="text-xl font-bold text-slate-800">{ultimoSigno.talla} m</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider block">IMC</span>
                        <p className={`text-2xl font-extrabold ${
                          (ultimoSigno.imc || 0) > 25 ? 'text-amber-600' : (ultimoSigno.imc || 0) < 18.5 ? 'text-blue-600' : 'text-emerald-600'
                        }`}>{(ultimoSigno.imc || 0)}</p>
                        <p className={`text-xs font-bold ${
                          (ultimoSigno.imc || 0) > 25 ? 'text-amber-500' : (ultimoSigno.imc || 0) < 18.5 ? 'text-blue-500' : 'text-emerald-500'
                        }`}>
                          {(ultimoSigno.imc || 0) > 25 ? 'Sobrepeso' : (ultimoSigno.imc || 0) < 18.5 ? 'Bajo Peso' : 'Normal'}
                        </p>
                      </div>
                    </div>
                    <div className={`absolute right-0 top-0 w-32 h-full bg-gradient-to-l to-transparent ${
                      (ultimoSigno.imc || 0) > 25 ? 'from-amber-100/50' : (ultimoSigno.imc || 0) < 18.5 ? 'from-blue-100/50' : 'from-emerald-100/50'
                    }`}></div>
                  </div>

                </div>
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <Activity size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-semibold text-slate-500">Sin registros de signos vitales</p>
                  <p className="text-sm text-slate-400 mt-2">Haz clic en "+ Nueva Toma" para registrar el triage.</p>
                </div>
              )}
            </div>
          )}

          {/* Pestaña: Medicamentos */}
          {activeTab === 'medicamentos' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Receta Médica</h3>
                  {medicamentos && medicamentos.filter(m => m.estado === 'activo').length > 0 && (
                    <p className="text-sm text-slate-500">{medicamentos.filter(m => m.estado === 'activo').length} tratamientos activos</p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={handleEnviarRecetaEmail}
                    disabled={!medicamentos || medicamentos.filter(m => m.estado === 'activo').length === 0}
                    className="flex items-center px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-900 border border-rose-200 rounded-xl text-sm font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Mail size={16} className="mr-2" />
                    Enviar por Correo
                  </button>
                  <button 
                    onClick={handlePrintReceta}
                    disabled={!medicamentos || medicamentos.filter(m => m.estado === 'activo').length === 0}
                    className="flex items-center px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-xl text-sm font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Printer size={16} className="mr-2" />
                    Imprimir Receta
                  </button>
                  <button 
                    onClick={() => setIsMedicamentoModalOpen(true)}
                    className="flex items-center px-5 py-2.5 bg-rose-100 text-rose-700 hover:bg-rose-200 hover:shadow-sm rounded-full text-sm font-bold transition-all cursor-pointer"
                  >
                    + Prescribir Fármaco
                  </button>
                </div>
              </div>
              
              {medicamentos && medicamentos.length > 0 ? (
                <div className="space-y-4">
                  {medicamentos.map(med => (
                    <div key={med.id} className={`p-6 border rounded-2xl transition-all duration-300 flex justify-between items-start ${
                      med.estado === 'activo' ? 'border-rose-100 bg-rose-50/50 hover:shadow-md' : 'border-slate-200 bg-slate-50 opacity-60'
                    }`}>
                      <div className="flex items-start max-w-2xl">
                        <div className={`p-3 rounded-xl mr-4 mt-1 ${med.estado === 'activo' ? 'bg-white text-rose-500 shadow-sm' : 'bg-slate-200 text-slate-400'}`}>
                          <Pill size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className={`font-bold text-xl ${med.estado === 'activo' ? 'text-rose-900' : 'text-slate-600'}`}>{med.nombre}</h4>
                            <span className="text-lg font-medium text-slate-600 bg-white/50 px-2 rounded-md">{med.dosis}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4">
                            <div>
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Frecuencia</span>
                              <p className="text-sm font-semibold text-slate-700 flex items-center"><Clock size={14} className="mr-1.5 text-slate-400" />{med.frecuencia}</p>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Duración</span>
                              <p className="text-sm font-semibold text-slate-700 flex items-center"><Calendar size={14} className="mr-1.5 text-slate-400" />{med.duracion}</p>
                            </div>
                            {med.indicaciones && (
                              <div className="col-span-2 mt-2 bg-white/60 p-3 rounded-lg border border-slate-100/50">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Indicaciones</span>
                                <p className="text-sm text-slate-600 italic">"{med.indicaciones}"</p>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-xs text-slate-400 mt-4 font-medium">Prescrito el: {new Date(med.fechaPrescripcion).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg mb-3 ${
                          med.estado === 'activo' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {med.estado}
                        </span>
                        {med.estado === 'activo' && med.id && (
                          <button 
                            onClick={() => suspenderMedicamento(med.id!)}
                            className="text-xs text-slate-400 hover:text-rose-600 underline font-semibold transition-colors flex items-center cursor-pointer"
                          >
                            <AlertCircle size={12} className="mr-1" />
                            Suspender
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <Pill size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-semibold text-slate-500">Sin prescripciones</p>
                  <p className="text-sm text-slate-400 mt-2">Haz clic en "+ Prescribir Fármaco" para añadir medicamentos a la receta.</p>
                </div>
              )}
            </div>
          )}

          {/* Pestaña: Evaluaciones Psicométricas */}
          {activeTab === 'evaluaciones' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Evaluaciones Psicométricas</h3>
                  <p className="text-sm text-slate-500">Cuestionarios y tests aplicados al paciente.</p>
                </div>
                <button 
                  onClick={() => setIsAsignarEvaluacionModalOpen(true)}
                  className="px-5 py-2.5 bg-violet-100 text-violet-700 hover:bg-violet-200 hover:shadow-sm rounded-full text-sm font-bold transition-all cursor-pointer"
                >
                  + Aplicar Test
                </button>
              </div>
              
              {evaluaciones && evaluaciones.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {evaluaciones.map(ev => (
                    <div key={ev.id} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                          <BrainCircuit size={24} className="text-violet-600 mr-3" />
                          <div>
                            <h4 className="font-bold text-lg text-slate-800 leading-tight">
                              {ev.plantilla?.titulo || 'Evaluación'}
                            </h4>
                            <p className="text-sm text-slate-500 mt-1">
                              {new Date(ev.fecha).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {ev.estado === 'completado' && (
                          <div className="flex gap-1">
                            <button 
                              onClick={() => {
                                setEvaluacionParaAnalisis(ev);
                                setIsAnalisisIAModalOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors cursor-pointer"
                              title="Analizar con IA (Gemini)"
                            >
                              <Sparkles size={18} />
                            </button>
                            <button 
                              onClick={() => {
                                setEvaluacionParaImprimir(ev);
                                setTimeout(() => handlePrintEvaluacion(), 400);
                              }}
                              className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                              title="Imprimir PDF"
                            >
                              <Printer size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-slate-50 rounded-xl p-4 mt-4 border border-slate-100 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Puntaje Total</p>
                          <p className="text-2xl font-black text-slate-800">{ev.puntaje_total}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Interpretación</p>
                          <span className="px-3 py-1 text-sm font-bold bg-violet-100 text-violet-700 rounded-full inline-block">
                            {ev.interpretacion}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <BrainCircuit size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-semibold text-slate-500">Sin evaluaciones registradas</p>
                  <p className="text-sm text-slate-400 mt-2">Haz clic en "+ Aplicar Test" para realizar la primera evaluación psicométrica.</p>
                </div>
              )}
              
              <GraficoEvaluaciones evaluaciones={evaluaciones || []} />
            </div>
          )}

          {/* Pestaña: Finanzas */}
          {activeTab === 'finanzas' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Estado de Cuenta</h3>
                  <p className="text-slate-500">Gestión de facturación y pagos del paciente</p>
                </div>
                <button 
                  onClick={() => setIsFacturaModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-600/20 flex items-center hover:scale-105"
                >
                  <Receipt size={18} className="mr-2" />
                  Emitir Factura
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100 flex items-center">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 mr-4">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-600/80 uppercase tracking-wider mb-1">Saldo Adeudado</p>
                    <h4 className="text-2xl font-black text-emerald-900">
                      Q. {facturas.reduce((acc, f) => acc + (f.saldo_pendiente || 0), 0).toFixed(2)}
                    </h4>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-600 mr-4">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Facturas Pendientes</p>
                    <h4 className="text-2xl font-black text-slate-700">
                      {facturas.filter(f => f.estado === 'pendiente' || f.estado === 'parcial').length}
                    </h4>
                  </div>
                </div>
              </div>

              {facturas && facturas.length > 0 ? (
                <div className="space-y-4">
                  {facturas.map(factura => (
                    <div key={factura.id} className="p-6 border border-slate-200 rounded-2xl bg-white hover:shadow-md transition-all duration-300 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`p-3 rounded-xl mr-5 ${
                          factura.estado === 'pagada' ? 'bg-emerald-50 text-emerald-600' :
                          factura.estado === 'parcial' ? 'bg-amber-50 text-amber-600' :
                          'bg-rose-50 text-rose-600'
                        }`}>
                          <Receipt size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-lg mb-1">{factura.concepto}</h4>
                          <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                            <span className="flex items-center"><Calendar size={14} className="mr-1.5" /> Emitida: {new Date(factura.fecha_emision).toLocaleDateString()}</span>
                            {factura.fecha_vencimiento && (
                              <span className="flex items-center text-rose-500"><AlertCircle size={14} className="mr-1.5" /> Vence: {new Date(factura.fecha_vencimiento).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-slate-500 font-medium">Monto Total</p>
                          <p className="font-bold text-slate-800">Q. {factura.monto_total.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500 font-medium">Saldo Pendiente</p>
                          <p className={`font-bold ${factura.saldo_pendiente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            Q. {factura.saldo_pendiente.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end min-w-[120px]">
                          <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg mb-2 ${
                            factura.estado === 'pagada' ? 'bg-emerald-100 text-emerald-700' :
                            factura.estado === 'parcial' ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {factura.estado}
                          </span>
                          {(factura.estado === 'pendiente' || factura.estado === 'parcial') && (
                            <button 
                              onClick={() => {
                                setFacturaSeleccionada(factura);
                                setIsPagoModalOpen(true);
                              }}
                              className="text-xs text-teal-600 hover:text-teal-700 font-bold underline transition-colors"
                            >
                              Registrar Pago
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <Wallet size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-semibold text-slate-500">Sin historial de facturación</p>
                  <p className="text-sm text-slate-400 mt-2">Haz clic en "Emitir Factura" para generar el primer cobro del paciente.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      
      <ModalNuevaCita 
        isOpen={isCitaModalOpen}
        onClose={() => setIsCitaModalOpen(false)}
        onSave={handleSaveCita}
        pacienteNombre={paciente.nombre}
      />

      <ModalNuevoExamen 
        isOpen={isExamenModalOpen}
        onClose={() => setIsExamenModalOpen(false)}
        onSave={handleSaveExamen}
        pacienteNombre={paciente.nombre}
      />

      <ModalNuevoSigno 
        isOpen={isSignoModalOpen}
        onClose={() => setIsSignoModalOpen(false)}
        onSave={handleSaveSignos}
      />

      <ModalNuevaNota 
        isOpen={isNotaModalOpen}
        onClose={() => setIsNotaModalOpen(false)}
        onSave={handleSaveNota}
      />

      <ModalNuevaNotaIA
        isOpen={isNotaIAModalOpen}
        onClose={() => setIsNotaIAModalOpen(false)}
        onSave={handleSaveNota}
      />

      <ModalNuevoDiagnostico 
        isOpen={isDiagnosticoModalOpen}
        onClose={() => setIsDiagnosticoModalOpen(false)}
        onSave={handleSaveDiagnostico}
      />

      <ModalNuevoMedicamento 
        isOpen={isMedicamentoModalOpen}
        onClose={() => setIsMedicamentoModalOpen(false)}
        onSave={handleSaveMedicamento}
      />



      {consentimientoActivo && (
        <ModalFirma
          isOpen={isFirmaModalOpen}
          onClose={() => {
            setIsFirmaModalOpen(false);
            setConsentimientoActivo(null);
          }}
          onSave={handleSaveFirma}
          documentoTitulo={consentimientoActivo.titulo}
          pacienteNombre={paciente.nombre}
        />
      )}

      {/* Contenedor Oculto para Impresión de Exámenes */}
      <div className="hidden">
        <OrdenExamenPrint 
          ref={printRef}
          pacienteNombre={paciente.nombre}
          pacienteEdad={calcularEdad(paciente.fecha_nacimiento) || 0}
          fecha={new Date().toISOString()}
          examen={examenParaImprimir || {
            pacienteId: 0, medicoId: 0, fecha_solicitud: '', estado: 'pendiente', tipo_examen: ''
          }}
          medicoNombre={usuarioActual?.nombre}
        />
      </div>

      {/* Contenedor Oculto para Impresión de Receta (Solo meds activos) */}
      <div className="hidden">
        <RecetaPrint 
          ref={recetaPrintRef}
          pacienteNombre={paciente.nombre}
          pacienteEdad={calcularEdad(paciente.fecha_nacimiento) || 0}
          fecha={new Date().toISOString()}
          medicamentos={medicamentos?.filter(m => m.estado === 'activo') || []}
          medicoNombre={usuarioActual?.nombre}
          medicoProfesion={usuarioActual?.profesion || usuarioActual?.especialidad}
          medicoColegiado={usuarioActual?.no_colegiado}
          clinicaNombre={clinicaData?.nombre_comercial || clinicaData?.nombre}
          clinicaDireccion={clinicaData?.direccion_fiscal || clinicaData?.direccion}
          clinicaTelefono={clinicaData?.telefono_contacto}
          clinicaNit={clinicaData?.nit}
        />
      </div>

      {/* Contenedor Oculto para Impresión de Evaluaciones Psicométricas */}
      <div className="hidden">
        {evaluacionParaImprimir && (
          <EvaluacionPrint 
            ref={evaluacionPrintRef}
            evaluacion={evaluacionParaImprimir}
            pacienteNombre={paciente.nombre}
            pacienteEdad={calcularEdad(paciente.fecha_nacimiento) || 0}
            medicoNombre={usuarioActual?.nombre}
            clinicaNombre="Clínica Psicológica"
          />
        )}
      </div>
    
      {/* Modal Historial de Citas */}
      {isHistorialCitasOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                <Calendar size={24} className="mr-3 text-violet-600" />
                Citas Programadas
              </h2>
              <button 
                onClick={() => setIsHistorialCitasOpen(false)}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 hover:text-rose-500 transition-colors shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
               <div className="flex justify-between items-center mb-6">
                 <p className="text-slate-500 font-medium text-sm">Historial de citas de {paciente.nombre}</p>
                 <button 
                   onClick={() => { setIsHistorialCitasOpen(false); setIsCitaModalOpen(true); }}
                   className="px-5 py-2.5 bg-violet-600 text-white hover:bg-violet-700 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center"
                 >
                   <CalendarPlus size={16} className="mr-2" />
                   Programar Nueva Cita
                 </button>
               </div>
               
               {citas && citas.length > 0 ? (
                <div className="space-y-4">
                  {citas.map((cita) => {
                    const rawFecha = cita.fecha_hora || cita.fechaHora;
                    const dateObj = rawFecha ? new Date(rawFecha) : null;
                    const fechaValida = dateObj && !isNaN(dateObj.getTime());
                    const fechaTexto = fechaValida
                      ? dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                      : 'Fecha no válida';
                    const horaTexto = fechaValida
                      ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';

                    return (
                      <div key={cita.id} className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`p-3 rounded-xl mr-4 ${cita.estado === 'programada' ? 'bg-violet-100 text-violet-600' : cita.estado === 'completada' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                              <Calendar size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-800 text-lg capitalize">
                                  {fechaTexto}
                                </p>
                                {cita.modalidad === 'virtual' && (
                                  <span className="bg-violet-100 text-violet-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center">
                                    <Video size={10} className="mr-1" /> Virtual
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center text-sm font-medium mt-1">
                                {horaTexto && <span className="text-violet-600 mr-3">{horaTexto} hrs</span>}
                                <span className="text-slate-500">{cita.motivo}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                             <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${cita.estado === 'programada' ? 'bg-violet-100 text-violet-700' : cita.estado === 'completada' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                               {cita.estado}
                             </span>
                          </div>
                        </div>

                        {cita.modalidad === 'virtual' && cita.estado === 'programada' && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <button 
                              onClick={() => window.open(`/videoconsulta/${cita.id}`, '_blank')}
                              className="w-full flex justify-center items-center py-2 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold rounded-xl hover:shadow-md transition-all duration-300"
                            >
                              <Video size={16} className="mr-2" />
                              Unirse a la Videoconsulta
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-50 p-12 rounded-2xl border border-slate-100 text-center">
                  <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-medium">No hay citas programadas para este paciente.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Lateral de Gestor de Documentos */}
      {isGestorDocumentosOpen && (
        <div className="fixed inset-0 z-50 flex justify-end p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl h-full rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-right-8 duration-300 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-xl font-bold text-slate-800 flex items-center">
                <FileSignature className="mr-2 text-indigo-600" size={24} />
                Gestor de Documentos Legales
              </h3>
              <button 
                onClick={() => setIsGestorDocumentosOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
               <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Consentimientos Informados</h3>
                  <p className="text-sm text-slate-500">Documentos legales y autorizaciones firmadas por el paciente.</p>
                </div>
                
                {plantillas.length > 0 ? (
                  <div className="flex flex-col items-end relative group">
                    <button 
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center peer"
                      onClick={(e) => {
                        // Si solo hay una plantilla, la usamos directo
                        if (plantillas.length === 1) {
                          const p = plantillas[0];
                          const nuevoConsentimiento: ConsentimientoFirmado = {
                            id: 'temp-' + Date.now(),
                            clinica_id: usuarioActual!.clinica_id,
                            paciente_id: id!,
                            plantilla_id: p.id,
                            titulo: p.titulo,
                            contenido_firmado: p.contenido.replace(/{{PACIENTE_NOMBRE}}/g, paciente?.nombre || ''),
                            firma_data_url: '',
                            fecha_firma: new Date().toISOString(),
                            estado: 'pendiente'
                          };
                          setConsentimientoActivo(nuevoConsentimiento);
                          setIsFirmaModalOpen(true);
                        } else {
                          // Toggle dropdown visibility via focus/blur hack or standard React state
                          const nextElement = e.currentTarget.nextElementSibling;
                          if (nextElement) {
                            nextElement.classList.toggle('hidden');
                          }
                        }
                      }}
                    >
                      <FileSignature size={16} className="mr-2" />
                      Generar Documento
                    </button>
                    {/* Dropdown de plantillas */}
                    <div className="absolute top-full mt-2 right-0 w-72 bg-white border border-slate-100 shadow-xl rounded-2xl p-2.5 hidden group-hover:block peer-hover:block hover:block z-20">
                      <p className="text-xs font-bold text-slate-400 mb-2 px-2 uppercase tracking-wider">Seleccionar Plantilla</p>
                      {plantillas.map(p => (
                        <div key={p.id} className="p-2 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0">
                          <p className="text-sm font-bold text-slate-800 mb-1.5 px-1 truncate" title={p.titulo}>{p.titulo}</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => {
                                const nuevoConsentimiento: ConsentimientoFirmado = {
                                  id: 'temp-' + Date.now(),
                                  clinica_id: usuarioActual!.clinica_id,
                                  paciente_id: id!,
                                  plantilla_id: p.id,
                                  titulo: p.titulo,
                                  contenido_firmado: p.contenido.replace(/{{PACIENTE_NOMBRE}}/g, paciente?.nombre || ''),
                                  firma_data_url: '',
                                  fecha_firma: new Date().toISOString(),
                                  estado: 'pendiente'
                                };
                                setConsentimientoActivo(nuevoConsentimiento);
                                setIsFirmaModalOpen(true);
                              }}
                              className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center cursor-pointer"
                            >
                              <PenTool size={12} className="mr-1" />
                              Presencial
                            </button>
                            <button
                              onClick={() => handleCrearYEnviarDocumentoRemoto(p)}
                              className="px-2 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center cursor-pointer shadow-sm"
                            >
                              <Mail size={12} className="mr-1" />
                              Por Correo
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link to="/consentimientos" className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors">
                    Crear Plantillas Primero
                  </Link>
                )}
              </div>

              {consentimientos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {consentimientos.map((doc) => (
                    <div key={doc.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full relative overflow-hidden group">
                      <div className={`absolute top-0 right-0 w-16 h-16 flex items-start justify-end p-3 ${
                        doc.estado === 'firmado' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                      }`} style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}>
                        {doc.estado === 'firmado' ? <CheckCircle size={14} className="ml-4 -mt-1" /> : <Clock size={14} className="ml-4 -mt-1" />}
                      </div>

                      <div className="flex items-center mb-4 pr-8">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${
                          doc.estado === 'firmado' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          <FileSignature size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 line-clamp-1" title={doc.titulo}>{doc.titulo}</h4>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            doc.estado === 'firmado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {doc.estado === 'firmado' ? 'Firmado' : 'Pendiente de Firma'}
                          </span>
                        </div>
                      </div>

                      {doc.estado === 'firmado' && doc.firma_data_url && (
                        <div className="mt-4 pt-4 border-t border-slate-100 flex-1 flex flex-col justify-end">
                          <p className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">Firma Digital</p>
                          <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 h-24 flex items-center justify-center">
                            <img src={doc.firma_data_url} alt="Firma del paciente" className="max-h-full opacity-80" />
                          </div>
                          <p className="text-xs text-slate-400 mt-2 text-right">
                            Firmado el {new Date(doc.fecha_firma).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {doc.estado === 'pendiente' && (
                        <div className="mt-4 pt-4 border-t border-slate-100 flex-1 flex flex-col justify-end space-y-2">
                          <button 
                            onClick={() => {
                              setConsentimientoActivo(doc);
                              setIsFirmaModalOpen(true);
                            }}
                            className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold transition-colors flex items-center justify-center"
                          >
                            <PenTool size={16} className="mr-2" />
                            Firmar Ahora (Presencial)
                          </button>
                          
                          <button 
                            onClick={() => handleEnviarFirmaEmail(doc)}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center shadow-sm"
                          >
                            <Mail size={16} className="mr-2" />
                            Enviar Enlace por Correo
                          </button>

                          <button 
                            onClick={() => {
                              const url = `${window.location.origin}/firmar/${doc.id}`;
                              navigator.clipboard.writeText(url);
                              alert('¡Enlace de firma copiado al portapapeles! Puedes enviarlo por WhatsApp o Correo.');
                            }}
                            className="w-full py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-bold transition-colors flex items-center justify-center"
                          >
                            <LinkIcon size={16} className="mr-2" />
                            Copiar Enlace (Remoto)
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <FileSignature size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-semibold text-slate-600">No hay documentos legales</p>
                  <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">Genera un consentimiento informado para que el paciente lo firme y quede registro en su expediente.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Modals de Evaluaciones */}
      {usuarioActual?.clinica_id && (
        <ModalAsignarEvaluacion
          isOpen={isAsignarEvaluacionModalOpen}
          onClose={() => setIsAsignarEvaluacionModalOpen(false)}
          clinicaId={usuarioActual.clinica_id}
          onSelect={handleAsignarEvaluacion}
        />
      )}
      
      <ModalRealizarEvaluacion
        isOpen={isRealizarEvaluacionModalOpen}
        onClose={() => setIsRealizarEvaluacionModalOpen(false)}
        plantilla={plantillaSeleccionada}
        pacienteId={id!}
        onSuccess={(nuevaEvaluacion) => {
          setEvaluaciones(prev => [nuevaEvaluacion, ...prev]);
          setIsRealizarEvaluacionModalOpen(false);
          setToast({ isVisible: true, message: 'Evaluación completada exitosamente', type: 'success' });
        }}
      />

      <ModalAnalisisIA 
        isOpen={isAnalisisIAModalOpen}
        onClose={() => setIsAnalisisIAModalOpen(false)}
        evaluacion={evaluacionParaAnalisis}
        pacienteNombre={paciente?.nombre || ''}
        pacienteEdad={calcularEdad(paciente?.fecha_nacimiento) || 0}
      />

      {/* Modal de Envío de Correo Personalizado */}
      <ModalEnviarCorreo
        isOpen={modalCorreoState.isOpen}
        onClose={() => setModalCorreoState(prev => ({ ...prev, isOpen: false }))}
        titulo={modalCorreoState.titulo}
        subtitulo={modalCorreoState.subtitulo}
        emailDefault={modalCorreoState.emailDefault}
        onSend={modalCorreoState.onSend}
      />

      <ModalNuevaTarea
        isOpen={isTareaModalOpen}
        onClose={() => setIsTareaModalOpen(false)}
        onSave={handleSaveTarea}
      />

      {/* Toast Flotante Elegante */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
