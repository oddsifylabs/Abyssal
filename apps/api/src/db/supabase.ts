import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error('Missing Supabase environment variables:');
  console.error('  SUPABASE_URL:', url ? 'set' : 'MISSING');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', key ? 'set' : 'MISSING');
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

export const supabase = createClient(url, key);
