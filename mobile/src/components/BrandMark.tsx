import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

export function BrandMark({ size = 32 }: { size?: number }) {
  const radius = Math.round(size * 0.28);
  return (
    <View style={{ width: size, height: size, borderRadius: radius, overflow: "hidden" }}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Defs>
          <LinearGradient id="thursdayGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2a6a51" />
            <Stop offset="1" stopColor="#153b2b" />
          </LinearGradient>
        </Defs>
        <Rect width="64" height="64" rx="18" fill="url(#thursdayGrad)" />
        <Path
          d="M19 23.5h26M32 23.5v23"
          fill="none"
          stroke="#f8f3e7"
          strokeWidth={5.2}
          strokeLinecap="square"
        />
        <Circle cx="32" cy="16" r="3.6" fill="#d97a4d" />
      </Svg>
    </View>
  );
}

export function BrandSplashOverlay({ onDone }: { onDone: () => void }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.86)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 14,
      stiffness: 130,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start(() => onDone());
    }, 950);

    return () => clearTimeout(timer);
  }, [onDone, opacity, scale]);

  return (
    <Animated.View style={[styles.splash, { opacity }]}>
      <Pressable style={styles.splashInner} onPress={onDone}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <BrandMark size={78} />
        </Animated.View>
        <Text style={styles.wordmark}>Thursday</Text>
        <Text style={styles.tagline}>A QUIETER PLACE TO SHARE</Text>
        <Text style={styles.footer}>Made for your circle</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: "#0c1712",
  },
  splashInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    marginTop: 22,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.8,
    color: "#f4f6f0",
  },
  tagline: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2.2,
    color: "#9ab5a5",
  },
  footer: {
    position: "absolute",
    bottom: 38,
    fontSize: 11,
    color: "rgba(255,255,255,0.34)",
  },
});
