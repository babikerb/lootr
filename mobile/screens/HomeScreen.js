import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { validateIcon } from '../utils/iconValidator';
import { getMostRecentPlayedGame, saveScannedGame } from '../utils/scannedGamesStorage';
import { toTitleCase } from '../utils/text';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const GAME_TYPE_COLORS = {
  dodge: COLORS.coral,
  balance: COLORS.anemone,
  catch: COLORS.seafoam,
  swipe: COLORS.electricIndigo,
  timing: COLORS.cyan,
  runner: COLORS.highlight,
};

const GAME_TYPE_LABELS = {
  dodge: 'Dodge',
  balance: 'Balance',
  catch: 'Catch',
  swipe: 'Swipe',
  timing: 'Timing',
  runner: 'Runner',
};

function getRecentGameColor(gameType) {
  return GAME_TYPE_COLORS[gameType] ?? COLORS.seafoam;
}

function getRecentGameIconName(game) {
  return validateIcon(game?.gameConfig?.icon).name;
}

function RecentGameIcon({ game, color }) {
  const validatedIcon = validateIcon(game?.gameConfig?.icon);
  const iconLibrary = validatedIcon.library;
  const iconName = getRecentGameIconName(game);

  if (iconLibrary === 'mci' && iconName) {
    return <MaterialCommunityIcons name={iconName} size={20} color={color} />;
  }

  return <Ionicons name="game-controller-outline" size={20} color={color} />;
}

function getRecentPlayedGameType(game) {
  return game?.lastPlayedGameType ?? game?.gameConfig?.gameType ?? 'game';
}

function getRecentGameTitle(game) {
  const playedGameType = getRecentPlayedGameType(game);
  const primaryGameType = game?.gameConfig?.gameType;

  if (playedGameType && primaryGameType && playedGameType !== primaryGameType) {
    return `${toTitleCase(game?.objectLabel)} ${GAME_TYPE_LABELS[playedGameType] ?? toTitleCase(playedGameType)}`;
  }

  return toTitleCase(game?.gameConfig?.title ?? game?.objectLabel);
}

function formatLocationLabel(placemark) {
  if (!placemark) return null;

  const area = placemark.district || placemark.subregion || placemark.city || placemark.region;
  const region = placemark.region && placemark.region !== area ? placemark.region : null;

  if (area && region) return `${area}, ${region}`;
  if (area) return area;

  return placemark.country || null;
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [recentGame, setRecentGame] = useState(null);
  const [recentGameLoading, setRecentGameLoading] = useState(true);

  const loadRecentGame = useCallback(async () => {
    setRecentGameLoading(true);

    try {
      const latestPlayedGame = await getMostRecentPlayedGame();
      setRecentGame(latestPlayedGame);
    } finally {
      setRecentGameLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecentGame();
    }, [loadRecentGame])
  );

  async function openCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera access is required to scan objects.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false });
    if (result.canceled) return;

    try {
      setScanning(true);

      const locationPermission = await Location.requestForegroundPermissionsAsync();
      if (locationPermission.status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required to save coordinates for scanned games.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;
      let locationLabel = null;

      try {
        const [placemark] = await Location.reverseGeocodeAsync({ latitude, longitude });
        locationLabel = formatLocationLabel(placemark);
      } catch (reverseGeocodeError) {
        console.log('[SCAN] Reverse geocode unavailable:', reverseGeocodeError.message);
      }

      // Resize to 512px wide — vision models don't need full resolution
      const resized = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 512 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      const base64 = resized.base64;
      console.log('[SCAN] base64 length after resize:', base64?.length ?? 'UNDEFINED');
      console.log(`[SCAN] Coordinates captured: [${latitude}, ${longitude}]`);
      console.log('[SCAN] POSTing to:', `${API_URL}/api/v1/scan`);

      const response = await fetch(`${API_URL}/api/v1/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          latitude,
          longitude,
        }),
      });

      console.log('[SCAN] Response status:', response.status);
      if (!response.ok) {
        const body = await response.text();
        console.error('[SCAN] Error body:', body);
        throw new Error(`Server error ${response.status}: ${body}`);
      }

      const data = await response.json();
      const savedScan = { ...data, locationLabel };
      console.log('[SCAN] Result:', JSON.stringify(data));
      await saveScannedGame(savedScan);
      setScanResult(savedScan);
    } catch (error) {
      console.error('[SCAN] Fetch error:', error.message);
      Alert.alert('Scan Failed', error.message || 'Could not reach the server.');
    } finally {
      setScanning(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>Lootr</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.glowSeafoam} />
          <View style={styles.glowCoral} />
          <View style={styles.glowAnemone} />
          <View style={styles.heroInner}>
            <Ionicons name="scan" size={48} color={COLORS.text} />
            <Text style={styles.heroTitle}>Scan anything,{'\n'}play instantly.</Text>
            <Text style={styles.heroSub}>
              Point your camera at an object and watch it become a game.
            </Text>
            <TouchableOpacity
              style={[styles.scanBtn, scanning && styles.scanBtnDisabled]}
              onPress={openCamera}
              activeOpacity={0.85}
              disabled={scanning}
            >
              {scanning ? (
                <ActivityIndicator size="small" color={COLORS.bg} />
              ) : (
                <Ionicons name="camera" size={20} color={COLORS.bg} />
              )}
              <Text style={styles.scanText}>{scanning ? 'Scanning...' : 'Scan Object'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Most Recently Played</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Games')}>
            <Text style={[styles.seeAll, { color: COLORS.text }]}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentGameLoading ? (
          <View style={styles.recentStateCard}>
            <ActivityIndicator size="small" color={COLORS.seafoam} />
            <Text style={styles.recentStateText}>Loading your last played game...</Text>
          </View>
        ) : recentGame ? (
          <TouchableOpacity
            style={styles.gameCard}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Game', {
              gameConfig: recentGame.gameConfig,
              objectLabel: recentGame.objectLabel,
              initialGameType: getRecentPlayedGameType(recentGame),
            })}
          >
            <View style={[
              styles.gameIconWrap,
              {
                backgroundColor: getRecentGameColor(getRecentPlayedGameType(recentGame)) + '28',
                borderColor: getRecentGameColor(getRecentPlayedGameType(recentGame)) + '55',
              },
            ]}>
              <RecentGameIcon
                game={recentGame}
                color={getRecentGameColor(getRecentPlayedGameType(recentGame))}
              />
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameTitle}>
                {getRecentGameTitle(recentGame)}
              </Text>
              <Text style={[styles.gameMeta, { color: getRecentGameColor(getRecentPlayedGameType(recentGame)) }]}>
                {getRecentPlayedGameType(recentGame)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : (
          <View style={styles.recentStateCard}>
            <Ionicons name="game-controller-outline" size={28} color={COLORS.textMuted} />
            <Text style={styles.recentStateTitle}>No games played yet</Text>
            <Text style={styles.recentStateText}>
              Scan something and start a game to see it here.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Scan Result Modal */}
      <Modal
        visible={!!scanResult}
        animationType="slide"
        transparent
        onRequestClose={() => setScanResult(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalLabel}>Object Detected</Text>
            <Text style={styles.modalObject}>{toTitleCase(scanResult?.objectLabel)}</Text>

            <TouchableOpacity
              style={styles.playBtn}
              activeOpacity={0.85}
              onPress={() => {
                setScanResult(null);
                navigation.navigate('Game', { gameConfig: scanResult.gameConfig, objectLabel: scanResult.objectLabel });
              }}
            >
              <Ionicons name="game-controller-outline" size={18} color={COLORS.bg} />
              <Text style={styles.playBtnText}>Play Game</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dismissBtn} onPress={() => setScanResult(null)}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: 20 },

  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  brand: { color: COLORS.text, fontSize: 22, fontWeight: '700', letterSpacing: 3 },

  hero: {
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cyan + '55',
    overflow: 'hidden',
    marginBottom: 32,
  },
  glowSeafoam: {
    position: 'absolute', top: -60, left: '10%',
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: COLORS.seafoam + '18',
  },
  glowCoral: {
    position: 'absolute', top: -20, right: '5%',
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: COLORS.coral + '18',
  },
  glowAnemone: {
    position: 'absolute', bottom: -30, left: '30%',
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: COLORS.anemone + '14',
  },
  heroInner: {
    alignItems: 'center',
    paddingVertical: 44,
    paddingHorizontal: 28,
    gap: 12,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 34,
    marginTop: 8,
  },
  heroSub: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.seafoam,
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginTop: 4,
  },
  scanBtnDisabled: { opacity: 0.6 },
  scanText: { color: COLORS.bg, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  seeAll: { fontSize: 13, fontWeight: '600' },

  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceLighter,
    gap: 14,
  },
  gameIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameInfo: { flex: 1 },
  gameTitle: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  gameMeta: { fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  recentStateCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceLighter,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 10,
  },
  recentStateTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  recentStateText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: COLORS.cyan + '44',
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textDim,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  modalObject: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    textTransform: 'capitalize',
    marginBottom: 20,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.seafoam,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 12,
  },
  playBtnText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: '700',
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  dismissText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
