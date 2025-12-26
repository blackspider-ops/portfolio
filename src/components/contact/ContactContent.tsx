'use client';

import { useSiteSettings } from '@/lib/hooks/useData';
import { ContactForm } from './ContactForm';

interface SocialLinks {
  github?: string;
  linkedin?: string;
  email?: string;
  calendly?: string;
}

interface ContactPageContent {
  heading: string;
  subheading: string;
  form_heading: string;
  connect_heading: string;
  response_time_heading: string;
  response_time_text: string;
}

const defaultContent: ContactPageContent = {
  heading: 'Get in Touch',
  subheading: "Have a question, opportunity, or just want to say hi? I'd love to hear from you.",
  form_heading: 'Send a Message',
  connect_heading: 'Other Ways to Connect',
  response_time_heading: 'Response Time',
  response_time_text: 'I typically respond within 24-48 hours. For urgent matters, please mention it in your message.',
};

export function ContactContent() {
  const { data: settings } = useSiteSettings();
  
  const socialLinks = (settings?.social_links as unknown as SocialLinks) || {};
  const content = (settings?.contact_page as unknown as ContactPageContent) || defaultContent;

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-5xl">
      <header className="mb-10">
        <h1 className="font-heading text-4xl md:text-5xl text-[var(--text)] mb-4">
          {content.heading}
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-2xl">
          {content.subheading}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 className="font-heading text-2xl text-[var(--text)] mb-6">
            {content.form_heading}
          </h2>
          <ContactForm />
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="font-heading text-2xl text-[var(--text)] mb-6">
              {content.connect_heading}
            </h2>
            
            <div className="space-y-4">
              {socialLinks.email && (
                <a href={`mailto:${socialLinks.email}`} className="flex items-center gap-4 p-4 bg-[var(--surface)] rounded-lg border border-[var(--muted)]/20 hover:border-[var(--blue)]/50 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-[var(--blue)]/20 flex items-center justify-center">
                    <EmailIcon className="w-5 h-5 text-[var(--blue)]" />
                  </div>
                  <div>
                    <p className="text-[var(--text)] font-medium group-hover:text-[var(--blue)] transition-colors">Email</p>
                    <p className="text-[var(--muted)] text-sm">{socialLinks.email}</p>
                  </div>
                </a>
              )}

              {socialLinks.github && (
                <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-[var(--surface)] rounded-lg border border-[var(--muted)]/20 hover:border-[var(--blue)]/50 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-[var(--muted)]/20 flex items-center justify-center">
                    <GitHubIcon className="w-5 h-5 text-[var(--text)]" />
                  </div>
                  <div>
                    <p className="text-[var(--text)] font-medium group-hover:text-[var(--blue)] transition-colors">GitHub</p>
                    <p className="text-[var(--muted)] text-sm">Check out my code</p>
                  </div>
                </a>
              )}

              {socialLinks.linkedin && (
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-[var(--surface)] rounded-lg border border-[var(--muted)]/20 hover:border-[var(--blue)]/50 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-[#0A66C2]/20 flex items-center justify-center">
                    <LinkedInIcon className="w-5 h-5 text-[#0A66C2]" />
                  </div>
                  <div>
                    <p className="text-[var(--text)] font-medium group-hover:text-[var(--blue)] transition-colors">LinkedIn</p>
                    <p className="text-[var(--muted)] text-sm">Connect professionally</p>
                  </div>
                </a>
              )}

              {socialLinks.calendly && (
                <a href={socialLinks.calendly} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-[var(--surface)] rounded-lg border border-[var(--muted)]/20 hover:border-[var(--blue)]/50 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-[var(--violet)]/20 flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-[var(--violet)]" />
                  </div>
                  <div>
                    <p className="text-[var(--text)] font-medium group-hover:text-[var(--blue)] transition-colors">Schedule a Call</p>
                    <p className="text-[var(--muted)] text-sm">Book time on my calendar</p>
                  </div>
                </a>
              )}

              {!socialLinks.email && !socialLinks.github && !socialLinks.linkedin && !socialLinks.calendly && (
                <p className="text-[var(--muted)]">Social links coming soon. Use the form to get in touch!</p>
              )}
            </div>
          </div>

          <div className="p-6 bg-[var(--surface)] rounded-xl border border-[var(--muted)]/20">
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2 flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-[var(--green)]" />
              {content.response_time_heading}
            </h3>
            <p className="text-[var(--muted)]">{content.response_time_text}</p>
          </div>
        </div>
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

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
