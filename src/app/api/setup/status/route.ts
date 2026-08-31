import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

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
