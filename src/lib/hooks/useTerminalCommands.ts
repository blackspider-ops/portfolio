'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';

export interface CustomCommand {
  id: string;
  name: string;
  description: string;
  usage: string | null;
  category: string;
  output_type: 'text' | 'error' | 'success' | 'ascii' | 'list';
  output_content: string;
  output_items: string[] | null;
  is_enabled: boolean;
}

async function fetchTerminalCommands(): Promise<CustomCommand[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('terminal_commands')
    .select('*')
    .eq('is_enabled', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching terminal commands:', error);
    return [];
  }

  return data || [];
}

export function useTerminalCommands() {
  const { data, error, isLoading } = useSWR(
    'terminal-commands',
    fetchTerminalCommands,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  return {
    commands: data || [],
    isLoading,
    error,
  };
}
