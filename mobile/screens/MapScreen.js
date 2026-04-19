import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, getGameTheme } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const ARCGIS_TILE_URL =
  'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const FALLBACK_REGION = {
  latitude: 33.7455,
  longitude: -117.8677,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function parseMaybeJson(value, fallback) {
  if (!value) return fallback;
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeGame(game) {
  return {
    ...game,
    gameType: game.game_type,
    objectLabel: game.object_label,
    gameConfig: {
      gameType: game.game_type,
      title: game.title,
      rules: parseMaybeJson(game.rules, []),
      parameters: parseMaybeJson(game.parameters, {}),
      icon: game.icon ?? null,
      alternates: parseMaybeJson(game.alternates, []),
      confidence: game.confidence ?? 1,
    },
  };
}

function hasCoordinates(game) {
  return typeof game?.latitude === 'number' && typeof game?.longitude === 'number';
}

function milesBetween(from, to) {
  if (!from || !to) return null;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distance) {
  if (distance == null) return 'Map';
  if (distance < 0.1) return '<0.1 mi';
  return `${distance.toFixed(1)} mi`;
}

export default function MapScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const mapRef = useRef(null);

  const [userLocation, setUserLocation] = useState(null);
  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationReady, setLocationReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadLocation() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') return;

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!active) return;

        const nextRegion = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        };

        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        mapRef.current?.animateToRegion(nextRegion, 350);
      } catch (error) {
        console.error('[MAP] Failed to capture current location:', error);
      } finally {
        if (active) setLocationReady(true);
      }
    }

    loadLocation();

    return () => {
      active = false;
    };
  }, []);

  async function fetchGames(showSpinner = false) {
    if (!API_URL) {
      Alert.alert('Missing API URL', 'Set EXPO_PUBLIC_API_URL before using the map.');
      setLoading(false);
      return;
    }

    try {
      if (showSpinner) setLoading(true);
      else setRefreshing(true);

      const response = await fetch(`${API_URL}/api/v1/map`);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const payload = await response.json();
      const normalizedGames = payload.map(normalizeGame);

      setGames(normalizedGames);

      if (selectedGameId) {
        const updatedSelection = normalizedGames.find((game) => game.id === selectedGameId);
        if (!updatedSelection) {
          setSelectedGameId(null);
        }
      }
    } catch (error) {
      console.error('[MAP] Failed to load games:', error);
      Alert.alert('Map unavailable', error.message || 'Could not load map games.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!isFocused) return;
    fetchGames(games.length === 0);
  }, [isFocused]);

  const placedGames = games.filter(hasCoordinates);
  const unplacedGames = games.filter((game) => !hasCoordinates(game));
  const selectedGame = games.find((game) => game.id === selectedGameId) ?? null;

  const nearbyGames = [...placedGames].sort((left, right) => {
    const leftDistance = milesBetween(userLocation, left);
    const rightDistance = milesBetween(userLocation, right);
    return (leftDistance ?? Number.MAX_SAFE_INTEGER) - (rightDistance ?? Number.MAX_SAFE_INTEGER);
  });

  function focusGame(game) {
    setSelectedGameId(game.id);

    if (hasCoordinates(game)) {
      const nextRegion = {
        latitude: game.latitude,
        longitude: game.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };

      mapRef.current?.animateToRegion(nextRegion, 350);
    }
  }

  function openGame(game) {
    navigation.navigate('Game', {
      gameConfig: game.gameConfig,
      objectLabel: game.objectLabel ?? game.title,
    });
  }

  const selectedDistance = selectedGame ? formatDistance(milesBetween(userLocation, selectedGame)) : null;

  return (
    <View style={styles.container}>
      <View style={[styles.mapWrap, { paddingTop: insets.top }]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={FALLBACK_REGION}
          mapType={Platform.OS === 'android' ? 'none' : 'standard'}
          showsUserLocation
          showsMyLocationButton
          showsCompass
        >
          <UrlTile
            urlTemplate={ARCGIS_TILE_URL}
            maximumZ={19}
            flipY={false}
            shouldReplaceMapContent
            zIndex={0}
          />

          {placedGames.map((game) => {
            const color = getGameTheme(game.gameType);
            const active = game.id === selectedGameId;

            return (
              <Marker
                key={game.id}
                coordinate={{ latitude: game.latitude, longitude: game.longitude }}
                title={game.title}
                description={game.objectLabel}
                pinColor={active ? COLORS.highlight : color}
                onPress={() => focusGame(game)}
              />
            );
          })}
        </MapView>
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 92 }]}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Map Games</Text>
            <Text style={styles.panelSub}>
              {placedGames.length} placed · {unplacedGames.length} waiting
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            activeOpacity={0.8}
            onPress={() => fetchGames(false)}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={COLORS.bg} />
            ) : (
              <Ionicons name="refresh" size={16} color={COLORS.bg} />
            )}
          </TouchableOpacity>
        </View>

        {loading && !locationReady ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={COLORS.seafoam} />
            <Text style={styles.loadingText}>Loading map context...</Text>
          </View>
        ) : null}

        {selectedGame ? (
          <View style={styles.selectedCard}>
            <View style={styles.selectedHeader}>
              <View>
                <Text style={styles.selectedTitle}>{selectedGame.title}</Text>
                <Text
                  style={[
                    styles.selectedMeta,
                    { color: getGameTheme(selectedGame.gameType) },
                  ]}
                >
                  {selectedGame.gameType} · {selectedDistance ?? 'Selected'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.playBtn}
                activeOpacity={0.85}
                onPress={() => openGame(selectedGame)}
              >
                <Ionicons name="game-controller-outline" size={16} color={COLORS.bg} />
                <Text style={styles.playBtnText}>Play</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.selectedHint}>
              {hasCoordinates(selectedGame)
                ? `Pinned at ${selectedGame.latitude.toFixed(4)}, ${selectedGame.longitude.toFixed(4)}`
                : 'This game does not have map coordinates yet.'}
            </Text>
          </View>
        ) : null}

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {unplacedGames.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Needs Placement</Text>
              {unplacedGames.map((game) => {
                const active = game.id === selectedGameId;
                const color = getGameTheme(game.gameType);

                return (
                  <TouchableOpacity
                    key={game.id}
                    style={[styles.row, active && styles.rowActive]}
                    activeOpacity={0.78}
                    onPress={() => {
                      setSelectedGameId(game.id);
                      setPlacementCoordinate(null);
                    }}
                  >
                    <View style={[styles.rowIcon, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                      <Ionicons name="pin-outline" size={16} color={color} />
                    </View>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowTitle}>{game.title}</Text>
                      <Text style={[styles.rowType, { color }]}>
                        {game.gameType} · location pending
                      </Text>
                    </View>
                    <Text style={styles.rowAction}>Pending</Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          <Text style={styles.sectionTitle}>Nearby Games</Text>
          {nearbyGames.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={20} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No placed games yet. Start by dropping one above.</Text>
            </View>
          ) : (
            nearbyGames.map((game) => {
              const active = game.id === selectedGameId;
              const color = getGameTheme(game.gameType);
              const distance = formatDistance(milesBetween(userLocation, game));

              return (
                <TouchableOpacity
                  key={game.id}
                  style={[styles.row, active && styles.rowActive]}
                  activeOpacity={0.78}
                  onPress={() => focusGame(game)}
                >
                  <View style={[styles.rowIcon, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                    <Ionicons name="game-controller-outline" size={16} color={color} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle}>{game.title}</Text>
                    <Text style={[styles.rowType, { color }]}>
                      {game.gameType} · {game.objectLabel}
                    </Text>
                  </View>
                  <Text style={styles.rowAction}>{distance}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  mapWrap: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  map: {
    flex: 1,
  },
  panel: {
    maxHeight: '52%',
    backgroundColor: COLORS.surfaceLighter,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderColor: COLORS.cyan + '44',
    paddingTop: 18,
    paddingHorizontal: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  panelTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  panelSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.seafoam,
  },
  loadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  selectedCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cyan + '44',
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectedTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  selectedMeta: {
    fontSize: 12,
    marginTop: 3,
    textTransform: 'capitalize',
  },
  selectedHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.highlight,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  playBtnText: {
    color: COLORS.bg,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
  },
  rowActive: {
    borderColor: COLORS.highlight + '66',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  rowType: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  rowAction: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
  },
  emptyText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
