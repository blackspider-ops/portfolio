/**
 * Property-Based Tests for Contact Form Validation
 * Feature: tejas-portfolio-v3, Property 14: Contact Form Validation
 * Validates: Requirements 13.1
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates contact form data
 * Returns an object with validation result and error messages
 */
export function validateContactForm(data: {
  name: string;
  email: string;
  message: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Name validation
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters.');
  }
  if (data.name && data.name.length > 100) {
    errors.push('Name must be less than 100 characters.');
  }

  // Email validation
  if (!data.email || data.email.trim().length === 0) {
    errors.push('Email is required.');
  } else if (!isValidEmail(data.email)) {
    errors.push('Please enter a valid email address.');
  }

  // Message validation
  if (!data.message || data.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters.');
  }
  if (data.message && data.message.length > 5000) {
    errors.push('Message must be less than 5000 characters.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generates a valid email address
 */
const validEmailArbitrary = fc.tuple(
  fc.stringMatching(/^[a-z0-9]+$/),
  fc.stringMatching(/^[a-z0-9]+$/),
  fc.constantFrom('com', 'org', 'net', 'io', 'dev')
).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/**
 * Generates an invalid email address
 */
const invalidEmailArbitrary = fc.oneof(
  fc.constant(''),
  fc.constant('invalid'),
  fc.constant('no@domain'),
  fc.constant('@nodomain.com'),
  fc.constant('spaces in@email.com'),
  fc.string().filter(s => !s.includes('@') || !s.includes('.'))
);

/**
 * Generates a valid name (2-100 characters)
 */
const validNameArbitrary = fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2);

/**
 * Generates a valid message (10-5000 characters)
 */
const validMessageArbitrary = fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10);

/**
 * Generates valid contact form data
 */
const validContactFormArbitrary = fc.record({
  name: validNameArbitrary,
  email: validEmailArbitrary,
  message: validMessageArbitrary,
});

describe('Feature: tejas-portfolio-v3', () => {
  /**
   * Property 14: Contact Form Validation
   * For any contact form submission, if any required field (name, email, message)
   * is empty or email format is invalid, the submission should be rejected
   * with appropriate error messages.
   */
  describe('Property 14: Contact Form Validation', () => {
    it('for any valid contact form data, validation should pass', () => {
      fc.assert(
        fc.property(
          validContactFormArbitrary,
          (data) => {
            const result = validateContactForm(data);
            return result.valid === true && result.errors.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any contact form with empty name, validation should fail', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.constantFrom('', ' ', '  '),
            email: validEmailArbitrary,
            message: validMessageArbitrary,
          }),
          (data) => {
            const result = validateContactForm(data);
            return result.valid === false && result.errors.some(e => e.includes('Name'));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any contact form with short name, validation should fail', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ maxLength: 1 }),
            email: validEmailArbitrary,
            message: validMessageArbitrary,
          }),
          (data) => {
            const result = validateContactForm(data);
            return result.valid === false && result.errors.some(e => e.includes('Name'));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any contact form with invalid email, validation should fail', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: validNameArbitrary,
            email: invalidEmailArbitrary,
            message: validMessageArbitrary,
          }),
          (data) => {
            const result = validateContactForm(data);
            return result.valid === false && result.errors.some(e => e.toLowerCase().includes('email'));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any contact form with empty message, validation should fail', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: validNameArbitrary,
            email: validEmailArbitrary,
            message: fc.constantFrom('', ' ', '  ', 'short'),
          }),
          (data) => {
            const result = validateContactForm(data);
            return result.valid === false && result.errors.some(e => e.includes('Message'));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any valid email format, isValidEmail should return true', () => {
      fc.assert(
        fc.property(
          validEmailArbitrary,
          (email) => {
            return isValidEmail(email) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any invalid email format, isValidEmail should return false', () => {
      fc.assert(
        fc.property(
          invalidEmailArbitrary,
          (email) => {
            return isValidEmail(email) === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for specific edge cases
  describe('Contact Form Validation Edge Cases', () => {
    it('should accept valid form data', () => {
      const result = validateContactForm({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message that is long enough.',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty name', () => {
      const result = validateContactForm({
        name: '',
        email: 'john@example.com',
        message: 'This is a test message that is long enough.',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name must be at least 2 characters.');
    });

    it('should reject whitespace-only name', () => {
      const result = validateContactForm({
        name: '   ',
        email: 'john@example.com',
        message: 'This is a test message that is long enough.',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name must be at least 2 characters.');
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = ['invalid', 'no@domain', '@nodomain.com', 'test@', ''];
      
      invalidEmails.forEach(email => {
        const result = validateContactForm({
          name: 'John Doe',
          email,
          message: 'This is a test message that is long enough.',
        });
        expect(result.valid).toBe(false);
      });
    });

    it('should reject short message', () => {
      const result = validateContactForm({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Short',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message must be at least 10 characters.');
    });

    it('should reject message over 5000 characters', () => {
      const result = validateContactForm({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'a'.repeat(5001),
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message must be less than 5000 characters.');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const result = validateContactForm({
        name: '',
        email: 'invalid',
        message: 'short',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
