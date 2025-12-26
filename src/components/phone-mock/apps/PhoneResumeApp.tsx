'use client';

/**
 * Phone Resume App
 * Requirements: 8.2
 * - Display resume in phone-friendly format
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface SiteSettings {
  social_links?: {
    github?: string;
    linkedin?: string;
    email?: string;
  };
}

export function PhoneResumeApp() {
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<SiteSettings['social_links']>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        
        // Get resume URL from storage
        const { data: files } = await supabase.storage
          .from('resume')
          .list('', { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });

        if (files && files.length > 0) {
          const { data: urlData } = supabase.storage
            .from('resume')
            .getPublicUrl(files[0].name);
          setResumeUrl(urlData.publicUrl);
        }

        // Get social links from site settings
        const { data: settings } = await supabase
          .from('site_settings')
          .select('social_links')
          .single();

        if (settings?.social_links) {
          setSocialLinks(settings.social_links as SiteSettings['social_links']);
        }
      } catch (err) {
        console.error('Error fetching resume data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-8 w-32 bg-[var(--surface)] rounded animate-pulse" />
        <div className="h-64 bg-[var(--surface)] rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="font-heading text-xl text-[var(--text)] mb-4">Resume</h2>

      {/* Quick links */}
      <div className="bg-[var(--surface)] rounded-xl p-4 mb-4 border border-[var(--muted)]/20">
        <h3 className="text-sm font-medium text-[var(--text)] mb-3">Quick Links</h3>
        <div className="space-y-2">
          {socialLinks?.github && (
            <a
              href={socialLinks.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--blue)]"
            >
              <GitHubIcon className="w-4 h-4" />
              GitHub
            </a>
          )}
          {socialLinks?.linkedin && (
            <a
              href={socialLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--blue)]"
            >
              <LinkedInIcon className="w-4 h-4" />
              LinkedIn
            </a>
          )}
          {socialLinks?.email && (
            <a
              href={`mailto:${socialLinks.email}`}
              className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--blue)]"
            >
              <EmailIcon className="w-4 h-4" />
              {socialLinks.email}
            </a>
          )}
        </div>
      </div>

      {/* Resume preview/download */}
      <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--muted)]/20">
        <h3 className="text-sm font-medium text-[var(--text)] mb-3">Resume</h3>
        
        {resumeUrl ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--muted)]">
              View or download my full resume in PDF format.
            </p>
            <div className="flex gap-2">
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-[var(--blue)] text-[var(--bg)] text-sm font-medium rounded-lg text-center hover:opacity-90 transition-opacity"
              >
                View PDF
              </a>
              <a
                href={resumeUrl}
                download
                className="flex-1 px-4 py-2 border border-[var(--muted)] text-[var(--text)] text-sm font-medium rounded-lg text-center hover:border-[var(--text)] transition-colors"
              >
                Download
              </a>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Resume not available at the moment.
          </p>
        )}
      </div>

      {/* Skills summary */}
      <div className="bg-[var(--surface)] rounded-xl p-4 mt-4 border border-[var(--muted)]/20">
        <h3 className="text-sm font-medium text-[var(--text)] mb-3">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {['TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'PostgreSQL', 'AWS', 'Docker'].map((skill) => (
            <span
              key={skill}
              className="px-2 py-1 text-xs bg-[var(--bg)] text-[var(--muted)] rounded"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
