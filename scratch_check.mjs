import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://glczdjpxefmrnranlcbb.supabase.co';
const supabaseAnonKey = 'sb_publishable_XKLQKmicDPe-P9fCJwbMuA_BTa8e2bk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log("Checking has_users RPC...");
  const { data, error } = await supabase.rpc('check_has_users');
  console.log("Data:", data);
  console.log("Error:", error);
  
  console.log("Checking if there are users in 'usuarios' table...");
  const { data: users, error: usersError } = await supabase.from('usuarios').select('*').limit(1);
  console.log("Users:", users);
  console.log("Users Error:", usersError);
}

check();
