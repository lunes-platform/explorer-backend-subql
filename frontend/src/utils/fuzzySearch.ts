/**
 * BL-SEARCH: Fuzzy matching utilities for search functionality
 * Implements Levenshtein distance and scoring for approximate string matching
 */

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits needed
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  // Create distance matrix
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  
  // Initialize base cases
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  // Fill matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Calculate similarity score between 0 and 1
 * 1 = exact match, 0 = completely different
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;
  
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  return 1 - distance / maxLength;
}

/**
 * Calculate fuzzy match score with bonuses for:
 * - Exact match
 * - Prefix match
 * - Word boundary match
 * - Acronym match
 */
export function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  
  if (q === t) return 100; // Exact match
  if (t.startsWith(q)) return 90; // Prefix match
  if (t.includes(q)) return 70; // Contains match
  
  // Check word boundaries
  const words = t.split(/[\s\-_\.]+/);
  for (const word of words) {
    if (word.startsWith(q)) return 60; // Word prefix match
  }
  
  // Acronym match (e.g., "PID" matches "PidChat Token")
  const acronym = words.map(w => w[0]).join('');
  if (acronym.startsWith(q)) return 50;
  
  // Fuzzy similarity
  const similarity = calculateSimilarity(q, t);
  if (similarity >= 0.6) return Math.floor(similarity * 40); // 24-40 points
  
  // Check if all query chars appear in order
  let queryIdx = 0;
  for (let i = 0; i < t.length && queryIdx < q.length; i++) {
    if (t[i] === q[queryIdx]) queryIdx++;
  }
  if (queryIdx === q.length) return 20; // Character sequence match
  
  return 0;
}

/**
 * Filter and rank items using fuzzy matching
 */
export interface FuzzyMatchResult<T> {
  item: T;
  score: number;
  matches: boolean;
  highlighted: string;
}

export function fuzzyFilter<T>(
  items: T[],
  query: string,
  getSearchableText: (item: T) => string
): FuzzyMatchResult<T>[] {
  if (!query.trim()) {
    return items.map(item => ({
      item,
      score: 0,
      matches: true,
      highlighted: getSearchableText(item),
    }));
  }
  
  const results = items.map(item => {
    const text = getSearchableText(item);
    const score = fuzzyScore(query, text);
    
    return {
      item,
      score,
      matches: score > 0,
      highlighted: highlightMatches(text, query),
    };
  });
  
  return results
    .filter(r => r.matches)
    .sort((a, b) => b.score - a.score);
}

/**
 * Highlight matching characters in text
 */
export function highlightMatches(text: string, query: string): string {
  if (!query.trim()) return text;
  
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  
  // Find exact match position
  const idx = t.indexOf(q);
  if (idx >= 0) {
    return (
      text.slice(0, idx) +
      `<mark>${text.slice(idx, idx + q.length)}</mark>` +
      text.slice(idx + q.length)
    );
  }
  
  // Try to highlight character-by-character
  let result = '';
  let queryIdx = 0;
  let inMatch = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charLower = char.toLowerCase();
    
    if (queryIdx < q.length && charLower === q[queryIdx]) {
      if (!inMatch) {
        result += '<mark>';
        inMatch = true;
      }
      result += char;
      queryIdx++;
    } else {
      if (inMatch) {
        result += '</mark>';
        inMatch = false;
      }
      result += char;
    }
  }
  
  if (inMatch) result += '</mark>';
  return result;
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Tokenize search query for advanced matching
 * Supports phrases with quotes, exclusions with -, and OR with |
 */
export interface ParsedQuery {
  include: string[];
  exclude: string[];
  phrases: string[];
  or: string[][];
}

export function parseQuery(query: string): ParsedQuery {
  const result: ParsedQuery = {
    include: [],
    exclude: [],
    phrases: [],
    or: [],
  };
  
  // Extract quoted phrases
  const phraseRegex = /"([^"]+)"/g;
  let match;
  while ((match = phraseRegex.exec(query)) !== null) {
    result.phrases.push(match[1]);
  }
  
  // Remove phrases from query
  const withoutPhrases = query.replace(phraseRegex, ' ');
  
  // Split by OR operator
  const orParts = withoutPhrases.split(/\|/);
  
  orParts.forEach((part, idx) => {
    const terms = part.trim().split(/\s+/).filter(t => t.length > 0);
    const groupTerms: string[] = [];
    
    terms.forEach(term => {
      if (term.startsWith('-')) {
        result.exclude.push(term.slice(1).toLowerCase());
      } else {
        groupTerms.push(term.toLowerCase());
      }
    });
    
    if (groupTerms.length > 0) {
      if (idx === 0) {
        result.include.push(...groupTerms);
      } else {
        result.or.push(groupTerms);
      }
    }
  });
  
  return result;
}

/**
 * Advanced search with parsed query support
 */
export function advancedFuzzyFilter<T>(
  items: T[],
  query: string,
  getSearchableText: (item: T) => string
): FuzzyMatchResult<T>[] {
  const parsed = parseQuery(query);
  
  return items
    .map(item => {
      const text = getSearchableText(item).toLowerCase();
      let score = 0;
      let matches = true;
      
      // Check exclusions
      for (const exclude of parsed.exclude) {
        if (text.includes(exclude)) {
          matches = false;
          break;
        }
      }
      if (!matches) return { item, score: 0, matches: false, highlighted: getSearchableText(item) };
      
      // Score phrases (higher weight)
      for (const phrase of parsed.phrases) {
        const phraseScore = fuzzyScore(phrase, text);
        score += phraseScore * 2;
      }
      
      // Score include terms
      for (const term of parsed.include) {
        score += fuzzyScore(term, text);
      }
      
      // Score OR terms (need at least one)
      if (parsed.or.length > 0) {
        let orMatched = false;
        for (const orGroup of parsed.or) {
          for (const term of orGroup) {
            const termScore = fuzzyScore(term, text);
            if (termScore > 0) {
              score += termScore;
              orMatched = true;
              break;
            }
          }
        }
        if (!orMatched && parsed.include.length === 0) {
          matches = false;
        }
      }
      
      return {
        item,
        score,
        matches: score > 0,
        highlighted: highlightMatches(getSearchableText(item), query),
      };
    })
    .filter(r => r.matches)
    .sort((a, b) => b.score - a.score);
}
