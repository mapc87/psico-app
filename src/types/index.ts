export interface Usuario {
  id?: number;
  nombre: string;
  email: string;
  password?: string; // En Dexie se guarda texto plano (o un hash simple) para simular
  rol: 'admin' | 'doctor' | 'personal';
  rolId?: number; // Referencia al ID en tabla roles (si es personal)
  medicoId?: number; // Referencia al médico dueño de la clínica (si es personal)
}

export interface Permisos {
  verAgenda: boolean;
  verPacientes: boolean;
  verResumen: boolean;
  verCitas: boolean;
  verExamenes: boolean;
  verSignos: boolean;
  verHistorial: boolean;
  verDiagnosticos: boolean;
  verMedicamentos: boolean;
}

export interface Rol {
  id?: number;
  medicoId: number; // Médico que creó este rol
  nombre: string; // ej. "Enfermera", "Secretaria"
  permisos: Permisos;
}

export interface Paciente {
  id?: number; // Opcional porque Dexie lo auto-genera
  medicoId?: number; // Para multi-tenant
  nombre: string;
  dpi?: string;
  fechaNacimiento: string;
  fechaIngreso: string;
  telefono: string;
  correo?: string;
  direccion?: string;
  nit?: string;
  
  // Datos del responsable
  nombreResponsable?: string;
  parentesco?: string;
  telefonoResponsable?: string;
  ocupacionResponsable?: string;
  estadoCivilPadres?: string;
  notasDinamica?: string;
}

export interface SignosVitales {
  id?: number;
  pacienteId: number;
  fecha: string;
  presionArterial: string;
  frecuenciaCardiaca: number;
  saturacionOxigeno: number;
  temperatura: number;
  peso: number;
  talla: number;
  imc: number;
}

export interface Cita {
  id?: number;
  pacienteId: number;
  medicoId: number;
  fechaHora: string;
  motivo: string;
  estado: 'programada' | 'completada' | 'cancelada';
}

export interface Examen {
  id?: number;
  pacienteId: number;
  medicoId: number;
  tipoExamen: string;
  fechaSolicitud: string;
  estado: 'pendiente' | 'completado';
  resultados?: string;
}

export interface NotaClinica {
  id?: number;
  pacienteId: number;
  medicoId: number;
  fecha: string;
  titulo: string;
  contenido: string;
}

export interface Diagnostico {
  id?: number;
  pacienteId: number;
  medicoId: number;
  fecha: string;
  enfermedad: string;
  planTratamiento: string;
  estado: 'activo' | 'resuelto';
}

export interface Medicamento {
  id?: number;
  pacienteId: number;
  medicoId: number;
  fechaPrescripcion: string;
  nombre: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  indicaciones: string;
  estado: 'activo' | 'suspendido';
}
