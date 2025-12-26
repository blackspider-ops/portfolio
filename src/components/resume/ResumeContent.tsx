'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useSiteSettings } from '@/lib/hooks/useData';
import { createClient } from '@/lib/supabase/client';

interface Education {
  institution: string;
  details: string;
  degree: string;
  customFields?: { key: string; value: string }[];
}

interface Leadership {
  title: string;
  role: string;
  customFields?: { key: string; value: string }[];
}

interface CustomSectionItem {
  title: string;
  role: string;
  customFields?: { key: string; value: string }[];
}

interface CustomSection {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  items: CustomSectionItem[];
}

interface BuiltInSectionConfig {
  icon: string;
  color: string;
  order: number;
  visible: boolean;
}

interface ResumeContentData {
  education: Education[];
  skills: string[];
  experience_note: string;
  leadership: Leadership[];
  customSections?: CustomSection[];
  sectionConfig?: {
    education?: BuiltInSectionConfig;
    skills?: BuiltInSectionConfig;
    experience?: BuiltInSectionConfig;
    leadership?: BuiltInSectionConfig;
  };
}

// Fetch resume URL from assets
async function fetchResumeUrl(): Promise<string | null> {
  // Use the API route to hide Supabase URL
  return '/api/resume';
}

export function ResumeContent() {
  const [isPdfExpanded, setIsPdfExpanded] = useState(false);
  const { data: settings } = useSiteSettings();
  const { data: resumeUrl } = useSWR('resume-url-v2', fetchResumeUrl, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  
  const resumeContent = settings?.resume_content as unknown as ResumeContentData | undefined;

  const education = resumeContent?.education || [];
  const skills = resumeContent?.skills || [];
  const experienceNote = resumeContent?.experience_note || '';
  const leadership = resumeContent?.leadership || [];
  const customSections = resumeContent?.customSections || [];
  
  // Section config with defaults
  const defaultConfig = {
    education: { icon: 'graduation', color: 'violet', order: 0, visible: true },
    skills: { icon: 'code', color: 'blue', order: 1, visible: true },
    experience: { icon: 'briefcase', color: 'green', order: 2, visible: true },
    leadership: { icon: 'star', color: 'violet', order: 3, visible: true },
  };
  const sectionConfig = {
    education: { ...defaultConfig.education, ...resumeContent?.sectionConfig?.education },
    skills: { ...defaultConfig.skills, ...resumeContent?.sectionConfig?.skills },
    experience: { ...defaultConfig.experience, ...resumeContent?.sectionConfig?.experience },
    leadership: { ...defaultConfig.leadership, ...resumeContent?.sectionConfig?.leadership },
  };

  // Don't render if no resume content configured
  if (!resumeContent && !resumeUrl) {
    return (
      <div className="p-6 md:p-8 lg:p-12 max-w-5xl">
        <header className="mb-8">
          <h1 className="font-heading text-4xl md:text-5xl text-[var(--text)] mb-2">Resume</h1>
          <p className="text-[var(--muted)]">Resume content not configured yet.</p>
        </header>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-5xl">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl md:text-5xl text-[var(--text)] mb-2">Resume</h1>
          <p className="text-[var(--muted)]">View or download my resume</p>
        </div>
        {resumeUrl && (
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--blue)] text-[var(--bg)] rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            <DownloadIcon className="w-5 h-5" />
            Download PDF
          </a>
        )}
      </header>

      {/* ATS-Friendly Version */}
      <section>
        <h2 className="font-heading text-2xl text-[var(--text)] mb-6 flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-[var(--blue)]/20 flex items-center justify-center">
            <DocumentIcon className="w-4 h-4 text-[var(--blue)]" />
          </span>
          ATS-Friendly Version
        </h2>
        
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--muted)]/20 p-6 md:p-8 space-y-8">
          {/* Render all sections in unified order */}
          {(() => {
            // Build unified section list
            type UnifiedSection = 
              | { type: 'builtin'; id: 'education' | 'skills' | 'experience' | 'leadership'; order: number }
              | { type: 'custom'; section: CustomSection; order: number };
            
            const allSections: UnifiedSection[] = [
              ...(['education', 'skills', 'experience', 'leadership'] as const).map(id => ({
                type: 'builtin' as const,
                id,
                order: sectionConfig[id].order,
              })),
              ...customSections.map(section => ({
                type: 'custom' as const,
                section,
                order: section.order ?? 100,
              })),
            ].sort((a, b) => a.order - b.order);

            return allSections.map((item) => {
              if (item.type === 'builtin') {
                const sectionKey = item.id;
                
                if (sectionKey === 'education' && education.length > 0) {
                  return (
                    <div key={sectionKey}>
                      <h3 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                        <SectionIcon icon={sectionConfig.education.icon} color={sectionConfig.education.color} />
                        Education
                      </h3>
                      <div className="space-y-4">
                        {education.map((edu, index) => (
                          <div key={index}>
                            <p className="text-[var(--text)] font-medium">{edu.institution}</p>
                            {edu.details && <p className="text-[var(--muted)] text-sm">{edu.details}</p>}
                            <p className="text-[var(--muted)] text-sm">{edu.degree}</p>
                            {edu.customFields && edu.customFields.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                {edu.customFields.map((field, fieldIndex) => (
                                  field.key && field.value && (
                                    <span key={fieldIndex} className="text-[var(--muted)] text-sm">
                                      {field.key}: <span className="text-[var(--text)]">{field.value}</span>
                                    </span>
                                  )
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                
                if (sectionKey === 'skills' && skills.length > 0) {
                  return (
                    <div key={sectionKey}>
                      <h3 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                        <SectionIcon icon={sectionConfig.skills.icon} color={sectionConfig.skills.color} />
                        Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <span key={skill} className="px-3 py-1.5 text-sm bg-[var(--bg)] text-[var(--text)] rounded-lg border border-[var(--muted)]/20">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                }
                
                if (sectionKey === 'experience' && experienceNote) {
                  return (
                    <div key={sectionKey}>
                      <h3 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                        <SectionIcon icon={sectionConfig.experience.icon} color={sectionConfig.experience.color} />
                        Experience
                      </h3>
                      <p className="text-[var(--muted)] text-sm">{experienceNote}</p>
                    </div>
                  );
                }
                
                if (sectionKey === 'leadership' && leadership.length > 0) {
                  return (
                    <div key={sectionKey}>
                      <h3 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                        <SectionIcon icon={sectionConfig.leadership.icon} color={sectionConfig.leadership.color} />
                        Leadership
                      </h3>
                      <div className="space-y-3">
                        {leadership.map((lead, index) => (
                          <div key={index}>
                            <p className="text-[var(--text)] font-medium">{lead.title}</p>
                            <p className="text-[var(--muted)] text-sm">{lead.role}</p>
                            {lead.customFields && lead.customFields.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                {lead.customFields.map((field, fieldIndex) => (
                                  field.key && field.value && (
                                    <span key={fieldIndex} className="text-[var(--muted)] text-sm">
                                      {field.key}: <span className="text-[var(--text)]">{field.value}</span>
                                    </span>
                                  )
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                
                return null;
              } else {
                // Custom section
                const section = item.section;
                if (!section.name || section.items.length === 0) return null;
                
                return (
                  <div key={section.id}>
                    <h3 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                      <SectionIcon icon={section.icon || 'list'} color={section.color || 'blue'} />
                      {section.name}
                    </h3>
                    <div className="space-y-3">
                      {section.items.map((sectionItem, index) => (
                        <div key={index}>
                          <p className="text-[var(--text)] font-medium">{sectionItem.title}</p>
                          <p className="text-[var(--muted)] text-sm">{sectionItem.role}</p>
                          {sectionItem.customFields && sectionItem.customFields.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                              {sectionItem.customFields.map((field, fieldIndex) => (
                                field.key && field.value && (
                                  <span key={fieldIndex} className="text-[var(--muted)] text-sm">
                                    {field.key}: <span className="text-[var(--text)]">{field.value}</span>
                                  </span>
                                )
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            });
          })()}
        </div>
      </section>

      {/* PDF Embed */}
      {resumeUrl && (
        <section className="mt-12">
          <button
            onClick={() => setIsPdfExpanded(!isPdfExpanded)}
            className="w-full flex items-center justify-between p-4 bg-[var(--surface)] rounded-xl border border-[var(--muted)]/20 hover:border-[var(--muted)]/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[var(--violet)]/20 flex items-center justify-center">
                <DocumentIcon className="w-4 h-4 text-[var(--violet)]" />
              </span>
              <span className="font-heading text-xl text-[var(--text)]">Full Resume PDF</span>
            </div>
            <ChevronIcon className={`w-5 h-5 text-[var(--muted)] transition-transform ${isPdfExpanded ? 'rotate-180' : ''}`} />
          </button>
          
          {isPdfExpanded && (
            <div className="mt-4 bg-[var(--surface)] rounded-xl border border-[var(--muted)]/20 overflow-hidden">
              <iframe
                src={`${resumeUrl}#view=FitH`}
                className="w-full h-[80vh] min-h-[600px]"
                title="Resume PDF"
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function GraduationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

const ICON_MAP: Record<string, string> = {
  list: '☰',
  star: '★',
  book: '📖',
  trophy: '🏆',
  briefcase: '💼',
  graduation: '🎓',
  code: '💻',
  research: '🔬',
  certificate: '📜',
  globe: '🌐',
  heart: '❤️',
  lightning: '⚡',
};

const COLOR_MAP: Record<string, string> = {
  blue: 'text-[var(--blue)]',
  violet: 'text-[var(--violet)]',
  green: 'text-[var(--green)]',
  orange: 'text-orange-500',
  red: 'text-red-500',
  pink: 'text-pink-500',
  cyan: 'text-cyan-500',
  yellow: 'text-yellow-500',
};

function SectionIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <span className={`w-5 h-5 flex items-center justify-center ${COLOR_MAP[color] || COLOR_MAP.blue}`}>
      {ICON_MAP[icon] || ICON_MAP.list}
    </span>
  );
}
