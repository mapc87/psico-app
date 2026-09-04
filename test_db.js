import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1]?.trim(), keyMatch[1]?.trim());

async function run() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@clinica.com',
    password: 'admin123'
  });

  if (authError) {
    console.error('Error logging in:', authError.message);
    return;
  }
  
  console.log('Logged in successfully as admin@clinica.com');
  const clinicaId = authData.user.user_metadata.clinica_id || (await supabase.from('usuarios').select('clinica_id').eq('id', authData.user.id).single()).data.clinica_id;
  
  if (!clinicaId) {
    console.error('No clinica_id found for user');
    return;
  }

  console.log('Clinica ID:', clinicaId);

  const paciente = {
    clinica_id: clinicaId,
    nombre: 'Paciente E2E CLI',
    edad: 30,
    telefono: '1234567890',
    email: 'cli@test.com',
    motivo_consulta: 'Prueba de inserciones CLI'
  };

  const { data: pData, error: pError } = await supabase.from('pacientes').insert([paciente]).select().single();
  if (pError) return console.error('Error creando paciente:', pError.message);
  console.log('Paciente creado:', pData.id);

  const cita = {
    clinica_id: clinicaId,
    paciente_id: pData.id,
    fecha_hora: new Date(Date.now() + 86400000).toISOString(),
    duracion: 60,
    tipo: 'Primera Vez',
    estado: 'programada',
    notas: 'Cita autogenerada'
  };

  const { data: cData, error: cError } = await supabase.from('citas').insert([cita]).select().single();
  if (cError) return console.error('Error creando cita:', cError.message);
  console.log('Cita creada:', cData.id);

  console.log('✅ Inserciones exitosas!');
}

run();
