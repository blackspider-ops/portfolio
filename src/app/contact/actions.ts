'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { validateAndSanitize, contactFormSchema } from '@/lib/sanitize';

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
  honeypot?: string; // Should be empty if human
}

export interface ContactFormResult {
  success: boolean;
  error?: string;
}

/**
 * Hashes IP address for privacy-preserving rate limiting
 */
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

/**
 * Server action to submit contact form
 * Implements honeypot spam prevention, input sanitization, and rate limiting (3/hour/IP)
 * Requirements: 13.1-13.4, 16.6
 */
export async function submitContactForm(data: ContactFormData): Promise<ContactFormResult> {
  try {
    // Honeypot check - if filled, it's likely a bot
    if (data.honeypot && data.honeypot.trim().length > 0) {
      // Silently succeed to not alert bots
      return { success: true };
    }

    // Validate and sanitize inputs using the sanitization utility
    const validationResult = validateAndSanitize(
      {
        name: data.name,
        email: data.email,
        message: data.message,
      },
      contactFormSchema
    );

    if (!validationResult.isValid) {
      // Return the first validation error
      const firstError = Object.values(validationResult.errors)[0];
      return { success: false, error: firstError };
    }

    // Use sanitized data
    const sanitizedData = validationResult.data;

    // Get IP for rate limiting
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIP = headersList.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIP || 'unknown';
    const ipHash = hashIP(ip);

    const supabase = await createClient();

    // Check rate limit (3 per hour per IP)
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count, error: countError } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', oneHourAgo);

    if (countError) {
      console.error('Error checking rate limit:', countError);
      return { success: false, error: 'An error occurred. Please try again later.' };
    }

    if (count !== null && count >= 3) {
      return { success: false, error: 'Too many submissions. Please try again later.' };
    }

    // Insert contact message with sanitized data
    const { error: insertError } = await supabase
      .from('contact_messages')
      .insert({
        name: sanitizedData.name as string,
        email: sanitizedData.email as string,
        message: sanitizedData.message as string,
        ip_hash: ipHash,
      });

    if (insertError) {
      console.error('Error inserting contact message:', insertError);
      return { success: false, error: 'Failed to send message. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Contact form error:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}
