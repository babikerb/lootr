import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useEffect, useReducer, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../theme";

const { width: W, height: H } = Dimensions.get("window");
const PLAYER_W = 72,
  PLAYER_H = 36;
const OBS_W = 60,
  OBS_H = 60;
const PLAYER_Y = H - 180;
const PLAYER_SPEED = 7;

// [keywords, library, iconName]  library: 'mci' | 'fa5' | 'ion'
const ICON_ENTRIES = [
  [["bottle", "wine"], "mci", "bottle-wine"],
  [["water"], "mci", "bottle-water"],
  [["can", "soda", "tin"], "mci", "bottle-soda"],
  [["basketball"], "mci", "basketball"],
  [["tennis"], "mci", "tennis-ball"],
  [["baseball"], "mci", "baseball"],
  [["volleyball"], "mci", "volleyball"],
  [["football", "nfl"], "fa5", "football-ball"],
  [["soccer", "futbol"], "fa5", "futbol"],
  [["ball"], "mci", "handball"],
  [["book"], "mci", "book-open-variant"],
  [["notebook"], "mci", "notebook"],
  [["paper", "document"], "mci", "file-document"],
  [["cup", "mug", "coffee"], "mci", "coffee"],
  [["phone", "mobile"], "mci", "cellphone"],
  [["laptop"], "mci", "laptop"],
  [["computer", "monitor"], "mci", "monitor"],
  [["keyboard"], "mci", "keyboard"],
  [["mouse"], "mci", "mouse"],
  [["headphones", "headset"], "mci", "headphones"],
  [["earbuds", "airpods"], "ion", "headset"],
  [["camera"], "mci", "camera"],
  [["watch"], "mci", "watch"],
  [["key"], "mci", "key"],
  [["wallet"], "mci", "wallet"],
  [["bag", "backpack", "purse"], "mci", "bag-personal"],
  [["chair"], "mci", "chair-rolling"],
  [["scissors"], "mci", "content-cut"],
  [["pen"], "mci", "pen"],
  [["pencil"], "mci", "pencil"],
  [["glasses", "spectacles"], "mci", "glasses"],
  [["sunglasses", "shades"], "mci", "sunglasses"],
  [["shoe", "sneaker", "boot"], "mci", "shoe-sneaker"],
  [["hat", "cap"], "mci", "hat-fedora"],
  [["plant", "flower", "pot"], "mci", "flower"],
  [["clock"], "mci", "clock-outline"],
  [["lamp", "light"], "mci", "lamp"],
  [["remote"], "mci", "remote"],
  [["charger", "plug", "cable"], "mci", "power-plug"],
  [["umbrella"], "mci", "umbrella"],
  [["apple"], "mci", "food-apple"],
  [["banana"], "fa5", "lemon"],
  [["food", "snack"], "mci", "food"],
  [["car", "vehicle"], "mci", "car"],
  [["bike", "bicycle"], "mci", "bicycle"],
  [["tool", "wrench", "hammer"], "mci", "tools"],
];

/**
 * Fetches the library and name for a given label
 */
function getIconEntry(label) {
  if (!label) return { lib: "ion", name: "cube-outline" };
  const lower = label.toLowerCase();
  for (const [keywords, lib, name] of ICON_ENTRIES) {
    if (keywords.some((k) => lower.includes(k))) return { lib, name };
  }
  return { lib: "ion", name: "cube-outline" };
}

/**
 * Helper specifically for logic that only needs the string name
 * (Used for components that expect a specific library like MaterialCommunityIcons)
 */
function getIcon(label) {
  return getIconEntry(label).name;
}

function ObjectIcon({ label, size, color }) {
  const { lib, name } = getIconEntry(label);
  if (lib === "mci")
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  if (lib === "fa5")
    return <FontAwesome5 name={name} size={size} color={color} />;
  return <Ionicons name={name} size={size} color={color} />;
}

function initState() {
  return {
    player: { x: W / 2 - PLAYER_W / 2, y: PLAYER_Y },
    obstacles: [],
    score: 0,
    elapsed: 0,
    lastSpawn: 0,
    obsCount: 0,
  };
}

export default function PlayScreen({ route, navigation }) {
  const { gameConfig, objectLabel } = route.params ?? {};
  const insets = useSafeAreaInsets();
  const speed = gameConfig?.parameters?.speed ?? 1;
  const gravity = gameConfig?.parameters?.gravity ?? 1;
  const objectColor = gameConfig?.color ?? COLORS.coral;

  const [phase, setPhase] = useState("start");
  const [displayScore, setDisplayScore] = useState(0);
  const forceRender = useReducer((x) => x + 1, 0)[1];
  const dirRef = useRef(null);
  const gameRef = useRef(initState());
  const rafRef = useRef(null);

  useEffect(() => {
    if (phase !== "playing") return;
    let lastTime = null;

    function loop(ts) {
      if (!lastTime) lastTime = ts;
      const delta = Math.min((ts - lastTime) / 16.67, 3);
      lastTime = ts;
      const s = gameRef.current;
      s.elapsed += delta * 16.67;

      if (dirRef.current === "left")
        s.player.x = Math.max(0, s.player.x - PLAYER_SPEED * delta);
      if (dirRef.current === "right")
        s.player.x = Math.min(W - PLAYER_W, s.player.x + PLAYER_SPEED * delta);

      const currentSpeed = speed * 3.5 * (1 + (s.elapsed / 25000) * gravity);
      const spawnInterval = Math.max(550, 2000 - s.elapsed / 20);

      if (s.elapsed - s.lastSpawn > spawnInterval) {
        s.obstacles.push({
          id: s.obsCount++,
          x: 16 + Math.random() * (W - OBS_W - 32),
          y: -OBS_H,
        });
        s.lastSpawn = s.elapsed;
      }

      let hit = false;
      s.obstacles = s.obstacles.filter((obs) => {
        obs.y += currentSpeed * delta;
        if (obs.y > H + OBS_H) {
          s.score++;
          return false;
        }
        if (
          obs.x < s.player.x + PLAYER_W &&
          obs.x + OBS_W > s.player.x &&
          obs.y < s.player.y + PLAYER_H &&
          obs.y + OBS_H > s.player.y
        )
          hit = true;
        return true;
      });

      if (hit) {
        setDisplayScore(s.score);
        setPhase("over");
        return;
      }
      forceRender();
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, speed, gravity, forceRender]);

  function startGame() {
    gameRef.current = initState();
    setDisplayScore(0);
    setPhase("playing");
  }

  const s = gameRef.current;
  const level = Math.min(Math.floor(s.elapsed / 8000) + 1, 10);
  const iconName = getIcon(objectLabel);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            cancelAnimationFrame(rafRef.current);
            navigation.goBack();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {gameConfig?.title ?? "Dodge!"}
        </Text>
        <View style={[styles.scoreBadge, { borderColor: objectColor + "55" }]}>
          <Text style={[styles.scoreText, { color: objectColor }]}>
            {phase === "playing" ? s.score : displayScore}
          </Text>
        </View>
      </View>

      <View style={styles.canvas}>
        {phase === "playing" && (
          <>
            {s.obstacles.map((obs) => (
              <View
                key={obs.id}
                style={[styles.obstacle, { left: obs.x, top: obs.y }]}
              >
                <View
                  style={[
                    styles.obsHalo,
                    {
                      backgroundColor: objectColor + "18",
                      borderColor: objectColor + "44",
                    },
                  ]}
                />
                <ObjectIcon label={objectLabel} size={44} color={objectColor} />
              </View>
            ))}

            <View
              style={[
                styles.player,
                {
                  left: s.player.x,
                  top: s.player.y,
                  shadowColor: COLORS.seafoam,
                },
              ]}
            >
              <View style={styles.playerInner} />
            </View>

            <View style={[styles.hudScore, { pointerEvents: "none" }]}>
              <Text style={styles.hudNumber}>{s.score}</Text>
              <Text style={styles.hudLabel}>dodged</Text>
            </View>

            <View style={[styles.levelBadge, { pointerEvents: "none" }]}>
              <Text style={[styles.levelText, { color: objectColor }]}>
                LVL {level}
              </Text>
            </View>

            <View
              style={[
                StyleSheet.absoluteFill,
                styles.touchRow,
                { pointerEvents: "box-none" },
              ]}
            >
              <Pressable
                style={{ flex: 1 }}
                onPressIn={() => (dirRef.current = "left")}
                onPressOut={() => (dirRef.current = null)}
              />
              <Pressable
                style={{ flex: 1 }}
                onPressIn={() => (dirRef.current = "right")}
                onPressOut={() => (dirRef.current = null)}
              />
            </View>

            <View style={[styles.hints, { pointerEvents: "none" }]}>
              <View style={styles.hintPill}>
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={COLORS.text + "55"}
                />
              </View>
              <View style={styles.hintPill}>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.text + "55"}
                />
              </View>
            </View>
          </>
        )}

        {phase === "start" && (
          <View style={styles.overlay}>
            <View
              style={[
                styles.iconRing,
                {
                  borderColor: objectColor + "44",
                  backgroundColor: objectColor + "12",
                },
              ]}
            >
              <ObjectIcon label={objectLabel} size={52} color={objectColor} />
            </View>
            <Text style={styles.overlayTitle}>
              {gameConfig?.title ?? "Dodge!"}
            </Text>
            <Text style={[styles.overlayObject, { color: objectColor }]}>
              {objectLabel}
            </Text>
            <Text style={styles.overlayHint}>
              Hold left or right side to move
            </Text>
            {gameConfig?.rules?.length > 0 && (
              <View style={styles.rulesBox}>
                {gameConfig.rules.map((rule, i) => (
                  <Text key={i} style={styles.rule}>
                    · {rule}
                  </Text>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: objectColor }]}
              onPress={startGame}
            >
              <Text style={styles.actionBtnText}>Start Game</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === "over" && (
          <View style={styles.overlay}>
            <Text style={styles.overTitle}>Game Over</Text>
            <View
              style={[styles.scoreCard, { borderColor: objectColor + "44" }]}
            >
              <Text style={[styles.bigScore, { color: objectColor }]}>
                {displayScore}
              </Text>
              <Text style={styles.bigScoreLabel}>objects dodged</Text>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: objectColor }]}
              onPress={startGame}
            >
              <Text style={styles.actionBtnText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backLink}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backLinkText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLighter,
  },
  backBtn: { padding: 4 },
  title: { flex: 1, color: COLORS.text, fontSize: 17, fontWeight: "700" },
  scoreBadge: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: COLORS.surfaceLighter,
    borderWidth: 1,
  },
  scoreText: { fontSize: 16, fontWeight: "800" },
  canvas: { flex: 1, backgroundColor: COLORS.surface },
  obstacle: {
    position: "absolute",
    width: OBS_W,
    height: OBS_H,
    alignItems: "center",
    justifyContent: "center",
  },
  obsHalo: {
    position: "absolute",
    width: OBS_W,
    height: OBS_H,
    borderRadius: OBS_W / 2,
    borderWidth: 1,
  },
  player: {
    position: "absolute",
    width: PLAYER_W,
    height: PLAYER_H,
    borderRadius: PLAYER_H / 2,
    backgroundColor: COLORS.seafoam,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  playerInner: {
    width: PLAYER_W * 0.5,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.text + "55",
  },
  hudScore: {
    position: "absolute",
    top: 20,
    right: 20,
    alignItems: "flex-end",
  },
  hudNumber: {
    color: COLORS.text + "cc",
    fontSize: 52,
    fontWeight: "800",
    lineHeight: 56,
  },
  hudLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  levelBadge: {
    position: "absolute",
    top: 20,
    left: 16,
    backgroundColor: COLORS.surfaceLighter,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  levelText: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  touchRow: { flexDirection: "row" },
  hints: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  hintPill: {
    backgroundColor: COLORS.surfaceLighter + "aa",
    borderRadius: 20,
    padding: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg + "f0",
    paddingHorizontal: 32,
    gap: 10,
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  overlayTitle: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  overlayObject: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
    letterSpacing: 0.5,
  },
  overlayHint: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
  rulesBox: { gap: 4, marginTop: 4, alignItems: "center" },
  rule: { color: COLORS.textMuted, fontSize: 13, textAlign: "center" },
  actionBtn: {
    paddingVertical: 15,
    paddingHorizontal: 52,
    borderRadius: 14,
    marginTop: 16,
  },
  actionBtnText: { color: COLORS.bg, fontSize: 16, fontWeight: "700" },
  overTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  scoreCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 48,
    alignItems: "center",
    marginVertical: 8,
    backgroundColor: COLORS.surface,
  },
  bigScore: { fontSize: 80, fontWeight: "800", lineHeight: 88 },
  bigScoreLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  backLink: { paddingVertical: 12 },
  backLinkText: { color: COLORS.textMuted, fontSize: 14, fontWeight: "600" },
});
