import React, { useState, useMemo } from 'react';
import { X, Search, ChevronDown, ChevronRight, Users, Calendar, BrainCircuit, FileSignature, Wallet, Settings, Shield, Building2, Paperclip, LayoutDashboard, UsersRound, HelpCircle, BookOpen } from 'lucide-react';

interface GuiaSeccion {
  id: string;
  icon: React.ReactNode;
  titulo: string;
  descripcion: string;
  pasos: { titulo: string; detalle: string }[];
  roles: ('superadmin' | 'admin' | 'personal')[];
}

const GUIAS: GuiaSeccion[] = [
  {
    id: 'dashboard',
    icon: <LayoutDashboard size={20} />,
    titulo: 'Dashboard y Resumen',
    descripcion: 'Vista general del sistema con métricas clave.',
    roles: ['superadmin', 'admin'],
    pasos: [
      { titulo: 'Acceder al Dashboard', detalle: 'Haz clic en "Dashboard" en el menú lateral izquierdo. Verás un resumen de pacientes activos, citas del día y estadísticas clave de la clínica.' },
      { titulo: 'Interpretar las métricas', detalle: 'Las tarjetas superiores muestran totales globales. Las gráficas muestran tendencias recientes de actividad clínica.' },
    ]
  },
  {
    id: 'pacientes',
    icon: <Users size={20} />,
    titulo: 'Gestión de Pacientes',
    descripcion: 'Cómo crear, buscar y gestionar expedientes.',
    roles: ['admin', 'personal'],
    pasos: [
      { titulo: 'Crear un nuevo paciente', detalle: 'Ve a "Pacientes" → haz clic en el botón "+ Nuevo Paciente". Rellena el formulario con nombre, fecha de nacimiento, contacto y datos clínicos. Haz clic en "Guardar".' },
      { titulo: 'Buscar un paciente', detalle: 'En la lista de Pacientes, usa la barra de búsqueda en la parte superior para filtrar por nombre, número de expediente o diagnóstico.' },
      { titulo: 'Abrir el expediente', detalle: 'Haz clic sobre el nombre o tarjeta del paciente en la lista. Esto abrirá el expediente completo con todas sus pestañas.' },
      { titulo: 'Navegar por el expediente', detalle: 'El expediente tiene pestañas: Resumen, Notas, Exámenes, Signos Vitales, Diagnósticos, Medicamentos, Evaluaciones, Archivos y Finanzas. Haz clic en cada pestaña para acceder a esa sección.' },
    ]
  },
  {
    id: 'notas',
    icon: <BookOpen size={20} />,
    titulo: 'Notas Clínicas',
    descripcion: 'Registrar notas de sesión en formato SOAP con IA.',
    roles: ['admin', 'personal'],
    pasos: [
      { titulo: 'Agregar una nota manual', detalle: 'En el expediente del paciente → pestaña "Notas" → clic en "+ Nueva Nota". Escribe la nota en el editor de texto y haz clic en "Guardar".' },
      { titulo: 'Crear nota con IA (Gemini)', detalle: 'Haz clic en el botón "✨ Nota con IA". Escribe un borrador rápido de lo que pasó en la sesión (frases sueltas, palabras clave). La IA lo convertirá en una nota clínica estructurada en formato SOAP.' },
      { titulo: 'Editar la nota generada', detalle: 'Revisa el texto generado. Puedes editarlo antes de guardar para ajustar cualquier detalle. La nota final queda guardada en el expediente.' },
    ]
  },
  {
    id: 'agenda',
    icon: <Calendar size={20} />,
    titulo: 'Agenda y Citas',
    descripcion: 'Programar, gestionar y realizar videoconsultas.',
    roles: ['admin', 'personal'],
    pasos: [
      { titulo: 'Agendar una cita', detalle: 'Ve a "Agenda" en el menú → haz clic en "+ Nueva Cita". Selecciona el paciente, fecha, hora y tipo de consulta. Guarda la cita.' },
      { titulo: 'Ver citas del día', detalle: 'La vista de Agenda muestra el calendario con todas las citas. Las citas de hoy aparecen resaltadas.' },
      { titulo: 'Iniciar videoconsulta', detalle: 'En el expediente del paciente → pestaña "Citas" → haz clic en el botón "📹 Videoconsulta" de la cita correspondiente. Se abrirá la sala virtual con Jitsi Meet.' },
      { titulo: 'Sala del paciente', detalle: 'Cada cita genera un enlace único para el paciente. Puedes copiarlo y enviárselo por WhatsApp o correo para que se conecte desde su dispositivo.' },
    ]
  },
  {
    id: 'evaluaciones',
    icon: <BrainCircuit size={20} />,
    titulo: 'Evaluaciones Psicométricas',
    descripcion: 'Aplicar tests, ver resultados, gráficas y análisis IA.',
    roles: ['admin', 'personal'],
    pasos: [
      { titulo: 'Aplicar un test presencial', detalle: 'Expediente del paciente → pestaña "Evaluaciones" → clic en "+ Aplicar Test" → selecciona el test → haz clic en "Realizar Ahora". El test se muestra en pantalla para que el psicólogo lo aplique junto al paciente.' },
      { titulo: 'Enviar test al paciente (remoto)', detalle: 'Sigue los mismos pasos pero elige "Enviar al Paciente". Se genera un enlace único que puedes copiar y enviar al paciente por WhatsApp o correo. El paciente llena el test desde su dispositivo.' },
      { titulo: 'Ver resultados y puntajes', detalle: 'Una vez completado, el test aparece en la lista con su puntaje total e interpretación. Para tests realizados más de una vez, aparecerá una gráfica de evolución automáticamente.' },
      { titulo: 'Analizar resultados con IA', detalle: 'Haz clic en el ícono ✨ junto al resultado del test. Gemini generará una interpretación narrativa clínica detallada de 2-3 párrafos que puedes copiar directamente a tus notas.' },
      { titulo: 'Imprimir informe PDF', detalle: 'Haz clic en el ícono 🖨️ junto al resultado. Se generará un informe psicométrico profesional con membrete, datos del paciente, puntaje, baremos e interpretación, listo para imprimir o guardar.' },
    ]
  },
  {
    id: 'archivos',
    icon: <Paperclip size={20} />,
    titulo: 'Archivos y Documentos',
    descripcion: 'Subir y gestionar archivos en el expediente del paciente.',
    roles: ['admin', 'personal'],
    pasos: [
      { titulo: 'Subir un archivo', detalle: 'Expediente del paciente → pestaña "Archivos" → arrastra el archivo al área punteada, o haz clic en "Seleccionar archivo". Se aceptan imágenes (JPG, PNG), PDFs y documentos de hasta 10MB.' },
      { titulo: 'Ver un archivo', detalle: 'Los archivos subidos aparecen en una cuadrícula. Haz clic en el botón de descarga para abrirlo o guardarlo en tu dispositivo.' },
      { titulo: 'Eliminar un archivo', detalle: 'Haz clic en el ícono de papelera junto al archivo. Confirma la acción. El archivo se elimina permanentemente del expediente.' },
    ]
  },
  {
    id: 'consentimientos',
    icon: <FileSignature size={20} />,
    titulo: 'Consentimientos y Firmas',
    descripcion: 'Generar y firmar documentos legales digitalmente.',
    roles: ['admin', 'personal'],
    pasos: [
      { titulo: 'Generar un consentimiento', detalle: 'En el expediente → haz clic en el botón "📄 Documentos" (esquina superior derecha). Selecciona la plantilla de consentimiento y elige "Presencial" o "Por Correo".' },
      { titulo: 'Firma presencial', detalle: 'Elige "Presencial". Se abrirá un lienzo de firma digital. El paciente puede firmar con el dedo (tablet) o con el mouse. Haz clic en "Guardar Firma" cuando esté listo.' },
      { titulo: 'Firma remota por correo', detalle: 'Elige "Por Correo". El sistema generará un enlace único. Puedes copiarlo o enviarlo directamente al correo del paciente. El paciente lo abre en su dispositivo y firma digitalmente.' },
      { titulo: 'Ver documentos firmados', detalle: 'El panel de Documentos muestra todos los consentimientos con su estado (Pendiente / Firmado) y la imagen de la firma del paciente.' },
    ]
  },
  {
    id: 'finanzas',
    icon: <Wallet size={20} />,
    titulo: 'Facturación y Pagos',
    descripcion: 'Emitir facturas y registrar pagos de pacientes.',
    roles: ['admin'],
    pasos: [
      { titulo: 'Emitir una factura', detalle: 'Expediente del paciente → pestaña "Finanzas" → clic en "Emitir Factura". Llena el concepto, monto total y fecha de vencimiento. Haz clic en "Guardar".' },
      { titulo: 'Registrar un pago', detalle: 'En la lista de facturas, las que tienen saldo pendiente muestran un botón "Registrar Pago". Haz clic, ingresa el monto abonado y el método de pago.' },
      { titulo: 'Ver estado de cuenta', detalle: 'Las tarjetas superiores muestran el saldo total adeudado y la cantidad de facturas pendientes del paciente. Útil para el seguimiento de cobranza.' },
      { titulo: 'Módulo global de finanzas', detalle: 'Ve a "Facturación" en el menú lateral para ver un resumen de todos los pacientes con saldo pendiente y el estado financiero global de la clínica.' },
    ]
  },
  {
    id: 'roles',
    icon: <Shield size={20} />,
    titulo: 'Roles y Permisos',
    descripcion: 'Configurar qué puede hacer cada tipo de usuario.',
    roles: ['admin'],
    pasos: [
      { titulo: 'Crear un nuevo rol', detalle: 'Ve a "Roles y Permisos" en la sección de Administración. Haz clic en "+ Nuevo Rol". Ponle un nombre y activa o desactiva cada permiso según lo que ese rol debe poder hacer.' },
      { titulo: 'Editar un rol existente', detalle: 'Haz clic en el botón de editar (lápiz) junto al rol. Modifica los permisos y guarda. Los cambios aplican inmediatamente a todos los usuarios con ese rol.' },
      { titulo: 'Permisos disponibles', detalle: 'Puedes controlar: ver pacientes, ver agenda, ver finanzas, crear/editar registros clínicos, acceso a administración, entre otros.' },
    ]
  },
  {
    id: 'personal',
    icon: <UsersRound size={20} />,
    titulo: 'Gestión de Personal',
    descripcion: 'Agregar y administrar usuarios del sistema.',
    roles: ['admin'],
    pasos: [
      { titulo: 'Invitar a un nuevo colaborador', detalle: 'Ve a "Personal" en la sección de Administración → clic en "+ Invitar Usuario". Ingresa el correo electrónico y asigna un rol. El colaborador recibirá un correo con el enlace de registro.' },
      { titulo: 'Cambiar el rol de un usuario', detalle: 'En la lista de Personal, cada usuario tiene un selector de rol. Cámbialo directamente desde la lista. El cambio es inmediato.' },
      { titulo: 'Desactivar acceso', detalle: 'Si un colaborador ya no trabaja en la clínica, puedes eliminarlo de la lista de Personal. Perderá acceso al sistema automáticamente.' },
    ]
  },
  {
    id: 'clinicas',
    icon: <Building2 size={20} />,
    titulo: 'Gestión de Clínicas',
    descripcion: 'Administrar clínicas del sistema (solo superadmin).',
    roles: ['superadmin'],
    pasos: [
      { titulo: 'Ver todas las clínicas', detalle: 'Ve a "Clínicas" en el menú. Verás la lista de todas las clínicas registradas en el sistema con su nombre, correo de contacto y estado.' },
      { titulo: 'Crear una clínica', detalle: 'Haz clic en "+ Nueva Clínica". Ingresa el nombre, correo y datos de la clínica. Al crearla, se generan automáticamente las plantillas y configuraciones por defecto.' },
    ]
  },
  {
    id: 'configuracion',
    icon: <Settings size={20} />,
    titulo: 'Configuración de la Clínica',
    descripcion: 'Personalizar la información y ajustes de tu clínica.',
    roles: ['admin'],
    pasos: [
      { titulo: 'Editar datos de la clínica', detalle: 'Ve a "Ajustes de Clínica" en la sección de Administración. Puedes actualizar el nombre, dirección, teléfono y correo de contacto de tu clínica.' },
      { titulo: 'Personalizar plantillas de documentos', detalle: 'En la misma sección podrás gestionar las plantillas de consentimientos informados que usarás para tus pacientes.' },
    ]
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rol: 'superadmin' | 'admin' | 'personal';
  permisos?: Record<string, boolean> | null;
}

export default function CentroAyuda({ isOpen, onClose, rol, permisos }: Props) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const guiasFiltradas = useMemo(() => {
    let lista = GUIAS.filter(g => g.roles.includes(rol));

    // Para rol 'personal', filtra también por permisos
    if (rol === 'personal' && permisos) {
      lista = lista.filter(g => {
        if (g.id === 'agenda') return permisos.verAgenda;
        if (g.id === 'pacientes' || g.id === 'notas' || g.id === 'evaluaciones' || g.id === 'archivos' || g.id === 'consentimientos') return permisos.verPacientes;
        if (g.id === 'finanzas') return permisos.verFinanzas;
        return true;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      lista = lista.filter(g =>
        g.titulo.toLowerCase().includes(q) ||
        g.descripcion.toLowerCase().includes(q) ||
        g.pasos.some(p => p.titulo.toLowerCase().includes(q) || p.detalle.toLowerCase().includes(q))
      );
    }

    return lista;
  }, [rol, permisos, search]);

  const rolLabel: Record<string, string> = {
    superadmin: 'Super Administrador',
    admin: 'Administrador',
    personal: 'Personal Clínico',
  };

  const rolColor: Record<string, string> = {
    superadmin: 'bg-fuchsia-100 text-fuchsia-700',
    admin: 'bg-violet-100 text-violet-700',
    personal: 'bg-sky-100 text-sky-700',
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300">

        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-fuchsia-50 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-violet-600 mr-3">
                <HelpCircle size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Centro de Ayuda</h2>
                <p className="text-xs text-slate-500 mt-0.5">Guía de uso del sistema</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Rol badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${rolColor[rol]}`}>
              {rolLabel[rol]}
            </span>
            <span className="text-xs text-slate-400">Mostrando guías para tu perfil</span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar en la guía..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {guiasFiltradas.length === 0 ? (
            <div className="text-center py-16">
              <HelpCircle size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-semibold">No se encontraron resultados</p>
              <p className="text-slate-400 text-sm mt-1">Intenta con otras palabras clave</p>
            </div>
          ) : (
            guiasFiltradas.map(guia => {
              const isExpanded = expanded === guia.id;
              return (
                <div
                  key={guia.id}
                  className="border border-slate-100 rounded-2xl overflow-hidden bg-white hover:border-violet-200 transition-colors shadow-sm"
                >
                  {/* Section header */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : guia.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mr-3 ${isExpanded ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-600'} transition-colors`}>
                        {guia.icon}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{guia.titulo}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{guia.descripcion}</p>
                      </div>
                    </div>
                    <div className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                      <ChevronRight size={18} />
                    </div>
                  </button>

                  {/* Steps */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      {guia.pasos.map((paso, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 mb-1">{paso.titulo}</p>
                            <p className="text-sm text-slate-600 leading-relaxed">{paso.detalle}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <p className="text-xs text-slate-400 text-center">
            ¿No encuentras lo que buscas? Contacta a soporte.
          </p>
        </div>
      </div>
    </>
  );
}
