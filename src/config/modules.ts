import { LayoutDashboard, Users, Calendar, Wallet, Package, FileSignature, ClipboardList, User, Paperclip, Activity, BrainCircuit, Heart, Pill } from 'lucide-react';
import React from 'react';

export type CategoriaModulo = 'main' | 'contabilidad' | 'expediente';

export interface AppModule {
  id: string;
  label: string;
  path?: string;
  icon?: React.ElementType;
  category: CategoriaModulo;
  isExpedienteTab?: boolean;
}

export const APP_MODULES: AppModule[] = [
  // Menú Principal
  { id: 'verDashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, category: 'main' },
  { id: 'verPacientes', label: 'Pacientes', path: '/pacientes', icon: Users, category: 'main' },
  { id: 'verAgenda', label: 'Agenda', path: '/agenda', icon: Calendar, category: 'main' },
  { id: 'verDocumentos', label: 'Documentos', path: '/consentimientos', icon: FileSignature, category: 'main' },
  { id: 'verGestorPruebas', label: 'Gestor de Pruebas', path: '/pruebas', icon: ClipboardList, category: 'main' },
  
  // Contabilidad y Finanzas
  { id: 'verFinanzas', label: 'Facturación', path: '/finanzas', icon: Wallet, category: 'contabilidad' },
  { id: 'verPaquetes', label: 'Paquetes', path: '/paquetes', icon: Package, category: 'contabilidad' },

  // Pestañas del Expediente Clínico
  { id: 'verResumen', label: 'Resumen', icon: User, category: 'expediente', isExpedienteTab: true },
  { id: 'verArchivos', label: 'Archivos', icon: Paperclip, category: 'expediente', isExpedienteTab: true },
  { id: 'verDiagnosticos', label: 'Diagnósticos', icon: Activity, category: 'expediente', isExpedienteTab: true },
  { id: 'verEvaluaciones', label: 'Evaluaciones', icon: BrainCircuit, category: 'expediente', isExpedienteTab: true },
  { id: 'verTareas', label: 'Tareas', icon: ClipboardList, category: 'expediente', isExpedienteTab: true },
  { id: 'verExamenes', label: 'Exámenes', icon: ClipboardList, category: 'expediente', isExpedienteTab: true },
  { id: 'verSignos', label: 'Signos Vitales', icon: Heart, category: 'expediente', isExpedienteTab: true },
  { id: 'verMedicamentos', label: 'Medicamentos', icon: Pill, category: 'expediente', isExpedienteTab: true }
];
