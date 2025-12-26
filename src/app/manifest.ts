import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from('site_settings')
    .select('site_name, owner_name, hero_subhead')
    .single();

  const siteName = settings?.site_name || 'Portfolio';
  const ownerName = settings?.owner_name || '';
  const description = settings?.hero_subhead || 'Personal portfolio and blog';

  return {
    name: siteName,
    short_name: ownerName.split(' ')[0] || 'Portfolio',
    description,
    start_url: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#050505',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    categories: ['portfolio', 'blog', 'technology'],
    lang: 'en',
    dir: 'ltr',
    scope: '/',
    prefer_related_applications: false,
  };
}
