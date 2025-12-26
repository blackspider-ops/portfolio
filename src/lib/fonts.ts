import { Inter, JetBrains_Mono, Fraunces } from 'next/font/google';

// Inter for body text - Requirement 2.9
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// JetBrains Mono for terminal and statistics - Requirement 2.10
export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
});

// Fraunces for headings - Requirement 2.8
// Self-hosted via next/font with font-display: swap - Requirement 2.11
export const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK', 'opsz'],
});
