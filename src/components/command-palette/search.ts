/**
 * Fuzzy search implementation for Command Palette
 * Requirements: 5.2 - Search across routes, projects, and blog posts
 */

import type { CommandItem, SearchableContent } from './types';

/**
 * Simple fuzzy search that checks if query characters appear in order
 * Case-insensitive matching
 */
export function fuzzyMatch(query: string, text: string): boolean {
  if (!query) return true;
  
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  
  // Check if query is a substring (most common case)
  if (lowerText.includes(lowerQuery)) {
    return true;
  }
  
  // Fuzzy match: characters appear in order
  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }
  
  return queryIndex === lowerQuery.length;
}

/**
 * Calculate match score for ranking results
 * Higher score = better match
 */
export function calculateMatchScore(query: string, text: string): number {
  if (!query) return 0;
  
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  
  // Exact match gets highest score
  if (lowerText === lowerQuery) return 100;
  
  // Starts with query gets high score
  if (lowerText.startsWith(lowerQuery)) return 80;
  
  // Contains query as substring
  if (lowerText.includes(lowerQuery)) {
    // Earlier position = higher score
    const position = lowerText.indexOf(lowerQuery);
    return 60 - Math.min(position, 30);
  }
  
  // Fuzzy match gets lower score
  return 20;
}

/**
 * Search through command items
 */
export function searchCommands(
  query: string,
  items: CommandItem[]
): CommandItem[] {
  if (!query.trim()) {
    return items;
  }
  
  const results = items
    .filter((item) => {
      // Check title
      if (fuzzyMatch(query, item.title)) return true;
      
      // Check description
      if (item.description && fuzzyMatch(query, item.description)) return true;
      
      // Check keywords
      if (item.keywords?.some((kw) => fuzzyMatch(query, kw))) return true;
      
      return false;
    })
    .map((item) => ({
      item,
      score: Math.max(
        calculateMatchScore(query, item.title),
        item.description ? calculateMatchScore(query, item.description) : 0,
        ...(item.keywords?.map((kw) => calculateMatchScore(query, kw)) || [0])
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
  
  return results;
}

/**
 * Search through content (projects, blog posts)
 */
export function searchContent(
  query: string,
  content: SearchableContent[]
): SearchableContent[] {
  if (!query.trim()) {
    return content;
  }
  
  const results = content
    .filter((item) => {
      // Check title
      if (fuzzyMatch(query, item.title)) return true;
      
      // Check slug
      if (fuzzyMatch(query, item.slug)) return true;
      
      // Check description
      if (item.description && fuzzyMatch(query, item.description)) return true;
      
      // Check keywords
      if (item.keywords?.some((kw) => fuzzyMatch(query, kw))) return true;
      
      return false;
    })
    .map((item) => ({
      item,
      score: Math.max(
        calculateMatchScore(query, item.title),
        calculateMatchScore(query, item.slug),
        item.description ? calculateMatchScore(query, item.description) : 0,
        ...(item.keywords?.map((kw) => calculateMatchScore(query, kw)) || [0])
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
  
  return results;
}
