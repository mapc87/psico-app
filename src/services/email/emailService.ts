import {
  getFirmaRemotaTemplate,
  getConfirmacionCitaTemplate,
  getRecetaMedicaTemplate,
  getInvitacionTemplate,
  getRecordatorioCitaTemplate,
} from './emailTemplates';
import type {
  FirmaRemotaEmailParams,
  ConfirmacionCitaEmailParams,
  RecetaMedicaEmailParams,
  InvitacionEmailParams,
  RecordatorioCitaEmailParams,
} from './emailTemplates';
import { supabase } from '../supabase/client';

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
  mode: 'resend' | 'demo';
}

// Obtener credenciales de correo de la clínica activa (DB tiene prioridad sobre .env)
async function getEmailCredentials(clinicaId?: string): Promise<{ apiKey: string; from: string }> {
  const envKey = import.meta.env.VITE_RESEND_API_KEY || '';

  if (clinicaId) {
    const { data } = await supabase
      .from('clinicas')
      .select('resend_api_key, email_remitente')
      .eq('id', clinicaId)
      .single();

    if (data?.resend_api_key) {
      return {
        apiKey: data.resend_api_key,
        from: data.email_remitente || 'onboarding@resend.dev',
      };
    }
  }

  // Fallback al .env
  return {
    apiKey: envKey,
    from: 'onboarding@resend.dev',
  };
}

async function sendEmailViaResend(to: string, subject: string, html: string, clinicaId?: string): Promise<SendEmailResult> {
  const { apiKey, from } = await getEmailCredentials(clinicaId);

  if (!apiKey || apiKey.includes('TU_RESEND_API_KEY')) {
    console.log(`[EmailService Demo Mode] 📧 Simulación de correo enviada a ${to}`);
    console.log(`[EmailService Demo Mode] Asunto: ${subject}`);
    return {
      success: true,
      id: 'demo-' + Date.now(),
      mode: 'demo',
    };
  }

  try {
    const endpoint =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? '/api/resend/emails'
        : 'https://api.resend.com/emails';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[EmailService] Error de Resend API:', data);
      return { success: false, error: data.message || 'Error al enviar correo', mode: 'resend' };
    }

    return { success: true, id: data.id, mode: 'resend' };
  } catch (err: any) {
    console.error('[EmailService] Excepción:', err);
    return { success: false, error: err.message || 'Error de red', mode: 'resend' };
  }
}

export const emailService = {
  async enviarFirmaRemota(to: string, params: FirmaRemotaEmailParams, clinicaId?: string): Promise<SendEmailResult> {
    const { subject, html } = getFirmaRemotaTemplate(params);
    return sendEmailViaResend(to, subject, html, clinicaId);
  },

  async enviarConfirmacionCita(to: string, params: ConfirmacionCitaEmailParams, clinicaId?: string): Promise<SendEmailResult> {
    const { subject, html } = getConfirmacionCitaTemplate(params);
    return sendEmailViaResend(to, subject, html, clinicaId);
  },

  async enviarRecetaMedica(to: string, params: RecetaMedicaEmailParams, clinicaId?: string): Promise<SendEmailResult> {
    const { subject, html } = getRecetaMedicaTemplate(params);
    return sendEmailViaResend(to, subject, html, clinicaId);
  },

  async enviarInvitacionClinica(to: string, params: InvitacionEmailParams, clinicaId?: string): Promise<SendEmailResult> {
    const { subject, html } = getInvitacionTemplate(params);
    return sendEmailViaResend(to, subject, html, clinicaId);
  },

  async enviarRecordatorioCita(to: string, params: RecordatorioCitaEmailParams, clinicaId?: string): Promise<SendEmailResult> {
    const { subject, html } = getRecordatorioCitaTemplate(params);
    return sendEmailViaResend(to, subject, html, clinicaId);
  },
};
