const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Building production version of the app...');

// Ask user which platform to build for
rl.question('Which platform do you want to build for? (ios/android/both): ', (platform) => {
  platform = platform.toLowerCase();
  
  if (platform !== 'ios' && platform !== 'android' && platform !== 'both') {
    console.error('Invalid platform. Please specify "ios", "android", or "both".');
    rl.close();
    process.exit(1);
  }
  
  const buildIOS = platform === 'ios' || platform === 'both';
  const buildAndroid = platform === 'android' || platform === 'both';
  
  // First, create the JavaScript bundles
  console.log('Step 1: Creating JavaScript bundles...');
  
  const createBundles = () => {
    return new Promise((resolve, reject) => {
      const promises = [];
      
      if (buildIOS) {
        promises.push(new Promise((resolveIOS, rejectIOS) => {
          console.log('Creating iOS bundle...');
          exec('node create-bundle.js', (error, stdout, stderr) => {
            if (error) {
              console.error(`Error creating iOS bundle: ${error.message}`);
              rejectIOS(error);
              return;
            }
            console.log('iOS bundle created successfully.');
            resolveIOS();
          });
        }));
      }
      
      if (buildAndroid) {
        promises.push(new Promise((resolveAndroid, rejectAndroid) => {
          console.log('Creating Android bundle...');
          exec('node create-android-bundle.js', (error, stdout, stderr) => {
            if (error) {
              console.error(`Error creating Android bundle: ${error.message}`);
              rejectAndroid(error);
              return;
            }
            console.log('Android bundle created successfully.');
            resolveAndroid();
          });
        }));
      }
      
      Promise.all(promises)
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  };
  
  // Build the apps
  const buildApps = () => {
    console.log('Step 2: Building apps...');
    
    const buildPromises = [];
    
    if (buildIOS) {
      buildPromises.push(new Promise((resolveIOS, rejectIOS) => {
        console.log('Building iOS app...');
        exec('npx expo build:ios --no-publish', (error, stdout, stderr) => {
          if (error) {
            console.error(`Error building iOS app: ${error.message}`);
            rejectIOS(error);
            return;
          }
          console.log('iOS build completed successfully.');
          resolveIOS();
        });
      }));
    }
    
    if (buildAndroid) {
      buildPromises.push(new Promise((resolveAndroid, rejectAndroid) => {
        console.log('Building Android app...');
        exec('npx expo build:android --no-publish', (error, stdout, stderr) => {
          if (error) {
            console.error(`Error building Android app: ${error.message}`);
            rejectAndroid(error);
            return;
          }
          console.log('Android build completed successfully.');
          resolveAndroid();
        });
      }));
    }
    
    return Promise.all(buildPromises);
  };
  
  // Execute the build process
  createBundles()
    .then(() => buildApps())
    .then(() => {
      console.log('Production build completed successfully!');
      console.log('You can now install the app on your physical device.');
      rl.close();
    })
    .catch((error) => {
      console.error('Build process failed:', error);
      rl.close();
    });
});
