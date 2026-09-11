# PsicoApp - Documentación Técnica y Estado del Proyecto (SaaS Multi-Tenant)

Este documento contiene el estado actual de la arquitectura de la aplicación PsicoApp. Está diseñado para ser leído por un agente de IA en una nueva conversación para continuar el trabajo exactamente donde se quedó.

## 1. Arquitectura General
El sistema utiliza un modelo **SaaS Multi-Tenant B2B** utilizando **Supabase (PostgreSQL)** y el frontend en **React (Vite)**.
El sistema soporta múltiples clínicas operando de forma aislada gracias a las políticas de Row Level Security (RLS).

### Jerarquía de Roles:
1. **SuperAdmin (Owner del SaaS):**
   - El primer usuario registrado en la base de datos es el `superadmin`.
   - Su `clinica_id` es `NULL`.
   - Tiene acceso al "Panel de Organización" (Dashboard especial) y al "Mantenimiento de Clínicas", donde puede ver, crear, editar, desactivar o eliminar nuevas Clínicas.
2. **Admin (Dueño de Clínica):**
   - Se registra utilizando un "Código de Invitación" generado por el SuperAdmin.
   - Su cuenta se ata a un `clinica_id` específico.
   - Tiene acceso total a los datos de su propia clínica (Pacientes, Citas, Personal, Configuración de Clínica, etc.).
3. **Personal (Secretarias, Asistentes, Doctores Adicionales):**
   - Se registran con un código generado por el Admin de la clínica o tienen un rol predefinido.
   - Tienen un `rol_id` (tabla `roles`) que define permisos granulares (verAgenda, verPacientes, etc.), o un rol base como `doctor` o `personal`.

## 2. Características Completadas (Historial de Desarrollo)

### Base de Datos y Seguridad
- **Organización de Scripts SQL:** Todos los scripts de creación y migración se han estructurado dentro del directorio `database_scripts/`.
  - El archivo `database_scripts/init_database_full.sql` contiene el esquema principal de la base de datos.
  - La carpeta `database_scripts/migrations/` contiene scripts de migración adicionales que añaden funcionalidades específicas (como datos fiscales SAT, y parches de RLS).
- **RLS y Permisos:** Políticas implementadas para asegurar que cada clínica solo vea sus propios datos. Se arreglaron múltiples políticas de seguridad para permitir al SuperAdmin realizar el mantenimiento de las clínicas.

### Facturación y Finanzas (Guatemala) y Control de Caja
- Se estandarizó la moneda del sistema a **Quetzales (Q.)**.
- Se adaptó la base de datos para soportar los requerimientos legales de Guatemala (SAT), incluyendo campos como **NIT**, **Razón Social** en los pacientes, y **Número de Factura, Serie y Autorización (FEL)** en las facturas.
- Las clínicas pueden configurar sus propios datos fiscales (NIT, Dirección Fiscal, No. Patente, etc.) a través de `/configuracion`.
- **Módulo de Finanzas Mejorado:** Se separó en 3 pestañas: Facturación, Control de Caja y Libro Mayor.
- **Control de Caja:** Se agregaron las tablas `cajas` y `movimientos_caja`. Es obligatorio tener una caja abierta para poder registrar el cobro de una factura. Permite registrar ingresos y egresos, y calcular el cuadre de efectivo.
- **Impresión Media Carta:** Se ajustó el módulo para imprimir facturas en formato formal de Media Carta (5.5 x 8.5 in) utilizando CSS `@media print`.

### Correos Electrónicos
- Se implementó la integración con **EmailJS** para el envío de invitaciones de clínica y personal.

### Características adicionales
- **Citas**: Sistema de agenda, recordatorios, y videoconsultas (Jitsi Meet).
- **Archivos Multimedia**: Subida de imágenes, PDFs y documentos directamente al expediente del paciente mediante Supabase Storage.
- **Evaluaciones Psicométricas**:
  - Generación y asignación de tests (presenciales o enlaces remotos).
  - Gestor de Pruebas dinámico integrado en la barra lateral superior.
  - Gráficas longitudinales de progreso del paciente utilizando `recharts`.
  - Generador de informes PDF de resultados mediante `react-to-print`.
  - Integración con IA (Google Gemini) para generar interpretaciones narrativas de resultados psicométricos.

### Mejoras de UI/UX Recientes
- **Dashboard Principal**: Se rediseñó la tarjeta lateral, reemplazando "Cumpleañeros del Mes" por "Evaluaciones Pendientes" para dar seguimiento a los pacientes remotos.
- **Detalle de Pacientes**: 
  - Corrección de la lógica de edad (se parsean correctamente fechas pasadas nulas/vacías sin arrojar "0 años").
  - Extracción de la pestaña de "Citas" hacia un botón superior dedicado que despliega un modal centrado con el historial de citas y opciones de programación, para una visualización clínica más limpia de las pestañas médicas.
- **Gestión y Clasificación de Pacientes (Estados)**:
  - Se agregó la columna `estado` en la tabla `pacientes` (`activo`, `baja`, `alta`) para organizar mejor el listado principal.
  - Se implementó un **Filtro de Estados** en `Pacientes.tsx` para ocultar automáticamente pacientes inactivos de la vista principal.
  - **Cambio rápido de estado**: Se agregó un ícono dedicado (`UserCog`) en la lista de pacientes que abre un modal con botones interactivos para cambiar rápidamente el estado sin necesidad de entrar al formulario completo.
  - Se rediseñaron los formularios de "Nuevo Paciente" y "Editar Paciente" para incluir la selección de estado.
  - Se reemplazó el botón de "Ver Expediente" por un ícono más intuitivo (`FolderOpen`).

### Consentimientos Informados y Firmas Digitales
- Se creó la tabla `plantillas_documentos` para gestionar plantillas predeterminadas de clínica (con un trigger para crear la plantilla estándar automáticamente al registrar una clínica).
- Se implementó la firma presencial (lienzo táctil en `ModalFirma.tsx`) desde el expediente del paciente.
- Se implementó la ruta pública `/firmar/:id` (`FirmaRemota.tsx`) para permitir el envío de enlaces a pacientes y que firmen de manera remota.

### Inteligencia Artificial (Notas SOAP) - ¡Ya implementado!
- Se integró la API oficial de Google Gemini (`@google/genai`).
- En el expediente del paciente (`PacienteDetalle.tsx`), los doctores pueden usar el botón "Redactar con IA" para escribir un borrador rápido y la IA estructurará la información en una nota clínica bajo el estándar SOAP.
- Requiere agregar la llave `VITE_GEMINI_API_KEY` en el archivo `.env` para funcionar (Actualmente configurado).

## 3. Instrucciones para el Próximo Agente
¡El proyecto está completamente funcional, migrado a Supabase y ha sido limpiado de archivos residuales! 

Si requieres reinstalar la base de datos desde cero:
1. Ejecuta el archivo `database_scripts/init_database_full.sql`.
2. Luego, ejecuta los scripts dentro de `database_scripts/migrations/` para aplicar los parches y columnas más recientes.

Cuando trabajes en nuevas funcionalidades:
1. Recuerda siempre enviar el `clinica_id` (que viene de `usuarioActual.clinica_id`) al hacer `insert` en nuevas tablas, ya que las políticas RLS lo requieren.
2. Si creas tablas nuevas, asegúrate de añadir las políticas RLS y revisa siempre si requieren accesos de `superadmin` o de `admin`.
3. Nunca expongas las llaves (Gemini o Supabase Service Role) en el frontend, a menos que sea un prototipo sin backend dedicado. Para un despliegue en producción real, la llamada a Gemini debería moverse a una Edge Function.
