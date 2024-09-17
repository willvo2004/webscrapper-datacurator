import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const query = encodeURIComponent("car dealership toronto");

  await page.goto(`https://www.google.com/search?q=${query}`, {
    waitUntil: "domcontentloaded",
  });

  const context = page.browser().defaultBrowserContext();
  await context.overridePermissions("https://www.google.com/search?q=", [
    "geolocation",
  ]);

  try {
    const [response] = await Promise.all([
      page.waitForNavigation(),
      page.click(".S8ee5"),
    ]);
    let businessNamesAll = [];
    for (let i = 0; i < 3; i++) {
      await page.waitForSelector(".MjjYud");
      const list = await page.$(".s6JM6d");

      const pageResults = await list.evaluate((el) => {
        const businessNames = Array.from(el.querySelectorAll(".dbg0pd"));
        return businessNames.map(
          (name) =>
            `https://www.google.com/search?q=${encodeURIComponent(name.textContent)}+toronto`,
        );
      });
      businessNamesAll.push(...pageResults);

      const [response2] = await Promise.all([
        page.waitForNavigation(),
        page.click(".SJajHc.NVbCr"),
      ]);
      await page.waitForSelector(".yf");
    }
    const uniqueList = [...new Set(businessNamesAll)];
    console.log(uniqueList);
  } catch (error) {
    console.log(error);
  } finally {
    await browser.close();
  }
})();
