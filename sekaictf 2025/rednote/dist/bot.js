// admin bot script for testing
// npm i puppeteer

const puppeteer = require("puppeteer");
const crypto = require("crypto");

const SITE = `http://rednote:1337`; // TODO: CHANGE URL

const FLAG = process.env.FLAG || "SEKAI{test_flag}";

const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const setupRequestInterception = async (page) => {
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        const url = request.url();
        
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch (err) {
            console.log(`Blocked invalid URL: ${url}`);
            request.abort('blockedbyclient');
            return;
        }

        if (parsedUrl.protocol === "http:" && parsedUrl.origin !== SITE) {
            console.log(`Blocked invalid URL: ${url}`);
            request.abort('blockedbyclient');
            return;
        }

        request.continue();
    });
};

const visit = async (url) => {
    let browser, context, page;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--js-flags=--jitless', // this is a web chall :)
                '--disable-features=HttpsFirstBalancedModeAutoEnable',
            ],
            dumpio: true,
            pipe: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
        });

        // incognito btw
        context = await browser.createBrowserContext();
        
        context.on('targetcreated', async (target) => {
            if (target.type() === 'page') {
                const newPage = await target.page();
                if (newPage) {
                    await setupRequestInterception(newPage);
                }
            }
        });

        page = await context.newPage();
    
        await page.goto(`${SITE}/register`, { waitUntil: "domcontentloaded", timeout: 5000 });
        await page.type("input[name=user]", crypto.randomBytes(16).toString("hex"));
        await page.type("input[name=pass]", crypto.randomBytes(32).toString("hex"));
        await page.click("form[action='/register'] input[type=submit]");
        await sleep(1500);

        await page.type("input[name=title]", "flag");
        await page.type("textarea[name=note]", FLAG);
        await page.click("form[action='/create'] input[type=submit]");
        await sleep(1500);

        await page.close();
    } catch (err) {
        console.error(err);
        if (browser) await browser.close();
    }

    try {
        page = await context.newPage();
        
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 5000 });
        await sleep(100_000);
    } catch (err) {
        console.error(err);
    }

    if (browser) await browser.close();
};

visit("https://EXPLOIT_URL")