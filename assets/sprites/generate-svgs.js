const fs = require('fs');
const path = require('path');

const OUT = __dirname;

function writeSprite(name, svgContent) {
  fs.writeFileSync(path.join(OUT, `${name}.svg`), svgContent);
}

// Player sprite
writeSprite('player', `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <radialGradient id="pg" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#b8e6ff"/>
      <stop offset="100%" stop-color="#50c8ff" stop-opacity="0.7"/>
    </radialGradient>
  </defs>
  <ellipse cx="32" cy="32" rx="28" ry="18" fill="url(#pg)"/>
  <ellipse cx="44" cy="28" rx="6" ry="4" fill="rgba(255,255,255,0.6)"/>
  <path d="M8 32 Q0 28 2 20 Q6 24 12 26" fill="rgba(255,255,255,0.3)"/>
</svg>`);

// Boss sprite
writeSprite('boss', `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <radialGradient id="bg" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#a020e0"/>
      <stop offset="60%" stop-color="#3c0064"/>
      <stop offset="100%" stop-color="#1a0030" stop-opacity="0.8"/>
    </radialGradient>
  </defs>
  <circle cx="64" cy="64" r="56" fill="url(#bg)"/>
  <ellipse cx="88" cy="48" rx="10" ry="6" fill="rgba(255,60,60,0.8)"/>
  <ellipse cx="88" cy="56" rx="4" ry="8" fill="rgba(255,60,60,0.8)"/>
  <ellipse cx="40" cy="48" rx="10" ry="6" fill="rgba(255,60,60,0.8)"/>
  <ellipse cx="40" cy="56" rx="4" ry="8" fill="rgba(255,60,60,0.8)"/>
  <path d="M20 64 Q8 40 16 20 Q24 36 28 52" fill="none" stroke="rgba(160,40,220,0.6)" stroke-width="3"/>
  <path d="M108 64 Q120 40 112 20 Q104 36 100 52" fill="none" stroke="rgba(160,40,220,0.6)" stroke-width="3"/>
</svg>`);

// Creature sprites based on templates
const creatures = [
  { name: 'plankton', col: '#3cdca0', r: 4 },
  { name: 'mote', col: '#64e6c8', r: 7 },
  { name: 'shrimp', col: '#dc9646', r: 11 },
  { name: 'jellyfish', col: '#b45aff', r: 15 },
  { name: 'seahorse', col: '#c8a028', r: 10 },
  { name: 'anglerfish', col: '#3c50c8', r: 20 },
  { name: 'eel', col: '#28b450', r: 18 },
  { name: 'manta', col: '#1e78b4', r: 24 },
  { name: 'viperfish', col: '#3cb478', r: 19 },
  { name: 'squid', col: '#a02878', r: 26 },
  { name: 'dragonfish', col: '#b42828', r: 22 },
  { name: 'coelacanth', col: '#2850a0', r: 30 },
  { name: 'leviathan', col: '#143278', r: 48 },
];

creatures.forEach(c => {
  const size = c.r * 4;
  const cx = size / 2;
  const cy = size / 2;
  writeSprite(c.name, `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <radialGradient id="cg${c.name}" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="${c.col}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${c.col}" stop-opacity="0.6"/>
      </radialGradient>
    </defs>
    <ellipse cx="${cx}" cy="${cy}" rx="${c.r * 1.6}" ry="${c.r}" fill="url(#cg${c.name})"/>
    <ellipse cx="${cx + c.r * 0.8}" cy="${cy - c.r * 0.3}" rx="${c.r * 0.3}" ry="${c.r * 0.2}" fill="rgba(255,255,255,0.5)"/>
  </svg>`);
});

// Ink cloud sprite
writeSprite('ink', `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <circle cx="64" cy="64" r="56" fill="rgba(10,0,30,0.5)"/>
  <circle cx="48" cy="48" r="32" fill="rgba(10,0,30,0.4)"/>
  <circle cx="80" cy="80" r="28" fill="rgba(10,0,30,0.3)"/>
</svg>`);

// Lure sprite
writeSprite('lure', `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(80,200,255,0.3)" stroke-width="2"/>
  <circle cx="32" cy="32" r="20" fill="none" stroke="rgba(80,200,255,0.2)" stroke-width="1"/>
  <circle cx="32" cy="32" r="6" fill="rgba(80,200,255,0.6)"/>
</svg>`);

console.log('Generated', creatures.length + 4, 'SVG sprites to', OUT);
