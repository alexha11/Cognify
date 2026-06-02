const fs = require('fs');
const pdfParse = require('pdf-parse');

async function extract() {
  const file1 = '/Users/had1/Cognify/data/Dec. 8, 2025.pdf';
  const file2 = '/Users/had1/Cognify/data/Dec. 9, 2025.pdf';
  
  const data1 = await pdfParse(fs.readFileSync(file1));
  console.log('=== DEC 8 ===');
  console.log(data1.text);
  
  const data2 = await pdfParse(fs.readFileSync(file2));
  console.log('=== DEC 9 ===');
  console.log(data2.text);
}

extract().catch(console.error);
