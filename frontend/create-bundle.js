const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure the ios directory exists
const iosDir = path.join(__dirname, 'ios');
if (!fs.existsSync(iosDir)) {
  fs.mkdirSync(iosDir, { recursive: true });
}

// Create the bundle command
const bundleCommand = `npx react-native bundle \
  --entry-file=index.js \
  --platform=ios \
  --dev=false \
  --bundle-output=./ios/main.jsbundle \
  --assets-dest=./ios \
  --minify=true`;

console.log('Creating JavaScript bundle for production...');
console.log(bundleCommand);

// Execute the bundle command
exec(bundleCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error creating bundle: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Bundle stderr: ${stderr}`);
  }
  
  console.log(`Bundle stdout: ${stdout}`);
  console.log('JavaScript bundle created successfully!');
  console.log('Bundle location: ./ios/main.jsbundle');
  console.log('Assets location: ./ios/assets');
});