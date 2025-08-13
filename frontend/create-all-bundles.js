const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Creating JavaScript bundles for all platforms...');

// Create iOS bundle
console.log('Step 1: Creating iOS bundle...');
exec('node create-bundle.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error creating iOS bundle: ${error.message}`);
    return;
  }
  
  console.log('iOS bundle created successfully.');
  
  // Create Android bundle
  console.log('Step 2: Creating Android bundle...');
  exec('node create-android-bundle.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error creating Android bundle: ${error.message}`);
      return;
    }
    
    console.log('Android bundle created successfully.');
    console.log('All bundles have been created successfully!');
    console.log('You can now run the app on any device using run-on-device.js');
  });
});