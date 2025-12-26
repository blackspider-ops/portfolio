import { NavigationWrapper } from '@/components/navigation';
import { BlueprintBackground } from '@/components/background';
import { BlogContent } from '@/components/blog';
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
    title: `Blog | ${siteName}`,
    description: 'Technical writing, tutorials, and thoughts on building software.',
  };
}

export default function BlogPage() {
  return (
    <>
      <BlueprintBackground />
      <NavigationWrapper />
      <main className="lg:ml-[92px] pb-20 lg:pb-0 min-h-screen">
        <div className="p-6 md:p-8 lg:p-12 max-w-7xl">
          <header className="mb-10">
            <h1 className="font-heading text-4xl md:text-5xl text-[var(--text)] mb-4">
              Blog
            </h1>
            <p className="text-[var(--muted)] text-lg max-w-2xl">
              Technical writing, tutorials, and thoughts on building software.
            </p>
          </header>
          <BlogContent />
        </div>
      </main>
    </>
  );
}
