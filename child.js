import puppeteer from "puppeteer";
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const query = encodeURIComponent("barber shop toronto");

  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (
      request.url() ===
      "https://www.google.com/log?format=json&hasfast=true&authuser=0"
    ) {
      request.abort();
    } else {
      request.continue();
    }
  });
  await page.goto(`https://www.google.com/search?q=${query}`, {
    waitUntil: "domcontentloaded",
  });

  const context = page.browser().defaultBrowserContext();
  await context.overridePermissions("https://www.google.com/search?q=", [
    "geolocation",
  ]);

  try {
    await page.click(".S8ee5");
  } catch (error) {
    await page.click(".LGwnxb");
  }
  await page.waitForSelector(".Jtakfe");

  const allBusinessNames = [];
  try {
    for (let i = 0; i < 4; i++) {
      // grab list of businesses
      const list = await page.$(".Jtakfe");
      const pageResults = await list.evaluate((el) => {
        const businessNames = Array.from(el.querySelectorAll(".rgnuSb"));
        return businessNames.map(
          (name) =>
            `https://www.google.com/search?q=${encodeURIComponent(name.textContent + " toronto")}`,
        );
      });
      allBusinessNames.push(...pageResults);
      const scrollBox = await page.$(".YhtaGd.aQOEkf");
      await scrollBox.evaluate((el) => {
        el.scrollTo(0, el.scrollHeight);
      });
      await page.waitForSelector(
        ".VfPpkd-LgbsSe.VfPpkd-LgbsSe-OWXEXe-INsAgc.VfPpkd-LgbsSe-OWXEXe-dgl2Hf.Rj2Mlf.OLiIxf.PDpWxe.P62QJc.LQeN7.sspfN.Ehmv4e.cLUxtc",
      );
      await page.click(
        ".VfPpkd-LgbsSe.VfPpkd-LgbsSe-OWXEXe-INsAgc.VfPpkd-LgbsSe-OWXEXe-dgl2Hf.Rj2Mlf.OLiIxf.PDpWxe.P62QJc.LQeN7.sspfN.Ehmv4e.cLUxtc",
      );
      await page.waitForNavigation({ timeout: 10000 });
      await page.waitForSelector(".Jtakfe");
    }
  } catch (error) {
    console.log(error);
    await page.screenshot({ path: "error.png" });
  }
  const uniqueBusinessNames = [...new Set(allBusinessNames)];
  console.log(uniqueBusinessNames);
  console.log(uniqueBusinessNames.length);
  await page.screenshot({ path: "search.png" });

  await browser.close();
})();
