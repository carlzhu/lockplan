const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Preparing to run app on physical device...');

// Ask user which platform to run on
rl.question('Which platform do you want to run on? (ios/android): ', (platform) => {
  platform = platform.toLowerCase();
  
  if (platform !== 'ios' && platform !== 'android') {
    console.error('Invalid platform. Please specify "ios" or "android".');
    rl.close();
    process.exit(1);
  }
  
  // Check if the appropriate bundle exists
  let bundlePath;
  if (platform === 'ios') {
    bundlePath = path.join(__dirname, 'ios', 'main.jsbundle');
    if (!fs.existsSync(bundlePath)) {
      console.error('iOS bundle file not found. Please run create-bundle.js first.');
      rl.close();
      process.exit(1);
    }
  } else {
    bundlePath = path.join(__dirname, 'android', 'app', 'src', 'main', 'assets', 'index.android.bundle');
    if (!fs.existsSync(bundlePath)) {
      console.error('Android bundle file not found. Please run create-android-bundle.js first.');
      rl.close();
      process.exit(1);
    }
  }
  
  // Run the app on a connected device
  console.log(`Running app on connected ${platform} device...`);
  exec(`npx expo run:${platform} --device`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running app on device: ${error.message}`);
      console.log('If you see "No script URL provided" error, make sure to:');
      console.log('1. Connect your device via USB');
      console.log('2. Trust your development computer on the device');
      console.log('3. Make sure the device is unlocked');
      rl.close();
      return;
    }
    
    console.log(stdout);
    console.log(`App is now running on your physical ${platform} device!`);
    rl.close();
  });
});
