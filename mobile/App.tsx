import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BrandMark, BrandSplashOverlay } from "./src/components/BrandMark";
import {
  BellIcon,
  ChatIcon,
  CloseIcon,
  CompassIcon,
  GearIcon,
  HomeIcon,
  MenuIcon,
  PlayCircleIcon,
  PlusIcon,
  UserIcon,
  UsersIcon,
} from "./src/components/Icons";
import { StoryViewerModal } from "./src/components/StoryViewerModal";
import {
  INITIAL_CIRCLES,
  INITIAL_CONVERSATIONS,
  INITIAL_GATHERINGS,
  INITIAL_NOTICES,
  INITIAL_PEOPLE,
  INITIAL_POSTS,
  INITIAL_REELS,
  INITIAL_STORIES,
  ME_ID,
  PHOTOS,
} from "./src/data";
import { ExploreScreen } from "./src/screens/ExploreScreen";
import { FeedScreen } from "./src/screens/FeedScreen";
import { InboxScreen } from "./src/screens/InboxScreen";
import { NotificationsScreen } from "./src/screens/NotificationsScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { ReelsScreen } from "./src/screens/ReelsScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { SpacesScreen } from "./src/screens/SpacesScreen";
import {
  clearMobileAuthSession,
  getMobileAuthToken,
  getMobileAuthUser,
  mobileApi,
  setMobileAuthSession,
} from "./src/api";
import { usePersistentState } from "./src/storage";
import { DARK_THEME, LIGHT_THEME, MobileThemeMode } from "./src/theme";

type MobileRoute =
  | "home"
  | "explore"
  | "reels"
  | "inbox"
  | "spaces"
  | "notifications"
  | "profile"
  | "settings";

export default function App() {
  const [themeMode, setThemeMode] = usePersistentState<MobileThemeMode>("theme", "light");
  const [people, setPeopleList] = usePersistentState<any[]>("people", INITIAL_PEOPLE);
  const [posts, setPosts] = usePersistentState<any[]>("posts", INITIAL_POSTS);
  const [stories] = usePersistentState<any[]>("stories", INITIAL_STORIES);
  const [seenStoryIds, setSeenStoryIds] = usePersistentState<string[]>("seenStories", []);
  const [reels, setReels] = usePersistentState<any[]>("reels", INITIAL_REELS);
  const [conversations, setConversations] = usePersistentState<any[]>("conversations", INITIAL_CONVERSATIONS);
  const [circles, setCircles] = usePersistentState<any[]>("circles", INITIAL_CIRCLES);
  const [gatherings, setGatherings] = usePersistentState<any[]>("gatherings", INITIAL_GATHERINGS);
  const [notices, setNotices] = usePersistentState<any[]>("notices", INITIAL_NOTICES);
  const [followingIds, setFollowingIds] = usePersistentState<string[]>("following", [
    "priya",
    "maya",
    "jonah",
  ]);
  const [quietHours, setQuietHours] = usePersistentState("quietHours", true);
  const [readReceipts, setReadReceipts] = usePersistentState("readReceipts", true);

  const [route, setRoute] = useState<MobileRoute>("home");
  const [profilePersonId, setProfilePersonId] = useState<string>(
    getMobileAuthUser()?.id ?? ME_ID,
  );
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(PHOTOS.potteryWindow);
  const [showSplash, setShowSplash] = useState(true);
  const [account, setAccount] = useState<any>(null);
  const [onlineIds, setOnlineIds] = useState<string[]>([]);

  // Restore the live PostgreSQL session, otherwise sign into the demo circle.
  useEffect(() => {
    let active = true;
    (async () => {
      const meRes = await mobileApi.me();
      if (active && meRes?.ok && meRes.user) {
        setMobileAuthSession(getMobileAuthToken() || "", meRes.user);
        setAccount(meRes.user);
        return;
      }
      const demo = await mobileApi.demoLogin("me");
      if (active) setAccount(demo?.user ?? null);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    mobileApi.bootstrap().then((data) => {
      if (!data?.ok) return;
      if (Array.isArray(data.posts) && data.posts.length) {
        setPosts((local) => {
          const map = new Map<string, any>();
          for (const p of [...data.posts, ...local]) {
            if (p?.id && !map.has(p.id)) map.set(p.id, p);
          }
          return Array.from(map.values());
        });
      }
      if (Array.isArray(data.circles) && data.circles.length) setCircles(data.circles);
      if (Array.isArray(data.people) && data.people.length) {
        const serverIds = new Set(data.people.map((p: any) => p.id));
        setPeopleList((local: any[]) => [
          ...data.people,
          ...local.filter((p: any) => p?.id && !serverIds.has(p.id)),
        ]);
      }
      if (Array.isArray(data.onlineUserIds)) setOnlineIds(data.onlineUserIds);
    });
  }, []);

  const meId = account?.id ?? ME_ID;
  const theme = themeMode === "dark" ? DARK_THEME : LIGHT_THEME;
  const me =
    account?.profile
      ? { ...account.profile, id: account.id }
      : people.find((p) => p.id === meId) ?? people[0];
  const viewedPerson = people.find((p) => p.id === profilePersonId) ?? me;
  const unreadDmCount = conversations.reduce((sum, c) => (c.request ? sum : sum + c.unread), 0);
  const unreadNoticeCount = notices.filter((n) => n.unread).length;

  const navigate = (next: MobileRoute) => {
    Haptics.selectionAsync().catch(() => {});
    if (next === "profile") setProfilePersonId(meId);
    setRoute(next);
    setDrawerOpen(false);
  };

  if (route === "reels") {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ReelsScreen
          reels={reels}
          people={people}
          onToggleLike={(id) => {
            setReels((prev) =>
              prev.map((r) =>
                r.id === id ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 } : r,
              ),
            );
            mobileApi.reelAction(id, "like");
          }}
          onToggleSave={(id) => {
            setReels((prev) => prev.map((r) => (r.id === id ? { ...r, saved: !r.saved } : r)));
            mobileApi.reelAction(id, "save");
          }}
          onExit={() => setRoute("home")}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.surface }}>
        <StatusBar style={themeMode === "dark" ? "light" : "dark"} />

        {/* Top header */}
        <View style={[styles.topBar, { backgroundColor: theme.surface, borderBottomColor: theme.line }]}>
          <Pressable
            onPress={() => navigate("home")}
            style={{ flexDirection: "row", alignItems: "center", gap: 9 }}
          >
            <BrandMark size={30} />
            <Text style={{ fontSize: 19, fontWeight: "700", letterSpacing: -0.5, color: theme.ink }}>
              Thursday
            </Text>
          </Pressable>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable onPress={() => navigate("notifications")} style={styles.headerIconBtn}>
              <BellIcon size={20} color={theme.ink} />
              {unreadNoticeCount > 0 ? <View style={[styles.dot, { backgroundColor: theme.forest }]} /> : null}
            </Pressable>
            <Pressable onPress={() => navigate("inbox")} style={styles.headerIconBtn}>
              <ChatIcon size={19} color={theme.ink} />
              {unreadDmCount > 0 ? <View style={[styles.dot, { backgroundColor: theme.forest }]} /> : null}
            </Pressable>
            <Pressable onPress={() => setDrawerOpen(true)} style={styles.headerIconBtn}>
              <MenuIcon size={20} color={theme.ink} />
            </Pressable>
          </View>
        </View>

        {/* Active screen */}
        <View style={{ flex: 1, backgroundColor: theme.canvas }}>
          {route === "home" ? (
            <FeedScreen
              theme={theme}
              me={me}
              people={people}
              stories={stories}
              posts={posts}
              seenStoryIds={seenStoryIds}
              followingIds={followingIds}
              onOpenStory={(idx) => {
                const st = stories[idx];
                if (st && !seenStoryIds.includes(st.id)) {
                  setSeenStoryIds((prev) => [...prev, st.id]);
                }
                setStoryIndex(idx);
              }}
              onCreatePost={() => setComposerOpen(true)}
              onToggleLike={(postId) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setPosts((prev) =>
                  prev.map((p) =>
                    p.id === postId
                      ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
                      : p,
                  ),
                );
                mobileApi.postAction(postId, "like");
              }}
              onToggleSave={(postId) => {
                setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, saved: !p.saved } : p)));
                mobileApi.postAction(postId, "save");
              }}
              onVotePoll={(postId, optionId) => {
                setPosts((prev) =>
                  prev.map((p) => {
                    if (p.id !== postId || !p.poll || p.poll.votedId) return p;
                    return {
                      ...p,
                      poll: {
                        ...p.poll,
                        votedId: optionId,
                        options: p.poll.options.map((o: any) =>
                          o.id === optionId ? { ...o, votes: o.votes + 1 } : o,
                        ),
                      },
                    };
                  }),
                );
                mobileApi.votePoll(postId, optionId);
              }}
              onAddComment={(postId, text) => {
                const comment = { id: `c_${Date.now()}`, authorId: meId, text, time: "Just now" };
                setPosts((prev) =>
                  prev.map((p) =>
                    p.id === postId
                      ? {
                          ...p,
                          comments: [...p.comments, comment],
                        }
                      : p,
                  ),
                );
                mobileApi.addComment(postId, comment);
              }}
              onOpenProfile={(pid) => {
                setProfilePersonId(pid);
                setRoute("profile");
              }}
            />
          ) : null}

          {route === "explore" ? (
            <ExploreScreen
              theme={theme}
              people={people}
              followingIds={followingIds}
              onToggleFollow={(id) =>
                setFollowingIds((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                )
              }
              onOpenProfile={(pid) => {
                setProfilePersonId(pid);
                setRoute("profile");
              }}
            />
          ) : null}

          {route === "inbox" ? (
            <InboxScreen
              theme={theme}
              people={people}
              conversations={conversations}
              onSendMessage={(convId, text, replyTo) =>
                setConversations((prev) =>
                  prev.map((c) =>
                    c.id === convId
                      ? {
                          ...c,
                          unread: 0,
                          messages: [
                            ...c.messages,
                            {
                              id: `m_${Date.now()}`,
                              fromId: meId,
                              text,
                              time: "Just now",
                              seen: true,
                              reactions: [],
                              replyTo,
                            },
                          ],
                        }
                      : c,
                  ),
                )
              }
              onReactMessage={(convId, msgId, emoji) =>
                setConversations((prev) =>
                  prev.map((c) =>
                    c.id === convId
                      ? {
                          ...c,
                          messages: c.messages.map((m: any) =>
                            m.id === msgId
                              ? {
                                  ...m,
                                  reactions: m.reactions?.includes(emoji)
                                    ? m.reactions
                                    : [...(m.reactions ?? []), emoji],
                                }
                              : m,
                          ),
                        }
                      : c,
                  ),
                )
              }
              onAcceptRequest={(convId) =>
                setConversations((prev) =>
                  prev.map((c) => (c.id === convId ? { ...c, request: false, unread: 0 } : c)),
                )
              }
            />
          ) : null}

          {route === "spaces" ? (
            <SpacesScreen
              theme={theme}
              circles={circles}
              gatherings={gatherings}
              onToggleCircle={(id) =>
                setCircles((prev) =>
                  prev.map((c) =>
                    c.id === id
                      ? { ...c, joined: !c.joined, members: c.joined ? c.members - 1 : c.members + 1 }
                      : c,
                  ),
                )
              }
              onToggleGoing={(id) =>
                setGatherings((prev) =>
                  prev.map((ev) => (ev.id === id ? { ...ev, going: !ev.going } : ev)),
                )
              }
            />
          ) : null}

          {route === "notifications" ? (
            <NotificationsScreen
              theme={theme}
              notices={notices}
              people={people}
              onMarkAllRead={() =>
                setNotices((prev) => prev.map((n) => ({ ...n, unread: false })))
              }
              onOpenProfile={(pid) => {
                setProfilePersonId(pid);
                setRoute("profile");
              }}
            />
          ) : null}

          {route === "profile" ? (
            <ProfileScreen
              theme={theme}
              person={viewedPerson}
              isMe={viewedPerson.id === meId}
              posts={posts}
              followingIds={followingIds}
              onToggleFollow={(id) =>
                setFollowingIds((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                )
              }
              onOpenSettings={() => navigate("settings")}
            />
          ) : null}

          {route === "settings" ? (
            <SettingsScreen
              theme={theme}
              themeMode={themeMode}
              quietHours={quietHours}
              readReceipts={readReceipts}
              onChangeTheme={setThemeMode}
              onToggleQuietHours={setQuietHours}
              onToggleReadReceipts={setReadReceipts}
              accountName={account?.profile?.name ?? me?.name}
              accountHandle={account?.handle ?? me?.handle}
              onSignOut={async () => {
                await mobileApi.logout();
                clearMobileAuthSession();
                setAccount(null);
                const demo = await mobileApi.demoLogin("me");
                setAccount(demo?.user ?? null);
              }}
            />
          ) : null}
        </View>

        {/* Equal 5-slot bottom navigation dock with Plus dead-center */}
        <View style={[styles.bottomDock, { backgroundColor: theme.surface, borderTopColor: theme.line }]}>
          <Pressable onPress={() => navigate("home")} style={styles.dockSlot}>
            <HomeIcon
              size={20}
              color={route === "home" ? theme.forest : theme.faint}
              filled={route === "home"}
            />
            <Text style={[styles.dockLabel, { color: route === "home" ? theme.ink : theme.faint }]}>
              Home
            </Text>
          </Pressable>

          <Pressable onPress={() => navigate("explore")} style={styles.dockSlot}>
            <CompassIcon
              size={20}
              color={route === "explore" ? theme.forest : theme.faint}
              filled={route === "explore"}
            />
            <Text style={[styles.dockLabel, { color: route === "explore" ? theme.ink : theme.faint }]}>
              Explore
            </Text>
          </Pressable>

          <Pressable onPress={() => setComposerOpen(true)} style={styles.dockSlot}>
            <View style={[styles.centerCreateBtn, { backgroundColor: theme.forest }]}>
              <PlusIcon size={19} color="#FFFFFF" />
            </View>
            <Text style={[styles.dockLabel, { color: theme.muted }]}>Create</Text>
          </Pressable>

          <Pressable onPress={() => navigate("reels")} style={styles.dockSlot}>
            <PlayCircleIcon size={20} color={theme.faint} />
            <Text style={[styles.dockLabel, { color: theme.faint }]}>Reels</Text>
          </Pressable>

          <Pressable onPress={() => navigate("profile")} style={styles.dockSlot}>
            <UserIcon
              size={20}
              color={route === "profile" ? theme.forest : theme.faint}
              filled={route === "profile"}
            />
            <Text style={[styles.dockLabel, { color: route === "profile" ? theme.ink : theme.faint }]}>
              Profile
            </Text>
          </Pressable>
        </View>

        {/* Near-full-screen Slide-Out Drawer (95% width) */}
        <Modal
          visible={drawerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setDrawerOpen(false)}
        >
          <View style={styles.drawerScrim}>
            <Pressable style={{ flex: 1 }} onPress={() => setDrawerOpen(false)} />
            <SafeAreaView style={[styles.drawerSheet, { backgroundColor: theme.surface, borderLeftColor: theme.line }]}>
              <View style={[styles.drawerHeader, { borderBottomColor: theme.line }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <BrandMark size={28} />
                  <Text style={{ fontSize: 18, fontWeight: "700", color: theme.ink }}>Thursday</Text>
                </View>
                <Pressable onPress={() => setDrawerOpen(false)}>
                  <CloseIcon size={18} color={theme.muted} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={{ padding: 14, gap: 6 }}>
                {[
                  { key: "home", label: "Home Feed", icon: HomeIcon },
                  { key: "explore", label: "Explore", icon: CompassIcon },
                  { key: "reels", label: "Full-screen Reels", icon: PlayCircleIcon },
                  { key: "spaces", label: "Circles & Gatherings", icon: UsersIcon },
                  { key: "inbox", label: `Messages (${unreadDmCount})`, icon: ChatIcon },
                  { key: "notifications", label: `Notifications (${unreadNoticeCount})`, icon: BellIcon },
                  { key: "profile", label: "Profile & Saved", icon: UserIcon },
                  { key: "settings", label: "Preferences & Theme", icon: GearIcon },
                ].map((entry) => {
                  const IconC = entry.icon;
                  const active = route === entry.key;
                  return (
                    <Pressable
                      key={entry.key}
                      onPress={() => navigate(entry.key as MobileRoute)}
                      style={[
                        styles.drawerRow,
                        { backgroundColor: active ? theme.forestSoft : "transparent" },
                      ]}
                    >
                      <IconC size={19} color={active ? theme.forest : theme.inkSoft} />
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: active ? "700" : "500",
                          color: active ? theme.forest : theme.ink,
                        }}
                      >
                        {entry.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={[styles.drawerFooter, { borderTopColor: theme.line }]}>
                <Image source={{ uri: me.avatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: "700", color: theme.ink }}>{me.name}</Text>
                  <Text style={{ fontSize: 11.5, color: theme.muted }}>@{me.handle}</Text>
                </View>
                <Pressable
                  onPress={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
                  style={[styles.themeChip, { backgroundColor: theme.surfaceMuted, borderColor: theme.line }]}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: theme.ink }}>
                    {themeMode === "dark" ? "Light" : "Dark"}
                  </Text>
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </Modal>

        {/* Create Note Modal */}
        <Modal
          visible={composerOpen}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setComposerOpen(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.surface }}>
            <View style={[styles.drawerHeader, { borderBottomColor: theme.line }]}>
              <Pressable onPress={() => setComposerOpen(false)}>
                <Text style={{ fontSize: 14, color: theme.muted }}>Cancel</Text>
              </Pressable>
              <Text style={{ fontSize: 15, fontWeight: "700", color: theme.ink }}>Share with your circle</Text>
              <Pressable
                onPress={() => {
                  const clean = newPostText.trim();
                  if (!clean) return;
                  const newPost = {
                    id: `p_${Date.now()}`,
                    authorId: meId,
                    time: "Just now",
                    location: me.location,
                    place: me.location,
                    text: clean,
                    images: selectedPhoto ? [selectedPhoto] : [],
                    likes: 0,
                    reposts: 0,
                    liked: false,
                    saved: false,
                    comments: [],
                  };
                  setPosts((prev) => [newPost, ...prev]);
                  mobileApi.createPost(newPost, me);
                  setNewPostText("");
                  setComposerOpen(false);
                }}
                style={[styles.publishBtn, { backgroundColor: theme.forest }]}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>Share</Text>
              </Pressable>
            </View>
            <View style={{ padding: 16, gap: 12 }}>
              <TextInput
                value={newPostText}
                onChangeText={setNewPostText}
                multiline
                placeholder="What are you making or noticing today?"
                placeholderTextColor={theme.faint}
                style={{ fontSize: 16, minHeight: 110, color: theme.ink, textAlignVertical: "top" }}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {[PHOTOS.potteryWindow, PHOTOS.trail, PHOTOS.coffee, PHOTOS.picnic].map((uri) => (
                  <Pressable key={uri} onPress={() => setSelectedPhoto(selectedPhoto === uri ? null : uri)}>
                    <Image
                      source={{ uri }}
                      style={{
                        width: 84,
                        height: 84,
                        borderRadius: 10,
                        borderWidth: selectedPhoto === uri ? 3 : 0,
                        borderColor: theme.forest,
                      }}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Full-screen Uncropped Story Viewer */}
        <StoryViewerModal
          visible={storyIndex !== null}
          stories={stories}
          people={people}
          index={storyIndex ?? 0}
          onClose={() => setStoryIndex(null)}
          onChangeIndex={(next) => {
            const st = stories[next];
            if (st && !seenStoryIds.includes(st.id)) {
              setSeenStoryIds((prev) => [...prev, st.id]);
            }
            setStoryIndex(next);
          }}
          onReply={(story, text) => {
            setConversations((prev) => {
              const existing = prev.find((c) => c.personId === story.authorId);
              const replyMsg = {
                id: `m_${Date.now()}`,
                fromId: meId,
                text,
                time: "Just now",
                seen: true,
                reactions: [],
                replyTo: {
                  id: story.id,
                  authorName: "Story",
                  preview: story.caption,
                },
              };
              if (existing) {
                return prev.map((c) =>
                  c.id === existing.id ? { ...c, messages: [...c.messages, replyMsg] } : c,
                );
              }
              return [
                {
                  id: `conv_${story.authorId}`,
                  personId: story.authorId,
                  unread: 0,
                  pinned: false,
                  request: false,
                  messages: [replyMsg],
                },
                ...prev,
              ];
            });
            setRoute("inbox");
          }}
        />

        {showSplash ? <BrandSplashOverlay onDone={() => setShowSplash(false)} /> : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 54,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  bottomDock: {
    height: 62,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  dockSlot: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  dockLabel: {
    fontSize: 10.5,
    fontWeight: "600",
  },
  centerCreateBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerScrim: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.48)",
  },
  drawerSheet: {
    width: "92%",
    maxWidth: 420,
    height: "100%",
    borderLeftWidth: 1,
  },
  drawerHeader: {
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  drawerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
  },
  drawerFooter: {
    padding: 14,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  themeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
  },
  publishBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
  },
});
