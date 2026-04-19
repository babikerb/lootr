import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const VALID_ICONS = {
  mci: new Set(Object.keys(MaterialCommunityIcons.glyphMap ?? {})),
  fa5: new Set(Object.keys(FontAwesome5.glyphMap ?? {})),
  ion: new Set(Object.keys(Ionicons.glyphMap ?? {})),
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

  return { library: 'ion', name: 'cube-outline' };
}
