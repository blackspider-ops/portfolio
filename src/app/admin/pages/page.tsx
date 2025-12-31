'use client';

import { useEffect, useState, useCallback, useRef, Component, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { revalidateContent, revalidateAllContent } from '@/app/admin/actions/revalidate';
import type { Page } from '@/types/database';

type NowPanelItem = string;
type SocialLinks = {
  github?: string;
  linkedin?: string;
  email?: string;
  calendly?: string;
};

type Education = {
  institution: string;
  location?: string;
  details?: string;
  degree: string;
  gpa?: string;
  timeline?: string;
  customFields?: { key: string; value: string }[];
};

type Experience = {
  role: string;
  company: string;
  location?: string;
  timeline?: string;
  bullets?: string[];
};

type Research = {
  title: string;
  timeline?: string;
  details?: string;
  bullets?: string[];
};

type Project = {
  title: string;
  timeline?: string;
  bullets?: string[];
};

type Leadership = {
  title: string;
  role: string;
  location?: string;
  timeline?: string;
  details?: string;
  customFields?: { key: string; value: string }[];
};

type CustomSectionItem = {
  title: string;
  role: string;
  customFields?: { key: string; value: string }[];
};

type CustomSection = {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  items: CustomSectionItem[];
};

type BuiltInSectionConfig = {
  icon: string;
  color: string;
  order: number;
  visible: boolean;
};

type ResumeContent = {
  objective?: string;
  education: Education[];
  skills: string[];
  experience: Experience[];
  research: Research[];
  projects: Project[];
  leadership: Leadership[];
  awards: string[];
  customSections?: CustomSection[];
  sectionConfig?: {
    objective?: BuiltInSectionConfig;
    education?: BuiltInSectionConfig;
    skills?: BuiltInSectionConfig;
    experience?: BuiltInSectionConfig;
    leadership?: BuiltInSectionConfig;
    research?: BuiltInSectionConfig;
    projects?: BuiltInSectionConfig;
    awards?: BuiltInSectionConfig;
  };
};

type ContactPage = {
  heading: string;
  subheading: string;
  form_heading: string;
  connect_heading: string;
  response_time_heading: string;
  response_time_text: string;
};

type SignalBadge = {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
};

export default function AdminPagesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'resume' | 'contact'>('home');

  // Home page settings
  const [heroHeadline, setHeroHeadline] = useState('');
  const [heroSubhead, setHeroSubhead] = useState('');
  const [primaryCtaText, setPrimaryCtaText] = useState('');
  const [primaryCtaAction, setPrimaryCtaAction] = useState<'phone_mock' | 'terminal' | 'link'>('phone_mock');
  const [primaryCtaLink, setPrimaryCtaLink] = useState('');
  const [secondaryCtaText, setSecondaryCtaText] = useState('');
  const [secondaryCtaAction, setSecondaryCtaAction] = useState<'phone_mock' | 'terminal' | 'link'>('phone_mock');
  const [secondaryCtaLink, setSecondaryCtaLink] = useState('');
  const [nowPanelItems, setNowPanelItems] = useState<NowPanelItem[]>([]);
  const [nowPanelInput, setNowPanelInput] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [signalsBadges, setSignalsBadges] = useState<SignalBadge[]>([]);

  // About page content
  const [aboutContent, setAboutContent] = useState('');
  const [aboutPageId, setAboutPageId] = useState<string | null>(null);

  // Resume page content
  const [resumeContent, setResumeContent] = useState<ResumeContent>({
    objective: '',
    education: [],
    skills: [],
    experience: [],
    research: [],
    projects: [],
    leadership: [],
    awards: [],
  });
  const [newSkill, setNewSkill] = useState('');
  const [newAward, setNewAward] = useState('');

  // Contact page content
  const [contactPage, setContactPage] = useState<ContactPage>({
    heading: '',
    subheading: '',
    form_heading: '',
    connect_heading: '',
    response_time_heading: '',
    response_time_text: '',
  });

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch site settings
      const { data: settings, error: settingsError } = await supabase
        .from('site_settings')
        .select('*')
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      if (settings) {
        setHeroHeadline(settings.hero_headline);
        setHeroSubhead(settings.hero_subhead);
        setPrimaryCtaText(settings.primary_cta_text);
        setSecondaryCtaText(settings.secondary_cta_text);
        
        // CTA actions
        const ctaConfig = (settings as Record<string, unknown>).cta_config as {
          primary_action?: string;
          primary_link?: string;
          secondary_action?: string;
          secondary_link?: string;
        } | null;
        if (ctaConfig) {
          setPrimaryCtaAction((ctaConfig.primary_action as 'phone_mock' | 'terminal' | 'link') || 'phone_mock');
          setPrimaryCtaLink(ctaConfig.primary_link || '');
          setSecondaryCtaAction((ctaConfig.secondary_action as 'phone_mock' | 'terminal' | 'link') || 'phone_mock');
          setSecondaryCtaLink(ctaConfig.secondary_link || '');
        }
        
        setNowPanelItems((settings.now_panel_items as NowPanelItem[]) || []);
        setSocialLinks((settings.social_links as SocialLinks) || {});
        
        // Signals badges
        const signals = (settings as Record<string, unknown>).signals_badges as SignalBadge[] | null;
        if (signals && Array.isArray(signals)) {
          setSignalsBadges(signals);
        }
        
        // Resume content - ensure all required fields have defaults
        const resume = settings.resume_content as Partial<ResumeContent & { skills?: string[] | { languages?: string[]; frameworks?: string[]; ml_ds?: string[]; platforms_tools?: string[]; networking_sec?: string[] } }> | null;
        if (resume) {
          // Handle skills - can be array or categorized object
          let flatSkills: string[] = [];
          if (resume.skills) {
            if (Array.isArray(resume.skills)) {
              flatSkills = resume.skills;
            } else if (typeof resume.skills === 'object') {
              const s = resume.skills as { languages?: string[]; frameworks?: string[]; ml_ds?: string[]; platforms_tools?: string[]; networking_sec?: string[] };
              flatSkills = [
                ...(s.languages || []),
                ...(s.frameworks || []),
                ...(s.ml_ds || []),
                ...(s.platforms_tools || []),
                ...(s.networking_sec || []),
              ];
            }
          }
          
          setResumeContent({
            objective: resume.objective || '',
            education: Array.isArray(resume.education) ? resume.education : [],
            skills: flatSkills,
            experience: Array.isArray(resume.experience) ? resume.experience : [],
            research: Array.isArray(resume.research) ? resume.research : [],
            projects: Array.isArray(resume.projects) ? resume.projects : [],
            leadership: Array.isArray(resume.leadership) ? resume.leadership : [],
            awards: Array.isArray(resume.awards) ? resume.awards : [],
            customSections: Array.isArray(resume.customSections) ? resume.customSections : [],
            sectionConfig: resume.sectionConfig || undefined,
          });
        }
        
        // Contact page content
        const contact = settings.contact_page as ContactPage | null;
        if (contact) {
          setContactPage(contact);
        }
      }

      // Fetch about page
      const { data: aboutPage, error: aboutError } = await supabase
        .from('pages')
        .select('*')
        .eq('key', 'about')
        .single();

      if (aboutError && aboutError.code !== 'PGRST116') {
        throw aboutError;
      }

      if (aboutPage) {
        setAboutContent(aboutPage.body_md);
        setAboutPageId(aboutPage.id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load page data');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveHome = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    setError(null);

    try {
      const { error: upsertError } = await supabase
        .from('site_settings')
        .upsert({
          id: '00000000-0000-0000-0000-000000000001',
          hero_headline: heroHeadline,
          hero_subhead: heroSubhead,
          primary_cta_text: primaryCtaText,
          secondary_cta_text: secondaryCtaText,
          cta_config: {
            primary_action: primaryCtaAction,
            primary_link: primaryCtaLink,
            secondary_action: secondaryCtaAction,
            secondary_link: secondaryCtaLink,
          },
          now_panel_items: nowPanelItems,
          social_links: socialLinks,
          signals_badges: signalsBadges,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) {
        console.error('Supabase upsert error:', upsertError);
        throw new Error(upsertError.message || 'Database error');
      }

      await revalidateAllContent();

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error saving home settings:', errorMessage);
      setError(`Failed to save: ${errorMessage}`);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAbout = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    setError(null);

    try {
      if (aboutPageId) {
        const { error: updateError } = await supabase
          .from('pages')
          .update({
            body_md: aboutContent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', aboutPageId);

        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase
          .from('pages')
          .insert({
            key: 'about',
            body_md: aboutContent,
            status: 'published',
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setAboutPageId(data.id);
      }

      await revalidateContent('page', 'about');

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Error saving about page:', err);
      setError('Failed to save about page');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveResume = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('site_settings')
        .update({
          resume_content: resumeContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', '00000000-0000-0000-0000-000000000001');

      if (updateError) throw updateError;

      await revalidateContent('page', 'resume');

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Error saving resume:', err);
      setError('Failed to save resume content');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveContact = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('site_settings')
        .update({
          contact_page: contactPage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', '00000000-0000-0000-0000-000000000001');

      if (updateError) throw updateError;

      await revalidateContent('page', 'contact');

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Error saving contact page:', err);
      setError('Failed to save contact page');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const addNowPanelItem = () => {
    if (nowPanelInput.trim()) {
      setNowPanelItems([...nowPanelItems, nowPanelInput.trim()]);
      setNowPanelInput('');
    }
  };

  const removeNowPanelItem = (index: number) => {
    setNowPanelItems(nowPanelItems.filter((_, i) => i !== index));
  };

  // Section config helpers
  const defaultSectionConfig = {
    objective: { icon: 'star', color: 'blue', order: 0, visible: true },
    skills: { icon: 'code', color: 'blue', order: 1, visible: true },
    education: { icon: 'graduation', color: 'green', order: 2, visible: true },
    experience: { icon: 'briefcase', color: 'orange', order: 3, visible: true },
    research: { icon: 'research', color: 'violet', order: 4, visible: true },
    projects: { icon: 'code', color: 'blue', order: 5, visible: true },
    leadership: { icon: 'star', color: 'yellow', order: 6, visible: true },
    awards: { icon: 'trophy', color: 'green', order: 7, visible: true },
  };

  type SectionKey = 'objective' | 'skills' | 'education' | 'experience' | 'research' | 'projects' | 'leadership' | 'awards';

  const getSectionConfig = (section: SectionKey) => {
    return resumeContent.sectionConfig?.[section as keyof typeof resumeContent.sectionConfig] || defaultSectionConfig[section];
  };

  const updateSectionConfig = (section: SectionKey, updates: Partial<BuiltInSectionConfig>) => {
    const currentConfig = resumeContent.sectionConfig || {};
    const sectionCurrent = currentConfig[section as keyof typeof currentConfig] || defaultSectionConfig[section];
    setResumeContent({
      ...resumeContent,
      sectionConfig: {
        ...currentConfig,
        [section]: { ...sectionCurrent, ...updates },
      },
    });
  };

  // Unified section ordering
  type UnifiedSection = {
    type: 'builtin' | 'custom';
    id: string;
    name: string;
    order: number;
    icon: string;
  };

  const getAllSectionsSorted = (): UnifiedSection[] => {
    const builtInKeys: SectionKey[] = ['objective', 'skills', 'education', 'experience', 'research', 'projects', 'leadership', 'awards'];
    const builtIn: UnifiedSection[] = builtInKeys.map(key => ({
      type: 'builtin',
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      order: getSectionConfig(key).order,
      icon: getSectionConfig(key).icon,
    }));
    
    const custom: UnifiedSection[] = (resumeContent.customSections || []).map((section) => ({
      type: 'custom',
      id: section.id,
      name: section.name || 'Untitled',
      order: section.order ?? 100,
      icon: section.icon || 'list',
    }));
    
    return [...builtIn, ...custom].sort((a, b) => a.order - b.order);
  };

  const swapSectionOrder = (index1: number, index2: number) => {
    const sections = getAllSectionsSorted();
    if (index1 < 0 || index2 < 0 || index1 >= sections.length || index2 >= sections.length) return;
    
    const section1 = sections[index1];
    const section2 = sections[index2];
    const order1 = section1.order;
    const order2 = section2.order;
    
    // Build updates
    const configUpdates: Partial<Record<SectionKey, Partial<BuiltInSectionConfig>>> = {};
    const customUpdates: Record<string, number> = {};
    
    if (section1.type === 'builtin') {
      configUpdates[section1.id as SectionKey] = { order: order2 };
    } else {
      customUpdates[section1.id] = order2;
    }
    
    if (section2.type === 'builtin') {
      configUpdates[section2.id as SectionKey] = { order: order1 };
    } else {
      customUpdates[section2.id] = order1;
    }
    
    // Apply all updates in one setState
    setResumeContent(prev => {
      const newSectionConfig = { ...prev.sectionConfig };
      for (const [key, updates] of Object.entries(configUpdates)) {
        const sectionKey = key as SectionKey;
        newSectionConfig[sectionKey] = { 
          ...(newSectionConfig[sectionKey] || defaultSectionConfig[sectionKey]), 
          ...updates 
        };
      }
      
      const newCustomSections = (prev.customSections || []).map(s => 
        customUpdates[s.id] !== undefined ? { ...s, order: customUpdates[s.id] } : s
      );
      
      return {
        ...prev,
        sectionConfig: newSectionConfig,
        customSections: newCustomSections,
      };
    });
  };

  // Resume helpers
  const addSkill = () => {
    if (newSkill.trim() && !resumeContent.skills.includes(newSkill.trim())) {
      setResumeContent({
        ...resumeContent,
        skills: [...resumeContent.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setResumeContent({
      ...resumeContent,
      skills: resumeContent.skills.filter((_, i) => i !== index),
    });
  };

  const addEducation = () => {
    setResumeContent({
      ...resumeContent,
      education: [...resumeContent.education, { institution: '', details: '', degree: '' }],
    });
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...resumeContent.education];
    updated[index] = { ...updated[index], [field]: value };
    setResumeContent({ ...resumeContent, education: updated });
  };

  const removeEducation = (index: number) => {
    setResumeContent({
      ...resumeContent,
      education: resumeContent.education.filter((_, i) => i !== index),
    });
  };

  const addLeadership = () => {
    setResumeContent({
      ...resumeContent,
      leadership: [...resumeContent.leadership, { title: '', role: '' }],
    });
  };

  const updateLeadership = (index: number, field: keyof Leadership, value: string) => {
    const updated = [...resumeContent.leadership];
    updated[index] = { ...updated[index], [field]: value };
    setResumeContent({ ...resumeContent, leadership: updated });
  };

  const removeLeadership = (index: number) => {
    setResumeContent({
      ...resumeContent,
      leadership: resumeContent.leadership.filter((_, i) => i !== index),
    });
  };

  // Experience helpers
  const addExperience = () => {
    setResumeContent({
      ...resumeContent,
      experience: [...resumeContent.experience, { role: '', company: '', location: '', timeline: '', bullets: [] }],
    });
  };

  const updateExperience = (index: number, field: keyof Experience, value: string | string[]) => {
    const updated = [...resumeContent.experience];
    updated[index] = { ...updated[index], [field]: value };
    setResumeContent({ ...resumeContent, experience: updated });
  };

  const removeExperience = (index: number) => {
    setResumeContent({
      ...resumeContent,
      experience: resumeContent.experience.filter((_, i) => i !== index),
    });
  };

  const addExperienceBullet = (expIndex: number) => {
    const updated = [...resumeContent.experience];
    const bullets = updated[expIndex].bullets || [];
    updated[expIndex] = { ...updated[expIndex], bullets: [...bullets, ''] };
    setResumeContent({ ...resumeContent, experience: updated });
  };

  const updateExperienceBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const updated = [...resumeContent.experience];
    const bullets = [...(updated[expIndex].bullets || [])];
    bullets[bulletIndex] = value;
    updated[expIndex] = { ...updated[expIndex], bullets };
    setResumeContent({ ...resumeContent, experience: updated });
  };

  const removeExperienceBullet = (expIndex: number, bulletIndex: number) => {
    const updated = [...resumeContent.experience];
    const bullets = (updated[expIndex].bullets || []).filter((_, i) => i !== bulletIndex);
    updated[expIndex] = { ...updated[expIndex], bullets };
    setResumeContent({ ...resumeContent, experience: updated });
  };

  // Research helpers
  const addResearch = () => {
    setResumeContent({
      ...resumeContent,
      research: [...resumeContent.research, { title: '', timeline: '', details: '', bullets: [] }],
    });
  };

  const updateResearch = (index: number, field: keyof Research, value: string | string[]) => {
    const updated = [...resumeContent.research];
    updated[index] = { ...updated[index], [field]: value };
    setResumeContent({ ...resumeContent, research: updated });
  };

  const removeResearch = (index: number) => {
    setResumeContent({
      ...resumeContent,
      research: resumeContent.research.filter((_, i) => i !== index),
    });
  };

  const addResearchBullet = (resIndex: number) => {
    const updated = [...resumeContent.research];
    const bullets = updated[resIndex].bullets || [];
    updated[resIndex] = { ...updated[resIndex], bullets: [...bullets, ''] };
    setResumeContent({ ...resumeContent, research: updated });
  };

  const updateResearchBullet = (resIndex: number, bulletIndex: number, value: string) => {
    const updated = [...resumeContent.research];
    const bullets = [...(updated[resIndex].bullets || [])];
    bullets[bulletIndex] = value;
    updated[resIndex] = { ...updated[resIndex], bullets };
    setResumeContent({ ...resumeContent, research: updated });
  };

  const removeResearchBullet = (resIndex: number, bulletIndex: number) => {
    const updated = [...resumeContent.research];
    const bullets = (updated[resIndex].bullets || []).filter((_, i) => i !== bulletIndex);
    updated[resIndex] = { ...updated[resIndex], bullets };
    setResumeContent({ ...resumeContent, research: updated });
  };

  // Project helpers
  const addProject = () => {
    setResumeContent({
      ...resumeContent,
      projects: [...resumeContent.projects, { title: '', timeline: '', bullets: [] }],
    });
  };

  const updateProject = (index: number, field: keyof Project, value: string | string[]) => {
    const updated = [...resumeContent.projects];
    updated[index] = { ...updated[index], [field]: value };
    setResumeContent({ ...resumeContent, projects: updated });
  };

  const removeProject = (index: number) => {
    setResumeContent({
      ...resumeContent,
      projects: resumeContent.projects.filter((_, i) => i !== index),
    });
  };

  const addProjectBullet = (projIndex: number) => {
    const updated = [...resumeContent.projects];
    const bullets = updated[projIndex].bullets || [];
    updated[projIndex] = { ...updated[projIndex], bullets: [...bullets, ''] };
    setResumeContent({ ...resumeContent, projects: updated });
  };

  const updateProjectBullet = (projIndex: number, bulletIndex: number, value: string) => {
    const updated = [...resumeContent.projects];
    const bullets = [...(updated[projIndex].bullets || [])];
    bullets[bulletIndex] = value;
    updated[projIndex] = { ...updated[projIndex], bullets };
    setResumeContent({ ...resumeContent, projects: updated });
  };

  const removeProjectBullet = (projIndex: number, bulletIndex: number) => {
    const updated = [...resumeContent.projects];
    const bullets = (updated[projIndex].bullets || []).filter((_, i) => i !== bulletIndex);
    updated[projIndex] = { ...updated[projIndex], bullets };
    setResumeContent({ ...resumeContent, projects: updated });
  };

  // Award helpers
  const addAward = () => {
    if (newAward.trim() && !resumeContent.awards.includes(newAward.trim())) {
      setResumeContent({
        ...resumeContent,
        awards: [...resumeContent.awards, newAward.trim()],
      });
      setNewAward('');
    }
  };

  const removeAward = (index: number) => {
    setResumeContent({
      ...resumeContent,
      awards: resumeContent.awards.filter((_, i) => i !== index),
    });
  };

  // Custom field helpers for Education
  const addEducationCustomField = (eduIndex: number) => {
    const updated = [...resumeContent.education];
    const customFields = updated[eduIndex].customFields || [];
    updated[eduIndex] = { ...updated[eduIndex], customFields: [...customFields, { key: '', value: '' }] };
    setResumeContent({ ...resumeContent, education: updated });
  };

  const updateEducationCustomField = (eduIndex: number, fieldIndex: number, key: string, value: string) => {
    const updated = [...resumeContent.education];
    const customFields = [...(updated[eduIndex].customFields || [])];
    customFields[fieldIndex] = { key, value };
    updated[eduIndex] = { ...updated[eduIndex], customFields };
    setResumeContent({ ...resumeContent, education: updated });
  };

  const removeEducationCustomField = (eduIndex: number, fieldIndex: number) => {
    const updated = [...resumeContent.education];
    const customFields = (updated[eduIndex].customFields || []).filter((_, i) => i !== fieldIndex);
    updated[eduIndex] = { ...updated[eduIndex], customFields };
    setResumeContent({ ...resumeContent, education: updated });
  };

  // Custom field helpers for Leadership
  const addLeadershipCustomField = (leadIndex: number) => {
    const updated = [...resumeContent.leadership];
    const customFields = updated[leadIndex].customFields || [];
    updated[leadIndex] = { ...updated[leadIndex], customFields: [...customFields, { key: '', value: '' }] };
    setResumeContent({ ...resumeContent, leadership: updated });
  };

  const updateLeadershipCustomField = (leadIndex: number, fieldIndex: number, key: string, value: string) => {
    const updated = [...resumeContent.leadership];
    const customFields = [...(updated[leadIndex].customFields || [])];
    customFields[fieldIndex] = { key, value };
    updated[leadIndex] = { ...updated[leadIndex], customFields };
    setResumeContent({ ...resumeContent, leadership: updated });
  };

  const removeLeadershipCustomField = (leadIndex: number, fieldIndex: number) => {
    const updated = [...resumeContent.leadership];
    const customFields = (updated[leadIndex].customFields || []).filter((_, i) => i !== fieldIndex);
    updated[leadIndex] = { ...updated[leadIndex], customFields };
    setResumeContent({ ...resumeContent, leadership: updated });
  };

  // Custom section helpers
  const addCustomSection = () => {
    const customSections = resumeContent.customSections || [];
    const maxOrder = Math.max(
      ...(['education', 'skills', 'experience', 'leadership'] as const).map(k => getSectionConfig(k).order),
      ...customSections.map(s => s.order ?? 0),
      -1
    );
    setResumeContent({
      ...resumeContent,
      customSections: [...customSections, { id: crypto.randomUUID(), name: '', icon: 'list', color: 'blue', order: maxOrder + 1, items: [] }],
    });
  };

  const updateCustomSectionName = (sectionIndex: number, name: string) => {
    const customSections = [...(resumeContent.customSections || [])];
    customSections[sectionIndex] = { ...customSections[sectionIndex], name };
    setResumeContent({ ...resumeContent, customSections });
  };

  const updateCustomSectionIcon = (sectionIndex: number, icon: string) => {
    const customSections = [...(resumeContent.customSections || [])];
    customSections[sectionIndex] = { ...customSections[sectionIndex], icon };
    setResumeContent({ ...resumeContent, customSections });
  };

  const updateCustomSectionColor = (sectionIndex: number, color: string) => {
    const customSections = [...(resumeContent.customSections || [])];
    customSections[sectionIndex] = { ...customSections[sectionIndex], color };
    setResumeContent({ ...resumeContent, customSections });
  };

  const removeCustomSection = (sectionIndex: number) => {
    const customSections = (resumeContent.customSections || []).filter((_, i) => i !== sectionIndex);
    setResumeContent({ ...resumeContent, customSections });
  };

  const addCustomSectionItem = (sectionIndex: number) => {
    const customSections = [...(resumeContent.customSections || [])];
    const items = [...customSections[sectionIndex].items, { title: '', role: '' }];
    customSections[sectionIndex] = { ...customSections[sectionIndex], items };
    setResumeContent({ ...resumeContent, customSections });
  };

  const updateCustomSectionItem = (sectionIndex: number, itemIndex: number, field: 'title' | 'role', value: string) => {
    const customSections = [...(resumeContent.customSections || [])];
    const items = [...customSections[sectionIndex].items];
    items[itemIndex] = { ...items[itemIndex], [field]: value };
    customSections[sectionIndex] = { ...customSections[sectionIndex], items };
    setResumeContent({ ...resumeContent, customSections });
  };

  const removeCustomSectionItem = (sectionIndex: number, itemIndex: number) => {
    const customSections = [...(resumeContent.customSections || [])];
    const items = customSections[sectionIndex].items.filter((_, i) => i !== itemIndex);
    customSections[sectionIndex] = { ...customSections[sectionIndex], items };
    setResumeContent({ ...resumeContent, customSections });
  };

  const addCustomSectionItemCustomField = (sectionIndex: number, itemIndex: number) => {
    const customSections = [...(resumeContent.customSections || [])];
    const items = [...customSections[sectionIndex].items];
    const customFields = items[itemIndex].customFields || [];
    items[itemIndex] = { ...items[itemIndex], customFields: [...customFields, { key: '', value: '' }] };
    customSections[sectionIndex] = { ...customSections[sectionIndex], items };
    setResumeContent({ ...resumeContent, customSections });
  };

  const updateCustomSectionItemCustomField = (sectionIndex: number, itemIndex: number, fieldIndex: number, key: string, value: string) => {
    const customSections = [...(resumeContent.customSections || [])];
    const items = [...customSections[sectionIndex].items];
    const customFields = [...(items[itemIndex].customFields || [])];
    customFields[fieldIndex] = { key, value };
    items[itemIndex] = { ...items[itemIndex], customFields };
    customSections[sectionIndex] = { ...customSections[sectionIndex], items };
    setResumeContent({ ...resumeContent, customSections });
  };

  const removeCustomSectionItemCustomField = (sectionIndex: number, itemIndex: number, fieldIndex: number) => {
    const customSections = [...(resumeContent.customSections || [])];
    const items = [...customSections[sectionIndex].items];
    const customFields = (items[itemIndex].customFields || []).filter((_, i) => i !== fieldIndex);
    items[itemIndex] = { ...items[itemIndex], customFields };
    customSections[sectionIndex] = { ...customSections[sectionIndex], items };
    setResumeContent({ ...resumeContent, customSections });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Pages</h1>
        <div className="flex items-center gap-3">
          {saveStatus === 'saved' && (
            <span className="text-sm text-green-400">Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm text-red-400">Error saving</span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['home', 'about', 'resume', 'contact'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-[var(--blue)] text-white'
                : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} Page
          </button>
        ))}
      </div>

      {activeTab === 'home' && (
        <HomePageTab
          heroHeadline={heroHeadline}
          setHeroHeadline={setHeroHeadline}
          heroSubhead={heroSubhead}
          setHeroSubhead={setHeroSubhead}
          primaryCtaText={primaryCtaText}
          setPrimaryCtaText={setPrimaryCtaText}
          primaryCtaAction={primaryCtaAction}
          setPrimaryCtaAction={setPrimaryCtaAction}
          primaryCtaLink={primaryCtaLink}
          setPrimaryCtaLink={setPrimaryCtaLink}
          secondaryCtaText={secondaryCtaText}
          setSecondaryCtaText={setSecondaryCtaText}
          secondaryCtaAction={secondaryCtaAction}
          setSecondaryCtaAction={setSecondaryCtaAction}
          secondaryCtaLink={secondaryCtaLink}
          setSecondaryCtaLink={setSecondaryCtaLink}
          nowPanelItems={nowPanelItems}
          nowPanelInput={nowPanelInput}
          setNowPanelInput={setNowPanelInput}
          addNowPanelItem={addNowPanelItem}
          removeNowPanelItem={removeNowPanelItem}
          socialLinks={socialLinks}
          setSocialLinks={setSocialLinks}
          signalsBadges={signalsBadges}
          setSignalsBadges={setSignalsBadges}
          isSaving={isSaving}
          onSave={handleSaveHome}
        />
      )}

      {activeTab === 'about' && (
        <AboutPageTab
          aboutContent={aboutContent}
          setAboutContent={setAboutContent}
          isSaving={isSaving}
          onSave={handleSaveAbout}
        />
      )}

      {activeTab === 'resume' && (
        <ErrorBoundary fallback={<div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">Error loading Resume tab. Check console for details.</div>}>
          <ResumePageTab
            resumeContent={resumeContent}
            newSkill={newSkill}
            setNewSkill={setNewSkill}
            newAward={newAward}
            setNewAward={setNewAward}
            addSkill={addSkill}
            removeSkill={removeSkill}
            addAward={addAward}
            removeAward={removeAward}
            addEducation={addEducation}
            updateEducation={updateEducation}
            removeEducation={removeEducation}
            addEducationCustomField={addEducationCustomField}
            updateEducationCustomField={updateEducationCustomField}
            removeEducationCustomField={removeEducationCustomField}
            addExperience={addExperience}
            updateExperience={updateExperience}
            removeExperience={removeExperience}
            addExperienceBullet={addExperienceBullet}
            updateExperienceBullet={updateExperienceBullet}
            removeExperienceBullet={removeExperienceBullet}
            addResearch={addResearch}
            updateResearch={updateResearch}
            removeResearch={removeResearch}
            addResearchBullet={addResearchBullet}
            updateResearchBullet={updateResearchBullet}
            removeResearchBullet={removeResearchBullet}
            addProject={addProject}
            updateProject={updateProject}
            removeProject={removeProject}
            addProjectBullet={addProjectBullet}
            updateProjectBullet={updateProjectBullet}
            removeProjectBullet={removeProjectBullet}
            addLeadership={addLeadership}
            updateLeadership={updateLeadership}
            removeLeadership={removeLeadership}
            addLeadershipCustomField={addLeadershipCustomField}
            updateLeadershipCustomField={updateLeadershipCustomField}
            removeLeadershipCustomField={removeLeadershipCustomField}
            getSectionConfig={getSectionConfig}
            updateSectionConfig={updateSectionConfig}
            getAllSectionsSorted={getAllSectionsSorted}
            swapSectionOrder={swapSectionOrder}
            addCustomSection={addCustomSection}
            updateCustomSectionName={updateCustomSectionName}
            updateCustomSectionIcon={updateCustomSectionIcon}
            updateCustomSectionColor={updateCustomSectionColor}
            removeCustomSection={removeCustomSection}
            addCustomSectionItem={addCustomSectionItem}
            updateCustomSectionItem={updateCustomSectionItem}
            removeCustomSectionItem={removeCustomSectionItem}
            addCustomSectionItemCustomField={addCustomSectionItemCustomField}
            updateCustomSectionItemCustomField={updateCustomSectionItemCustomField}
            removeCustomSectionItemCustomField={removeCustomSectionItemCustomField}
            setResumeContent={setResumeContent}
            isSaving={isSaving}
            onSave={handleSaveResume}
          />
        </ErrorBoundary>
      )}

      {activeTab === 'contact' && (
        <ContactPageTab
          contactPage={contactPage}
          setContactPage={setContactPage}
          isSaving={isSaving}
          onSave={handleSaveContact}
        />
      )}
    </div>
  );
}


// Home Page Tab Component
function HomePageTab({
  heroHeadline,
  setHeroHeadline,
  heroSubhead,
  setHeroSubhead,
  primaryCtaText,
  setPrimaryCtaText,
  primaryCtaAction,
  setPrimaryCtaAction,
  primaryCtaLink,
  setPrimaryCtaLink,
  secondaryCtaText,
  setSecondaryCtaText,
  secondaryCtaAction,
  setSecondaryCtaAction,
  secondaryCtaLink,
  setSecondaryCtaLink,
  nowPanelItems,
  nowPanelInput,
  setNowPanelInput,
  addNowPanelItem,
  removeNowPanelItem,
  socialLinks,
  setSocialLinks,
  signalsBadges,
  setSignalsBadges,
  isSaving,
  onSave,
}: {
  heroHeadline: string;
  setHeroHeadline: (v: string) => void;
  heroSubhead: string;
  setHeroSubhead: (v: string) => void;
  primaryCtaText: string;
  setPrimaryCtaText: (v: string) => void;
  primaryCtaAction: 'phone_mock' | 'terminal' | 'link';
  setPrimaryCtaAction: (v: 'phone_mock' | 'terminal' | 'link') => void;
  primaryCtaLink: string;
  setPrimaryCtaLink: (v: string) => void;
  secondaryCtaText: string;
  setSecondaryCtaText: (v: string) => void;
  secondaryCtaAction: 'phone_mock' | 'terminal' | 'link';
  setSecondaryCtaAction: (v: 'phone_mock' | 'terminal' | 'link') => void;
  secondaryCtaLink: string;
  setSecondaryCtaLink: (v: string) => void;
  nowPanelItems: string[];
  nowPanelInput: string;
  setNowPanelInput: (v: string) => void;
  addNowPanelItem: () => void;
  removeNowPanelItem: (i: number) => void;
  socialLinks: { github?: string; linkedin?: string; email?: string; calendly?: string };
  setSocialLinks: (v: { github?: string; linkedin?: string; email?: string; calendly?: string }) => void;
  signalsBadges: { id: string; label: string; icon: string; enabled: boolean }[];
  setSignalsBadges: (v: { id: string; label: string; icon: string; enabled: boolean }[]) => void;
  isSaving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Hero Section</h2>
        <p className="text-sm text-[var(--muted)] mb-4">Your name is set in Settings → Site Identity. These fields are for the tagline below your name.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Tagline</label>
            <input
              type="text"
              value={heroHeadline}
              onChange={(e) => setHeroHeadline(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              placeholder="builds curious systems."
            />
            <p className="text-xs text-[var(--muted)] mt-1">Optional tagline shown below your name</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Description</label>
            <textarea
              value={heroSubhead}
              onChange={(e) => setHeroSubhead(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)] resize-none"
              placeholder="Full-Stack Engineer & Systems Architect..."
            />
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Call to Action Buttons</h2>
        <p className="text-sm text-[var(--muted)] mb-4">Leave text empty to hide a button.</p>
        
        {/* Primary CTA */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-[var(--text)]">Primary Button</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">Button Text</label>
              <input
                type="text"
                value={primaryCtaText}
                onChange={(e) => setPrimaryCtaText(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                placeholder="e.g., View Projects"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">Action</label>
              <select
                value={primaryCtaAction}
                onChange={(e) => setPrimaryCtaAction(e.target.value as 'phone_mock' | 'terminal' | 'link')}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              >
                <option value="phone_mock">Open Phone Preview</option>
                <option value="terminal">Open Terminal</option>
                <option value="link">Navigate to Link</option>
              </select>
            </div>
          </div>
          {primaryCtaAction === 'link' && (
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">Link URL</label>
              <input
                type="text"
                value={primaryCtaLink}
                onChange={(e) => setPrimaryCtaLink(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                placeholder="/projects or https://..."
              />
            </div>
          )}
        </div>

        {/* Secondary CTA */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[var(--text)]">Secondary Button</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">Button Text</label>
              <input
                type="text"
                value={secondaryCtaText}
                onChange={(e) => setSecondaryCtaText(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                placeholder="e.g., Preview Mobile"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">Action</label>
              <select
                value={secondaryCtaAction}
                onChange={(e) => setSecondaryCtaAction(e.target.value as 'phone_mock' | 'terminal' | 'link')}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              >
                <option value="phone_mock">Open Phone Preview</option>
                <option value="terminal">Open Terminal</option>
                <option value="link">Navigate to Link</option>
              </select>
            </div>
          </div>
          {secondaryCtaAction === 'link' && (
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">Link URL</label>
              <input
                type="text"
                value={secondaryCtaLink}
                onChange={(e) => setSecondaryCtaLink(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                placeholder="/projects or https://..."
              />
            </div>
          )}
        </div>
      </section>

      {/* Now Panel */}
      <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Now Panel Items</h2>
        <p className="text-sm text-[var(--muted)] mb-4">What you&apos;re currently working on or focused on this month.</p>
        <div className="space-y-2 mb-3">
          {nowPanelItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-[var(--bg)] rounded-lg">
              <span className="flex-1 text-sm text-[var(--text)]">{item}</span>
              <button onClick={() => removeNowPanelItem(index)} className="text-[var(--muted)] hover:text-red-400">×</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={nowPanelInput}
            onChange={(e) => setNowPanelInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNowPanelItem())}
            className="flex-1 px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
            placeholder="Add item (press Enter)"
          />
          <button
            onClick={addNowPanelItem}
            className="px-4 py-2 bg-[var(--bg)] text-[var(--text)] text-sm font-medium rounded-lg hover:bg-[var(--bg)]/80 transition-colors border border-[var(--surface)]"
          >
            Add
          </button>
        </div>
      </section>

      {/* Social Links */}
      <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Social Links</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">GitHub URL</label>
            <input
              type="url"
              value={socialLinks.github || ''}
              onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              placeholder="https://github.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">LinkedIn URL</label>
            <input
              type="url"
              value={socialLinks.linkedin || ''}
              onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              placeholder="https://linkedin.com/in/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Email</label>
            <input
              type="email"
              value={socialLinks.email || ''}
              onChange={(e) => setSocialLinks({ ...socialLinks, email: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Calendly URL</label>
            <input
              type="url"
              value={socialLinks.calendly || ''}
              onChange={(e) => setSocialLinks({ ...socialLinks, calendly: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              placeholder="https://calendly.com/..."
            />
          </div>
        </div>
      </section>

      {/* Signals Badges */}
      <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">Signals Badges</h2>
            <p className="text-sm text-[var(--muted)]">Badges displayed below the hero section</p>
          </div>
          <button
            onClick={() => setSignalsBadges([...signalsBadges, { id: `badge-${Date.now()}`, label: 'NEW BADGE', icon: 'code', enabled: true }])}
            className="px-3 py-1.5 text-sm bg-[var(--bg)] text-[var(--text)] rounded-lg hover:bg-[var(--bg)]/80 border border-[var(--surface)]"
          >
            + Add Badge
          </button>
        </div>
        <div className="space-y-3">
          {signalsBadges.map((badge, index) => (
            <div key={badge.id} className="flex items-center gap-3 p-3 bg-[var(--bg)] rounded-lg">
              <input
                type="text"
                value={badge.label}
                onChange={(e) => {
                  const updated = [...signalsBadges];
                  updated[index] = { ...badge, label: e.target.value.toUpperCase() };
                  setSignalsBadges(updated);
                }}
                className="flex-1 px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                placeholder="BADGE LABEL"
              />
              <button
                onClick={() => {
                  const updated = [...signalsBadges];
                  updated[index] = { ...badge, enabled: !badge.enabled };
                  setSignalsBadges(updated);
                }}
                className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                  badge.enabled 
                    ? 'bg-[var(--green)]/20 text-[var(--green)] border border-[var(--green)]/30' 
                    : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--surface)]'
                }`}
              >
                {badge.enabled ? '✓ Visible' : 'Hidden'}
              </button>
              <button
                onClick={() => setSignalsBadges(signalsBadges.filter((_, i) => i !== index))}
                className="p-2 text-[var(--muted)] hover:text-red-400 transition-colors"
              >
                ×
              </button>
            </div>
          ))}
          {signalsBadges.length === 0 && (
            <p className="text-sm text-[var(--muted)] text-center py-4">No badges. Click &quot;Add Badge&quot; to create one.</p>
          )}
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Home Settings'}
        </button>
      </div>
    </div>
  );
}

// About Page Tab Component
function AboutPageTab({
  aboutContent,
  setAboutContent,
  isSaving,
  onSave,
}: {
  aboutContent: string;
  setAboutContent: (v: string) => void;
  isSaving: boolean;
  onSave: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; name: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Fetch existing about images on mount
  useEffect(() => {
    async function fetchImages() {
      const { data } = await supabase
        .from('assets')
        .select('original_url, filename')
        .eq('bucket', 'about')
        .order('created_at', { ascending: false });
      
      if (data) {
        setUploadedImages(data.map(d => ({ url: d.original_url, name: d.filename })));
      }
    }
    fetchImages();
  }, [supabase]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image exceeds 5MB limit');
      return;
    }

    setIsUploading(true);

    try {
      const filename = `about-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const { error: uploadError } = await supabase.storage
        .from('about')
        .upload(filename, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        // Try creating the bucket if it doesn't exist
        if (uploadError.message.includes('not found')) {
          alert('Storage bucket "about" not found. Please create it in Supabase dashboard.');
        } else {
          alert(`Failed to upload: ${uploadError.message}`);
        }
        return;
      }

      const { data: urlData } = supabase.storage.from('about').getPublicUrl(filename);

      // Create asset record
      await supabase.from('assets').insert({
        filename: file.name,
        original_url: urlData.publicUrl,
        bucket: 'about',
        mime_type: file.type,
        size_bytes: file.size,
        width: null,
        height: null,
        variants: {},
      });

      setUploadedImages(prev => [{ url: urlData.publicUrl, name: file.name }, ...prev]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('An error occurred during upload');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const insertImageMarkdown = (url: string, position: 'left' | 'center' | 'right' | 'full') => {
    const positionClass = {
      left: 'float-left mr-4 mb-4 w-1/3',
      center: 'mx-auto block',
      right: 'float-right ml-4 mb-4 w-1/3',
      full: 'w-full',
    }[position];

    const markdown = `\n<img src="${url}" alt="" class="${positionClass}" />\n`;
    setAboutContent(aboutContent + markdown);
  };

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="space-y-6">
      {/* Image Upload Section */}
      <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">Images</h2>
            <p className="text-sm text-[var(--muted)]">Upload images and insert them into your content</p>
          </div>
          <label className="px-4 py-2 bg-[var(--bg)] text-[var(--text)] text-sm font-medium rounded-lg hover:bg-[var(--bg)]/80 cursor-pointer border border-[var(--surface)]">
            {isUploading ? 'Uploading...' : '+ Upload Image'}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>

        {uploadedImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {uploadedImages.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-24 object-cover rounded-lg border border-[var(--surface)]"
                />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-1">
                  <p className="text-xs text-white truncate max-w-full px-2">{img.name}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => insertImageMarkdown(img.url, 'left')}
                      className="px-2 py-1 text-xs bg-white/20 text-white rounded hover:bg-white/30"
                      title="Insert left-aligned"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => insertImageMarkdown(img.url, 'center')}
                      className="px-2 py-1 text-xs bg-white/20 text-white rounded hover:bg-white/30"
                      title="Insert centered"
                    >
                      ↔
                    </button>
                    <button
                      onClick={() => insertImageMarkdown(img.url, 'right')}
                      className="px-2 py-1 text-xs bg-white/20 text-white rounded hover:bg-white/30"
                      title="Insert right-aligned"
                    >
                      →
                    </button>
                    <button
                      onClick={() => insertImageMarkdown(img.url, 'full')}
                      className="px-2 py-1 text-xs bg-white/20 text-white rounded hover:bg-white/30"
                      title="Insert full-width"
                    >
                      ▭
                    </button>
                    <button
                      onClick={() => copyImageUrl(img.url)}
                      className="px-2 py-1 text-xs bg-white/20 text-white rounded hover:bg-white/30"
                      title="Copy URL"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Content Editor */}
      <section className="bg-[var(--surface)] rounded-lg border border-[var(--surface)] overflow-hidden">
        <div className="px-4 py-2 border-b border-[var(--bg)]">
          <span className="text-sm font-medium text-[var(--text)]">About Page Content (Markdown + HTML)</span>
        </div>
        <textarea
          value={aboutContent}
          onChange={(e) => setAboutContent(e.target.value)}
          rows={20}
          className="w-full px-4 py-4 bg-[var(--bg)] text-[var(--text)] font-mono text-sm focus:outline-none resize-none"
          placeholder="Write your about page content in Markdown..."
        />
      </section>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save About Page'}
        </button>
      </div>
    </div>
  );
}

// Icon options for custom sections
const SECTION_ICONS = [
  { id: 'list', label: 'List', icon: '☰' },
  { id: 'star', label: 'Star', icon: '★' },
  { id: 'book', label: 'Book', icon: '📖' },
  { id: 'trophy', label: 'Trophy', icon: '🏆' },
  { id: 'briefcase', label: 'Briefcase', icon: '💼' },
  { id: 'graduation', label: 'Graduation', icon: '🎓' },
  { id: 'code', label: 'Code', icon: '💻' },
  { id: 'research', label: 'Research', icon: '🔬' },
  { id: 'certificate', label: 'Certificate', icon: '📜' },
  { id: 'globe', label: 'Globe', icon: '🌐' },
  { id: 'heart', label: 'Heart', icon: '❤️' },
  { id: 'lightning', label: 'Lightning', icon: '⚡' },
];

const SECTION_COLORS = [
  { id: 'blue', label: 'Blue', class: 'bg-[var(--blue)]' },
  { id: 'violet', label: 'Violet', class: 'bg-[var(--violet)]' },
  { id: 'green', label: 'Green', class: 'bg-[var(--green)]' },
  { id: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { id: 'red', label: 'Red', class: 'bg-red-500' },
  { id: 'pink', label: 'Pink', class: 'bg-pink-500' },
  { id: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
  { id: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
];

// Resume Page Tab Component
function ResumePageTab({
  resumeContent,
  newSkill,
  setNewSkill,
  newAward,
  setNewAward,
  addSkill,
  removeSkill,
  addAward,
  removeAward,
  addEducation,
  updateEducation,
  removeEducation,
  addEducationCustomField,
  updateEducationCustomField,
  removeEducationCustomField,
  addExperience,
  updateExperience,
  removeExperience,
  addExperienceBullet,
  updateExperienceBullet,
  removeExperienceBullet,
  addResearch,
  updateResearch,
  removeResearch,
  addResearchBullet,
  updateResearchBullet,
  removeResearchBullet,
  addProject,
  updateProject,
  removeProject,
  addProjectBullet,
  updateProjectBullet,
  removeProjectBullet,
  addLeadership,
  updateLeadership,
  removeLeadership,
  addLeadershipCustomField,
  updateLeadershipCustomField,
  removeLeadershipCustomField,
  getSectionConfig,
  updateSectionConfig,
  getAllSectionsSorted,
  swapSectionOrder,
  addCustomSection,
  updateCustomSectionName,
  updateCustomSectionIcon,
  updateCustomSectionColor,
  removeCustomSection,
  addCustomSectionItem,
  updateCustomSectionItem,
  removeCustomSectionItem,
  addCustomSectionItemCustomField,
  updateCustomSectionItemCustomField,
  removeCustomSectionItemCustomField,
  setResumeContent,
  isSaving,
  onSave,
}: {
  resumeContent: ResumeContent;
  newSkill: string;
  setNewSkill: (v: string) => void;
  newAward: string;
  setNewAward: (v: string) => void;
  addSkill: () => void;
  removeSkill: (i: number) => void;
  addAward: () => void;
  removeAward: (i: number) => void;
  addEducation: () => void;
  updateEducation: (i: number, field: keyof Education, value: string) => void;
  removeEducation: (i: number) => void;
  addEducationCustomField: (eduIndex: number) => void;
  updateEducationCustomField: (eduIndex: number, fieldIndex: number, key: string, value: string) => void;
  removeEducationCustomField: (eduIndex: number, fieldIndex: number) => void;
  addExperience: () => void;
  updateExperience: (i: number, field: keyof Experience, value: string | string[]) => void;
  removeExperience: (i: number) => void;
  addExperienceBullet: (expIndex: number) => void;
  updateExperienceBullet: (expIndex: number, bulletIndex: number, value: string) => void;
  removeExperienceBullet: (expIndex: number, bulletIndex: number) => void;
  addResearch: () => void;
  updateResearch: (i: number, field: keyof Research, value: string | string[]) => void;
  removeResearch: (i: number) => void;
  addResearchBullet: (resIndex: number) => void;
  updateResearchBullet: (resIndex: number, bulletIndex: number, value: string) => void;
  removeResearchBullet: (resIndex: number, bulletIndex: number) => void;
  addProject: () => void;
  updateProject: (i: number, field: keyof Project, value: string | string[]) => void;
  removeProject: (i: number) => void;
  addProjectBullet: (projIndex: number) => void;
  updateProjectBullet: (projIndex: number, bulletIndex: number, value: string) => void;
  removeProjectBullet: (projIndex: number, bulletIndex: number) => void;
  addLeadership: () => void;
  updateLeadership: (i: number, field: keyof Leadership, value: string) => void;
  removeLeadership: (i: number) => void;
  addLeadershipCustomField: (leadIndex: number) => void;
  updateLeadershipCustomField: (leadIndex: number, fieldIndex: number, key: string, value: string) => void;
  removeLeadershipCustomField: (leadIndex: number, fieldIndex: number) => void;
  getSectionConfig: (section: 'objective' | 'skills' | 'education' | 'experience' | 'research' | 'projects' | 'leadership' | 'awards') => BuiltInSectionConfig;
  updateSectionConfig: (section: 'objective' | 'skills' | 'education' | 'experience' | 'research' | 'projects' | 'leadership' | 'awards', updates: Partial<BuiltInSectionConfig>) => void;
  getAllSectionsSorted: () => { type: 'builtin' | 'custom'; id: string; name: string; order: number; icon: string }[];
  swapSectionOrder: (index1: number, index2: number) => void;
  addCustomSection: () => void;
  updateCustomSectionName: (sectionIndex: number, name: string) => void;
  updateCustomSectionIcon: (sectionIndex: number, icon: string) => void;
  updateCustomSectionColor: (sectionIndex: number, color: string) => void;
  removeCustomSection: (sectionIndex: number) => void;
  addCustomSectionItem: (sectionIndex: number) => void;
  updateCustomSectionItem: (sectionIndex: number, itemIndex: number, field: 'title' | 'role', value: string) => void;
  removeCustomSectionItem: (sectionIndex: number, itemIndex: number) => void;
  addCustomSectionItemCustomField: (sectionIndex: number, itemIndex: number) => void;
  updateCustomSectionItemCustomField: (sectionIndex: number, itemIndex: number, fieldIndex: number, key: string, value: string) => void;
  removeCustomSectionItemCustomField: (sectionIndex: number, itemIndex: number, fieldIndex: number) => void;
  setResumeContent: (v: ResumeContent) => void;
  isSaving: boolean;
  onSave: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [currentResumeUrl, setCurrentResumeUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // Fetch current resume URL on mount
  useEffect(() => {
    async function fetchResumeUrl() {
      const { data } = await supabase
        .from('assets')
        .select('original_url')
        .eq('bucket', 'resume')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data?.original_url) {
        setCurrentResumeUrl(data.original_url);
      }
    }
    fetchResumeUrl();
  }, [supabase]);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File exceeds 10MB limit');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading resume...');

    try {
      const filename = `resume-${Date.now()}.pdf`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('resume')
        .upload(filename, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        alert(`Failed to upload: ${uploadError.message}`);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('resume').getPublicUrl(filename);

      // Create asset record
      await supabase.from('assets').insert({
        filename: file.name,
        original_url: urlData.publicUrl,
        bucket: 'resume',
        mime_type: file.type,
        size_bytes: file.size,
        width: null,
        height: null,
        variants: {},
      });

      setCurrentResumeUrl(urlData.publicUrl);
      setUploadStatus('Resume uploaded successfully!');

      // Ask if user wants to auto-extract content
      if (confirm('Resume uploaded! Would you like to auto-extract content from the PDF?')) {
        await extractFromPdf(file);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('An error occurred during upload');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadStatus(null), 3000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const extractFromPdf = async (file: File) => {
    setIsExtracting(true);
    setUploadStatus('Extracting content from PDF...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.resumeContent) {
        const extracted = data.resumeContent;
        
        // Merge extracted content with existing (don't overwrite if empty)
        setResumeContent({
          ...resumeContent,
          objective: extracted.objective || resumeContent.objective,
          education: extracted.education?.length > 0 ? extracted.education : resumeContent.education,
          skills: extracted.skills?.length > 0 ? extracted.skills : resumeContent.skills,
          experience: extracted.experience?.length > 0 ? extracted.experience : resumeContent.experience,
          research: extracted.research?.length > 0 ? extracted.research : resumeContent.research,
          projects: extracted.projects?.length > 0 ? extracted.projects : resumeContent.projects,
          leadership: extracted.leadership?.length > 0 ? extracted.leadership : resumeContent.leadership,
          awards: extracted.awards?.length > 0 ? extracted.awards : resumeContent.awards,
        });
        
        setUploadStatus('Content extracted! Review and save.');
      } else {
        setUploadStatus('Could not extract content. Please enter manually.');
      }
    } catch (error) {
      console.error('Extraction error:', error);
      setUploadStatus('Extraction failed. Please enter content manually.');
    } finally {
      setIsExtracting(false);
      setTimeout(() => setUploadStatus(null), 5000);
    }
  };

  const handleExtractFromExisting = async () => {
    if (!currentResumeUrl) {
      alert('No resume uploaded yet');
      return;
    }

    setIsExtracting(true);
    setUploadStatus('Fetching and extracting from existing PDF...');

    try {
      // Fetch the PDF
      const response = await fetch(currentResumeUrl);
      const blob = await response.blob();
      const file = new File([blob], 'resume.pdf', { type: 'application/pdf' });
      
      await extractFromPdf(file);
    } catch (error) {
      console.error('Error:', error);
      setUploadStatus('Failed to extract from existing PDF');
      setTimeout(() => setUploadStatus(null), 3000);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Resume PDF Upload Section */}
      <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Resume PDF</h2>
        
        {currentResumeUrl && (
          <div className="mb-4 p-4 bg-[var(--bg)] rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--violet)]/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--violet)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-[var(--text)] font-medium">Current Resume</p>
                  <a href={currentResumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--blue)] hover:underline">
                    View PDF →
                  </a>
                </div>
              </div>
              <button
                onClick={handleExtractFromExisting}
                disabled={isExtracting}
                className="px-3 py-1.5 text-sm bg-[var(--violet)]/20 text-[var(--violet)] rounded-lg hover:bg-[var(--violet)]/30 disabled:opacity-50"
              >
                {isExtracting ? 'Extracting...' : 'Extract Content'}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleResumeUpload}
            className="hidden"
            id="resume-upload-pages"
          />
          <label
            htmlFor="resume-upload-pages"
            className={`inline-flex items-center gap-2 px-4 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 cursor-pointer ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {currentResumeUrl ? 'Upload New Resume' : 'Upload Resume PDF'}
          </label>
        </div>

        {uploadStatus && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            uploadStatus.includes('success') || uploadStatus.includes('extracted') 
              ? 'bg-[var(--green)]/10 text-[var(--green)]' 
              : uploadStatus.includes('failed') || uploadStatus.includes('Could not')
              ? 'bg-red-500/10 text-red-400'
              : 'bg-[var(--blue)]/10 text-[var(--blue)]'
          }`}>
            {uploadStatus}
          </div>
        )}

        <p className="mt-3 text-xs text-[var(--muted)]">
          Upload a PDF resume to display on the resume page. You can also auto-extract education, skills, and leadership info from the PDF.
        </p>
      </section>

      {/* Section Order */}
      <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Section Order</h2>
        <p className="text-xs text-[var(--muted)] mb-3">Reorder how all sections appear on your resume page.</p>
        <div className="space-y-2">
          {getAllSectionsSorted().map((section, index, arr) => (
            <div key={section.id} className="flex items-center gap-3 p-3 bg-[var(--bg)] rounded-lg">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => swapSectionOrder(index, index - 1)}
                  disabled={index === 0}
                  className="px-1.5 py-0.5 text-xs text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  onClick={() => swapSectionOrder(index, index + 1)}
                  disabled={index === arr.length - 1}
                  className="px-1.5 py-0.5 text-xs text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <span className="text-sm text-[var(--text)] flex-1">{section.name}</span>
              <span className="text-lg">{SECTION_ICONS.find(i => i.id === section.icon)?.icon || '☰'}</span>
              {section.type === 'custom' && (
                <span className="text-xs text-[var(--muted)] bg-[var(--surface)] px-2 py-0.5 rounded">Custom</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Education Section */}
      <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text)]">Education</h2>
          <button
            onClick={addEducation}
            className="px-3 py-1 text-sm bg-[var(--blue)] text-white rounded-lg hover:bg-[var(--blue)]/90"
          >
            + Add
          </button>
        </div>
        
        {/* Icon and Color Selection */}
        <div className="mb-4 p-3 bg-[var(--bg)] rounded-lg space-y-3">
          <div>
            <span className="text-xs text-[var(--muted)] block mb-2">Icon</span>
            <div className="flex flex-wrap gap-1">
              {SECTION_ICONS.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => updateSectionConfig('education', { icon: icon.id })}
                  className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-colors ${
                    getSectionConfig('education').icon === icon.id
                      ? 'bg-[var(--blue)] text-white'
                      : 'bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface)]/80'
                  }`}
                  title={icon.label}
                >
                  {icon.icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-[var(--muted)] block mb-2">Color</span>
            <div className="flex flex-wrap gap-1">
              {SECTION_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => updateSectionConfig('education', { color: color.id })}
                  className={`w-6 h-6 rounded-full ${color.class} transition-transform ${
                    getSectionConfig('education').color === color.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--bg)] scale-110' : ''
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {Array.isArray(resumeContent.education) && resumeContent.education.map((edu, index) => (
            <div key={index} className="p-4 bg-[var(--bg)] rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs text-[var(--muted)]">Education #{index + 1}</span>
                <button onClick={() => removeEducation(index)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                  placeholder="Institution name"
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                />
                <input
                  type="text"
                  value={edu.location || ''}
                  onChange={(e) => updateEducation(index, 'location', e.target.value)}
                  placeholder="Location"
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                />
              </div>
              <input
                type="text"
                value={edu.details || ''}
                onChange={(e) => updateEducation(index, 'details', e.target.value)}
                placeholder="Details (e.g., Honors College)"
                className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
              />
              <input
                type="text"
                value={edu.degree}
                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                placeholder="Degree"
                className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={edu.gpa || ''}
                  onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                  placeholder="GPA (e.g., 3.80)"
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                />
                <input
                  type="text"
                  value={edu.timeline || ''}
                  onChange={(e) => updateEducation(index, 'timeline', e.target.value)}
                  placeholder="Timeline (e.g., Aug 2024 - May 2028)"
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                />
              </div>
              {/* Custom Fields */}
              {edu.customFields && edu.customFields.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--surface)]">
                  <span className="text-xs text-[var(--muted)]">Custom Fields</span>
                  {edu.customFields.map((field, fieldIndex) => (
                    <div key={fieldIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) => updateEducationCustomField(index, fieldIndex, e.target.value, field.value)}
                        placeholder="Field name"
                        className="w-1/3 px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => updateEducationCustomField(index, fieldIndex, field.key, e.target.value)}
                        placeholder="Value"
                        className="flex-1 px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                      />
                      <button
                        onClick={() => removeEducationCustomField(index, fieldIndex)}
                        className="px-2 text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => addEducationCustomField(index)}
                className="text-xs text-[var(--blue)] hover:text-[var(--blue)]/80"
              >
                + Add Custom Field
              </button>
            </div>
          ))}
          {resumeContent.education.length === 0 && (
            <p className="text-[var(--muted)] text-sm">No education entries. Click &quot;+ Add&quot; to add one.</p>
          )}
        </div>
      </section>

      {/* Skills Section */}
      <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Skills</h2>
        
        {/* Icon and Color Selection */}
        <div className="mb-4 p-3 bg-[var(--bg)] rounded-lg space-y-3">
          <div>
            <span className="text-xs text-[var(--muted)] block mb-2">Icon</span>
            <div className="flex flex-wrap gap-1">
              {SECTION_ICONS.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => updateSectionConfig('skills', { icon: icon.id })}
                  className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-colors ${
                    getSectionConfig('skills').icon === icon.id
                      ? 'bg-[var(--blue)] text-white'
                      : 'bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface)]/80'
                  }`}
                  title={icon.label}
                >
                  {icon.icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-[var(--muted)] block mb-2">Color</span>
            <div className="flex flex-wrap gap-1">
              {SECTION_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => updateSectionConfig('skills', { color: color.id })}
                  className={`w-6 h-6 rounded-full ${color.class} transition-transform ${
                    getSectionConfig('skills').color === color.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--bg)] scale-110' : ''
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {Array.isArray(resumeContent.skills) && resumeContent.skills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1.5 text-sm bg-[var(--bg)] text-[var(--text)] rounded-lg border border-[var(--surface)] flex items-center gap-2"
            >
              {skill}
              <button onClick={() => removeSkill(index)} className="text-[var(--muted)] hover:text-red-400">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            placeholder="Add a skill"
            className="flex-1 px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
          />
          <button onClick={addSkill} className="px-4 py-2 bg-[var(--blue)] text-white text-sm rounded-lg hover:bg-[var(--blue)]/90">
            Add
          </button>
        </div>
      </section>

      {/* Objective Section */}
      <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Objective</h2>
        <textarea
          value={resumeContent.objective || ''}
          onChange={(e) => setResumeContent({ ...resumeContent, objective: e.target.value })}
          rows={3}
          placeholder="Your career objective..."
          className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm resize-none"
        />
      </section>

      {/* Experience Section */}
      <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text)]">Experience</h2>
          <button
            onClick={addExperience}
            className="px-3 py-1 text-sm bg-[var(--blue)] text-white rounded-lg hover:bg-[var(--blue)]/90"
          >
            + Add
          </button>
        </div>
        
        <div className="space-y-4">
          {Array.isArray(resumeContent.experience) && resumeContent.experience.map((exp, index) => (
            <div key={index} className="p-4 bg-[var(--bg)] rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs text-[var(--muted)]">Experience #{index + 1}</span>
                <button onClick={() => removeExperience(index)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={exp.role}
                  onChange={(e) => updateExperience(index, 'role', e.target.value)}
                  placeholder="Role/Title"
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                />
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateExperience(index, 'company', e.target.value)}
                  placeholder="Company"
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={exp.timeline || ''}
                  onChange={(e) => updateExperience(index, 'timeline', e.target.value)}
                  placeholder="Timeline (e.g., Jan 2024 - Present)"
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                />
                <input
                  type="text"
                  value={exp.location || ''}
                  onChange={(e) => updateExperience(index, 'location', e.target.value)}
                  placeholder="Location"
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                />
              </div>
              {/* Bullets */}
              <div className="space-y-2">
                <span className="text-xs text-[var(--muted)]">Bullet Points</span>
                {(exp.bullets || []).map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className="flex gap-2">
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => updateExperienceBullet(index, bulletIndex, e.target.value)}
                      placeholder="Bullet point..."
                      className="flex-1 px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                    />
                    <button onClick={() => removeExperienceBullet(index, bulletIndex)} className="px-2 text-red-400 hover:text-red-300">×</button>
                  </div>
                ))}
                <button onClick={() => addExperienceBullet(index)} className="text-xs text-[var(--blue)] hover:text-[var(--blue)]/80">+ Add Bullet</button>
              </div>
            </div>
          ))}
          {(!resumeContent.experience || resumeContent.experience.length === 0) && (
            <p className="text-[var(--muted)] text-sm">No experience entries. Click &quot;+ Add&quot; to add one.</p>
          )}
        </div>
      </section>

      {/* Research Section */}
      <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text)]">Research</h2>
          <button
            onClick={addResearch}
            className="px-3 py-1 text-sm bg-[var(--blue)] text-white rounded-lg hover:bg-[var(--blue)]/90"
          >
            + Add
          </button>
        </div>
        
        <div className="space-y-4">
          {Array.isArray(resumeContent.research) && resumeContent.research.map((res, index) => (
            <div key={index} className="p-4 bg-[var(--bg)] rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs text-[var(--muted)]">Research #{index + 1}</span>
                <button onClick={() => removeResearch(index)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
              </div>
              <input
                type="text"
                value={res.title}
                onChange={(e) => updateResearch(index, 'title', e.target.value)}
                placeholder="Research Title"
                className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={res.timeline || ''}
                  onChange={(e) => updateResearch(index, 'timeline', e.target.value)}
                  placeholder="Timeline"
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                />
                <input
                  type="text"
                  value={res.details || ''}
                  onChange={(e) => updateResearch(index, 'details', e.target.value)}
                  placeholder="Details (e.g., arXiv target)"
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                />
              </div>
              {/* Bullets */}
              <div className="space-y-2">
                <span className="text-xs text-[var(--muted)]">Bullet Points</span>
                {(res.bullets || []).map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className="flex gap-2">
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => updateResearchBullet(index, bulletIndex, e.target.value)}
                      placeholder="Bullet point..."
                      className="flex-1 px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                    />
                    <button onClick={() => removeResearchBullet(index, bulletIndex)} className="px-2 text-red-400 hover:text-red-300">×</button>
                  </div>
                ))}
                <button onClick={() => addResearchBullet(index)} className="text-xs text-[var(--blue)] hover:text-[var(--blue)]/80">+ Add Bullet</button>
              </div>
            </div>
          ))}
          {(!resumeContent.research || resumeContent.research.length === 0) && (
            <p className="text-[var(--muted)] text-sm">No research entries. Click &quot;+ Add&quot; to add one.</p>
          )}
        </div>
      </section>

      {/* Projects Section */}
      <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text)]">Projects</h2>
          <button
            onClick={addProject}
            className="px-3 py-1 text-sm bg-[var(--blue)] text-white rounded-lg hover:bg-[var(--blue)]/90"
          >
            + Add
          </button>
        </div>
        
        <div className="space-y-4">
          {Array.isArray(resumeContent.projects) && resumeContent.projects.map((proj, index) => (
            <div key={index} className="p-4 bg-[var(--bg)] rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs text-[var(--muted)]">Project #{index + 1}</span>
                <button onClick={() => removeProject(index)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={proj.title}
                  onChange={(e) => updateProject(index, 'title', e.target.value)}
                  placeholder="Project Title"
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                />
                <input
                  type="text"
                  value={proj.timeline || ''}
                  onChange={(e) => updateProject(index, 'timeline', e.target.value)}
                  placeholder="Timeline"
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                />
              </div>
              {/* Bullets */}
              <div className="space-y-2">
                <span className="text-xs text-[var(--muted)]">Bullet Points</span>
                {(proj.bullets || []).map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className="flex gap-2">
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => updateProjectBullet(index, bulletIndex, e.target.value)}
                      placeholder="Bullet point..."
                      className="flex-1 px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                    />
                    <button onClick={() => removeProjectBullet(index, bulletIndex)} className="px-2 text-red-400 hover:text-red-300">×</button>
                  </div>
                ))}
                <button onClick={() => addProjectBullet(index)} className="text-xs text-[var(--blue)] hover:text-[var(--blue)]/80">+ Add Bullet</button>
              </div>
            </div>
          ))}
          {(!resumeContent.projects || resumeContent.projects.length === 0) && (
            <p className="text-[var(--muted)] text-sm">No project entries. Click &quot;+ Add&quot; to add one.</p>
          )}
        </div>
      </section>

      {/* Leadership Section */}
      <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text)]">Leadership</h2>
          <button
            onClick={addLeadership}
            className="px-3 py-1 text-sm bg-[var(--blue)] text-white rounded-lg hover:bg-[var(--blue)]/90"
          >
            + Add
          </button>
        </div>
        
        {/* Icon and Color Selection */}
        <div className="mb-4 p-3 bg-[var(--bg)] rounded-lg space-y-3">
          <div>
            <span className="text-xs text-[var(--muted)] block mb-2">Icon</span>
            <div className="flex flex-wrap gap-1">
              {SECTION_ICONS.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => updateSectionConfig('leadership', { icon: icon.id })}
                  className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-colors ${
                    getSectionConfig('leadership').icon === icon.id
                      ? 'bg-[var(--blue)] text-white'
                      : 'bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface)]/80'
                  }`}
                  title={icon.label}
                >
                  {icon.icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-[var(--muted)] block mb-2">Color</span>
            <div className="flex flex-wrap gap-1">
              {SECTION_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => updateSectionConfig('leadership', { color: color.id })}
                  className={`w-6 h-6 rounded-full ${color.class} transition-transform ${
                    getSectionConfig('leadership').color === color.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--bg)] scale-110' : ''
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {Array.isArray(resumeContent.leadership) && resumeContent.leadership.map((lead, index) => (
            <div key={index} className="p-4 bg-[var(--bg)] rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs text-[var(--muted)]">Leadership #{index + 1}</span>
                <button onClick={() => removeLeadership(index)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
              </div>
              <input
                type="text"
                value={lead.title}
                onChange={(e) => updateLeadership(index, 'title', e.target.value)}
                placeholder="Organization/Title"
                className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
              />
              <input
                type="text"
                value={lead.role}
                onChange={(e) => updateLeadership(index, 'role', e.target.value)}
                placeholder="Role"
                className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={lead.timeline || ''}
                  onChange={(e) => updateLeadership(index, 'timeline', e.target.value)}
                  placeholder="Timeline (e.g., Sep 2025 - Present)"
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                />
                <input
                  type="text"
                  value={lead.location || ''}
                  onChange={(e) => updateLeadership(index, 'location', e.target.value)}
                  placeholder="Location"
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                />
              </div>
              <input
                type="text"
                value={lead.details || ''}
                onChange={(e) => updateLeadership(index, 'details', e.target.value)}
                placeholder="Details/Description"
                className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
              />
              {/* Custom Fields */}
              {lead.customFields && lead.customFields.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--surface)]">
                  <span className="text-xs text-[var(--muted)]">Custom Fields</span>
                  {lead.customFields.map((field, fieldIndex) => (
                    <div key={fieldIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) => updateLeadershipCustomField(index, fieldIndex, e.target.value, field.value)}
                        placeholder="Field name"
                        className="w-1/3 px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => updateLeadershipCustomField(index, fieldIndex, field.key, e.target.value)}
                        placeholder="Value"
                        className="flex-1 px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                      />
                      <button
                        onClick={() => removeLeadershipCustomField(index, fieldIndex)}
                        className="px-2 text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => addLeadershipCustomField(index)}
                className="text-xs text-[var(--blue)] hover:text-[var(--blue)]/80"
              >
                + Add Custom Field
              </button>
            </div>
          ))}
          {resumeContent.leadership.length === 0 && (
            <p className="text-[var(--muted)] text-sm">No leadership entries. Click &quot;+ Add&quot; to add one.</p>
          )}
        </div>
      </section>

      {/* Awards Section */}
      <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Awards</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {Array.isArray(resumeContent.awards) && resumeContent.awards.map((award, index) => (
            <span
              key={index}
              className="px-3 py-1.5 text-sm bg-[var(--bg)] text-[var(--text)] rounded-lg border border-[var(--surface)] flex items-center gap-2"
            >
              {award}
              <button onClick={() => removeAward(index)} className="text-[var(--muted)] hover:text-red-400">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newAward}
            onChange={(e) => setNewAward(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAward())}
            placeholder="Add an award"
            className="flex-1 px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
          />
          <button onClick={addAward} className="px-4 py-2 bg-[var(--blue)] text-white text-sm rounded-lg hover:bg-[var(--blue)]/90">
            Add
          </button>
        </div>
      </section>

      {/* Custom Sections */}
      {resumeContent.customSections && resumeContent.customSections.map((section, sectionIndex) => (
        <section key={section.id} className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={section.name}
                onChange={(e) => updateCustomSectionName(sectionIndex, e.target.value)}
                placeholder="Section Name (e.g., Research)"
                className="text-lg font-semibold bg-transparent text-[var(--text)] border-b border-transparent hover:border-[var(--surface)] focus:border-[var(--blue)] focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => addCustomSectionItem(sectionIndex)}
                className="px-3 py-1 text-sm bg-[var(--blue)] text-white rounded-lg hover:bg-[var(--blue)]/90"
              >
                + Add
              </button>
              <button
                onClick={() => removeCustomSection(sectionIndex)}
                className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
              >
                Remove
              </button>
            </div>
          </div>
          
          {/* Icon and Color Selection */}
          <div className="mb-4 p-3 bg-[var(--bg)] rounded-lg space-y-3">
            <div>
              <span className="text-xs text-[var(--muted)] block mb-2">Icon</span>
              <div className="flex flex-wrap gap-1">
                {SECTION_ICONS.map((icon) => (
                  <button
                    key={icon.id}
                    onClick={() => updateCustomSectionIcon(sectionIndex, icon.id)}
                    className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-colors ${
                      (section.icon || 'list') === icon.id
                        ? 'bg-[var(--blue)] text-white'
                        : 'bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface)]/80'
                    }`}
                    title={icon.label}
                  >
                    {icon.icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs text-[var(--muted)] block mb-2">Color</span>
              <div className="flex flex-wrap gap-1">
                {SECTION_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => updateCustomSectionColor(sectionIndex, color.id)}
                    className={`w-6 h-6 rounded-full ${color.class} transition-transform ${
                      (section.color || 'blue') === color.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--bg)] scale-110' : ''
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {section.items.map((item, itemIndex) => (
              <div key={itemIndex} className="p-4 bg-[var(--bg)] rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-[var(--muted)]">{section.name || 'Item'} #{itemIndex + 1}</span>
                  <button onClick={() => removeCustomSectionItem(sectionIndex, itemIndex)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                </div>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateCustomSectionItem(sectionIndex, itemIndex, 'title', e.target.value)}
                  placeholder="Title/Organization"
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                />
                <input
                  type="text"
                  value={item.role}
                  onChange={(e) => updateCustomSectionItem(sectionIndex, itemIndex, 'role', e.target.value)}
                  placeholder="Role/Description"
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                />
                {/* Custom Fields */}
                {item.customFields && item.customFields.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[var(--surface)]">
                    <span className="text-xs text-[var(--muted)]">Custom Fields</span>
                    {item.customFields.map((field, fieldIndex) => (
                      <div key={fieldIndex} className="flex gap-2">
                        <input
                          type="text"
                          value={field.key}
                          onChange={(e) => updateCustomSectionItemCustomField(sectionIndex, itemIndex, fieldIndex, e.target.value, field.value)}
                          placeholder="Field name"
                          className="w-1/3 px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                        />
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => updateCustomSectionItemCustomField(sectionIndex, itemIndex, fieldIndex, field.key, e.target.value)}
                          placeholder="Value"
                          className="flex-1 px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm"
                        />
                        <button
                          onClick={() => removeCustomSectionItemCustomField(sectionIndex, itemIndex, fieldIndex)}
                          className="px-2 text-red-400 hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => addCustomSectionItemCustomField(sectionIndex, itemIndex)}
                  className="text-xs text-[var(--blue)] hover:text-[var(--blue)]/80"
                >
                  + Add Custom Field
                </button>
              </div>
            ))}
            {section.items.length === 0 && (
              <p className="text-[var(--muted)] text-sm">No items. Click &quot;+ Add&quot; to add one.</p>
            )}
          </div>
        </section>
      ))}

      {/* Add Custom Section Button */}
      <button
        onClick={addCustomSection}
        className="w-full py-3 border-2 border-dashed border-[var(--surface)] rounded-lg text-[var(--muted)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors"
      >
        + Add Custom Section
      </button>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Resume Content'}
        </button>
      </div>
    </div>
  );
}

// Contact Page Tab Component
function ContactPageTab({
  contactPage,
  setContactPage,
  isSaving,
  onSave,
}: {
  contactPage: ContactPage;
  setContactPage: (v: ContactPage) => void;
  isSaving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="space-y-6">
      <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Page Header</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Page Heading</label>
            <input
              type="text"
              value={contactPage.heading}
              onChange={(e) => setContactPage({ ...contactPage, heading: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)]"
              placeholder="Get in Touch"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Subheading</label>
            <textarea
              value={contactPage.subheading}
              onChange={(e) => setContactPage({ ...contactPage, subheading: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] resize-none"
              placeholder="Have a question, opportunity, or just want to say hi?"
            />
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Section Headings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Form Section Heading</label>
            <input
              type="text"
              value={contactPage.form_heading}
              onChange={(e) => setContactPage({ ...contactPage, form_heading: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)]"
              placeholder="Send a Message"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Connect Section Heading</label>
            <input
              type="text"
              value={contactPage.connect_heading}
              onChange={(e) => setContactPage({ ...contactPage, connect_heading: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)]"
              placeholder="Other Ways to Connect"
            />
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Response Time Section</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Heading</label>
            <input
              type="text"
              value={contactPage.response_time_heading}
              onChange={(e) => setContactPage({ ...contactPage, response_time_heading: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)]"
              placeholder="Response Time"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Text</label>
            <textarea
              value={contactPage.response_time_text}
              onChange={(e) => setContactPage({ ...contactPage, response_time_text: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] resize-none"
              placeholder="I typically respond within 24-48 hours..."
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Contact Page'}
        </button>
      </div>
    </div>
  );
}

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 font-medium mb-2">Something went wrong</p>
          <p className="text-red-400/70 text-sm">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
