import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { PHOTOS } from "../data";
import { ThemePalette } from "../theme";

const TOPICS = ["All", "Slow mornings", "Made by hand", "Trail notes", "Crate culture"];

const DISCOVERY = [
  { id: "d1", title: "Studio at 4pm when the light gets generous", topic: "Made by hand", image: PHOTOS.potteryWindow, authorId: "priya" },
  { id: "d2", title: "Before the ridge clouds arrived", topic: "Trail notes", image: PHOTOS.trail, authorId: "jonah" },
  { id: "d3", title: "Saturday crate digging in Fort Greene", topic: "Crate culture", image: PHOTOS.vinylWoman, authorId: "sam" },
  { id: "d4", title: "Long lunch energy", topic: "Slow mornings", image: PHOTOS.friendsMeadow, authorId: "maya" },
  { id: "d5", title: "New inks, new sketchbook season", topic: "Made by hand", image: PHOTOS.paintBrushes, authorId: "lena" },
  { id: "d6", title: "Washed Ethiopian pour-over", topic: "Slow mornings", image: PHOTOS.latte, authorId: "theo" },
];

export function ExploreScreen({
  theme,
  people,
  followingIds,
  onToggleFollow,
  onOpenProfile,
}: {
  theme: ThemePalette;
  people: any[];
  followingIds: string[];
  onToggleFollow: (id: string) => void;
  onOpenProfile: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("All");

  const filtered = DISCOVERY.filter((item) => {
    const matchesTopic = topic === "All" || item.topic === topic;
    const matchesQuery = !query.trim() || item.title.toLowerCase().includes(query.toLowerCase());
    return matchesTopic && matchesQuery;
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.canvas }}
      contentContainerStyle={{ padding: 12, paddingBottom: 100, gap: 14 }}
    >
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search people, notes, or topics…"
        placeholderTextColor={theme.faint}
        style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink }]}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {TOPICS.map((t) => {
          const active = topic === t;
          return (
            <Pressable
              key={t}
              onPress={() => setTopic(t)}
              style={[
                styles.chip,
                { backgroundColor: active ? theme.forest : theme.surface, borderColor: active ? theme.forest : theme.line },
              ]}
            >
              <Text style={{ fontSize: 12.5, fontWeight: "600", color: active ? "#FFFFFF" : theme.muted }}>{t}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.grid}>
        {filtered.map((item) => {
          const author = people.find((p) => p.id === item.authorId);
          return (
            <Pressable
              key={item.id}
              onPress={() => author && onOpenProfile(author.id)}
              style={[styles.tile, { backgroundColor: theme.surface, borderColor: theme.line }]}
            >
              <Image source={{ uri: item.image }} style={styles.tileImg} />
              <View style={{ padding: 10, gap: 4 }}>
                <Text style={{ fontSize: 10.5, fontWeight: "600", color: theme.forest }}>{item.topic}</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: theme.ink }} numberOfLines={2}>
                  {item.title}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.peopleCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: theme.ink, marginBottom: 8 }}>
          People in your extended circle
        </Text>
        {people
          .filter((p) => p.id !== "me")
          .map((person) => {
            const isFollowing = followingIds.includes(person.id);
            return (
              <View key={person.id} style={styles.personRow}>
                <Pressable onPress={() => onOpenProfile(person.id)} style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                  <Image source={{ uri: person.avatar }} style={styles.avatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: "600", color: theme.ink }}>{person.name}</Text>
                    <Text style={{ fontSize: 11.5, color: theme.muted }} numberOfLines={1}>
                      {person.bio}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => onToggleFollow(person.id)}
                  style={[
                    styles.followBtn,
                    {
                      backgroundColor: isFollowing ? theme.surfaceMuted : theme.forest,
                      borderColor: isFollowing ? theme.line : theme.forest,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: isFollowing ? theme.ink : "#FFFFFF" }}>
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                </Pressable>
              </View>
            );
          })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  search: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  tile: {
    width: "48.5%",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  tileImg: {
    width: "100%",
    height: 140,
  },
  peopleCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
  },
});
