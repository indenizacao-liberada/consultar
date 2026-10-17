const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split('\n');
const slice = lines.slice(34358, 35561);

for (let i = 1; i <= slice.length; i++) {
  const code = slice.slice(0, i).join('\n');
  try {
    new Function(code + '\n}');
  } catch (err) {
    if (err.message.includes("Unexpected token '<'")) {
      console.log('First line that triggered Unexpected token < is:', 34358 + i);
      console.log('Line content:', lines[34358 + i - 1]);
      break;
    }
  }
}
