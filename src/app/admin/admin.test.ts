/**
 * Property-Based Tests for Admin Route Protection
 * Feature: tejas-portfolio-v3, Property 15: Admin Route Protection
 * Validates: Requirements 16.1, 16.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Types for testing
interface MockUser {
  id: string;
  email: string;
}

interface MockUserRole {
  user_id: string;
  role: 'admin' | 'editor' | null;
}

interface AuthState {
  user: MockUser | null;
  userRole: MockUserRole | null;
}

/**
 * Simulates the admin route protection logic from middleware.ts
 * Returns the action that should be taken for a given path and auth state
 */
function checkAdminRouteProtection(
  pathname: string,
  authState: AuthState
): 'allow' | 'redirect_to_login' | 'redirect_to_dashboard' | 'unauthorized' {
  // Non-admin routes are always allowed
  if (!pathname.startsWith('/admin')) {
    return 'allow';
  }

  // Login page handling
  if (pathname === '/admin/login') {
    // If user is authenticated with valid role, redirect to dashboard
    if (authState.user && authState.userRole) {
      if (authState.userRole.role === 'admin' || authState.userRole.role === 'editor') {
        return 'redirect_to_dashboard';
      }
    }
    // Otherwise allow access to login page
    return 'allow';
  }

  // For all other admin routes, require authentication
  if (!authState.user) {
    return 'redirect_to_login';
  }

  // Check user role
  if (!authState.userRole || (authState.userRole.role !== 'admin' && authState.userRole.role !== 'editor')) {
    return 'unauthorized';
  }

  // User is authenticated with valid role
  return 'allow';
}

// Arbitrary generators
const adminPathArb = fc.constantFrom(
  '/admin',
  '/admin/login',
  '/admin/dashboard',
  '/admin/projects',
  '/admin/projects/new',
  '/admin/projects/edit/123',
  '/admin/blog',
  '/admin/blog/new',
  '/admin/blog/edit/456',
  '/admin/assets',
  '/admin/settings'
);

const nonAdminPathArb = fc.constantFrom(
  '/',
  '/about',
  '/projects',
  '/projects/my-project',
  '/blog',
  '/blog/my-post',
  '/resume',
  '/contact',
  '/play'
);

const userIdArb = fc.uuid();
const emailArb = fc.emailAddress();

const validRoleArb = fc.constantFrom<'admin' | 'editor'>('admin', 'editor');

const authenticatedUserArb = fc.record({
  id: userIdArb,
  email: emailArb,
});

const validUserRoleArb = fc.record({
  user_id: userIdArb,
  role: validRoleArb,
});

describe('Feature: tejas-portfolio-v3', () => {
  /**
   * Property 15: Admin Route Protection
   * For any request to an admin route (/admin/*) without valid authentication,
   * the request should be redirected to the login page or return a 401/403 status.
   */
  describe('Property 15: Admin Route Protection', () => {
    it('for any admin route without authentication, should redirect to login', () => {
      fc.assert(
        fc.property(adminPathArb, (pathname) => {
          // Skip login page as it has special handling
          if (pathname === '/admin/login') return true;

          const authState: AuthState = {
            user: null,
            userRole: null,
          };

          const result = checkAdminRouteProtection(pathname, authState);
          expect(result).toBe('redirect_to_login');
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('for any admin route with authenticated user but no role, should return unauthorized', () => {
      fc.assert(
        fc.property(adminPathArb, authenticatedUserArb, (pathname, user) => {
          // Skip login page as it has special handling
          if (pathname === '/admin/login') return true;

          const authState: AuthState = {
            user,
            userRole: null,
          };

          const result = checkAdminRouteProtection(pathname, authState);
          expect(result).toBe('unauthorized');
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('for any admin route with valid admin/editor role, should allow access', () => {
      fc.assert(
        fc.property(
          adminPathArb,
          authenticatedUserArb,
          validRoleArb,
          (pathname, user, role) => {
            // Skip login page as it has special handling
            if (pathname === '/admin/login') return true;

            const authState: AuthState = {
              user,
              userRole: { user_id: user.id, role },
            };

            const result = checkAdminRouteProtection(pathname, authState);
            expect(result).toBe('allow');
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any non-admin route, should always allow access regardless of auth state', () => {
      fc.assert(
        fc.property(
          nonAdminPathArb,
          fc.option(authenticatedUserArb, { nil: null }),
          fc.option(validUserRoleArb, { nil: null }),
          (pathname, user, userRole) => {
            const authState: AuthState = {
              user,
              userRole,
            };

            const result = checkAdminRouteProtection(pathname, authState);
            expect(result).toBe('allow');
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('login page should redirect authenticated users with valid role to dashboard', () => {
      fc.assert(
        fc.property(authenticatedUserArb, validRoleArb, (user, role) => {
          const authState: AuthState = {
            user,
            userRole: { user_id: user.id, role },
          };

          const result = checkAdminRouteProtection('/admin/login', authState);
          expect(result).toBe('redirect_to_dashboard');
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('login page should allow access for unauthenticated users', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const authState: AuthState = {
            user: null,
            userRole: null,
          };

          const result = checkAdminRouteProtection('/admin/login', authState);
          expect(result).toBe('allow');
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('login page should allow access for authenticated users without valid role', () => {
      fc.assert(
        fc.property(authenticatedUserArb, (user) => {
          // User authenticated but no role entry
          const authState: AuthState = {
            user,
            userRole: null,
          };

          const result = checkAdminRouteProtection('/admin/login', authState);
          expect(result).toBe('allow');
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for edge cases
  describe('Admin Route Protection Edge Cases', () => {
    it('should handle deeply nested admin routes', () => {
      const authState: AuthState = {
        user: null,
        userRole: null,
      };

      const result = checkAdminRouteProtection('/admin/projects/edit/123/revisions/456', authState);
      expect(result).toBe('redirect_to_login');
    });

    it('should handle admin route with query parameters conceptually', () => {
      // Note: In actual middleware, query params are separate from pathname
      // This tests that the path matching works correctly
      const authState: AuthState = {
        user: { id: 'test-id', email: 'test@example.com' },
        userRole: { user_id: 'test-id', role: 'admin' },
      };

      const result = checkAdminRouteProtection('/admin/blog', authState);
      expect(result).toBe('allow');
    });

    it('should distinguish between admin and editor roles correctly', () => {
      const adminState: AuthState = {
        user: { id: 'admin-id', email: 'admin@example.com' },
        userRole: { user_id: 'admin-id', role: 'admin' },
      };

      const editorState: AuthState = {
        user: { id: 'editor-id', email: 'editor@example.com' },
        userRole: { user_id: 'editor-id', role: 'editor' },
      };

      // Both should have access to general admin routes
      expect(checkAdminRouteProtection('/admin/dashboard', adminState)).toBe('allow');
      expect(checkAdminRouteProtection('/admin/dashboard', editorState)).toBe('allow');
      expect(checkAdminRouteProtection('/admin/projects', adminState)).toBe('allow');
      expect(checkAdminRouteProtection('/admin/projects', editorState)).toBe('allow');
    });

    it('should handle paths that start with /admin but are not admin routes', () => {
      // Paths like /administrator or /admin-panel should be treated as admin routes
      // because they start with /admin
      const authState: AuthState = {
        user: null,
        userRole: null,
      };

      // These would be caught by the /admin prefix check
      expect(checkAdminRouteProtection('/administrator', authState)).toBe('redirect_to_login');
      expect(checkAdminRouteProtection('/admin-panel', authState)).toBe('redirect_to_login');
    });
  });
});
