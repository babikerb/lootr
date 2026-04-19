export const COLORS = {
  // Main (deeper, more ocean pressure)
  bg: '#02070b',
  surface: '#07141c',
  surfaceLighter: '#0d2230',

  // Accents (muted bioluminescence, not neon)
  cyan: '#2a6f7a',
  seafoam: '#3f8f7a',
  electricIndigo: '#4c5c8a',
  highlight: '#f2a365',

  // Nature (real ocean life tones)
  coral: '#c96b4f',
  kelp: '#1f3d36',
  anemone: '#6b5b95',

  // Typography (slightly softened, less stark white)
  text: '#e6f1f7',
  textMuted: '#7f97a6',
  textDim: 'rgba(230,241,247,0.2)',
};

// Cycling coral accents for game types
const CORAL_ACCENTS = [
  '#d4745c', // Warm salmon coral
  '#c96b4f', // Deep burnt coral
  '#e8956b', // Peachy coral
  '#b85d3e', // Rust coral
  '#d97c5c', // Vibrant coral
  '#c9825c', // Muted terracotta
];

// Game type to coral accent mapping
const GAME_TYPES = ['dodge', 'catch', 'balance', 'runner', 'swipe', 'timing'];

/**
 * Get the coral accent color for a specific game type.
 * Each game type gets a unique coral from the palette to create visual variety
 * while maintaining the deep sea theme.
 * @param {string} gameType - One of: dodge, catch, balance, runner, swipe, timing
 * @returns {string} Hex color code for the coral accent
 */
export function getGameTheme(gameType) {
  const index = GAME_TYPES.indexOf(gameType);
  if (index === -1) return CORAL_ACCENTS[0]; // Fallback to first coral
  return CORAL_ACCENTS[index];
}