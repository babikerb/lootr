import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Accelerometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../theme";

const { width: W, height: H } = Dimensions.get("window");

// Safe MCI icons — anything not in this set falls back to cube-outline
const SAFE_MCI = new Set([
  "basketball","football","soccer","baseball","volleyball","tennis-ball","rugby","badminton",
  "bottle-wine","bottle-water","beer","cup","coffee","tea","glass-wine",
  "food-apple","pizza","hamburger","ice-cream","egg","carrot","cookie","cupcake","donut","bread-slice",
  "hammer","wrench","screwdriver","drill","saw","knife-kitchen",
  "car","bicycle","motorcycle","truck","bus","airplane","rocket","sail-boat",
  "dog","cat","fish","rabbit","bee","butterfly","owl","elephant","horse","duck","bird","snake","turtle",
  "flower","leaf","tree","mushroom","cactus","snowflake","feather",
  "guitar-acoustic","piano","drum","trumpet","music-note",
  "book-open-variant","key","wallet","watch","ring","pencil","pen","brick","dumbbell",
  "shoe-sneaker","hat-cowboy","umbrella","lamp","cellphone","laptop","headphones",
  "gamepad-variant","dice-6","candle","balloon","camera","cube-outline",
  "heart","run-fast","chevron-left","phone-rotate-landscape",
  "arrow-left-thin","arrow-right-thin",
]);

function safeIcon(name) {
  return SAFE_MCI.has(name) ? name : "cube-outline";
}

function ObjIcon({ name, size, color }) {
  return <MaterialCommunityIcons name={safeIcon(name)} size={size} color={color} />;
}

// Ambient deep-sea background with depth lines + bubbles
const BUBBLE_POS = [
  { left: "8%", bottom: "10%" }, { left: "22%", bottom: "30%" },
  { left: "45%", bottom: "15%" }, { left: "68%", bottom: "45%" },
  { left: "80%", bottom: "20%" }, { left: "35%", bottom: "60%" },
  { left: "90%", bottom: "70%" }, { left: "15%", bottom: "75%" },
];
function SeaBg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* depth gradient lines */}
      {[0.18, 0.36, 0.54, 0.72, 0.88].map((t, i) => (
        <View key={i} style={[sea.depthLine, { top: H * t }]} />
      ))}
      {/* ambient bubbles */}
      {BUBBLE_POS.map((p, i) => (
        <View key={i} style={[sea.bubble, { left: p.left, bottom: p.bottom, width: 5 + (i % 3) * 3, height: 5 + (i % 3) * 3, borderRadius: 8 }]} />
      ))}
    </View>
  );
}

// Shared hearts bar used by all lives-based games
function Hearts({ lives, max = 3, color }) {
  return (
    <View style={ui.heartsRow}>
      {Array.from({ length: max }).map((_, i) => (
        <MaterialCommunityIcons
          key={i}
          name={i < lives ? "heart" : "heart-outline"}
          size={20}
          color={i < lives ? color : COLORS.surfaceLighter}
        />
      ))}
    </View>
  );
}

function HudScore({ value, label }) {
  return (
    <View style={ui.hudScore}>
      <Text style={ui.hudNum}>{value}</Text>
      <Text style={ui.hudLbl}>{label}</Text>
    </View>
  );
}

// ─── DODGE / CATCH ───────────────────────────────────────────
const PW = 72, PH = 36, OW = 56, OH = 56, PY = H - 180, PS = 7;

function DodgeCatch({ gameType, config, onEnd }) {
  const color = config?.color ?? COLORS.coral;
  const baseSpeed = config?.parameters?.speed ?? 1;
  const gravity = config?.parameters?.gravity ?? 1;
  const iconName = config?.icon?.name;
  const [, tick] = useState(0);
  const dir = useRef(null);
  const g = useRef({ px: W / 2 - PW / 2, obs: [], score: 0, lives: 3, elapsed: 0, lastSpawn: 0, n: 0 });

  useEffect(() => {
    let last = null, raf;
    function loop(ts) {
      if (!last) last = ts;
      const dt = Math.min((ts - last) / 16.67, 3); last = ts;
      const s = g.current; s.elapsed += dt * 16.67;
      if (dir.current === "l") s.px = Math.max(0, s.px - PS * dt);
      if (dir.current === "r") s.px = Math.min(W - PW, s.px + PS * dt);

      // Progressive: speed and spawn rate improve over time
      const diff = 1 + (s.elapsed / 20000) * gravity;
      const spd = baseSpeed * 3.5 * diff;
      const ivl = Math.max(400, 2000 - s.elapsed / 18);

      if (s.elapsed - s.lastSpawn > ivl) {
        s.obs.push({ id: s.n++, x: 16 + Math.random() * (W - OW - 32), y: -OH });
        s.lastSpawn = s.elapsed;
      }
      let hit = false;
      s.obs = s.obs.filter(o => {
        o.y += spd * dt;
        const col = o.x < s.px + PW && o.x + OW > s.px && o.y < PY + PH && o.y + OH > PY;
        if (col) {
          if (gameType === "catch") { s.score++; return false; }
          hit = true; return true;
        }
        if (o.y > H + OH) {
          if (gameType === "catch") { s.lives--; if (s.lives <= 0) { onEnd(s.score); return false; } }
          else s.score++;
          return false;
        }
        return true;
      });
      if (hit && gameType === "dodge") { onEnd(s.score); return; }
      tick(x => x + 1);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const s = g.current;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.bg }]}>
      <SeaBg />
      {s.obs.map(o => (
        <View key={o.id} style={[gs.obs, { left: o.x, top: o.y }]}>
          <View style={[gs.halo, { backgroundColor: color + "22", borderColor: color + "55" }]} />
          <ObjIcon name={iconName} size={40} color={color} />
        </View>
      ))}
      {/* submarine player */}
      <View style={[gs.player, { left: s.px, top: PY, shadowColor: COLORS.seafoam }]}>
        <MaterialCommunityIcons name="submarine" size={28} color={COLORS.bg} />
      </View>
      <HudScore value={s.score} label={gameType === "catch" ? "caught" : "dodged"} />
      {gameType === "catch" && (
        <View style={ui.heartsWrap}><Hearts lives={s.lives} color={color} /></View>
      )}
      <View style={[StyleSheet.absoluteFill, { flexDirection: "row" }]}>
        <Pressable style={{ flex: 1 }} onPressIn={() => (dir.current = "l")} onPressOut={() => (dir.current = null)} />
        <Pressable style={{ flex: 1 }} onPressIn={() => (dir.current = "r")} onPressOut={() => (dir.current = null)} />
      </View>
      <View style={ui.dirHints} pointerEvents="none">
        <View style={ui.hintPill}><MaterialCommunityIcons name="chevron-left" size={18} color={COLORS.text + "44"} /></View>
        <View style={ui.hintPill}><MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.text + "44"} /></View>
      </View>
    </View>
  );
}

// ─── BALANCE ─────────────────────────────────────────────────
const PLAT_W = 140, PLAT_H = 12, BALL_R = 20, PLAT_Y = H * 0.62;

function Balance({ config, onEnd }) {
  const color = config?.color ?? COLORS.coral;
  const iconName = config?.icon?.name;
  const [, tick] = useState(0);
  // Simple state: platform x (touch-driven), ball x with physics
  const st = useRef({ platX: W / 2 - PLAT_W / 2, ballX: W / 2, ballVX: 0, elapsed: 0, ax: 0 });

  useEffect(() => {
    Accelerometer.setUpdateInterval(32);
    const sub = Accelerometer.addListener(({ x }) => {
      st.current.ax = -x; // negative because screen x is inverted vs tilt direction
    });
    let last = null, raf;
    function loop(ts) {
      if (!last) last = ts;
      const dt = Math.min((ts - last) / 16.67, 2.5); last = ts;
      const s = st.current;
      s.elapsed += dt * 16.67;

      // Progressive: platform gets narrower over time
      const platW = Math.max(60, PLAT_W - s.elapsed / 600);

      // Platform tracks tilt smoothly
      const tilt = Math.max(-1, Math.min(1, s.ax));
      const targetX = W / 2 - platW / 2 + tilt * (W * 0.32);
      s.platX += (targetX - s.platX) * 0.15 * dt;
      s.platX = Math.max(0, Math.min(W - platW, s.platX));

      // Ball: tilt applies force, friction dampens
      s.ballVX += tilt * 0.5 * dt;
      s.ballVX *= Math.pow(0.96, dt);
      s.ballX += s.ballVX * dt * 2;
      s.ballX = Math.max(BALL_R, Math.min(W - BALL_R, s.ballX));

      // Check ball is over platform
      const onPlat = s.ballX + BALL_R * 0.3 > s.platX && s.ballX - BALL_R * 0.3 < s.platX + platW;
      if (!onPlat) { onEnd(Math.floor(s.elapsed / 1000)); return; }

      tick(x => x + 1);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); sub.remove(); };
  }, []);

  const s = st.current;
  const platW = Math.max(60, PLAT_W - s.elapsed / 600);
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.bg }]}>
      <SeaBg />
      {/* ocean floor */}
      <View style={bl.floor} pointerEvents="none" />
      <HudScore value={Math.floor(s.elapsed / 1000)} label="seconds" />
      <View style={bl.hintRow} pointerEvents="none">
        <MaterialCommunityIcons name="phone-rotate-landscape" size={18} color={COLORS.textMuted} />
        <Text style={bl.hintTxt}>Tilt to balance</Text>
      </View>
      {/* glowing ball */}
      <View style={[bl.ball, { left: s.ballX - BALL_R, top: PLAT_Y - BALL_R * 2 - 6, borderColor: color, backgroundColor: color + "22", shadowColor: color }]}>
        <ObjIcon name={iconName} size={BALL_R * 1.4} color={color} />
      </View>
      {/* coral platform */}
      <View style={[bl.platform, { left: s.platX, top: PLAT_Y, width: platW }]} />
    </View>
  );
}

// ─── RUNNER ──────────────────────────────────────────────────
const GROUND_Y = H * 0.70;
const PLAYER_X = 90, PLAYER_SIZE = 44;
const OBS_W = 36, OBS_H = 52;

function Runner({ config, onEnd }) {
  const color = config?.color ?? COLORS.coral;
  const baseSpeed = config?.parameters?.speed ?? 1;
  const iconName = config?.icon?.name;
  const [, tick] = useState(0);
  const st = useRef({ py: GROUND_Y, vy: 0, onGround: true, obs: [], score: 0, elapsed: 0, lastSpawn: 0, n: 0 });
  const jumpRef = useRef(() => {
    const s = st.current;
    if (s.onGround) { s.vy = -14; s.onGround = false; }
  });

  useEffect(() => {
    let last = null, raf;
    function loop(ts) {
      if (!last) last = ts;
      const dt = Math.min((ts - last) / 16.67, 2.5); last = ts;
      const s = st.current; s.elapsed += dt * 16.67;

      // Player physics
      s.vy += 0.65 * dt;
      s.py += s.vy * dt;
      if (s.py >= GROUND_Y) { s.py = GROUND_Y; s.vy = 0; s.onGround = true; }

      // Progressive speed — starts slow, ramps gradually
      const spd = baseSpeed * 2.8 * (1 + s.elapsed / 28000);
      const ivl = Math.max(800, 3000 - s.elapsed / 10);

      if (s.elapsed - s.lastSpawn > ivl) {
        s.obs.push({ id: s.n++, x: W + OBS_W, y: GROUND_Y + PLAYER_SIZE - OBS_H });
        s.lastSpawn = s.elapsed;
      }

      let hit = false;
      s.obs = s.obs.filter(o => {
        o.x -= spd * dt;
        if (o.x + OBS_W < 0) { s.score++; return false; }
        // Collision with 6px shrink for forgiveness
        if (
          PLAYER_X + 6 < o.x + OBS_W - 4 &&
          PLAYER_X + PLAYER_SIZE - 6 > o.x + 4 &&
          s.py + 6 < o.y + OBS_H - 4 &&
          s.py + PLAYER_SIZE - 6 > o.y + 4
        ) hit = true;
        return true;
      });
      if (hit) { onEnd(s.score); return; }
      tick(x => x + 1);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const s = st.current;
  return (
    <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.bg }]} onPress={() => jumpRef.current()}>
      <SeaBg />
      {/* ocean floor */}
      <View style={[rn.seaFloor, { top: GROUND_Y + PLAYER_SIZE }]} pointerEvents="none" />
      <View style={[rn.floorTint, { top: GROUND_Y + PLAYER_SIZE }]} pointerEvents="none" />
      {/* seaweed decorations on floor */}
      {[0.1, 0.3, 0.55, 0.75, 0.92].map((x, i) => (
        <View key={i} style={[rn.seaweed, { left: W * x, top: GROUND_Y + PLAYER_SIZE + 2, height: 16 + (i % 3) * 8 }]} pointerEvents="none" />
      ))}

      {/* Player — diver */}
      <View style={[rn.player, { left: PLAYER_X, top: s.py }]} pointerEvents="none">
        <MaterialCommunityIcons name="diving-scuba-mask" size={36} color={COLORS.seafoam} />
      </View>

      {/* Obstacles */}
      {s.obs.map(o => (
        <View key={o.id} style={[rn.obs, { left: o.x, top: o.y, borderColor: color + "88", backgroundColor: color + "22" }]} pointerEvents="none">
          <ObjIcon name={iconName} size={26} color={color} />
        </View>
      ))}

      <HudScore value={s.score} label="cleared" />
      <View style={rn.hintWrap} pointerEvents="none">
        <Text style={rn.hintTxt}>Tap to dive over</Text>
      </View>
    </Pressable>
  );
}

// ─── SWIPE ───────────────────────────────────────────────────
function SwipeCard({ id, x, y, color, iconName, onSwipedRef }) {
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) > 25) onSwipedRef.current(id);
      },
    })
  ).current;
  return (
    <View
      {...pan.panHandlers}
      style={[sw.card, { left: x, top: y, borderColor: color + "99", backgroundColor: color + "1a" }]}
    >
      <ObjIcon name={iconName} size={38} color={color} />
      <View style={sw.arrowRow}>
        <MaterialCommunityIcons name="arrow-left-thin" size={14} color={COLORS.textMuted} />
        <MaterialCommunityIcons name="arrow-right-thin" size={14} color={COLORS.textMuted} />
      </View>
    </View>
  );
}

function Swipe({ config, onEnd }) {
  const color = config?.color ?? COLORS.coral;
  const baseSpeed = config?.parameters?.speed ?? 1;
  const iconName = config?.icon?.name;
  const [, tick] = useState(0);
  const onSwipedRef = useRef(null);
  const st = useRef({ cards: [], score: 0, lives: 3, elapsed: 0, lastSpawn: 0, n: 0, dead: false });

  onSwipedRef.current = (id) => {
    const s = st.current;
    const idx = s.cards.findIndex(c => c.id === id);
    if (idx !== -1) { s.cards.splice(idx, 1); s.score++; }
  };

  useEffect(() => {
    let last = null, raf;
    function loop(ts) {
      if (!last) last = ts;
      const dt = Math.min((ts - last) / 16.67, 2.5); last = ts;
      const s = st.current;
      if (s.dead) return;
      s.elapsed += dt * 16.67;

      // Progressive: faster fall + faster spawn
      const fallSpd = baseSpeed * 1.8 * (1 + s.elapsed / 25000);
      const ivl = Math.max(900, 2800 - s.elapsed / 15);

      if (s.elapsed - s.lastSpawn > ivl) {
        s.cards.push({ id: s.n++, x: 40 + Math.random() * (W - 160), y: -90 });
        s.lastSpawn = s.elapsed;
      }

      const toRemove = [];
      for (const c of s.cards) {
        c.y += fallSpd * dt;
        if (c.y > H - 90) {
          toRemove.push(c.id);
          s.lives--;
          if (s.lives <= 0) { s.dead = true; onEnd(s.score); return; }
        }
      }
      if (toRemove.length) s.cards = s.cards.filter(c => !toRemove.includes(c.id));

      tick(x => x + 1);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const s = st.current;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.bg }]} pointerEvents="box-none">
      <SeaBg />
      <View style={ui.heartsWrap}><Hearts lives={s.lives} color={color} /></View>
      <HudScore value={s.score} label="swiped" />
      {s.cards.map(c => (
        <SwipeCard key={c.id} id={c.id} x={c.x} y={c.y} color={color} iconName={iconName} onSwipedRef={onSwipedRef} />
      ))}
      <View style={sw.hintWrap} pointerEvents="none">
        <Text style={sw.hintTxt}>Swipe away before it sinks</Text>
      </View>
    </View>
  );
}

// ─── TIMING ──────────────────────────────────────────────────
const TRACK_W = W - 80, ZONE_W = 90, ZONE_X = TRACK_W / 2 - ZONE_W / 2, NR = 22;

function Timing({ config, onEnd }) {
  const color = config?.color ?? COLORS.coral;
  const iconName = config?.icon?.name;
  const [, tick] = useState(0);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState(null);
  const flashTimer = useRef(null);
  const st = useRef({ nx: 0, dir: 1, spd: 2.5, score: 0, combo: 0, lives: 3, elapsed: 0 });
  const tapRef = useRef(null);

  tapRef.current = () => {
    const s = st.current;
    const inZone = s.nx >= ZONE_X && s.nx <= ZONE_X + ZONE_W - NR * 2;
    if (flashTimer.current) clearTimeout(flashTimer.current);
    if (inZone) {
      s.score++; s.combo++;
      // Progressive: zone narrows + speed increases
      s.spd = Math.min(11, s.spd + 0.4);
      setCombo(s.combo); setFlash("hit");
    } else {
      s.combo = 0; s.lives--;
      setCombo(0); setFlash("miss");
      if (s.lives <= 0) { onEnd(s.score); return; }
    }
    flashTimer.current = setTimeout(() => setFlash(null), 350);
  };

  useEffect(() => {
    let last = null, raf;
    function loop(ts) {
      if (!last) last = ts;
      const dt = Math.min((ts - last) / 16.67, 2.5); last = ts;
      const s = st.current; s.elapsed += dt * 16.67;
      s.nx += s.dir * s.spd * dt;
      if (s.nx >= TRACK_W - NR * 2) { s.nx = TRACK_W - NR * 2; s.dir = -1; }
      if (s.nx <= 0) { s.nx = 0; s.dir = 1; }
      tick(x => x + 1);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); if (flashTimer.current) clearTimeout(flashTimer.current); };
  }, []);

  const s = st.current;
  // Zone width shrinks progressively
  const zoneW = Math.max(40, ZONE_W - s.score * 3);
  const zoneX = TRACK_W / 2 - zoneW / 2;
  const needleColor = flash === "hit" ? COLORS.seafoam : flash === "miss" ? COLORS.coral : color;

  return (
    <Pressable style={[StyleSheet.absoluteFill, tm.wrap, { backgroundColor: COLORS.bg }]} onPress={() => tapRef.current()}>
      <SeaBg />
      <View style={ui.heartsWrap}><Hearts lives={s.lives} color={color} /></View>
      <HudScore value={s.score} label="hits" />
      {combo > 1 && (
        <View style={tm.comboBadge} pointerEvents="none">
          <Text style={[tm.comboTxt, { color }]}>×{combo} COMBO</Text>
        </View>
      )}
      {flash && (
        <Text style={[tm.flashTxt, { color: flash === "hit" ? COLORS.seafoam : COLORS.coral }]} pointerEvents="none">
          {flash === "hit" ? "PERFECT!" : "MISS!"}
        </Text>
      )}
      <View style={tm.track} pointerEvents="none">
        <View style={[tm.zone, { left: zoneX, width: zoneW }]} />
        <View style={[tm.needle, { left: s.nx, backgroundColor: needleColor, shadowColor: needleColor }]}>
          <ObjIcon name={iconName} size={20} color={COLORS.bg} />
        </View>
      </View>
      <Text style={tm.hintTxt} pointerEvents="none">Tap when the sonar pings the zone</Text>
    </Pressable>
  );
}

// ─── ROUTER ──────────────────────────────────────────────────
function GameCanvas({ gameType, config, onEnd }) {
  if (gameType === "dodge" || gameType === "catch")
    return <DodgeCatch key={gameType} gameType={gameType} config={config} onEnd={onEnd} />;
  if (gameType === "balance") return <Balance config={config} onEnd={onEnd} />;
  if (gameType === "runner") return <Runner config={config} onEnd={onEnd} />;
  if (gameType === "swipe") return <Swipe config={config} onEnd={onEnd} />;
  if (gameType === "timing") return <Timing config={config} onEnd={onEnd} />;
  return <DodgeCatch gameType="dodge" config={config} onEnd={onEnd} />;
}

// ─── CONSTANTS ───────────────────────────────────────────────
const GAME_HINTS = {
  dodge: "Hold left or right to move your paddle",
  catch: "Hold left or right to move your paddle",
  balance: "Tilt your phone to keep the object balanced",
  runner: "Tap anywhere to jump over obstacles",
  swipe: "Swipe falling objects off the screen",
  timing: "Tap when the object lands in the green zone",
};
const GAME_LABELS = { dodge:"Dodge", catch:"Catch", balance:"Balance", runner:"Runner", swipe:"Swipe", timing:"Timing" };
const SCORE_LABELS = { dodge:"dodged", catch:"caught", balance:"seconds survived", runner:"obstacles cleared", swipe:"objects swiped", timing:"perfect hits" };

// ─── SCREEN ──────────────────────────────────────────────────
export default function PlayScreen({ route, navigation }) {
  const { gameConfig, objectLabel } = route.params ?? {};
  const insets = useSafeAreaInsets();
  const color = gameConfig?.color ?? COLORS.coral;
  const primaryType = gameConfig?.gameType ?? "dodge";
  const alternates = gameConfig?.alternates ?? [];
  const threshold = 0.70;

  const allOptions = [
    { gameType: primaryType, confidence: gameConfig?.confidence ?? 1 },
    ...alternates
      .filter(a => a.confidence >= threshold && a.gameType !== primaryType)
      .sort((a, b) => b.confidence - a.confidence),
  ];

  const hasChoice = allOptions.length > 1;
  const [phase, setPhase] = useState(hasChoice ? "picking" : "start");
  const [gameType, setGameType] = useState(hasChoice ? null : primaryType);
  const [finalScore, setFinalScore] = useState(0);
  const [playKey, setPlayKey] = useState(0);

  function pickType(type) { setGameType(type); setPhase("start"); }
  function startGame() { setPlayKey(k => k + 1); setPhase("playing"); }
  function handleEnd(score) { setFinalScore(score); setPhase("over"); }
  function replay() { setPlayKey(k => k + 1); setPhase("playing"); }

  return (
    <View style={[sh.container, { paddingTop: insets.top }]}>
      <View style={sh.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={sh.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={sh.title} numberOfLines={1}>
          {phase === "picking" ? "Choose Your Game"
            : phase === "playing" ? (GAME_LABELS[gameType] ?? "")
            : objectLabel ?? "Play"}
        </Text>
      </View>

      <View style={sh.canvas}>
        {phase === "playing" && gameType && (
          <GameCanvas key={playKey} gameType={gameType} config={gameConfig} onEnd={handleEnd} />
        )}

        {/* PICK */}
        {phase === "picking" && (
          <View style={sh.overlay}>
            <View style={[sh.iconRing, { borderColor: color + "44", backgroundColor: color + "12" }]}>
              <ObjIcon name={gameConfig?.icon?.name} size={52} color={color} />
            </View>
            <Text style={sh.overlayTitle}>{objectLabel}</Text>
            <Text style={sh.overlayHint}>Fits multiple game types — you pick</Text>
            <View style={sh.pickGrid}>
              {allOptions.map(opt => (
                <TouchableOpacity
                  key={opt.gameType}
                  style={[sh.pickBtn, { borderColor: color }]}
                  onPress={() => pickType(opt.gameType)}
                >
                  <Text style={[sh.pickBtnTitle, { color }]}>{GAME_LABELS[opt.gameType]}</Text>
                  <Text style={sh.pickBtnSub}>{Math.round(opt.confidence * 100)}% match</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* START */}
        {phase === "start" && (
          <View style={sh.overlay}>
            <View style={[sh.iconRing, { borderColor: color + "44", backgroundColor: color + "12" }]}>
              <ObjIcon name={gameConfig?.icon?.name} size={52} color={color} />
            </View>
            <Text style={sh.overlayTitle}>{objectLabel}</Text>
            <Text style={[sh.overlayGameType, { color }]}>{GAME_LABELS[gameType]} Game</Text>
            <Text style={sh.overlayHint}>{GAME_HINTS[gameType]}</Text>
            <TouchableOpacity style={[sh.actionBtn, { backgroundColor: color }]} onPress={startGame}>
              <Text style={sh.actionBtnTxt}>Play Game</Text>
            </TouchableOpacity>
            {hasChoice && (
              <TouchableOpacity style={sh.switchBtn} onPress={() => setPhase("picking")}>
                <Text style={sh.switchBtnTxt}>Switch Game Type</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* OVER */}
        {phase === "over" && (
          <View style={sh.overlay}>
            <Text style={sh.overTitle}>Game Over</Text>
            <View style={[sh.scoreCard, { borderColor: color + "44" }]}>
              <Text style={[sh.bigScore, { color }]}>{finalScore}</Text>
              <Text style={sh.bigScoreLbl}>{SCORE_LABELS[gameType] ?? "score"}</Text>
            </View>
            <TouchableOpacity style={[sh.actionBtn, { backgroundColor: color }]} onPress={replay}>
              <Text style={sh.actionBtnTxt}>Play Again</Text>
            </TouchableOpacity>
            {hasChoice && (
              <TouchableOpacity style={sh.switchBtn} onPress={() => setPhase("picking")}>
                <Text style={sh.switchBtnTxt}>Switch Game Type</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={sh.backLink} onPress={() => navigation.goBack()}>
              <Text style={sh.backLinkTxt}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────
const ui = StyleSheet.create({
  heartsWrap: {
    position: "absolute", top: 20, left: 16,
    backgroundColor: COLORS.surfaceLighter,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  heartsRow: { flexDirection: "row", gap: 6 },
  hudScore: { position: "absolute", top: 20, right: 20, alignItems: "flex-end" },
  hudNum: { color: COLORS.text + "cc", fontSize: 52, fontWeight: "800", lineHeight: 56 },
  hudLbl: { color: COLORS.textMuted, fontSize: 11, fontWeight: "600", letterSpacing: 1.2, textTransform: "uppercase" },
  dirHints: {
    position: "absolute", bottom: 60, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20,
  },
  hintPill: { backgroundColor: COLORS.surfaceLighter + "aa", borderRadius: 20, padding: 10 },
});

const sh = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, gap: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.surfaceLighter,
  },
  backBtn: { padding: 4 },
  title: { flex: 1, color: COLORS.text, fontSize: 17, fontWeight: "700" },
  canvas: { flex: 1, backgroundColor: COLORS.surface },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.bg + "f2", paddingHorizontal: 32, gap: 10,
  },
  iconRing: {
    width: 96, height: 96, borderRadius: 48, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  overlayTitle: { color: COLORS.text, fontSize: 28, fontWeight: "800", textAlign: "center" },
  overlayGameType: { fontSize: 15, fontWeight: "700", letterSpacing: 0.5 },
  overlayHint: { color: COLORS.textMuted, fontSize: 13, textAlign: "center", marginTop: 2 },
  pickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 20, justifyContent: "center" },
  pickBtn: {
    borderWidth: 2, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 20,
    alignItems: "center", minWidth: 110,
  },
  pickBtnTitle: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  pickBtnSub: { color: COLORS.textMuted, fontSize: 12 },
  actionBtn: { paddingVertical: 15, paddingHorizontal: 52, borderRadius: 14, marginTop: 16 },
  actionBtnTxt: { color: COLORS.bg, fontSize: 16, fontWeight: "700" },
  switchBtn: { paddingVertical: 10 },
  switchBtnTxt: { color: COLORS.textMuted, fontSize: 13, fontWeight: "600" },
  overTitle: { color: COLORS.text, fontSize: 22, fontWeight: "700" },
  scoreCard: {
    borderWidth: 1, borderRadius: 20, paddingVertical: 24, paddingHorizontal: 48,
    alignItems: "center", marginVertical: 8, backgroundColor: COLORS.surface,
  },
  bigScore: { fontSize: 80, fontWeight: "800", lineHeight: 88 },
  bigScoreLbl: { color: COLORS.textMuted, fontSize: 13, fontWeight: "600", marginTop: 2 },
  backLink: { paddingVertical: 12 },
  backLinkTxt: { color: COLORS.textMuted, fontSize: 14, fontWeight: "600" },
});

const sea = StyleSheet.create({
  depthLine: {
    position: "absolute", left: 0, right: 0, height: 1,
    backgroundColor: COLORS.cyan + "18",
  },
  bubble: {
    position: "absolute",
    backgroundColor: COLORS.cyan + "22",
    borderWidth: 1,
    borderColor: COLORS.seafoam + "44",
  },
});

const gs = StyleSheet.create({
  obs: { position: "absolute", width: OW, height: OH, alignItems: "center", justifyContent: "center" },
  halo: { position: "absolute", width: OW, height: OH, borderRadius: OW / 2, borderWidth: 1 },
  player: {
    position: "absolute", width: PW, height: PH, borderRadius: PH / 2,
    backgroundColor: COLORS.cyan, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 14, elevation: 12,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: COLORS.seafoam + "88",
  },
  playerInner: { width: PW * 0.5, height: 3, borderRadius: 2, backgroundColor: COLORS.text + "55" },
});

const bl = StyleSheet.create({
  floor: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: COLORS.kelp + "44",
  },
  ball: {
    position: "absolute", width: BALL_R * 2, height: BALL_R * 2, borderRadius: BALL_R,
    borderWidth: 2, alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 12, elevation: 10,
  },
  platform: {
    position: "absolute", height: PLAT_H, borderRadius: PLAT_H / 2,
    backgroundColor: COLORS.cyan,
    borderWidth: 1, borderColor: COLORS.seafoam + "88",
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 8,
  },
  hintRow: {
    position: "absolute", bottom: 80, left: 0, right: 0,
    flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8,
  },
  hintTxt: { color: COLORS.textMuted, fontSize: 13 },
});

const rn = StyleSheet.create({
  seaFloor: {
    position: "absolute", left: 0, right: 0, height: 2,
    backgroundColor: COLORS.cyan + "66",
  },
  floorTint: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: COLORS.kelp + "33",
  },
  seaweed: {
    position: "absolute", width: 4, borderRadius: 2,
    backgroundColor: COLORS.kelp,
  },
  player: {
    position: "absolute", width: PLAYER_SIZE, height: PLAYER_SIZE,
    alignItems: "center", justifyContent: "center",
  },
  obs: {
    position: "absolute", width: OBS_W, height: OBS_H,
    borderWidth: 1.5, borderRadius: 8, alignItems: "center", justifyContent: "center",
  },
  hintWrap: { position: "absolute", bottom: 60, left: 0, right: 0, alignItems: "center" },
  hintTxt: { color: COLORS.textMuted, fontSize: 13 },
});

const sw = StyleSheet.create({
  card: {
    position: "absolute", width: 80, height: 90, borderWidth: 1.5,
    borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 6,
  },
  arrowRow: { flexDirection: "row", gap: 8 },
  hintWrap: { position: "absolute", bottom: 60, left: 0, right: 0, alignItems: "center" },
  hintTxt: { color: COLORS.textMuted, fontSize: 13 },
});

const tm = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  comboBadge: { position: "absolute", top: 80, left: 0, right: 0, alignItems: "center" },
  comboTxt: { fontSize: 14, fontWeight: "800", letterSpacing: 1.5 },
  flashTxt: { fontSize: 32, fontWeight: "900", letterSpacing: 2, marginBottom: 20 },
  track: {
    width: TRACK_W, height: 60, backgroundColor: COLORS.surfaceLighter,
    borderRadius: 30, overflow: "hidden", position: "relative", justifyContent: "center",
  },
  zone: {
    position: "absolute", height: 60,
    backgroundColor: COLORS.seafoam + "28",
    borderLeftWidth: 2, borderRightWidth: 2, borderColor: COLORS.seafoam + "88",
  },
  needle: {
    position: "absolute", width: NR * 2, height: NR * 2, borderRadius: NR,
    top: 8, alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 8,
  },
  hintTxt: { color: COLORS.textMuted, fontSize: 13, marginTop: 28 },
});
