import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ArrowLeftIcon, CloseIcon, SendIcon } from "../components/Icons";
import { ThemePalette } from "../theme";

const QUICK_REACTIONS = ["❤️", "😂", "🔥", "👏", "🙌"];

export function InboxScreen({
  theme,
  people,
  conversations,
  onSendMessage,
  onReactMessage,
  onAcceptRequest,
}: {
  theme: ThemePalette;
  people: any[];
  conversations: any[];
  onSendMessage: (convId: string, text: string, replyTo?: any) => void;
  onReactMessage: (convId: string, msgId: string, emoji: string) => void;
  onAcceptRequest: (convId: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "unread" | "requests">("all");
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<any | null>(null);

  const filtered = conversations.filter((c) => {
    if (filter === "requests") return Boolean(c.request);
    if (c.request) return false;
    if (filter === "unread") return c.unread > 0;
    return true;
  });

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? null;
  const activePerson = activeConv ? people.find((p) => p.id === activeConv.personId) : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.canvas }}>
      <View style={styles.filterRow}>
        {(
          [
            { key: "all", label: "All" },
            { key: "unread", label: "Unread" },
            { key: "requests", label: "Requests" },
          ] as const
        ).map((tab) => {
          const active = filter === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setFilter(tab.key)}
              style={[
                styles.chip,
                { backgroundColor: active ? theme.forest : theme.surface, borderColor: active ? theme.forest : theme.line },
              ]}
            >
              <Text style={{ fontSize: 12.5, fontWeight: "600", color: active ? "#FFFFFF" : theme.muted }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 100, gap: 8 }}>
        {filtered.map((conv) => {
          const person = people.find((p) => p.id === conv.personId);
          if (!person) return null;
          const last = conv.messages[conv.messages.length - 1];
          return (
            <Pressable
              key={conv.id}
              onPress={() => setActiveConvId(conv.id)}
              style={[styles.convRow, { backgroundColor: theme.surface, borderColor: theme.line }]}
            >
              <Image source={{ uri: person.avatar }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 14.5, fontWeight: "600", color: theme.ink }}>{person.name}</Text>
                  <Text style={{ fontSize: 11.5, color: theme.faint }}>{last?.time}</Text>
                </View>
                <Text style={{ fontSize: 13, color: conv.unread ? theme.ink : theme.muted, marginTop: 2 }} numberOfLines={1}>
                  {last?.text || "Shared a photo"}
                </Text>
              </View>
              {conv.unread > 0 ? (
                <View style={[styles.badge, { backgroundColor: theme.forest }]}>
                  <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700" }}>{conv.unread}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Full-screen DM Thread Modal */}
      <Modal
        visible={Boolean(activeConv && activePerson)}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setActiveConvId(null)}
      >
        {activeConv && activePerson ? (
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.canvas }}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <View style={[styles.chatHeader, { backgroundColor: theme.surface, borderBottomColor: theme.line }]}>
                <Pressable onPress={() => setActiveConvId(null)} style={{ padding: 6 }}>
                  <ArrowLeftIcon size={20} color={theme.ink} />
                </Pressable>
                <Image source={{ uri: activePerson.avatar }} style={styles.chatAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: theme.ink }}>{activePerson.name}</Text>
                  <Text style={{ fontSize: 11.5, color: theme.muted }}>
                    {activePerson.online ? "Active now · Long-press bubble to reply" : `@${activePerson.handle}`}
                  </Text>
                </View>
              </View>

              {activeConv.request ? (
                <View style={[styles.requestBanner, { backgroundColor: theme.forestSoft }]}>
                  <Text style={{ fontSize: 12.5, color: theme.forest, flex: 1 }}>
                    Message request from {activePerson.name}
                  </Text>
                  <Pressable
                    onPress={() => onAcceptRequest(activeConv.id)}
                    style={[styles.acceptBtn, { backgroundColor: theme.forest }]}
                  >
                    <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600" }}>Accept</Text>
                  </Pressable>
                </View>
              ) : null}

              <ScrollView contentContainerStyle={{ padding: 14, gap: 10 }}>
                {activeConv.messages.map((msg: any) => {
                  const mine = msg.fromId === "me";
                  return (
                    <Pressable
                      key={msg.id}
                      onLongPress={() =>
                        setReplyingTo({
                          id: msg.id,
                          authorName: mine ? "You" : activePerson.name.split(" ")[0],
                          preview: msg.text || "Photo",
                        })
                      }
                      style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%" }}
                    >
                      <View
                        style={[
                          styles.bubble,
                          {
                            backgroundColor: mine ? theme.forest : theme.surface,
                            borderColor: mine ? theme.forest : theme.line,
                          },
                        ]}
                      >
                        {msg.replyTo ? (
                          <View style={styles.quotedBox}>
                            <Text style={{ fontSize: 11, fontWeight: "700", color: mine ? "#E8F2EC" : theme.forest }}>
                              Replying to {msg.replyTo.authorName}
                            </Text>
                            <Text style={{ fontSize: 11.5, color: mine ? "#E8F2EC" : theme.muted }} numberOfLines={1}>
                              {msg.replyTo.preview}
                            </Text>
                          </View>
                        ) : null}
                        {msg.image ? <Image source={{ uri: msg.image }} style={styles.msgImage} /> : null}
                        {msg.text ? (
                          <Text style={{ fontSize: 14.5, lineHeight: 20, color: mine ? "#FFFFFF" : theme.ink }}>
                            {msg.text}
                          </Text>
                        ) : null}
                      </View>

                      <View style={styles.reactionStrip}>
                        <Text style={{ fontSize: 10.5, color: theme.faint }}>
                          {msg.time}
                          {mine && msg.seen ? " · Seen" : ""}
                        </Text>
                        {QUICK_REACTIONS.slice(0, 3).map((em) => (
                          <Pressable key={em} onPress={() => onReactMessage(activeConv.id, msg.id, em)}>
                            <Text style={{ fontSize: 12 }}>{em}</Text>
                          </Pressable>
                        ))}
                        {msg.reactions?.length ? (
                          <Text style={{ fontSize: 12 }}>{msg.reactions.join(" ")}</Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {replyingTo ? (
                <View style={[styles.replyBar, { backgroundColor: theme.surfaceMuted, borderTopColor: theme.line }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11.5, fontWeight: "700", color: theme.forest }}>
                      Replying to {replyingTo.authorName}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.muted }} numberOfLines={1}>
                      {replyingTo.preview}
                    </Text>
                  </View>
                  <Pressable onPress={() => setReplyingTo(null)}>
                    <CloseIcon size={16} color={theme.muted} />
                  </Pressable>
                </View>
              ) : null}

              <View style={[styles.composerRow, { backgroundColor: theme.surface, borderTopColor: theme.line }]}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={`Message ${activePerson.name.split(" ")[0]}…`}
                  placeholderTextColor={theme.faint}
                  style={[styles.chatInput, { backgroundColor: theme.surfaceMuted, color: theme.ink }]}
                />
                <Pressable
                  onPress={() => {
                    const clean = draft.trim();
                    if (!clean) return;
                    onSendMessage(activeConv.id, clean, replyingTo ?? undefined);
                    setDraft("");
                    setReplyingTo(null);
                  }}
                  style={[styles.sendBtn, { backgroundColor: theme.forest }]}
                >
                  <SendIcon size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
  },
  convRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  chatAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  requestBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  acceptBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  bubble: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
    gap: 6,
  },
  quotedBox: {
    borderLeftWidth: 2,
    borderLeftColor: "rgba(255,255,255,0.5)",
    paddingLeft: 8,
  },
  msgImage: {
    width: 210,
    height: 150,
    borderRadius: 10,
  },
  reactionStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 15,
    fontSize: 14,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
