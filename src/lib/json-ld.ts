/**
 * JSON-LD structured data generators for SEO
 * Implements Schema.org vocabulary for rich snippets in search results
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tejassinghal.dev';

export interface PersonSchema {
  name: string;
  jobTitle?: string;
  description?: string;
  image?: string;
  email?: string;
  url?: string;
  sameAs?: string[];
}

export interface BlogPostSchema {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  modifiedAt?: string;
  coverImage?: string;
  tags?: string[];
  readingTime?: number;
  authorName?: string;
}

export interface ProjectSchema {
  title: string;
  description: string;
  slug: string;
  coverImage?: string;
  technologies?: string[];
  url?: string;
  sourceCode?: string;
  authorName?: string;
}

export interface WebsiteSchema {
  siteName?: string;
  description?: string;
  authorName?: string;
}

/**
 * Generate Person schema for the portfolio owner
 */
export function generatePersonJsonLd(person: PersonSchema) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    jobTitle: person.jobTitle,
    description: person.description,
    image: person.image,
    email: person.email ? `mailto:${person.email}` : undefined,
    url: person.url || SITE_URL,
    sameAs: person.sameAs,
  };
}

/**
 * Generate WebSite schema for the portfolio
 */
export function generateWebsiteJsonLd(options?: WebsiteSchema) {
  const siteName = options?.siteName || 'Portfolio';
  const description = options?.description || 'Personal portfolio and blog';
  const authorName = options?.authorName || '';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    description,
    url: SITE_URL,
    ...(authorName && {
      author: {
        '@type': 'Person',
        name: authorName,
      },
    }),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/blog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate BlogPosting schema for individual blog posts
 */
export function generateBlogPostJsonLd(post: BlogPostSchema) {
  const authorName = post.authorName || '';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.coverImage || `${SITE_URL}/api/og?title=${encodeURIComponent(post.title)}&type=blog`,
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.publishedAt,
    dateModified: post.modifiedAt || post.publishedAt,
    ...(authorName && {
      author: {
        '@type': 'Person',
        name: authorName,
        url: SITE_URL,
      },
      publisher: {
        '@type': 'Person',
        name: authorName,
        url: SITE_URL,
      },
    }),
    keywords: post.tags?.join(', '),
    timeRequired: post.readingTime ? `PT${post.readingTime}M` : undefined,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
  };
}

/**
 * Generate SoftwareSourceCode/CreativeWork schema for projects
 */
export function generateProjectJsonLd(project: ProjectSchema) {
  const authorName = project.authorName || '';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: project.title,
    description: project.description,
    image: project.coverImage || `${SITE_URL}/api/og?title=${encodeURIComponent(project.title)}&type=project`,
    url: `${SITE_URL}/projects/${project.slug}`,
    ...(authorName && {
      author: {
        '@type': 'Person',
        name: authorName,
        url: SITE_URL,
      },
    }),
    programmingLanguage: project.technologies,
    codeRepository: project.sourceCode,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/projects/${project.slug}`,
    },
  };
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}
