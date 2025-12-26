/**
 * Terminal Commands
 * Requirements: 6.3-6.12
 */

import type { TerminalCommand, TerminalOutput, TerminalContext } from './types';

// ASCII letter mappings for block-style text
const ASCII_LETTERS: Record<string, string[]> = {
  'A': ['  █  ', ' █ █ ', '█████', '█   █', '█   █'],
  'B': ['████ ', '█   █', '████ ', '█   █', '████ '],
  'C': [' ████', '█    ', '█    ', '█    ', ' ████'],
  'D': ['████ ', '█   █', '█   █', '█   █', '████ '],
  'E': ['█████', '█    ', '████ ', '█    ', '█████'],
  'F': ['█████', '█    ', '████ ', '█    ', '█    '],
  'G': [' ████', '█    ', '█  ██', '█   █', ' ████'],
  'H': ['█   █', '█   █', '█████', '█   █', '█   █'],
  'I': ['█████', '  █  ', '  █  ', '  █  ', '█████'],
  'J': ['█████', '   █ ', '   █ ', '█  █ ', ' ██  '],
  'K': ['█   █', '█  █ ', '███  ', '█  █ ', '█   █'],
  'L': ['█    ', '█    ', '█    ', '█    ', '█████'],
  'M': ['█   █', '██ ██', '█ █ █', '█   █', '█   █'],
  'N': ['█   █', '██  █', '█ █ █', '█  ██', '█   █'],
  'O': [' ███ ', '█   █', '█   █', '█   █', ' ███ '],
  'P': ['████ ', '█   █', '████ ', '█    ', '█    '],
  'Q': [' ███ ', '█   █', '█ █ █', '█  █ ', ' ██ █'],
  'R': ['████ ', '█   █', '████ ', '█  █ ', '█   █'],
  'S': [' ████', '█    ', ' ███ ', '    █', '████ '],
  'T': ['█████', '  █  ', '  █  ', '  █  ', '  █  '],
  'U': ['█   █', '█   █', '█   █', '█   █', ' ███ '],
  'V': ['█   █', '█   █', '█   █', ' █ █ ', '  █  '],
  'W': ['█   █', '█   █', '█ █ █', '██ ██', '█   █'],
  'X': ['█   █', ' █ █ ', '  █  ', ' █ █ ', '█   █'],
  'Y': ['█   █', ' █ █ ', '  █  ', '  █  ', '  █  '],
  'Z': ['█████', '   █ ', '  █  ', ' █   ', '█████'],
  ' ': ['     ', '     ', '     ', '     ', '     '],
};

// Generate block-style ASCII art for text
function generateAsciiArt(text: string): string {
  const upperText = text.toUpperCase();
  const lines: string[] = ['', '', '', '', ''];
  
  for (const char of upperText) {
    const letterArt = ASCII_LETTERS[char] || ASCII_LETTERS[' '];
    for (let i = 0; i < 5; i++) {
      lines[i] += letterArt[i] + ' ';
    }
  }
  
  return '\n' + lines.join('\n') + '\n';
}

// Valid themes for the theme command
const VALID_THEMES = ['dark', 'cyber', 'dracula', 'solarized'];

// Help command - Requirement 6.3
export const helpCommand: TerminalCommand = {
  name: 'help',
  description: 'Show all available commands',
  execute: () => {
    return {
      type: 'text',
      content: `Available commands:

  Navigation
  ──────────────────────────────────────────────────────────
  ls [dir]          List content (projects, blog, skills)
  open <slug>       Navigate to a project
  blog <query>      Search and open blog posts
  cd <page>         Navigate to a page (home, about, contact, resume)
  
  Info
  ──────────────────────────────────────────────────────────
  whoami            Display bio and contact info
  skills            List technical skills
  contact           Show contact information
  date              Display current date and time
  uptime            Show how long you've been here
  
  Fun
  ──────────────────────────────────────────────────────────
  ascii <text>      Generate ASCII art from text
  matrix            Enter the Matrix 🐇
  theme <name>      Change theme (dark|cyber|dracula|solarized)
  snake             Launch Snake game
  pong              Launch Pong game
  reveal            Toggle dev notes on project cards
  fortune           Get a random dev fortune
  cowsay <msg>      Make a cow say something
  neofetch          Display system info
  
  System
  ──────────────────────────────────────────────────────────
  clear             Clear the terminal
  history           Show command history
  echo <text>       Print text to terminal
  sudo <cmd>        Nice try 🔒

Type a command and press Enter to execute.`,
    };
  },
};

// Whoami command - Requirement 6.4
export const whoamiCommand: TerminalCommand = {
  name: 'whoami',
  description: 'Display a short bio',
  execute: (_, context) => {
    const settings = context.siteSettings;
    const name = settings?.owner_name || 'Unknown';
    const bio = settings?.hero_subhead || 'No bio available.';
    const socialLinks = settings?.social_links;
    
    let socialInfo = '';
    if (socialLinks?.github) {
      socialInfo += `\nGitHub: ${socialLinks.github}`;
    }
    if (socialLinks?.linkedin) {
      socialInfo += `\nLinkedIn: ${socialLinks.linkedin}`;
    }
    if (socialLinks?.email) {
      socialInfo += `\nEmail: ${socialLinks.email}`;
    }

    return {
      type: 'text',
      content: `${name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${bio}${socialInfo}`,
    };
  },
};

// Ls command - Requirement 6.5
export const lsCommand: TerminalCommand = {
  name: 'ls',
  description: 'List content',
  usage: 'ls [projects|blog|skills]',
  execute: (args, context) => {
    const subcommand = args[0]?.toLowerCase();

    if (!subcommand) {
      return {
        type: 'list',
        content: 'Available directories:',
        items: [
          'drwxr-xr-x  projects/    - View all projects',
          'drwxr-xr-x  blog/        - View all blog posts',
          'drwxr-xr-x  skills/      - View technical skills',
          '',
          'Use "ls <dir>" for details.',
        ],
      };
    }

    if (subcommand === 'projects') {
      if (context.projects.length === 0) {
        return { type: 'text', content: 'No projects found.' };
      }
      return {
        type: 'list',
        content: `total ${context.projects.length}`,
        items: context.projects.map(
          (p) => `-rw-r--r--  ${p.slug.padEnd(25)} ${p.one_liner}`
        ),
      };
    }

    if (subcommand === 'blog') {
      if (context.blogPosts.length === 0) {
        return { type: 'text', content: 'No blog posts found.' };
      }
      return {
        type: 'list',
        content: `total ${context.blogPosts.length}`,
        items: context.blogPosts.map(
          (p) => `-rw-r--r--  ${p.slug.padEnd(30)} ${p.title}`
        ),
      };
    }

    if (subcommand === 'skills') {
      return {
        type: 'list',
        content: 'Technical Skills:',
        items: [
          '├── Languages',
          '│   ├── TypeScript / JavaScript',
          '│   ├── Python',
          '│   ├── Go',
          '│   └── Rust',
          '├── Frontend',
          '│   ├── React / Next.js',
          '│   ├── Vue.js',
          '│   └── Tailwind CSS',
          '├── Backend',
          '│   ├── Node.js',
          '│   ├── PostgreSQL',
          '│   └── Redis',
          '└── DevOps',
          '    ├── Docker',
          '    ├── AWS / Vercel',
          '    └── CI/CD',
        ],
      };
    }

    return {
      type: 'error',
      content: `ls: ${subcommand}: No such directory`,
    };
  },
};

// Open command - Requirement 6.6
export const openCommand: TerminalCommand = {
  name: 'open',
  description: 'Navigate to a project',
  usage: 'open <project-slug>',
  execute: (args, context) => {
    const slug = args[0];

    if (!slug) {
      return {
        type: 'error',
        content: 'Usage: open <project-slug>\n\nUse "ls projects" to see available projects.',
      };
    }

    const project = context.projects.find(
      (p) => p.slug.toLowerCase() === slug.toLowerCase()
    );

    if (!project) {
      return {
        type: 'error',
        content: `Project not found: ${slug}\n\nUse "ls projects" to see available projects.`,
      };
    }

    context.navigate(`/projects/${project.slug}`);
    return {
      type: 'success',
      content: `Opening project: ${project.title}...`,
    };
  },
};

// Blog command - Requirement 6.7
export const blogCommand: TerminalCommand = {
  name: 'blog',
  description: 'Search and open blog posts',
  usage: 'blog <query>',
  execute: (args, context) => {
    const query = args.join(' ').toLowerCase();

    if (!query) {
      return {
        type: 'error',
        content: 'Usage: blog <query>\n\nUse "ls blog" to see all blog posts.',
      };
    }

    // Search blog posts by title or slug
    const matches = context.blogPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query) ||
        (p.summary && p.summary.toLowerCase().includes(query))
    );

    if (matches.length === 0) {
      return {
        type: 'error',
        content: `No blog posts found matching: "${query}"\n\nUse "ls blog" to see all blog posts.`,
      };
    }

    if (matches.length === 1) {
      context.navigate(`/blog/${matches[0].slug}`);
      return {
        type: 'success',
        content: `Opening blog post: ${matches[0].title}...`,
      };
    }

    // Multiple matches - show list
    return {
      type: 'list',
      content: `Found ${matches.length} matching posts. Use "open" with a specific slug:`,
      items: matches.map((p) => `blog/${p.slug} - ${p.title}`),
    };
  },
};

// Theme command - Requirement 6.8
export const themeCommand: TerminalCommand = {
  name: 'theme',
  description: 'Change the site theme',
  usage: 'theme <dark|cyber|dracula|solarized>',
  execute: (args, context) => {
    const themeName = args[0]?.toLowerCase();

    if (!themeName) {
      return {
        type: 'error',
        content: `Usage: theme <name>\n\nAvailable themes: ${VALID_THEMES.join(', ')}`,
      };
    }

    if (!VALID_THEMES.includes(themeName)) {
      return {
        type: 'error',
        content: `Invalid theme: ${themeName}\n\nAvailable themes: ${VALID_THEMES.join(', ')}`,
      };
    }

    context.setTheme(themeName);
    return {
      type: 'success',
      content: `Theme changed to: ${themeName}`,
    };
  },
};

// ASCII command - Requirement 6.9
export const asciiCommand: TerminalCommand = {
  name: 'ascii',
  description: 'Generate ASCII art from text',
  usage: 'ascii <text>',
  execute: (args, context) => {
    const text = args.join(' ') || context.siteSettings?.owner_name || 'HELLO';
    
    // Limit to reasonable length
    if (text.length > 12) {
      return {
        type: 'error',
        content: 'Text too long. Maximum 12 characters.',
      };
    }

    return {
      type: 'ascii',
      content: generateAsciiArt(text),
    };
  },
};

// Reveal command - Requirement 6.10
export const revealCommand: TerminalCommand = {
  name: 'reveal',
  description: 'Toggle dev notes overlay on project cards',
  execute: (_, context) => {
    context.toggleDevNotes();
    return {
      type: 'success',
      content: 'Dev notes overlay toggled. Check project cards!',
    };
  },
};

// Snake command - Requirement 6.11
export const snakeCommand: TerminalCommand = {
  name: 'snake',
  description: 'Launch Snake game',
  execute: (_, context) => {
    context.navigate('/play?game=snake');
    return {
      type: 'success',
      content: 'Launching Snake... 🐍',
    };
  },
};

// Pong command - Requirement 6.11
export const pongCommand: TerminalCommand = {
  name: 'pong',
  description: 'Launch Pong game',
  execute: (_, context) => {
    context.navigate('/play?game=pong');
    return {
      type: 'success',
      content: 'Launching Pong... 🏓',
    };
  },
};

// Sudo command - Requirement 6.12
export const sudoCommand: TerminalCommand = {
  name: 'sudo',
  description: 'Execute with elevated privileges',
  execute: () => ({
    type: 'error',
    content: 'permission denied 🔒 (nice try)',
  }),
};

// Clear command
export const clearCommand: TerminalCommand = {
  name: 'clear',
  description: 'Clear the terminal',
  execute: () => ({
    type: 'text',
    content: '__CLEAR__', // Special marker handled by Terminal component
  }),
};

// CD command - navigate to pages
export const cdCommand: TerminalCommand = {
  name: 'cd',
  description: 'Navigate to a page',
  usage: 'cd <page>',
  execute: (args, context) => {
    const page = args[0]?.toLowerCase();
    const validPages: Record<string, string> = {
      home: '/',
      '~': '/',
      about: '/about',
      contact: '/contact',
      resume: '/resume',
      projects: '/projects',
      blog: '/blog',
      play: '/play',
    };

    if (!page) {
      context.navigate('/');
      return { type: 'success', content: 'Navigating to home...' };
    }

    if (page === '..') {
      context.navigate('/');
      return { type: 'success', content: 'Navigating to home...' };
    }

    if (validPages[page]) {
      context.navigate(validPages[page]);
      return { type: 'success', content: `Navigating to ${page}...` };
    }

    return {
      type: 'error',
      content: `cd: ${page}: No such directory\n\nValid pages: ${Object.keys(validPages).join(', ')}`,
    };
  },
};

// Contact command
export const contactCommand: TerminalCommand = {
  name: 'contact',
  description: 'Show contact information',
  execute: (_, context) => {
    const socialLinks = context.siteSettings?.social_links;
    const items: string[] = [];
    
    if (socialLinks?.email) items.push(`📧 Email:    ${socialLinks.email}`);
    if (socialLinks?.github) items.push(`🐙 GitHub:   ${socialLinks.github}`);
    if (socialLinks?.linkedin) items.push(`💼 LinkedIn: ${socialLinks.linkedin}`);
    
    if (items.length === 0) {
      return { type: 'text', content: 'No contact information available.' };
    }

    return {
      type: 'list',
      content: 'Contact Information:',
      items,
    };
  },
};

// Skills command
export const skillsCommand: TerminalCommand = {
  name: 'skills',
  description: 'List technical skills',
  execute: () => ({
    type: 'list',
    content: '⚡ Technical Skills',
    items: [
      '',
      '  Languages     TypeScript, Python, Go, Rust',
      '  Frontend      React, Next.js, Vue, Tailwind',
      '  Backend       Node.js, PostgreSQL, Redis',
      '  DevOps        Docker, AWS, Vercel, CI/CD',
      '  Tools         Git, Vim, Linux',
      '',
    ],
  }),
};

// Date command
export const dateCommand: TerminalCommand = {
  name: 'date',
  description: 'Display current date and time',
  execute: () => ({
    type: 'text',
    content: new Date().toString(),
  }),
};

// Uptime command
const sessionStart = Date.now();
export const uptimeCommand: TerminalCommand = {
  name: 'uptime',
  description: 'Show session duration',
  execute: () => {
    const elapsed = Date.now() - sessionStart;
    const seconds = Math.floor(elapsed / 1000) % 60;
    const minutes = Math.floor(elapsed / 60000) % 60;
    const hours = Math.floor(elapsed / 3600000);
    
    let uptime = '';
    if (hours > 0) uptime += `${hours}h `;
    if (minutes > 0 || hours > 0) uptime += `${minutes}m `;
    uptime += `${seconds}s`;

    return {
      type: 'text',
      content: `Session uptime: ${uptime}\nYou've been exploring for a while! ☕`,
    };
  },
};

// Echo command
export const echoCommand: TerminalCommand = {
  name: 'echo',
  description: 'Print text to terminal',
  usage: 'echo <text>',
  execute: (args) => ({
    type: 'text',
    content: args.join(' ') || '',
  }),
};

// Fortune command
const fortunes = [
  '"Any fool can write code that a computer can understand. Good programmers write code that humans can understand." - Martin Fowler',
  '"First, solve the problem. Then, write the code." - John Johnson',
  '"Code is like humor. When you have to explain it, it\'s bad." - Cory House',
  '"Simplicity is the soul of efficiency." - Austin Freeman',
  '"Make it work, make it right, make it fast." - Kent Beck',
  '"The best error message is the one that never shows up." - Thomas Fuchs',
  '"Programming isn\'t about what you know; it\'s about what you can figure out." - Chris Pine',
  '"The only way to learn a new programming language is by writing programs in it." - Dennis Ritchie',
  '"Deleted code is debugged code." - Jeff Sickel',
  '"It\'s not a bug, it\'s an undocumented feature." - Anonymous',
  '"There are only two hard things in Computer Science: cache invalidation and naming things." - Phil Karlton',
  '"Talk is cheap. Show me the code." - Linus Torvalds',
];

export const fortuneCommand: TerminalCommand = {
  name: 'fortune',
  description: 'Get a random dev fortune',
  execute: () => ({
    type: 'text',
    content: `🔮 ${fortunes[Math.floor(Math.random() * fortunes.length)]}`,
  }),
};

// History command
export const historyCommand: TerminalCommand = {
  name: 'history',
  description: 'Show command history',
  execute: () => ({
    type: 'text',
    content: '// Command history is stored in session.\n// Use ↑/↓ arrows to navigate through previous commands.',
  }),
};

// Matrix command - triggers the Matrix rain effect
export const matrixCommand: TerminalCommand = {
  name: 'matrix',
  description: 'Enter the Matrix',
  execute: (_, context) => {
    context.toggleMatrix();
    return {
      type: 'success',
      content: 'Wake up, Neo... 🐇',
    };
  },
};

// Neofetch-style system info
export const neofetchCommand: TerminalCommand = {
  name: 'neofetch',
  description: 'Display system info',
  execute: (_, context) => {
    const name = context.siteSettings?.owner_name || 'User';
    return {
      type: 'ascii',
      content: `
        ▄▄▄▄▄▄▄           ${name}@portfolio
       █       █          ─────────────────
      █  ▀▀▀▀▀  █         OS: Web Browser
      █  █   █  █         Host: ${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}
      █  █   █  █         Kernel: Next.js 14
       █       █          Shell: phantom-terminal
        ▀▀▀▀▀▀▀           Theme: Phantom Protocol
                          Terminal: v1.0
    `,
    };
  },
};

// Cowsay command
export const cowsayCommand: TerminalCommand = {
  name: 'cowsay',
  description: 'Make a cow say something',
  usage: 'cowsay <message>',
  execute: (args) => {
    const message = args.join(' ') || 'Moo!';
    const line = '─'.repeat(message.length + 2);
    return {
      type: 'ascii',
      content: `
 ┌${line}┐
 │ ${message} │
 └${line}┘
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
`,
    };
  },
};

// All commands registry
export const commands: Record<string, TerminalCommand> = {
  help: helpCommand,
  whoami: whoamiCommand,
  ls: lsCommand,
  open: openCommand,
  blog: blogCommand,
  theme: themeCommand,
  ascii: asciiCommand,
  reveal: revealCommand,
  snake: snakeCommand,
  pong: pongCommand,
  sudo: sudoCommand,
  clear: clearCommand,
  cd: cdCommand,
  contact: contactCommand,
  skills: skillsCommand,
  date: dateCommand,
  uptime: uptimeCommand,
  echo: echoCommand,
  fortune: fortuneCommand,
  history: historyCommand,
  matrix: matrixCommand,
  neofetch: neofetchCommand,
  cowsay: cowsayCommand,
};

// Parse and execute a command
export function executeCommand(
  input: string,
  context: TerminalContext
): TerminalOutput | Promise<TerminalOutput> {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return { type: 'text', content: '' };
  }

  const parts = trimmed.split(/\s+/);
  const commandName = parts[0].toLowerCase();
  const args = parts.slice(1);

  // Use Object.hasOwn to prevent prototype pollution attacks (e.g., "__proto__")
  if (!Object.hasOwn(commands, commandName)) {
    return {
      type: 'error',
      content: `command not found: ${commandName}. Type 'help' for available commands.`,
    };
  }

  const command = commands[commandName];
  return command.execute(args, context);
}
