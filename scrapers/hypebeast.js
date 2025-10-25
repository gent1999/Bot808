import axios from 'axios';
import * as cheerio from 'cheerio';
import { cleanText, extractTags, log } from '../utils/helpers.js';
import { uploadImageFromUrl, isCloudinaryConfigured } from '../utils/imageUpload.js';

const HYPEBEAST_URL = 'https://hypebeast.com/music';

/**
 * Scrape articles from Hypebeast music section
 */
export async function scrapeHypebeast() {
  try {
    log('📰 Fetching articles from Hypebeast...');

    const response = await axios.get(HYPEBEAST_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const articles = [];

    // Hypebeast article selectors (may need adjustment based on site structure)
    $('.post-box, article').each((index, element) => {
      try {
        const $article = $(element);

        // Extract article data
        const title = $article.find('h2, h3, .post-title, .title').first().text().trim();
        const url = $article.find('a').first().attr('href');

        if (title && url) {
          const fullUrl = url.startsWith('http') ? url : `https://hypebeast.com${url}`;

          articles.push({
            title: cleanText(title),
            url: fullUrl,
            needsFullContent: true
          });
        }
      } catch (err) {
        // Skip invalid articles
      }
    });

    log(`✅ Found ${articles.length} articles from Hypebeast`);

    // Return article URLs only (we'll fetch full content only for the one we need)
    return articles.slice(0, 10).map(article => ({
      ...article,
      author: 'Hypebeast',
      category: 'article',
      source: 'hypebeast'
    }));

  } catch (error) {
    log(`❌ Error scraping Hypebeast: ${error.message}`);
    return [];
  }
}

/**
 * Scrape full article content from a specific URL
 */
export async function scrapeHypebeastArticle(url) {
  try {
    log(`   Fetching full content from: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    // Extract full article content
    const title = $('h1, .article-title, .post-title').first().text().trim();

    // Try multiple selectors for content
    let content = '';
    const contentSelectors = [
      '.article-content',
      '.post-content',
      '.article-body',
      'article .content',
      '.post-body',
      'article'
    ];

    for (const selector of contentSelectors) {
      const $content = $(selector);
      if ($content.length > 0) {
        // Get all paragraph text
        const paragraphs = [];
        $content.find('p').each((i, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 20) { // Filter out empty or very short paragraphs
            paragraphs.push(text);
          }
        });

        if (paragraphs.length > 0) {
          content = paragraphs.join('\n\n');
          break;
        }
      }
    }

    // If still no content, try getting all paragraphs
    if (!content) {
      const paragraphs = [];
      $('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 30) {
          paragraphs.push(text);
        }
      });
      content = paragraphs.slice(0, 5).join('\n\n'); // Take first 5 substantial paragraphs
    }

    // Extract image - try multiple selectors
    let image = '';
    const imageSelectors = [
      'article img.featured-image',
      '.article-content img',
      'article img',
      '.post-thumbnail img',
      'meta[property="og:image"]'
    ];

    for (const selector of imageSelectors) {
      const $img = $(selector).first();
      if ($img.length > 0) {
        if ($img.attr('content')) {
          image = $img.attr('content'); // For meta tags
        } else {
          image = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy-src');
        }
        if (image && image.startsWith('http')) {
          break;
        }
      }
    }

    // Add source attribution to content
    const attribution = `\n\n---\nSource: ${url}`;
    const fullContent = content ? cleanText(content) + attribution : '';

    if (!title || !fullContent) {
      log(`   ⚠️ Could not extract full content from article`);
      return null;
    }

    log(`   ✅ Successfully extracted ${fullContent.length} characters`);

    // Upload image to Cloudinary if found and configured
    let uploadedImageUrl = '';
    if (image && isCloudinaryConfigured()) {
      uploadedImageUrl = await uploadImageFromUrl(image);
    } else if (!isCloudinaryConfigured()) {
      log(`   ⚠️ Cloudinary not configured, using original image URL`);
      uploadedImageUrl = image;
    }

    return {
      title: cleanText(title),
      content: fullContent,
      image_url: uploadedImageUrl || '',
      url
    };
  } catch (error) {
    log(`❌ Error scraping article details from ${url}: ${error.message}`);
    return null;
  }
}
