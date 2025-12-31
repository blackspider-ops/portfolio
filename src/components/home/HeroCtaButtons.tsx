'use client';

import { useRouter } from 'next/navigation';
import { usePhoneMock } from '@/components/phone-mock';
import { useTerminal } from '@/components/terminal';

interface CtaConfig {
  primary_action?: 'phone_mock' | 'terminal' | 'link';
  primary_link?: string;
  secondary_action?: 'phone_mock' | 'terminal' | 'link';
  secondary_link?: string;
}

interface FeatureToggles {
  phone_mock?: boolean;
  terminal?: boolean;
  games?: boolean;
}

interface HeroCtaButtonsProps {
  primaryCtaText?: string;
  secondaryCtaText?: string;
  ctaConfig?: CtaConfig;
  featureToggles?: FeatureToggles;
}

export default function HeroCtaButtons({ 
  primaryCtaText, 
  secondaryCtaText, 
  ctaConfig,
  featureToggles 
}: HeroCtaButtonsProps) {
  const router = useRouter();
  const { open: openPhoneMock } = usePhoneMock();
  const { toggle: toggleTerminal } = useTerminal();

  const handleCtaAction = (action: 'phone_mock' | 'terminal' | 'link', link?: string) => {
    switch (action) {
      case 'phone_mock':
        // Only open if feature is enabled (default to true if not set)
        if (featureToggles?.phone_mock !== false) {
          openPhoneMock();
        }
        break;
      case 'terminal':
        // Only open if feature is enabled (default to true if not set)
        if (featureToggles?.terminal !== false) {
          toggleTerminal();
        }
        break;
      case 'link':
        if (link) {
          if (link.startsWith('http')) {
            window.open(link, '_blank');
          } else {
            router.push(link);
          }
        }
        break;
    }
  };

  // Check if a CTA should be shown based on its action and feature toggles
  const shouldShowCta = (action?: 'phone_mock' | 'terminal' | 'link') => {
    if (!action) return true;
    if (action === 'phone_mock' && featureToggles?.phone_mock === false) return false;
    if (action === 'terminal' && featureToggles?.terminal === false) return false;
    return true;
  };

  const showPrimary = primaryCtaText && shouldShowCta(ctaConfig?.primary_action);
  const showSecondary = secondaryCtaText && shouldShowCta(ctaConfig?.secondary_action);

  if (!showPrimary && !showSecondary) return null;

  return (
    <div className="flex flex-wrap gap-3" data-nosnippet>
      {showPrimary && (
        <button
          onClick={() => handleCtaAction(ctaConfig?.primary_action || 'phone_mock', ctaConfig?.primary_link)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-transparent border border-muted/30 rounded text-text text-sm font-mono tracking-wide hover:bg-surface hover:border-muted/50 transition-all"
        >
          <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {primaryCtaText}
          <svg className="w-3 h-3 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </button>
      )}

      {showSecondary && (
        <button
          onClick={() => handleCtaAction(ctaConfig?.secondary_action || 'phone_mock', ctaConfig?.secondary_link)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-transparent border border-muted/30 rounded text-text text-sm font-mono tracking-wide hover:bg-surface hover:border-muted/50 transition-all"
        >
          <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2" />
          </svg>
          {secondaryCtaText}
        </button>
      )}
    </div>
  );
}
