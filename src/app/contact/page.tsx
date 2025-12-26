import { NavigationWrapper } from '@/components/navigation';
import { BlueprintBackground } from '@/components/background';
import { ContactContent } from '@/components/contact/ContactContent';
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
    title: `Contact | ${siteName}`,
    description: ownerName ? `Get in touch with ${ownerName}.` : 'Get in touch.',
  };
}

export default function ContactPage() {
  return (
    <>
      <BlueprintBackground />
      <NavigationWrapper />
      <main className="lg:ml-[92px] pb-20 lg:pb-0 min-h-screen">
        <ContactContent />
      </main>
    </>
  );
}
