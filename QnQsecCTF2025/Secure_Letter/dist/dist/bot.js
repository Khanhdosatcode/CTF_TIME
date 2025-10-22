const puppeteer = require('puppeteer');
const express = require('express');

const app = express();
app.use(express.json());

const BOT_CONFIG = {
    baseUrl: process.env.WEB_URL || 'http://localhost:3001',
    cookieName: 'flag',
    cookieValue: process.env.FLAG || 'FLAG{test_flag}'
};

// Start the bot server
app.get('/report', async (req, res) => {
    const url = req.query.url;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`🤖 Bot received report for URL: ${url}`);
    
    try {
        await visitUrl(url);
        res.json({ 
            success: true, 
            message: 'Bot visited the URL successfully',
            flag: BOT_CONFIG.cookieValue 
        });
    } catch (error) {
        console.error('❌ Bot error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Bot failed to visit URL' 
        });
    }
});

async function visitUrl(url) {
    console.log('🚀 Starting bot browser...');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    });

    try {
        const page = await browser.newPage();
        
        await page.setViewport({ width: 1280, height: 720 });
        
        await page.setCookie({
            name: BOT_CONFIG.cookieName,
            value: BOT_CONFIG.cookieValue,
            domain: process.env.COOKIE_DOMAIN || 'localhost',
            path: '/',
            httpOnly: false,
            secure: false
        });

        console.log(`🍪 Set cookie: ${BOT_CONFIG.cookieName}=${BOT_CONFIG.cookieValue}`);
        console.log(`🎯 Visiting URL: ${url}`);

        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 10000 
        });

        await new Promise(resolve => setTimeout(resolve, 15000));

        const title = await page.title();
        console.log(`📄 Page title: ${title}`);

        page.on('console', msg => {
            console.log(`🖥️  Page console: ${msg.text()}`);
        });

        page.on('request', request => {
            if (request.url().includes('webhook') || request.url().includes('analytics')) {
                console.log(`🌐 Network request: ${request.url()}`);
            }
        });

        console.log('✅ Bot visit completed successfully');

    } finally {
        await browser.close();
        console.log('🔒 Browser closed');
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        bot: 'ready',
    });
});

// Start the bot server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`🤖 XSS Bot started on port ${PORT}`);
    console.log(`🎯 Bot will visit URLs reported to http://localhost:${PORT}/report`);
    console.log(`🍪 Bot cookie: ${BOT_CONFIG.cookieName}=${BOT_CONFIG.cookieValue}`);
});

module.exports = app;
