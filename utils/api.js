import axios from 'axios';
import dotenv from 'dotenv';
import { log } from './helpers.js';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/**
 * Login as admin and get auth token
 */
export async function loginAdmin() {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (response.data.token) {
      log('✅ Admin authentication successful');
      return response.data.token;
    }

    return null;
  } catch (error) {
    log(`❌ Login failed: ${error.message}`);
    return null;
  }
}

/**
 * Post an article to the blog
 */
export async function postArticle(article, token) {
  try {
    const articleData = {
      title: article.title,
      content: article.content,
      author: article.author || 'Bot808',
      category: article.category || 'article',
      image_url: article.image_url || '',
      tags: article.tags || [],
      source_url: article.url
    };

    // Debug logging
    log(`📝 Posting article with data:`);
    log(`   Title: ${articleData.title}`);
    log(`   Image URL: ${articleData.image_url || '(none)'}`);
    log(`   Content length: ${articleData.content.length} chars`);
    log(`   Tags: ${articleData.tags.join(', ')}`);

    const response = await axios.post(
      `${API_URL}/api/articles`,
      articleData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 201) {
      log(`✅ Article posted: ${article.title}`);
      log(`   Posted with image: ${articleData.image_url ? 'YES' : 'NO'}`);
      return true;
    }

    return false;
  } catch (error) {
    log(`❌ Failed to post article: ${error.message}`);
    if (error.response) {
      log(`   Status: ${error.response.status}`);
      log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

/**
 * Check if article already exists by title
 */
export async function articleExists(title) {
  try {
    const response = await axios.get(`${API_URL}/api/articles`);
    const articles = response.data.articles || [];

    return articles.some(article =>
      article.title.toLowerCase() === title.toLowerCase()
    );
  } catch (error) {
    log(`⚠️ Error checking existing articles: ${error.message}`);
    return false;
  }
}
