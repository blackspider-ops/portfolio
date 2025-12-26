import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Check if Supabase env vars are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClient() {
  // Return a mock client if env vars are missing (for static generation)
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      from: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
            order: () => ({
              limit: () => ({
                single: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          }),
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
      storage: {
        from: () => ({
          list: () => Promise.resolve({ data: [], error: null }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
    } as unknown as ReturnType<typeof createBrowserClient<Database>>;
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
}
