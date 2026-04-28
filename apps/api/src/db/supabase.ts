import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types.js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient<Database>(url, key);
