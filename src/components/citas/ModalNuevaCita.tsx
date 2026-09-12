import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, FileText, Save, Mail, ChevronDown } from 'lucide-react';
import { emailService } from '../../services/email/emailService';

interface ModalNuevaCitaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fechaHora: string, motivo: string, pacienteId?: string, modalidad?: 'presencial' | 'virtual', enlaceVideo?: string) => Promise<void>;
  pacienteNombre?: string;
  pacienteEmail?: string;
  pacientes?: {id: string, nombre: string, email?: string}[];
}

export default function ModalNuevaCita({ isOpen, onClose, onSave, pacienteNombre, pacienteEmail, pacientes }: ModalNuevaCitaProps) {
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');
  const [pacienteIdSeleccionado, setPacienteIdSeleccionado] = useState('');
  const [enviarCorreo, setEnviarCorreo] = useState(true);
  const [correoPaciente, setCorreoPaciente] = useState(pacienteEmail || '');
  const [modalidad, setModalidad] = useState<'presencial' | 'virtual'>('presencial');
  const [isSaving, setIsSaving] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  
  // Calcular la fecha de hoy correctamente basada en la zona horaria local
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const todayStr = today.toISOString().slice(0, 10);

  // Generar opciones de hora en intervalos de 30 minutos (De 06:00 a 21:30)
  const timeOptions = Array.from({ length: 16 * 2 }).map((_, i) => {
    const h = (Math.floor(i / 2) + 6).toString().padStart(2, '0');
    const m = i % 2 === 0 ? '00' : '30';
    return `${h}:${m}`;
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha || !hora || !motivo) return;
    if (!pacienteNombre && !pacienteIdSeleccionado) {
      alert('Por favor selecciona un paciente.');
      return;
    }
    
    setIsSaving(true);
    try {
      const fechaHora = new Date(`${fecha}T${hora}`).toISOString();
      const enlaceVideo = modalidad === 'virtual' ? `sala-${crypto.randomUUID()}` : undefined;
      await onSave(fechaHora, motivo, pacienteIdSeleccionado || undefined, modalidad, enlaceVideo);

      if (enviarCorreo && correoPaciente) {
        const fullEnlaceVideo = modalidad === 'virtual' && enlaceVideo ? `${window.location.origin}/sala-virtual/${enlaceVideo}` : undefined;
        
        await emailService.enviarConfirmacionCita(correoPaciente, {
          pacienteNombre: pacienteNombre || 'Estimado Paciente',
          fechaStr: new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          horaStr: hora,
          motivo,
          modalidad,
          enlaceVideo: fullEnlaceVideo
        });
      }

      onClose();
      setFecha('');
      setHora('');
      setMotivo('');
      setPacienteIdSeleccionado('');
      setModalidad('presencial');
    } catch (error) {
      console.error('Error saving cita:', error);
      alert('Ocurrió un error al guardar la cita.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-800">Programar Cita</h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {pacienteNombre ? (
            <p className="text-sm text-slate-500 mb-6">
              Agendando cita para: <strong className="text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">{pacienteNombre}</strong>
            </p>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-600 mb-2">Seleccionar Paciente</label>
              <select
                required
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 text-slate-700"
                value={pacienteIdSeleccionado}
                onChange={(e) => setPacienteIdSeleccionado(e.target.value)}
              >
                <option value="">Seleccione un paciente...</option>
                {pacientes?.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Fecha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CalendarIcon size={18} className="text-slate-400" />
                </div>
                <input 
                  type="date" 
                  required
                  min={todayStr}
                  className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 text-slate-700"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Hora</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Clock size={18} className="text-slate-400" />
                </div>
                <div 
                  className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer flex items-center justify-between transition-all duration-300 hover:border-violet-300"
                  onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                >
                  <span className={hora ? "text-slate-700 font-medium" : "text-slate-400"}>
                    {hora || "Seleccione hora"}
                  </span>
                </div>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${showTimeDropdown ? 'rotate-180' : ''}`} />
                </div>

                {showTimeDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowTimeDropdown(false)}
                    />
                    <div className="absolute z-50 mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-xl p-3 max-h-60 overflow-y-auto grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-2">
                      {timeOptions.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setHora(t);
                            setShowTimeDropdown(false);
                          }}
                          className={`py-2 px-1 text-sm font-medium rounded-lg transition-colors ${hora === t ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-violet-100 hover:text-violet-700'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Motivo de la Cita</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 pt-3.5 pointer-events-none">
                  <FileText size={18} className="text-slate-400" />
                </div>
                <textarea 
                  required
                  rows={2}
                  className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all duration-300 resize-none text-slate-700"
                  placeholder="Ej. Revisión mensual, Terapia cognitivo-conductual..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Modalidad</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl border-2 cursor-pointer transition-all ${modalidad === 'presencial' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
                  <input type="radio" name="modalidad" className="hidden" checked={modalidad === 'presencial'} onChange={() => setModalidad('presencial')} />
                  <span className="font-bold">🏥 Presencial</span>
                </label>
                <label className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl border-2 cursor-pointer transition-all ${modalidad === 'virtual' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
                  <input type="radio" name="modalidad" className="hidden" checked={modalidad === 'virtual'} onChange={() => setModalidad('virtual')} />
                  <span className="font-bold">🌐 Videollamada</span>
                </label>
              </div>
            </div>

            <div className="bg-violet-50/60 p-4 rounded-xl border border-violet-100 space-y-3">
              <label className="flex items-center text-sm font-bold text-violet-900 cursor-pointer">
                <input 
                  type="checkbox"
                  className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500 mr-2.5"
                  checked={enviarCorreo}
                  onChange={(e) => setEnviarCorreo(e.target.checked)}
                />
                Enviar confirmación por correo al paciente
              </label>

              {enviarCorreo && (
                <div>
                  <input 
                    type="email"
                    placeholder="correo.paciente@ejemplo.com"
                    className="w-full px-4 py-2 bg-white border border-violet-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none text-slate-700"
                    value={correoPaciente}
                    onChange={(e) => setCorreoPaciente(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSaving}
                className="flex items-center px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-all duration-300 shadow-md shadow-violet-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : (
                  <>
                    <Save size={18} className="mr-2" />
                    Agendar Cita
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
