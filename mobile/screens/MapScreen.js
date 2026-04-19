import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';

const NEARBY = [
  { id: '1', title: 'Bottle Dodge',  distance: '0.2 mi', type: 'dodge',   icon: 'flash-outline',           color: COLORS.coral },
  { id: '2', title: 'Cup Catch',     distance: '0.5 mi', type: 'catch',   icon: 'hand-left-outline',       color: COLORS.seafoam },
  { id: '3', title: 'Clock Timing',  distance: '0.9 mi', type: 'timing',  icon: 'timer-outline',           color: COLORS.highlight },
  { id: '4', title: 'Book Swipe',    distance: '1.2 mi', type: 'swipe',   icon: 'swap-horizontal-outline', color: COLORS.electricIndigo },
  { id: '5', title: 'Chair Balance', distance: '1.7 mi', type: 'balance', icon: 'git-branch-outline',      color: COLORS.anemone },
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.mapPlaceholder}>
        <View style={styles.glowCoral} />
        <View style={styles.glowAnemone} />
        <View style={styles.glowCyan} />
        <View style={styles.glowSeafoam} />
        <Ionicons name="map-outline" size={48} color={COLORS.textDim} />
        <Text style={styles.mapLabel}>Map coming soon</Text>

        {NEARBY.map((g, i) => (
          <View
            key={g.id}
            style={[
              styles.pin,
              {
                backgroundColor: g.color + '33',
                borderColor: g.color + '88',
                top: 36 + i * 30,
                left: 28 + (i % 3) * 70,
              },
            ]}
          >
            <Ionicons name={g.icon} size={10} color={g.color} />
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Nearby Games</Text>
          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        {NEARBY.map(game => (
          <TouchableOpacity key={game.id} style={styles.row} activeOpacity={0.75}>
            <View style={[styles.rowIcon, { backgroundColor: game.color + '22', borderColor: game.color + '55' }]}>
              <Ionicons name={game.icon} size={18} color={game.color} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>{game.title}</Text>
              <Text style={[styles.rowType, { color: game.color }]}>{game.type}</Text>
            </View>
            <Text style={styles.rowDist}>{game.distance}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  mapPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glowCoral: {
    position: 'absolute', top: 20, left: 30,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: COLORS.coral + '20',
  },
  glowAnemone: {
    position: 'absolute', bottom: 10, right: 20,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: COLORS.anemone + '20',
  },
  glowCyan: {
    position: 'absolute', top: 50, right: 50,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.cyan + '28',
  },
  glowSeafoam: {
    position: 'absolute', bottom: 30, left: '35%',
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.seafoam + '20',
  },
  mapLabel: { color: COLORS.textDim, fontSize: 13, marginTop: 10 },
  pin: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  panel: {
    backgroundColor: COLORS.surfaceLighter,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: COLORS.cyan + '44',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  panelTitle: { color: COLORS.highlight, fontSize: 16, fontWeight: '700' },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.coral + '66',
    backgroundColor: COLORS.coral + '18',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.coral },
  liveText: { fontSize: 11, fontWeight: '700', color: COLORS.coral },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderColor: COLORS.surfaceLighter,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  rowTitle: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  rowType: { fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  rowDist: { color: COLORS.textMuted, fontSize: 12 },
});
