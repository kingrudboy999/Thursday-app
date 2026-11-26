import { useVideoPlayer, VideoView } from "expo-video";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ArrowLeftIcon, BookmarkIcon, HeartIcon } from "../components/Icons";
import { formatCompact } from "../data";

function ReelSlide({
  reel,
  author,
  active,
  muted,
  onToggleMute,
  onToggleLike,
  onToggleSave,
}: {
  reel: any;
  author: any;
  active: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onToggleLike: () => void;
  onToggleSave: () => void;
}) {
  const { height, width } = Dimensions.get("window");
  const player = useVideoPlayer(reel.video, (p) => {
    p.loop = true;
    p.muted = muted;
    if (active) p.play();
  });

  return (
    <View style={{ width, height, backgroundColor: "#06080B", justifyContent: "center" }}>
      <Image source={{ uri: reel.poster }} style={StyleSheet.absoluteFillObject} blurRadius={26} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.38)" }]} />
      <Pressable style={{ flex: 1 }} onPress={onToggleMute}>
        <VideoView
          style={{ flex: 1 }}
          player={player}
          contentFit="contain"
          nativeControls={false}
        />
      </Pressable>

      {/* Right vertical action rail */}
      <View style={styles.rail}>
        <Pressable onPress={onToggleLike} style={styles.railBtn}>
          <HeartIcon size={24} color={reel.liked ? "#F05A48" : "#FFFFFF"} filled={Boolean(reel.liked)} />
          <Text style={styles.railLabel}>{formatCompact(reel.likes)}</Text>
        </Pressable>
        <Pressable onPress={onToggleSave} style={styles.railBtn}>
          <BookmarkIcon size={23} color={reel.saved ? "#6FC3A2" : "#FFFFFF"} filled={Boolean(reel.saved)} />
          <Text style={styles.railLabel}>{reel.saved ? "Saved" : "Save"}</Text>
        </Pressable>
      </View>

      {/* Bottom author & caption metadata */}
      <View style={styles.captionOverlay}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Image source={{ uri: author?.avatar }} style={styles.avatar} />
          <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>{author?.name}</Text>
          {reel.location ? (
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>· {reel.location}</Text>
          ) : null}
        </View>
        <Text style={{ color: "#F3F5F7", fontSize: 14, lineHeight: 20 }}>{reel.caption}</Text>
        <Text style={{ color: "rgba(255,255,255,0.68)", fontSize: 12, marginTop: 6 }}>
          ♫ {reel.audio} · {muted ? "Tap to unmute" : "Sound on"}
        </Text>
      </View>
    </View>
  );
}

export function ReelsScreen({
  reels,
  people,
  onToggleLike,
  onToggleSave,
  onExit,
}: {
  reels: any[];
  people: any[];
  onToggleLike: (id: string) => void;
  onToggleSave: (id: string) => void;
  onExit: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const { height } = Dimensions.get("window");

  return (
    <View style={{ flex: 1, backgroundColor: "#06080B" }}>
      <FlatList
        data={reels}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / height);
          setActiveIndex(idx);
        }}
        renderItem={({ item, index }) => (
          <ReelSlide
            reel={item}
            author={people.find((p) => p.id === item.authorId)}
            active={index === activeIndex}
            muted={muted}
            onToggleMute={() => setMuted((m) => !m)}
            onToggleLike={() => onToggleLike(item.id)}
            onToggleSave={() => onToggleSave(item.id)}
          />
        )}
      />

      <Pressable onPress={onExit} style={styles.backBtn}>
        <ArrowLeftIcon size={20} color="#FFFFFF" />
        <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>Reels</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    position: "absolute",
    top: 52,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  rail: {
    position: "absolute",
    right: 14,
    bottom: 120,
    alignItems: "center",
    gap: 20,
  },
  railBtn: {
    alignItems: "center",
    gap: 4,
  },
  railLabel: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "600",
  },
  captionOverlay: {
    position: "absolute",
    left: 16,
    right: 76,
    bottom: 92,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
});
