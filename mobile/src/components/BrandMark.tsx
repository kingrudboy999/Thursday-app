import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

/* ------------------------------------------------------------------ brand */

const FOREST_TOP = "#2a6a51";
const FOREST_BOTTOM = "#10301f";
const CREAM = "#faf6ec";
const CLAY = "#d97a4d";

/* ------------------------------------------------------------------- mark */

/**
 * The Thursday mark: a bar and a stem (a table), a clay dot above it (the
 * person sitting down to it).
 *
 * Geometry is expressed in a 64-unit box and every part can be scaled and
 * faded independently, because the splash animates the pieces in separately.
 */
export function BrandMark({ size = 32 }: { size?: number }) {
  const radius = Math.round(size * 0.28);
  return (
    <View style={{ width: size, height: size, borderRadius: radius, overflow: "hidden" }}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Defs>
          <LinearGradient id="thursdayGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={FOREST_TOP} />
            <Stop offset="1" stopColor={FOREST_BOTTOM} />
          </LinearGradient>
        </Defs>
        <Rect width="64" height="64" rx="18" fill="url(#thursdayGrad)" />
        <Path
          d="M18 24h28M32 24v22"
          fill="none"
          stroke={CREAM}
          strokeWidth={5.4}
          strokeLinecap="square"
        />
        <Circle cx="32" cy="15.4" r="3.7" fill={CLAY} />
      </Svg>
    </View>
  );
}

/* ----------------------------------------------------------------- splash */

/**
 * Width of the mark, in dp. The native splash is configured with
 * imageWidth = 338 in app.json; splash-icon.png is 768px wide with a 300px
 * mark inside it, so the mark renders at 338 * (300/768) = 132dp. These two
 * numbers must agree — see MARK_WIDTH below.
 */
const MARK_WIDTH = 132;

/** Mark geometry, in multiples of S where the mark is 2S wide. */
const S = MARK_WIDTH / 2;
const M = {
  barH: 0.30 * S,
  barTop: 2 * 0.235 * S + 0.16 * S,
  stemW: 0.30 * S,
  stemH: 1.55 * S,
  get stemTop() {
    return this.barTop + this.barH;
  },
  dotR: 0.235 * S,
};

const MIN_MS = 1400; // never flash past faster than the eye can take it in
const MAX_MS = 6000; // but never hold the door shut longer than this

/**
 * Animated cold-start screen.
 *
 * Choreography, ~1.4s total:
 *   0ms    backdrop fades up from black
 *   120ms  table bar draws outward from its centre
 *   430ms  stem drops in under the bar
 *   620ms  the clay dot settles above it, with a soft halo
 *   900ms  wordmark and tagline rise and fade in
 *   then   the screen lifts away once the app is actually ready
 *
 * `ready` is the app's own readiness flag. The splash holds until it is true
 * (bounded by MAX_MS) so the animation never finishes on top of a blank shell,
 * and it always shows for at least MIN_MS so it can't flicker.
 */
export function BrandSplashOverlay({
  ready = true,
  onDone,
}: {
  ready?: boolean;
  onDone: () => void;
}) {
  // Fixed, not width-relative: the native splash is a static image with a
  // static imageWidth, so the JS mark has to land on the same pixel size on
  // every device or you see it jump as the native splash disappears.
  const markSize = MARK_WIDTH;

  const [elapsed, setElapsed] = useState(0);

  const backdrop = useRef(new Animated.Value(0)).current;
  const barScale = useRef(new Animated.Value(0)).current;
  const stemScale = useRef(new Animated.Value(0)).current;
  const stemShift = useRef(new Animated.Value(-14)).current;
  const dotScale = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(0.7)).current;
  const haloOpacity = useRef(new Animated.Value(0)).current;
  const textRise = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(0)).current;
  const leaving = useRef(false);

  const finish = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    Animated.parallel([
      Animated.timing(exit, {
        toValue: 1,
        duration: 420,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => onDone());
  }, [exit, onDone]);

  /* ---- the entrance ---- */
  useEffect(() => {
    const startedAt = Date.now();
    const tick = setInterval(() => setElapsed(Date.now() - startedAt), 60);
    const stop = setTimeout(() => clearInterval(tick), MAX_MS);

    const steps = [
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(120),
        Animated.timing(barScale, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(430),
        Animated.parallel([
          Animated.timing(stemScale, {
            toValue: 1,
            duration: 360,
            easing: Easing.out(Easing.back(1.4)),
            useNativeDriver: true,
          }),
          Animated.timing(stemShift, {
            toValue: 0,
            duration: 360,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(620),
        Animated.parallel([
          Animated.timing(dotScale, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.back(2.1)),
            useNativeDriver: true,
          }),
          Animated.timing(haloOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(haloScale, {
            toValue: 2.4,
            duration: 900,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(900),
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 420,
            useNativeDriver: true,
          }),
          Animated.timing(textRise, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ];

    Animated.parallel(steps).start();

    return () => {
      clearInterval(tick);
      clearTimeout(stop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- leaving: only once the app is ready AND the floor has passed ---- */
  useEffect(() => {
    if (ready && elapsed >= MIN_MS) finish();
  }, [ready, elapsed, finish]);

  useEffect(() => {
    const hardStop = setTimeout(finish, MAX_MS);
    return () => clearTimeout(hardStop);
  }, [finish]);

  const stemTop = markSize * 0.375;
  const barTop = markSize * 0.375;
  const dotTop = markSize * (0.24 - 0.058);

  return (
    <Animated.View
      pointerEvents="auto"
      style={[
        styles.screen,
        {
          opacity: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: [
            { scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
          ],
        },
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: backdrop }]}>
        <View style={styles.backdrop} />
      </Animated.View>

      <Pressable style={styles.center} onPress={finish} accessibilityRole="progressbar">
        {/* Same proportions as assets/splash-icon.png, derived from the same
            2S-wide-by-2.48S-tall mark so the two screens are pixel-identical. */}
        <View style={{ width: markSize, height: markSize * 1.24 }}>
          {/* halo behind the dot */}
          <Animated.View
            style={{
              position: "absolute",
              top: M.dotR - 10,
              left: markSize / 2 - 10,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: CLAY,
              opacity: haloOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.28],
              }),
              transform: [{ scale: haloScale }],
            }}
          />

          {/* table bar, drawn from its centre outward */}
          <Animated.View
            style={{
              position: "absolute",
              top: M.barTop,
              left: 0,
              width: markSize,
              height: M.barH,
              backgroundColor: CREAM,
              transform: [{ scaleX: barScale }],
            }}
          />

          {/* stem, dropping in under the bar */}
          <Animated.View
            style={{
              position: "absolute",
              top: M.stemTop,
              left: markSize / 2 - M.stemW / 2,
              width: M.stemW,
              height: M.stemH,
              backgroundColor: CREAM,
              opacity: stemScale,
              transform: [
                { translateY: stemShift },
                {
                  scaleY: stemScale.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, 1],
                  }),
                },
              ],
            }}
          />

          {/* the person */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: markSize / 2 - M.dotR,
              width: M.dotR * 2,
              height: M.dotR * 2,
              borderRadius: M.dotR,
              backgroundColor: CLAY,
              transform: [{ scale: dotScale }],
            }}
          />
        </View>

        <Animated.View
          style={{
            alignItems: "center",
            opacity: textOpacity,
            transform: [
              {
                translateY: textRise.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          }}
        >
          <Text style={styles.wordmark}>Thursday</Text>
          <Text style={styles.tagline}>A QUIETER PLACE TO SHARE</Text>
        </Animated.View>
      </Pressable>

      <Animated.Text style={[styles.footer, { opacity: textOpacity }]}>
        Made for your circle
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: "#0c1712",
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "#0c1712",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 24,
  },
  wordmark: {
    marginTop: 26,
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.9,
    color: "#f4f6f0",
  },
  tagline: {
    marginTop: 9,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2.4,
    color: "#8fb3a0",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    fontSize: 11,
    color: "rgba(255,255,255,0.30)",
  },
});
