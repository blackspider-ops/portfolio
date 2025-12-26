import { NavigationWrapper } from '@/components/navigation';
import { BlueprintBackground } from '@/components/background';
import { AboutContent } from '@/components/about/AboutContent';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from('site_settings')
    .select('site_name, owner_name')
    .single();

  const siteName = settings?.site_name || 'Portfolio';
  const ownerName = settings?.owner_name || '';

  return {
    title: `About | ${siteName}`,
    description: ownerName ? `Learn more about ${ownerName}.` : 'Learn more about the portfolio owner.',
  };
}

export default function AboutPage() {
  return (
    <>
      <BlueprintBackground />
      <NavigationWrapper />
      <main className="lg:ml-[92px] pb-20 lg:pb-0 min-h-screen">
        <AboutContent />
      </main>
    </>
  );
}
