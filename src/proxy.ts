import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  // Create Supabase client with cookie handling
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check for redirect in database (skip for admin routes to avoid unnecessary DB calls)
  if (!pathname.startsWith('/admin')) {
    const { data: redirect } = await supabase
      .from('redirects')
      .select('to_path')
      .eq('from_path', pathname)
      .single();

    if (redirect?.to_path) {
      // Perform 301 permanent redirect
      const url = request.nextUrl.clone();
      url.pathname = redirect.to_path;
      return NextResponse.redirect(url, 301);
    }
  }

  // Admin route protection - block all direct access
  if (pathname.startsWith('/admin')) {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Not authenticated - redirect to home (no login page exposed)
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // Check user role from user_roles table
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'editor')) {
      // User doesn't have required role - redirect to home
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // User is authenticated with proper role - allow access
    // Redirect /admin and /admin/login to dashboard
    if (pathname === '/admin' || pathname === '/admin/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
