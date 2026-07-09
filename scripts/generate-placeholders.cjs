const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'public', 'images', 'products');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const products = [
  { sku: 'FG-WD-CHAIR', name: 'Heritage Lounge Chair', bg: '#1e1b4b', text: '#818cf8', icon: '🪑' },
  { sku: 'FG-WD-TABLE', name: 'Oak Conference Table', bg: '#1c1917', text: '#a8a29e', icon: '🪵' },
  { sku: 'FG-DINING-TABLE', name: 'Sculpted Dining Table', bg: '#451a03', text: '#fb923c', icon: '🍽️' },
  { sku: 'FG-OFFICE-CHAIR', name: 'Ergo Task Chair', bg: '#0f172a', text: '#38bdf8', icon: '💺' },
  { sku: 'FG-CONSOLE-01', name: 'Linea Console Unit', bg: '#14532d', text: '#4ade80', icon: '📺' },
  { sku: 'FG-SIDEB-01', name: 'Studio Sideboard', bg: '#581c87', text: '#c084fc', icon: '🗄️' },
  { sku: 'FG-SOFA-01', name: 'Milan Lounge Sofa', bg: '#701a75', text: '#f472b6', icon: '🛋️' },
  { sku: 'FG-BED-01', name: 'Haven Storage Bed', bg: '#1e3a8a', text: '#60a5fa', icon: '🛏️' },
  { sku: 'FG-DESK-01', name: 'Atlas Writing Desk', bg: '#311005', text: '#f97316', icon: '✍️' },
  { sku: 'FG-OTTO-01', name: 'Aurora Ottoman Set', bg: '#4c0519', text: '#fb7185', icon: '🪜' },
  { sku: 'FG-BOOK-01', name: 'Solace Bookshelf', bg: '#064e3b', text: '#34d399', icon: '📚' },
  { sku: 'FG-TABLE-02', name: 'Ember Side Table', bg: '#083344', text: '#22d3ee', icon: '☕' }
];

products.forEach(p => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
      <defs>
        <linearGradient id="grad-${p.sku}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${p.bg};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#020617;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad-${p.sku})" rx="16" />
      <circle cx="200" cy="130" r="60" fill="#ffffff" fill-opacity="0.03" />
      <text x="200" y="150" font-family="system-ui, sans-serif" font-size="70" text-anchor="middle" dominant-baseline="middle">${p.icon}</text>
      <text x="200" y="240" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="#f1f5f9" text-anchor="middle">${p.name}</text>
      <text x="200" y="265" font-family="monospace" font-size="11" fill="${p.text}" font-weight="bold" letter-spacing="2" text-anchor="middle">${p.sku}</text>
    </svg>
  `.trim();
  
  const filename = `${p.sku.toLowerCase()}.svg`;
  fs.writeFileSync(path.join(targetDir, filename), svg);
});

console.log('Seeded 12 finished goods SVGs successfully.');
