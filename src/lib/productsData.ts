import { Product, Category } from '@/types';

export const CATEGORIES: Category[] = [
  {
    id: 'all',
    name: 'All Categories',
    iconName: 'LayoutGrid',
    count: 10,
    description: 'Browse complete hardware inventory'
  },
  {
    id: 'gaming-mice',
    name: 'Gaming Mice',
    iconName: 'Mouse',
    count: 1,
    description: 'Ultra-lightweight wireless esports mice'
  },
  {
    id: 'keyboards',
    name: 'Keyboards',
    iconName: 'Keyboard',
    count: 1,
    description: 'Analog optical & custom mechanical keyboards'
  },
  {
    id: 'controllers',
    name: 'Controllers',
    iconName: 'Gamepad2',
    count: 1,
    description: 'Competitive pro controllers with hall effect sticks'
  },
  {
    id: 'audio',
    name: 'Headsets & Spatial Audio',
    iconName: 'Headphones',
    count: 1,
    description: 'High-resolution spatial audio & ANC headsets'
  },
  {
    id: 'speakers',
    name: 'Desktop Speakers',
    iconName: 'Volume2',
    count: 1,
    description: 'Hi-Fi RGB desktop sound systems'
  },
  {
    id: 'webcams',
    name: '4K Webcams & Streaming',
    iconName: 'Camera',
    count: 1,
    description: '4K 60FPS streaming webcams & studio mic rigs'
  },
  {
    id: 'networking',
    name: 'WiFi 7 Routers & Networking',
    iconName: 'Wifi',
    count: 1,
    description: 'Zero-lag ultra-low latency mesh WiFi 7 routers'
  },
  {
    id: 'hubs-adapters',
    name: 'USB-C Hubs & Adapters',
    iconName: 'Cpu',
    count: 1,
    description: 'Multi-port Thunderbolt 4 hubs & high speed docks'
  },
  {
    id: 'power-charging',
    name: 'Fast Chargers & Power Banks',
    iconName: 'Zap',
    count: 1,
    description: 'GaN III fast chargers & magnetic battery packs'
  },
  {
    id: 'storage',
    name: 'NVMe SSDs & External Storage',
    iconName: 'HardDrive',
    count: 1,
    description: 'PCIe 5.0 high speed NVMe M.2 drives'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'gpro-x-superlight-2',
    name: 'Logitech G PRO X SUPERLIGHT 2 Wireless Mouse',
    category: 'gaming-mice',
    brand: 'Logitech G',
    priceLkr: 58500,
    priceUsd: 195,
    originalPriceLkr: 64000,
    rating: 4.9,
    reviewsCount: 128,
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80'
    ],
    specs: {
      'Sensor': 'HERO 2 (32,000 DPI)',
      'Polling Rate': '4000Hz Wireless',
      'Weight': '60g Ultra-light',
      'Battery Life': '95 Hours'
    },
    description: 'The pinnacle of competitive esports gaming mice. Engineered with LIGHTFORCE hybrid switches and HERO 2 sensor for zero latency tracking.',
    tags: ['Logitech G', 'gaming-mice', 'wireless', 'esports', '60g'],
    inStock: true,
    stockCount: 14,
    featured: true,
    badge: 'BESTSELLER',
    warranty: '2 Year Official Warranty'
  },
  {
    id: 'wooting-60he',
    name: 'Wooting 60HE+ Rapid Trigger Analog Keyboard',
    category: 'keyboards',
    brand: 'Wooting',
    priceLkr: 89000,
    priceUsd: 295,
    originalPriceLkr: 95000,
    rating: 5.0,
    reviewsCount: 210,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    specs: {
      'Switches': 'Lekker Hall Effect Magnetic',
      'Rapid Trigger': '0.1mm - 4.0mm adjustable',
      'Polling Rate': '8000Hz (0.125ms latency)',
      'Keycaps': 'Double-shot PBT'
    },
    description: 'World-renowned analog optical keyboard featuring true Hall Effect magnetic switches and instant Rapid Trigger resetting.',
    tags: ['Wooting', 'keyboards', 'rapid-trigger', 'analog', 'hall-effect'],
    inStock: true,
    stockCount: 8,
    featured: true,
    badge: 'PRO CHOICE',
    warranty: '2 Year Warranty'
  },
  {
    id: 'dualsense-edge',
    name: 'Sony PS5 DualSense Edge Wireless Controller',
    category: 'controllers',
    brand: 'Sony PlayStation',
    priceLkr: 72000,
    priceUsd: 240,
    originalPriceLkr: 78000,
    rating: 4.8,
    reviewsCount: 94,
    image: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=800&q=80',
    specs: {
      'Stick Modules': 'Replaceable Analog Sticks',
      'Back Buttons': '2 Swappable Paddles',
      'Trigger Stops': 'Adjustable Hair Triggers',
      'Profiles': 'On-board Profile Switch'
    },
    description: 'High-performance PlayStation controller designed for competitive gaming with remappable buttons and custom sensitivity profiles.',
    tags: ['Sony', 'controllers', 'ps5', 'pro-controller'],
    inStock: true,
    stockCount: 5,
    featured: true,
    badge: 'NEW',
    warranty: '1 Year Warranty'
  },
  {
    id: 'steelseries-arctis-nova-pro',
    name: 'SteelSeries Arctis Nova Pro Wireless Headset',
    category: 'audio',
    brand: 'SteelSeries',
    priceLkr: 115000,
    priceUsd: 380,
    originalPriceLkr: 125000,
    rating: 4.9,
    reviewsCount: 85,
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
    specs: {
      'Audio Drivers': 'High Fidelity Neodymium',
      'ANC': 'Active Noise Cancellation',
      'Battery System': 'Dual Swappable Batteries',
      'DAC': 'GameDAC Gen 2 Base Station'
    },
    description: 'Ultimate gaming audio system with Active Noise Cancellation, dual wireless audio mixing, and hot-swappable infinite battery power.',
    tags: ['SteelSeries', 'audio', 'headset', 'anc', 'wireless'],
    inStock: true,
    stockCount: 6,
    featured: true,
    badge: 'AUDIO FLAGSHIP',
    warranty: '2 Year Warranty'
  },
  {
    id: 'razer-nommo-v2-pro',
    name: 'Razer Nommo V2 Pro 2.1 Speaker System',
    category: 'speakers',
    brand: 'Razer',
    priceLkr: 135000,
    priceUsd: 450,
    originalPriceLkr: 145000,
    rating: 4.7,
    reviewsCount: 38,
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
    specs: {
      'Configuration': '2.1 Speakers + Wireless Subwoofer',
      'Spatial Audio': 'THX Spatial Audio',
      'Lighting': 'Rear Projection Razer Chroma RGB',
      'Subwoofer': 'Down-firing 5.5" Driver'
    },
    description: 'Full-range gaming desktop speakers with a wireless down-firing subwoofer and rear projection Razer Chroma RGB illumination.',
    tags: ['Razer', 'speakers', 'chroma-rgb', 'thx-audio'],
    inStock: true,
    stockCount: 4,
    featured: false,
    badge: 'HOT',
    warranty: '1 Year Warranty'
  },
  {
    id: 'elgato-facecam-pro',
    name: 'Elgato Facecam Pro 4K 60FPS Webcam',
    category: 'webcams',
    brand: 'Elgato',
    priceLkr: 98000,
    priceUsd: 325,
    originalPriceLkr: 108000,
    rating: 4.9,
    reviewsCount: 62,
    image: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
    specs: {
      'Resolution': '4K at 60 FPS True Ultra HD',
      'Sensor': 'Sony STARVIS CMOS',
      'Lens': 'f/2.0 21mm Studio Focal Length',
      'Focus': 'Variable Autofocus (10cm - inf)'
    },
    description: 'The world’s first 4K 60FPS webcam. Powered by a studio-grade Sony STARVIS sensor for DSLR-like broadcast clarity.',
    tags: ['Elgato', 'webcams', '4k-60fps', 'streaming'],
    inStock: true,
    stockCount: 7,
    featured: true,
    badge: '4K BROADCAST',
    warranty: '2 Year Warranty'
  },
  {
    id: 'tp-link-archer-be800',
    name: 'TP-Link Archer BE800 WiFi 7 Gaming Router',
    category: 'networking',
    brand: 'TP-Link',
    priceLkr: 165000,
    priceUsd: 550,
    originalPriceLkr: 180000,
    rating: 5.0,
    reviewsCount: 29,
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    specs: {
      'Speed': 'Tri-Band 19 Gbps WiFi 7',
      'Ports': 'Dual 10G Ports + 4 x 2.5G Ports',
      'Antennas': '8 x Internal High Performance',
      'Screen': 'LED Matrix Screen'
    },
    description: 'Next-generation WiFi 7 gaming router delivering blistering 19 Gbps speeds, multi-link operation, and dual 10 Gigabit connectivity.',
    tags: ['TP-Link', 'networking', 'wifi-7', '10g-router'],
    inStock: true,
    stockCount: 3,
    featured: true,
    badge: 'WIFI 7',
    warranty: '3 Year Warranty'
  },
  {
    id: 'caldigit-ts4',
    name: 'CalDigit TS4 Thunderbolt 4 Docking Station',
    category: 'hubs-adapters',
    brand: 'CalDigit',
    priceLkr: 128000,
    priceUsd: 425,
    originalPriceLkr: 138000,
    rating: 4.9,
    reviewsCount: 114,
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80',
    specs: {
      'Ports': '18 Total Expansion Ports',
      'Power Delivery': '98W Laptop Charging',
      'Display Output': 'Dual 4K 60Hz or Single 8K',
      'Ethernet': '2.5 Gigabit Ethernet'
    },
    description: 'The ultimate Thunderbolt 4 dock featuring 18 connectivity ports, 98W host charging power, and 2.5GbE networking.',
    tags: ['CalDigit', 'hubs-adapters', 'thunderbolt-4', '98w-charging'],
    inStock: true,
    stockCount: 9,
    featured: false,
    badge: 'WORKSTATION',
    warranty: '2 Year Warranty'
  },
  {
    id: 'anker-prime-200w',
    name: 'Anker Prime 200W GaN Charging Station',
    category: 'power-charging',
    brand: 'Anker',
    priceLkr: 42000,
    priceUsd: 140,
    originalPriceLkr: 48000,
    rating: 4.8,
    reviewsCount: 175,
    image: 'https://images.unsplash.com/photo-1609592424074-9844f2d3d922?auto=format&fit=crop&w=800&q=80',
    specs: {
      'Total Output': '200W Fast Multi-Device Power',
      'Ports': '4 x USB-C + 2 x USB-A Ports',
      'Technology': 'GaNPrime III Intelligent Power',
      'Display': 'Smart Digital Power Display'
    },
    description: 'Ultra-fast 200W GaN desktop charging station capable of charging two MacBook Pros simultaneously at full speed.',
    tags: ['Anker', 'power-charging', 'gan-charger', '200w'],
    inStock: true,
    stockCount: 18,
    featured: false,
    badge: 'GAN III',
    warranty: '18 Month Warranty'
  },
  {
    id: 'samsung-990-pro-2tb',
    name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 SSD',
    category: 'storage',
    brand: 'Samsung',
    priceLkr: 68000,
    priceUsd: 225,
    originalPriceLkr: 75000,
    rating: 5.0,
    reviewsCount: 340,
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80',
    specs: {
      'Read Speed': 'Up to 7,450 MB/s',
      'Write Speed': 'Up to 6,900 MB/s',
      'Form Factor': 'M.2 2280 NVMe',
      'Interface': 'PCIe Gen 4.0 x4, NVMe 2.0'
    },
    description: 'Blistering fast solid state drive engineered for heavy gaming, 3D rendering, and PS5 storage expansion.',
    tags: ['Samsung', 'storage', 'nvme-ssd', '7450mbs'],
    inStock: true,
    stockCount: 22,
    featured: true,
    badge: 'FASTEST SSD',
    warranty: '5 Year Warranty'
  }
];

export function formatPrice(priceLkr: number): string {
  return `Rs. ${priceLkr.toLocaleString()}`;
}
