import { Ionicons } from '@expo/vector-icons';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';

const { width } = Dimensions.get('window');
const GAP = 12;
const PADDING = 20;
const THUMB_SIZE = (width - PADDING * 2 - GAP) / 2;

const GAMES = [
  { id: '1', title: 'Bottle Dodge',  type: 'dodge',   icon: 'flash-outline',           color: COLORS.coral },
  { id: '2', title: 'Chair Balance', type: 'balance', icon: 'git-branch-outline',      color: COLORS.anemone },
  { id: '3', title: 'Cup Catch',     type: 'catch',   icon: 'hand-left-outline',       color: COLORS.seafoam },
  { id: '4', title: 'Book Swipe',    type: 'swipe',   icon: 'swap-horizontal-outline', color: COLORS.electricIndigo },
  { id: '5', title: 'Clock Timing',  type: 'timing',  icon: 'timer-outline',           color: COLORS.cyan },
  { id: '6', title: 'Shoe Runner',   type: 'runner',  icon: 'walk-outline',            color: COLORS.highlight },
];

export default function GameListScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Your Games</Text>
        <Text style={styles.sub}>Games you've scanned will appear here</Text>

        <View style={styles.grid}>
          {GAMES.map(game => (
            <TouchableOpacity key={game.id} style={styles.item} activeOpacity={0.75}>
              <View style={[
                styles.thumb,
                {
                  backgroundColor: game.id === '3' || game.id === '4' ? COLORS.kelp : COLORS.surface,
                  borderColor: game.color + '55',
                },
              ]}>
                <Ionicons name={game.icon} size={36} color={game.color} />
              </View>
              <Text style={styles.label} numberOfLines={2}>{game.title}</Text>
              <Text style={[styles.type, { color: game.color }]}>{game.type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: PADDING },

  heading: { color: COLORS.text, fontSize: 22, fontWeight: '700', letterSpacing: 0.3 },
  sub: { color: COLORS.textMuted, fontSize: 13, marginTop: 4, marginBottom: 24 },

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
});
