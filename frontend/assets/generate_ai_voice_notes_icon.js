const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create a canvas with the desired dimensions
const width = 1024;
const height = 1024;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius, fill) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    } else {
        ctx.stroke();
    }
}

// Draw microphone
function drawMicrophone(ctx, centerX, centerY, size) {
    const micWidth = size * 0.4;
    const micHeight = size * 0.6;
    const baseWidth = size * 0.6;
    const baseHeight = size * 0.15;
    
    ctx.fillStyle = '#4a90e2';
    
    // Microphone body
    roundRect(ctx, centerX - micWidth/2, centerY - micHeight/2, micWidth, micHeight, micWidth/2, true);
    
    // Microphone stand
    ctx.fillRect(centerX - 5, centerY + micHeight/2 - 5, 10, size * 0.2);
    
    // Microphone base
    roundRect(ctx, centerX - baseWidth/2, centerY + micHeight/2 + size * 0.2 - 5, baseWidth, baseHeight, 10, true);
    
    // Sound waves
    ctx.strokeStyle = '#34c759';
    ctx.lineWidth = 8;
    
    // Draw sound waves as arcs
    for (let i = 1; i <= 3; i++) {
        const radius = size * 0.2 * i;
        ctx.beginPath();
        ctx.arc(centerX, centerY - micHeight * 0.2, radius, Math.PI * 0.8, Math.PI * 0.2, true);
        ctx.stroke();
    }
}

// Draw AI circuit pattern
function drawAICircuitPattern(ctx, width, height) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    
    // Set a fixed seed for reproducible results
    let seed = 12345;
    const random = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
    
    // Draw circuit lines
    for (let i = 0; i < 8; i++) {
        const startX = random() * width;
        const startY = random() * height;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        // Create a path with 3-5 segments
        let currentX = startX;
        let currentY = startY;
        const segments = 3 + Math.floor(random() * 3);
        
        for (let j = 0; j < segments; j++) {
            // Decide if this segment is horizontal or vertical
            if (random() > 0.5) {
                currentX = currentX + (random() * 0.3 - 0.15) * width;
            } else {
                currentY = currentY + (random() * 0.3 - 0.15) * height;
            }
            
            // Add a 90-degree turn
            ctx.lineTo(currentX, currentY);
        }
        
        ctx.stroke();
        
        // Add circuit nodes at the end points
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(startX, startY, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw glowing effect
function drawGlowingEffect(ctx, centerX, centerY, size) {
    const gradient = ctx.createRadialGradient(
        centerX, centerY, size * 0.2,
        centerX, centerY, size * 0.5
    );
    gradient.addColorStop(0, 'rgba(52, 199, 89, 0.3)');
    gradient.addColorStop(1, 'rgba(52, 199, 89, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
}

// Generate the icon
function generateIcon() {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#4a90e2');  // Blue
    gradient.addColorStop(1, '#34c759');  // Green
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw rounded rectangle for notepad
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, width * 0.15, height * 0.15, width * 0.7, height * 0.7, 40, true);
    
    // Draw notepad lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 5;
    for (let i = 0; i < 6; i++) {
        const y = height * 0.25 + i * (height * 0.5 / 6);
        ctx.beginPath();
        ctx.moveTo(width * 0.2, y);
        ctx.lineTo(width * 0.8, y);
        ctx.stroke();
    }
    
    // Draw microphone
    drawMicrophone(ctx, width * 0.5, height * 0.5, width * 0.25);
    
    // Draw AI circuit pattern overlay
    drawAICircuitPattern(ctx, width, height);
    
    // Draw glowing effect around the microphone
    drawGlowingEffect(ctx, width * 0.5, height * 0.5, width * 0.3);
    
    // Save the icon
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname, 'icon.png'), buffer);
    fs.writeFileSync(path.join(__dirname, 'adaptive-icon.png'), buffer);
    console.log('Icon generated successfully!');
}

// Generate the icon
generateIcon();