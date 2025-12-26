import { NavigationWrapper } from '@/components/navigation';
import { BlueprintBackground } from '@/components/background';
import { ProjectsContent } from '@/components/projects';
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
    title: `Projects | ${siteName}`,
    description: 'Explore projects and work.',
  };
}

export default function ProjectsPage() {
  return (
    <>
      <BlueprintBackground />
      <NavigationWrapper />
      <main className="lg:ml-[92px] pb-20 lg:pb-0 min-h-screen">
        <div className="p-6 md:p-8 lg:p-12 max-w-7xl">
          <header className="mb-10">
            <h1 className="font-heading text-4xl md:text-5xl text-[var(--text)] mb-4">
              Projects
            </h1>
            <p className="text-[var(--muted)] text-lg max-w-2xl">
              A collection of things I&apos;ve built. Hover over a card to see the tech stack and links.
            </p>
          </header>
          <ProjectsContent />
        </div>
      </main>
    </>
  );
}
