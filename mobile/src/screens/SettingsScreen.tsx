import React from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { MobileThemeMode, ThemePalette } from "../theme";

export function SettingsScreen({
  theme,
  themeMode,
  quietHours,
  readReceipts,
  onChangeTheme,
  onToggleQuietHours,
  onToggleReadReceipts,
  accountName,
  accountHandle,
  onSignOut,
}: {
  theme: ThemePalette;
  themeMode: MobileThemeMode;
  quietHours: boolean;
  readReceipts: boolean;
  onChangeTheme: (mode: MobileThemeMode) => void;
  onToggleQuietHours: (next: boolean) => void;
  onToggleReadReceipts: (next: boolean) => void;
  accountName?: string;
  accountHandle?: string;
  onSignOut?: () => void;
}) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.canvas }}
      contentContainerStyle={{ padding: 12, paddingBottom: 100, gap: 12 }}
    >
      {accountName ? (
        <View
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.line,
            borderWidth: 1,
            borderRadius: 14,
            padding: 14,
            gap: 4,
          }}
        >
          <Text style={{ color: theme.faint, fontSize: 10, fontWeight: "700", letterSpacing: 1 }}>
            LIVE ACCOUNT
          </Text>
          <Text style={{ color: theme.ink, fontSize: 15, fontWeight: "700" }}>
            {accountName}
          </Text>
          {accountHandle ? (
            <Text style={{ color: theme.muted, fontSize: 12 }}>@{accountHandle}</Text>
          ) : null}
          {onSignOut ? (
            <Pressable
              onPress={onSignOut}
              style={{
                marginTop: 8,
                alignSelf: "flex-start",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.clay,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: theme.clay, fontSize: 12, fontWeight: "700" }}>
                Sign out
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: theme.ink }}>Appearance</Text>
        <Text style={{ fontSize: 12.5, color: theme.muted, marginBottom: 8 }}>
          Switch between Warm Daylight and Late Evening.
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["light", "dark"] as const).map((m) => {
            const active = themeMode === m;
            return (
              <Pressable
                key={m}
                onPress={() => onChangeTheme(m)}
                style={[
                  styles.modeBtn,
                  { backgroundColor: active ? theme.forest : theme.surfaceMuted, borderColor: theme.line },
                ]}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "#FFFFFF" : theme.ink }}>
                  {m === "light" ? "Light" : "Dark"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14.5, fontWeight: "600", color: theme.ink }}>Quiet hours</Text>
            <Text style={{ fontSize: 12, color: theme.muted }}>Mute non-urgent notifications from 10 PM – 7 AM</Text>
          </View>
          <Switch value={quietHours} onValueChange={onToggleQuietHours} trackColor={{ true: theme.forest }} />
        </View>

        <View style={[styles.toggleRow, { borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14.5, fontWeight: "600", color: theme.ink }}>Read receipts</Text>
            <Text style={{ fontSize: 12, color: theme.muted }}>Show when you have read direct messages</Text>
          </View>
          <Switch value={readReceipts} onValueChange={onToggleReadReceipts} trackColor={{ true: theme.forest }} />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.forestSoft, borderColor: theme.line }]}>
        <Text style={{ fontSize: 13.5, fontWeight: "700", color: theme.forest }}>
          Slim Native Release (~24 MB APK)
        </Text>
        <Text style={{ fontSize: 12.5, lineHeight: 18, color: theme.inkSoft }}>
          Configured with per-ABI splits (arm64-v8a & armeabi-v7a), R8 full-mode shrinking, English-only resources, and compressed native libs.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
