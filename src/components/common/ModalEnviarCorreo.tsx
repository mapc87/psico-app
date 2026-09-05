import React, { useState, useEffect } from 'react';
import { X, Mail, Send, CheckCircle, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import type { SendEmailResult } from '../../services/email/emailService';

interface ModalEnviarCorreoProps {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  subtitulo?: string;
  emailDefault?: string;
  onSend: (email: string) => Promise<SendEmailResult>;
}

export default function ModalEnviarCorreo({
  isOpen,
  onClose,
  titulo,
  subtitulo = 'Ingresa el correo electrónico del destinatario para enviar el documento.',
  emailDefault = '',
  onSend,
}: ModalEnviarCorreoProps) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<SendEmailResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail(emailDefault);
      setResult(null);
      setIsSending(false);
    }
  }, [isOpen, emailDefault]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSending) return;

    setIsSending(true);
    setResult(null);

    try {
      const res = await onSend(email);
      setResult(res);
      if (res.success) {
        setTimeout(() => {
          onClose();
        }, 2200);
      }
    } catch (err: any) {
      setResult({
        success: false,
        error: err?.message || 'Ocurrió un error inesperado al enviar el correo.',
        mode: 'resend',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center space-x-3 z-10">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-sm">
              <Mail size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">{titulo}</h3>
              <p className="text-xs text-violet-100 font-medium">Notificación Digital via Email</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer z-10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {result?.success ? (
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle size={36} />
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-slate-800">¡Correo Enviado!</h4>
                <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                  El mensaje se entregó exitosamente a <strong className="text-slate-700">{email}</strong>.
                </p>
                {result.mode === 'demo' && (
                  <span className="inline-block mt-3 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                    ⚡ Modo de Prueba Activo
                  </span>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-slate-500 leading-relaxed">{subtitulo}</p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Correo Electrónico del Destinatario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@paciente.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none text-slate-800 text-sm font-semibold transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {result && !result.success && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start space-x-2.5 animate-in fade-in">
                  <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Error al enviar correo</span>
                    {result.error}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving => isSending}
                  className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSending || !email}
                  className="flex items-center px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-violet-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <Loader2 size={18} className="animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Enviar Correo
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
