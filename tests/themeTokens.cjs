const { readFileSync } = require('node:fs');
const assert = require('node:assert');

const css = readFileSync('src/app/globals.css', 'utf-8');

const expectedTokens = {
  '--background': '215 28% 12%',
  '--foreground': '214 32% 92%',
  '--card': '215 25% 16%',
  '--primary': '217 100% 60%'
};

const missingTokens = Object.entries(expectedTokens).filter(([token, value]) => {
  return !css.includes(`${token}: ${value}`);
});

if (missingTokens.length > 0) {
  const details = missingTokens.map(([token]) => token).join(', ');
  throw new Error(`Missing or incorrect dark-theme tokens: ${details}`);
}

function luminance(hex) {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16) / 255;
  const g = parseInt(value.substring(2, 4), 16) / 255;
  const b = parseInt(value.substring(4, 6), 16) / 255;
  const transform = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

function contrast(hexA, hexB) {
  const lumA = luminance(hexA);
  const lumB = luminance(hexB);
  const brightest = Math.max(lumA, lumB);
  const darkest = Math.min(lumA, lumB);
  return (brightest + 0.05) / (darkest + 0.05);
}

const backgroundHex = '#141A24';
const foregroundHex = '#E6ECF5';
assert.ok(contrast(backgroundHex, foregroundHex) >= 4.5, 'background/foreground contrast must meet WCAG AA');

console.log('Theme token checks passed.');
