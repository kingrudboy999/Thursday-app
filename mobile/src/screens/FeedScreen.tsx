import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BookmarkIcon, ChatIcon, HeartIcon, PlusIcon, SendIcon } from "../components/Icons";
import { ThemePalette } from "../theme";

interface FeedScreenProps {
  theme: ThemePalette;
  me: any;
  people: any[];
  stories: any[];
  posts: any[];
  seenStoryIds: string[];
  followingIds: string[];
  onOpenStory: (idx: number) => void;
  onCreatePost: () => void;
  onToggleLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onVotePoll: (postId: string, optionId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onOpenProfile: (personId: string) => void;
}

export function FeedScreen({
  theme,
  me,
  people,
  stories,
  posts,
  seenStoryIds,
  followingIds,
  onOpenStory,
  onCreatePost,
  onToggleLike,
  onToggleSave,
  onVotePoll,
  onAddComment,
  onOpenProfile,
}: FeedScreenProps) {
  const [tab, setTab] = useState<"for-you" | "following" | "circles">("for-you");
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
  const [draftComment, setDraftComment] = useState("");

  const visiblePosts = posts.filter((p) => {
    if (tab === "following") return followingIds.includes(p.authorId) || p.authorId === me.id;
    if (tab === "circles") return Boolean(p.circleName);
    return true;
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.canvas }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Stories strip */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesRow}>
          <Pressable onPress={onCreatePost} style={styles.storyItem}>
            <View style={[styles.storyRing, { borderColor: theme.lineStrong }]}>
              <Image source={{ uri: me.avatar }} style={styles.storyAvatar} />
              <View style={[styles.plusBadge, { backgroundColor: theme.forest }]}>
                <PlusIcon size={11} color="#FFFFFF" />
              </View>
            </View>
            <Text style={[styles.storyLabel, { color: theme.inkSoft }]} numberOfLines={1}>
              Your note
            </Text>
          </Pressable>

          {stories.map((st, idx) => {
            const author = people.find((p) => p.id === st.authorId);
            if (!author) return null;
            const seen = seenStoryIds.includes(st.id);
            return (
              <Pressable key={st.id} onPress={() => onOpenStory(idx)} style={styles.storyItem}>
                <View
                  style={[
                    styles.storyRing,
                    { borderColor: seen ? theme.lineStrong : theme.forest },
                  ]}
                >
                  <Image source={{ uri: author.avatar }} style={styles.storyAvatar} />
                </View>
                <Text style={[styles.storyLabel, { color: theme.inkSoft }]} numberOfLines={1}>
                  {author.name.split(" ")[0]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Feed mode tabs */}
      <View style={[styles.tabsBar, { borderColor: theme.line }]}>
        {(
          [
            { key: "for-you", label: "For you" },
            { key: "following", label: "Following" },
            { key: "circles", label: "Circles" },
          ] as const
        ).map((item) => {
          const active = tab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              style={[
                styles.tabChip,
                {
                  backgroundColor: active ? theme.forest : theme.surface,
                  borderColor: active ? theme.forest : theme.line,
                },
              ]}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "#FFFFFF" : theme.muted }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Posts list */}
      {visiblePosts.map((post) => {
        const author = people.find((p) => p.id === post.authorId) ?? me;
        const commentsOpen = openCommentsId === post.id;
        const totalPollVotes = post.poll
          ? post.poll.options.reduce((acc: number, o: any) => acc + o.votes, 0)
          : 0;

        return (
          <View
            key={post.id}
            style={[styles.postCard, { backgroundColor: theme.surface, borderColor: theme.line }]}
          >
            <Pressable onPress={() => onOpenProfile(author.id)} style={styles.postHeader}>
              <Image source={{ uri: author.avatar }} style={styles.postAvatar} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: "600", color: theme.ink }}>
                    {author.name}
                  </Text>
                  {post.circleName ? (
                    <View style={[styles.circlePill, { backgroundColor: theme.forestSoft }]}>
                      <Text style={{ fontSize: 10.5, fontWeight: "600", color: theme.forest }}>
                        {post.circleName}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ fontSize: 12, color: theme.faint }}>
                  @{author.handle} · {post.time}
                  {post.location ? ` · ${post.location}` : ""}
                </Text>
              </View>
            </Pressable>

            <Text style={[styles.postText, { color: theme.ink }]}>{post.text}</Text>

            {post.images && post.images.length > 0 ? (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.mediaScroll}
              >
                {post.images.map((uri: string, i: number) => (
                  <Pressable key={i} onLongPress={() => onToggleLike(post.id)}>
                    <Image source={{ uri }} style={styles.postImage} />
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            {post.poll ? (
              <View style={[styles.pollBox, { backgroundColor: theme.surfaceMuted, borderColor: theme.line }]}>
                <Text style={{ fontSize: 12.5, fontWeight: "600", color: theme.inkSoft, marginBottom: 8 }}>
                  {post.poll.question}
                </Text>
                {post.poll.options.map((opt: any) => {
                  const pct = totalPollVotes > 0 ? Math.round((opt.votes / totalPollVotes) * 100) : 0;
                  const chosen = post.poll.votedId === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => onVotePoll(post.id, opt.id)}
                      style={[
                        styles.pollOption,
                        {
                          borderColor: chosen ? theme.forest : theme.line,
                          backgroundColor: chosen ? theme.forestSoft : theme.surface,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 13, fontWeight: chosen ? "600" : "500", color: theme.ink, flex: 1 }}>
                        {opt.label}
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: theme.muted }}>{pct}%</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <View style={[styles.actionsRow, { borderTopColor: theme.line }]}>
              <Pressable onPress={() => onToggleLike(post.id)} style={styles.actionBtn}>
                <HeartIcon
                  size={18}
                  color={post.liked ? "#D94F3D" : theme.muted}
                  filled={Boolean(post.liked)}
                />
                <Text style={{ fontSize: 12.5, color: post.liked ? "#D94F3D" : theme.muted, fontWeight: "600" }}>
                  {post.likes}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setOpenCommentsId(commentsOpen ? null : post.id)}
                style={styles.actionBtn}
              >
                <ChatIcon size={18} color={theme.muted} />
                <Text style={{ fontSize: 12.5, color: theme.muted, fontWeight: "600" }}>
                  {post.comments.length}
                </Text>
              </Pressable>

              <View style={{ flex: 1 }} />

              <Pressable onPress={() => onToggleSave(post.id)} style={styles.actionBtn}>
                <BookmarkIcon
                  size={18}
                  color={post.saved ? theme.forest : theme.muted}
                  filled={Boolean(post.saved)}
                />
              </Pressable>
            </View>

            {commentsOpen ? (
              <View style={[styles.commentsBox, { borderTopColor: theme.line }]}>
                {post.comments.map((c: any) => {
                  const ca = people.find((p) => p.id === c.authorId) ?? me;
                  return (
                    <View key={c.id} style={styles.commentRow}>
                      <Text style={{ fontSize: 12.5, color: theme.ink }}>
                        <Text style={{ fontWeight: "700" }}>{ca.name.split(" ")[0]} </Text>
                        {c.text}
                      </Text>
                    </View>
                  );
                })}
                <View style={styles.commentInputRow}>
                  <TextInput
                    value={draftComment}
                    onChangeText={setDraftComment}
                    placeholder="Write a thoughtful reply…"
                    placeholderTextColor={theme.faint}
                    style={[
                      styles.commentInput,
                      { backgroundColor: theme.surfaceMuted, color: theme.ink, borderColor: theme.line },
                    ]}
                  />
                  <Pressable
                    onPress={() => {
                      const clean = draftComment.trim();
                      if (!clean) return;
                      onAddComment(post.id, clean);
                      setDraftComment("");
                    }}
                    style={[styles.commentSend, { backgroundColor: theme.forest }]}
                  >
                    <SendIcon size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
  },
  storiesRow: {
    paddingHorizontal: 12,
    gap: 14,
  },
  storyItem: {
    alignItems: "center",
    width: 64,
    gap: 5,
  },
  storyRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  storyAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  plusBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  storyLabel: {
    fontSize: 11.5,
    fontWeight: "500",
  },
  tabsBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
  },
  postCard: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  postAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  circlePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
  },
  postText: {
    fontSize: 14.5,
    lineHeight: 21,
    marginBottom: 10,
  },
  mediaScroll: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
  },
  postImage: {
    width: 320,
    height: 240,
    borderRadius: 12,
    marginRight: 8,
  },
  pollBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    gap: 6,
  },
  pollOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  commentsBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  commentRow: {
    paddingVertical: 2,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  commentInput: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  commentSend: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
