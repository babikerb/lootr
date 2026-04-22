import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { validateIcon } from '../utils/iconValidator';
import { getScannedGames, saveScannedGame } from '../utils/scannedGamesStorage';
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
  const cameraRef = useRef(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const [recentGameLoading, setRecentGameLoading] = useState(true);

  const loadRecentGames = useCallback(async () => {
    setRecentGameLoading(true);

    try {
      const storedGames = await getScannedGames();
      const playedGames = storedGames
        .filter(game => !!game.lastPlayedAt)
        .sort((a, b) => new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime());

      setRecentGames(playedGames);
    } finally {
      setRecentGameLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecentGames();
    }, [loadRecentGames])
  );

  const visibleRecentGames = recentGames.slice(0, 3);

  async function scanFromViewfinder() {
    if (!cameraPermission?.granted) {
      const permissionResult = await requestCameraPermission();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Camera access is required to scan objects.');
      }
      return;
    }

    try {
      if (!cameraRef.current) {
        Alert.alert('Camera Unavailable', 'The camera is still starting. Try again in a second.');
        return;
      }

      setScanning(true);

      const capturedPhoto = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!capturedPhoto?.uri) {
        throw new Error('Could not capture image from camera.');
      }

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

      const resized = await ImageManipulator.manipulateAsync(
        capturedPhoto.uri,
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
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {cameraPermission?.granted ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          mode="picture"
          mute
        />
      ) : (
        <View style={styles.permissionContainer}>
          <View style={styles.permissionCard}>
            <Ionicons name="camera-outline" size={36} color={COLORS.text} />
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionText}>
              Lootr needs camera permission so you can scan real-world objects.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              activeOpacity={0.85}
              onPress={requestCameraPermission}
            >
              <Text style={styles.permissionButtonText}>Enable Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openSettings()}>
              <Text style={styles.permissionLink}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.overlay}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.brand}>Lootr</Text>
          <Text style={styles.tagline}>Point your camera at anything.</Text>
        </View>

        <View style={styles.focusRingWrap}>
          <View style={styles.focusRing} />
        </View>

        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 90 }]}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recently Played</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Games')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentGameLoading ? (
            <View style={styles.recentStateCard}>
              <ActivityIndicator size="small" color={COLORS.seafoam} />
              <Text style={styles.recentStateText}>Loading your recent games...</Text>
            </View>
          ) : recentGames.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
              {visibleRecentGames.map((recentGame) => (
                <TouchableOpacity
                  key={recentGame.id}
                  style={styles.gameCard}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate('Game', {
                    gameConfig: recentGame.gameConfig,
                    objectLabel: recentGame.objectLabel,
                    initialGameType: getRecentPlayedGameType(recentGame),
                  })}
                >
                  <View
                    style={[
                      styles.gameIconWrap,
                      {
                        backgroundColor: getRecentGameColor(getRecentPlayedGameType(recentGame)) + '28',
                        borderColor: getRecentGameColor(getRecentPlayedGameType(recentGame)) + '55',
                      },
                    ]}
                  >
                    <RecentGameIcon
                      game={recentGame}
                      color={getRecentGameColor(getRecentPlayedGameType(recentGame))}
                    />
                  </View>
                  <View style={styles.gameInfo}>
                    <Text style={styles.gameTitle} numberOfLines={1}>
                      {getRecentGameTitle(recentGame)}
                    </Text>
                    <Text style={[styles.gameMeta, { color: getRecentGameColor(getRecentPlayedGameType(recentGame)) }]}>
                      {getRecentPlayedGameType(recentGame)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.recentStateCard}>
              <Ionicons name="game-controller-outline" size={24} color={COLORS.textMuted} />
              <Text style={styles.recentStateTitle}>No games played yet</Text>
              <Text style={styles.recentStateText}>
                Scan something and start a game to see it here.
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.scanButtonWrap, { bottom: insets.bottom + 28 }]}>
          <TouchableOpacity
            style={[styles.scanBtn, scanning && styles.scanBtnDisabled]}
            onPress={scanFromViewfinder}
            activeOpacity={0.85}
            disabled={scanning || !cameraPermission?.granted}
          >
            <View style={styles.scanOuterRing}>
              <View style={styles.scanInnerRing}>
                {scanning ? (
                  <ActivityIndicator size="small" color={COLORS.bg} />
                ) : (
                  <Ionicons name="scan" size={20} color={COLORS.bg} />
                )}
              </View>
            </View>
            <Text style={styles.scanText}>{scanning ? 'Scanning...' : 'Tap to Scan'}</Text>
          </TouchableOpacity>
        </View>
      </View>

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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 6,
  },
  brand: { color: COLORS.text, fontSize: 22, fontWeight: '700', letterSpacing: 3 },
  tagline: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  focusRingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusRing: {
    width: 180,
    height: 180,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.text + '66',
    backgroundColor: 'transparent',
  },
  bottomSheet: {
    backgroundColor: 'rgba(7, 10, 15, 0.72)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderColor: COLORS.surfaceLighter,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', letterSpacing: 0.4 },
  seeAll: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  recentRow: {
    gap: 10,
    paddingBottom: 2,
  },
  gameCard: {
    width: 206,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceLighter,
    backgroundColor: COLORS.surface + 'D9',
    gap: 10,
  },
  gameIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameInfo: { flex: 1 },
  gameTitle: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  gameMeta: { fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  recentStateCard: {
    backgroundColor: COLORS.surface + 'D9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceLighter,
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 8,
  },
  recentStateTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  recentStateText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  scanButtonWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanBtn: {
    alignItems: 'center',
    gap: 8,
  },
  scanBtnDisabled: { opacity: 0.6 },
  scanOuterRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 4,
    borderColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  scanInnerRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.seafoam,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  permissionCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.surfaceLighter,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 12,
  },
  permissionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  permissionText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButton: {
    marginTop: 6,
    backgroundColor: COLORS.seafoam,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  permissionButtonText: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: '700',
  },
  permissionLink: {
    color: COLORS.textMuted,
    fontSize: 13,
    textDecorationLine: 'underline',
  },

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
