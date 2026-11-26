import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ThemePalette } from "../theme";

export function NotificationsScreen({
  theme,
  notices,
  people,
  onMarkAllRead,
  onOpenProfile,
}: {
  theme: ThemePalette;
  notices: any[];
  people: any[];
  onMarkAllRead: () => void;
  onOpenProfile: (id: string) => void;
}) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.canvas }}
      contentContainerStyle={{ padding: 12, paddingBottom: 100, gap: 10 }}
    >
      <View style={[styles.recap, { backgroundColor: theme.forestSoft, borderColor: theme.line }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: theme.forest }}>WEEKLY RECAP</Text>
          <Text style={{ fontSize: 14.5, fontWeight: "700", color: theme.ink, marginTop: 2 }}>
            Your circle shared 14 notes & 2 gatherings this week
          </Text>
        </View>
        <Pressable onPress={onMarkAllRead} style={[styles.markBtn, { backgroundColor: theme.surface }]}>
          <Text style={{ fontSize: 11.5, fontWeight: "600", color: theme.forest }}>Mark read</Text>
        </Pressable>
      </View>

      {notices.map((n) => {
        const person = people.find((p) => p.id === n.personId);
        if (!person) return null;
        return (
          <Pressable
            key={n.id}
            onPress={() => onOpenProfile(person.id)}
            style={[
              styles.row,
              {
                backgroundColor: n.unread ? theme.surface : theme.surfaceMuted,
                borderColor: n.unread ? theme.forest : theme.line,
              },
            ]}
          >
            <Image source={{ uri: person.avatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13.5, color: theme.ink }}>
                <Text style={{ fontWeight: "700" }}>{person.name} </Text>
                {n.text}
              </Text>
              <Text style={{ fontSize: 11.5, color: theme.faint, marginTop: 2 }}>{n.time}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  recap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  markBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
