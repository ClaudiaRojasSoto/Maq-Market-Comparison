const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const scrapeSubcategories = async (url) => {
    try {
      const response = await axios.get(url);
      console.log('Status Code:', response.status); // Verificar que la petición fue exitosa
      const data = response.data;
      console.log('HTML Length:', data.length); // Verificar la longitud del HTML
      const $ = cheerio.load(data);
  
      const subcategories = [];
      $('ul.list-subcategories > li > a').each((index, element) => {
        const title = $(element).text().trim();
        const href = $(element).attr('href').trim();
        subcategories.push({ title, href });
      });

    console.log(subcategories);
    saveDataToJsFile(subcategories, 'departmentsData.js');
  } catch (error) {
    console.error('Hubo un error al raspar las subcategorías:', error);
  }
};

const saveDataToJsFile = (data, fileName) => {
  const jsContent = `module.exports = ${JSON.stringify(data, null, 2)};`;
  fs.writeFile(fileName, jsContent, 'utf8', (err) => {
    if (err) {
      console.error(`Ocurrió un error al escribir en el archivo ${fileName}:`, err);
    } else {
      console.log(`Las subcategorías han sido guardadas en ${fileName}`);
    }
  });
};

const url = 'https://www.soonparts.com/departments'; // Asegúrate de reemplazar esto con la URL real
scrapeSubcategories(url);
