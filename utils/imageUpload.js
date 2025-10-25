import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { log } from './helpers.js';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Download and upload image to Cloudinary
 * @param {string} imageUrl - URL of the image to download
 * @param {string} folder - Cloudinary folder name (default: 'rap-blog')
 * @returns {Promise<string>} - Cloudinary URL of uploaded image
 */
export async function uploadImageFromUrl(imageUrl, folder = 'rap-blog') {
  try {
    if (!imageUrl || !imageUrl.startsWith('http')) {
      log(`   ⚠️ Invalid image URL: ${imageUrl}`);
      return '';
    }

    log(`   📥 Downloading image from: ${imageUrl}`);

    // Download image as buffer
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000 // 10 second timeout
    });

    // Convert to base64
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    const dataURI = `data:${response.headers['content-type']};base64,${base64Image}`;

    log(`   ☁️ Uploading to Cloudinary...`);

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 630, crop: 'limit' }, // Resize large images
        { quality: 'auto' }, // Auto optimize quality
        { fetch_format: 'auto' } // Auto format (WebP, etc.)
      ]
    });

    log(`   ✅ Image uploaded to Cloudinary: ${uploadResult.secure_url}`);
    return uploadResult.secure_url;

  } catch (error) {
    log(`   ❌ Failed to upload image: ${error.message}`);
    return ''; // Return empty string if upload fails
  }
}

/**
 * Upload image from local file path
 * @param {string} filePath - Local path to image file
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<string>} - Cloudinary URL of uploaded image
 */
export async function uploadLocalImage(filePath, folder = 'rap-blog') {
  try {
    log(`   ☁️ Uploading local image to Cloudinary: ${filePath}`);

    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 630, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    log(`   ✅ Image uploaded: ${uploadResult.secure_url}`);
    return uploadResult.secure_url;

  } catch (error) {
    log(`   ❌ Failed to upload local image: ${error.message}`);
    return '';
  }
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}
