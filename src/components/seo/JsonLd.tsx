'use client';

interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Component to inject JSON-LD structured data into the page
 * Used for SEO rich snippets in search results
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
