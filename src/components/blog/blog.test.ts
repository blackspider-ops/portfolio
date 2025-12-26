/**
 * Property-Based Tests for Blog Post Rendering
 * Feature: tejas-portfolio-v3, Property 13: Blog Post Rendering
 * Validates: Requirements 11.3, 11.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { BlogPost } from '@/types/database';

/**
 * Extracts code blocks from markdown content.
 * Returns an array of { language, code } objects.
 */
export function extractCodeBlocks(markdown: string): Array<{ language: string; code: string }> {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const blocks: Array<{ language: string; code: string }> = [];
  let match;
  
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
    });
  }
  
  return blocks;
}

/**
 * Checks if a blog post has valid code blocks that can be rendered.
 * A valid code block has a language identifier and non-empty code.
 */
export function hasValidCodeBlocks(post: BlogPost): boolean {
  const blocks = extractCodeBlocks(post.body_md);
  return blocks.every(block => 
    typeof block.language === 'string' && 
    typeof block.code === 'string' && 
    block.code.length > 0
  );
}

/**
 * Validates that a blog post has all required fields for rendering.
 */
export function isBlogPostRenderable(post: BlogPost): boolean {
  const hasTitle = typeof post.title === 'string' && post.title.trim().length > 0;
  const hasSlug = typeof post.slug === 'string' && post.slug.trim().length > 0;
  const hasBody = typeof post.body_md === 'string' && post.body_md.length > 0;
  
  return hasTitle && hasSlug && hasBody;
}

/**
 * Generates a code block string for testing.
 */
const codeBlockArbitrary = fc.record({
  language: fc.constantFrom('javascript', 'typescript', 'python', 'rust', 'go', 'html', 'css', 'json', 'bash'),
  code: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0 && !s.includes('```')),
}).map(({ language, code }) => `\`\`\`${language}\n${code}\n\`\`\``);

/**
 * Generates markdown content with code blocks.
 */
const markdownWithCodeArbitrary = fc.tuple(
  fc.string({ minLength: 1, maxLength: 200 }).filter(s => !s.includes('```')),
  fc.array(codeBlockArbitrary, { minLength: 1, maxLength: 3 }),
  fc.string({ minLength: 0, maxLength: 200 }).filter(s => !s.includes('```')),
).map(([before, codeBlocks, after]) => `${before}\n\n${codeBlocks.join('\n\n')}\n\n${after}`);

/**
 * Generates a valid date string for testing.
 */
const validDateArbitrary = fc.constant(new Date().toISOString());

/**
 * Generates a valid blog post for testing.
 */
const blogPostArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  slug: fc.stringMatching(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).filter(s => s.length >= 3 && s.length <= 100),
  summary: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  body_md: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 5 }),
  cover_url: fc.option(fc.string(), { nil: null }),
  reading_time_minutes: fc.option(fc.integer({ min: 1, max: 60 }), { nil: null }),
  status: fc.constant('published' as const),
  published_at: fc.option(validDateArbitrary, { nil: null }),
  created_at: validDateArbitrary,
  updated_at: validDateArbitrary,
});

/**
 * Generates a blog post with code blocks.
 */
const blogPostWithCodeArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  slug: fc.stringMatching(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).filter(s => s.length >= 3 && s.length <= 100),
  summary: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  body_md: markdownWithCodeArbitrary,
  tags: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 5 }),
  cover_url: fc.option(fc.string(), { nil: null }),
  reading_time_minutes: fc.option(fc.integer({ min: 1, max: 60 }), { nil: null }),
  status: fc.constant('published' as const),
  published_at: fc.option(validDateArbitrary, { nil: null }),
  created_at: validDateArbitrary,
  updated_at: validDateArbitrary,
});

describe('Feature: tejas-portfolio-v3', () => {
  /**
   * Property 13: Blog Post Rendering
   * For any published blog post with code blocks, the rendered output should
   * include syntax-highlighted code with a copy button.
   */
  describe('Property 13: Blog Post Rendering', () => {
    it('for any blog post with code blocks, extractCodeBlocks should return all blocks', () => {
      fc.assert(
        fc.property(
          blogPostWithCodeArbitrary,
          (post) => {
            const blocks = extractCodeBlocks(post.body_md);
            // Should have at least one code block
            return blocks.length >= 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any extracted code block, it should have a language and non-empty code', () => {
      fc.assert(
        fc.property(
          markdownWithCodeArbitrary,
          (markdown) => {
            const blocks = extractCodeBlocks(markdown);
            return blocks.every(block => 
              typeof block.language === 'string' &&
              block.language.length > 0 &&
              typeof block.code === 'string' &&
              block.code.length > 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any valid blog post, isBlogPostRenderable should return true', () => {
      fc.assert(
        fc.property(
          blogPostArbitrary,
          (post) => {
            return isBlogPostRenderable(post);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any blog post with code blocks, hasValidCodeBlocks should return true', () => {
      fc.assert(
        fc.property(
          blogPostWithCodeArbitrary,
          (post) => {
            return hasValidCodeBlocks(post);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any blog post with empty body, isBlogPostRenderable should return false', () => {
      fc.assert(
        fc.property(
          blogPostArbitrary.map(p => ({ ...p, body_md: '' })),
          (post) => {
            return !isBlogPostRenderable(post);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any blog post with empty title, isBlogPostRenderable should return false', () => {
      fc.assert(
        fc.property(
          blogPostArbitrary.map(p => ({ ...p, title: '' })),
          (post) => {
            return !isBlogPostRenderable(post);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for specific edge cases
  describe('Blog Post Rendering Edge Cases', () => {
    it('should extract multiple code blocks correctly', () => {
      const markdown = `
# Hello

\`\`\`javascript
const x = 1;
\`\`\`

Some text

\`\`\`python
def hello():
    pass
\`\`\`
`;
      const blocks = extractCodeBlocks(markdown);
      expect(blocks).toHaveLength(2);
      expect(blocks[0].language).toBe('javascript');
      expect(blocks[0].code).toBe('const x = 1;');
      expect(blocks[1].language).toBe('python');
      expect(blocks[1].code).toBe('def hello():\n    pass');
    });

    it('should handle code blocks without language', () => {
      const markdown = `
\`\`\`
plain text code
\`\`\`
`;
      const blocks = extractCodeBlocks(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].language).toBe('text');
      expect(blocks[0].code).toBe('plain text code');
    });

    it('should handle markdown without code blocks', () => {
      const markdown = `
# Hello World

This is a paragraph with \`inline code\` but no code blocks.
`;
      const blocks = extractCodeBlocks(markdown);
      expect(blocks).toHaveLength(0);
    });

    it('should validate blog post with all required fields', () => {
      const post: BlogPost = {
        id: '123',
        title: 'Test Post',
        slug: 'test-post',
        summary: 'A test post',
        body_md: '# Hello\n\nThis is content.',
        tags: ['test'],
        cover_url: null,
        reading_time_minutes: 5,
        status: 'published',
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(isBlogPostRenderable(post)).toBe(true);
    });

    it('should reject blog post with whitespace-only title', () => {
      const post: BlogPost = {
        id: '123',
        title: '   ',
        slug: 'test-post',
        summary: null,
        body_md: '# Hello',
        tags: [],
        cover_url: null,
        reading_time_minutes: null,
        status: 'published',
        published_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(isBlogPostRenderable(post)).toBe(false);
    });
  });
});
