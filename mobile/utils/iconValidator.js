/**
 * Icon validation for the Lootr mobile app
 * Verifies that icon names are valid before rendering
 * Provides fallbacks for invalid icons
 */

// Verified icon names from each library
const VALID_ICONS = {
  mci: new Set([
    'bottle-wine', 'bottle-water', 'beer', 'can', 'jar', 'container',
    'coffee', 'cup', 'plate', 'tennis-ball', 'volleyball', 'golf', 'ping-pong', 'beach',
    'drill', 'pliers', 'wrench',
    'flower', 'leaf', 'tree',
    'pen', 'pencil', 'brick', 'rock', 'doughnut', 'cookie', 'egg', 'carrot', 'sock', 'glove', 
    'puzzle', 'drum', 'piano', 'trumpet', 'atom', 'bee', 'butterfly', 'skateboard', 'snowboard', 
    'cricket', 'tennis'
  ]),
  fa5: new Set([
    'basketball', 'football-ball', 'futbol', 'baseball-ball', 'bowling-ball',
    'apple-alt', 'orange', 'lemon', 'watermelon', 'pizza-slice', 'ice-cream', 'hamburger', 'bread-slice',
    'hammer', 'wrench', 'screwdriver', 'saw', 'tools',
    'car', 'bicycle', 'motorcycle', 'truck', 'bus', 'ship',
    'dog', 'cat', 'dove', 'fish', 'rabbit', 'squirrel', 'bear',
    'watch', 'ring', 'key', 'wallet', 'book', 'hat', 'shoe-prints', 'star', 'globe', 'rocket', 
    'guitar', 'music', 'ball'
  ]),
  ion: new Set([
    'cube-outline', 'document-outline', 'camera-outline', 'phone-portrait-outline', 'airplane-outline'
  ])
};

/**
 * Check if an icon name is valid for a given library
 * @param {string} library - The icon library (mci, fa5, ion)
 * @param {string} name - The icon name
 * @returns {boolean} - True if the icon is valid
 */
export function isValidIcon(library, name) {
  if (!library || !name) return false;
  const validSet = VALID_ICONS[library];
  return validSet && validSet.has(name);
}

/**
 * Validate and fix an icon object, returning a safe fallback if needed
 * @param {object} icon - The icon object { library, name }
 * @returns {object} - A valid icon object with fallback if needed
 */
export function validateIcon(icon) {
  if (!icon || !icon.library || !icon.name) {
    return { library: 'ion', name: 'cube-outline' };
  }

  const { library, name } = icon;

  // Check if the icon is valid
  if (isValidIcon(library, name)) {
    return { library, name };
  }

  // If not valid, return a safe fallback
  console.warn(`[ICON] Invalid icon detected: ${library}:${name}, using fallback`);
  return { library: 'ion', name: 'cube-outline' };
}
