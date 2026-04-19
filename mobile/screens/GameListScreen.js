import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { validateIcon } from '../utils/iconValidator';
import { getScannedGames } from '../utils/scannedGamesStorage';
import { toTitleCase } from '../utils/text';

const { width } = Dimensions.get('window');
const GAP = 12;
const PADDING = 20;
const THUMB_SIZE = (width - PADDING * 2 - GAP) / 2;

const GAME_TYPE_STYLES = {
  dodge: { color: COLORS.coral },
  balance: { color: COLORS.anemone },
  catch: { color: COLORS.seafoam },
  swipe: { color: COLORS.electricIndigo },
  timing: { color: COLORS.cyan },
  runner: { color: COLORS.highlight },
};

const GAME_TYPE_LABELS = {
  dodge: 'Dodge',
  balance: 'Balance',
  catch: 'Catch',
  swipe: 'Swipe',
  timing: 'Timing',
  runner: 'Runner',
};

function getPlayedGameType(game) {
  return game.lastPlayedGameType ?? game.gameConfig?.gameType ?? 'game';
}

function getGamePresentation(game) {
  const gameType = getPlayedGameType(game);
  return GAME_TYPE_STYLES[gameType] ?? GAME_TYPE_STYLES.dodge;
}

function GameIcon({ game, color }) {
  const validatedIcon = validateIcon(game.gameConfig?.icon);
  const iconLibrary = validatedIcon.library;
  const iconName = validatedIcon.name;

  if (iconLibrary === 'mci' && iconName) {
    return <MaterialCommunityIcons name={iconName} size={36} color={color} />;
  }

  return <Ionicons name="game-controller-outline" size={36} color={color} />;
}

function getGameCardTitle(game) {
  const playedGameType = getPlayedGameType(game);
  const primaryGameType = game.gameConfig?.gameType;

  if (playedGameType && primaryGameType && playedGameType !== primaryGameType) {
    return `${toTitleCase(game.objectLabel)} ${GAME_TYPE_LABELS[playedGameType] ?? toTitleCase(playedGameType)}`;
  }

  return toTitleCase(game.gameConfig?.title ?? game.objectLabel);
}

export default function GameListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const loadGames = useCallback(async () => {
    setLoading(true);

    try {
      const storedGames = await getScannedGames();
      setGames(storedGames);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGames();
    }, [loadGames])
  );

  const filterOptions = [
    { id: 'all', label: 'All' },
    ...Array.from(new Set(games.map(game => getPlayedGameType(game))))
      .filter(Boolean)
      .map(gameType => ({
        id: gameType,
        label: GAME_TYPE_LABELS[gameType] ?? toTitleCase(gameType),
      })),
  ];

  const filteredGames = selectedFilter === 'all'
    ? games
    : games.filter(game => getPlayedGameType(game) === selectedFilter);

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={COLORS.bg} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Your Games</Text>
        <Text style={styles.sub}>Games you've scanned will appear here</Text>

        {!loading && games.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
            {filterOptions.map(filter => {
              const active = filter.id === selectedFilter;
              const activeColor = filter.id === 'all'
                ? COLORS.seafoam
                : (GAME_TYPE_STYLES[filter.id]?.color ?? COLORS.seafoam);

              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterChip,
                    active && {
                      backgroundColor: activeColor,
                      borderColor: activeColor,
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedFilter(filter.id)}
                >
                  <Text style={[
                    styles.filterLabel,
                    active && styles.filterLabelActive,
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {loading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="small" color={COLORS.seafoam} />
            <Text style={styles.stateText}>Loading scanned games...</Text>
          </View>
        ) : games.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="scan-outline" size={32} color={COLORS.seafoam} />
            <Text style={styles.emptyTitle}>No scanned games yet</Text>
            <Text style={styles.emptyText}>
              Scan an object on the Home screen and it&apos;ll show up here automatically.
            </Text>
          </View>
        ) : filteredGames.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="funnel-outline" size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No matches for this filter</Text>
            <Text style={styles.emptyText}>
              Try a different game type to see more of your scanned games.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredGames.map(game => {
              const presentation = getGamePresentation(game);

              return (
                <TouchableOpacity
                  key={game.id}
                  style={styles.item}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate('Game', {
                    gameConfig: game.gameConfig,
                    objectLabel: game.objectLabel,
                    initialGameType: getPlayedGameType(game),
                  })}
                >
                  <View style={[
                    styles.thumb,
                    {
                      backgroundColor: presentation.color + '18',
                      borderColor: presentation.color + '55',
                    },
                  ]}>
                    <GameIcon game={game} color={presentation.color} />
                  </View>
                  <Text style={styles.label} numberOfLines={2}>
                    {getGameCardTitle(game)}
                  </Text>
                  <Text style={[styles.type, { color: presentation.color }]}>
                    {getPlayedGameType(game)}
                  </Text>
                  {!!game.locationLabel && (
                    <Text style={styles.location} numberOfLines={1}>
                      {game.locationLabel}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: PADDING },

  heading: { color: COLORS.text, fontSize: 22, fontWeight: '700', letterSpacing: 0.3 },
  sub: { color: COLORS.textMuted, fontSize: 13, marginTop: 4, marginBottom: 24 },
  filtersRow: {
    gap: 10,
    paddingBottom: 18,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.surfaceLighter,
    backgroundColor: COLORS.surface,
  },
  filterLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  filterLabelActive: {
    color: COLORS.bg,
  },
  stateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  stateText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.seafoam + '33',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 10,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  item: {
    width: THUMB_SIZE,
    marginBottom: 4,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  type: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  location: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
});
