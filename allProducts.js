const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

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
        products.push({ productName, productCode, productPrice, productImage });
      }
    });

    return products;
  } catch (error) {
    console.error(`Hubo un error al raspar la subcategoría: ${subcategory.title}`, error);
    return [];
  }
};

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
    console.error('Hubo un error al raspar las subcategorías:', error);
    return [];
  }
};

const saveDataToJsFile = (data, fileName) => {
  const jsContent = `module.exports = ${JSON.stringify(data, null, 2)};`;
  fs.writeFile(fileName, jsContent, 'utf8', (err) => {
    if (err) {
      console.error(`Ocurrió un error al escribir en el archivo ${fileName}:`, err);
    } else {
      console.log(`Los datos han sido guardados en ${fileName}`);
    }
  });
};

// Función de pausa (sleep)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const scrapeAndSaveAllProducts = async (url) => {
  try {
    const subcategories = await scrapeSubcategories(url);
    const allProducts = [];

    for (const subcategory of subcategories) {
      const products = await scrapeProductsFromSubcategory(subcategory);
      allProducts.push(...products);
      
      // Agrega un retraso aquí para esperar 1 segundo antes de la siguiente subcategoría
      await sleep(1000);
    }

    saveDataToJsFile(allProducts, 'allProductsData.js');
  } catch (error) {
    console.error('Hubo un error al procesar todos los productos:', error);
  }
};

const url = 'https://www.soonparts.com/departments';
scrapeAndSaveAllProducts(url);
