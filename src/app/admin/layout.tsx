'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types/database';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/');
          return;
        }

        // Check user role
        const { data: role } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!role || (role.role !== 'admin' && role.role !== 'editor')) {
          await supabase.auth.signOut();
          router.push('/');
          return;
        }

        setUserRole(role);
      } catch {
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router, supabase]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--muted)] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--surface)] bg-[var(--bg)]/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-2 md:gap-4">
            <a href="/admin/dashboard" className="text-lg md:text-xl font-bold text-[var(--text)]">
              Admin
            </a>
            {userRole && (
              <span className="hidden sm:inline px-2 py-1 text-xs font-medium rounded bg-[var(--surface)] text-[var(--muted)]">
                {userRole.role}
              </span>
            )}
          </div>
          <nav className="flex items-center gap-2 md:gap-4 lg:gap-6 overflow-x-auto">
            <a
              href="/"
              className="text-xs md:text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors whitespace-nowrap"
            >
              ← Home
            </a>
            <AdminNavLink href="/admin/dashboard">Dashboard</AdminNavLink>
            <AdminNavLink href="/admin/pages">Pages</AdminNavLink>
            <AdminNavLink href="/admin/projects">Projects</AdminNavLink>
            <AdminNavLink href="/admin/blog">Blog</AdminNavLink>
            <AdminNavLink href="/admin/assets">Assets</AdminNavLink>
            {userRole?.role === 'admin' && (
              <AdminNavLink href="/admin/messages">Messages</AdminNavLink>
            )}
            {userRole?.role === 'admin' && (
              <AdminNavLink href="/admin/settings">Settings</AdminNavLink>
            )}
            <SignOutButton />
          </nav>
        </div>
      </header>

      {/* Admin Content */}
      <main className="p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}

function AdminNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <a
      href={href}
      className={`text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
        isActive
          ? 'text-[var(--blue)]'
          : 'text-[var(--muted)] hover:text-[var(--text)]'
      }`}
    >
      {children}
    </a>
  );
}

function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);
    await supabase.auth.signOut();
    router.push('/admin/login');
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className="px-3 py-1.5 text-sm font-medium text-[var(--text)] bg-[var(--surface)] rounded hover:bg-[var(--surface)]/80 transition-colors disabled:opacity-50"
    >
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </button>
  );
}
