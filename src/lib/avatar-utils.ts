
// src/lib/avatar-utils.ts

// Helper function to generate a color based on the text
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

// Helper function to generate a data URL for a text avatar
export const generateAvatarFromText = (text: string, size = 128) => {
  if (!text || text.length === 0) {
    return null; // Return null if no text to generate avatar from
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Background color
  const bgColor = stringToColor(text);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // Text
  ctx.fillStyle = '#FFFFFF'; // White text
  ctx.font = `bold ${size / 2}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.charAt(0).toUpperCase(), size / 2, size / 2);

  return canvas.toDataURL();
};
