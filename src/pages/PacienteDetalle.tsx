import React, { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Activity, FileText, Pill, Heart, Thermometer, Wind, Scale, AlertTriangle, CalendarPlus, ClipboardList, Printer, Clock, Wallet, DollarSign, Receipt, AlertCircle, BrainCircuit, Sparkles, FileSignature, CheckCircle, Copy, Link as LinkIcon, PenTool, X } from 'lucide-react';
import { supabase } from '../services/supabase/client';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
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
import { useReactToPrint } from 'react-to-print';
import type { Examen, SignosVitales, ConsentimientoFirmado, PlantillaDocumento } from '../types';

export default function PacienteDetalle() {
  const { id } = useParams();
  const { usuarioActual } = useAuth();
  const [activeTab, setActiveTab] = useState('resumen');
  const [isCitaModalOpen, setIsCitaModalOpen] = useState(false);
  const [isExamenModalOpen, setIsExamenModalOpen] = useState(false);
  const [isSignoModalOpen, setIsSignoModalOpen] = useState(false);
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [isNotaIAModalOpen, setIsNotaIAModalOpen] = useState(false);
  const [isDiagnosticoModalOpen, setIsDiagnosticoModalOpen] = useState(false);
  const [isMedicamentoModalOpen, setIsMedicamentoModalOpen] = useState(false);
      const [examenParaImprimir, setExamenParaImprimir] = useState<Examen | null>(null);
    const printRef = useRef<HTMLDivElement>(null);
  const recetaPrintRef = useRef<HTMLDivElement>(null);

  const [paciente, setPaciente] = useState<any>(undefined);
  const [permisos, setPermisos] = useState<any>(null);
  const [citas, setCitas] = useState<any[]>([]);
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [signos, setSignos] = useState<SignosVitales[]>([]);
  const [notas, setNotas] = useState<any[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
    const [consentimientos, setConsentimientos] = useState<ConsentimientoFirmado[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaDocumento[]>([]);
  const [isFirmaModalOpen, setIsFirmaModalOpen] = useState(false);
  const [isGestorDocumentosOpen, setIsGestorDocumentosOpen] = useState(false);
  const [consentimientoActivo, setConsentimientoActivo] = useState<ConsentimientoFirmado | null>(null);

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

      
      const { data: consentimientosData } = await supabase.from('consentimientos_firmados').select('*').eq('paciente_id', pId).order('fecha_firma', { ascending: false });
      if (consentimientosData) setConsentimientos(consentimientosData);

      if (usuarioActual.clinica_id) {
        const { data: plData } = await supabase.from('plantillas_documentos').select('*').eq('clinica_id', usuarioActual.clinica_id);
        if (plData) setPlantillas(plData);
      }
    };
    
    fetchData();
  }, [id, usuarioActual?.clinica_id, usuarioActual?.rol_id]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Orden_Examen_${paciente?.nombre?.replace(/\s+/g, '_') || 'Paciente'}`,
  });

  const ultimoSigno = signos && signos.length > 0 ? signos[0] : null;

  const handleSaveCita = async (fecha_hora: string, motivo: string) => {
    if (!usuarioActual) return;
    const nuevaCita = {
      clinica_id: usuarioActual.clinica_id,
      paciente_id: id,
      medico_id: usuarioActual.id,
      fecha_hora,
      motivo,
      estado: 'programada'
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

  const calcularEdad = (fechaNacimiento?: string) => {
    if (!fechaNacimiento) return 0;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
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

    const allTabs = [
    { id: 'resumen', label: 'Resumen', icon: <User size={18} />, key: 'verResumen' },
    { id: 'citas', label: 'Citas', icon: <CalendarPlus size={18} />, key: 'verCitas' },
    { id: 'examenes', label: 'Exámenes', icon: <ClipboardList size={18} />, key: 'verExamenes' },
    { id: 'signos', label: 'Signos Vitales', icon: <Heart size={18} />, key: 'verSignos' },
    { id: 'historial', label: 'Historial', icon: <FileText size={18} />, key: 'verHistorial' },
    { id: 'diagnosticos', label: 'Diagnósticos', icon: <Activity size={18} />, key: 'verDiagnosticos' },
    { id: 'medicamentos', label: 'Medicamentos', icon: <Pill size={18} />, key: 'verMedicamentos' },
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
      <div className="flex justify-between items-center">
        <Link to="/pacientes" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-violet-600 transition-colors group">
          <ArrowLeft size={16} className="mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Volver a Pacientes
        </Link>
        <button 
          onClick={() => setIsGestorDocumentosOpen(true)}
          className="flex items-center px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-xl border border-slate-200 shadow-sm text-sm font-bold transition-all cursor-pointer"
        >
          <FileSignature size={16} className="mr-2" />
          Documentos Legales
        </button>
      </div>

      {/* Header del Expediente */}
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-200/40 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-fuchsia-50 rounded-2xl flex items-center justify-center text-violet-600 text-3xl font-extrabold mr-6 shadow-inner border border-violet-100/50 z-10">
          {paciente.nombre.charAt(0)}
        </div>
        <div className="z-10">
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{paciente.nombre}</h2>
          <p className="text-slate-500 flex items-center mt-2 font-medium">
            <span className="mr-6 flex items-center"><User size={16} className="mr-2 opacity-70"/> Edad: {calcularEdad(paciente.fechaNacimiento)} años</span>
            <span className="flex items-center">Teléfono: {paciente.telefono}</span>
          </p>
        </div>
      </div>

      {/* Sistema de Pestañas */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden">
        <div className="border-b border-slate-100 flex overflow-x-auto px-2 pt-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-4 text-sm font-bold transition-all duration-300 border-b-2 cursor-pointer rounded-t-xl mx-1 ${
                activeTab === tab.id 
                  ? 'border-violet-600 text-violet-700 bg-violet-50/50 shadow-[inset_0_-2px_10px_rgba(139,92,246,0.05)]' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
              }`}
            >
              <span className={`mr-2.5 transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido de las Pestañas */}
        <div className="p-6 min-h-[300px]">
          
          {/* Pestaña: Resumen */}
          {activeTab === 'resumen' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow duration-300">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Datos del Responsable</h4>
                  {paciente.nombreResponsable ? (
                    <div className="space-y-2">
                      <p className="text-slate-700"><strong>Nombre:</strong> {paciente.nombreResponsable} ({paciente.parentesco})</p>
                      <p className="text-slate-700"><strong>Teléfono:</strong> {paciente.telefonoResponsable}</p>
                      <p className="text-slate-700"><strong>Estado Civil:</strong> {paciente.estadoCivilPadres}</p>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No hay responsable registrado (Paciente adulto)</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <div className="p-6 bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-2xl border border-violet-100 flex items-start hover:shadow-md transition-shadow duration-300">
                    <div className="p-3 bg-white rounded-xl shadow-sm mr-4 text-violet-500">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-violet-400 uppercase tracking-wider mb-1">Próxima Cita</h4>
                      <p className="text-violet-900 font-semibold text-lg">Jueves, 24 Nov - 16:00 hrs</p>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-start hover:shadow-md transition-shadow duration-300">
                    <div className="p-3 bg-white rounded-xl shadow-sm mr-4 text-emerald-500">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-1">Ingreso al Consultorio</h4>
                      <p className="text-emerald-900 font-semibold text-lg">{paciente.fechaIngreso}</p>
                    </div>
                  </div>
                </div>
              </div>
            
              {/* --- Inicio Historial integrado en Resumen --- */}
              <div className="mt-12 border-t border-slate-100 pt-8">

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
</div>
          )}

          {/* Pestaña: Citas */}
          {activeTab === 'citas' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Citas Programadas</h3>
                <button 
                  onClick={() => setIsCitaModalOpen(true)}
                  className="px-5 py-2.5 bg-violet-100 text-violet-700 hover:bg-violet-200 hover:shadow-sm rounded-full text-sm font-bold transition-all cursor-pointer"
                >
                  + Programar Cita
                </button>
              </div>
              
              {citas && citas.length > 0 ? (
                <div className="space-y-4">
                  {citas.map((cita) => (
                    <div key={cita.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:shadow-sm transition-all duration-300">
                      <div className="flex items-center">
                        <div className={`p-3 rounded-xl mr-4 ${cita.estado === 'programada' ? 'bg-violet-100 text-violet-600' : cita.estado === 'completada' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-lg">
                            {new Date(cita.fechaHora).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                          <div className="flex items-center text-sm font-medium mt-1">
                            <span className="text-violet-600 mr-3">{new Date(cita.fechaHora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 text-center text-slate-500">
                  <CalendarPlus size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-semibold">No hay citas programadas</p>
                  <p className="text-sm mt-1">Haz clic en "Programar Cita" para agendar una.</p>
                </div>
              )}
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
                        {diag.planTratamiento}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <Activity size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-semibold text-slate-500">Sin diagnósticos activos</p>
                  <p className="text-sm text-slate-400 mt-2">Agregue una patología y su plan de tratamiento correspondiente.</p>
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
          pacienteEdad={calcularEdad(paciente.fechaNacimiento)}
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
          pacienteEdad={calcularEdad(paciente.fechaNacimiento)}
          fecha={new Date().toISOString()}
          medicamentos={medicamentos?.filter(m => m.estado === 'activo') || []}
          medicoNombre={usuarioActual?.nombre}
        />
      </div>
    
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
                    <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-slate-100 shadow-xl rounded-xl p-2 hidden group-hover:block peer-hover:block hover:block z-20">
                      <p className="text-xs font-bold text-slate-400 mb-2 px-2 uppercase tracking-wider">Seleccionar Plantilla</p>
                      {plantillas.map(p => (
                        <button
                          key={p.id}
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
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors font-medium truncate"
                        >
                          {p.titulo}
                        </button>
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
    </div>
  );
}
