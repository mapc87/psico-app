export interface FirmaRemotaEmailParams {
  pacienteNombre: string;
  clinicaNombre?: string;
  documentoTitulo: string;
  urlFirma: string;
}

export interface ConfirmacionCitaEmailParams {
  pacienteNombre: string;
  clinicaNombre?: string;
  fechaStr: string;
  horaStr: string;
  motivo: string;
  doctorNombre?: string;
}

export interface RecetaMedicaEmailParams {
  pacienteNombre: string;
  clinicaNombre?: string;
  medicamentos: Array<{ nombre: string; dosis: string; frecuencia: string; duracion: string; indicaciones?: string }>;
  doctorNombre?: string;
}

export function getFirmaRemotaTemplate({
  pacienteNombre,
  clinicaNombre = 'PsicoApp',
  documentoTitulo,
  urlFirma,
}: FirmaRemotaEmailParams): { subject: string; html: string } {
  const subject = `✍️ Firma de Documento Pendiente: ${documentoTitulo} - ${clinicaNombre}`;
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Firma de Documento</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #334155; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 16px; }
        .box { background-color: #f1f5f9; border-left: 4px solid #6366f1; padding: 16px; border-radius: 8px; margin: 20px 0; }
        .doc-title { font-weight: 700; color: #4338ca; font-size: 16px; }
        .cta-container { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${clinicaNombre}</h1>
          <p>Solicitud de Firma Digital de Documento Legal</p>
        </div>
        <div class="content">
          <div class="greeting">Hola, ${pacienteNombre}</div>
          <p>Se ha generado un documento médico que requiere tu firma consentida para formar parte de tu expediente clínico de manera oficial.</p>
          
          <div class="box">
            <div style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700;">Documento Requerido</div>
            <div class="doc-title">${documentoTitulo}</div>
          </div>

          <p>Puedes revisar el contenido completo del documento y realizar tu firma digital cómodamente desde tu teléfono o computadora haciendo clic en el siguiente botón:</p>

          <div class="cta-container">
            <a href="${urlFirma}" target="_blank" class="btn">Firmar Documento Ahora</a>
          </div>

          <p style="font-size: 13px; color: #64748b;">Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:<br><a href="${urlFirma}" style="color: #4f46e5; word-break: break-all;">${urlFirma}</a></p>
        </div>
        <div class="footer">
          Este correo fue enviado automáticamente por el sistema médico ${clinicaNombre}. Si no solicitaste este documento, puedes ignorarlo.
        </div>
      </div>
    </body>
    </html>
  `;
  return { subject, html };
}

export function getConfirmacionCitaTemplate({
  pacienteNombre,
  clinicaNombre = 'PsicoApp',
  fechaStr,
  horaStr,
  motivo,
  doctorNombre,
}: ConfirmacionCitaEmailParams): { subject: string; html: string } {
  const subject = `📅 Cita Confirmada: ${fechaStr} ${horaStr} - ${clinicaNombre}`;
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Cita</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #334155; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 16px; }
        .details-card { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin: 24px 0; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
        .detail-label { font-weight: 700; color: #047857; }
        .detail-val { font-weight: 600; color: #064e3b; text-align: right; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${clinicaNombre}</h1>
          <p>Confirmación de Cita Médica</p>
        </div>
        <div class="content">
          <div class="greeting">Hola, ${pacienteNombre}</div>
          <p>Tu cita médica ha sido agendada exitosamente en nuestro sistema.</p>
          
          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Fecha:</span>
              <span class="detail-val">${fechaStr}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Hora:</span>
              <span class="detail-val">${horaStr} hrs</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Motivo:</span>
              <span class="detail-val">${motivo}</span>
            </div>
            ${doctorNombre ? `
            <div class="detail-row" style="margin-bottom: 0;">
              <span class="detail-label">Especialista:</span>
              <span class="detail-val">${doctorNombre}</span>
            </div>` : ''}
          </div>

          <p>Por favor preséntate 10 minutos antes de tu horario programado. Si deseas reprogramar o cancelar, comunícate con la clínica.</p>
        </div>
        <div class="footer">
          ${clinicaNombre} - Notificación de Citas
        </div>
      </div>
    </body>
    </html>
  `;
  return { subject, html };
}

export function getRecetaMedicaTemplate({
  pacienteNombre,
  clinicaNombre = 'PsicoApp',
  medicamentos,
  doctorNombre,
}: RecetaMedicaEmailParams): { subject: string; html: string } {
  const subject = `💊 Receta Médica Digital - ${clinicaNombre}`;
  const medItemsHtml = medicamentos.map(m => `
    <div style="background: #fff; border: 1px solid #ffe4e6; border-radius: 10px; padding: 14px; margin-bottom: 10px;">
      <div style="font-weight: 800; font-size: 16px; color: #9f1239;">${m.nombre} <span style="font-size: 14px; font-weight: 600; color: #be123c;">(${m.dosis})</span></div>
      <div style="font-size: 13px; color: #475569; margin-top: 4px;"><strong>Frecuencia:</strong> ${m.frecuencia} | <strong>Duración:</strong> ${m.duracion}</div>
      ${m.indicaciones ? `<div style="font-size: 12px; font-style: italic; color: #64748b; margin-top: 4px;">"${m.indicaciones}"</div>` : ''}
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Receta Médica</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #334155; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #e11d48 0%, #f43f5e 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 16px; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${clinicaNombre}</h1>
          <p>Prescripción Médica Digital</p>
        </div>
        <div class="content">
          <div class="greeting">Estimado(a) ${pacienteNombre},</div>
          <p>A continuación se detallan los fármacos y tratamiento prescrito por tu médico especialista:</p>
          
          <div style="background-color: #fff1f2; border-radius: 12px; padding: 16px; margin: 20px 0;">
            ${medItemsHtml}
          </div>

          ${doctorNombre ? `<p style="font-size: 13px; color: #64748b;"><strong>Médico emisor:</strong> ${doctorNombre}</p>` : ''}
        </div>
        <div class="footer">
          ${clinicaNombre} - Prescripción Médica
        </div>
      </div>
    </body>
    </html>
  `;
  return { subject, html };
}

export interface InvitacionEmailParams {
  clinicaNombre: string;
  codigoInvitacion: string;
  rolNombre: string;
}

export function getInvitacionTemplate({
  clinicaNombre,
  codigoInvitacion,
  rolNombre,
}: InvitacionEmailParams): { subject: string; html: string } {
  const subject = `🏥 Invitación para unirte a ${clinicaNombre}`;
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitación a Clínica</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #334155; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 16px; }
        .code-box { background-color: #f1f5f9; border: 2px dashed #94a3b8; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #0f172a; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${clinicaNombre}</h1>
          <p>Invitación a unirse al equipo</p>
        </div>
        <div class="content">
          <div class="greeting">¡Hola!</div>
          <p>Has sido invitado a unirte a <strong>${clinicaNombre}</strong> con el rol de <strong>${rolNombre}</strong>.</p>
          <p>Para aceptar la invitación y crear tu cuenta, utiliza el siguiente código de invitación durante el registro:</p>
          
          <div class="code-box">
            ${codigoInvitacion}
          </div>

          <p>Ingresa a la plataforma, selecciona "Registrarme con código de invitación" y pega el código anterior.</p>
        </div>
        <div class="footer">
          Esta es una invitación automática de ${clinicaNombre}.
        </div>
      </div>
    </body>
    </html>
  `;
  return { subject, html };
}
