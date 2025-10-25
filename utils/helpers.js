import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTED_ARTICLES_FILE = path.join(__dirname, '..', 'posted-articles.json');
const LOG_FILE = path.join(__dirname, '..', 'logs', 'bot.log');

// Ensure logs directory exists
if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
  fs.mkdirSync(path.join(__dirname, '..', 'logs'));
}

/**
 * Load previously posted articles from file
 */
export function loadPostedArticles() {
  try {
    if (fs.existsSync(POSTED_ARTICLES_FILE)) {
      const data = fs.readFileSync(POSTED_ARTICLES_FILE, 'utf-8');
      const articles = JSON.parse(data);
      return new Set(articles);
    }
  } catch (error) {
    console.error('Error loading posted articles:', error);
  }
  return new Set();
}

/**
 * Save an article ID to the posted list
 */
export function savePostedArticle(articleId) {
  try {
    const postedArticles = loadPostedArticles();
    postedArticles.add(articleId);

    const articlesArray = Array.from(postedArticles);
    fs.writeFileSync(POSTED_ARTICLES_FILE, JSON.stringify(articlesArray, null, 2));
  } catch (error) {
    console.error('Error saving posted article:', error);
  }
}

/**
 * Log message to both console and file
 */
export function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;

  console.log(message);

  try {
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
}

/**
 * Clean and format text content
 */
export function cleanText(text) {
  if (!text) return '';
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n\n');
}

/**
 * Extract tags from content
 */
export function extractTags(text, title) {
  const tags = new Set();
  const content = (title + ' ' + text).toLowerCase();
  const originalTitle = title; // Keep original casing for artist names

  // Extract artist names from title (common patterns)
  // Pattern 1: "Artist Name - Song Title" or "Artist Name: Song Title"
  const artistPattern1 = /^([A-Z][A-Za-z0-9\s&.'-]+?)(?:\s*[-–—:]\s*)/;
  const match1 = originalTitle.match(artistPattern1);
  if (match1) {
    tags.add(match1[1].trim());
  }

  // Pattern 2: "Artist Name Drops..." or "Artist Name Releases..."
  const artistPattern2 = /^([A-Z][A-Za-z0-9\s&.'-]+?)(?:\s+(?:Drops?|Releases?|Shares?|Unveils?|Announces?|Returns?|Debuts?|Premieres?))/i;
  const match2 = originalTitle.match(artistPattern2);
  if (match2) {
    tags.add(match2[1].trim());
  }

  // Pattern 3: Look for quoted artist names or names in title
  const quotedNames = originalTitle.match(/"([^"]+)"/g);
  if (quotedNames) {
    quotedNames.forEach(name => {
      const cleaned = name.replace(/"/g, '').trim();
      if (cleaned.length > 2 && cleaned.length < 30) {
        tags.add(cleaned);
      }
    });
  }

  // Pattern 4: Common artist name indicators
  const artistIndicators = /(?:featuring|feat\.|ft\.|with|by)\s+([A-Z][A-Za-z0-9\s&.'-]{2,25})/gi;
  let indicatorMatch;
  while ((indicatorMatch = artistIndicators.exec(originalTitle)) !== null) {
    tags.add(indicatorMatch[1].trim());
  }

  // Common hip-hop related keywords
  const keywords = [
    'rap', 'hip-hop', 'hiphop', 'trap', 'drill', 'r&b',
    'album', 'single', 'ep', 'mixtape', 'music video',
    'collaboration', 'collab', 'feature', 'interview',
    'concert', 'tour', 'festival', 'performance'
  ];

  keywords.forEach(keyword => {
    if (content.includes(keyword)) {
      tags.add(keyword);
    }
  });

  // Convert Set to Array and limit to 8 tags (more room for artist names)
  return Array.from(tags).slice(0, 8);
}
