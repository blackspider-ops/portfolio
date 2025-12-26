/**
 * Input Sanitization Utilities
 * Validates and sanitizes user inputs to prevent XSS attacks
 * Requirements: 16.6
 */

// HTML entities that need to be escaped
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escapes HTML special characters to prevent XSS
 * @param text - The text to escape
 * @returns The escaped text
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Removes potentially dangerous HTML tags and attributes
 * Allows safe markdown-compatible HTML
 */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span',
  'sup', 'sub',
]);

const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'title', 'width', 'height']),
  code: new Set(['class']), // For language highlighting
  pre: new Set(['class']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan']),
};

// Dangerous patterns to remove
const DANGEROUS_PATTERNS = [
  // Script tags and event handlers
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  // Event handlers with various formats (on*=, on* =, etc.)
  /\bon\w+\s*=\s*["']?[^"'>\s]*["']?/gi,
  // JavaScript URLs
  /javascript:/gi,
  /vbscript:/gi,
  /data:/gi,
  // Expression and behavior
  /expression\s*\(/gi,
  /behavior\s*:/gi,
  // Import and binding
  /@import/gi,
  /binding\s*:/gi,
  // Meta refresh
  /<meta[^>]*http-equiv[^>]*refresh/gi,
  // Base tag
  /<base\b/gi,
  // Object, embed, iframe
  /<object\b/gi,
  /<embed\b/gi,
  /<iframe\b/gi,
  // Form elements that could be used for phishing
  /<form\b/gi,
  /<input\b/gi,
  /<button\b/gi,
  /<select\b/gi,
  /<textarea\b/gi,
  // SVG with potential script execution
  /<svg\b[^>]*\bon\w+/gi,
  // Style tags (can contain expressions)
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  // Alert function calls (common XSS payload)
  /alert\s*\([^)]*\)/gi,
];

/**
 * Sanitizes HTML content by removing dangerous patterns
 * @param html - The HTML content to sanitize
 * @returns The sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  let sanitized = html;

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized;
}

/**
 * Sanitizes Markdown content
 * Markdown is generally safe, but we need to handle embedded HTML
 * @param markdown - The markdown content to sanitize
 * @returns The sanitized markdown
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return '';

  let sanitized = markdown;

  // Remove dangerous HTML patterns that might be embedded in markdown
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized;
}

/**
 * Validates and sanitizes a URL
 * Only allows http, https, and mailto protocols
 * @param url - The URL to validate
 * @returns The sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();

  // Check for dangerous protocols
  const lowerUrl = trimmed.toLowerCase();
  if (
    lowerUrl.startsWith('javascript:') ||
    lowerUrl.startsWith('vbscript:') ||
    lowerUrl.startsWith('data:') ||
    lowerUrl.startsWith('file:')
  ) {
    return '';
  }

  // Allow http, https, mailto, and relative URLs
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    !trimmed.includes(':')
  ) {
    return trimmed;
  }

  return '';
}

/**
 * Validates a slug format
 * @param slug - The slug to validate
 * @returns True if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  // Slug must be lowercase alphanumeric with hyphens, 3-100 chars
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugPattern.test(slug) && slug.length >= 3 && slug.length <= 100;
}

/**
 * Generates a safe slug from text
 * @param text - The text to convert to a slug
 * @returns A valid slug
 */
export function generateSlug(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .slice(0, 100); // Limit length
}

/**
 * Validates an email address format
 * @param email - The email to validate
 * @returns True if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  // Basic email validation pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email) && email.length <= 254;
}

/**
 * Sanitizes a string for safe display
 * Removes control characters and normalizes whitespace
 * @param text - The text to sanitize
 * @returns The sanitized text
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Validates and sanitizes admin input fields
 * @param input - The input object to validate
 * @param schema - The validation schema
 * @returns Object with sanitized values and validation errors
 */
export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'email' | 'url' | 'slug' | 'markdown' | 'html' | 'array';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
}

export interface ValidationResult<T> {
  data: T;
  errors: Record<string, string>;
  isValid: boolean;
}

export function validateAndSanitize<T extends Record<string, unknown>>(
  input: T,
  schema: ValidationSchema
): ValidationResult<T> {
  const errors: Record<string, string> = {};
  const data = { ...input } as T;

  for (const [field, rules] of Object.entries(schema)) {
    const value = input[field];

    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      continue;
    }

    // Skip validation if not required and empty
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type-specific validation and sanitization
    switch (rules.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors[field] = `${field} must be a string`;
        } else {
          const sanitized = sanitizeText(value);
          if (rules.minLength && sanitized.length < rules.minLength) {
            errors[field] = `${field} must be at least ${rules.minLength} characters`;
          } else if (rules.maxLength && sanitized.length > rules.maxLength) {
            errors[field] = `${field} must be at most ${rules.maxLength} characters`;
          } else if (rules.pattern && !rules.pattern.test(sanitized)) {
            errors[field] = `${field} has invalid format`;
          } else {
            (data as Record<string, unknown>)[field] = sanitized;
          }
        }
        break;

      case 'email':
        if (typeof value !== 'string') {
          errors[field] = `${field} must be a string`;
        } else if (!isValidEmail(value)) {
          errors[field] = `${field} must be a valid email address`;
        } else {
          (data as Record<string, unknown>)[field] = value.trim().toLowerCase();
        }
        break;

      case 'url':
        if (typeof value !== 'string') {
          errors[field] = `${field} must be a string`;
        } else {
          const sanitizedUrl = sanitizeUrl(value);
          if (value && !sanitizedUrl) {
            errors[field] = `${field} must be a valid URL`;
          } else {
            (data as Record<string, unknown>)[field] = sanitizedUrl;
          }
        }
        break;

      case 'slug':
        if (typeof value !== 'string') {
          errors[field] = `${field} must be a string`;
        } else if (!isValidSlug(value)) {
          errors[field] = `${field} must be a valid slug (lowercase letters, numbers, and hyphens)`;
        } else {
          (data as Record<string, unknown>)[field] = value;
        }
        break;

      case 'markdown':
        if (typeof value !== 'string') {
          errors[field] = `${field} must be a string`;
        } else {
          const sanitized = sanitizeMarkdown(value);
          if (rules.minLength && sanitized.length < rules.minLength) {
            errors[field] = `${field} must be at least ${rules.minLength} characters`;
          } else if (rules.maxLength && sanitized.length > rules.maxLength) {
            errors[field] = `${field} must be at most ${rules.maxLength} characters`;
          } else {
            (data as Record<string, unknown>)[field] = sanitized;
          }
        }
        break;

      case 'html':
        if (typeof value !== 'string') {
          errors[field] = `${field} must be a string`;
        } else {
          (data as Record<string, unknown>)[field] = sanitizeHtml(value);
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors[field] = `${field} must be an array`;
        } else {
          // Sanitize each string element in the array
          (data as Record<string, unknown>)[field] = value.map((item) =>
            typeof item === 'string' ? sanitizeText(item) : item
          );
        }
        break;
    }
  }

  return {
    data,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

// Validation schemas for common content types
export const blogPostSchema: ValidationSchema = {
  title: { type: 'string', required: true, minLength: 1, maxLength: 200 },
  slug: { type: 'slug', required: true },
  summary: { type: 'string', required: false, maxLength: 500 },
  body_md: { type: 'markdown', required: true, minLength: 1 },
  tags: { type: 'array', required: false },
  cover_url: { type: 'url', required: false },
};

export const projectSchema: ValidationSchema = {
  title: { type: 'string', required: true, minLength: 1, maxLength: 200 },
  slug: { type: 'slug', required: true },
  one_liner: { type: 'string', required: true, minLength: 1, maxLength: 300 },
  problem: { type: 'markdown', required: false },
  approach: { type: 'markdown', required: false },
  impact: { type: 'markdown', required: false },
  build_notes: { type: 'markdown', required: false },
  build_diagram_url: { type: 'url', required: false },
  cover_url: { type: 'url', required: false },
  stack: { type: 'array', required: false },
  tradeoffs: { type: 'array', required: false },
  improvements: { type: 'array', required: false },
};

export const contactFormSchema: ValidationSchema = {
  name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
  email: { type: 'email', required: true },
  message: { type: 'string', required: true, minLength: 10, maxLength: 5000 },
};
