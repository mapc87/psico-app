export interface Clinica {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  estado: string;
  created_at: string;
}

export interface Usuario {
  id: string;
  clinica_id: string;
  nombre: string;
  email: string;
  rol: 'superadmin' | 'admin' | 'personal';
  rol_id?: string;
  created_at: string;
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
  verFinanzas: boolean;
}

export interface Rol {
  id: string;
  clinica_id: string;
  nombre: string;
  permisos: Permisos;
  created_at: string;
}

export interface Paciente {
  id: string;
  clinica_id: string;
  nombre: string;
  dpi?: string;
  fecha_nacimiento?: string;
  fecha_ingreso: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  nit?: string;
  
  // Datos del responsable
  nombre_responsable?: string;
  parentesco?: string;
  telefono_responsable?: string;
  ocupacion_responsable?: string;
  estado_civil_padres?: string;
  notas_dinamica?: string;
  created_at: string;
}

export interface SignosVitales {
  id: string;
  clinica_id: string;
  paciente_id: string;
  fecha: string;
  presion_arterial?: string;
  frecuencia_cardiaca?: number;
  saturacion_oxigeno?: number;
  temperatura?: number;
  peso?: number;
  talla?: number;
  imc?: number;
  created_at: string;
}

export interface Cita {
  id: string;
  clinica_id: string;
  paciente_id: string;
  medico_id: string;
  fecha_hora: string;
  motivo?: string;
  estado: 'programada' | 'completada' | 'cancelada';
  created_at: string;
}

export interface Examen {
  id: string;
  clinica_id: string;
  paciente_id: string;
  medico_id: string;
  tipo_examen: string;
  fecha_solicitud: string;
  estado: 'pendiente' | 'completado';
  resultados?: string;
  created_at: string;
}

export interface NotaClinica {
  id: string;
  clinica_id: string;
  paciente_id: string;
  medico_id: string;
  fecha: string;
  titulo?: string;
  contenido: string;
  created_at: string;
}

export interface Diagnostico {
  id: string;
  clinica_id: string;
  paciente_id: string;
  medico_id: string;
  fecha: string;
  enfermedad: string;
  plan_tratamiento?: string;
  estado: 'activo' | 'resuelto';
  created_at: string;
}

export interface Medicamento {
  id: string;
  clinica_id: string;
  paciente_id: string;
  medico_id: string;
  fecha_prescripcion: string;
  nombre: string;
  dosis?: string;
  frecuencia?: string;
  duracion?: string;
  indicaciones?: string;
  estado: 'activo' | 'suspendido';
  created_at: string;
}

export interface Factura {
  id: string;
  clinica_id: string;
  paciente_id?: string;
  cita_id?: string;
  monto_total: number;
  saldo_pendiente: number;
  estado: 'pendiente' | 'pagada' | 'parcial' | 'cancelada';
  concepto: string;
  nit?: string;
  nombre_factura?: string;
  direccion?: string;
  numero_factura?: string;
  serie?: string;
  fecha_emision: string;
  fecha_vencimiento?: string;
  created_at: string;
}

export interface Pago {
  id: string;
  factura_id: string;
  clinica_id: string;
  monto: number;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'seguro';
  fecha_pago: string;
  created_at: string;
}

export interface PlantillaDocumento {
  id: string;
  clinica_id: string;
  titulo: string;
  contenido: string;
  created_at: string;
}

export interface ConsentimientoFirmado {
  id: string;
  clinica_id: string;
  paciente_id: string;
  plantilla_id?: string;
  titulo: string;
  contenido_firmado: string;
  firma_data_url: string;
  fecha_firma: string;
  estado: 'pendiente' | 'firmado';
}
