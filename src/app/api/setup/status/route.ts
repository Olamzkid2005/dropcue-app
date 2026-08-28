import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  
  const tables = [
    'creators',
    'products',
    'files',
    'orders',
    'payment_events',
    'deliveries',
    'email_deliveries',
    'feedback',
    'audit_logs',
  ];
  
  const status: Record<string, boolean> = {};
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      status[table] = !error;
    } catch {
      status[table] = false;
    }
  }
  
  const allExist = Object.values(status).every(Boolean);
  
  return NextResponse.json({ tables: status, allExist });
}
