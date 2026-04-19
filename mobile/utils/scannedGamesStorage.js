import AsyncStorage from '@react-native-async-storage/async-storage';

const SCANNED_GAMES_STORAGE_KEY = 'lootr.scannedGames';
let localGameCounter = 0;

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function getGameSignature(scanResult) {
  return [
    normalizeText(scanResult.objectLabel),
    normalizeText(scanResult.gameConfig?.title),
    normalizeText(scanResult.gameConfig?.gameType),
  ].join('::');
}

function createLocalGameId(signature) {
  localGameCounter += 1;
  return `local-${Date.now()}-${localGameCounter}-${signature}`;
}

function normalizeScannedGame(scanResult) {
  if (!scanResult?.gameConfig) return null;

  const savedGameId = scanResult.savedGame?.id;
  const signature = getGameSignature(scanResult);
  const existingId = scanResult.id;

  return {
    id: savedGameId ? String(savedGameId) : existingId ? String(existingId) : createLocalGameId(signature),
    savedGameId: savedGameId ?? null,
    signature,
    objectLabel: scanResult.objectLabel ?? 'Unknown Object',
    gameConfig: scanResult.gameConfig,
    savedGame: scanResult.savedGame ?? null,
    locationLabel: scanResult.locationLabel ?? null,
    scannedAt: scanResult.scannedAt ?? new Date().toISOString(),
    lastPlayedAt: scanResult.lastPlayedAt ?? null,
    lastPlayedGameType: scanResult.lastPlayedGameType ?? null,
  };
}

function dedupeScannedGames(games) {
  const seenSignatures = new Set();
  const seenIds = new Set();

  return games
    .map(normalizeScannedGame)
    .filter(game => {
      if (!game || seenSignatures.has(game.signature)) return false;
      seenSignatures.add(game.signature);

      const normalizedId = game.id ? String(game.id) : createLocalGameId(game.signature);
      game.id = seenIds.has(normalizedId) ? createLocalGameId(game.signature) : normalizedId;
      seenIds.add(game.id);

      return true;
    });
}

export async function getScannedGames() {
  const rawValue = await AsyncStorage.getItem(SCANNED_GAMES_STORAGE_KEY);
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];

    const normalizedGames = dedupeScannedGames(parsed);
    if (JSON.stringify(parsed) !== JSON.stringify(normalizedGames)) {
      await AsyncStorage.setItem(SCANNED_GAMES_STORAGE_KEY, JSON.stringify(normalizedGames));
    }

    return normalizedGames;
  } catch {
    return [];
  }
}

export async function saveScannedGame(scanResult) {
  const normalized = normalizeScannedGame(scanResult);
  if (!normalized) return null;

  const existingGames = await getScannedGames();
  const updatedGames = dedupeScannedGames([normalized, ...existingGames]);
  await AsyncStorage.setItem(SCANNED_GAMES_STORAGE_KEY, JSON.stringify(updatedGames));

  return normalized;
}

export async function markGameAsPlayed(scanResult) {
  const normalized = normalizeScannedGame(scanResult);
  if (!normalized) return null;

  const existingGames = await getScannedGames();
  const now = new Date().toISOString();
  const playedGameType = scanResult.lastPlayedGameType ?? scanResult.gameConfig?.gameType ?? null;

  const updatedGames = dedupeScannedGames([
    { ...normalized, lastPlayedAt: now, lastPlayedGameType: playedGameType },
    ...existingGames.map(game => (
      game.signature === normalized.signature
        ? { ...game, lastPlayedAt: now, lastPlayedGameType: playedGameType }
        : game
    )),
  ]);

  await AsyncStorage.setItem(SCANNED_GAMES_STORAGE_KEY, JSON.stringify(updatedGames));

  return updatedGames.find(game => game.signature === normalized.signature) ?? null;
}

export async function getMostRecentPlayedGame() {
  const games = await getScannedGames();

  return games
    .filter(game => !!game.lastPlayedAt)
    .sort((a, b) => new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime())[0] ?? null;
}
