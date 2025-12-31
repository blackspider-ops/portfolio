'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useSiteSettings } from '@/lib/hooks/useData';

interface Education {
  institution: string;
  location?: string;
  details?: string;
  degree: string;
  gpa?: string;
  timeline?: string;
}

interface Experience {
  role: string;
  company: string;
  location?: string;
  timeline?: string;
  bullets?: string[];
}

interface Research {
  title: string;
  timeline?: string;
  details?: string;
  bullets?: string[];
}

interface Project {
  title: string;
  timeline?: string;
  bullets?: string[];
}

interface Leadership {
  role: string;
  title: string;
  location?: string;
  timeline?: string;
  details?: string;
}

interface Skills {
  languages?: string[];
  frameworks?: string[];
  ml_ds?: string[];
  platforms_tools?: string[];
  networking_sec?: string[];
}

interface ResumeContentData {
  objective?: string;
  skills?: Skills | string[];
  education?: Education[];
  experience?: Experience[];
  research?: Research[];
  projects?: Project[];
  leadership?: Leadership[];
  awards?: string[];
  sectionConfig?: Record<string, { icon: string; color: string; order: number; visible: boolean }>;
}

async function fetchResumeUrl(): Promise<string | null> {
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

  // Get all skills as flat array
  const getAllSkills = (): string[] => {
    if (!resumeContent?.skills) return [];
    if (Array.isArray(resumeContent.skills)) return resumeContent.skills;
    const s = resumeContent.skills;
    return [
      ...(s.languages || []),
      ...(s.frameworks || []),
      ...(s.ml_ds || []),
      ...(s.platforms_tools || []),
      ...(s.networking_sec || []),
    ];
  };

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
          
          {/* Objective */}
          {resumeContent?.objective && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
                <span className="text-[var(--blue)]">🎯</span>
                Objective
              </h3>
              <p className="text-[var(--muted)]">{resumeContent.objective}</p>
            </div>
          )}

          {/* Skills */}
          {getAllSkills().length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                <span className="text-[var(--blue)]">💻</span>
                Technical Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {getAllSkills().map((skill) => (
                  <span key={skill} className="px-3 py-1.5 text-sm bg-[var(--bg)] text-[var(--text)] rounded-lg border border-[var(--muted)]/20">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resumeContent?.education && resumeContent.education.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                <span className="text-[var(--green)]">🎓</span>
                Education
              </h3>
              <div className="space-y-4">
                {resumeContent.education.map((edu, index) => (
                  <div key={index}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                      <p className="text-[var(--text)] font-medium">{edu.institution}</p>
                      {edu.location && <p className="text-[var(--muted)] text-sm">{edu.location}</p>}
                    </div>
                    {edu.details && <p className="text-[var(--muted)] text-sm">{edu.details}</p>}
                    <p className="text-[var(--muted)] text-sm">{edu.degree}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      {edu.gpa && (
                        <span className="text-[var(--muted)] text-sm">
                          GPA: <span className="text-[var(--text)]">{edu.gpa}</span>
                        </span>
                      )}
                      {edu.timeline && (
                        <span className="text-[var(--muted)] text-sm">
                          Timeline: <span className="text-[var(--text)]">{edu.timeline}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {resumeContent?.experience && resumeContent.experience.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                <span className="text-[var(--orange)]">💼</span>
                Experience
              </h3>
              <div className="space-y-6">
                {resumeContent.experience.map((exp, index) => (
                  <div key={index}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                      <div>
                        <p className="text-[var(--text)] font-medium">{exp.role}</p>
                        <p className="text-[var(--muted)] text-sm italic">{exp.company}</p>
                      </div>
                      <div className="text-right">
                        {exp.timeline && <p className="text-[var(--muted)] text-sm">{exp.timeline}</p>}
                        {exp.location && <p className="text-[var(--muted)] text-sm">{exp.location}</p>}
                      </div>
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {exp.bullets.map((bullet, bIndex) => (
                          <li key={bIndex} className="text-[var(--muted)] text-sm flex gap-2">
                            <span className="text-[var(--muted)]">•</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Research */}
          {resumeContent?.research && resumeContent.research.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                <span className="text-[var(--violet)]">🔬</span>
                Research
              </h3>
              <div className="space-y-6">
                {resumeContent.research.map((res, index) => (
                  <div key={index}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                      <div>
                        <p className="text-[var(--text)] font-medium">{res.title}</p>
                        {res.details && <p className="text-[var(--muted)] text-sm italic">{res.details}</p>}
                      </div>
                      {res.timeline && <p className="text-[var(--muted)] text-sm">{res.timeline}</p>}
                    </div>
                    {res.bullets && res.bullets.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {res.bullets.map((bullet, bIndex) => (
                          <li key={bIndex} className="text-[var(--muted)] text-sm flex gap-2">
                            <span className="text-[var(--muted)]">•</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {resumeContent?.projects && resumeContent.projects.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                <span className="text-[var(--blue)]">📁</span>
                Projects
              </h3>
              <div className="space-y-6">
                {resumeContent.projects.map((proj, index) => (
                  <div key={index}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                      <p className="text-[var(--text)] font-medium">{proj.title}</p>
                      {proj.timeline && <p className="text-[var(--muted)] text-sm">{proj.timeline}</p>}
                    </div>
                    {proj.bullets && proj.bullets.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {proj.bullets.map((bullet, bIndex) => (
                          <li key={bIndex} className="text-[var(--muted)] text-sm flex gap-2">
                            <span className="text-[var(--muted)]">•</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leadership */}
          {resumeContent?.leadership && resumeContent.leadership.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                <span className="text-yellow-500">★</span>
                Leadership
              </h3>
              <div className="space-y-4">
                {resumeContent.leadership.map((lead, index) => (
                  <div key={index}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                      <div>
                        <p className="text-[var(--text)] font-medium">{lead.title}</p>
                        <p className="text-[var(--muted)] text-sm">{lead.role}</p>
                      </div>
                      <div className="text-right">
                        {lead.timeline && <p className="text-[var(--muted)] text-sm">{lead.timeline}</p>}
                        {lead.location && <p className="text-[var(--muted)] text-sm">{lead.location}</p>}
                      </div>
                    </div>
                    {lead.details && (
                      <p className="mt-1 text-[var(--muted)] text-sm">• {lead.details}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Awards */}
          {resumeContent?.awards && resumeContent.awards.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                <span className="text-[var(--green)]">🏆</span>
                Awards
              </h3>
              <div className="flex flex-wrap gap-2">
                {resumeContent.awards.map((award, index) => (
                  <span key={index} className="px-3 py-1.5 text-sm bg-[var(--bg)] text-[var(--text)] rounded-lg border border-[var(--green)]/30">
                    {award}
                  </span>
                ))}
              </div>
            </div>
          )}

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
