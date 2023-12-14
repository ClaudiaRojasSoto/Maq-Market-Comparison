const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Function to have the products on a specific category
const scrapeProductsFromSubcategory = async (subcategory) => {
  try {
    const { data } = await axios.get(subcategory.href);
    const $ = cheerio.load(data);
    const products = [];

    $('ol.products.list.items.product-items > li').each((index, element) => {
      const productName = $(element).find('.product-item-name').text().trim();
      const priceId = $(element).find('[data-price-type="finalPrice"]').attr('id');
      const productCode = priceId ? priceId.replace('product-price-', '') : '';
      const productPrice = $(element).find('.price-final_price > .price-wrapper > .price').text().trim();
      const productImage = $(element).find('.product-image-photo').attr('src').trim();

      if (productName && productPrice && productImage) {
        products.push({
          productName, productCode, productPrice, productImage,
        });
      }
    });

    return products;
  } catch (error) {
    console.error(`There was an error when scraping the category: ${subcategory.title}`, error);
    return [];
  }
};

// Function to scrape subcategories from the main url
const scrapeSubcategories = async (url) => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const subcategories = [];
    $('ul.list-subcategories > li > a').each((index, element) => {
      const title = $(element).text().trim();
      const href = $(element).attr('href').trim();
      subcategories.push({ title, href });
    });

    return subcategories;
  } catch (error) {
    console.error('There was an error when scraping the subcategories:', error);
    return [];
  }
};

// Function to save data to a js file
const saveDataToJsFile = (data, fileName) => {
  const jsContent = `module.exports = ${JSON.stringify(data, null, 2)};`;
  fs.writeFile(fileName, jsContent, 'utf8', (err) => {
    if (err) {
      console.error(`An error occurred while writing to the file ${fileName}:`, err);
    } else {
      console.log(`The data has been saved in ${fileName}`);
    }
  });
};

// Pause function (sleep)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Feature to automate scraping of all subcategories and products
const scrapeAndSaveAllProducts = async (url) => {
  try {
    const subcategories = await scrapeSubcategories(url);

    // Using map and Promise.all to handle promises in parallel
    const productsArrays = await Promise.all(subcategories.map(async (subcategory) => {
      await sleep(1000); // Delay to avoid overloading the server
      return scrapeProductsFromSubcategory(subcategory);
    }));

    const allProducts = productsArrays.flat(); // Flatten the array of arrays to combine
    saveDataToJsFile(allProducts, 'allProductsData.js');
  } catch (error) {
    console.error('There was an error processing all products:', error);
  }
};

// Subcategory Home Page URL
const url = 'https://www.soonparts.com/departments';
scrapeAndSaveAllProducts(url);
