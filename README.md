# Bot808 - Automated Blog Posting Bot

An automated bot that scrapes hip-hop articles from various sources and posts them to your CRY808 blog daily.

## Features

- 🤖 **Automated Posting**: Posts 1 article per day at 9 AM (configurable)
- 📰 **Multiple Sources**: Scrapes from Hypebeast, 24Hip-Hop, and more
- 🔄 **Duplicate Prevention**: Tracks posted articles to avoid duplicates
- 📊 **Logging**: Keeps detailed logs of all activities
- ⚙️ **Configurable**: Easy configuration via environment variables

## Setup

### 1. Install Dependencies

```bash
cd Bot808
npm install
```

### 2. Configure Environment

Create a `.env` file by copying the example:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# API Configuration
API_URL=http://localhost:3000
ADMIN_EMAIL=your_admin_email@example.com
ADMIN_PASSWORD=your_admin_password

# Bot Configuration
POST_TIME_HOUR=9
POST_TIME_MINUTE=0

# Sources to scrape from
SCRAPE_SOURCES=hypebeast,24hiphop
```

### 3. Run the Bot

**Development Mode** (runs immediately for testing):
```bash
npm run dev
```

**Production Mode** (scheduled posting):
```bash
npm start
```

## How It Works

1. **Scheduler**: The bot runs on a cron schedule (default: 9:00 AM daily)
2. **Scraping**: It scrapes articles from configured sources
3. **Filtering**: Checks for duplicates against previously posted articles
4. **Posting**: Authenticates with your API and posts the article
5. **Tracking**: Saves the article ID to prevent duplicate posts

## File Structure

```
Bot808/
├── index.js                 # Main bot script
├── scrapers/
│   ├── hypebeast.js        # Hypebeast scraper
│   └── 24hiphop.js         # 24Hip-Hop scraper
├── utils/
│   ├── api.js              # API communication
│   └── helpers.js          # Helper functions
├── logs/
│   └── bot.log             # Activity logs
├── posted-articles.json    # Tracks posted articles
├── .env                    # Configuration (create this)
├── .env.example            # Configuration template
└── package.json            # Dependencies
```

## Running 24/7

### Windows

**Option 1: Task Scheduler**
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger to "At log on"
4. Action: Start a program
5. Program: `node`
6. Arguments: `C:\path\to\Bot808\index.js`

**Option 2: PM2 (Recommended)**
```bash
npm install -g pm2
pm2 start index.js --name bot808
pm2 save
pm2 startup
```

### Keep Running After Close

With PM2:
```bash
pm2 start index.js --name bot808
pm2 logs bot808          # View logs
pm2 restart bot808       # Restart bot
pm2 stop bot808          # Stop bot
pm2 delete bot808        # Remove bot
```

## Testing

To test the bot without waiting for the scheduled time:

1. Open `index.js`
2. Uncomment these lines near the bottom:
```javascript
// log('🧪 Test mode: Running immediately...');
// findAndPostArticle();
```
3. Run `npm start`

## Logs

All bot activity is logged to:
- **Console**: Real-time output
- **File**: `logs/bot.log`

## Troubleshooting

### Bot isn't posting
- Check your `.env` configuration
- Verify API_URL is correct
- Ensure admin credentials are valid
- Check `logs/bot.log` for errors

### Scrapers not finding articles
- Website structure may have changed
- Update selectors in `scrapers/*.js`
- Check if websites are accessible

### Duplicate articles
- Check `posted-articles.json`
- Delete entries to allow re-posting

## Customization

### Add New Sources

1. Create a new scraper in `scrapers/newsource.js`
2. Add to `index.js`:
```javascript
import { scrapeNewSource } from './scrapers/newsource.js';

// In findAndPostArticle():
} else if (source === 'newsource') {
  articles = await scrapeNewSource();
}
```
3. Update `.env`:
```env
SCRAPE_SOURCES=hypebeast,24hiphop,newsource
```

### Change Posting Time

Edit `.env`:
```env
POST_TIME_HOUR=14    # 2 PM
POST_TIME_MINUTE=30  # 30 minutes
```

## License

ISC
