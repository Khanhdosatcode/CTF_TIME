// npm i puppeteer
// the real admin bot is slightly different but runs the same steps
// remote runs Headless Chromium 139, has access to the internet
const puppeteer = require("puppeteer");

const FLAG = "SEKAI{test_flag}";
const SITE = "https://nbv.chals.sekai.team/";
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
                "--js-flags=--jitless",
                // Speed up dns!
                "--host-resolver-rules=MAP nbv-*.chals.sekai.team nbv-0-0.chals.sekai.team",
            ],
            dumpio: true
        });

        let page1 = await browser.newPage();

        await page1.goto(`${SITE}/?note=${encodeURIComponent(FLAG)}`, {
            waitUntil: "networkidle2"
        });

        let page2 = await browser.newPage();

        await page2.goto(url);

        await new Promise((res) => setTimeout(res, 15000));

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