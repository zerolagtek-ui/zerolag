import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { INITIAL_PRODUCTS } from '@/lib/productsData';

export async function GET() {
  const startTime = Date.now();
  const report: {
    envCheck: {
      supabaseUrlConfigured: boolean;
      supabaseAnonKeyConfigured: boolean;
      serviceRoleKeyConfigured: boolean;
      urlValue: string;
      isConfigured: boolean;
    };
    productsTable: {
      status: string;
      recordCount: number | null;
      error: string | null;
    };
    ordersTable: {
      status: string;
      recordCount: number | null;
      error: string | null;
      insertTest: string | null;
    };
    fallbackMechanism: {
      active: boolean;
      fallbackProductsCount: number;
    };
    latencyMs: number;
  } = {
    envCheck: {
      supabaseUrlConfigured: false,
      supabaseAnonKeyConfigured: false,
      serviceRoleKeyConfigured: false,
      urlValue: '',
      isConfigured: false,
    },
    productsTable: {
      status: 'pending',
      recordCount: null,
      error: null,
    },
    ordersTable: {
      status: 'pending',
      recordCount: null,
      error: null,
      insertTest: null,
    },
    fallbackMechanism: {
      active: false,
      fallbackProductsCount: INITIAL_PRODUCTS.length,
    },
    latencyMs: 0,
  };

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    report.envCheck = {
      supabaseUrlConfigured: !!url && !url.includes('placeholder'),
      supabaseAnonKeyConfigured: !!anonKey && !anonKey.includes('placeholder'),
      serviceRoleKeyConfigured: !!serviceRoleKey && !serviceRoleKey.includes('placeholder'),
      urlValue: url,
      isConfigured: isSupabaseConfigured(),
    };

    // 1. Test `products` table
    const productsRes = await supabase.from('products').select('*', { count: 'exact' }).limit(10);
    if (productsRes.error) {
      report.productsTable.status = 'ERROR';
      report.productsTable.error = `${productsRes.error.code}: ${productsRes.error.message}`;
      report.fallbackMechanism.active = true;
    } else {
      report.productsTable.status = 'OK';
      report.productsTable.recordCount = productsRes.count ?? productsRes.data.length;
      if ((productsRes.data?.length ?? 0) === 0) {
        report.fallbackMechanism.active = true;
      }
    }

    // 2. Test `orders` table
    const ordersRes = await supabase.from('orders').select('*', { count: 'exact' }).limit(10);
    if (ordersRes.error) {
      report.ordersTable.status = 'ERROR';
      report.ordersTable.error = `${ordersRes.error.code}: ${ordersRes.error.message}`;
    } else {
      report.ordersTable.status = 'OK';
      report.ordersTable.recordCount = ordersRes.count ?? ordersRes.data.length;
    }

    // 3. Test insert permission on orders table with mock order (or test upsert)
    const testOrderId = `DIAG-TEST-${Date.now()}`;
    const testOrderPayload = {
      id: testOrderId,
      customerName: 'Diagnostic Test',
      email: 'test@zerolag.lk',
      phone: '0770000000',
      address: 'Test Address',
      city: 'Colombo',
      postalCode: '00100',
      paymentMethod: 'cod',
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      items: [],
      subtotalLkr: 0,
      discountLkr: 0,
      shippingLkr: 0,
      totalLkr: 0,
      createdAt: new Date().toISOString()
    };

    const insertRes = await supabase.from('orders').insert([testOrderPayload]);
    if (insertRes.error) {
      report.ordersTable.insertTest = `INSERT Failed: ${insertRes.error.code} - ${insertRes.error.message}`;
    } else {
      report.ordersTable.insertTest = 'INSERT Successful';
      // Clean up test order
      await supabase.from('orders').delete().eq('id', testOrderId);
    }

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    report.productsTable.error = errorMsg;
    report.fallbackMechanism.active = true;
  }

  report.latencyMs = Date.now() - startTime;
  return NextResponse.json(report);
}
