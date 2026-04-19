import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';

const STATS = [
  { label: 'Scanned',    value: '24',  icon: 'scan-outline',            color: COLORS.cyan },
  { label: 'Plays',      value: '147', icon: 'game-controller-outline', color: COLORS.seafoam },
  { label: 'On Map',     value: '8',   icon: 'location-outline',        color: COLORS.coral },
  { label: 'Feedback',   value: '31',  icon: 'chatbubble-outline',      color: COLORS.anemone },
];

const ACTIVITY = [
  { id: '1', text: 'Scanned a bottle',     sub: '2 hours ago',  icon: 'scan-outline',    color: COLORS.seafoam },
  { id: '2', text: 'Placed game on map',   sub: '5 hours ago',  icon: 'location-outline', color: COLORS.coral },
  { id: '3', text: 'Played Book Swipe',    sub: 'Yesterday',    icon: 'game-controller-outline', color: COLORS.electricIndigo },
  { id: '4', text: 'Left feedback',        sub: 'Yesterday',    icon: 'chatbubble-outline', color: COLORS.highlight },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar style="light" backgroundColor={COLORS.bg} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarWrap}>
          <View style={styles.avatarRing}>
            <Ionicons name="person" size={38} color={COLORS.seafoam} />
          </View>
          <Text style={styles.name}>Player One</Text>
          <Text style={styles.handle}>@lootr_user</Text>
        </View>

        <View style={styles.statsGrid}>
          {STATS.map(s => (
            <View key={s.label} style={[styles.statCard, { borderColor: s.color + '44' }]}>
              <Ionicons name={s.icon} size={20} color={s.color} />
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {ACTIVITY.map(a => (
            <View
              key={a.id}
              style={[
                styles.activityRow,
                { backgroundColor: a.id === '2' ? COLORS.kelp : COLORS.surface },
              ]}
            >
              <View style={[styles.activityIcon, { backgroundColor: a.color + '22', borderColor: a.color + '55' }]}>
                <Ionicons name={a.icon} size={16} color={a.color} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityText}>{a.text}</Text>
                <Text style={[styles.activitySub, { color: a.color }]}>{a.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.feedbackRow} activeOpacity={0.75}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.electricIndigo} />
          <Text style={[styles.feedbackText, { color: COLORS.electricIndigo }]}>View feedback history</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.electricIndigo + '77'} />
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 20 },

  avatarWrap: { alignItems: 'center', marginBottom: 28 },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.seafoam + '66',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: { color: COLORS.highlight, fontSize: 20, fontWeight: '700' },
  handle: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 11, textAlign: 'center' },

  sectionTitle: { color: COLORS.highlight, fontSize: 15, fontWeight: '700', marginBottom: 12 },

  activityList: { gap: 8, marginBottom: 20 },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceLighter,
  },
  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: { flex: 1 },
  activityText: { color: COLORS.text, fontSize: 14, fontWeight: '500' },
  activitySub: { fontSize: 11, marginTop: 2 },

  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.electricIndigo + '44',
  },
  feedbackText: { flex: 1, fontSize: 14, fontWeight: '600' },
});
