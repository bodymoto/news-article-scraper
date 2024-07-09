const { chromium } = require("playwright");
const fs = require('fs');

const saveHackerNewsArticles = async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://news.ycombinator.com", {
    waitUntil: "domcontentloaded"
  });

  const evaluationResult = await page.evaluate(() => {
    const anchors = document.querySelectorAll('span.titleline a');

    const data = Array.from(anchors).map((anchor) => ({
      url: anchor.href,
      title: anchor.innerHTML
    }));

    let articles = [];
    let count = 1;

    data.forEach((value, index) => {
      if (index % 2 === 0) {
        value["rank"] = count;
        articles.push(value);
        count++;
      }
    });

    return articles.slice(0, 10);
  });

  await page.close();

  return evaluationResult;
};

const writeJSONtoCSV = (data) => {
  const keys = Object.keys(data[0]).map((key) => key) + '\n';

  const articleInfo = [];

  /* format the {value} inside quotes to ensure any article titles containing a comma are not given multiple columns after being written to a .csv file */
  data.forEach((object) => {
    articleInfo.push(Object.values(object).map(value => `"${value}"`));
  });

  let formatArticleString = "";
  articleInfo.forEach((item) => {
    formatArticleString += item.join(',') + '\n';
  });

  const csvData = keys + formatArticleString;

  fs.writeFile('top_ten_hacker_news_articles.csv', csvData, (err) => {
    if (err) {
      console.error(`Error writing file 'top_ten_hacker_news_articles.csv': ${err.message}`);
      throw err;
    }
  });
};

(async () => {
  const data = await saveHackerNewsArticles();
  const csv = await writeJSONtoCSV(data);
})();
