const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const url = require('url');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send(`
    <html>
      <body>
        <h1>URL Fetcher</h1>
        <p>Enter a URL to fetch (must be https://www.google.com).</p>
        <p>The flag is hidden somewhere...</p>
        <form action="/fetch" method="post">
          <input type="text" name="url" placeholder="https://www.google.com" required>
          <button type="submit">Fetch</button>
        </form>
      </body>
    </html>
  `);
});

app.post('/fetch', async (req, res) => {
    const inputUrl = req.body.url;
    if (!inputUrl) {
        return res.status(400).send('URL is required');
    }

    try {
        if (!inputUrl.startsWith('https://www.google.com/') && !inputUrl.startsWith('https://google.com/')) {
            return res.status(400).send('URL must start with https://www.google.com/ or https://google.com/');
        }
        const parsedUrl = new URL(inputUrl);
        if (parsedUrl.hostname !== 'www.google.com' && parsedUrl.hostname !== 'google.com') {
            return res.status(400).send('Only www.google.com or google.com hostnames are allowed');
        }

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
        });
        const page = await browser.newPage();
        await page.goto(inputUrl, {
            waitUntil: 'networkidle2',
            timeout: 10000,
        });
        const content = await page.content();
        await browser.close();
        res.send(`<h2>Content from ${inputUrl}:</h2><pre>${content}</pre>`);
    } catch (error) {
        res.status(500).send(`Error fetching URL: ${error.message}`);
    }
});

app.get('/flag', (req, res) => {
    const clientIp = (req.ip || req.connection.remoteAddress || "").toString();
    console.log(`Client IP: ${clientIp}`);
    if (clientIp.includes('127.0.0.1') || clientIp.includes('::1')) {
        const flag = process.env.FLAG || 'Flag{fake_flag}';
        res.send(flag);
    } else {
        res.status(403).send('Access denied. Only local access allowed.');
    }
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});