/**
 * Property-Based Tests for Project Data Completeness
 * Feature: tejas-portfolio-v3, Property 12: Project Data Completeness
 * Validates: Requirements 10.1, 10.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Project } from '@/types/database';

/**
 * Validates that a project has all required fields populated.
 * A published project must have: title, slug, one_liner, and at least one of (problem, approach, impact).
 */
export function isProjectComplete(project: Project): boolean {
  // Required fields must be non-empty strings
  const hasTitle = typeof project.title === 'string' && project.title.trim().length > 0;
  const hasSlug = typeof project.slug === 'string' && project.slug.trim().length > 0;
  const hasOneLiner = typeof project.one_liner === 'string' && project.one_liner.trim().length > 0;
  
  // At least one of problem, approach, or impact must be present
  const hasProblem = typeof project.problem === 'string' && project.problem.trim().length > 0;
  const hasApproach = typeof project.approach === 'string' && project.approach.trim().length > 0;
  const hasImpact = typeof project.impact === 'string' && project.impact.trim().length > 0;
  const hasContent = hasProblem || hasApproach || hasImpact;
  
  return hasTitle && hasSlug && hasOneLiner && hasContent;
}

/**
 * Validates that a slug follows the correct format.
 * Slugs should be lowercase, alphanumeric with hyphens, no leading/trailing hyphens.
 */
export function isValidSlug(slug: string): boolean {
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugPattern.test(slug);
}

/**
 * Generates a valid project for testing.
 */
/**
 * Generates a valid date string for testing.
 */
const validDateArbitrary = fc.constant(new Date().toISOString());

/**
 * Generates a valid project for testing.
 */
const projectArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  slug: fc.stringMatching(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).filter(s => s.length >= 3 && s.length <= 100),
  one_liner: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
  problem: fc.option(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), { nil: null }),
  approach: fc.option(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), { nil: null }),
  impact: fc.option(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), { nil: null }),
  stack: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 10 }),
  links: fc.constant({}),
  build_notes: fc.option(fc.string(), { nil: null }),
  build_diagram_url: fc.option(fc.string(), { nil: null }),
  tradeoffs: fc.array(fc.string(), { maxLength: 5 }),
  improvements: fc.array(fc.string(), { maxLength: 5 }),
  cover_url: fc.option(fc.string(), { nil: null }),
  is_featured: fc.boolean(),
  sort_order: fc.integer({ min: 0, max: 100 }),
  status: fc.constant('published' as const),
  published_at: fc.option(validDateArbitrary, { nil: null }),
  created_at: validDateArbitrary,
  updated_at: validDateArbitrary,
});

/**
 * Generates a project that has at least one content field (problem, approach, or impact).
 */
const completeProjectArbitrary = projectArbitrary.filter(project => {
  const hasProblem = project.problem !== null && project.problem.trim().length > 0;
  const hasApproach = project.approach !== null && project.approach.trim().length > 0;
  const hasImpact = project.impact !== null && project.impact.trim().length > 0;
  return hasProblem || hasApproach || hasImpact;
});

describe('Feature: tejas-portfolio-v3', () => {
  /**
   * Property 12: Project Data Completeness
   * For any published project, it should have all required fields populated:
   * title, slug, one_liner, and at least one of (problem, approach, impact).
   */
  describe('Property 12: Project Data Completeness', () => {
    it('for any complete project, isProjectComplete should return true', () => {
      fc.assert(
        fc.property(
          completeProjectArbitrary,
          (project) => {
            return isProjectComplete(project);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any project with valid slug, isValidSlug should return true', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).filter(s => s.length >= 3 && s.length <= 100),
          (slug) => {
            return isValidSlug(slug);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any project missing all content fields, isProjectComplete should return false', () => {
      fc.assert(
        fc.property(
          projectArbitrary.map(p => ({
            ...p,
            problem: null,
            approach: null,
            impact: null,
          })),
          (project) => {
            return !isProjectComplete(project);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any project with empty title, isProjectComplete should return false', () => {
      fc.assert(
        fc.property(
          completeProjectArbitrary.map(p => ({
            ...p,
            title: '',
          })),
          (project) => {
            return !isProjectComplete(project);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any project with empty slug, isProjectComplete should return false', () => {
      fc.assert(
        fc.property(
          completeProjectArbitrary.map(p => ({
            ...p,
            slug: '',
          })),
          (project) => {
            return !isProjectComplete(project);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any project with empty one_liner, isProjectComplete should return false', () => {
      fc.assert(
        fc.property(
          completeProjectArbitrary.map(p => ({
            ...p,
            one_liner: '',
          })),
          (project) => {
            return !isProjectComplete(project);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for specific edge cases
  describe('Project Validation Edge Cases', () => {
    it('should accept project with only problem field', () => {
      const project: Project = {
        id: '123',
        title: 'Test Project',
        slug: 'test-project',
        one_liner: 'A test project',
        problem: 'The problem statement',
        approach: null,
        impact: null,
        stack: [],
        links: {},
        build_notes: null,
        build_diagram_url: null,
        tradeoffs: [],
        improvements: [],
        cover_url: null,
        is_featured: false,
        sort_order: 0,
        status: 'published',
        published_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(isProjectComplete(project)).toBe(true);
    });

    it('should accept project with only approach field', () => {
      const project: Project = {
        id: '123',
        title: 'Test Project',
        slug: 'test-project',
        one_liner: 'A test project',
        problem: null,
        approach: 'The approach',
        impact: null,
        stack: [],
        links: {},
        build_notes: null,
        build_diagram_url: null,
        tradeoffs: [],
        improvements: [],
        cover_url: null,
        is_featured: false,
        sort_order: 0,
        status: 'published',
        published_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(isProjectComplete(project)).toBe(true);
    });

    it('should accept project with only impact field', () => {
      const project: Project = {
        id: '123',
        title: 'Test Project',
        slug: 'test-project',
        one_liner: 'A test project',
        problem: null,
        approach: null,
        impact: 'The impact',
        stack: [],
        links: {},
        build_notes: null,
        build_diagram_url: null,
        tradeoffs: [],
        improvements: [],
        cover_url: null,
        is_featured: false,
        sort_order: 0,
        status: 'published',
        published_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(isProjectComplete(project)).toBe(true);
    });

    it('should reject whitespace-only title', () => {
      const project: Project = {
        id: '123',
        title: '   ',
        slug: 'test-project',
        one_liner: 'A test project',
        problem: 'Problem',
        approach: null,
        impact: null,
        stack: [],
        links: {},
        build_notes: null,
        build_diagram_url: null,
        tradeoffs: [],
        improvements: [],
        cover_url: null,
        is_featured: false,
        sort_order: 0,
        status: 'published',
        published_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(isProjectComplete(project)).toBe(false);
    });

    it('should validate slug format correctly', () => {
      expect(isValidSlug('my-project')).toBe(true);
      expect(isValidSlug('project123')).toBe(true);
      expect(isValidSlug('my-cool-project-2024')).toBe(true);
      expect(isValidSlug('My-Project')).toBe(false); // uppercase
      expect(isValidSlug('-my-project')).toBe(false); // leading hyphen
      expect(isValidSlug('my-project-')).toBe(false); // trailing hyphen
      expect(isValidSlug('my--project')).toBe(false); // double hyphen
      expect(isValidSlug('my project')).toBe(false); // space
    });
  });
});
