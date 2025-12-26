'use client';

import { useState, useTransition } from 'react';
import { submitContactForm, type ContactFormData, type ContactFormResult } from '@/app/contact/actions';
import { AdminLoginModal } from './AdminLoginModal';

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ContactFormResult | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    message: '',
    honeypot: '',
  });

  const isAdminTrigger = () => {
    return (
      formData.name.toLowerCase() === 'admin' &&
      formData.email.toLowerCase() === 'admin@access.com' &&
      formData.message.toLowerCase().includes('grant admin access')
    );
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Please enter your name';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Please enter your email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Please enter a message';
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Check for secret admin trigger
    if (isAdminTrigger()) {
      setShowAdminLogin(true);
      return;
    }

    startTransition(async () => {
      const response = await submitContactForm(formData);
      setResult(response);
      
      if (response.success) {
        setFormData({ name: '', email: '', message: '', honeypot: '' });
        setFieldErrors({});
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success message */}
        {result?.success && (
          <div className="p-4 bg-[var(--green)]/10 border border-[var(--green)]/30 rounded-lg">
            <p className="text-[var(--green)] flex items-center gap-2">
              <CheckIcon className="w-5 h-5" />
              Message sent successfully! I&apos;ll get back to you soon.
            </p>
          </div>
        )}

        {/* Error message */}
        {result?.error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 flex items-center gap-2">
              <AlertIcon className="w-5 h-5" />
              {result.error}
            </p>
          </div>
        )}

        {/* Honeypot field - hidden from humans, visible to bots */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="honeypot">Leave this field empty</label>
          <input
            type="text"
            id="honeypot"
            name="honeypot"
            value={formData.honeypot}
            onChange={handleChange}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* Name field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[var(--text)] mb-2">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            minLength={2}
            maxLength={100}
            className={`w-full px-4 py-3 bg-[var(--surface)] border rounded-lg
                       text-[var(--text)] placeholder-[var(--muted)]
                       focus:outline-none focus:ring-2 focus:ring-[var(--blue)] focus:border-transparent
                       transition-all ${fieldErrors.name ? 'border-red-400' : 'border-[var(--muted)]/20'}`}
            placeholder="Your name"
            disabled={isPending}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.name}</p>
          )}
        </div>

        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--text)] mb-2">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={`w-full px-4 py-3 bg-[var(--surface)] border rounded-lg
                       text-[var(--text)] placeholder-[var(--muted)]
                       focus:outline-none focus:ring-2 focus:ring-[var(--blue)] focus:border-transparent
                       transition-all ${fieldErrors.email ? 'border-red-400' : 'border-[var(--muted)]/20'}`}
            placeholder="your@email.com"
            disabled={isPending}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.email}</p>
          )}
        </div>

        {/* Message field */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-[var(--text)] mb-2">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            minLength={10}
            maxLength={5000}
            rows={6}
            className={`w-full px-4 py-3 bg-[var(--surface)] border rounded-lg
                       text-[var(--text)] placeholder-[var(--muted)] resize-y min-h-[150px]
                       focus:outline-none focus:ring-2 focus:ring-[var(--blue)] focus:border-transparent
                       transition-all ${fieldErrors.message ? 'border-red-400' : 'border-[var(--muted)]/20'}`}
            placeholder="What would you like to discuss?"
            disabled={isPending}
          />
          <div className="flex justify-between mt-1">
            {fieldErrors.message ? (
              <p className="text-sm text-red-400">{fieldErrors.message}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-[var(--muted)]">
              {formData.message.length}/5000
            </p>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full px-6 py-3 bg-[var(--blue)] text-[var(--bg)] rounded-lg font-medium
                     hover:opacity-90 transition-opacity
                     focus:outline-none focus:ring-2 focus:ring-[var(--blue)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <LoadingSpinner className="w-5 h-5" />
              Sending...
            </>
          ) : (
            <>
              <SendIcon className="w-5 h-5" />
              Send Message
            </>
          )}
        </button>
      </form>

      {/* Secret Admin Login Modal */}
      <AdminLoginModal 
        isOpen={showAdminLogin} 
        onClose={() => setShowAdminLogin(false)} 
      />
    </>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
