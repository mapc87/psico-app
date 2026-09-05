import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1]?.trim(), keyMatch[1]?.trim());

async function run() {
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'admin@clinica.com',
    password: 'admin123'
  });
  
  const { data, error } = await supabase
    .from('clinicas')
    .insert({ nombre: 'Test API' })
    .select();
    
  console.log("Insert result:", data, error);
}
run();
