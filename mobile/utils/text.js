export function toTitleCase(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}
