/**
 * Message Parser Utilities
 * Production-ready message parsing with security and performance optimizations
 * 
 * Features:
 * - URL detection with validation (blocks malicious patterns)
 * - XSS protection (sanitizes HTML entities)
 * - Mention parsing (secure, no injection)
 * - Emoji parsing (native support)
 * - Rate limiting helpers
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ParsedMessage {
  parts: MessagePart[];
  raw: string;
  sanitized: string;
  mentions: string[];
  urls: ParsedURL[];
  hasEmojis: boolean;
}

export type MessagePart = 
  | { type: "text"; content: string }
  | { type: "mention"; username: string }
  | { type: "url"; url: string; domain: string; isValid: boolean }
  | { type: "emoji"; emoji: string };

export interface ParsedURL {
  url: string;
  domain: string;
  isValid: boolean;
  protocol: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum message length (prevents abuse)
 */
export const MAX_MESSAGE_LENGTH = 500;

/**
 * Maximum URLs per message (prevents spam)
 */
export const MAX_URLS_PER_MESSAGE = 3;

/**
 * Maximum mentions per message (prevents spam)
 */
export const MAX_MENTIONS_PER_MESSAGE = 5;

/**
 * Allowed URL protocols (security)
 */
const ALLOWED_PROTOCOLS = ["http:", "https:"];

/**
 * Blocked URL patterns (security)
 */
const BLOCKED_URL_PATTERNS = [
  /javascript:/i,
  /data:/i,
  /vbscript:/i,
  /file:/i,
  /about:/i,
];

/**
 * Suspicious domains (can be expanded)
 */
const SUSPICIOUS_DOMAINS = [
  "bit.ly", // URL shorteners can hide malicious links
  "tinyurl.com",
  "goo.gl",
];

/**
 * URL regex pattern (more precise and reliable)
 */
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;

/**
 * Mention regex pattern (@username)
 */
const MENTION_REGEX = /@([a-zA-Z0-9_]{1,30})/g;

/**
 * Emoji regex pattern (Unicode emoji ranges)
 */
const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

// ============================================================================
// XSS PROTECTION
// ============================================================================

/**
 * HTML entities map for sanitization
 */
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

/**
 * Sanitize user input to prevent XSS attacks
 * Escapes HTML entities
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return "";
  
  return input.replace(/[&<>"'\/]/g, (char) => HTML_ENTITIES[char] || char);
};

/**
 * Decode HTML entities (for display)
 */
export const decodeHTMLEntities = (text: string): string => {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#x27;": "'",
    "&#x2F;": "/",
  };
  
  return text.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
};

// ============================================================================
// URL VALIDATION
// ============================================================================

/**
 * Validate URL for security
 * Checks protocol, blocks malicious patterns, validates domain
 */
export const validateURL = (urlString: string): ParsedURL => {
  const result: ParsedURL = {
    url: urlString,
    domain: "",
    isValid: false,
    protocol: "",
  };

  try {
    // Check for blocked patterns first
    for (const pattern of BLOCKED_URL_PATTERNS) {
      if (pattern.test(urlString)) {
        return result;
      }
    }

    // Normalize URL - add https:// if no protocol
    let normalizedUrl = urlString;
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      normalizedUrl = 'https://' + urlString;
    }

    const url = new URL(normalizedUrl);
    result.protocol = url.protocol;
    result.domain = url.hostname;
    result.url = normalizedUrl; // Use normalized URL

    // Validate protocol
    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
      return result;
    }

    // Check for suspicious domains (warning, not blocking)
    const isSuspicious = SUSPICIOUS_DOMAINS.some((domain) => 
      url.hostname.includes(domain)
    );

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*\.[a-zA-Z]{2,}$/;
    const isValidDomain = domainRegex.test(url.hostname);

    result.isValid = isValidDomain && !isSuspicious;
    
    return result;
  } catch {
    // Invalid URL
    return result;
  }
};

/**
 * Extract and validate URLs from text
 */
export const extractURLs = (text: string): ParsedURL[] => {
  const matches = text.match(URL_REGEX);
  if (!matches) return [];

  // Limit number of URLs (prevent spam)
  const limitedMatches = matches.slice(0, MAX_URLS_PER_MESSAGE);
  
  return limitedMatches.map(validateURL);
};

// ============================================================================
// MENTION PARSING
// ============================================================================

/**
 * Extract mentions from text
 * Returns array of usernames (without @)
 */
export const extractMentions = (text: string): string[] => {
  const matches = text.match(MENTION_REGEX);
  if (!matches) return [];

  // Remove @ symbol and limit mentions
  const mentions = matches
    .map((match) => match.slice(1))
    .slice(0, MAX_MENTIONS_PER_MESSAGE);

  // Remove duplicates
  return Array.from(new Set(mentions));
};

/**
 * Validate mention against participant list
 */
export const validateMention = (
  username: string, 
  validUsernames: string[]
): boolean => {
  return validUsernames.some(
    (valid) => valid.toLowerCase() === username.toLowerCase()
  );
};

// ============================================================================
// EMOJI PARSING
// ============================================================================

/**
 * Check if text contains emojis
 */
export const hasEmojis = (text: string): boolean => {
  return EMOJI_REGEX.test(text);
};

/**
 * Extract emojis from text
 */
export const extractEmojis = (text: string): string[] => {
  const matches = text.match(EMOJI_REGEX);
  return matches || [];
};

// ============================================================================
// MESSAGE PARSING
// ============================================================================

/**
 * Parse message into structured parts
 * Main parsing function that combines all features
 */
export const parseMessage = (
  message: string,
  validUsernames: string[] = []
): ParsedMessage => {
  // Sanitize input first
  const sanitized = sanitizeInput(message.slice(0, MAX_MESSAGE_LENGTH));
  
  // Extract components
  const urls = extractURLs(sanitized);
  const mentions = extractMentions(sanitized);
  const containsEmojis = hasEmojis(sanitized);

  // Parse into parts for rendering
  const parts: MessagePart[] = [];
  let currentIndex = 0;

  // Create a map of all special elements with their positions
  interface SpecialElement {
    start: number;
    end: number;
    part: MessagePart;
  }

  const specialElements: SpecialElement[] = [];

  // Find all URLs
  let urlMatch;
  const urlRegex = new RegExp(URL_REGEX);
  while ((urlMatch = urlRegex.exec(sanitized)) !== null) {
    const url = urlMatch[0];
    const parsedURL = validateURL(url);
    specialElements.push({
      start: urlMatch.index,
      end: urlMatch.index + url.length,
      part: {
        type: "url",
        url: parsedURL.url, // This will be the normalized URL with protocol
        domain: parsedURL.domain,
        isValid: parsedURL.isValid,
      },
    });
  }

  // Find all mentions
  let mentionMatch;
  const mentionRegex = new RegExp(MENTION_REGEX);
  while ((mentionMatch = mentionRegex.exec(sanitized)) !== null) {
    const username = mentionMatch[1];
    specialElements.push({
      start: mentionMatch.index,
      end: mentionMatch.index + mentionMatch[0].length,
      part: {
        type: "mention",
        username,
      },
    });
  }

  // Sort by position
  specialElements.sort((a, b) => a.start - b.start);

  // Build parts array
  specialElements.forEach((element) => {
    // Add text before special element
    if (currentIndex < element.start) {
      const textContent = sanitized.slice(currentIndex, element.start);
      if (textContent) {
        parts.push({ type: "text", content: textContent });
      }
    }

    // Add special element
    parts.push(element.part);
    currentIndex = element.end;
  });

  // Add remaining text
  if (currentIndex < sanitized.length) {
    const textContent = sanitized.slice(currentIndex);
    if (textContent) {
      parts.push({ type: "text", content: textContent });
    }
  }

  // If no special elements, add the whole text
  if (parts.length === 0) {
    parts.push({ type: "text", content: sanitized });
  }

  return {
    parts,
    raw: message,
    sanitized,
    mentions: mentions.filter((m) => validateMention(m, validUsernames)),
    urls,
    hasEmojis: containsEmojis,
  };
};

// ============================================================================
// RATE LIMITING HELPERS
// ============================================================================

/**
 * Rate limiter for message actions
 * Simple in-memory rate limiter (can be extended with Redis)
 */
export class MessageRateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 10000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Check if user is rate limited
   */
  isRateLimited(userId: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(userId) || [];

    // Filter out old attempts
    const recentAttempts = userAttempts.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    // Update attempts
    this.attempts.set(userId, recentAttempts);

    return recentAttempts.length >= this.maxAttempts;
  }

  /**
   * Record an attempt
   */
  recordAttempt(userId: string): void {
    const now = Date.now();
    const userAttempts = this.attempts.get(userId) || [];
    userAttempts.push(now);
    this.attempts.set(userId, userAttempts);
  }

  /**
   * Reset user's attempts
   */
  reset(userId: string): void {
    this.attempts.delete(userId);
  }

  /**
   * Clear old attempts (cleanup)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [userId, attempts] of this.attempts.entries()) {
      const recentAttempts = attempts.filter(
        (timestamp) => now - timestamp < this.windowMs
      );
      if (recentAttempts.length === 0) {
        this.attempts.delete(userId);
      } else {
        this.attempts.set(userId, recentAttempts);
      }
    }
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate message before sending
 */
export const validateMessage = (message: string): {
  isValid: boolean;
  error?: string;
} => {
  // Check length
  if (!message || message.trim().length === 0) {
    return { isValid: false, error: "Message cannot be empty" };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { 
      isValid: false, 
      error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` 
    };
  }

  // Check for excessive URLs
  const urls = extractURLs(message);
  if (urls.length > MAX_URLS_PER_MESSAGE) {
    return { 
      isValid: false, 
      error: `Too many URLs (max ${MAX_URLS_PER_MESSAGE})` 
    };
  }

  // Check for excessive mentions
  const mentions = extractMentions(message);
  if (mentions.length > MAX_MENTIONS_PER_MESSAGE) {
    return { 
      isValid: false, 
      error: `Too many mentions (max ${MAX_MENTIONS_PER_MESSAGE})` 
    };
  }

  return { isValid: true };
};

/**
 * Get domain from URL for display
 */
export const getDomainFromURL = (urlString: string): string => {
  try {
    const url = new URL(urlString);
    return url.hostname.replace("www.", "");
  } catch {
    return "";
  }
};

