const http = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const CREDS = require('./creds');

const baseUrl = CREDS.BASE_URL;
const USERNAME_SELECTOR = `#user_email`;
const PWD_SELECTOR = `#user_password`;
const BTN_SELECTOR = `#new_user > div.form-group.text-center > 
input`;
const DWNLD_BTN_SELECTOR = `a.download`;

const getSiteHtml = async () => {
  return await http.get(CREDS.COURSES.ANGULAR.URL);
};

const scrapeMoshCourses = async () => {
  const $ = cheerio.load((await getSiteHtml()).data);
  const links = $('a.item')
    .get()
    .map(item => {
      const link = {
        URL: item.attribs.href,
        section: item.parent.parent.parent.children[1].children[2].data.trim()
      };
      return link;
    });

  console.log(links.length);

  const browser = await puppeteer.launch({
    headless: true,
    ignoreDefaultArgs: ['--disable-extensions']
  });
  const page = await browser.newPage();
  await page.goto(CREDS.LOGIN_URL);

  await page.click(USERNAME_SELECTOR);
  await page.keyboard.type(CREDS.USERNAME);
  await page.click(PWD_SELECTOR);
  await page.keyboard.type(CREDS.PASSWORD);
  await page.click(BTN_SELECTOR);
  try {
    await page.waitForNavigation();
  } catch (error) {
    console.error(error);
  }

  Promise.all(
    links.map(async ({ URL, section }, ind) => {
      if (ind < 40) {
        console.log(`${baseUrl}${URL}`);
        console.log(`${CREDS.COURSES.ANGULAR.DOWNLOAD_PATH}/${section}`);
        try {
          const page = await browser.newPage();
          await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: `${CREDS.COURSES.ANGULAR.DOWNLOAD_PATH}/${section}`
          });

          await page.goto(`${baseUrl}${URL}`);

          await page.waitFor(DWNLD_BTN_SELECTOR);
          //await page.waitForNavigation();
          await page.click(DWNLD_BTN_SELECTOR);
          await page.click(DWNLD_BTN_SELECTOR);
        } catch (error) {
          console.error(error);
        }
      }
    })
  );

  //await browser.close();
};

scrapeMoshCourses();
