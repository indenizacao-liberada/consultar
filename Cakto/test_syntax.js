const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const startTag = '<section id="page-atendimento"';
const scriptStartTag = '<script>';
const scriptEndTag = '</script>';

const pageIdx = html.indexOf(startTag);
if (pageIdx === -1) {
  console.log('page-atendimento not found');
  process.exit(1);
}

const sIdx = html.indexOf(scriptStartTag, pageIdx);
const eIdx = html.indexOf(scriptEndTag, sIdx);

const code = html.substring(sIdx + scriptStartTag.length, eIdx);
console.log('Found script length:', code.length);

try {
  new Function(code);
  console.log('SYNTAX IS VALID!');
} catch (err) {
  console.error('SYNTAX ERROR:', err);
}
