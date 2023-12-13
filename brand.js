const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const saveDataToJsFile = (data) => {
  const jsContent = `module.exports = ${JSON.stringify(data, null, 2)};`;
  fs.writeFile('data.js', jsContent, 'utf8', (err) => {
    if (err) {
      console.error('Ocurrió un error al escribir en el archivo:', err);
    } else {
      console.log('Los datos han sido guardados en data.js');
    }
  });
};

const scrapeWebsite = async (url) => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const extractedData = [];

    $('ol.products.list.items.product-items > li').each((index, element) => {
      const productName = $(element).find('.product-item-name').text().trim();
      const priceId = $(element).find('[data-price-type="finalPrice"]').attr('id');
      const productCode = priceId ? priceId.replace('product-price-', '') : '';
      const productPrice = $(element).find('.price-final_price > .price-wrapper > .price').text().trim();

      if (productName && productPrice) {
        extractedData.push({ productName, productCode, productPrice });
      }
    });

    console.log(extractedData);
    saveDataToJsFile(extractedData);
  } catch (error) {
    console.error('Hubo un error al raspar la página:', error);
  }
};

// Reemplaza la URL con la URL de la página que quieres raspar
const url = 'https://www.soonparts.com/brand/for-case.html';
scrapeWebsite(url);
