/**
 * Tests for Input Sanitization Utilities
 * Validates: Requirements 16.6
 */

import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  sanitizeHtml,
  sanitizeMarkdown,
  sanitizeUrl,
  isValidSlug,
  generateSlug,
  isValidEmail,
  sanitizeText,
  validateAndSanitize,
  blogPostSchema,
  projectSchema,
  contactFormSchema,
} from './sanitize';

describe('Input Sanitization', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape quotes', () => {
      expect(escapeHtml('He said "hello"')).toBe('He said &quot;hello&quot;');
    });

    it('should handle empty strings', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(escapeHtml(null as unknown as string)).toBe('');
      expect(escapeHtml(undefined as unknown as string)).toBe('');
    });

    it('should escape backticks and equals', () => {
      expect(escapeHtml('`code` = value')).toBe('&#x60;code&#x60; &#x3D; value');
    });
  });

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
      expect(sanitizeHtml(input)).toBe('<p>Hello</p><p>World</p>');
    });

    it('should remove event handlers', () => {
      const input = '<img src="x" onerror="alert(1)">';
      expect(sanitizeHtml(input)).not.toContain('onerror');
    });

    it('should remove javascript: URLs', () => {
      const input = '<a href="javascript:alert(1)">Click</a>';
      expect(sanitizeHtml(input)).not.toContain('javascript:');
    });

    it('should remove style tags', () => {
      const input = '<style>body { background: url("javascript:alert(1)") }</style>';
      expect(sanitizeHtml(input)).toBe('');
    });

    it('should remove iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>';
      expect(sanitizeHtml(input)).not.toContain('<iframe');
    });

    it('should remove form elements', () => {
      const input = '<form action="evil.com"><input type="text"></form>';
      expect(sanitizeHtml(input)).not.toContain('<form');
      expect(sanitizeHtml(input)).not.toContain('<input');
    });

    it('should remove null bytes', () => {
      const input = 'Hello\0World';
      expect(sanitizeHtml(input)).toBe('HelloWorld');
    });

    it('should handle empty strings', () => {
      expect(sanitizeHtml('')).toBe('');
    });
  });

  describe('sanitizeMarkdown', () => {
    it('should preserve valid markdown', () => {
      const input = '# Hello\n\nThis is **bold** and *italic*.';
      expect(sanitizeMarkdown(input)).toBe(input);
    });

    it('should remove embedded script tags', () => {
      const input = '# Title\n\n<script>alert("xss")</script>\n\nContent';
      expect(sanitizeMarkdown(input)).not.toContain('<script');
    });

    it('should remove event handlers in embedded HTML', () => {
      const input = '# Title\n\n<img src="x" onerror="alert(1)">\n\nContent';
      expect(sanitizeMarkdown(input)).not.toContain('onerror');
    });

    it('should preserve code blocks', () => {
      const input = '```javascript\nconst x = 1;\n```';
      expect(sanitizeMarkdown(input)).toBe(input);
    });

    it('should preserve inline code', () => {
      const input = 'Use `const` for constants.';
      expect(sanitizeMarkdown(input)).toBe(input);
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow https URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should allow http URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should allow mailto URLs', () => {
      expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    });

    it('should allow relative URLs', () => {
      expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
    });

    it('should allow hash URLs', () => {
      expect(sanitizeUrl('#section')).toBe('#section');
    });

    it('should reject javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    });

    it('should reject vbscript: URLs', () => {
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('');
    });

    it('should reject data: URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('should reject file: URLs', () => {
      expect(sanitizeUrl('file:///etc/passwd')).toBe('');
    });

    it('should handle case-insensitive protocol check', () => {
      expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('');
      expect(sanitizeUrl('JavaScript:alert(1)')).toBe('');
    });

    it('should trim whitespace', () => {
      expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com');
    });

    it('should handle empty strings', () => {
      expect(sanitizeUrl('')).toBe('');
    });
  });

  describe('isValidSlug', () => {
    it('should accept valid slugs', () => {
      expect(isValidSlug('hello-world')).toBe(true);
      expect(isValidSlug('my-project-123')).toBe(true);
      expect(isValidSlug('abc')).toBe(true);
    });

    it('should reject slugs with uppercase', () => {
      expect(isValidSlug('Hello-World')).toBe(false);
    });

    it('should reject slugs with special characters', () => {
      expect(isValidSlug('hello_world')).toBe(false);
      expect(isValidSlug('hello.world')).toBe(false);
      expect(isValidSlug('hello world')).toBe(false);
    });

    it('should reject slugs that are too short', () => {
      expect(isValidSlug('ab')).toBe(false);
    });

    it('should reject slugs that are too long', () => {
      expect(isValidSlug('a'.repeat(101))).toBe(false);
    });

    it('should reject slugs starting or ending with hyphens', () => {
      expect(isValidSlug('-hello')).toBe(false);
      expect(isValidSlug('hello-')).toBe(false);
    });

    it('should reject consecutive hyphens', () => {
      expect(isValidSlug('hello--world')).toBe(false);
    });
  });

  describe('generateSlug', () => {
    it('should convert text to lowercase', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      expect(generateSlug('my project name')).toBe('my-project-name');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Hello! World?')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
      expect(generateSlug('hello   world')).toBe('hello-world');
    });

    it('should trim leading/trailing hyphens', () => {
      expect(generateSlug('  hello world  ')).toBe('hello-world');
    });

    it('should limit length to 100 characters', () => {
      const longText = 'a'.repeat(150);
      expect(generateSlug(longText).length).toBeLessThanOrEqual(100);
    });

    it('should handle empty strings', () => {
      expect(generateSlug('')).toBe('');
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@.com')).toBe(false);
    });

    it('should reject emails with spaces', () => {
      expect(isValidEmail('test @example.com')).toBe(false);
    });

    it('should reject very long emails', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(isValidEmail(longEmail)).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('sanitizeText', () => {
    it('should remove control characters', () => {
      expect(sanitizeText('Hello\x00World')).toBe('HelloWorld');
      expect(sanitizeText('Test\x1FText')).toBe('TestText');
    });

    it('should normalize whitespace', () => {
      expect(sanitizeText('Hello   World')).toBe('Hello World');
      expect(sanitizeText('Hello\n\nWorld')).toBe('Hello World');
      expect(sanitizeText('Hello\t\tWorld')).toBe('Hello World');
    });

    it('should trim leading/trailing whitespace', () => {
      expect(sanitizeText('  Hello World  ')).toBe('Hello World');
    });

    it('should handle empty strings', () => {
      expect(sanitizeText('')).toBe('');
    });
  });

  describe('validateAndSanitize', () => {
    describe('blogPostSchema', () => {
      it('should validate a valid blog post', () => {
        const input = {
          title: 'My Blog Post',
          slug: 'my-blog-post',
          summary: 'A summary',
          body_md: '# Hello\n\nThis is content.',
          tags: ['javascript', 'react'],
          cover_url: 'https://example.com/image.jpg',
        };

        const result = validateAndSanitize(input, blogPostSchema);
        expect(result.isValid).toBe(true);
        expect(Object.keys(result.errors)).toHaveLength(0);
      });

      it('should reject missing required fields', () => {
        const input = {
          title: '',
          slug: '',
          body_md: '',
        };

        const result = validateAndSanitize(input, blogPostSchema);
        expect(result.isValid).toBe(false);
        expect(result.errors.title).toBeDefined();
        expect(result.errors.slug).toBeDefined();
        expect(result.errors.body_md).toBeDefined();
      });

      it('should reject invalid slug', () => {
        const input = {
          title: 'My Post',
          slug: 'Invalid Slug!',
          body_md: 'Content',
        };

        const result = validateAndSanitize(input, blogPostSchema);
        expect(result.isValid).toBe(false);
        expect(result.errors.slug).toBeDefined();
      });

      it('should sanitize markdown content', () => {
        const input = {
          title: 'My Post',
          slug: 'my-post',
          body_md: '# Hello<script>alert(1)</script>',
        };

        const result = validateAndSanitize(input, blogPostSchema);
        expect(result.isValid).toBe(true);
        expect(result.data.body_md).not.toContain('<script');
      });
    });

    describe('projectSchema', () => {
      it('should validate a valid project', () => {
        const input = {
          title: 'My Project',
          slug: 'my-project',
          one_liner: 'A cool project',
          problem: 'The problem',
          approach: 'The approach',
          impact: 'The impact',
          stack: ['React', 'Node.js'],
        };

        const result = validateAndSanitize(input, projectSchema);
        expect(result.isValid).toBe(true);
      });

      it('should reject missing required fields', () => {
        const input = {
          title: '',
          slug: '',
          one_liner: '',
        };

        const result = validateAndSanitize(input, projectSchema);
        expect(result.isValid).toBe(false);
        expect(result.errors.title).toBeDefined();
        expect(result.errors.slug).toBeDefined();
        expect(result.errors.one_liner).toBeDefined();
      });
    });

    describe('contactFormSchema', () => {
      it('should validate a valid contact form', () => {
        const input = {
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Hello, this is a test message.',
        };

        const result = validateAndSanitize(input, contactFormSchema);
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid email', () => {
        const input = {
          name: 'John Doe',
          email: 'invalid-email',
          message: 'Hello, this is a test message.',
        };

        const result = validateAndSanitize(input, contactFormSchema);
        expect(result.isValid).toBe(false);
        expect(result.errors.email).toBeDefined();
      });

      it('should reject short name', () => {
        const input = {
          name: 'J',
          email: 'john@example.com',
          message: 'Hello, this is a test message.',
        };

        const result = validateAndSanitize(input, contactFormSchema);
        expect(result.isValid).toBe(false);
        expect(result.errors.name).toBeDefined();
      });

      it('should reject short message', () => {
        const input = {
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Hi',
        };

        const result = validateAndSanitize(input, contactFormSchema);
        expect(result.isValid).toBe(false);
        expect(result.errors.message).toBeDefined();
      });

      it('should sanitize text inputs', () => {
        const input = {
          name: '  John\x00Doe  ',
          email: 'john@example.com',
          message: 'Hello,   this is a test message.',
        };

        const result = validateAndSanitize(input, contactFormSchema);
        expect(result.isValid).toBe(true);
        expect(result.data.name).toBe('JohnDoe');
        expect(result.data.message).toBe('Hello, this is a test message.');
      });
    });
  });

  describe('XSS Prevention', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      '<body onload=alert(1)>',
      '<iframe src="javascript:alert(1)">',
      '<a href="javascript:alert(1)">click</a>',
      '<div style="background:url(javascript:alert(1))">',
      '"><script>alert(1)</script>',
      "'-alert(1)-'",
      '<img src="x" onerror="alert(1)">',
      '<input onfocus=alert(1) autofocus>',
      '<marquee onstart=alert(1)>',
      '<video><source onerror="alert(1)">',
      '<details open ontoggle=alert(1)>',
    ];

    it('should sanitize all common XSS payloads in HTML', () => {
      for (const payload of xssPayloads) {
        const sanitized = sanitizeHtml(payload);
        expect(sanitized).not.toContain('alert');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onload');
        expect(sanitized).not.toContain('onfocus');
        expect(sanitized).not.toContain('onstart');
        expect(sanitized).not.toContain('ontoggle');
        expect(sanitized).not.toContain('javascript:');
      }
    });

    it('should sanitize all common XSS payloads in Markdown', () => {
      for (const payload of xssPayloads) {
        const sanitized = sanitizeMarkdown(payload);
        expect(sanitized).not.toContain('alert');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onload');
        expect(sanitized).not.toContain('onfocus');
        expect(sanitized).not.toContain('onstart');
        expect(sanitized).not.toContain('ontoggle');
        expect(sanitized).not.toContain('javascript:');
      }
    });

    it('should reject all dangerous URLs', () => {
      const dangerousUrls = [
        'javascript:alert(1)',
        'JAVASCRIPT:alert(1)',
        'vbscript:msgbox(1)',
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
      ];

      for (const url of dangerousUrls) {
        expect(sanitizeUrl(url)).toBe('');
      }
    });
  });
});
