const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const db = new PrismaClient({ adapter });

const imgDir = path.join(__dirname, '..', 'public', 'images', 'products');
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

// 50 finished goods data
const categories = {
  LIVING_ROOM: 'Living Room',
  BEDROOM: 'Bedroom',
  DINING: 'Dining',
  OFFICE: 'Office',
  STORAGE: 'Storage',
  OUTDOOR: 'Outdoor',
  DECOR: 'Decor'
};

const products = [
  // --- LIVING ROOM (8 products) ---
  {
    sku: 'FG-SOFA-01',
    name: 'Milan Lounge Sofa',
    category: categories.LIVING_ROOM,
    sellingPrice: 32800,
    costPrice: 19800,
    stockQty: 8,
    reorderLevel: 2,
    dimensions: '220 x 95 x 78 cm',
    material: 'Italian Leather',
    warranty: '5 Year Warranty',
    description: 'Plush modular sofa with Italian leather upholstery, solid ashwood legs, and high-density foam cushions.',
    icon: '🛋️',
    bg: '#701a75',
    text: '#f472b6'
  },
  {
    sku: 'FG-SOFA-02',
    name: 'Chesterfield Classic Sofa',
    category: categories.LIVING_ROOM,
    sellingPrice: 45000,
    costPrice: 28000,
    stockQty: 5,
    reorderLevel: 1,
    dimensions: '240 x 98 x 75 cm',
    material: 'Premium Velvet & Mahogany',
    warranty: '7 Year Structural Warranty',
    description: 'Deep button-tufted Chesterfield sofa featuring rolled arms, brass nailhead trim, and dark mahogany legs.',
    icon: '🛋️',
    bg: '#4c0519',
    text: '#fb7185'
  },
  {
    sku: 'FG-SOFA-03',
    name: 'Nordic 3-Seater Sofa',
    category: categories.LIVING_ROOM,
    sellingPrice: 24900,
    costPrice: 15000,
    stockQty: 10,
    reorderLevel: 3,
    dimensions: '200 x 85 x 80 cm',
    material: 'Oak & Linen Blend',
    warranty: '3 Year Warranty',
    description: 'Scandinavian-inspired fabric sofa with tapered oak legs, clean lines, and soft linen-blend cushions.',
    icon: '🛋️',
    bg: '#1e3a8a',
    text: '#60a5fa'
  },
  {
    sku: 'FG-OTTO-01',
    name: 'Aurora Ottoman Set',
    category: categories.LIVING_ROOM,
    sellingPrice: 11800,
    costPrice: 6900,
    stockQty: 12,
    reorderLevel: 2,
    dimensions: '45 x 45 x 42 cm',
    material: 'Walnut & Velvet',
    warranty: '2 Year Warranty',
    description: 'Set of two nesting ottomans with tufted velvet seats and storage space inside. Perfect for compact lounge areas.',
    icon: '🪜',
    bg: '#831843',
    text: '#f472b6'
  },
  {
    sku: 'FG-ARMCH-01',
    name: 'Velvet Accent Armchair',
    category: categories.LIVING_ROOM,
    sellingPrice: 14500,
    costPrice: 8500,
    stockQty: 15,
    reorderLevel: 4,
    dimensions: '85 x 80 x 95 cm',
    material: 'Velvet & Steel Gold Base',
    warranty: '2 Year Warranty',
    description: 'Luxurious velvet armchair with a shell-back design, gold-plated steel legs, and comfortable bucket seating.',
    icon: '🪑',
    bg: '#1e1b4b',
    text: '#818cf8'
  },
  {
    sku: 'FG-COF-01',
    name: 'Rustic Oak Coffee Table',
    category: categories.LIVING_ROOM,
    sellingPrice: 9500,
    costPrice: 5500,
    stockQty: 14,
    reorderLevel: 3,
    dimensions: '120 x 60 x 45 cm',
    material: 'Solid Oak Wood',
    warranty: '3 Year Warranty',
    description: 'Rustic rectangular coffee table constructed from reclaimed oak beams with a bottom storage shelf.',
    icon: '🪵',
    bg: '#1c1917',
    text: '#a8a29e'
  },
  {
    sku: 'FG-COF-02',
    name: 'Marble Top Coffee Table',
    category: categories.LIVING_ROOM,
    sellingPrice: 16800,
    costPrice: 9800,
    stockQty: 9,
    reorderLevel: 2,
    dimensions: '90 x 90 x 40 cm',
    material: 'Carrara Marble & Brass',
    warranty: '3 Year Warranty',
    description: 'Round coffee table with a polished white Carrara marble top supported by an geometric brass metal base.',
    icon: '🪙',
    bg: '#0f172a',
    text: '#38bdf8'
  },
  {
    sku: 'FG-TV-01',
    name: 'Minimalist TV Console',
    category: categories.LIVING_ROOM,
    sellingPrice: 19800,
    costPrice: 12000,
    stockQty: 7,
    reorderLevel: 2,
    dimensions: '180 x 40 x 50 cm',
    material: 'Teakwood & Matte Black Metal',
    warranty: '5 Year Warranty',
    description: 'Low-profile TV console with three drawers, two open shelves for media players, and pre-drilled cable management holes.',
    icon: '📺',
    bg: '#14532d',
    text: '#4ade80'
  },

  // --- BEDROOM (8 products) ---
  {
    sku: 'FG-BED-01',
    name: 'Haven Modular Storage Bed',
    category: categories.BEDROOM,
    sellingPrice: 41900,
    costPrice: 25200,
    stockQty: 4,
    reorderLevel: 1,
    dimensions: '210 x 200 x 120 cm',
    material: 'Ashwood & Fabric',
    warranty: '4 Year Warranty',
    description: 'Contemporary king-size storage bed featuring a hydraulic lift mechanism to access spacious under-bed compartments.',
    icon: '🛏️',
    bg: '#1e3a8a',
    text: '#60a5fa'
  },
  {
    sku: 'FG-BED-02',
    name: 'Royal Velvet Canopy Bed',
    category: categories.BEDROOM,
    sellingPrice: 58000,
    costPrice: 35000,
    stockQty: 3,
    reorderLevel: 1,
    dimensions: '220 x 210 x 220 cm',
    material: 'Steel & Premium Velvet',
    warranty: '5 Year Structural Warranty',
    description: 'Dramatic canopy poster bed with a matte black metal frame and a tufted grey velvet headboard panel.',
    icon: '🛏️',
    bg: '#311005',
    text: '#f97316'
  },
  {
    sku: 'FG-BED-03',
    name: 'Floating Wooden Platform Bed',
    category: categories.BEDROOM,
    sellingPrice: 34500,
    costPrice: 21000,
    stockQty: 6,
    reorderLevel: 2,
    dimensions: '215 x 195 x 90 cm',
    material: 'Solid Walnut Wood',
    warranty: '5 Year Warranty',
    description: 'Minimalist platform bed featuring a floating base effect, integrated LED accent lights, and a wide wooden slab headboard.',
    icon: '🛏️',
    bg: '#451a03',
    text: '#fb923c'
  },
  {
    sku: 'FG-NS-01',
    name: 'Walnut 2-Drawer Nightstand',
    category: categories.BEDROOM,
    sellingPrice: 7200,
    costPrice: 4200,
    stockQty: 24,
    reorderLevel: 6,
    dimensions: '50 x 40 x 55 cm',
    material: 'Solid Walnut Wood',
    warranty: '2 Year Warranty',
    description: 'Classic nightstand with two soft-close drawers and gold finish pulls. Matches the Floating Platform Bed.',
    icon: '🗄️',
    bg: '#581c87',
    text: '#c084fc'
  },
  {
    sku: 'FG-NS-02',
    name: 'Sleek Matte Black Nightstand',
    category: categories.BEDROOM,
    sellingPrice: 6500,
    costPrice: 3800,
    stockQty: 18,
    reorderLevel: 4,
    dimensions: '45 x 40 x 60 cm',
    material: 'Engineered Wood & Metal legs',
    warranty: '1 Year Warranty',
    description: 'Monochromatic black nightstand with an open cubby shelf and one spacious bottom drawer on metal sliders.',
    icon: '🗄️',
    bg: '#083344',
    text: '#22d3ee'
  },
  {
    sku: 'FG-WARD-01',
    name: 'Slide-Door Wardrobe',
    category: categories.BEDROOM,
    sellingPrice: 48900,
    costPrice: 32000,
    stockQty: 5,
    reorderLevel: 1,
    dimensions: '200 x 65 x 220 cm',
    material: 'Laminated Plywood & Mirrors',
    warranty: '3 Year Warranty',
    description: 'Large double wardrobe with sliding mirror doors, adjustable hanger rods, and 8 internal drawer lockers.',
    icon: '🚪',
    bg: '#064e3b',
    text: '#34d399'
  },
  {
    sku: 'FG-WARD-02',
    name: 'Solid Pine Armoire',
    category: categories.BEDROOM,
    sellingPrice: 36500,
    costPrice: 22000,
    stockQty: 4,
    reorderLevel: 1,
    dimensions: '120 x 60 x 190 cm',
    material: 'Solid Pine Wood',
    warranty: '5 Year Warranty',
    description: 'Rustic country-style wardrobe with two paneled swing doors, brass hardware latches, and an antique wax finish.',
    icon: '🚪',
    bg: '#4c0519',
    text: '#fb7185'
  },
  {
    sku: 'FG-DRESS-01',
    name: 'Vintage Vanity Dressing Table',
    category: categories.BEDROOM,
    sellingPrice: 21500,
    costPrice: 13000,
    stockQty: 8,
    reorderLevel: 2,
    dimensions: '100 x 45 x 140 cm',
    material: 'Rubberwood & Glass Mirror',
    warranty: '2 Year Warranty',
    description: 'Elegant vanity table with a tri-fold oval mirror, three storage drawers, and a matching cushioned stool.',
    icon: '🪞',
    bg: '#3f1a04',
    text: '#f59e0b'
  },

  // --- DINING (8 products) ---
  {
    sku: 'FG-DINING-TABLE',
    name: 'Sculpted Dining Table',
    category: categories.DINING,
    sellingPrice: 24500,
    costPrice: 18000,
    stockQty: 6,
    reorderLevel: 2,
    dimensions: '220 x 110 x 76 cm',
    material: 'Acacia Solid Wood',
    warranty: '5 Year Finish Warranty',
    description: 'Large statement dining table featuring a live-edge top, heavy iron legs, and a hand-polished wood sealant.',
    icon: '🍽️',
    bg: '#451a03',
    text: '#fb923c'
  },
  {
    sku: 'FG-DINING-02',
    name: 'Round Pedestal Dining Table',
    category: categories.DINING,
    sellingPrice: 19800,
    costPrice: 12000,
    stockQty: 8,
    reorderLevel: 2,
    dimensions: '120 x 120 x 75 cm',
    material: 'Teakwood',
    warranty: '3 Year Warranty',
    description: 'Circular dining table for 4 to 6 people, supported by a beautiful hand-carved pedestal column base.',
    icon: '🍽️',
    bg: '#1c1917',
    text: '#a8a29e'
  },
  {
    sku: 'FG-DINING-CH-01',
    name: 'Upholstered Dining Chair',
    category: categories.DINING,
    sellingPrice: 4500,
    costPrice: 2500,
    stockQty: 32,
    reorderLevel: 8,
    dimensions: '48 x 52 x 95 cm',
    material: 'Beechwood & Grey Fabric',
    warranty: '2 Year Warranty',
    description: 'Ergonomic dining chair featuring a padded backrest and grey woven fabric upholstery. (Price per unit).',
    icon: '🪑',
    bg: '#0f172a',
    text: '#38bdf8'
  },
  {
    sku: 'FG-DINING-CH-02',
    name: 'Windsor Wooden Dining Chair',
    category: categories.DINING,
    sellingPrice: 3800,
    costPrice: 2100,
    stockQty: 40,
    reorderLevel: 8,
    dimensions: '45 x 45 x 90 cm',
    material: 'Solid Rubberwood',
    warranty: '3 Year Warranty',
    description: 'Traditional Windsor spindle-back chair with a contoured saddle seat and sturdy flared legs.',
    icon: '🪑',
    bg: '#1e1b4b',
    text: '#818cf8'
  },
  {
    sku: 'FG-BARST-01',
    name: 'Industrial Leather Barstool',
    category: categories.DINING,
    sellingPrice: 5200,
    costPrice: 3000,
    stockQty: 20,
    reorderLevel: 4,
    dimensions: '40 x 40 x 75 cm',
    material: 'Goat Leather & Iron Frame',
    warranty: '1 Year Warranty',
    description: 'Comfortable bar height stool featuring genuine tan leather upholstery and an industrial iron ring base.',
    icon: '🪜',
    bg: '#701a75',
    text: '#f472b6'
  },
  {
    sku: 'FG-BUFFET-01',
    name: 'Teakwood Buffet Sideboard',
    category: categories.DINING,
    sellingPrice: 28500,
    costPrice: 17500,
    stockQty: 6,
    reorderLevel: 2,
    dimensions: '160 x 45 x 85 cm',
    material: 'Teakwood',
    warranty: '5 Year Warranty',
    description: 'Buffet credenza with 3 louvred cabinet doors and 3 felt-lined silverware storage drawers.',
    icon: '🗄️',
    bg: '#14532d',
    text: '#4ade80'
  },
  {
    sku: 'FG-WINE-01',
    name: 'Walnut Wood Wine Rack',
    category: categories.DINING,
    sellingPrice: 8500,
    costPrice: 4800,
    stockQty: 10,
    reorderLevel: 2,
    dimensions: '60 x 30 x 95 cm',
    material: 'Solid Walnut Wood & Iron',
    warranty: '2 Year Warranty',
    description: 'Compact wine storage shelf that holds 24 standard bottles, featuring a top glass holder hanger.',
    icon: '🍷',
    bg: '#4c0519',
    text: '#fb7185'
  },
  {
    sku: 'FG-BENCH-01',
    name: 'Live Edge Dining Bench',
    category: categories.DINING,
    sellingPrice: 9800,
    costPrice: 5800,
    stockQty: 12,
    reorderLevel: 3,
    dimensions: '150 x 35 x 45 cm',
    material: 'Acacia Solid Wood & Steel',
    warranty: '3 Year Warranty',
    description: 'Rustic wooden bench matching the Live Edge Dining Table. Heavy metal U-shaped block legs.',
    icon: '🪵',
    bg: '#311005',
    text: '#f97316'
  },

  // --- OFFICE (7 products) ---
  {
    sku: 'FG-OFFICE-CHAIR',
    name: 'Ergo Task Chair',
    category: categories.OFFICE,
    sellingPrice: 12800,
    costPrice: 6500,
    stockQty: 22,
    reorderLevel: 5,
    dimensions: '66 x 68 x 112 cm',
    material: 'Mesh & Ashwood',
    warranty: '2 Year Warranty',
    description: 'High-back desk chair with 3D armrests, dynamic lumbar tension control, and nylon caster wheels.',
    icon: '💺',
    bg: '#0f172a',
    text: '#38bdf8'
  },
  {
    sku: 'FG-OFFICE-CH-02',
    name: 'Executive High-Back Leather Chair',
    category: categories.OFFICE,
    sellingPrice: 21500,
    costPrice: 13000,
    stockQty: 10,
    reorderLevel: 2,
    dimensions: '70 x 70 x 125 cm',
    material: 'Nappa Leather & Aluminum',
    warranty: '5 Year Warranty',
    description: 'Luxury office chair with nappa leather upholstery, aluminum base, tilt lock, and memory foam padding.',
    icon: '💺',
    bg: '#1c1917',
    text: '#a8a29e'
  },
  {
    sku: 'FG-DESK-01',
    name: 'Atlas Writing Desk',
    category: categories.OFFICE,
    sellingPrice: 15200,
    costPrice: 9100,
    stockQty: 11,
    reorderLevel: 3,
    dimensions: '140 x 65 x 76 cm',
    material: 'Smoked Oak',
    warranty: '3 Year Warranty',
    description: 'Sleek executive desk with a solid oak tabletop, integrated wireless charging pad, and clean routing guides.',
    icon: '✍️',
    bg: '#311005',
    text: '#f97316'
  },
  {
    sku: 'FG-DESK-02',
    name: 'L-Shaped Executive Glass Desk',
    category: categories.OFFICE,
    sellingPrice: 27900,
    costPrice: 17000,
    stockQty: 5,
    reorderLevel: 1,
    dimensions: '180 x 160 x 75 cm',
    material: 'Tempered Glass & Steel',
    warranty: '3 Year Warranty',
    description: 'Spacious L-shaped home office desk featuring a heavy-duty tempered glass top and metal wire basket drawers.',
    icon: '🖥️',
    bg: '#1e3a8a',
    text: '#60a5fa'
  },
  {
    sku: 'FG-DESK-03',
    name: 'Standing Adjustable Desk',
    category: categories.OFFICE,
    sellingPrice: 31900,
    costPrice: 19500,
    stockQty: 8,
    reorderLevel: 2,
    dimensions: '150 x 75 x 72-120 cm',
    material: 'MDF Maple Top & Motorized Legs',
    warranty: '5 Year Motor Warranty',
    description: 'Motorized sit-stand desk with 4 memory height presets, a digital display console, and dual electric motors.',
    icon: '⚡',
    bg: '#083344',
    text: '#22d3ee'
  },
  {
    sku: 'FG-FILE-01',
    name: 'Rolling File Cabinet',
    category: categories.OFFICE,
    sellingPrice: 8500,
    costPrice: 5000,
    stockQty: 16,
    reorderLevel: 3,
    dimensions: '40 x 50 x 62 cm',
    material: 'Powder-coated Steel',
    warranty: '2 Year Warranty',
    description: '3-drawer mobile file cabinet with key lock, caster wheels, and drawer divider templates.',
    icon: '🗄️',
    bg: '#581c87',
    text: '#c084fc'
  },
  {
    sku: 'FG-BOOK-01',
    name: 'Solace Bookshelf',
    category: categories.OFFICE,
    sellingPrice: 19600,
    costPrice: 11200,
    stockQty: 7,
    reorderLevel: 2,
    dimensions: '180 x 35 x 220 cm',
    material: 'Matte Oak',
    warranty: '4 Year Warranty',
    description: 'Minimalist geometric bookshelves with 5 tiers of asymmetric shelving spaces for home library decoration.',
    icon: '📚',
    bg: '#064e3b',
    text: '#34d399'
  },

  // --- STORAGE (7 products) ---
  {
    sku: 'FG-SIDEB-01',
    name: 'Studio Sideboard',
    category: categories.STORAGE,
    sellingPrice: 21400,
    costPrice: 12800,
    stockQty: 6,
    reorderLevel: 2,
    dimensions: '200 x 45 x 84 cm',
    material: 'Teakwood',
    warranty: '5 Year Warranty',
    description: 'Contemporary dining storage sideboard with fluted wood details and brushed copper cabinet knobs.',
    icon: '🗄️',
    bg: '#581c87',
    text: '#c084fc'
  },
  {
    sku: 'FG-CONSOLE-01',
    name: 'Linea Console Unit',
    category: categories.STORAGE,
    sellingPrice: 16800,
    costPrice: 9500,
    stockQty: 9,
    reorderLevel: 2,
    dimensions: '180 x 42 x 78 cm',
    material: 'Walnut Veneer',
    warranty: '4 Year Warranty',
    description: 'Mid-century modern console unit featuring dynamic sliding doors and elegant tapered walnut wood legs.',
    icon: '📺',
    bg: '#14532d',
    text: '#4ade80'
  },
  {
    sku: 'FG-CHEST-01',
    name: '5-Drawer Wooden Chest',
    category: categories.STORAGE,
    sellingPrice: 18500,
    costPrice: 11000,
    stockQty: 8,
    reorderLevel: 2,
    dimensions: '80 x 45 x 115 cm',
    material: 'Solid Oak Wood',
    warranty: '3 Year Warranty',
    description: 'Tall drawer chest dresser featuring 5 drawers with antique cup handles and soft-close sliders.',
    icon: '🗄️',
    bg: '#4c0519',
    text: '#fb7185'
  },
  {
    sku: 'FG-SHOE-01',
    name: 'Entryway Shoe Bench Storage',
    category: categories.STORAGE,
    sellingPrice: 7900,
    costPrice: 4500,
    stockQty: 18,
    reorderLevel: 4,
    dimensions: '100 x 35 x 50 cm',
    material: 'Rubberwood & Cushion Fabric',
    warranty: '1 Year Warranty',
    description: 'Multi-functional entrance shoe shelf with a padded top seat bench and two shelves for 8 pairs of shoes.',
    icon: '👟',
    bg: '#1e1b4b',
    text: '#818cf8'
  },
  {
    sku: 'FG-CAB-01',
    name: 'Display Glass Cabinet',
    category: categories.STORAGE,
    sellingPrice: 23500,
    costPrice: 14000,
    stockQty: 6,
    reorderLevel: 2,
    dimensions: '90 x 40 x 180 cm',
    material: 'Tempered Glass & Oak wood',
    warranty: '3 Year Warranty',
    description: 'Curio cabinet cabinet with 4 shelves, double magnetic glass doors, and internal spotlight adapters.',
    icon: '🏆',
    bg: '#083344',
    text: '#22d3ee'
  },
  {
    sku: 'FG-SHELF-01',
    name: 'Hexagonal Wall Shelf (Set of 3)',
    category: categories.STORAGE,
    sellingPrice: 3200,
    costPrice: 1800,
    stockQty: 30,
    reorderLevel: 5,
    dimensions: '30 x 10 x 26 cm each',
    material: 'Sheesham Hardwood',
    warranty: '1 Year Warranty',
    description: 'Set of 3 geometric wall-mounted floating shelves, fully built from dark-finished Sheesham wood.',
    icon: '🧱',
    bg: '#701a75',
    text: '#f472b6'
  },
  {
    sku: 'FG-TRUNK-01',
    name: 'Antique Wooden Storage Trunk',
    category: categories.STORAGE,
    sellingPrice: 12500,
    costPrice: 7500,
    stockQty: 8,
    reorderLevel: 2,
    dimensions: '90 x 50 x 55 cm',
    material: 'Reclaimed Teak & Brass Fittings',
    warranty: '5 Year Warranty',
    description: 'Handcrafted blanket storage chest featuring heavy antique brass latches, handles, and lock fittings.',
    icon: '🧳',
    bg: '#311005',
    text: '#f97316'
  },

  // --- OUTDOOR (6 products) ---
  {
    sku: 'FG-OUT-CH-01',
    name: 'Adirondack Classic Chair',
    category: categories.OUTDOOR,
    sellingPrice: 6500,
    costPrice: 3800,
    stockQty: 20,
    reorderLevel: 4,
    dimensions: '80 x 90 x 95 cm',
    material: 'Weatherproof Teakwood',
    warranty: '3 Year Weather Warranty',
    description: 'Classic slatted outdoor lounge chair with wide armrests and a contoured high back built for pool patios.',
    icon: '🪑',
    bg: '#064e3b',
    text: '#34d399'
  },
  {
    sku: 'FG-OUT-SET-01',
    name: 'Patio Rattan Bistro Set',
    category: categories.OUTDOOR,
    sellingPrice: 19800,
    costPrice: 12000,
    stockQty: 10,
    reorderLevel: 2,
    dimensions: 'Table: 60x60x70 cm',
    material: 'Synthetic Rattan & Glass',
    warranty: '2 Year Warranty',
    description: 'Outdoor patio set consisting of 2 handwoven wicker rattan chairs and a matching round glass-top table.',
    icon: '🏖️',
    bg: '#0f172a',
    text: '#38bdf8'
  },
  {
    sku: 'FG-OUT-BENCH',
    name: 'Teak Garden Bench',
    category: categories.OUTDOOR,
    sellingPrice: 14500,
    costPrice: 8500,
    stockQty: 12,
    reorderLevel: 3,
    dimensions: '150 x 60 x 90 cm',
    material: 'Grade-A Teakwood',
    warranty: '5 Year Structural Warranty',
    description: 'Premium outdoor bench built with moisture-resistant grade-A teak, natural wood oils finish.',
    icon: '🪵',
    bg: '#1c1917',
    text: '#a8a29e'
  },
  {
    sku: 'FG-OUT-LOUNGE',
    name: 'Rattan Sun Lounger',
    category: categories.OUTDOOR,
    sellingPrice: 12800,
    costPrice: 7500,
    stockQty: 8,
    reorderLevel: 2,
    dimensions: '200 x 65 x 35 cm',
    material: 'PE Wicker & Aluminum',
    warranty: '2 Year Warranty',
    description: 'Adjustable reclining sunbed lounger with a rust-proof aluminum frame and waterproof beige cushion pad.',
    icon: '🛌',
    bg: '#1e3a8a',
    text: '#60a5fa'
  },
  {
    sku: 'FG-OUT-TAB',
    name: 'Folding Wooden Picnic Table',
    category: categories.OUTDOOR,
    sellingPrice: 11500,
    costPrice: 6800,
    stockQty: 7,
    reorderLevel: 2,
    dimensions: '140 x 140 x 75 cm',
    material: 'Treated Pinewood',
    warranty: '2 Year Warranty',
    description: 'Classic picnic table with integrated bench seating, folds flat for storage, treated with UV protectant layer.',
    icon: '🍽️',
    bg: '#3f1a04',
    text: '#f59e0b'
  },
  {
    sku: 'FG-OUT-SWING',
    name: 'Porch Hanging Swing Chair',
    category: categories.OUTDOOR,
    sellingPrice: 15800,
    costPrice: 9500,
    stockQty: 6,
    reorderLevel: 1,
    dimensions: '110 x 110 x 195 cm',
    material: 'Iron stand & Synthetic Wicker',
    warranty: '2 Year Structural Warranty',
    description: 'Hanging egg-shaped swing basket chair with heavy-duty iron stand and plush outdoor cushion pad.',
    icon: '🧺',
    bg: '#701a75',
    text: '#f472b6'
  },

  // --- DECOR (6 products) ---
  {
    sku: 'FG-DEC-MIR-01',
    name: 'Sunburst Wall Mirror',
    category: categories.DECOR,
    sellingPrice: 4800,
    costPrice: 2500,
    stockQty: 25,
    reorderLevel: 5,
    dimensions: '80 x 80 x 3 cm',
    material: 'Bamboo wood & Premium Glass',
    warranty: '1 Year Warranty',
    description: 'Decorative wall mirror with a hand-carved sunburst wooden frame accent for hallways and dining spaces.',
    icon: '🪞',
    bg: '#581c87',
    text: '#c084fc'
  },
  {
    sku: 'FG-DEC-LAMP-01',
    name: 'Tripod Oak Floor Lamp',
    category: categories.DECOR,
    sellingPrice: 5900,
    costPrice: 3200,
    stockQty: 20,
    reorderLevel: 4,
    dimensions: '45 x 45 x 155 cm',
    material: 'Oakwood & Fabric shade',
    warranty: '1 Year Electronic Warranty',
    description: 'Modern floor lamp featuring adjustable height oakwood tripod legs and a textured linen drum shade.',
    icon: '💡',
    bg: '#14532d',
    text: '#4ade80'
  },
  {
    sku: 'FG-DEC-PLAN-01',
    name: 'Ceramic Planter with Wooden Stand',
    category: categories.DECOR,
    sellingPrice: 2900,
    costPrice: 1500,
    stockQty: 30,
    reorderLevel: 6,
    dimensions: '30 x 30 x 45 cm',
    material: 'Ceramic & Acacia Wood',
    warranty: '1 Year Warranty',
    description: 'Large white glazed ceramic plant pot supported by a mid-century style interlocking wood leg stand.',
    icon: '🪴',
    bg: '#083344',
    text: '#22d3ee'
  },
  {
    sku: 'FG-DEC-CL-01',
    name: 'Roman Numeral Wooden Clock',
    category: categories.DECOR,
    sellingPrice: 3500,
    costPrice: 1800,
    stockQty: 15,
    reorderLevel: 3,
    dimensions: '60 x 60 x 4 cm',
    material: 'Engineered Oak & Silent Quartz',
    warranty: '2 Year Machine Warranty',
    description: 'Large silent wall clock crafted from oak wood laminates with hollow roman numeral indices.',
    icon: '⏰',
    bg: '#311005',
    text: '#f97316'
  },
  {
    sku: 'FG-DEC-SCREEN',
    name: '3-Panel Carved Wood Room Divider',
    category: categories.DECOR,
    sellingPrice: 9500,
    costPrice: 5500,
    stockQty: 8,
    reorderLevel: 2,
    dimensions: '150 x 3 x 180 cm',
    material: 'Mango Wood',
    warranty: '3 Year Warranty',
    description: 'Three-panel privacy screen room divider, detailed with hand-carved floral patterns on Mango wood.',
    icon: '🪵',
    bg: '#451a03',
    text: '#fb923c'
  },
  {
    sku: 'FG-DEC-COAT',
    name: 'Standing Wooden Coat Hanger',
    category: categories.DECOR,
    sellingPrice: 3800,
    costPrice: 2000,
    stockQty: 25,
    reorderLevel: 4,
    dimensions: '40 x 40 x 175 cm',
    material: 'Rubberwood',
    warranty: '1 Year Warranty',
    description: 'Freestanding wooden coat rack tree with 8 utility hooks for coats, jackets, hats, and umbrella storage hooks.',
    icon: '🧥',
    bg: '#1e1b4b',
    text: '#818cf8'
  }
];

// Helper to update the products inside DB and generate local SVGs
async function seedProducts() {
  console.log('Clearing old stock ledgers, order items and products...');
  try {
    await db.stockLedger.deleteMany({
      where: {
        productId: {
          not: ''
        }
      }
    });
    console.log('Stock ledgers cleared.');
  } catch (e) {
    console.log('Note on stockLedger clear:', e.message);
  }

  // Deleting products might trigger FK violations if order items exist
  // Clear sales order items, purchase order items, bom components first
  try {
    await db.salesOrderItem.deleteMany({});
    await db.purchaseOrderItem.deleteMany({});
    await db.boMComponent.deleteMany({});
    await db.billOfMaterials.deleteMany({});
    await db.product.deleteMany({});
    console.log('Cleared Products catalog table.');
  } catch (e) {
    console.error('Failed to clean items due to foreign key violations:', e.message);
  }

  // First seed raw materials so BOM works
  const rawMaterials = [
    { sku: 'RAW-WD-LEG', name: 'Wooden Legs', category: 'RAW_MATERIAL', sellingPrice: 15.0, costPrice: 10.0, stockQty: 200.0, reorderLevel: 40.0, procurementStrategy: 'MTS', procurementType: 'PURCHASE' },
    { sku: 'RAW-WD-TOP', name: 'Wooden Top', category: 'RAW_MATERIAL', sellingPrice: 40.0, costPrice: 25.0, stockQty: 50.0, reorderLevel: 10.0, procurementStrategy: 'MTS', procurementType: 'PURCHASE' },
    { sku: 'RAW-SCREW', name: 'Screws', category: 'RAW_MATERIAL', sellingPrice: 1.0, costPrice: 0.5, stockQty: 1000.0, reorderLevel: 200.0, procurementStrategy: 'MTS', procurementType: 'PURCHASE' },
    { sku: 'RAW-PAINT', name: 'Paint', category: 'RAW_MATERIAL', sellingPrice: 8.0, costPrice: 5.0, stockQty: 60.0, reorderLevel: 15.0, procurementStrategy: 'MTS', procurementType: 'PURCHASE' },
    { sku: 'RAW-BOX', name: 'Packing Box', category: 'RAW_MATERIAL', sellingPrice: 5.0, costPrice: 3.0, stockQty: 100.0, reorderLevel: 25.0, procurementStrategy: 'MTS', procurementType: 'PURCHASE' }
  ];

  for (const raw of rawMaterials) {
    await db.product.upsert({
      where: { sku: raw.sku },
      update: raw,
      create: raw
    });
  }
  console.log('Seeded RAW materials.');

  // Now seed 50 finished goods
  console.log('Inserting 50 finished goods into SQLite database...');
  for (const p of products) {
    const dbPayload = {
      sku: p.sku,
      name: p.name,
      category: 'FINISHED_GOOD', // Database schema category must match exactly (it defaults to RAW_MATERIAL, MTS MTS MTS or MTS/MTO in seed)
      sellingPrice: p.sellingPrice,
      costPrice: p.costPrice,
      stockQty: p.stockQty,
      reorderLevel: p.reorderLevel,
      description: p.description,
      dimensions: p.dimensions,
      material: p.material,
      warranty: p.warranty,
      procurementStrategy: 'MTS',
      procurementType: 'MANUFACTURING'
    };

    const created = await db.product.upsert({
      where: { sku: p.sku },
      update: dbPayload,
      create: dbPayload
    });

    // Write SVG image
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
        <text x="200" y="260" font-family="system-ui, sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">${p.category}</text>
        <text x="200" y="280" font-family="monospace" font-size="10" fill="${p.text}" font-weight="bold" letter-spacing="1" text-anchor="middle">${p.sku}</text>
      </svg>
    `.trim();
    
    fs.writeFileSync(path.join(imgDir, `${p.sku.toLowerCase()}.svg`), svg);

    // Seed stock ledger entries
    await db.stockLedger.create({
      data: {
        productId: created.id,
        quantityBefore: 0,
        quantityChange: p.stockQty,
        quantityAfter: p.stockQty,
        type: 'STOCK_ADJUSTMENT',
        sourceDocument: '50_PRODUCT_SEPARATION_SEEDING',
        referenceType: 'SYSTEM',
        referenceId: 'INITIAL_STOCK_RECORD',
        performedBy: 'System Enhancer'
      }
    });
  }

  console.log('Seeded 50 finished goods and generated local SVG files.');
}

seedProducts()
  .catch(err => {
    console.error('Error running script:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
