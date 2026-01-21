const fs = require('fs');
const path = require('path');

// Files to keep
const essentialFiles = [
  'icon.png',
  'adaptive-icon.png',
  'splash-icon.png',
  'favicon.png',
  'microphone-icon.svg',
  'stop-recording-icon.svg',
  // Keep this cleanup script
  'cleanup.js'
];

// Function to delete files
function cleanupAssets() {
  const assetsDir = __dirname;
  
  try {
    // Get all files in the assets directory
    const files = fs.readdirSync(assetsDir);
    
    // Filter out directories and essential files
    const filesToDelete = files.filter(file => {
      const filePath = path.join(assetsDir, file);
      const isDirectory = fs.statSync(filePath).isDirectory();
      
      // Skip directories and essential files
      return !isDirectory && !essentialFiles.includes(file);
    });
    
    // Create backup directory
    const backupDir = path.join(assetsDir, 'unused_files_backup_' + Date.now());
    fs.mkdirSync(backupDir, { recursive: true });
    
    console.log('Creating backup of unused files in:', backupDir);
    
    // Move files to backup directory
    filesToDelete.forEach(file => {
      const filePath = path.join(assetsDir, file);
      const backupPath = path.join(backupDir, file);
      
      fs.copyFileSync(filePath, backupPath);
      fs.unlinkSync(filePath);
      console.log(`Moved ${file} to backup`);
    });
    
    console.log('\nCleanup complete!');
    console.log(`${filesToDelete.length} unused files have been moved to: ${backupDir}`);
    console.log('If you need any of these files back, you can find them in the backup directory.');
    
    // Handle backup directories (icon_backup_*)
    const directories = files.filter(file => {
      const filePath = path.join(assetsDir, file);
      return fs.statSync(filePath).isDirectory() && file.startsWith('icon_backup_');
    });
    
    if (directories.length > 0) {
      console.log('\nFound icon backup directories:');
      directories.forEach(dir => console.log(`- ${dir}`));
      console.log('These directories contain backups of previous icons.');
      console.log('You can manually delete them if you no longer need them.');
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
cleanupAssets();