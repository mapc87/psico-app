# Documentación de Desarrollo - PsicoApp SaaS

Esta documentación detalla la arquitectura, el modelo de datos, la estructura del proyecto y la lógica de negocio de **PsicoApp**, un software en la nube bajo un modelo B2B (SaaS Multi-Tenant) para clínicas psicológicas y psiquiátricas.

---

## 1. Arquitectura del Sistema

El sistema utiliza una arquitectura "Single Page Application" (SPA) acoplada a un Backend as a Service (BaaS) serverless.

- **Frontend:** React 18, Vite, TypeScript.
- **Estilos:** Tailwind CSS, Lucide React (Íconos).
- **Backend & Base de Datos:** Supabase (PostgreSQL 15+).
- **Autenticación:** Supabase Auth (Integrado con RLS).
- **Almacenamiento:** Supabase Storage (Archivos multimedia, PDFs, Imágenes).
- **Servicios Externos:**
  - *EmailJS*: Envío de correos electrónicos transaccionales (invitaciones, recordatorios).
  - *Google Gemini AI*: API (`@google/genai`) para redactar automáticamente notas clínicas bajo el formato SOAP.
  - *Jitsi Meet*: Integración mediante iFrame para las videoconsultas en vivo.

---

## 2. Modelo Multi-Tenant y Seguridad (RLS)

El pilar de seguridad del sistema recae en las **Row Level Security (RLS)** de PostgreSQL. Al ser un SaaS donde múltiples clínicas comparten la misma base de datos, cada registro (fila) en casi todas las tablas tiene la columna `clinica_id`.

### Lógica de Aislamiento:
1. Cuando un usuario inicia sesión, Supabase inyecta un JWT que contiene su `auth.uid()`.
2. Las políticas RLS están configuradas para verificar a qué `clinica_id` pertenece ese `uid()` (haciendo un join implícito con la tabla `usuarios`).
3. El usuario **solo** puede realizar `SELECT`, `INSERT`, `UPDATE` o `DELETE` sobre registros donde el `clinica_id` coincida con el suyo.
4. **Excepción SuperAdmin:** El rol `superadmin` (cuyo `clinica_id` es NULL) cuenta con políticas de bypass o políticas dedicadas que le permiten ver y administrar todas las filas de la tabla `clinicas`.

---

## 3. Lógica Administrativa y Roles de Usuario

El sistema clasifica a los usuarios basándose en el campo `rol` de la tabla `usuarios`.

### 3.1. Tipos de Usuarios Base:
- **`superadmin`:** Creador del SaaS. Tiene acceso a un panel global (`/dashboard-admin`) para suspender o crear nuevas clínicas. No opera dentro del expediente clínico.
- **`admin`:** El director o dueño de una clínica específica. Tiene control absoluto sobre los datos vinculados a su `clinica_id` (Citas, Pacientes, Finanzas, Configuración y Personal).
- **`personal`:** Cualquier otro miembro de la clínica (Secretaria, Doctor secundario, Enfermera). Su nivel de acceso depende estrictamente de su `rol_id`.

### 3.2. Permisos Granulares (Roles Dinámicos):
- Los administradores pueden crear **Roles** (ej. "Secretaria") desde el módulo `/personal`.
- Cada rol se guarda en la tabla `roles` y contiene un campo `permisos` de tipo `JSONB`.
- Este JSON almacena booleanos (ej. `{"verPacientes": true, "editarPaciente": true, "verExpediente": false}`).
- El frontend (ej. `src/pages/Pacientes.tsx`) lee este JSON (provisto por el `AuthContext`) y renderiza, bloquea o esconde los botones y pantallas en consecuencia.

---

## 4. Flujo de Onboarding e Invitaciones

Para evitar que cualquier persona se registre de manera libre en el sistema, se implementó un flujo basado en invitaciones:

1. **Creación de Clínica:** El SuperAdmin crea la clínica y esto genera un código de invitación (ej. `CLINICA-XYZ`) con el rol de `admin`.
2. **Registro de Admin:** El dueño de la clínica ingresa a la app, elige "Tengo una invitación" y coloca el código. Supabase crea el usuario y un Trigger (`handle_new_user`) copia sus datos a `public.usuarios`, asociándolo al `clinica_id`.
3. **Invitación a Personal:** El Admin ingresa a la pestaña Personal y "Genera una invitación". Se crea un registro en la tabla `invitaciones` con un código único (ej. `STAFF-123`) y se asocia a un rol (ej. Secretaria). EmailJS envía el código por correo.
4. **Registro del Personal:** El empleado se registra usando el código y adquiere el rol y los permisos exactos que diseñó el Admin.

---

## 5. Módulos y Lógica de Negocio Principal

### Módulo de Pacientes y Expediente
- **Gestión de Estados:** Los pacientes pueden estar en estado `activo`, `alta` o `baja`. Se implementan botones de cambio rápido.
- **Secciones del Expediente Clínico:**
  - *Resumen:* Historial médico en texto libre y notas SOAP (con Inteligencia Artificial).
  - *Documentos:* Integración con `plantillas_documentos` para firmar consentimientos presencial o remotamente (`/firmar/:id`).
  - *Evaluaciones Psicométricas:* Permite enviar encuestas a pacientes, calcular el punteo, ver gráficas de progreso e interpretar resultados con IA (Gemini).
  - *Archivos:* Repositorio de nube (Supabase Storage) para exámenes externos, PDFs y radiografías.
  - *Citas (Agenda):* Gestión del calendario personal del doctor integrado con recordatorios automáticos (EmailJS).

### Módulo de Contabilidad y Finanzas
- **Reglas de Negocio:** Diseñado bajo los requerimientos de la SAT (Guatemala).
- **Facturación:** Emisión de comprobantes, cálculos de saldos pendientes y formatos de impresión adaptables (`@media print`).
- **Control de Caja:** 
  - La lógica del negocio dictamina que **no se pueden procesar pagos si no hay una caja abierta**.
  - El usuario abre caja al iniciar el día con un monto inicial, registra facturas y gastos rápidos (egresos), y al finalizar el turno "cierra caja" para cuadrar el efectivo esperado vs el real.

---

## 6. Estructura de Base de Datos (Tablas Clave)

- `clinicas`: Registro maestro de inquilinos. (Campos fiscales, nombre, estado).
- `usuarios`: Sincronizada con Supabase Auth (`auth.users`). Contiene la identidad de la persona y su rol.
- `roles`: Diccionario de permisos JSON asociado a la clínica.
- `pacientes`: Tabla núcleo de la aplicación.
- `citas`: Vincula un paciente, un doctor y un horario. Puede incluir enlace a videollamada.
- **Tablas Clínicas:** `notas_clinicas`, `diagnosticos`, `medicamentos`, `signos_vitales`, `archivos_paciente`.
- **Tablas Psicométricas:** `plantillas_evaluacion`, `evaluaciones_paciente` (incluye un campo `respuestas` JSON y el resultado calculado).
- **Tablas Contables:** `facturas`, `pagos`, `cajas`, `movimientos_caja`.

---

## 7. Árbol de Directorios del Frontend (`/src`)

- `/components`: Componentes reutilizables segregados por módulo (`/citas`, `/finanzas`, `/examenes`). Contiene la lógica de los Modales (popups).
- `/config`: Archivos estáticos de configuración (ej. `modules.ts` define el menú y catálogo de permisos).
- `/context`: Contextos globales, notablemente `AuthContext.tsx` que maneja el perfil logueado y verifica la sesión.
- `/layouts`: Plantillas de vista (ej. `MainLayout` que contiene el Sidebar).
- `/pages`: Las pantallas principales de enrutamiento (ej. `Pacientes.tsx`, `Dashboard.tsx`, `FinanzasGlobal.tsx`).
- `/services`: Conectores externos (`supabase/client.ts`, configuraciones de EmailJS, helpers de Google Gemini).
- `/types`: Definiciones de interfaces TypeScript que espejean directamente el esquema SQL de la base de datos para mantener un tipado estricto.

---

## 8. Consideraciones de Despliegue y Mantenimiento

- **Base de Datos Inicial:** Para levantar una instancia fresca, debe correrse el archivo `database_scripts/00_master_init.sql` que inicializará toda la estructura y configurará los triggers de seguridad de Supabase.
- **Variables de Entorno (`.env`):**
  - `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Requeridos para el frontend).
  - `VITE_GEMINI_API_KEY` (Requerido para generar notas clínicas e interpretar psicometría).
  - `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_INVITACION`, etc. (Requeridos para notificaciones).
- **Protección de Llaves:** En su arquitectura actual, Vite expone las variables de entorno al cliente. Para un entorno de máxima seguridad, se recomienda trasladar las llamadas a Gemini y EmailJS hacia **Edge Functions** o **Webhooks de Supabase**, de modo que las llaves nunca lleguen al navegador del usuario final.
