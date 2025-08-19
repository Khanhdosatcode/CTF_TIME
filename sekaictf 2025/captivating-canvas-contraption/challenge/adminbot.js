// npm i puppeteer
// the real admin bot is slightly different but runs the same steps
// remote runs Headless Chromium 139, has access to the internet
const puppeteer = require("puppeteer");

const FLAG = "SEKAI{test_flag}";
const SITE = "https://ccc.chals.sekai.team/";
const target = process.argv[2];

const visit = async (url) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            pipe: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--js-flags=--noexpose_wasm,--jitless",
            ],
            dumpio: true
        });

        let page = await browser.newPage();
        await page.setCookie({
            name: "flag",
            value: FLAG,
            domain: new URL(SITE).hostname,
            httpOnly: false,
            secure: new URL(SITE).protocol === "https:",
            sameSite: "Strict"
        });
        await page.goto(`${SITE}?wasm=${url}`);

        await new Promise((res) => setTimeout(res, 3000));

        await browser.close();
        browser = null;
    } catch (err) {
        console.log(err);
    } finally {
        if (browser) await browser.close();
    }
};

if (target.startsWith('https://') || target.startsWith("http://")) {
    visit(target);
}