import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, getGameTheme } from '../theme';
import { validateIcon } from '../utils/iconValidator';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const DEFAULT_SEARCH_RADIUS_MILES = 5;
const GAME_ROW_HEIGHT = 74;
const FALLBACK_REGION = {
  latitude: 33.7455,
  longitude: -117.8677,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#031017' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6f8793' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#031017' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#12303c' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#04131a' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#0b2028' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f8793' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#12303c' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0b2028' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#91a7b4' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#102733' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#02070b' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6774' }] },
];

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

function NearbyGameIcon({ game, color }) {
  const validatedIcon = validateIcon(game?.gameConfig?.icon);

  if (validatedIcon.library === 'mci' && validatedIcon.name) {
    return <MaterialCommunityIcons name={validatedIcon.name} size={20} color={color} />;
  }

  return <Ionicons name="game-controller-outline" size={20} color={color} />;
}

export default function MapScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const mapRef = useRef(null);
  const listScrollRef = useRef(null);

  const [userLocation, setUserLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(FALLBACK_REGION);
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
        setMapRegion(nextRegion);
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

      const allRes = await fetch(`${API_URL}/api/v1/game`);
      if (!allRes.ok) {
        throw new Error(`Server returned ${allRes.status}`);
      }

      const allPayload = await allRes.json();
      const normalizedAll = allPayload.map(normalizeGame);
      const unplaced = normalizedAll.filter((game) => !hasCoordinates(game));

      let placedInView = [];
      if (userLocation) {
        const params = new URLSearchParams({
          lat: String(userLocation.latitude),
          lng: String(userLocation.longitude),
          radius: String(DEFAULT_SEARCH_RADIUS_MILES),
        });
        const nearbyRes = await fetch(`${API_URL}/api/v1/game/nearby?${params.toString()}`);
        if (!nearbyRes.ok) {
          throw new Error(`Server returned ${nearbyRes.status}`);
        }
        const nearbyPayload = await nearbyRes.json();
        placedInView = nearbyPayload.map(normalizeGame);
      } else {
        placedInView = normalizedAll.filter(hasCoordinates);
      }

      const mergedById = new Map();
      for (const game of unplaced) mergedById.set(game.id, game);
      for (const game of placedInView) mergedById.set(game.id, game);

      const normalizedGames = [...mergedById.values()];
      setGames(normalizedGames);

      if (selectedGameId && !normalizedGames.find((game) => game.id === selectedGameId)) {
        setSelectedGameId(null);
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
  }, [isFocused, userLocation]);

  const placedGames = games.filter(hasCoordinates);
  const waitingCount = games.length - placedGames.length;
  const nearbyGames = useMemo(
    () =>
      [...placedGames].sort((left, right) => {
        const leftDistance = milesBetween(userLocation, left);
        const rightDistance = milesBetween(userLocation, right);
        return (leftDistance ?? Number.MAX_SAFE_INTEGER) - (rightDistance ?? Number.MAX_SAFE_INTEGER);
      }),
    [placedGames, userLocation]
  );

  const summaryText =
    waitingCount > 0
      ? `${nearbyGames.length} nearby games, ${waitingCount} still waiting for placement`
      : `${nearbyGames.length} nearby games ready to play`;

  useEffect(() => {
    if (!selectedGameId) return;

    const listIndex = nearbyGames.findIndex((game) => game.id === selectedGameId);
    if (listIndex >= 0) {
      listScrollRef.current?.scrollTo({
        y: listIndex * GAME_ROW_HEIGHT,
        animated: true,
      });
    }
  }, [selectedGameId, nearbyGames]);

  function focusGame(game) {
    setSelectedGameId(game.id);

    if (hasCoordinates(game)) {
      const nextRegion = {
        latitude: game.latitude,
        longitude: game.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };

      setMapRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 350);
    }
  }

  function openGame(game) {
    navigation.navigate('Game', {
      gameConfig: game.gameConfig,
      objectLabel: game.objectLabel ?? game.title,
    });
  }

  function zoomMap(scale) {
    const nextRegion = {
      ...mapRegion,
      latitudeDelta: Math.min(Math.max(mapRegion.latitudeDelta * scale, 0.003), 0.3),
      longitudeDelta: Math.min(Math.max(mapRegion.longitudeDelta * scale, 0.003), 0.3),
    };

    setMapRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 250);
  }

  function centerOnUser() {
    if (!userLocation) return;

    const nextRegion = {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };

    setMapRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 300);
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={COLORS.bg} />

      <View style={styles.mapSection}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={FALLBACK_REGION}
          mapType="standard"
          customMapStyle={DARK_MAP_STYLE}
          showsUserLocation
          showsMyLocationButton
          showsCompass
          toolbarEnabled={false}
          rotateEnabled={false}
          onRegionChangeComplete={(region) => setMapRegion(region)}
        >
          {placedGames.map((game) => {
            const color = getGameTheme(game.gameType);
            const active = game.id === selectedGameId;

            return (
              <Marker
                key={game.id}
                coordinate={{ latitude: game.latitude, longitude: game.longitude }}
                title={game.title}
                description={game.objectLabel}
                anchor={{ x: 0.5, y: 0.92 }}
                onPress={() => focusGame(game)}
              >
                <View style={styles.markerWrap}>
                  <View style={[styles.markerShadow, active && styles.markerShadowActive]} />
                  <View
                    style={[
                      styles.markerPin,
                      { backgroundColor: active ? COLORS.highlight : '#ffffff' },
                    ]}
                  >
                    <View
                      style={[
                        styles.markerDot,
                        { backgroundColor: active ? COLORS.bg : color },
                      ]}
                    />
                  </View>
                </View>
              </Marker>
            );
          })}
        </MapView>

        <View
          pointerEvents="none"
          style={[styles.statusBarScrim, { height: insets.top + 18 }]}
        />

        <View style={[styles.mapControls, { top: insets.top + 22 }]}>
          <TouchableOpacity
            style={styles.mapControlBtn}
            activeOpacity={0.82}
            onPress={centerOnUser}
            disabled={!userLocation}
          >
            <Ionicons
              name="locate"
              size={18}
              color={userLocation ? COLORS.text : COLORS.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapControlBtn}
            activeOpacity={0.82}
            onPress={() => zoomMap(0.6)}
          >
            <Ionicons name="add" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapControlBtn}
            activeOpacity={0.82}
            onPress={() => zoomMap(1.6)}
          >
            <Ionicons name="remove" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listPanel}>
        <ScrollView
          ref={listScrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 74 }]}
        >
          <View style={styles.listHeader}>
            <View style={styles.listCopy}>
              <Text style={styles.listEyebrow}>Map Feed</Text>
              <Text style={styles.listTitle}>Nearby Games</Text>
              <Text style={styles.listSubtitle}>
                {locationReady ? summaryText : 'Finding your location...'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refreshBtn}
              activeOpacity={0.82}
              onPress={() => fetchGames(false)}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={COLORS.text} />
              ) : (
                <Ionicons name="refresh" size={16} color={COLORS.text} />
              )}
            </TouchableOpacity>
          </View>

          {loading && !locationReady ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={COLORS.seafoam} />
              <Text style={styles.loadingText}>Loading map details...</Text>
            </View>
          ) : nearbyGames.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={20} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No nearby games yet.</Text>
            </View>
          ) : (
            nearbyGames.map((game) => {
              const active = game.id === selectedGameId;
              const color = getGameTheme(game.gameType);
              const distance = formatDistance(milesBetween(userLocation, game));

              return (
                <View key={game.id} style={[styles.gameRow, active && styles.gameRowActive]}>
                  <TouchableOpacity
                    style={styles.gameMain}
                    activeOpacity={0.8}
                    onPress={() => focusGame(game)}
                  >
                    <View
                      style={[
                        styles.gameIcon,
                        { backgroundColor: color + '14', borderColor: color + '26' },
                      ]}
                    >
                      <NearbyGameIcon game={game} color={color} />
                    </View>

                    <View style={styles.gameInfo}>
                      <Text style={styles.gameTitle}>{game.title}</Text>
                      <Text style={[styles.gameMeta, { color }]}>
                        {game.objectLabel}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.gameAside}>
                    <Text style={styles.gameDistance}>{distance}</Text>
                    <TouchableOpacity
                      style={styles.playBtn}
                      activeOpacity={0.86}
                      onPress={() => openGame(game)}
                    >
                      <Ionicons name="play" size={12} color={COLORS.bg} />
                      <Text style={styles.playBtnText}>Play</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  mapSection: {
    flex: 7,
    overflow: 'hidden',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    backgroundColor: COLORS.surface,
  },
  map: {
    flex: 1,
  },
  statusBarScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(2,7,11,0.62)',
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    gap: 10,
  },
  mapControlBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cyan + '44',
    shadowColor: '#0f172a',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  listPanel: {
    flex: 3,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  listCopy: {
    flex: 1,
  },
  listEyebrow: {
    color: COLORS.seafoam,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  listTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
  },
  listSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.textDim,
  },
  loadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  markerWrap: {
    alignItems: 'center',
  },
  markerShadow: {
    position: 'absolute',
    bottom: 1,
    width: 18,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(2,7,11,0.45)',
  },
  markerShadowActive: {
    width: 22,
    backgroundColor: 'rgba(2,7,11,0.62)',
  },
  markerPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'rgba(17,24,39,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  listContent: {
    gap: 8,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.textDim,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  gameRowActive: {
    borderColor: COLORS.highlight + '66',
    backgroundColor: COLORS.surfaceLighter,
  },
  gameMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gameIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  gameMeta: {
    fontSize: 12,
    marginTop: 3,
  },
  gameAside: {
    alignItems: 'flex-end',
    gap: 8,
  },
  gameDistance: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.highlight,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  playBtnText: {
    color: COLORS.bg,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.textDim,
    backgroundColor: COLORS.surface,
    padding: 14,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
