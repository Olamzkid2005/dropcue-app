import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sqlPath = join(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    return new NextResponse(sql, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    return new NextResponse('Error reading migration file', { status: 500 });
  }
}
