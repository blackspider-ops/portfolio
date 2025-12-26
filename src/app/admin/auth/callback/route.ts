import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo') || '/admin/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user has admin or editor role
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      if (userRole?.role === 'admin' || userRole?.role === 'editor') {
        // User has valid role, redirect to intended destination
        return NextResponse.redirect(`${origin}${redirectTo}`);
      }

      // User doesn't have required role, sign them out and redirect to login
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/admin/login?error=unauthorized`);
    }
  }

  // Auth failed, redirect to login with error
  return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`);
}
