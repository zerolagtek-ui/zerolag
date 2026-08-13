import { isMongoConfigured } from './mongodb';

export const isSupabaseConfigured = (): boolean => {
  return isMongoConfigured();
};

export const supabase = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null, count: 0 }),
    insert: () => Promise.resolve({ data: null, error: null }),
    upsert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    eq: function() { return this; },
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    single: () => Promise.resolve({ data: null, error: null }),
    limit: function() { return this; },
    order: function() { return this; }
  })
};
