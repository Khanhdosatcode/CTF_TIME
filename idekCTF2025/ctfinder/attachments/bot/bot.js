const puppeteer = require("puppeteer-core");
const express = require("express");
const dotenv = require("dotenv");
const crypto = require("crypto");

dotenv.config();

const app = express();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const REPORT_KEY = process.env.REPORT_KEY;

const visit = async (url, report_id) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      executablePath: "/usr/bin/google-chrome",
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--incognito",
        "--js-flags=--noexpose_wasm,--jitless",
        "--disable-web-security",
      ],
    });

    let page = await browser.newPage();

    await page.goto(`http://main:1337/auth/login`, {
      timeout: 5000,
      waitUntil: "domcontentloaded",
    });

    await page.evaluate(
      (ADMIN_USERNAME, ADMIN_PASSWORD) => {
        document.querySelector("#username").value = ADMIN_USERNAME;
        document.querySelector("#password").value = ADMIN_PASSWORD;
        document.querySelector("#loginBtn").click();
      },
      ADMIN_USERNAME,
      ADMIN_PASSWORD
    );

    await page.waitForNavigation({ 
      timeout: 5000, 
      waitUntil: "domcontentloaded" 
    });  

    await page.goto(url, {
      timeout: 5000,
      waitUntil: "domcontentloaded",
    });

    await page.evaluate(() => {
      document.querySelectorAll('meta[http-equiv]').forEach(el => {
          if (el.getAttribute('http-equiv').toLowerCase() === 'refresh') {
              el.remove();
          }
      });
      window.stop();
    });

    await page.waitForTimeout(2000);

    await page.evaluate((report_id) => {
      document.querySelector(`#checkReportBtn-${report_id}`).click();
    }, report_id);

    await page.waitForTimeout(2000);

    await page.goto(`http://main:1337/auth/logout`, {
      timeout: 5000,
      waitUntil: "domcontentloaded",
    });

    await page.waitForTimeout(2000);

    await page.close();
    await browser.close();

    browser = null;
  } catch (err) {
    console.log("bot error", err);
  } finally {
    if (browser) await browser.close();
  }
};

app.get("/", async (req, res) => {
  const session_id = req.query.session_id;
  const user_id = req.query.user_id;

  if (!session_id || !user_id) {
    return res.status(400).json({ error: "session_id and user_id are required" });
  }

  const report_id = crypto.createHash("sha256").update(`${session_id}:${user_id}:${REPORT_KEY}`).digest("hex").slice(0, 7);
  const url = `http://main:1337/sessions/${session_id}?user_id=${user_id}&report_id=${report_id}`;

  await visit(url, report_id);

  res.json({ message: "Bot visited the URL" });
});


app.listen(5010, () => {
  console.log("Bot is running on port 5010");
});