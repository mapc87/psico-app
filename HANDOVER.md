# PsicoApp - Documentación Técnica y Estado del Proyecto (SaaS Multi-Tenant)

Este documento contiene el estado actual de la arquitectura de la aplicación PsicoApp. Está diseñado para ser leído por un agente de IA en una nueva conversación para continuar el trabajo exactamente donde se quedó.

## 1. Arquitectura General
El sistema utiliza un modelo **SaaS Multi-Tenant B2B** utilizando **Supabase (PostgreSQL)** y el frontend en **React (Vite)**.
El sistema soporta múltiples clínicas operando de forma aislada gracias a las políticas de Row Level Security (RLS).

### Jerarquía de Roles:
1. **SuperAdmin (Owner del SaaS):**
   - El primer usuario registrado en la base de datos es el `superadmin`.
   - Su `clinica_id` es `NULL`.
   - Tiene acceso al "Panel de Organización" (Dashboard especial) donde puede ver y crear nuevas Clínicas.
   - Al crear una clínica, genera un código de invitación para el doctor dueño.
2. **Admin (Dueño de Clínica):**
   - Se registra utilizando un "Código de Invitación" generado por el SuperAdmin.
   - Su cuenta se ata a un `clinica_id` específico.
   - Tiene acceso total a los datos de su propia clínica (Pacientes, Citas, Personal, etc.).
3. **Personal (Secretarias, Asistentes):**
   - Se registran con un código generado por el Admin de la clínica.
   - Tienen un `rol_id` (tabla `roles`) que define permisos granulares (verAgenda, verPacientes, etc.).

## 2. Características Completadas (Historial de Desarrollo)

### Base de Datos y Seguridad
- **Unificación de Scripts SQL:** Todos los scripts de creación y migración se han unificado en un solo archivo `init_database_full.sql`. Puedes ejecutar este script completo en una nueva instancia de Supabase para inicializar toda la estructura.
- **RLS y Permisos:** Políticas implementadas para asegurar que cada clínica solo vea sus propios datos. Se corrigió un bug (`fix_admin_invitations.sql`) que impedía a los administradores crear invitaciones para su personal.

### Facturación y Finanzas (Guatemala)
- Se estandarizó la moneda del sistema a **Quetzales (Q.)**.
- Se adaptó la base de datos para soportar los requerimientos legales de Guatemala (SAT), incluyendo campos como **NIT**, **Razón Social** en los pacientes (`migration_nit.sql`), y **Número de Factura, Serie y Autorización (FEL)** en las facturas (`migration_fel.sql`).
- La vista `FinanzasGlobal.tsx` permite al administrador visualizar ingresos, registrar pagos (completos o parciales) y llevar el control financiero.

### Consentimientos Informados y Firmas Digitales
- Se creó la tabla `plantillas_documentos` para gestionar plantillas predeterminadas de clínica (con un trigger para crear la plantilla estándar automáticamente al registrar una clínica).
- Se implementó la firma presencial (lienzo táctil en `ModalFirma.tsx`) desde el expediente del paciente.
- Se implementó la ruta pública `/firmar/:id` (`FirmaRemota.tsx`) para permitir el envío de enlaces a pacientes y que firmen de manera remota.

### Inteligencia Artificial (Notas SOAP)
- Se integró la API oficial de Google Gemini (`@google/genai`).
- El modelo utilizado es `gemini-3.6-flash`.
- En el expediente del paciente, los doctores pueden escribir un borrador rápido y la IA estructurará la información en una nota clínica bajo el estándar SOAP.
- Requiere agregar la llave `VITE_GEMINI_API_KEY` en el archivo `.env.local` para funcionar.

## 3. Instrucciones para el Próximo Agente
¡El proyecto está completamente funcional y migrado a Supabase! 
Si requieres reinstalar la base de datos desde cero, simplemente ejecuta el archivo `init_database_full.sql` en el SQL Editor de Supabase. 

Cuando trabajes en nuevas funcionalidades:
1. Recuerda siempre enviar el `clinica_id` (que viene de `usuarioActual.clinica_id`) al hacer `insert` en nuevas tablas, ya que las políticas RLS lo requieren.
2. Si creas tablas nuevas, asegúrate de añadir las políticas RLS (usando `get_user_clinica_id()` para las consultas `SELECT`, `UPDATE` y `DELETE`).
3. Nunca expongas la llave de Gemini ni de Supabase Service Role en el frontend; las que tenemos actualmente son seguras porque requieren autenticación (Supabase) o porque se asume uso en entorno de prueba sin backend dedicado. Para un despliegue en producción real, la llamada a Gemini debería moverse a una Edge Function.
