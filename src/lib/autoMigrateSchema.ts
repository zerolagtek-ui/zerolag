import { supabase, isSupabaseConfigured } from '@/lib/supabase';

let isSchemaMigrated = false;

export async function autoMigrateSchema(): Promise<{ success: boolean; message?: string }> {
  if (isSchemaMigrated) {
    return { success: true, message: 'Schema migration already completed in current server lifecycle.' };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase credentials unconfigured.' };
  }

  try {
    // 1. Probe & Seed default Admin User into public.users (Always verified)
    const adminEmail = 'zerolagtek@gmail.com';
    const { data: existingAdmin, error: checkError } = await supabase
      .from('users')
      .select('id, email, role, is_verified')
      .eq('email', adminEmail)
      .maybeSingle();

    if (checkError) {
      console.warn('[Auto Migration Notice]: Users table query:', checkError.message);
    }

    if (!existingAdmin) {
      const { error: seedError } = await supabase.from('users').upsert([
        {
          email: adminEmail,
          password_hash: 'admin123',
          name: 'ZeroLag Admin',
          role: 'admin',
          is_verified: true
        }
      ], { onConflict: 'email' });

      if (seedError) {
        console.warn('[Auto Migration Notice]: Could not seed default admin user:', seedError.message);
      } else {
        console.log('[Auto Migration]: Successfully seeded default admin user into public.users.');
      }
    } else if (!existingAdmin.is_verified) {
      // Ensure admin is verified
      await supabase.from('users').update({ is_verified: true }).eq('email', adminEmail);
    }

    // 2. Probe public.products table
    const { error: productsError } = await supabase
      .from('products')
      .select('id, warranty')
      .limit(1);

    if (productsError) {
      console.warn('[Auto Migration Notice]: Products table query:', productsError.message);
    }

    // 3. Probe public.reviews table
    const { error: reviewsError } = await supabase
      .from('reviews')
      .select('id')
      .limit(1);

    if (reviewsError) {
      console.warn('[Auto Migration Notice]: Reviews table query:', reviewsError.message);
    }

    isSchemaMigrated = true;
    return { success: true, message: 'Auto-migration completed successfully.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown auto-migration error';
    console.error('[Auto Migration Error]:', msg);
    return { success: false, message: msg };
  }
}
