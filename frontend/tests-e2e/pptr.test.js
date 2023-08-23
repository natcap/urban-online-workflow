import puppeteer from 'puppeteer';
import '@testing-library/jest-dom/extend-expect';
import {
  beforeEach,
  afterEach,
  test,
} from 'vitest';

async function setupPage(browser) {
  const page = await browser.newPage();

  await page.setViewport({
    width: 1000,
    height: 1000,
  });
  await page.goto('http://localhost:3000/');
  return page;
}

let BROWSER;
beforeEach(async () => {
  BROWSER = await puppeteer.launch({
    headless: false,
    slowMo: 100,
  });
});

afterEach(async () => {
  await BROWSER.close();
});

test('study-area-select', async () => {
  const page = await setupPage(BROWSER);
  const areaSelect = await page.waitForSelector(
    '#select-study-area'
  );
  const renameField = await page.waitForSelector(
    'aria/Untitled[role="textbox"]'
  );
  await renameField.click({ clickCount: 3 }); // select existing text
  await renameField.type('Hello');
  const renameBtn = await page.waitForSelector(
    'aria/Rename[role="button"]'
  );
  await renameBtn.click();
  await areaSelect.select('Hello');

  const zoomIn = await page.waitForSelector('aria/+[role="button"]');
  await zoomIn.click();
  await zoomIn.click();
  await zoomIn.click();
  await zoomIn.click();
  const canvas = await page.waitForSelector('canvas');
  await canvas.click({
    offset: {
      x: 300,
      y: 300,
    },
    delay: 1000,
  });
  const addBtn = await page.waitForSelector('aria/[name="Add to study area"][role="button"]');
  await addBtn.click();
  const createBtn = await page.waitForSelector('aria/Create[role="button"]');
}, 60000);
