import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Check if Supabase env vars are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClient() {
  // Return a mock client if env vars are missing (for static generation)
  if (!supabaseUrl || !supabaseAnonKey) {
    const mockQueryBuilder = {
      select: () => mockQueryBuilder,
      single: () => Promise.resolve({ data: null, error: null }),
      eq: () => mockQueryBuilder,
      order: () => mockQueryBuilder,
      limit: () => mockQueryBuilder,
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => mockQueryBuilder,
      upsert: () => Promise.resolve({ data: null, error: null }),
      delete: () => mockQueryBuilder,
    };

    return {
      from: () => mockQueryBuilder,
      storage: {
        from: () => ({
          list: () => Promise.resolve({ data: [], error: null }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
          upload: () => Promise.resolve({ data: null, error: null }),
          remove: () => Promise.resolve({ data: null, error: null }),
        }),
      },
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: () => Promise.resolve({ error: null }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      },
    } as unknown as ReturnType<typeof createBrowserClient<Database>>;
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
}
