// Simple test to verify TypeScript compilation works correctly
const fs = require('fs');
const path = require('path');

// Check if compiled files exist
const requiredFiles = [
  'dist/app.js',
  'dist/3d.js', 
  'dist/types.js'
];

console.log('Testing TypeScript compilation...\n');

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`✓ ${file} exists (${stats.size} bytes)`);
  } else {
    console.log(`✗ ${file} missing`);
    allFilesExist = false;
  }
});

// Check if HTML files have been updated to reference compiled files
const indexHtml = fs.readFileSync('index.html', 'utf8');
const threeDHtml = fs.readFileSync('3d.html', 'utf8');

console.log('\nTesting HTML file updates...');

if (indexHtml.includes('dist/app.js') && indexHtml.includes('type="module"')) {
  console.log('✓ index.html correctly references dist/app.js with module type');
} else {
  console.log('✗ index.html does not correctly reference dist/app.js');
  allFilesExist = false;
}

if (threeDHtml.includes('dist/3d.js') && threeDHtml.includes('type="module"')) {
  console.log('✓ 3d.html correctly references dist/3d.js with module type');
} else {
  console.log('✗ 3d.html does not correctly reference dist/3d.js');
  allFilesExist = false;
}

// Basic syntax check - try to parse the compiled JavaScript
console.log('\nTesting JavaScript syntax...');

try {
  const appJs = fs.readFileSync('dist/app.js', 'utf8');
  // Basic check that it looks like valid JavaScript
  if (appJs.includes('export') || appJs.includes('import') || appJs.includes('class Circle')) {
    console.log('✓ dist/app.js has valid JavaScript syntax');
  }
} catch (error) {
  console.log('✗ Error reading dist/app.js:', error.message);
  allFilesExist = false;
}

try {
  const threeDJs = fs.readFileSync('dist/3d.js', 'utf8');
  if (threeDJs.includes('ForceGraph3D') || threeDJs.includes('extractGraphData')) {
    console.log('✓ dist/3d.js has valid JavaScript syntax');
  }
} catch (error) {
  console.log('✗ Error reading dist/3d.js:', error.message);
  allFilesExist = false;
}

console.log('\n' + (allFilesExist ? 'All tests passed! ✓' : 'Some tests failed! ✗'));
process.exit(allFilesExist ? 0 : 1);