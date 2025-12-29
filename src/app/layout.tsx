import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { inter, jetbrainsMono, fraunces } from '@/lib/fonts';
import { ThemeProvider, SWRProvider, DataPreloader, ServiceWorkerProvider } from '@/components/providers';
import { PhoneMockProvider } from '@/components/phone-mock';
import { KonamiCodeProvider } from '@/components/easter-eggs';
import { CommandPaletteProvider } from '@/components/command-palette';
import { TerminalProvider } from '@/components/terminal';
import { FeatureTogglesProvider } from '@/lib/hooks/useFeatureToggles';
import { JsonLd } from '@/components/seo';
import { generatePersonJsonLd, generateWebsiteJsonLd } from '@/lib/json-ld';
import { createClient } from '@/lib/supabase/server';
import '@/styles/globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tejassinghal.dev';

export async function generateMetadata(): Promise<Metadata> {
  // Fetch site settings for dynamic metadata
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from('site_settings')
    .select('site_name, hero_subhead, social_links')
    .single();

  const siteName = settings?.site_name || 'Portfolio';
  const description = settings?.hero_subhead || '';
  const title = `${siteName}`;

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    icons: {
      icon: '/icon.svg',
      apple: '/icon.svg',
    },
    alternates: {
      canonical: '/',
      types: {
        'application/rss+xml': '/rss.xml',
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: SITE_URL,
      siteName: `${siteName}`,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

async function getJsonLdData() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from('site_settings')
    .select('owner_name, hero_subhead, social_links, site_name')
    .single();

  const socialLinks = settings?.social_links as { github?: string; linkedin?: string } | null;
  const sameAs: string[] = [];
  if (socialLinks?.github) sameAs.push(socialLinks.github);
  if (socialLinks?.linkedin) sameAs.push(socialLinks.linkedin);

  const personJsonLd = generatePersonJsonLd({
    name: settings?.owner_name || '',
    jobTitle: 'Software Engineer',
    description: settings?.hero_subhead || '',
    url: SITE_URL,
    sameAs,
  });

  const websiteJsonLd = generateWebsiteJsonLd({
    siteName: settings?.site_name || 'Portfolio',
    description: settings?.hero_subhead || '',
    authorName: settings?.owner_name || '',
  });

  return { personJsonLd, websiteJsonLd };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { personJsonLd, websiteJsonLd } = await getJsonLdData();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://xplifhqnkmofhmrwkejf.supabase.co" />
        <link rel="dns-prefetch" href="https://xplifhqnkmofhmrwkejf.supabase.co" />
        <link rel="preconnect" href="https://api.github.com" />
        <link rel="dns-prefetch" href="https://api.github.com" />
        {/* Preconnect to Google Fonts for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <JsonLd data={personJsonLd} />
        <JsonLd data={websiteJsonLd} />
      </head>
      <body>
        <SWRProvider>
            <DataPreloader />
            <FeatureTogglesProvider>
              <ThemeProvider>
                <KonamiCodeProvider>
                  <CommandPaletteProvider>
                    <TerminalProvider>
                      <PhoneMockProvider>
                        {children}
                      </PhoneMockProvider>
                    </TerminalProvider>
                  </CommandPaletteProvider>
                </KonamiCodeProvider>
              </ThemeProvider>
            </FeatureTogglesProvider>
          </SWRProvider>
        <Analytics />
        <ServiceWorkerProvider>{null}</ServiceWorkerProvider>
      </body>
    </html>
  );
}
