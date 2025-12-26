import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from('site_settings')
    .select('site_name')
    .single();

  const siteName = settings?.site_name || 'Portfolio';

  return {
    title: `Arcade | ${siteName}`,
    description: 'Play retro games like Snake, Pong, Tetris, Breakout, and Flappy Bird.',
  };
}

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
