const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split('\n');
// Exclude the <script> line (34359, index 34358) and </script> line (35561, index 35560)
const scriptBody = lines.slice(34359, 35560);

console.log('Script body line count:', scriptBody.length);

// Binary search to find where it breaks
let low = 1, high = scriptBody.length;
let culprit = -1;

while (low <= high) {
  let mid = Math.floor((low + high) / 2);
  let chunk = scriptBody.slice(0, mid).join('\n');
  try {
    new Function(chunk);
    // If it parses without error, the error is further down
    low = mid + 1;
  } catch (err) {
    if (err.message.includes("Unexpected token '<'")) {
      culprit = mid;
      high = mid - 1; // look for earlier
    } else {
      // Syntax error like "Unexpected end of input" is normal for truncated code
      low = mid + 1;
    }
  }
}

if (culprit !== -1) {
  const actualLine = 34359 + culprit;
  console.log('Culprit line in index.html:', actualLine);
  for (let l = actualLine - 5; l <= actualLine + 5; l++) {
    console.log(`${l}: ${lines[l - 1]}`);
  }
} else {
  console.log('No unexpected token < found by binary search. Trying full parse...');
  try {
    new Function(scriptBody.join('\n'));
    console.log('Full scriptBody parsed successfully!');
  } catch (err) {
    console.log('Full scriptBody error:', err.message);
  }
}
