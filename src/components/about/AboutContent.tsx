'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { MarkdownRenderer } from '@/components/content';

const supabase = createClient();

async function fetchAboutContent(): Promise<string | null> {
  const { data } = await supabase
    .from('pages')
    .select('body_md')
    .eq('key', 'about')
    .eq('status', 'published')
    .single();
  return data?.body_md || null;
}

export function AboutContent() {
  const { data: content, isLoading } = useSWR('about-content', fetchAboutContent, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 lg:p-12 max-w-4xl">
        <div className="w-8 h-8 border-2 border-[var(--muted)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-4xl">
      {content && <MarkdownRenderer content={content} />}
    </div>
  );
}
