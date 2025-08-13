const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure the android assets directory exists
const androidAssetsDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'assets');
if (!fs.existsSync(androidAssetsDir)) {
  fs.mkdirSync(androidAssetsDir, { recursive: true });
}

// Create the bundle command for Android
const bundleCommand = `npx react-native bundle \
  --entry-file=index.js \
  --platform=android \
  --dev=false \
  --bundle-output=./android/app/src/main/assets/index.android.bundle \
  --assets-dest=./android/app/src/main/res \
  --minify=true`;

console.log('Creating Android JavaScript bundle for production...');
console.log(bundleCommand);

// Execute the bundle command
exec(bundleCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error creating Android bundle: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Bundle stderr: ${stderr}`);
  }
  
  console.log(`Bundle stdout: ${stdout}`);
  console.log('Android JavaScript bundle created successfully!');
  console.log('Bundle location: ./android/app/src/main/assets/index.android.bundle');
  console.log('Assets location: ./android/app/src/main/res');
});