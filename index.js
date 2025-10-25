import cron from 'node-cron';
import dotenv from 'dotenv';
import { scrapeHypebeast } from './scrapers/hypebeast.js';
import { scrape24HipHop } from './scrapers/24hiphop.js';
import { postArticle, loginAdmin } from './utils/api.js';
import { loadPostedArticles, savePostedArticle, log, extractTags } from './utils/helpers.js';

dotenv.config();

const POST_TIME_HOUR = process.env.POST_TIME_HOUR || '9';
const POST_TIME_MINUTE = process.env.POST_TIME_MINUTE || '0';
const SCRAPE_SOURCES = (process.env.SCRAPE_SOURCES || 'hypebeast,24hiphop').split(',');

// Store posted articles to avoid duplicates
let postedArticles = loadPostedArticles();

async function findAndPostArticle() {
  try {
    log('🔍 Starting daily article search...');

    // Get admin token
    const token = await loginAdmin();
    if (!token) {
      log('❌ Failed to authenticate as admin');
      return;
    }

    let articleToPost = null;
    let fullArticleData = null;

    // Try each source until we find a new article
    for (const source of SCRAPE_SOURCES) {
      log(`📰 Scraping from ${source}...`);

      let articles = [];

      if (source === 'hypebeast') {
        articles = await scrapeHypebeast();
      } else if (source === '24hiphop') {
        articles = await scrape24HipHop();
      }

      // Find an article we haven't posted yet
      for (const article of articles) {
        const articleId = `${source}_${article.url}`;
        if (!postedArticles.has(articleId)) {
          articleToPost = { ...article, sourceId: articleId };
          break;
        }
      }

      if (articleToPost) break;
    }

    if (!articleToPost) {
      log('⚠️ No new articles found from any source');
      return;
    }

    // Now fetch the FULL content + image for this ONE article
    log(`📄 Fetching full content for: "${articleToPost.title}"`);

    if (articleToPost.source === 'hypebeast') {
      const { scrapeHypebeastArticle } = await import('./scrapers/hypebeast.js');
      fullArticleData = await scrapeHypebeastArticle(articleToPost.url);
    } else if (articleToPost.source === '24hiphop') {
      const { scrape24HipHopArticle } = await import('./scrapers/24hiphop.js');
      fullArticleData = await scrape24HipHopArticle(articleToPost.url);
    }

    if (!fullArticleData || !fullArticleData.content) {
      log('❌ Failed to fetch full article content');
      return;
    }

    // Merge the full article data with metadata
    const completeArticle = {
      ...fullArticleData,
      author: articleToPost.author,
      category: articleToPost.category,
      tags: extractTags(fullArticleData.content, fullArticleData.title),
      sourceId: articleToPost.sourceId
    };

    // Post the article
    log(`✍️ Posting article: "${completeArticle.title}"`);
    const success = await postArticle(completeArticle, token);

    if (success) {
      // Mark as posted
      savePostedArticle(completeArticle.sourceId);
      postedArticles.add(completeArticle.sourceId);
      log('✅ Article posted successfully!');
      if (completeArticle.image_url) {
        log(`   📸 With image: ${completeArticle.image_url}`);
      }
    } else {
      log('❌ Failed to post article');
    }

  } catch (error) {
    log(`❌ Error in findAndPostArticle: ${error.message}`);
    console.error(error);
  }
}

// Schedule the bot to run daily at specified time
const cronSchedule = `${POST_TIME_MINUTE} ${POST_TIME_HOUR} * * *`;
log(`🤖 Bot808 started! Scheduled to post daily at ${POST_TIME_HOUR}:${POST_TIME_MINUTE}`);
log(`📅 Next run: ${new Date().toLocaleString()}`);

cron.schedule(cronSchedule, () => {
  log(`\n⏰ Daily trigger at ${new Date().toLocaleString()}`);
  findAndPostArticle();
});

// For testing: run immediately on startup (comment out in production)
// log('🧪 Test mode: Running immediately...');
// findAndPostArticle();

// Keep the process running
process.on('SIGINT', () => {
  log('\n👋 Bot808 shutting down...');
  process.exit(0);
});

log('Bot808 is running... Press Ctrl+C to stop.');
