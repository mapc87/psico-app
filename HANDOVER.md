# PsicoApp - Documentación Técnica y Estado del Proyecto (SaaS Multi-Tenant)

Este documento contiene el estado actual de la arquitectura de la aplicación PsicoApp. Está diseñado para ser leído por un agente de IA en una nueva conversación para continuar el trabajo exactamente donde se quedó.

## 1. Arquitectura General
El sistema ha sido migrado de una base de datos local (Dexie.js) a un modelo **SaaS Multi-Tenant B2B** utilizando **Supabase (PostgreSQL)**.
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

## 2. Estado de la Migración a Supabase

### ✅ Lo que YA está completado:
- **Base de Datos:** Tablas creadas en Supabase (`clinicas`, `usuarios`, `pacientes`, `citas`, `invitaciones`, etc.).
- **Seguridad (RLS):** Políticas implementadas. Los usuarios solo ven datos de su propia clínica mediante `get_user_clinica_id()`. El SuperAdmin bypasses esto para ver clínicas y usuarios.
- **Triggers y RPC:**
  - Trigger `handle_new_user` configurado en `auth.users` para interceptar registros y asignar roles (SuperAdmin si es el 1ro, o Admin/Personal si trae código de invitación válido).
  - Función RPC `check_has_users()` para que el frontend (`AuthContext.tsx`) sepa si debe mostrar el formulario de "Crear Organización" o el Login normal.
- **Frontend Core (Refactorizado):**
  - `src/types/index.ts`: Todos los tipos actualizados a Snake Case y con UUIDs (`id: string`, `clinica_id: string`) para coincidir con PostgreSQL.
  - `src/context/AuthContext.tsx`: Conectado 100% a Supabase Auth. Maneja el estado de la sesión, auto-cierre si el perfil fue borrado en BD, y chequeo de primer administrador.
  - `src/pages/Login.tsx`: Adaptado para Supabase.
  - `src/pages/RegistroInicial.tsx`: Pantalla exclusiva para la creación del SuperAdmin.
  - `src/pages/RegistroInvitado.tsx`: Nueva pantalla para que los Doctores se registren usando un Código de Invitación.
  - `src/pages/Dashboard.tsx`: Ramificado en dos vistas. La vista de Organización (SuperAdmin) permite crear clínicas y generar códigos. La vista Médica carga pacientes y citas desde Supabase.

### 🚧 Lo que FALTA por refactorizar (TAREA PARA EL PRÓXIMO AGENTE):
¡La migración inicial a Supabase ha sido completada! Todos los módulos listados anteriormente (Pacientes, Agenda, Roles, Personal, Layouts) han sido refactorizados exitosamente para depender de Supabase y no de Dexie.js.

Cualquier trabajo futuro debería enfocarse en mejoras, testing, o nuevas funcionalidades utilizando la infraestructura de Supabase ya establecida.

## 3. Instrucciones para el Próximo Agente
Cuando inicies la sesión, **NO modifiques `AuthContext`, `Login`, ni `RegistroInicial`**. Esos archivos ya funcionan con la compleja lógica de Supabase Auth, Invitaciones y RLS.
Tu tarea principal es ir archivo por archivo en la lista de arriba (empezando por `Pacientes.tsx`) y cambiar las llamadas locales por consultas a Supabase.
Recuerda que todas las inserciones a Supabase deben llevar explícitamente el `clinica_id`, el cual puedes extraer de `usuarioActual.clinica_id` (que viene del `AuthContext`).

## 4. Notas de Troubleshooting (Supabase RLS)
- Si un usuario no puede ver datos, revisa la función SQL `get_user_clinica_id()` que lee el `clinica_id` de `public.usuarios`.
- El SuperAdmin no tiene `clinica_id`.
- Las invitaciones se validan en el Trigger `handle_new_user` antes de permitir el registro.
