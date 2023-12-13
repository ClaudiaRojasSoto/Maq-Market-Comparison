const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Función para raspar los productos de una subcategoría específica
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
    console.error(`Hubo un error al raspar la subcategoría: ${subcategory.title}`, error);
    return [];
  }
};

// Función para raspar las subcategorías de la URL principal
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

// Función para guardar los datos en un archivo JS
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
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Función para automatizar el scraping de todas las subcategorías y productos
const scrapeAndSaveAllProducts = async (url) => {
  try {
    const subcategories = await scrapeSubcategories(url);

    // Uso de map y Promise.all para manejar las promesas en paralelo
    const productsArrays = await Promise.all(subcategories.map(async (subcategory) => {
      await sleep(1000); // Agrega un retraso para evitar sobrecargar el servidor
      return scrapeProductsFromSubcategory(subcategory);
    }));

    const allProducts = productsArrays.flat(); // Aplana el array de arrays
    saveDataToJsFile(allProducts, 'allProductsData.js');
  } catch (error) {
    console.error('Hubo un error al procesar todos los productos:', error);
  }
};

// URL de la página principal de subcategorías
const url = 'https://www.soonparts.com/departments';
scrapeAndSaveAllProducts(url);
