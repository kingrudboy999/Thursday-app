import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CloseIcon, SendIcon } from "./Icons";

interface StoryViewerProps {
  visible: boolean;
  stories: any[];
  people: any[];
  index: number;
  onClose: () => void;
  onChangeIndex: (next: number) => void;
  onReply: (story: any, text: string) => void;
}

export function StoryViewerModal({
  visible,
  stories,
  people,
  index,
  onClose,
  onChangeIndex,
  onReply,
}: StoryViewerProps) {
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState("");
  const story = stories[index];
  const author = story ? people.find((p) => p.id === story.authorId) : null;

  useEffect(() => {
    if (!visible || !story || paused || replyText.trim().length > 0) return;
    const timer = setTimeout(() => {
      if (index < stories.length - 1) onChangeIndex(index + 1);
      else onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [visible, story, index, stories.length, paused, replyText, onChangeIndex, onClose]);

  if (!visible || !story || !author) return null;

  const { width } = Dimensions.get("window");

  const handleSend = () => {
    const clean = replyText.trim();
    if (!clean) return;
    onReply(story, clean);
    setReplyText("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.root}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Dedicated non-overlapping top header */}
          <View style={styles.header}>
            <View style={styles.progressRow}>
              {stories.map((s, idx) => (
                <View key={s.id} style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: idx < index ? "100%" : idx === index ? "65%" : "0%" },
                    ]}
                  />
                </View>
              ))}
            </View>
            <View style={styles.authorRow}>
              <Image source={{ uri: author.avatar }} style={styles.avatar} />
              <View style={styles.authorMeta}>
                <Text style={styles.authorName}>{author.name}</Text>
                <Text style={styles.storyTime}>{story.time} ago</Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
                <CloseIcon size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Edge-to-edge uncropped media stage over blurred ambient backdrop */}
          <Pressable
            style={styles.stage}
            onLongPress={() => setPaused(true)}
            onPressOut={() => setPaused(false)}
            onPress={(e) => {
              const x = e.nativeEvent.locationX;
              if (x < width * 0.33) {
                if (index > 0) onChangeIndex(index - 1);
              } else if (x > width * 0.67) {
                if (index < stories.length - 1) onChangeIndex(index + 1);
                else onClose();
              }
            }}
          >
            <Image
              source={{ uri: story.image }}
              style={styles.ambientImage}
              blurRadius={28}
            />
            <View style={styles.ambientDim} />
            <Image
              source={{ uri: story.image }}
              style={styles.mainImage}
              resizeMode="contain"
            />
          </Pressable>

          {/* Dedicated footer with generous caption breathing room & DM reply */}
          <View style={styles.footer}>
            <Text style={styles.caption}>{story.caption}</Text>
            <View style={styles.replyRow}>
              <TextInput
                value={replyText}
                onChangeText={setReplyText}
                placeholder={`Reply to ${author.name.split(" ")[0]}…`}
                placeholderTextColor="rgba(255,255,255,0.55)"
                style={styles.replyInput}
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              <Pressable onPress={handleSend} style={styles.sendBtn}>
                <SendIcon size={16} color="#101318" />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#080A0D",
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: "#080A0D",
  },
  progressRow: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 10,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.24)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  storyTime: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  stage: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  ambientImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  ambientDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#080A0D",
    gap: 12,
  },
  caption: {
    color: "#F3F5F7",
    fontSize: 14.5,
    lineHeight: 21,
  },
  replyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  replyInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    color: "#FFFFFF",
    fontSize: 14,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});
