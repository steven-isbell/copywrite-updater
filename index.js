require('dotenv').config();
const puppeteer = require('puppeteer');

const sleep = require('./sleep');

const providedOptionsError =
  'Please provide a username or email, password, and new copywrite year.';

const { REPOSITORY_PAGE: rp, GITHUB_USER: gu } = process.env;

(async () => {
  if (!process.argv[2] || !process.argv[3] || !process.argv[4]) {
    throw new Error(providedOptionsError);
  }

  let count = 1;

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
  await page.goto(rp);
  await sleep(page, 60000);

  while (!page.$('.blankslate')) {
    await page.evaluate(() => {
      let dom = document.querySelector('.member-avatar-group');
      dom.parentNode.removeChild(dom);
    });

    const repos = await page.$$('[data-hovercard-type]');

    for (let i = 0; i < repos.length; i++) {
      const href = await (await repos[i].getProperty('href')).jsonValue();
      await page.goto(`${href}/blob/master/README.md`);
      await sleep(page, 60000);

      const FourOhFour = await page.$('#parallax_wrapper');
      if (!FourOhFour) {
        const content = await page.content();
        const containsCopyright = content.includes('©');
        if (containsCopyright) {
          const isCurrentYear = content.includes(process.argv[4]);
          if (!isCurrentYear) {
            await page.click('svg.octicon.octicon-pencil');
            await page.waitForNavigation();
            const codeContainer = await page.$('.CodeMirror-code');
            const codeBlock = await (await codeContainer.getProperty(
              'innerText'
            )).jsonValue();
            const updatedCopyrightBlock = codeBlock.replace(
              /\d{4}/,
              process.argv[4]
            );
            const removeLineNumbers = updatedCopyrightBlock.replace(
              /\d{1,3}\n/g,
              ''
            );
            await page.evaluate(removeLineNumbers => {
              const rawBlock = document.querySelector('.CodeMirror-code');
              rawBlock.innerText = removeLineNumbers;
            }, removeLineNumbers);
            await page.click('#submit-file');
          }
        }
      }
      await sleep(page, 60000);
    }
    count += 1;
    await page.goto(`${rp}?page={count}`);
  }
})();
