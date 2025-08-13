const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create directory if it doesn't exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Generate the VocalClerk icon
const generateIcon = (size) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Set background color (gradient)
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#4a90e2');
  gradient.addColorStop(1, '#34c759');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Add a subtle pattern
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < size; i += Math.floor(size / 50)) {
    ctx.fillRect(0, i, size, Math.floor(size / 100));
  }
  
  // Draw a white circle in the center
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw text "VC" (VocalClerk)
  ctx.fillStyle = '#4a90e2';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VC', size / 2, size / 2);
  
  return canvas.toBuffer('image/png');
};

// Generate icons for different platforms and sizes
const generateIcons = () => {
  // Define icon sizes for different platforms
  const icons = [
    { name: 'icon.png', size: 1024 },
    { name: 'adaptive-icon.png', size: 1024 },
    { name: 'splash-icon.png', size: 1024 },
    { name: 'favicon.png', size: 196 }
  ];
  
  // Generate each icon
  icons.forEach(icon => {
    const iconBuffer = generateIcon(icon.size);
    fs.writeFileSync(path.join(__dirname, icon.name), iconBuffer);
    console.log(`Generated ${icon.name} (${icon.size}x${icon.size})`);
  });
};

// Run the icon generation
generateIcons();