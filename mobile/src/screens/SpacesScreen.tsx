import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ThemePalette } from "../theme";

export function SpacesScreen({
  theme,
  circles,
  gatherings,
  onToggleCircle,
  onToggleGoing,
}: {
  theme: ThemePalette;
  circles: any[];
  gatherings: any[];
  onToggleCircle: (id: string) => void;
  onToggleGoing: (id: string) => void;
}) {
  const [tab, setTab] = useState<"circles" | "gatherings">("circles");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.canvas }}
      contentContainerStyle={{ padding: 12, paddingBottom: 100, gap: 12 }}
    >
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["circles", "gatherings"] as const).map((key) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[
                styles.tabBtn,
                { backgroundColor: active ? theme.forest : theme.surface, borderColor: active ? theme.forest : theme.line },
              ]}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "#FFFFFF" : theme.muted }}>
                {key === "circles" ? "Circles" : "Gatherings"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === "circles"
        ? circles.map((c) => (
            <View key={c.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
              <Image source={{ uri: c.image }} style={styles.cover} />
              <View style={{ padding: 14, gap: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: theme.ink }}>{c.name}</Text>
                    <Text style={{ fontSize: 12, color: theme.muted }}>{c.tagline}</Text>
                  </View>
                  <Pressable
                    onPress={() => onToggleCircle(c.id)}
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: c.joined ? theme.forestSoft : theme.forest,
                        borderColor: theme.forest,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 12.5, fontWeight: "600", color: c.joined ? theme.forest : "#FFFFFF" }}>
                      {c.joined ? "Joined" : "Join circle"}
                    </Text>
                  </Pressable>
                </View>
                <Text style={{ fontSize: 13.5, lineHeight: 19, color: theme.inkSoft }}>{c.description}</Text>
                <Text style={{ fontSize: 11.5, color: theme.faint }}>
                  {c.members.toLocaleString()} members · {c.category}
                </Text>
              </View>
            </View>
          ))
        : gatherings.map((ev) => (
            <View key={ev.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
              <Image source={{ uri: ev.image }} style={styles.cover} />
              <View style={{ padding: 14, gap: 6 }}>
                <Text style={{ fontSize: 11.5, fontWeight: "700", color: theme.forest }}>{ev.date}</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: theme.ink }}>{ev.title}</Text>
                <Text style={{ fontSize: 13, color: theme.muted }}>
                  {ev.venue} · {ev.entry}
                </Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <Text style={{ fontSize: 12, color: theme.faint }}>{ev.spots} spots left</Text>
                  <Pressable
                    onPress={() => onToggleGoing(ev.id)}
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: ev.going ? theme.forestSoft : theme.forest,
                        borderColor: theme.forest,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 12.5, fontWeight: "600", color: ev.going ? theme.forest : "#FFFFFF" }}>
                      {ev.going ? "Going ✓" : "RSVP"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  cover: {
    width: "100%",
    height: 150,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
  },
});
