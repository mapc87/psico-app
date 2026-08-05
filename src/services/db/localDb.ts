import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Paciente, SignosVitales, Usuario, Cita, Examen, NotaClinica, Diagnostico, Medicamento, Rol } from '../../types';

export class PsicoAppDatabase extends Dexie {
  usuarios!: Table<Usuario, number>;
  pacientes!: Table<Paciente, number>; // number es el tipo de la primary key (id)
  signosVitales!: Table<SignosVitales, number>;
  citas!: Table<Cita, number>;
  examenes!: Table<Examen, number>;
  notasClinicas!: Table<NotaClinica, number>;
  diagnosticos!: Table<Diagnostico, number>;
  medicamentos!: Table<Medicamento, number>;
  roles!: Table<Rol, number>;

  constructor() {
    super('PsicoAppDB');
    // Definir la estructura (esquema) de la base de datos
    // Solo necesitas indexar los campos por los que vas a buscar/filtrar a menudo.
    this.version(8).stores({
      usuarios: '++id, email, rol, rolId, medicoId',
      pacientes: '++id, medicoId, nombre, dpi, fechaIngreso',
      signosVitales: '++id, pacienteId, fecha',
      citas: '++id, pacienteId, medicoId, fechaHora, estado',
      examenes: '++id, pacienteId, medicoId, fechaSolicitud, estado',
      notasClinicas: '++id, pacienteId, medicoId, fecha',
      diagnosticos: '++id, pacienteId, medicoId, fecha, estado',
      medicamentos: '++id, pacienteId, medicoId, fechaPrescripcion, estado',
      roles: '++id, medicoId, nombre'
    });
  }
}

export const db = new PsicoAppDatabase();
