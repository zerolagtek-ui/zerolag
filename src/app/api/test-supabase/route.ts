import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { autoMigrateSchema } from '@/lib/autoMigrateSchema';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qtjnqymadnifvymimmps.supabase.co';

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          connected: false,
          supabaseUrl,
          error: 'Supabase credentials are missing or unconfigured in environment variables.',
        },
        { status: 500 }
      );
    }

    // Trigger auto-migration & seeding
    const migrationResult = await autoMigrateSchema();

    // Query exact table counts concurrently
    const [productsRes, ordersRes, usersRes] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
    ]);

    const hasErrors = productsRes.error && ordersRes.error && usersRes.error;
    if (hasErrors) {
      const errorMsg =
        productsRes.error?.message || ordersRes.error?.message || usersRes.error?.message || 'Database query error';
      return NextResponse.json(
        {
          connected: false,
          supabaseUrl,
          error: `Supabase connection error: ${errorMsg}`,
        },
        { status: 500 }
      );
    }

    const productsCount = productsRes.error ? 0 : (productsRes.count ?? 0);
    const ordersCount = ordersRes.error ? 0 : (ordersRes.count ?? 0);
    const usersCount = usersRes.error ? 0 : (usersRes.count ?? 0);

    return NextResponse.json({
      connected: true,
      supabaseUrl,
      autoMigration: migrationResult,
      tables: {
        products: productsCount,
        orders: ordersCount,
        users: usersCount,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Supabase connectivity error';
    return NextResponse.json(
      {
        connected: false,
        supabaseUrl,
        error: message,
      },
      { status: 500 }
    );
  }
}
