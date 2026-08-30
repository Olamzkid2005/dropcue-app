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
  
  // Check all tables in parallel (was 9 sequential round-trips)
  const entries = await Promise.all(
    tables.map(async (table): Promise<readonly [string, boolean]> => {
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        return [table, !error] as const;
      } catch {
        return [table, false] as const;
      }
    })
  );

  const status: Record<string, boolean> = Object.fromEntries(entries);
  
  const allExist = Object.values(status).every(Boolean);
  
  return NextResponse.json({ tables: status, allExist });
}
