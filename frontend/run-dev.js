const { exec } = require('child_process');

console.log('Starting development server...');

// Run the app in development mode
exec('npx expo start', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error starting development server: ${error.message}`);
    return;
  }
  
  console.log(stdout);
});