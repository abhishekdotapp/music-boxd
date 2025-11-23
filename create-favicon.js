const fs = require('fs');
const path = require('path');

// Read the music.png file
const inputPath = path.join(__dirname, 'public', 'music.png');
const outputPath = path.join(__dirname, 'public', 'favicon.ico');

// For a simple solution, we'll just copy and rename
// Modern browsers support PNG favicons, but ICO is more compatible
fs.copyFileSync(inputPath, outputPath);

console.log('Favicon created successfully!');
console.log('Note: For best results, create a proper .ico file with multiple sizes using an online converter like favicon.io');
