const puppeteer = require('puppeteer');
const sleep = require('./sleep');

const noLoginInfoErr = 'Please provide a username or email and password';

(async () => {
  if (!process.argv[2] && !process.argv[3]) {
    throw new Error(noLoginInfoErr);
  }
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://github.com/login');
  await sleep(page, 60000);
  await page.click('#login_field');
  await page.keyboard.type(process.argv[2]);
  await page.click('#password');
  await page.keyboard.type(process.argv[3]);
  await page.click('.btn.btn-primary.btn-block');
  await page.waitForNavigation();
})();
