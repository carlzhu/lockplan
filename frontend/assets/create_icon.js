const fs = require('fs');
const { createCanvas } = require('canvas');

// Function to create an icon
function createIcon(size, filename) {
  // Create canvas
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#4a90e2');  // Blue
  gradient.addColorStop(1, '#34c759');  // Green
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Add subtle pattern
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < size; i += Math.floor(size / 50)) {
    ctx.fillRect(0, i, size, Math.floor(size / 100));
  }
  
  // Draw white circle in center
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw "VC" text
  ctx.fillStyle = '#4a90e2';
  ctx.font = `bold ${Math.floor(size * 0.4)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VC', size / 2, size / 2);
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created ${filename} (${size}x${size})`);
}

// Create icons in different sizes
createIcon(1024, 'icon.png');
createIcon(1024, 'adaptive-icon.png');
createIcon(1024, 'splash-icon.png');
createIcon(196, 'favicon.png');

console.log('All icons created successfully!');