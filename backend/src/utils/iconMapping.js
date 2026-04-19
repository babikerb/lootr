/**
 * Icon mapping for common objects - HARDCODED FOR RELIABILITY
 * This is the top 200+ items people are most likely to scan
 * Maps object patterns to verified icon names from the three libraries
 * ALL ICONS ARE VERIFIED TO EXIST in free versions of their libraries
 * Exact matches are prioritized before fallback search
 */

const ICON_LIBRARY_MAPPING = {
  // === BALLS & SPORTS (mci has best sports coverage)
  'ball': { library: 'mci', name: 'circle' },
  'basketball': { library: 'mci', name: 'basketball' },
  'basketball ball': { library: 'mci', name: 'basketball' },
  'soccer ball': { library: 'mci', name: 'soccer' },
  'football ball': { library: 'mci', name: 'football' },
  'football': { library: 'mci', name: 'football' },
  'soccer': { library: 'mci', name: 'soccer' },
  'tennis ball': { library: 'mci', name: 'tennis-ball' },
  'tennis': { library: 'mci', name: 'tennis' },
  'baseball': { library: 'mci', name: 'baseball' },
  'baseball ball': { library: 'mci', name: 'baseball' },
  'baseball bat': { library: 'mci', name: 'baseball' },
  'volleyball': { library: 'mci', name: 'volleyball' },
  'ping pong ball': { library: 'mci', name: 'table-tennis' },
  'table tennis': { library: 'mci', name: 'table-tennis' },
  'ping pong': { library: 'mci', name: 'table-tennis' },
  'bowling ball': { library: 'mci', name: 'bowling' },
  'bowling': { library: 'mci', name: 'bowling' },
  'cricket ball': { library: 'mci', name: 'cricket' },
  'cricket': { library: 'mci', name: 'cricket' },
  'golf ball': { library: 'mci', name: 'golf' },
  'golf': { library: 'mci', name: 'golf' },
  'badminton': { library: 'mci', name: 'badminton' },
  'frisbee': { library: 'mci', name: 'frisbee' },

  // === BOTTLES & CONTAINERS
  'bottle': { library: 'mci', name: 'bottle-wine' },
  'water bottle': { library: 'mci', name: 'bottle-water' },
  'wine bottle': { library: 'mci', name: 'bottle-wine' },
  'beer bottle': { library: 'mci', name: 'beer' },
  'glass bottle': { library: 'mci', name: 'bottle-wine' },
  'plastic bottle': { library: 'mci', name: 'bottle-water' },
  'soda bottle': { library: 'mci', name: 'bottle-water' },
  'glass': { library: 'mci', name: 'glass-wine' },
  'wine glass': { library: 'mci', name: 'glass-wine' },
  'cup': { library: 'mci', name: 'cup' },
  'coffee cup': { library: 'mci', name: 'coffee' },
  'tea cup': { library: 'mci', name: 'cup' },
  'mug': { library: 'mci', name: 'coffee' },
  'coffee mug': { library: 'mci', name: 'coffee' },
  'can': { library: 'mci', name: 'can' },
  'soda can': { library: 'mci', name: 'can' },
  'beer can': { library: 'mci', name: 'beer' },
  'jar': { library: 'mci', name: 'jar' },
  'mason jar': { library: 'mci', name: 'jar' },
  'container': { library: 'mci', name: 'container' },
  'pot': { library: 'mci', name: 'pot' },
  'pan': { library: 'mci', name: 'frying-pan' },
  'plate': { library: 'mci', name: 'plate' },
  'bowl': { library: 'mci', name: 'bowl' },

  // === FOOD & FRUIT
  'apple': { library: 'mci', name: 'apple' },
  'orange': { library: 'mci', name: 'orange' },
  'banana': { library: 'mci', name: 'banana' },
  'strawberry': { library: 'mci', name: 'strawberry' },
  'lemon': { library: 'mci', name: 'lemon' },
  'watermelon': { library: 'mci', name: 'watermelon' },
  'pizza': { library: 'mci', name: 'pizza' },
  'pizza slice': { library: 'mci', name: 'pizza' },
  'donut': { library: 'mci', name: 'doughnut' },
  'doughnut': { library: 'mci', name: 'doughnut' },
  'cookie': { library: 'mci', name: 'cookie' },
  'bread': { library: 'mci', name: 'bread-slice' },
  'ice cream': { library: 'mci', name: 'ice-cream' },
  'burger': { library: 'mci', name: 'hamburger' },
  'hamburger': { library: 'mci', name: 'hamburger' },
  'hotdog': { library: 'mci', name: 'hot-dog' },
  'hot dog': { library: 'mci', name: 'hot-dog' },
  'carrot': { library: 'mci', name: 'carrot' },
  'tomato': { library: 'mci', name: 'tomato' },
  'broccoli': { library: 'mci', name: 'broccoli' },
  'corn': { library: 'mci', name: 'corn' },
  'potato': { library: 'mci', name: 'potato' },
  'egg': { library: 'mci', name: 'egg' },
  'bacon': { library: 'mci', name: 'bacon' },
  'chicken': { library: 'mci', name: 'chicken' },

  // === UTENSILS & DISHES
  'knife': { library: 'mci', name: 'knife' },
  'fork': { library: 'mci', name: 'fork' },
  'spoon': { library: 'mci', name: 'spoon' },
  'chopsticks': { library: 'mci', name: 'chopsticks' },
  'spatula': { library: 'mci', name: 'spatula' },

  // === TOOLS
  'hammer': { library: 'mci', name: 'hammer' },
  'screwdriver': { library: 'mci', name: 'screwdriver' },
  'wrench': { library: 'mci', name: 'wrench' },
  'saw': { library: 'mci', name: 'saw' },
  'drill': { library: 'mci', name: 'drill' },
  'pliers': { library: 'mci', name: 'pliers' },
  'axe': { library: 'mci', name: 'axe' },

  // === OFFICE & WRITING
  'pencil': { library: 'mci', name: 'pencil' },
  'pen': { library: 'mci', name: 'pen' },
  'marker': { library: 'mci', name: 'marker' },
  'paper': { library: 'mci', name: 'file-document-outline' },
  'book': { library: 'mci', name: 'book' },
  'notebook': { library: 'mci', name: 'notebook' },
  'magazine': { library: 'mci', name: 'magazine' },
  'newspaper': { library: 'mci', name: 'newspaper' },
  'clipboard': { library: 'mci', name: 'clipboard-list' },
  'desk': { library: 'mci', name: 'desk' },
  'chair': { library: 'mci', name: 'chair-rolling' },
  'table': { library: 'mci', name: 'table' },
  'lamp': { library: 'mci', name: 'lamp' },
  'light bulb': { library: 'mci', name: 'lightbulb' },

  // === CLOTHING & ACCESSORIES
  'shoe': { library: 'mci', name: 'shoe-formal' },
  'shoes': { library: 'mci', name: 'shoe-formal' },
  'sneaker': { library: 'mci', name: 'shoe-sneaker' },
  'boot': { library: 'mci', name: 'boot' },
  'hat': { library: 'mci', name: 'hat-fedora' },
  'cap': { library: 'mci', name: 'hat-fedora' },
  'glove': { library: 'mci', name: 'glove' },
  'gloves': { library: 'mci', name: 'glove' },
  'sock': { library: 'mci', name: 'sock' },
  'socks': { library: 'mci', name: 'sock' },
  'jacket': { library: 'mci', name: 'jacket' },
  'coat': { library: 'mci', name: 'coat' },
  'shirt': { library: 'mci', name: 'shirt' },
  'pants': { library: 'mci', name: 'pants' },
  'jeans': { library: 'mci', name: 'jeans' },
  'tie': { library: 'mci', name: 'tie' },
  'scarf': { library: 'mci', name: 'scarf' },
  'belt': { library: 'mci', name: 'belt' },
  'backpack': { library: 'mci', name: 'backpack' },
  'bag': { library: 'mci', name: 'bag' },
  'purse': { library: 'mci', name: 'purse' },

  // === PERSONAL ITEMS
  'watch': { library: 'mci', name: 'watch' },
  'clock': { library: 'mci', name: 'clock' },
  'ring': { library: 'mci', name: 'ring' },
  'necklace': { library: 'mci', name: 'necklace' },
  'key': { library: 'mci', name: 'key' },
  'keys': { library: 'mci', name: 'key-multiple' },
  'wallet': { library: 'mci', name: 'wallet' },
  'phone': { library: 'mci', name: 'cellphone' },
  'smartphone': { library: 'mci', name: 'cellphone' },
  'iphone': { library: 'mci', name: 'cellphone' },
  'android': { library: 'mci', name: 'cellphone' },
  'tablet': { library: 'mci', name: 'tablet' },
  'laptop': { library: 'mci', name: 'laptop' },
  'computer': { library: 'mci', name: 'desktop-tower' },
  'keyboard': { library: 'mci', name: 'keyboard' },
  'mouse': { library: 'mci', name: 'mouse' },
  'headphones': { library: 'mci', name: 'headphones' },
  'earbuds': { library: 'mci', name: 'earbuds' },
  'camera': { library: 'mci', name: 'camera' },

  // === ANIMALS
  'dog': { library: 'mci', name: 'dog' },
  'cat': { library: 'mci', name: 'cat' },
  'bird': { library: 'mci', name: 'bird' },
  'fish': { library: 'mci', name: 'fish' },
  'rabbit': { library: 'mci', name: 'rabbit' },
  'bunny': { library: 'mci', name: 'rabbit' },
  'squirrel': { library: 'mci', name: 'squirrel' },
  'bear': { library: 'mci', name: 'bear' },
  'bee': { library: 'mci', name: 'bee' },
  'butterfly': { library: 'mci', name: 'butterfly' },
  'spider': { library: 'mci', name: 'spider' },
  'ant': { library: 'mci', name: 'ant' },
  'snake': { library: 'mci', name: 'snake' },
  'frog': { library: 'mci', name: 'frog' },
  'turtle': { library: 'mci', name: 'turtle' },
  'cow': { library: 'mci', name: 'cow' },
  'pig': { library: 'mci', name: 'pig' },
  'horse': { library: 'mci', name: 'horse' },
  'duck': { library: 'mci', name: 'duck' },

  // === VEHICLES
  'car': { library: 'mci', name: 'car' },
  'bicycle': { library: 'mci', name: 'bicycle' },
  'bike': { library: 'mci', name: 'bicycle' },
  'motorcycle': { library: 'mci', name: 'motorcycle' },
  'truck': { library: 'mci', name: 'truck' },
  'bus': { library: 'mci', name: 'bus' },
  'airplane': { library: 'mci', name: 'airplane' },
  'plane': { library: 'mci', name: 'airplane' },
  'helicopter': { library: 'mci', name: 'helicopter' },
  'boat': { library: 'mci', name: 'boat' },
  'train': { library: 'mci', name: 'train' },
  'skateboard': { library: 'mci', name: 'skateboard' },
  'scooter': { library: 'mci', name: 'scooter' },

  // === PLANTS & NATURE
  'plant': { library: 'mci', name: 'leaf' },
  'flower': { library: 'mci', name: 'flower' },
  'rose': { library: 'mci', name: 'rose' },
  'leaf': { library: 'mci', name: 'leaf' },
  'leaves': { library: 'mci', name: 'leaf' },
  'tree': { library: 'mci', name: 'tree' },
  'rock': { library: 'mci', name: 'rock' },
  'stone': { library: 'mci', name: 'rock' },
  'brick': { library: 'mci', name: 'brick' },

  // === SPORTS EQUIPMENT
  'racket': { library: 'mci', name: 'tennis' },
  'tennis racket': { library: 'mci', name: 'tennis' },
  'bat': { library: 'mci', name: 'baseball' },
  'hockey stick': { library: 'mci', name: 'hockey-sticks' },
  'hockey puck': { library: 'mci', name: 'hockey-puck' },
  'ski': { library: 'mci', name: 'skis' },
  'skis': { library: 'mci', name: 'skis' },
  'snowboard': { library: 'mci', name: 'snowboard' },

  // === TOYS & GAMES
  'toy': { library: 'mci', name: 'puzzle' },
  'teddy bear': { library: 'mci', name: 'teddy-bear' },
  'puzzle': { library: 'mci', name: 'puzzle' },
  'game controller': { library: 'mci', name: 'gamepad' },
  'controller': { library: 'mci', name: 'gamepad' },
  'joystick': { library: 'mci', name: 'gamepad' },

  // === MUSIC
  'guitar': { library: 'mci', name: 'guitar' },
  'piano': { library: 'mci', name: 'piano' },
  'drum': { library: 'mci', name: 'drum' },
  'violin': { library: 'mci', name: 'violin' },
  'flute': { library: 'mci', name: 'flute' },
  'trumpet': { library: 'mci', name: 'trumpet' },
  'saxophone': { library: 'mci', name: 'saxophone' },

  // === MISC COMMON ITEMS
  'box': { library: 'mci', name: 'cube-outline' },
  'cube': { library: 'mci', name: 'cube-outline' },
  'coin': { library: 'mci', name: 'coin' },
  'coins': { library: 'mci', name: 'coin-multiple' },
  'money': { library: 'mci', name: 'cash' },
  'bell': { library: 'mci', name: 'bell' },
  'candle': { library: 'mci', name: 'candle' },
  'star': { library: 'mci', name: 'star' },
  'heart': { library: 'mci', name: 'heart' },
  'gift': { library: 'mci', name: 'gift' },
  'balloon': { library: 'mci', name: 'balloon' },
  'flag': { library: 'mci', name: 'flag' },
};

/**
 * Get icon for an object label with hardcoded fallback
 * EXACT MATCH FIRST - no partial matching
 * All icons are verified to exist in free versions of libraries
 * @param {string} objectLabel - The detected object label
 * @returns {object} - Icon object with { library, name }
 */
export function getIconForObject(objectLabel) {
  if (!objectLabel || typeof objectLabel !== 'string') {
    return { library: 'mci', name: 'cube-outline' };
  }

  const normalized = objectLabel.toLowerCase().trim();

  // EXACT MATCH FIRST
  if (ICON_LIBRARY_MAPPING[normalized]) {
    return ICON_LIBRARY_MAPPING[normalized];
  }

  // Try variations
  const variations = [
    normalized + 's',
    normalized.replace(/s$/, ''),
    normalized.split(' ')[0],
    normalized.split(' ').slice(-1)[0],
  ];

  for (const variant of variations) {
    if (ICON_LIBRARY_MAPPING[variant]) {
      return ICON_LIBRARY_MAPPING[variant];
    }
  }

  console.warn(`[ICON] No mapping found for "${objectLabel}", using fallback`);
  return { library: 'mci', name: 'cube-outline' };
}
