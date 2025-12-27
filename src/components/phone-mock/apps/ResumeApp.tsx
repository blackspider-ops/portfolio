'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface ResumeAppProps {
  onClose: () => void;
}

interface ResumeContent {
  skills?: string[];
  resume_url?: string;
}

export function ResumeApp({ onClose }: ResumeAppProps) {
  const [ownerName, setOwnerName] = useState('');
  const [headline, setHeadline] = useState('');
  const [subhead, setSubhead] = useState('');
  const [resumeContent, setResumeContent] = useState<ResumeContent>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'skills'>('about');

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('site_settings')
          .select('owner_name, hero_headline, hero_subhead, resume_content')
          .single();
        
        if (data) {
          setOwnerName(data.owner_name || '');
          setHeadline(data.hero_headline || '');
          setSubhead(data.hero_subhead || '');
          setResumeContent((data.resume_content as ResumeContent) || {});
        }
      } catch (err) {
        console.error('Error fetching resume data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const skills = resumeContent.skills || [];
  const resumeUrl = resumeContent.resume_url;

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
        <button onClick={onClose} className="text-blue-400 text-sm">
          ← Back
        </button>
        <h1 className="text-white font-semibold">Resume</h1>
        <div className="w-12" />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Profile header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {ownerName.charAt(0) || 'T'}
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">{ownerName || 'Developer'}</h2>
                <p className="text-white/60 text-sm">{headline || 'Software Engineer'}</p>
              </div>
            </div>
            
            {resumeUrl && (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block w-full py-2.5 bg-blue-500 rounded-xl text-white text-center text-sm font-medium"
              >
                Download PDF Resume
              </a>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {(['about', 'skills'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-white/50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'about' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-white/5 rounded-2xl p-4">
                  <h3 className="text-white font-semibold mb-2">About Me</h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {subhead || 'A passionate developer building amazing things.'}
                  </p>
                </div>

                <div className="bg-white/5 rounded-2xl p-4">
                  <h3 className="text-white font-semibold mb-3">Quick Links</h3>
                  <div className="space-y-2">
                    <a
                      href="/resume"
                      target="_blank"
                      className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                    >
                      <span className="text-white/70 text-sm">View Full Resume</span>
                      <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                    <a
                      href="/projects"
                      target="_blank"
                      className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                    >
                      <span className="text-white/70 text-sm">View Projects</span>
                      <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'skills' && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="px-3 py-1.5 bg-white/10 text-white rounded-full text-sm"
                  >
                    {skill}
                  </motion.span>
                ))}
                {skills.length === 0 && (
                  <p className="text-white/50 text-center py-8 w-full">No skills added yet</p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
