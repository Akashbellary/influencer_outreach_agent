const fs = require('fs');
const path = require('path');

console.log('Checking if .next directory exists...');
const nextDir = path.join(__dirname, '.next');
if (fs.existsSync(nextDir)) {
  console.log('.next directory exists');
  const files = fs.readdirSync(nextDir);
  console.log('Files in .next:', files);
} else {
  console.log('.next directory does not exist');
}

console.log('Checking if package.json exists...');
const packageJson = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJson)) {
  console.log('package.json exists');
} else {
  console.log('package.json does not exist');
}

console.log('Checking build script in package.json...');
const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
if (pkg.scripts && pkg.scripts.build) {
  console.log('Build script exists:', pkg.scripts.build);
} else {
  console.log('Build script does not exist');
}