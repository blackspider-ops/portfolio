import type { Metadata } from 'next';
import { NavigationWrapper } from '@/components/navigation';
import { BlueprintBackground } from '@/components/background';
import { HomeContent } from '@/components/home/HomeContent';
import { HeroSection } from '@/components/home/HeroSection';
import { createClient } from '@/lib/supabase/server';
import type { SiteSettings } from '@/types/database';

// Fetch settings once for both metadata and page content
async function getSiteSettings() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('site_settings')
    .select('*')
    .single();
  return data as SiteSettings | null;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const siteName = settings?.site_name || 'Portfolio';
  const ownerName = settings?.owner_name || '';
  const heroSubhead = settings?.hero_subhead || '';

  return {
    title: siteName,
    description: heroSubhead || (ownerName ? `${ownerName}'s portfolio - showcasing projects, blog posts, and more.` : 'A developer portfolio showcasing projects, blog posts, and more.'),
  };
}

export default async function Home() {
  // Server-side fetch for hero content (LCP optimization)
  const settings = await getSiteSettings();

  return (
    <>
      <BlueprintBackground />
      <NavigationWrapper />
      <main className="lg:ml-[92px] pb-20 lg:pb-0 min-h-screen">
        {/* Server-rendered hero for fast LCP */}
        <div className="p-6 md:p-8 lg:p-12 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-7 xl:col-span-8">
              <HeroSection
                ownerName={settings?.owner_name}
                headline={settings?.hero_headline}
                subhead={settings?.hero_subhead}
                primaryCtaText={settings?.primary_cta_text}
                secondaryCtaText={settings?.secondary_cta_text}
              />
            </div>
          </div>
        </div>
        {/* Client-side interactive content */}
        <HomeContent initialSettings={settings} />
      </main>
    </>
  );
}
