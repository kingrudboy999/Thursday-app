import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ThemePalette } from "../theme";

export function ProfileScreen({
  theme,
  person,
  isMe,
  posts,
  followingIds,
  onToggleFollow,
  onOpenSettings,
}: {
  theme: ThemePalette;
  person: any;
  isMe: boolean;
  posts: any[];
  followingIds: string[];
  onToggleFollow: (id: string) => void;
  onOpenSettings: () => void;
}) {
  const [tab, setTab] = useState<"posts" | "saved">("posts");
  const authoredPosts = posts.filter((p) => p.authorId === person.id);
  const savedPosts = posts.filter((p) => p.saved);
  const shown = tab === "saved" && isMe ? savedPosts : authoredPosts;
  const isFollowing = followingIds.includes(person.id);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.canvas }}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <Image source={{ uri: person.cover }} style={styles.cover} />
      <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.topRow}>
          <Image source={{ uri: person.avatar }} style={[styles.avatar, { borderColor: theme.surface }]} />
          {isMe ? (
            <Pressable
              onPress={onOpenSettings}
              style={[styles.btn, { backgroundColor: theme.surfaceMuted, borderColor: theme.line }]}
            >
              <Text style={{ fontSize: 12.5, fontWeight: "600", color: theme.ink }}>Settings</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => onToggleFollow(person.id)}
              style={[
                styles.btn,
                {
                  backgroundColor: isFollowing ? theme.surfaceMuted : theme.forest,
                  borderColor: isFollowing ? theme.line : theme.forest,
                },
              ]}
            >
              <Text style={{ fontSize: 12.5, fontWeight: "600", color: isFollowing ? theme.ink : "#FFFFFF" }}>
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </Pressable>
          )}
        </View>

        <Text style={{ fontSize: 20, fontWeight: "700", color: theme.ink }}>{person.name}</Text>
        <Text style={{ fontSize: 13, color: theme.muted }}>
          @{person.handle} {person.location ? `· ${person.location}` : ""}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: theme.inkSoft, marginTop: 8 }}>
          {person.bio}
        </Text>

        <View style={styles.statsRow}>
          <Text style={{ fontSize: 13, color: theme.muted }}>
            <Text style={{ fontWeight: "700", color: theme.ink }}>{person.followers.toLocaleString()}</Text> followers
          </Text>
          <Text style={{ fontSize: 13, color: theme.muted }}>
            <Text style={{ fontWeight: "700", color: theme.ink }}>{person.following}</Text> following
          </Text>
        </View>

        {isMe ? (
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            {(["posts", "saved"] as const).map((k) => {
              const active = tab === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => setTab(k)}
                  style={[
                    styles.tabChip,
                    { backgroundColor: active ? theme.forest : theme.surfaceMuted, borderColor: theme.line },
                  ]}
                >
                  <Text style={{ fontSize: 12.5, fontWeight: "600", color: active ? "#FFFFFF" : theme.muted }}>
                    {k === "posts" ? `Posts (${authoredPosts.length})` : `Saved (${savedPosts.length})`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      <View style={{ padding: 12, gap: 10 }}>
        {shown.map((p) => (
          <View key={p.id} style={[styles.postItem, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            {p.pinned ? (
              <Text style={{ fontSize: 11, fontWeight: "700", color: theme.forest, marginBottom: 4 }}>
                PINNED TO PROFILE
              </Text>
            ) : null}
            <Text style={{ fontSize: 14, lineHeight: 20, color: theme.ink }}>{p.text}</Text>
            {p.images?.[0] ? <Image source={{ uri: p.images[0] }} style={styles.postImg} /> : null}
            <Text style={{ fontSize: 11.5, color: theme.faint, marginTop: 6 }}>
              {p.time} · {p.likes} likes
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: "100%",
    height: 150,
  },
  headerCard: {
    marginHorizontal: 12,
    marginTop: -28,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: -38,
    marginBottom: 10,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: 18,
    marginTop: 12,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
  },
  postItem: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  postImg: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginTop: 10,
  },
});
