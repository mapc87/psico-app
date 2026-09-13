import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { supabase } from '../services/supabase/client';
import { ArrowLeft, User, Activity, FileText, ClipboardList, Video } from 'lucide-react';
import type { Cita, Paciente } from '../types';

export default function SalaVirtual() {
  const { citaId } = useParams<{ citaId: string }>();
  const navigate = useNavigate();
  const [cita, setCita] = useState<Cita | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notas' | 'diagnosticos' | 'resumen'>('notas');
  const [notaTexto, setNotaTexto] = useState('');

  useEffect(() => {
    const loadCita = async () => {
      if (!citaId) return;
      try {
        const { data: citaData } = await supabase.from('citas').select('*').eq('id', citaId).single();
        if (citaData) {
          setCita(citaData);
          const { data: pacienteData } = await supabase.from('pacientes').select('*').eq('id', citaData.paciente_id).single();
          if (pacienteData) setPaciente(pacienteData);
        }
      } catch (error) {
        console.error('Error cargando cita:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCita();
  }, [citaId]);

  const handleGuardarNota = async () => {
    if (!notaTexto.trim() || !cita || !paciente) return;
    try {
      const nuevaNota = {
        clinica_id: cita.clinica_id,
        paciente_id: paciente.id,
        medico_id: cita.medico_id,
        fecha: new Date().toISOString(),
        titulo: `Nota de Videoconsulta`,
        contenido: notaTexto
      };
      await supabase.from('notas_clinicas').insert([nuevaNota]);
      setNotaTexto('');
      alert('Nota guardada exitosamente en el expediente.');
    } catch (error) {
      console.error('Error guardando nota:', error);
      alert('Error al guardar la nota');
    }
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white"><Activity className="animate-spin mr-2" /> Cargando sala...</div>;
  if (!cita) return <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">Cita no válida.</div>;

  const roomId = cita.enlace_video || cita.id;
  const roomName = `psicoapp-videoconsulta-${roomId}`;
  const pacienteUrl = `${window.location.origin}/sala-virtual/${roomId}`;

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col md:flex-row overflow-hidden">
      
      {/* Panel Izquierdo: Videollamada (60%) */}
      <div className="w-full md:w-3/5 lg:w-2/3 h-1/2 md:h-full bg-black flex flex-col">
        <div className="bg-slate-900 p-3 flex items-center justify-between border-b border-slate-800">
          <button 
            onClick={() => navigate(-1)}
            className="text-slate-300 hover:text-white flex items-center text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" /> Volver a Agenda
          </button>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center">
              <span className="text-slate-500 mr-2">Link Paciente:</span>
              <code className="text-violet-400 truncate max-w-[200px]">{pacienteUrl}</code>
              <button 
                onClick={() => navigator.clipboard.writeText(pacienteUrl)}
                className="ml-2 text-violet-400 hover:text-violet-300 font-bold"
              >
                Copiar
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full bg-slate-900 flex flex-col items-center justify-center p-8 text-center border-r border-slate-800">
          <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
            <Video className="text-blue-500" size={40} />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">Videoconsulta Lista</h2>
          
          <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
            Debido a las políticas recientes de seguridad de Jitsi (para evitar desconexiones a los 5 minutos), la videollamada debe abrirse en una ventana separada.
          </p>
          
          <button 
            onClick={() => window.open(`https://meet.jit.si/${roomName}`, 'JitsiVideo', 'width=1024,height=768')}
            className="flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5"
          >
            <Video className="mr-3" size={24} />
            Abrir Sala de Videollamada
          </button>
          
          <div className="mt-8 p-4 bg-slate-800/50 rounded-xl max-w-md border border-slate-700">
            <p className="text-sm text-slate-400 mb-2">
              <strong className="text-slate-300 block mb-1">💡 Tip para doctores:</strong>
              Puedes mantener esta ventana de PsicoApp abierta al lado o en otra pantalla para tomar las notas clínicas mientras hablas con el paciente.
            </p>
          </div>
        </div>
      </div>

      {/* Panel Derecho: Expediente (40%) */}
      <div className="w-full md:w-2/5 lg:w-1/3 h-1/2 md:h-full bg-white flex flex-col border-l border-slate-200">
        
        {/* Cabecera Paciente */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
              <User size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg leading-tight">{paciente?.nombre}</h2>
              <p className="text-sm text-slate-500">Consulta Virtual</p>
            </div>
          </div>
        </div>

        {/* Pestañas (Mini) */}
        <div className="flex border-b border-slate-200 bg-white px-2">
          <button 
            onClick={() => setActiveTab('notas')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 flex justify-center items-center ${activeTab === 'notas' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <FileText size={16} className="mr-2" /> Notas
          </button>
          <button 
            onClick={() => setActiveTab('resumen')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 flex justify-center items-center ${activeTab === 'resumen' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <ClipboardList size={16} className="mr-2" /> Resumen
          </button>
          <button 
            onClick={() => setActiveTab('diagnosticos')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 flex justify-center items-center ${activeTab === 'diagnosticos' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Activity size={16} className="mr-2" /> Diags
          </button>
        </div>

        {/* Contenido Pestañas */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {activeTab === 'notas' && (
            <div className="h-full flex flex-col">
              <label className="block text-sm font-bold text-slate-700 mb-2">Nota de Sesión Rápida (Se guardará en Expediente)</label>
              <textarea 
                className="flex-1 w-full p-4 bg-white border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-slate-700"
                placeholder="Ej. Paciente refiere sentirse más tranquilo. Se trabajó técnica de respiración..."
                value={notaTexto}
                onChange={(e) => setNotaTexto(e.target.value)}
              />
              <button 
                onClick={handleGuardarNota}
                disabled={!notaTexto.trim()}
                className="mt-3 w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition-colors"
              >
                Guardar Nota
              </button>
            </div>
          )}

          {activeTab === 'resumen' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Motivo de Cita Actual</h4>
                <p className="text-slate-700 text-sm">{cita.motivo}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Datos Paciente</h4>
                <p className="text-slate-700 text-sm font-medium mb-1">{paciente?.telefono || 'Sin teléfono'}</p>
                <p className="text-slate-700 text-sm">{paciente?.correo || 'Sin correo'}</p>
              </div>
            </div>
          )}

          {activeTab === 'diagnosticos' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center py-8">
               <p className="text-sm text-slate-500">Consulta el detalle completo en la pestaña del expediente principal para ver y editar diagnósticos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
