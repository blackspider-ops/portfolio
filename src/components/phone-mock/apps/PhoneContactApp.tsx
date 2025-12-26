'use client';

/**
 * Phone Contact App
 * Requirements: 8.2
 * - Display contact form in phone-friendly format
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface SiteSettings {
  social_links?: {
    github?: string;
    linkedin?: string;
    email?: string;
    calendly?: string;
  };
}

export function PhoneContactApp() {
  const [socialLinks, setSocialLinks] = useState<SiteSettings['social_links']>({});
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const { data: settings } = await supabase
          .from('site_settings')
          .select('social_links')
          .single();

        if (settings?.social_links) {
          setSocialLinks(settings.social_links as SiteSettings['social_links']);
        }
      } catch (err) {
        console.error('Error fetching contact data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
      <h2 className="font-heading text-xl text-[var(--text)] mb-4">Contact</h2>

      {/* Quick contact options */}
      <div className="bg-[var(--surface)] rounded-xl p-4 mb-4 border border-[var(--muted)]/20">
        <h3 className="text-sm font-medium text-[var(--text)] mb-3">Get in Touch</h3>
        <div className="space-y-2">
          {socialLinks?.email && (
            <a
              href={`mailto:${socialLinks.email}`}
              className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--blue)]"
            >
              <EmailIcon className="w-4 h-4" />
              {socialLinks.email}
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
          {socialLinks?.calendly && (
            <a
              href={socialLinks.calendly}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--blue)]"
            >
              <CalendarIcon className="w-4 h-4" />
              Schedule a Call
            </a>
          )}
        </div>
      </div>

      {/* Contact form */}
      <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--muted)]/20">
        <h3 className="text-sm font-medium text-[var(--text)] mb-3">Send a Message</h3>
        
        {submitted ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--green)]/20 flex items-center justify-center">
              <CheckIcon className="w-6 h-6 text-[var(--green)]" />
            </div>
            <p className="text-sm text-[var(--text)]">Message sent!</p>
            <p className="text-xs text-[var(--muted)] mt-1">I&apos;ll get back to you soon.</p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-3 text-xs text-[var(--blue)] hover:underline"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--muted)]/30 rounded-lg text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--blue)]"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--muted)]/30 rounded-lg text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--blue)]"
              />
            </div>
            <div>
              <textarea
                placeholder="Message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={4}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--muted)]/30 rounded-lg text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--blue)] resize-none"
              />
            </div>
            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2 bg-[var(--blue)] text-[var(--bg)] text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
