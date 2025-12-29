'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface NavigationItem {
  href: string;
  label: string;
  icon: string;
  enabled: boolean;
}

const CACHE_KEY = 'nav-items-cache';
const DEFAULT_INITIALS = 'TS';

interface CachedData {
  navItems: NavigationItem[];
  ownerInitials: string;
}

// Try to get cached data synchronously
function getCachedData(): CachedData | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Ignore errors
  }
  return null;
}

// Save to cache
function setCachedData(data: CachedData) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore errors
  }
}

export function useNavigationItems() {
  // Initialize from cache if available, otherwise null (loading state)
  const [data, setData] = useState<CachedData | null>(() => getCachedData());
  const [isLoading, setIsLoading] = useState(data === null);

  useEffect(() => {
    // If we already have cached data, don't fetch again
    if (data !== null) return;

    async function fetchNavItems() {
      try {
        const supabase = createClient();
        const { data: dbData } = await supabase
          .from('site_settings')
          .select('navigation_items, owner_initials')
          .single();

        const newData: CachedData = {
          navItems: (dbData?.navigation_items as NavigationItem[]) || [],
          ownerInitials: dbData?.owner_initials || DEFAULT_INITIALS,
        };

        setCachedData(newData);
        setData(newData);
      } catch (error) {
        console.error('Error fetching navigation items:', error);
        // Set empty data on error so we don't keep retrying
        setData({ navItems: [], ownerInitials: DEFAULT_INITIALS });
      } finally {
        setIsLoading(false);
      }
    }

    fetchNavItems();
  }, [data]);

  // Filter to only enabled items
  const enabledItems = data?.navItems.filter(item => item.enabled) || [];

  return { 
    navItems: enabledItems, 
    ownerInitials: data?.ownerInitials || DEFAULT_INITIALS, 
    isLoading 
  };
}
