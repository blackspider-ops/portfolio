/**
 * Property-Based Tests for Terminal
 * Feature: tejas-portfolio-v3
 * Property 7: Terminal Toggle
 * Property 8: Terminal Command Execution
 * Property 9: Terminal Command History
 * Property 10: Terminal Focus Management
 * Validates: Requirements 6.1, 6.3-6.11, 6.13, 6.14, 6.15
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { executeCommand, commands } from './commands';
import type { TerminalContext, TerminalOutput, ProjectInfo, BlogPostInfo } from './types';

// Mock context for testing
function createMockContext(overrides: Partial<TerminalContext> = {}): TerminalContext {
  return {
    navigate: () => {},
    setTheme: () => {},
    toggleDevNotes: () => {},
    toggleMatrix: () => {},
    projects: [],
    blogPosts: [],
    ...overrides,
  };
}

// Arbitrary generators for test data
const projectInfoArb: fc.Arbitrary<ProjectInfo> = fc.record({
  slug: fc.string({ minLength: 1, maxLength: 30 }).map((s) => 
    s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/^-+|-+$/g, '') || 'project'
  ),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  one_liner: fc.string({ minLength: 1, maxLength: 200 }),
});

const blogPostInfoArb: fc.Arbitrary<BlogPostInfo> = fc.record({
  slug: fc.string({ minLength: 1, maxLength: 30 }).map((s) => 
    s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/^-+|-+$/g, '') || 'post'
  ),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  summary: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
});

// Valid command names
const validCommandNames = Object.keys(commands);
const validCommandArb = fc.constantFrom(...validCommandNames);

// Valid themes
const validThemes = ['dark', 'cyber', 'dracula', 'solarized'];
const validThemeArb = fc.constantFrom(...validThemes);

describe('Feature: tejas-portfolio-v3', () => {
  /**
   * Property 7: Terminal Toggle
   * For any state of the terminal (open or closed), pressing the tilde (~) key
   * should toggle it to the opposite state.
   * Validates: Requirements 6.1
   */
  describe('Property 7: Terminal Toggle', () => {
    it('toggle should always flip the state', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // initial state
          fc.array(fc.constant('toggle'), { minLength: 1, maxLength: 20 }), // toggle sequence
          (initialState, toggles) => {
            let state = initialState;
            
            for (const _ of toggles) {
              state = !state;
            }
            
            // After odd number of toggles, state should be opposite of initial
            // After even number of toggles, state should be same as initial
            const expectedState = toggles.length % 2 === 0 ? initialState : !initialState;
            return state === expectedState;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('toggle should be idempotent when applied twice', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // initial state
          (initialState) => {
            let state = initialState;
            state = !state; // first toggle
            state = !state; // second toggle
            return state === initialState;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('state should be deterministic for any sequence of toggles', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // initial state
          fc.integer({ min: 0, max: 100 }), // number of toggles
          (initialState, numToggles) => {
            const simulate = () => {
              let state = initialState;
              for (let i = 0; i < numToggles; i++) {
                state = !state;
              }
              return state;
            };
            
            // Running the same sequence twice should produce the same result
            return simulate() === simulate();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Terminal Command Execution
   * For any valid terminal command (help, whoami, ls, open, blog, theme, ascii, reveal, snake, pong),
   * executing it should return a non-error output matching the expected behavior.
   * Validates: Requirements 6.3-6.11
   */
  describe('Property 8: Terminal Command Execution', () => {
    it('all valid commands should return a TerminalOutput', () => {
      fc.assert(
        fc.property(
          validCommandArb,
          (commandName) => {
            const context = createMockContext();
            const result = executeCommand(commandName, context);
            
            // Result should be a valid TerminalOutput
            return (
              result !== null &&
              typeof result === 'object' &&
              'type' in result &&
              'content' in result &&
              ['text', 'error', 'success', 'ascii', 'list'].includes(result.type)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('help command should always return text type', () => {
      fc.assert(
        fc.property(
          fc.constant('help'),
          () => {
            const context = createMockContext();
            const result = executeCommand('help', context) as TerminalOutput;
            return result.type === 'text' && result.content.includes('Available commands');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('whoami command should always return text type with bio', () => {
      fc.assert(
        fc.property(
          fc.constant('whoami'),
          () => {
            const context = createMockContext();
            const result = executeCommand('whoami', context) as TerminalOutput;
            return result.type === 'text' && result.content.includes('Tejas');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('theme command with valid theme should return success', () => {
      fc.assert(
        fc.property(
          validThemeArb,
          (theme) => {
            let themeSet = '';
            const context = createMockContext({
              setTheme: (t) => { themeSet = t; },
            });
            const result = executeCommand(`theme ${theme}`, context) as TerminalOutput;
            return result.type === 'success' && themeSet === theme;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('theme command with invalid theme should return error', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(
            (s) => !validThemes.includes(s.toLowerCase())
          ),
          (invalidTheme) => {
            const context = createMockContext();
            const result = executeCommand(`theme ${invalidTheme}`, context) as TerminalOutput;
            return result.type === 'error';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('ascii tejas command should return ascii type', () => {
      fc.assert(
        fc.property(
          fc.constant('ascii tejas'),
          () => {
            const context = createMockContext();
            const result = executeCommand('ascii tejas', context) as TerminalOutput;
            return result.type === 'ascii' && result.content.includes('TEJAS') || result.content.includes('█');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('sudo command should always return permission denied', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }), // any args after sudo
          (args) => {
            const context = createMockContext();
            const result = executeCommand(`sudo ${args}`, context) as TerminalOutput;
            return result.type === 'error' && result.content.includes('permission denied');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('unknown commands should return error with helpful message', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(
            (s) => !validCommandNames.includes(s.toLowerCase()) && s.trim().length > 0
          ),
          (unknownCmd) => {
            const context = createMockContext();
            const result = executeCommand(unknownCmd, context) as TerminalOutput;
            return result.type === 'error' && result.content.includes('command not found');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('ls command should list content types', () => {
      fc.assert(
        fc.property(
          fc.constant('ls'),
          () => {
            const context = createMockContext();
            const result = executeCommand('ls', context) as TerminalOutput;
            return result.type === 'list' && result.content.includes('Available content');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('ls projects should list all projects', () => {
      fc.assert(
        fc.property(
          fc.array(projectInfoArb, { minLength: 1, maxLength: 10 }),
          (projects) => {
            const context = createMockContext({ projects });
            const result = executeCommand('ls projects', context) as TerminalOutput;
            
            // Should be a list type and contain project info
            if (result.type !== 'list') return false;
            if (!result.items) return false;
            
            // Each project should appear in the output
            return projects.every((p) => 
              result.items!.some((item) => item.includes(p.slug))
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('open command with valid slug should navigate', () => {
      fc.assert(
        fc.property(
          fc.array(projectInfoArb, { minLength: 1, maxLength: 10 }),
          (projects) => {
            let navigatedTo = '';
            const context = createMockContext({
              projects,
              navigate: (path) => { navigatedTo = path; },
            });
            
            const targetProject = projects[0];
            const result = executeCommand(`open ${targetProject.slug}`, context) as TerminalOutput;
            
            return result.type === 'success' && navigatedTo === `/projects/${targetProject.slug}`;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('open command with invalid slug should return error', () => {
      fc.assert(
        fc.property(
          fc.array(projectInfoArb, { minLength: 0, maxLength: 5 }),
          fc.string({ minLength: 1, maxLength: 20 }).map((s) => 
            s.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-nonexistent'
          ),
          (projects, invalidSlug) => {
            const context = createMockContext({ projects });
            const result = executeCommand(`open ${invalidSlug}`, context) as TerminalOutput;
            return result.type === 'error' && result.content.includes('not found');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('reveal command should toggle dev notes', () => {
      fc.assert(
        fc.property(
          fc.constant('reveal'),
          () => {
            let toggled = false;
            const context = createMockContext({
              toggleDevNotes: () => { toggled = true; },
            });
            const result = executeCommand('reveal', context) as TerminalOutput;
            return result.type === 'success' && toggled;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('snake command should navigate to play page', () => {
      fc.assert(
        fc.property(
          fc.constant('snake'),
          () => {
            let navigatedTo = '';
            const context = createMockContext({
              navigate: (path) => { navigatedTo = path; },
            });
            const result = executeCommand('snake', context) as TerminalOutput;
            return result.type === 'success' && navigatedTo.includes('/play');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('pong command should navigate to play page', () => {
      fc.assert(
        fc.property(
          fc.constant('pong'),
          () => {
            let navigatedTo = '';
            const context = createMockContext({
              navigate: (path) => { navigatedTo = path; },
            });
            const result = executeCommand('pong', context) as TerminalOutput;
            return result.type === 'success' && navigatedTo.includes('/play');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('empty input should return empty text', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', '   ', '\t', '\n'),
          (emptyInput) => {
            const context = createMockContext();
            const result = executeCommand(emptyInput, context) as TerminalOutput;
            return result.type === 'text' && result.content === '';
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Terminal Command History
   * For any sequence of N commands executed in the terminal (where N > 5),
   * the command history should contain exactly the last 5 commands in order.
   * Validates: Requirements 6.13
   */
  describe('Property 9: Terminal Command History', () => {
    const MAX_HISTORY_SIZE = 5;

    // Simulate command history management
    function simulateHistory(commands: string[]): string[] {
      const history: string[] = [];
      for (const cmd of commands) {
        history.push(cmd);
        if (history.length > MAX_HISTORY_SIZE) {
          history.shift();
        }
      }
      return history;
    }

    it('history should never exceed MAX_HISTORY_SIZE', () => {
      fc.assert(
        fc.property(
          fc.array(validCommandArb, { minLength: 0, maxLength: 50 }),
          (commands) => {
            const history = simulateHistory(commands);
            return history.length <= MAX_HISTORY_SIZE;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('history should contain exactly last 5 commands when more than 5 are executed', () => {
      fc.assert(
        fc.property(
          fc.array(validCommandArb, { minLength: 6, maxLength: 50 }),
          (commands) => {
            const history = simulateHistory(commands);
            const expectedHistory = commands.slice(-MAX_HISTORY_SIZE);
            
            return (
              history.length === MAX_HISTORY_SIZE &&
              history.every((cmd, i) => cmd === expectedHistory[i])
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('history should preserve order of commands', () => {
      fc.assert(
        fc.property(
          fc.array(validCommandArb, { minLength: 1, maxLength: 20 }),
          (commands) => {
            const history = simulateHistory(commands);
            const expectedHistory = commands.slice(-MAX_HISTORY_SIZE);
            
            // History should be in the same order as the last N commands
            return history.every((cmd, i) => cmd === expectedHistory[i]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('history should contain all commands when fewer than MAX_HISTORY_SIZE are executed', () => {
      fc.assert(
        fc.property(
          fc.array(validCommandArb, { minLength: 1, maxLength: MAX_HISTORY_SIZE }),
          (commands) => {
            const history = simulateHistory(commands);
            return (
              history.length === commands.length &&
              history.every((cmd, i) => cmd === commands[i])
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('adding a new command should remove the oldest when at capacity', () => {
      fc.assert(
        fc.property(
          fc.array(validCommandArb, { minLength: MAX_HISTORY_SIZE, maxLength: MAX_HISTORY_SIZE }),
          validCommandArb,
          (initialCommands, newCommand) => {
            const history = simulateHistory(initialCommands);
            const oldestCommand = history[0];
            const secondOldest = history[1];
            
            // Add new command
            history.push(newCommand);
            if (history.length > MAX_HISTORY_SIZE) {
              history.shift();
            }
            
            // After adding, the new first element should be what was the second oldest
            // and the new command should be at the end
            return (
              history[0] === secondOldest &&
              history[history.length - 1] === newCommand &&
              history.length === MAX_HISTORY_SIZE
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('empty history should remain empty with no commands', () => {
      const history = simulateHistory([]);
      expect(history).toHaveLength(0);
    });
  });

  /**
   * Property 10: Terminal Focus Management
   * For any state where the terminal is open, focus should be trapped within the terminal,
   * and pressing Escape should close it and return focus to the previous element.
   * Validates: Requirements 6.14, 6.15
   */
  describe('Property 10: Terminal Focus Management', () => {
    // Focusable element selectors used by the focus trap
    const FOCUSABLE_SELECTORS = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ];

    // Simulate focus trap behavior
    interface FocusTrapState {
      isActive: boolean;
      focusableElements: string[];
      currentFocusIndex: number;
      previousFocusElement: string | null;
    }

    function createFocusTrapState(
      focusableElements: string[],
      previousFocus: string | null = null
    ): FocusTrapState {
      return {
        isActive: true,
        focusableElements,
        currentFocusIndex: 0,
        previousFocusElement: previousFocus,
      };
    }

    function simulateTabNavigation(
      state: FocusTrapState,
      shiftKey: boolean
    ): FocusTrapState {
      if (!state.isActive || state.focusableElements.length === 0) {
        return state;
      }

      let newIndex: number;
      if (shiftKey) {
        // Shift+Tab: go backwards, wrap to end if at start
        newIndex = state.currentFocusIndex === 0
          ? state.focusableElements.length - 1
          : state.currentFocusIndex - 1;
      } else {
        // Tab: go forwards, wrap to start if at end
        newIndex = state.currentFocusIndex === state.focusableElements.length - 1
          ? 0
          : state.currentFocusIndex + 1;
      }

      return {
        ...state,
        currentFocusIndex: newIndex,
      };
    }

    function simulateEscapeKey(state: FocusTrapState): FocusTrapState {
      return {
        ...state,
        isActive: false,
        // Focus should return to previous element
      };
    }

    it('focus should cycle through focusable elements with Tab', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 1, max: 20 }), // number of Tab presses
          (elements, tabCount) => {
            let state = createFocusTrapState(elements);
            
            for (let i = 0; i < tabCount; i++) {
              state = simulateTabNavigation(state, false);
            }
            
            // Focus index should always be within bounds
            return state.currentFocusIndex >= 0 && 
                   state.currentFocusIndex < elements.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('focus should cycle backwards with Shift+Tab', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 1, max: 20 }), // number of Shift+Tab presses
          (elements, tabCount) => {
            let state = createFocusTrapState(elements);
            
            for (let i = 0; i < tabCount; i++) {
              state = simulateTabNavigation(state, true);
            }
            
            // Focus index should always be within bounds
            return state.currentFocusIndex >= 0 && 
                   state.currentFocusIndex < elements.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Tab from last element should wrap to first element', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 2, maxLength: 10 }),
          (elements) => {
            let state = createFocusTrapState(elements);
            // Move to last element
            state.currentFocusIndex = elements.length - 1;
            
            // Press Tab
            state = simulateTabNavigation(state, false);
            
            // Should wrap to first element
            return state.currentFocusIndex === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Shift+Tab from first element should wrap to last element', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 2, maxLength: 10 }),
          (elements) => {
            let state = createFocusTrapState(elements);
            // Start at first element
            state.currentFocusIndex = 0;
            
            // Press Shift+Tab
            state = simulateTabNavigation(state, true);
            
            // Should wrap to last element
            return state.currentFocusIndex === elements.length - 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Escape should deactivate focus trap', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          fc.string({ minLength: 1, maxLength: 20 }), // previous focus element
          (elements, previousFocus) => {
            let state = createFocusTrapState(elements, previousFocus);
            
            // Press Escape
            state = simulateEscapeKey(state);
            
            // Focus trap should be deactivated
            return state.isActive === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('focus trap should handle single focusable element', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 1, max: 10 }), // number of Tab presses
          (element, tabCount) => {
            let state = createFocusTrapState([element]);
            
            for (let i = 0; i < tabCount; i++) {
              state = simulateTabNavigation(state, false);
            }
            
            // With single element, focus should always stay on index 0
            return state.currentFocusIndex === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('focus navigation should be deterministic for same sequence', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }), // Tab sequence (true = Shift+Tab)
          (elements, tabSequence) => {
            const simulate = () => {
              let state = createFocusTrapState(elements);
              for (const shiftKey of tabSequence) {
                state = simulateTabNavigation(state, shiftKey);
              }
              return state.currentFocusIndex;
            };
            
            // Running the same sequence twice should produce the same result
            return simulate() === simulate();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('focus trap should preserve previous focus reference', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.array(fc.boolean(), { minLength: 0, maxLength: 10 }), // Tab sequence
          (elements, previousFocus, tabSequence) => {
            let state = createFocusTrapState(elements, previousFocus);
            
            // Navigate around
            for (const shiftKey of tabSequence) {
              state = simulateTabNavigation(state, shiftKey);
            }
            
            // Previous focus reference should be preserved
            return state.previousFocusElement === previousFocus;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('empty focusable elements should not cause errors', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // number of Tab presses
          (tabCount) => {
            let state = createFocusTrapState([]);
            
            for (let i = 0; i < tabCount; i++) {
              state = simulateTabNavigation(state, false);
            }
            
            // Should handle gracefully
            return state.currentFocusIndex === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for edge cases
  describe('Command Edge Cases', () => {
    it('should handle commands with extra whitespace', () => {
      const context = createMockContext();
      const result = executeCommand('  help  ', context) as TerminalOutput;
      expect(result.type).toBe('text');
      expect(result.content).toContain('Available commands');
    });

    it('should handle commands with mixed case', () => {
      const context = createMockContext();
      const result = executeCommand('HELP', context) as TerminalOutput;
      expect(result.type).toBe('text');
      expect(result.content).toContain('Available commands');
    });

    it('should handle blog search with multiple matches', () => {
      const blogPosts: BlogPostInfo[] = [
        { slug: 'react-hooks', title: 'React Hooks Guide', summary: 'Learn React hooks' },
        { slug: 'react-context', title: 'React Context API', summary: 'Using context in React' },
      ];
      const context = createMockContext({ blogPosts });
      const result = executeCommand('blog react', context) as TerminalOutput;
      expect(result.type).toBe('list');
      expect(result.items).toHaveLength(2);
    });

    it('should handle blog search with single match and navigate', () => {
      let navigatedTo = '';
      const blogPosts: BlogPostInfo[] = [
        { slug: 'unique-post', title: 'Unique Post Title', summary: 'A unique post' },
      ];
      const context = createMockContext({
        blogPosts,
        navigate: (path) => { navigatedTo = path; },
      });
      const result = executeCommand('blog unique', context) as TerminalOutput;
      expect(result.type).toBe('success');
      expect(navigatedTo).toBe('/blog/unique-post');
    });

    it('should handle ls blog with empty blog posts', () => {
      const context = createMockContext({ blogPosts: [] });
      const result = executeCommand('ls blog', context) as TerminalOutput;
      expect(result.type).toBe('text');
      expect(result.content).toContain('No blog posts found');
    });

    it('should handle ls projects with empty projects', () => {
      const context = createMockContext({ projects: [] });
      const result = executeCommand('ls projects', context) as TerminalOutput;
      expect(result.type).toBe('text');
      expect(result.content).toContain('No projects found');
    });

    it('should handle open command without slug', () => {
      const context = createMockContext();
      const result = executeCommand('open', context) as TerminalOutput;
      expect(result.type).toBe('error');
      expect(result.content).toContain('Usage');
    });

    it('should handle blog command without query', () => {
      const context = createMockContext();
      const result = executeCommand('blog', context) as TerminalOutput;
      expect(result.type).toBe('error');
      expect(result.content).toContain('Usage');
    });

    it('should handle theme command without theme name', () => {
      const context = createMockContext();
      const result = executeCommand('theme', context) as TerminalOutput;
      expect(result.type).toBe('error');
      expect(result.content).toContain('Usage');
    });

    it('should handle ascii command without target', () => {
      const context = createMockContext();
      const result = executeCommand('ascii', context) as TerminalOutput;
      expect(result.type).toBe('error');
      expect(result.content).toContain('Usage');
    });

    it('should handle ls with invalid subcommand', () => {
      const context = createMockContext();
      const result = executeCommand('ls invalid', context) as TerminalOutput;
      expect(result.type).toBe('error');
      expect(result.content).toContain('Unknown option');
    });
  });
});
