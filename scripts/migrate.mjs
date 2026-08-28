import { readFileSync } from 'fs';
import pg from 'pg';

const SUPABASE_URL = 'https://keomdmxshloecxtfybpc.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtlb21kbXhzaGxvZWN4dGZ5YnBjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzg0NTY3MCwiZXhwIjoyMTAzNDIxNjcwfQ.mudGH1oRjj215f887mT8jwNwnCUCAAKRnGTvRjWec2A';
const ANON_KEY = 'sb_publishable_qFr9AkRkZyMr1eypryigmw_fWWJzEXc';

async function runMigrationViaAPI() {
  // Try creating exec_sql function first via Supabase SQL endpoint
  const sql = readFileSync('supabase/migrations/001_initial_schema.sql', 'utf8');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statements to execute`);
  
  // Use the service role key to create a helper function via PostgREST
  // First, check if tables already exist
  const checkUrl = `${SUPABASE_URL}/rest/v1/products?select=id&limit=1`;
  try {
    const res = await fetch(checkUrl, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
    if (res.ok) {
      console.log('Tables already exist! Migration may already be complete.');
      const data = await res.json();
      console.log('Products table response:', data);
      return true;
    }
    const err = await res.json();
    console.log('Products table check:', err.message || err);
  } catch (e) {
    console.log('Connection check failed:', e.message);
  }
  
  // Try to use the Supabase SQL API
  const sqlUrl = `${SUPABASE_URL}/sql`;
  try {
    const res = await fetch(sqlUrl, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    const data = await res.json();
    if (res.ok) {
      console.log('Migration via SQL API succeeded:', data);
      return true;
    }
    console.log('SQL API response:', res.status, data);
  } catch (e) {
    console.log('SQL API not available:', e.message);
  }
  
  // Try creating exec_sql function and then using it
  const createFuncUrl = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
  const createFuncSql = `
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json AS $$
BEGIN
  EXECUTE query;
  RETURN '{"success": true}'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  try {
    // First try to call it - if it doesn't exist, we need another way
    const res = await fetch(createFuncUrl, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'SELECT 1' }),
    });
    const data = await res.json();
    console.log('exec_sql check:', res.status, data);
  } catch (e) {
    console.log('exec_sql check failed:', e.message);
  }
  
  console.log('\n--- MIGRATION INSTRUCTIONS ---');
  console.log('Could not run migration via API.');
  console.log('Please run the migration manually:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Click "SQL Editor" in the left sidebar');
  console.log(`4. Paste contents of supabase/migrations/001_initial_schema.sql`);
  console.log('5. Click "Run"\n');
  console.log('Alternatively, run:');
  console.log('  npx supabase login');
  console.log('  npx supabase link --project-ref keomdmxshloecxtfybpc');
  console.log('  npx supabase db push');
  
  return false;
}

async function main() {
  console.log('=== DROPCUE Database Migration ===\n');
  const success = await runMigrationViaAPI();
  if (success) {
    console.log('\n✅ Migration complete!');
  } else {
    console.log('\n⚠️  Migration requires manual action (see above)');
  }
}

main().catch(console.error);
