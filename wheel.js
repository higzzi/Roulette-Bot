const { join } = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

registerFont(join(__dirname, 'assets', 'Poppins', 'Poppins-Bold.ttf'), {
  family: 'PoppinsBold',
});
registerFont(join(__dirname, 'assets', 'Poppins', 'Poppins-Regular.ttf'), {
  family: 'PoppinsReg',
});

const loadImageWithFallback = async (url) => {
  try {
    return await loadImage(url);
  } catch (error) {
    console.error(`Failed to load image from ${url}, using fallback image.`);
    return await loadImage(join(__dirname, 'assets', 'fallback.png'));
  }
};

module.exports.createSpinWheel = async (data, returnCanvas) => {
  const canvas = createCanvas(600, 600); // Smaller canvas size for mobile-friendly wheel
  const ctx = canvas.getContext('2d');

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const outerRadius = 200; // Reduced outer radius
  const innerRadius = 50;  // Reduced inner radius

  const colors = [
    ['#FF0000', '#000000'], // Red to Black
  ];

  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius + 20, 0, 2 * Math.PI, false);
  ctx.fillStyle = '#333333';
  ctx.fill();

  const totalSegments = data.length;
  const angleStep = (2 * Math.PI) / totalSegments;

  for (let i = 0; i < totalSegments; i++) {
    const startAngle = i * angleStep - Math.PI / 2;
    const endAngle = startAngle + angleStep;
    const color = colors[i % colors.length];

    const gradient = ctx.createLinearGradient(
      centerX + Math.cos(startAngle) * innerRadius,
      centerY + Math.sin(startAngle) * innerRadius,
      centerX + Math.cos(endAngle) * outerRadius,
      centerY + Math.sin(endAngle) * outerRadius
    );
    gradient.addColorStop(0, color[0]);
    gradient.addColorStop(1, color[1]);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle, false);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startAngle + angleStep / 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px PoppinsBold'; // Adjusted font size
    const label = data[i].label;
    const maxTextWidth = outerRadius - innerRadius - 40;
    wrapText(ctx, label, (outerRadius + innerRadius) / 2, 0, maxTextWidth, 24);

    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI, false);
  ctx.fillStyle = '#222222';
  ctx.fill();

  const glossGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    innerRadius,
    centerX,
    centerY,
    outerRadius
  );
  glossGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
  glossGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI, false);
  ctx.fillStyle = glossGradient;
  ctx.fill();

  if (returnCanvas) return canvas;

  return canvas.toBuffer('image/png');
};

module.exports.createWheel = async (data, userAvatar) => {
  const winnerIndex = data.findIndex((item) => item.winner);

  const rotatedData = data.slice(winnerIndex).concat(data.slice(0, winnerIndex));

  const spinwheel = await module.exports.createSpinWheel(rotatedData, true);
  const canvas = createCanvas(600, 600); // Adjusted canvas size for mobile
  const ctx = canvas.getContext('2d');

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const outerRadius = 200; // Reduced outer radius
  const innerRadius = 50;  // Reduced inner radius

  ctx.save();
  ctx.translate(centerX, centerY);
  const angleStep = (2 * Math.PI) / data.length;
  ctx.rotate(-angleStep / 2);
  ctx.drawImage(spinwheel, -centerX, -centerY);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius + 20, 0, 2 * Math.PI, false);
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#000000'; // Black outline
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius - 10, 0, 2 * Math.PI, false);
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#000000'; // Black outline
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius - 15, 0, 2 * Math.PI, false);
  ctx.fillStyle = '#333333';
  ctx.fill();
  ctx.clip();

  const userImage = await loadImageWithFallback(userAvatar);
  ctx.drawImage(
    userImage,
    centerX - (innerRadius - 15),
    centerY - (innerRadius - 15),
    (innerRadius - 15) * 2,
    (innerRadius - 15) * 2
  );
  ctx.restore();

  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius - 15, 0, 2 * Math.PI, false);
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#000000'; // Black outline
  ctx.stroke();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Move the pointer further up
  const pointer = await loadImage(join(__dirname, 'assets', 'pointer.png'));

  ctx.save();
  ctx.translate(centerX - 40, centerY - outerRadius - 60); // Move pointer further up
  ctx.drawImage(pointer, 0, 0, 80, 80); // Draw pointer at the top center
  ctx.restore();

  return canvas.toBuffer('image/png');
};

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  const totalHeight = lines.length * lineHeight;
  const startY = y - totalHeight / 2 + lineHeight / 2;

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, startY + i * lineHeight);
  }
}
