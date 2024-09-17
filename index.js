import { Cluster } from "puppeteer-cluster";
import { writeFile, readFile } from "fs";

(async () => {
  const auth = process.env.BRIGHT_DATA_AUTH;

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

    const businessDisplay = await page.$(".TQc1id");
    const businessInfo = await businessDisplay?.evaluate((el) => {
      const businessName = el.querySelector(".PZPZlf")?.textContent;
      let businessTypeRaw =
        el.querySelector(".E5BaQ")?.textContent ||
        el.querySelector(".YhemCb")?.textContent;

      if (businessTypeRaw.includes("$")) {
        businessTypeRaw = el.querySelector(".YhemCb span:nth-of-type(2)");
      }

      let businessType = businessTypeRaw;
      let businessLocation =
        el.querySelector(".LrzXr")?.textContent.split(",")[1]?.trim() || null;

      // Check if businessTypeRaw contains "in" to split into type and location
      if (businessTypeRaw.includes(" in ")) {
        const [type, location] = businessTypeRaw.split(" in ");
        businessType = type.trim();
        businessLocation = location.trim();
      }

      return {
        business_name: businessName?.trim() || "Unknown",
        business_category: businessType?.trim() || "Unknown",
        location: businessLocation || "Location not found",
      };
    });

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
      return Math.round(string[0].split(",").join("") / 10);
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

    try {
      const reviewData = await page.evaluate((info) => {
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

            let reviewDesc =
              review.querySelector(".review-full-text")?.textContent ||
              review.querySelector(".Jtu6Td")?.textContent;
            reviewDesc = reviewDesc.replace("\u2026More", "");

            const reviewResponse = review.querySelector(".d6SCIc")?.textContent;

            const reviewerName = review.querySelector(".TSUbDb").textContent;
            const reviewerMetaInfo = review
              .querySelector(".A503be")
              ?.textContent.split("·")
              ?.filter((word) => word.includes("photo") === false);

            const reviewerInfo = {
              name: reviewerName,
              local_guide: reviewerMetaInfo?.includes("Local Guide")
                ? true
                : false,
              reviews_written: reviewerMetaInfo?.includes("Local Guide")
                ? reviewerMetaInfo[1]
                : reviewerMetaInfo?.toString(),
            };

            let reviewerScore = review
              .querySelector(".tdBFC")
              ?.getAttribute("aria-label");

            reviewerScore === `Mark review by ${reviewerName} as helpful.`
              ? (reviewerScore = parseInt("0"))
              : (reviewerScore = parseInt(reviewerScore?.split(" ")[0]));

            return {
              description: reviewDesc,
              rating: parseInt(reviewerRating),
              owner_response: reviewResponse,
              upvotes: reviewerScore,
              reviewer_info: reviewerInfo,
              business_info: info,
            };
          })
          .filter((review) => review.description.split(" ").length > 20);
      }, businessInfo);

      totalReviewData.push(...reviewData);

      console.log(reviewData);
      console.log(
        "gathered",
        reviewData.length,
        "reviews. Currently sitting at ",
        totalReviewData.length,
      );
    } catch (error) {
      console.log("error occured at the second step", error);
    }

    // End benchmarking for data extraction
    const extractionEndTime = Date.now();
    const extractionTime = extractionEndTime - extractionStartTime;

    console.log(`Scrolling time: ${scrollTime}ms`);
    console.log(`Data extraction time: ${extractionTime}ms`);

    // Total time
    const totalTime = scrollTime + extractionTime;
    console.log(`Total time: ${totalTime}ms`);
  });

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
