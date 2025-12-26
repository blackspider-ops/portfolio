'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface NavigationItem {
  href: string;
  label: string;
  icon: string;
  enabled: boolean;
}

const DEFAULT_NAV_ITEMS: NavigationItem[] = [
  { href: '/', label: 'Home', icon: 'home', enabled: true },
  { href: '/about', label: 'About', icon: 'about', enabled: true },
  { href: '/projects', label: 'Projects', icon: 'projects', enabled: true },
  { href: '/blog', label: 'Blog', icon: 'blog', enabled: true },
  { href: '/resume', label: 'Resume', icon: 'resume', enabled: true },
  { href: '/contact', label: 'Contact', icon: 'contact', enabled: true },
  { href: '/play', label: 'Arcade', icon: 'arcade', enabled: true },
];

const DEFAULT_INITIALS = 'TS';

export function useNavigationItems() {
  // Start with defaults immediately - no loading state needed for initial render
  const [navItems, setNavItems] = useState<NavigationItem[]>(DEFAULT_NAV_ITEMS);
  const [ownerInitials, setOwnerInitials] = useState(DEFAULT_INITIALS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchNavItems() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('site_settings')
          .select('navigation_items, owner_initials')
          .single();

        if (data?.navigation_items && Array.isArray(data.navigation_items)) {
          setNavItems(data.navigation_items as unknown as NavigationItem[]);
        }
        if (data?.owner_initials) {
          setOwnerInitials(data.owner_initials);
        }
      } catch (error) {
        console.error('Error fetching navigation items:', error);
        // Keep defaults on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchNavItems();
  }, []);

  // Filter to only enabled items
  const enabledItems = navItems.filter(item => item.enabled);

  return { navItems: enabledItems, ownerInitials, isLoading };
}
