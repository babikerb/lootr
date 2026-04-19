import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const RECENT_GAMES = [
  { id: '1', title: 'Basketball Dodge',  type: 'dodge',   plays: 42, icon: 'basketball',          color: COLORS.coral },
  { id: '2', title: 'Book Stack', type: 'stack', plays: 17, icon: 'book',      color: COLORS.anemone },
  { id: '3', title: 'Cup Catch',     type: 'catch',   plays: 88, icon: 'hand-left',       color: COLORS.electricIndigo },
  { id: '4', title: 'Book Swipe',    type: 'swipe',   plays: 33, icon: 'swap-horizontal', color: COLORS.seafoam },
];


export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

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
      console.log('[SCAN] Result:', JSON.stringify(data));
      setScanResult(data);
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
          <Text style={styles.brand}>lootr</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="person-circle-outline" size={30} color={COLORS.seafoam} />
          </TouchableOpacity>
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
          <Text style={styles.sectionTitle}>Recent Games</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Games')}>
            <Text style={[styles.seeAll, { color: COLORS.text }]}>See All</Text>
          </TouchableOpacity>
        </View>

        {RECENT_GAMES.map(game => (
          <TouchableOpacity
            key={game.id}
            style={[styles.gameCard, { backgroundColor: game.id === '3' ? COLORS.kelp : COLORS.surface }]}
            activeOpacity={0.75}
          >
            <View style={[styles.gameIconWrap, { backgroundColor: game.color + '28', borderColor: game.color + '55' }]}>
              <Ionicons name={game.icon} size={20} color={game.color} />
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameTitle}>{game.title}</Text>
              <Text style={[styles.gameMeta, { color: game.color }]}>{game.type} · {game.plays} plays</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
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
            <Text style={styles.modalObject}>{scanResult?.objectLabel}</Text>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  brand: { color: COLORS.text, fontSize: 22, fontWeight: '700', letterSpacing: 3 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

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
