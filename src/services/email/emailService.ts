import {
  getFirmaRemotaTemplate,
  getConfirmacionCitaTemplate,
  getRecetaMedicaTemplate,
  getInvitacionTemplate,
} from './emailTemplates';
import type {
  FirmaRemotaEmailParams,
  ConfirmacionCitaEmailParams,
  RecetaMedicaEmailParams,
  InvitacionEmailParams,
} from './emailTemplates';

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
  mode: 'resend' | 'demo';
}

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';

async function sendEmailViaResend(to: string, subject: string, html: string): Promise<SendEmailResult> {
  if (!RESEND_API_KEY || RESEND_API_KEY.includes('TU_RESEND_API_KEY')) {
    console.log(`[EmailService Demo Mode] 📧 Simulación de correo enviada a ${to}`);
    console.log(`[EmailService Demo Mode] Asunto: ${subject}`);
    return {
      success: true,
      id: 'demo-' + Date.now(),
      mode: 'demo',
    };
  }

  try {
    const endpoint = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? '/api/resend/emails' 
      : 'https://api.resend.com/emails';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[EmailService] Error de Resend API:', data);
      return {
        success: false,
        error: data.message || 'Error al enviar correo vía Resend API',
        mode: 'resend',
      };
    }

    return {
      success: true,
      id: data.id,
      mode: 'resend',
    };
  } catch (err: any) {
    console.error('[EmailService] Excepción enviando correo:', err);
    return {
      success: false,
      error: err.message || 'Error de red al conectar con Resend',
      mode: 'resend',
    };
  }
}

export const emailService = {
  async enviarFirmaRemota(to: string, params: FirmaRemotaEmailParams): Promise<SendEmailResult> {
    const { subject, html } = getFirmaRemotaTemplate(params);
    return sendEmailViaResend(to, subject, html);
  },

  async enviarConfirmacionCita(to: string, params: ConfirmacionCitaEmailParams): Promise<SendEmailResult> {
    const { subject, html } = getConfirmacionCitaTemplate(params);
    return sendEmailViaResend(to, subject, html);
  },

  async enviarRecetaMedica(to: string, params: RecetaMedicaEmailParams): Promise<SendEmailResult> {
    const { subject, html } = getRecetaMedicaTemplate(params);
    return sendEmailViaResend(to, subject, html);
  },

  async enviarInvitacionClinica(to: string, params: InvitacionEmailParams): Promise<SendEmailResult> {
    const { subject, html } = getInvitacionTemplate(params);
    return sendEmailViaResend(to, subject, html);
  },
};
