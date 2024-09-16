import { Cluster } from "puppeteer-cluster";
import { writeFile, readFile } from "fs";
import axios from "axios";

(async () => {
  const auth = "brd-customer-hl_ad9d3ed0-zone-scraping_browser1:c3urgr87khtn";

  // Create a cluster with as many workers as needed
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 4,
    puppeteerOptions: {
      browserWSEndpoint: `wss://${auth}@brd.superproxy.io:9222`,
    },
    timeout: 60000, // Set timeout for each task
  });

  let totalReviewData = [];
  try {
    // Define a task to perform the scraping
    await cluster.task(async ({ page, data: { url } }) => {
      await page.setRequestInterception(true);

      page.on("request", (request) => {
        if (["image", "stylesheet", "font"].includes(request.resourceType())) {
          request.abort();
        } else {
          request.continue();
        }
      });

      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });

      const context = page.browser().defaultBrowserContext();
      await context.overridePermissions(url, ["geolocation"]);

      const selector = ".hqzQac";
      await page.waitForSelector(selector);

      const [response] = await Promise.all([
        page.waitForNavigation(),
        page.click(selector),
      ]);

      const reviewSelector = ".review-dialog-list";
      await page.waitForSelector(reviewSelector);
      const reviewList = await page.$(reviewSelector);

      // Start benchmarking
      const scrollStartTime = Date.now();

      const numberSelector = ".z5jxId";
      const numberSelectorElem = await page.$(numberSelector);
      const numberOfReviews = await numberSelectorElem.evaluate((el) => {
        const string = el.textContent.split(" ");
        return Math.round(parseInt(string[0]) * 0.8);
      });
      console.log(numberOfReviews);
      // scrolling works now must loop for x amount of times
      // Change to 80% of the total amount of reviews to save on time and compute
      for (let i = 0; i < numberOfReviews; i++) {
        await reviewList.evaluate((el) => {
          el.scrollTo(0, el.scrollHeight);
        });
        await page.waitForNetworkIdle({ idleTime: 100 });
      }

      // End benchmarking for scrolling
      const scrollEndTime = Date.now();
      const scrollTime = scrollEndTime - scrollStartTime;

      // Start benchmarking for data extraction
      const extractionStartTime = Date.now();

      const reviewData = await page.evaluate(() => {
        const reviews = Array.from(
          document.querySelectorAll(".gws-localreviews__google-review"),
        );
        return reviews
          .map((review) => {
            review.querySelector(".k8MTF")?.remove();
            const reviewerRating = review
              .querySelector(".lTi8oc")
              ?.getAttribute("aria-label")
              .split(" ")[1];

            const reviewerName = review.querySelector(".TSUbDb").textContent;

            let reviewerScore = review
              .querySelector(".tdBFC")
              ?.getAttribute("aria-label");

            if (
              reviewerScore === `Mark review by ${reviewerName} as helpful.`
            ) {
              reviewerScore = parseInt("0");
            } else {
              reviewerScore = parseInt(reviewerScore?.split(" ")[0]);
            }

            let reviewDesc =
              review.querySelector(".review-full-text")?.textContent ||
              review.querySelector(".Jtu6Td")?.textContent;
            reviewDesc = reviewDesc.replace("\u2026More", "");

            return {
              rating: parseInt(reviewerRating),
              description: reviewDesc,
              helpfulness: reviewerScore,
              source: "Google Reviews",
            };
          })
          .filter((review) => review.description.split(" ").length > 20);
      });

      totalReviewData.push(...reviewData);

      console.log(reviewData);
      console.log(reviewData.length);

      // End benchmarking for data extraction
      const extractionEndTime = Date.now();
      const extractionTime = extractionEndTime - extractionStartTime;

      console.log(`Scrolling time: ${scrollTime}ms`);
      console.log(`Data extraction time: ${extractionTime}ms`);

      // Total time
      const totalTime = scrollTime + extractionTime;
      console.log(`Total time: ${totalTime}ms`);
    });
  } catch (error) {
    console.log("something went wrong: ", error);
  }

  // Add URLs to the queue
  readFile("urls.txt", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      return;
    }

    const urls = data.split("\n").filter((url) => url.trim());

    urls.forEach((url) => {
      cluster.queue({ url });
    });
  });

  // Close the cluster once all tasks are completed
  await cluster.idle();

  writeFile(
    `review_data_${Date.now()}.json`,
    JSON.stringify(totalReviewData, null, 2),
    function (error) {
      if (error) {
        console.log(error);
      }
    },
  );
  console.log(totalReviewData.length);
  await cluster.close();
})();
