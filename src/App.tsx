import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  apiAddComment,
  apiCreateCircle,
  apiCreateEvent,
  apiCreateHighlight,
  apiCreatePost,
  apiCreateReel,
  apiCreateStory,
  apiDeleteConversation,
  apiDeleteDraft,
  apiDeletePost,
  apiEditPost,
  apiMarkNotificationsRead,
  apiMarkThreadRead,
  apiMarkStorySeen,
  apiPostAction,
  apiReactMessage,
  apiReelAction,
  apiReplyStory,
  apiRecordProfileVisit,
  apiRecordReelView,
  apiResetBackend,
  apiSaveDraft,
  apiSaveGuideProgress,
  apiSendCallSignal,
  apiSendMessage,
  apiSendTyping,
  apiStartConversation,
  apiBlockPerson,
  apiMutePerson,
  apiReportContent,
  apiChangePassword,
  apiDeleteAccount,
  REPORT_REASONS,
  apiToggleCircle,
  apiToggleEventRsvp,
  apiToggleFollow,
  apiUpdateConversation,
  apiUpdateMeDetailed,
  apiUpdatePreferences,
  apiVotePoll,
  apiVotePrompt,
  apiGetAuthMe,
  apiLogout,
  clearAuthSession,
  connectRealtimeStream,
  fetchBootstrap,
  getAuthToken,
  getStoredAuthUser,
  saveAuthSession,
  pushWorkspaceToRailway,
  type AuthUser,
} from "./lib/api";
import { ArrowUp } from "./lib/icons";
import { ColdStartSplash } from "./components/brand";
import {
  CreateCircleModal,
  CreateGatheringModal,
  CreateHighlightModal,
  StoryComposerModal,
} from "./components/features";
import {
  ComposerModal,
  DesktopSidebar,
  EditProfileModal,
  MobileBottomDock,
  MobileDrawer,
  PostDetailModal,
  SearchPaletteModal,
  StoryViewerModal,
  ReportModal,
  TopBar,
} from "./components/social-shell";
import {
  IncomingCallBanner,
  PostActionsContext,
  ToastBanner,
} from "./components/social";
import {
  CIRCLE_GUIDES,
  INITIAL_DRAFTS,
  STORY_HIGHLIGHTS,
  THURSDAY_PROMPTS,
} from "./lib/features";
import { DEFAULT_PREFERENCES } from "./lib/settings";
import { shareContent } from "./lib/share";
import {
  INITIAL_CONVERSATIONS,
  INITIAL_NOTICES,
  INITIAL_POSTS,
  INITIAL_REELS,
  INITIAL_STORIES,
  ME_ID,
  PEOPLE,
  PHOTOS,
  TOPICS,
} from "./lib/social";
import { INITIAL_CIRCLES, INITIAL_EVENTS, SPACE_POSTS } from "./lib/spaces";
import {
  clearWorkspaceStorage,
  downloadTextFile,
  resetStoredWorkspaceState,
  exportWorkspaceSnapshot,
  importWorkspaceSnapshot,
  useStoredState,
} from "./lib/storage";
import { AiView } from "./views/AiView";
import { AuthView } from "./views/AuthView";
import { NotificationsView } from "./views/Connect";
import { BookmarksView, ExploreView } from "./views/Explore";
import { FeedView } from "./views/Feed";
import { InboxView } from "./views/Inbox";
import { ProfileView } from "./views/Profile";
import { ReelsView } from "./views/Reels";
import { SettingsView } from "./views/SettingsView";
import { CirclesView, GatheringsView } from "./views/Spaces";

const DEFAULT_FOLLOWING_IDS: string[] = [];
const COMPOSER_PHOTO_PRESETS = {
  pottery: PHOTOS.potteryWindow,
  studio: PHOTOS.potteryWindow,
  trail: PHOTOS.trail,
  coffee: PHOTOS.coffee,
  vinyl: PHOTOS.vinyl,
};

export function App() {
  const [c, u] = useStoredState("people", PEOPLE),
    [m, d] = useStoredState("posts", [...SPACE_POSTS, ...INITIAL_POSTS]),
    [x, w] = useStoredState("circles", INITIAL_CIRCLES),
    [A, T] = useStoredState("events", INITIAL_EVENTS),
    [y, g] = useStoredState("following", DEFAULT_FOLLOWING_IDS),
    // The inbox starts empty. Real threads arrive from the server and from the
    // realtime stream — nothing is invented locally.
    [R, z] = useStoredState("conversations", []),
    [v, q] = useStoredState("notices", INITIAL_NOTICES),
    [_, j] = useStoredState("stories", INITIAL_STORIES),
    [C, U] = useStoredState("seenStories", []),
    [J, te] = useStoredState("reels", INITIAL_REELS),
    [highlights, setHighlights] = useStoredState("highlights", STORY_HIGHLIGHTS),
    [drafts, setDrafts] = useStoredState("drafts", INITIAL_DRAFTS),
    [prompts, setPrompts] = useStoredState("prompts", THURSDAY_PROMPTS),
    [guides, setGuides] = useStoredState("guides", CIRCLE_GUIDES),
    [promptVotes, setPromptVotes] = useStoredState("promptVotes", {}),
    [savedGuideIds, setSavedGuideIds] = useStoredState(
      "savedGuideIds",
      CIRCLE_GUIDES.map((gItem: any) => gItem.id),
    ),
    [guideSteps, setGuideSteps] = useStoredState("guideSteps", {}),
    [Ne, he] = useStoredState("preferences", DEFAULT_PREFERENCES),
    [K, ae] = useState<any>(() => ({
      ...DEFAULT_PREFERENCES,
      ...Ne,
    })),
    [$, ye] = useState<any>("home"),
    [authUser, setAuthUser] = useState<AuthUser | null>(() => getStoredAuthUser()),
    [authChecked, setAuthChecked] = useState<boolean>(false),
    [onlineIds, setOnlineIds] = useState<string[]>([]),
    [live, setLive] = useState<boolean>(false),
    [visitors, setVisitors] = useState<any[]>([]),
    [blockedIds, setBlockedIds] = useState<string[]>([]),
    [reportTarget, setReportTarget] = useState<{ type: string; id: string } | null>(null),
    [mutedIds, setMutedIds] = useState<string[]>([]),
    [incomingCall, setIncomingCall] = useState<any>(null),
    [callLog, setCallLog] = useState<any[]>([]),
    // The profile view must default to whoever is signed in. Hard-coding ME_ID
    // here made a fresh account open the seeded demo profile ("Nora Bennett")
    // and offer to follow them — because demo people are keyed by id "me".
    [Ve, pe] = useState<any>(getStoredAuthUser()?.id || ME_ID),
    [le, Ee] = useState<any>(undefined),
    [Ce, He] = useState<any>(false),
    [V, W] = useState<any>(false),
    [G, X_local] = useState<any>(false),
    [se, h] = useState<any>(false),
    [k, D] = useState<any>(null),
    [I, me] = useState<any>(undefined),
    [ve, de] = useState<any>(null),
    [highlightViewerStories, setHighlightViewerStories] = useState<any[] | null>(null),
    [createCircleOpen, setCreateCircleOpen] = useState<boolean>(false),
    [createGatheringOpen, setCreateGatheringOpen] = useState<boolean>(false),
    [createHighlightOpen, setCreateHighlightOpen] = useState<boolean>(false),
    [qe, De] = useState<any>(null),
    [pt, St] = useState<any>(true),
    [Mt, u0] = useState<any>(false),
    gKeyTimerRef = useRef<number | null>(null),
    meId: string = authUser?.id || ME_ID,
    // A ref mirror of meId, so long-lived callbacks that must not re-subscribe
    // (nav handlers, realtime listeners) still read the current account.
    meIdRef = useRef<string>(meId),
    authProfile = authUser?.profile
      ? {
          ...authUser.profile,
          id: authUser.id,
          handle: authUser.handle || authUser.profile?.handle,
          avatar:
            authUser.profile?.avatar ||
            `https://api.dicebear.com/7.x/notionists/svg?seed=${authUser.id}`,
          name: authUser.profile?.name || authUser.handle || "You",
        }
      : null,
    fe =
      c.find((H?: any) => H.id === meId) ??
      authProfile ?? {
        id: meId,
        name: "You",
        handle: "you",
        avatar: "",
        bio: "",
        followers: 0,
        following: 0,
      },
    Ae = m.find((H?: any) => H.id === k) ?? null,
    d0 = Ae ? (c.find((H?: any) => H.id === Ae.authorId) ?? null) : null,
    // Always land on a real person object. Previously a missing directory
    // entry silently rendered whichever face came first in the list — which is
    // how a signed-in account ended up staring at a demo profile. Now the only
    // fallback is the signed-in person, and never a stranger.
    Ft = c.find((H?: any) => H.id === Ve) ?? fe,
    A0 = v.filter((H?: any) => H.unread).length,
    s0 = R.reduce(
      (H?: any, Y?: any) => (Y.request || Y.archived ? H : H + Y.unread),
      0,
    ),
    Te = useCallback((H?: any, Y?: any) => {
      De({
        id: Date.now(),
        title: H,
        description: Y,
      });
    }, []);

  useEffect(() => {
    if (!qe) return;
    const H = window.setTimeout(() => De(null), 4200);
    return () => window.clearTimeout(H);
  }, [qe]);

  meIdRef.current = meId;

  // Whenever the signed-in account changes, make sure "my profile" points at it.
  // Without this, a reload restored the session but left the profile viewer on
  // the previous default, so the Profile tab showed someone else entirely.
  useEffect(() => {
    const myId = authUser?.id;
    if (!myId) return;
    pe((current: any) => {
      // Only correct the self-view. If the person is deliberately reading
      // another profile, leave their choice alone.
      const isSelfView = !current || current === ME_ID || current === myId;
      return isSelfView ? myId : current;
    });
  }, [authUser?.id]);

  // Validate the persisted bearer session against PostgreSQL on load
  useEffect(() => {
    let active = true;
    if (!getStoredAuthUser()) {
      setAuthChecked(true);
      return () => {
        active = false;
      };
    }
    apiGetAuthMe().then((res) => {
      if (!active) return;
      if (res.ok && res.data?.user) {
        setAuthUser(res.data.user);
      } else if (!res.ok) {
        clearAuthSession();
        setAuthUser(null);
      }
      setAuthChecked(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Hydrate & merge live state from Railway PostgreSQL backend + subscribe to SSE
  useEffect(() => {
    if (!authChecked || !authUser) return;
    let active = true;
    fetchBootstrap().then((data) => {
      if (!active || !data?.ok) return;
      // Server state is authoritative once it has been fetched. These blocks
      // used to apply only when the server had something, which meant a stale
      // browser cache always won on an empty account — deleted content kept
      // reappearing from localStorage.
      if (Array.isArray(data.posts)) {
        // Everything the user has posted lives on the server, so anything that
        // exists only in this browser is left over from a seed that is gone.
        d(data.posts);
      }
      if (Array.isArray(data.people)) {
        // The server's directory is the whole directory. Keeping local-only
        // people is what left deleted accounts visible in followers, mention
        // lists and profile screens long after they were removed.
        u(data.people);
      }
      if (Array.isArray(data.stories)) {
        j(data.stories);
      }
      if (Array.isArray(data.highlights)) {
        setHighlights(data.highlights);
      }
      if (Array.isArray(data.reels)) {
        te(data.reels);
      }
      if (Array.isArray(data.circles)) {
        w(data.circles);
      }
      if (Array.isArray(data.events)) {
        T(data.events);
      }
      if (Array.isArray(data.prompts) && data.prompts.length) {
        setPrompts(data.prompts);
      }
      if (Array.isArray(data.guides) && data.guides.length) {
        setGuides(data.guides);
      }
      if (Array.isArray(data.blockedIds)) setBlockedIds(data.blockedIds);
      if (Array.isArray(data.mutedIds)) setMutedIds(data.mutedIds);
      if (Array.isArray(data.conversations)) {
        // Server threads are the only truth for the inbox. Local conversations
        // that the server does not know about are dropped, which also clears
        // out demo threads cached by older builds.
        const legacyDemoIds = new Set(
          INITIAL_CONVERSATIONS.map((c: any) => c.id),
        );
        z((localConvs: any[]) => {
          const serverConvs = data.conversations.filter(
            (c: any) => !legacyDemoIds.has(c.id),
          );
          const serverIds = new Set(serverConvs.map((c: any) => c.id));
          const pending = localConvs.filter(
            (c: any) =>
              c?.id &&
              !serverIds.has(c.id) &&
              // keep optimistic threads we just created and are still posting
              c?.optimistic,
          );
          return [...serverConvs, ...pending];
        });
      }
      if (data.promptVotes && Object.keys(data.promptVotes).length) {
        setPromptVotes((prev: any) => ({ ...prev, ...data.promptVotes }));
      }
      if (data.guideSteps && Object.keys(data.guideSteps).length) {
        setGuideSteps((prev: any) => ({ ...prev, ...data.guideSteps }));
      }
    });

    const disconnect = connectRealtimeStream({
      onPostCreated: ({ post, author }) => {
        if (author?.id) {
          u((prev: any[]) =>
            prev.some((p) => p.id === author.id)
              ? prev.map((p) => (p.id === author.id ? { ...p, ...author } : p))
              : [author, ...prev],
          );
        }
        if (post?.id) {
          d((prev: any[]) =>
            prev.some((p) => p.id === post.id) ? prev : [post, ...prev],
          );
        }
      },
      onPostUpdated: ({ post }) => {
        if (post?.id) {
          d((prev: any[]) => prev.map((p) => (p.id === post.id ? { ...p, ...post } : p)));
        }
      },
      onPostDeleted: ({ postId }) => {
        if (postId) {
          d((prev: any[]) => prev.filter((p) => p.id !== postId));
        }
      },
      onStoryCreated: ({ story }) => {
        if (story?.id) {
          j((prev: any[]) =>
            prev.some((s) => s.id === story.id) ? prev : [story, ...prev],
          );
        }
      },
      onHighlightCreated: ({ highlight }) => {
        if (highlight?.id) {
          setHighlights((prev: any[]) =>
            prev.some((hl) => hl.id === highlight.id) ? prev : [...prev, highlight],
          );
        }
      },
      onReelCreated: ({ reel }) => {
        if (reel?.id) {
          te((prev: any[]) =>
            prev.some((r) => r.id === reel.id) ? prev : [reel, ...prev],
          );
        }
      },
      onReelUpdated: ({ reel }) => {
        if (reel?.id) {
          te((prev: any[]) => prev.map((r) => (r.id === reel.id ? { ...r, ...reel } : r)));
        }
      },
      onCircleCreated: ({ circle }) => {
        if (circle?.id) {
          w((prev: any[]) =>
            prev.some((ci) => ci.id === circle.id) ? prev : [circle, ...prev],
          );
        }
      },
      onCircleUpdated: ({ circle }) => {
        if (circle?.id) {
          w((prev: any[]) =>
            prev.map((ci) => (ci.id === circle.id ? { ...ci, ...circle } : ci)),
          );
        }
      },
      onEventCreated: ({ event }) => {
        if (event?.id) {
          T((prev: any[]) =>
            prev.some((ev) => ev.id === event.id) ? prev : [event, ...prev],
          );
        }
      },
      onEventUpdated: ({ event }) => {
        if (event?.id) {
          T((prev: any[]) =>
            prev.map((ev) => (ev.id === event.id ? { ...ev, ...event } : ev)),
          );
        }
      },
      onDmTyping: ({ conversationId, typing }) => {
        z((prev: any[]) =>
          prev.map((conv) =>
            conv.id === conversationId ? { ...conv, typing } : conv,
          ),
        );
      },
      onDmMessage: ({ conversationId, message }) => {
        if (!message?.id) return;
        z((prev: any[]) =>
          prev.map((conv) => {
            if (conv.id !== conversationId) return conv;
            if ((conv.messages || []).some((msg: any) => msg.id === message.id)) {
              return { ...conv, typing: false };
            }
            return {
              ...conv,
              typing: false,
              messages: [...(conv.messages || []), message],
            };
          }),
        );
      },
      onPromptUpdated: ({ prompt }) => {
        if (prompt?.id) {
          setPrompts((prev: any[]) =>
            prev.map((pr) => (pr.id === prompt.id ? { ...pr, ...prompt } : pr)),
          );
        }
      },
      onConnectionChange: ({ connected, onlineUserIds }) => {
        setLive(connected);
        if (Array.isArray(onlineUserIds)) setOnlineIds(onlineUserIds);
      },
      onPresenceUpdate: ({ onlineUserIds }) => {
        setOnlineIds(Array.isArray(onlineUserIds) ? onlineUserIds : []);
      },
      onPersonJoined: (person) => {
        if (person?.id) {
          u((prev: any[]) =>
            prev.some((p) => p.id === person.id)
              ? prev.map((p) => (p.id === person.id ? { ...p, ...person } : p))
              : [...prev, { ...person }],
          );
        }
      },
      onPersonUpdated: (person) => {
        if (person?.id) {
          u((prev: any[]) =>
            prev.map((p) => (p.id === person.id ? { ...p, ...person } : p)),
          );
        }
      },
      onProfileUpdated: (profile) => {
        if (profile?.id) {
          u((prev: any[]) =>
            prev.map((p) => (p.id === profile.id ? { ...p, ...profile } : p)),
          );
        }
      },
      onDmRead: ({ conversationId, readerId, at }) => {
        z((prev: any[]) =>
          prev.map((conv) =>
            conv.id === conversationId && readerId !== meId
              ? { ...conv, otherLastReadAt: at }
              : conv,
          ),
        );
      },
      onDmReaction: ({ conversationId, conversation }) => {
        z((prev: any[]) =>
          prev.map((conv) => {
            if (conv.id !== conversationId || !conversation) return conv;
            return {
              ...conv,
              messages: conversation.messages ?? conv.messages,
            };
          }),
        );
      },
      onNotificationCreated: ({ notice }) => {
        if (notice?.id) {
          q((prev: any[]) =>
            prev.some((n) => n.id === notice.id) ? prev : [notice, ...prev],
          );
        }
      },
      onVisitorRecorded: ({ visitors }) => {
        if (Array.isArray(visitors)) setVisitors(visitors);
      },
      onCallSignal: (payload) => {
        if (payload?.type === "ring") setIncomingCall(payload);
        setCallLog((prev: any[]) => [...prev.slice(-30), payload]);
      },
    });

    return () => {
      active = false;
      disconnect();
    };
  }, [authChecked, authUser]);

  // Debounced background workspace backup to Railway
  useEffect(() => {
    let timer = 0;
    const onWorkspaceUpdated = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        pushWorkspaceToRailway().catch(() => {});
      }, 3000);
    };
    window.addEventListener("thursday:workspace-updated", onWorkspaceUpdated);
    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("thursday:workspace-updated", onWorkspaceUpdated);
    };
  }, []);

  const $t = () =>
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      }),
    E = useCallback((H?: any) => {
      ye(H);
      He(false);
      // Tapping "Profile" opens your own profile. This read meId from a
      // closure with no dependencies, so it was frozen at the first render —
      // before sign-in — and kept sending everyone to the seeded demo account.
      H === "profile" && pe(meIdRef.current);
      H === "circles" && me(undefined);
      H === "messages" && Ee(undefined);
      $t();
    }, []),
    ge = useCallback(
      (H?: any) => {
        pe(H);
        ye("profile");
        He(false);
        $t();
        if (H && H !== meId) apiRecordProfileVisit(H);
      },
      [meId],
    );

  // Deep-link hash support (#reel=..., #@handle, #post=..., #circle=...) & keyboard shortcuts
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return;
      if (hash.startsWith("reel=")) {
        ye("reels");
      } else if (hash.startsWith("@")) {
        const handle = hash.slice(1).toLowerCase();
        const person = c.find((p: any) => p.handle?.toLowerCase() === handle);
        if (person) {
          pe(person.id);
          ye("profile");
        }
      } else if (hash.startsWith("post=")) {
        const postId = hash.slice(5);
        if (postId) D(postId);
      } else if (hash.startsWith("circle=")) {
        const cid = hash.slice(7);
        if (cid) {
          me(cid);
          ye("circles");
        }
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [c]);

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement | null;
      const inInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k") {
        ev.preventDefault();
        X_local((prev: boolean) => !prev);
        return;
      }
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "n" && !inInput) {
        ev.preventDefault();
        W(true);
        return;
      }
      if (inInput || ev.metaKey || ev.ctrlKey || ev.altKey) return;

      const key = ev.key.toLowerCase();
      if (key === "g" && !gKeyTimerRef.current) {
        gKeyTimerRef.current = window.setTimeout(() => {
          gKeyTimerRef.current = null;
        }, 1100);
        return;
      }
      if (gKeyTimerRef.current) {
        window.clearTimeout(gKeyTimerRef.current);
        gKeyTimerRef.current = null;
        if (key === "s") E("settings");
        else if (key === "h") E("home");
        else if (key === "e") E("explore");
        else if (key === "r") E("reels");
        else if (key === "m") E("messages");
        else if (key === "c") E("circles");
        else if (key === "p") E("profile");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [E]);

  useEffect(() => {
    const H = document.documentElement;
    H.dataset.theme = K.theme;
    H.dataset.motion = K.reduceMotion ? "reduced" : "full";
  }, [K.theme, K.reduceMotion]);

  useEffect(() => {
    const H: Record<string, string> = {
      home: "Home",
      explore: "Explore",
      reels: "Reels",
      circles: "Circles",
      events: "Gatherings",
      notifications: "Notifications",
      messages: "Messages",
      bookmarks: "Saved",
      profile: Ft.name,
      settings: "Settings",
    };
    document.title = `${H[$] || "Home"} · Thursday`;
  }, [$, Ft.name]);

  useEffect(() => {
    const H = (Y?: any) => {
      const Q = Y.target?.closest("button, [role='button'], a");
      if (
        !Q ||
        Q.hasAttribute("data-no-ripple") ||
        Q.closest("[data-no-ripple]")
      )
        return;
      Q.classList.add("ripple-host");
      const oe = Q.getBoundingClientRect(),
        et = Math.max(oe.width, oe.height) * 2.1,
        dt = document.createElement("span");
      dt.className = "ripple";
      (Q.classList.contains("bg-forest") ||
        Q.classList.contains("text-white") ||
        Q.getAttribute("aria-label")?.toLowerCase().includes("close")) &&
        dt.classList.add("ripple-on-dark");
      dt.style.width = `${et}px`;
      dt.style.height = `${et}px`;
      dt.style.left = `${Y.clientX - oe.left}px`;
      dt.style.top = `${Y.clientY - oe.top}px`;
      Q.appendChild(dt);
      window.setTimeout(() => dt.remove(), 650);
    };
    window.addEventListener("pointerdown", H, {
      passive: true,
    });
    return () => window.removeEventListener("pointerdown", H);
  }, []);

  const je = (H?: any) => {
      g((Y?: any) => {
        const Q = Y.includes(H),
          oe = c.find((et?: any) => et.id === H);
        !Q &&
          oe &&
          Te(
            `Following ${oe.name}`,
            "Their new posts will appear in your Following feed.",
          );
        return Q ? Y.filter((et?: any) => et !== H) : [...Y, H];
      });
      apiToggleFollow(H);
    },
    m0 = (H?: any) => {
      const Y = {
        ...K,
        theme: H,
      };
      ae(Y);
      he(Y);
      apiUpdatePreferences(Y);
    },
    I0 = (H?: any) => {
      ae(H);
      he(H);
      apiUpdatePreferences(H);
    },
    tt = (H?: any, Y?: any) => {
      d((Q?: any) => Q.map((oe?: any) => (oe.id === H ? Y(oe) : oe)));
    },
    Vt = (H?: any) => {
      tt(H, (Y?: any) => ({
        ...Y,
        liked: !Y.liked,
        likes: Math.max(0, Y.likes + (Y.liked ? -1 : 1)),
      }));
      apiPostAction(H, "like");
    },
    V1 = (H?: any) => {
      let Y = false;
      tt(
        H,
        (Q?: any) => (
          (Y = !Q.saved),
          {
            ...Q,
            saved: !Q.saved,
          }
        ),
      );
      apiPostAction(H, "save");
      Y
        ? Te("Saved to your collection", "Find this post later under Saved.")
        : Te("Removed from saved");
    },
    P0 = (H?: any) => {
      tt(H, (Y?: any) => ({
        ...Y,
        reposts: Y.reposts + 1,
      }));
      apiPostAction(H, "repost");
      Te("Reposted to your circle", "Your circle will see this in their feed.");
    },
    C1 = (H?: any, Y?: any) => {
      d((Q?: any) =>
        Q.map((oe?: any) =>
          oe.id !== H || !oe.poll || oe.poll.votedOptionId
            ? oe
            : {
                ...oe,
                poll: {
                  ...oe.poll,
                  votedOptionId: Y,
                  options: oe.poll.options.map((et?: any) =>
                    et.id === Y
                      ? {
                          ...et,
                          votes: et.votes + 1,
                        }
                      : et,
                  ),
                },
              },
        ),
      );
      apiVotePoll(H, Y);
      Te("Vote counted", "You can see how the circle is leaning.");
    },
    Hs = (H?: any, Y?: any) => {
      const comment = {
        id: `comment_${Date.now()}`,
        authorId: meId,
        text: Y,
        time: "now",
        likes: 0,
      };
      tt(H, (Q?: any) => ({
        ...Q,
        comments: [...Q.comments, comment],
      }));
      apiAddComment(H, comment);
    },
    z1 = (H?: any, Y?: any, extras?: any) => {
      const Q = {
        id: `post_${Date.now()}`,
        authorId: meId,
        time: "now",
        text: H || "A small moment from today.",
        images: Y ? [Y] : [],
        imageAlt: Y ? "A moment shared with the Thursday circle" : undefined,
        likes: 0,
        reposts: 0,
        comments: [],
        liked: false,
        saved: false,
        topic: "Circle",
        place: extras?.place || fe.location,
        circleId: extras?.circleId || undefined,
        taggedIds: extras?.taggedIds || undefined,
        poll: extras?.poll || undefined,
        music: extras?.music || undefined,
      };
      d((oe?: any) => [Q, ...oe]);
      apiCreatePost(Q, fe);
      W(false);
      ye("home");
      $t();
      Te(
        "Posted to your circle",
        "Your moment is now part of the conversation.",
      );
    },
    handleCreateCirclePost = async (payload: any) => {
      const post = {
        id: `post_${Date.now()}`,
        authorId: meId,
        time: "now",
        text: payload?.text || "",
        images: payload?.image ? [payload.image] : [],
        likes: 0,
        reposts: 0,
        comments: [],
        liked: false,
        saved: false,
        topic: "Circle",
        circleId: payload?.circleId,
      };
      d((prev: any[]) => [post, ...prev]);
      await apiCreatePost(post, fe);
      Te("Posted to the circle", "Everyone in the room sees it live now.");
    },
    handleSaveDraft = (text?: string, image?: string, extras?: any) => {
      const draft = {
        id: `draft_${Date.now()}`,
        text: text || "",
        image,
        place: extras?.place,
        circleId: extras?.circleId,
        savedAt: `Today, ${new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}`,
      };
      setDrafts((prev: any[]) => [draft, ...prev]);
      apiSaveDraft(draft);
      Te("Draft saved", "Find it any time in your composer drafts.");
    },
    handleDeleteDraft = (draftId?: string) => {
      if (!draftId) return;
      setDrafts((prev: any[]) => prev.filter((dr) => dr.id !== draftId));
      apiDeleteDraft(draftId);
    },
    At_local = (H?: any) => {
      // Opening a story opens *that person's* stories only. The viewer used to
      // index into the flat list of everyone's stories, so finishing someone's
      // last story slid straight into the next person's — confusing and easy
      // to miss who you were actually watching. Scope the run to one author;
      // when their last story ends the viewer closes.
      const tapped = _.find((Q?: any) => Q.id === H);
      if (!tapped) {
        setHighlightViewerStories(null);
        return;
      }
      const own = _.filter((Q?: any) => Q.authorId === tapped.authorId);
      const start = own.findIndex((Q?: any) => Q.id === H);
      setHighlightViewerStories(own);
      de(start >= 0 ? start : 0);
    },
    handleOpenHighlight = (hl: any) => {
      const slideStory = {
        id: `hl_story_${hl.id}`,
        authorId: Ft.id,
        image: hl.image,
        caption: hl.caption || `${hl.title} · ${hl.count || 1} saved moments`,
      };
      setHighlightViewerStories([slideStory]);
      de(0);
    },
    handleCreateHighlight = (payload: any) => {
      const hl = {
        id: `h_${Date.now()}`,
        title: payload.title,
        image: payload.image,
        caption: payload.caption,
        count: 1,
      };
      setHighlights((prev: any[]) => [...prev, hl]);
      apiCreateHighlight(hl);
      Te("Highlight added", `“${hl.title}” is now pinned to your profile.`);
    },
    f0 = (H?: any) => {
      d((Y?: any) => Y.filter((Q?: any) => Q.id !== H));
      D(null);
      apiDeletePost(H);
      Te("Post deleted", "It has been removed from your profile and feeds.");
    },
    Zt = (H?: any, Y?: any) => {
      let Q = R.find((et?: any) => et.personId === H);
      if (!Q) {
        Q = {
          id: `conv_${H}_${Date.now()}`,
          personId: H,
          messages: [],
          unread: 0,
          online: false,
          lastActive: "Active recently",
        };
        z((et?: any) => [Q, ...et]);
      }
      const oe = Q;
      const storyTarget = _.find((s: any) => s.authorId === H);
      if (storyTarget) {
        apiReplyStory(storyTarget.id, H, Y);
      }
      setTimeout(
        () =>
          L1(oe.id, {
            from: "me",
            text: Y,
            time: new Date().toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
          }),
        0,
      );
      de(null);
      setHighlightViewerStories(null);
      Ee(H);
      ye("messages");
      Te("Reply sent", "Your story reply is waiting in Messages.");
    },
    Ss = (H?: any) => {
      d((Y?: any) =>
        Y.map((Q?: any) =>
          Q.id === H
            ? {
                ...Q,
                pinned: !Q.pinned,
              }
            : Q,
        ),
      );
      apiPostAction(H, "pin");
      Te("Profile updated", "Pinned posts appear first on your profile.");
    },
    Vs = (H?: any, Y?: any, closeFriends?: boolean) => {
      const story = {
        id: `story_${Date.now()}`,
        authorId: meId,
        image: Y,
        caption: H,
        closeFriends: Boolean(closeFriends),
      };
      j((Q?: any) => [story, ...Q]);
      apiCreateStory(story);
      Te(
        "Added to your story",
        closeFriends
          ? "Shared privately with your close friends."
          : "Your circle can see it for the next 24 hours.",
      );
    },
    Cs = useCallback(
      (H?: any) => {
        U((Y?: any) => (Y.includes(H) ? Y : [...Y, H]));
        apiMarkStorySeen(H);
      },
      [U],
    ),
    L1 = (H?: any, Y?: any) => {
      const msg = {
        ...Y,
        id: `msg_${Date.now()}`,
      };
      let personId = "";
      z((Q?: any) =>
        Q.map((oe?: any) => {
          if (oe.id !== H) return oe;
          personId = oe.personId;
          return {
            ...oe,
            messages: [...oe.messages, msg],
            unread: 0,
          };
        }),
      );
      apiSendMessage(H, msg, personId);
      apiSendTyping(H, false);
    },
    sendTyping = (H?: any, typing?: boolean) => {
      apiSendTyping(H, Boolean(typing));
    },
    sendCallSignal = (payload?: any) => {
      if (!payload) return;
      apiSendCallSignal(payload);
      setCallLog((prev: any[]) => [...prev.slice(-30), payload]);
    },
    recordVisit = (H?: any) => {
      if (!H || H === meId) return;
      apiRecordProfileVisit(H);
    },
    la = (H?: any, Y?: any, Q?: any) => {
      z((oe?: any) =>
        oe.map((et?: any) =>
          et.id === H
            ? {
                ...et,
                messages: et.messages.map((dt?: any) => {
                  if (dt.id !== Y) return dt;
                  const e1 = dt.reactions ?? [];
                  return {
                    ...dt,
                    reactions: e1.includes(Q)
                      ? e1.filter((t1?: any) => t1 !== Q)
                      : [...e1, Q],
                  };
                }),
              }
            : et,
        ),
      );
      apiReactMessage(H, Y, Q);
    },
    na = (H?: any) => {
      z((Y?: any) =>
        Y.map((Q?: any) =>
          Q.id === H
            ? {
                ...Q,
                unread: 0,
              }
            : Q,
        ),
      );
      apiUpdateConversation(H, { unread: 0 });
      apiMarkThreadRead(H);
    },
    N0 = (H?: any) => {
      let nextPinned = false;
      z((Y?: any) =>
        Y.map((Q?: any) => {
          if (Q.id !== H) return Q;
          nextPinned = !Q.pinned;
          return { ...Q, pinned: nextPinned };
        }),
      );
      apiUpdateConversation(H, { pinned: nextPinned });
    },
    sa = (H?: any) => {
      let nextMuted = false;
      z((Y?: any) =>
        Y.map((Q?: any) => {
          if (Q.id !== H) return Q;
          nextMuted = !Q.muted;
          return { ...Q, muted: nextMuted };
        }),
      );
      apiUpdateConversation(H, { muted: nextMuted });
    },
    T1 = (H?: any) => {
      let nextArchived = true;
      z((Y?: any) =>
        Y.map((Q?: any) => {
          if (Q.id !== H) return Q;
          nextArchived = !Q.archived;
          return {
            ...Q,
            archived: nextArchived,
            unread: 0,
          };
        }),
      );
      apiUpdateConversation(H, { archived: nextArchived, unread: 0 });
      Te(
        nextArchived ? "Conversation archived" : "Conversation restored",
        nextArchived
          ? "Find it again under Archived in your inbox."
          : "Moved back to your main inbox.",
      );
    },
    zs = (H?: any) => {
      z((Y?: any) =>
        Y.map((Q?: any) =>
          Q.id === H
            ? {
                ...Q,
                request: false,
                unread: 0,
              }
            : Q,
        ),
      );
      apiUpdateConversation(H, { request: false, unread: 0 });
      Te("Request accepted", "You can reply now.");
    },
    Wl = (H?: any) => {
      z((Y?: any) => Y.filter((Q?: any) => Q.id !== H));
      apiDeleteConversation(H);
      Te(
        "Request removed",
        "The conversation was deleted without notifying them.",
      );
    },
    Ka = (H?: any) => {
      const Y = R.find((Q?: any) => Q.personId === H);
      if (Y) {
        z((Q?: any) =>
          Q.map((oe?: any) =>
            oe.id === Y.id
              ? {
                  ...oe,
                  request: false,
                  archived: false,
                }
              : oe,
          ),
        );
        apiUpdateConversation(Y.id, { request: false, archived: false });
        Ee(H);
        return;
      }
      const newConvId = `conv_${H}_${Date.now()}`;
      z((Q?: any) => [
        {
          id: newConvId,
          personId: H,
          messages: [],
          unread: 0,
          online: false,
          lastActive: "Active recently",
        },
        ...Q,
      ]);
      apiStartConversation(H, newConvId);
      Ee(H);
    },
    w0 = (H?: any) => {
      Ee(H);
      ye("messages");
      $t();
    },
    Ls = (H?: any) => {
      w((Q?: any) =>
        Q.map((oe?: any) =>
          oe.id === H
            ? {
                ...oe,
                joined: !oe.joined,
                members: oe.members + (oe.joined ? -1 : 1),
              }
            : oe,
        ),
      );
      apiToggleCircle(H);
      const Y = x.find((Q?: any) => Q.id === H);
      Y &&
        Te(
          Y.joined ? `Left ${Y.name}` : `Welcome to ${Y.name}`,
          Y.joined
            ? "You can rejoin any time."
            : "Say hello, or just read for a while.",
        );
    },
    handleCreateCircle = (payload: any) => {
      const newCircle = {
        id: `circle_${Date.now()}`,
        name: payload.name,
        tagline: payload.tagline,
        description: payload.description,
        category: payload.category,
        image: payload.image,
        members: 1,
        posts: 0,
        accent: "forest",
        joined: true,
        moderatorIds: [meId],
        activity: "Started just now",
        spots: "Open to everyone",
      };
      w((prev: any[]) => [newCircle, ...prev]);
      apiCreateCircle(newCircle);
      me(newCircle.id);
      Te(`Started ${newCircle.name}`, "Your new circle is open and ready.");
    },
    Il = (H?: any) => {
      T((Q?: any) =>
        Q.map((oe?: any) =>
          oe.id === H
            ? {
                ...oe,
                joined: !oe.joined,
                attendees: oe.attendees + (oe.joined ? -1 : 1),
                spotsLeft: oe.spotsLeft + (oe.joined ? 1 : -1),
              }
            : oe,
        ),
      );
      apiToggleEventRsvp(H);
      const Y = A.find((Q?: any) => Q.id === H);
      Y &&
        Te(
          Y.joined ? "You're no longer going" : `You're going to ${Y.title}`,
          Y.joined
            ? "Your spot has been released."
            : `${Y.weekday} ${Y.day}, ${Y.time}`,
        );
    },
    handleCreateGathering = (payload: any) => {
      const parsed = new Date(`${payload.date}T12:00:00`);
      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const newEvent = {
        id: `event_${Date.now()}`,
        title: payload.title,
        description: payload.description,
        date: payload.date,
        day: String(parsed.getDate() || 28).padStart(2, "0"),
        weekday: weekdays[parsed.getDay() || 6],
        time: payload.time,
        place: payload.place,
        hostId: meId,
        circleId: payload.circleId,
        attendees: 1,
        image: payload.image,
        cost: payload.cost,
        spotsLeft: payload.spotsLeft,
        joined: true,
      };
      T((prev: any[]) => [newEvent, ...prev]);
      apiCreateEvent(newEvent);
      Te(
        "Gathering published",
        `${newEvent.title} is now listed in Gatherings.`,
      );
    },
    _1 = useCallback((H?: any) => {
      me(H);
      ye("circles");
      He(false);
      $t();
    }, []),
    Pl = (H?: any) => {
      te((Y?: any) =>
        Y.map((Q?: any) =>
          Q.id === H
            ? {
                ...Q,
                liked: !Q.liked,
                likes: Q.likes + (Q.liked ? -1 : 1),
              }
            : Q,
        ),
      );
      apiReelAction(H, "like");
    },
    Wa = (H?: any) => {
      let Y = false;
      te((Q?: any) =>
        Q.map((oe?: any) =>
          oe.id !== H
            ? oe
            : ((Y = !oe.saved),
              {
                ...oe,
                saved: !oe.saved,
              }),
        ),
      );
      apiReelAction(H, "save");
      Te(
        Y ? "Reel saved" : "Reel removed",
        Y ? "Find it in Saved." : undefined,
      );
    },
    Ia = (H?: any) => {
      te((Y?: any) =>
        Y.map((Q?: any) =>
          Q.id === H.id
            ? {
                ...Q,
                shares: Q.shares + 1,
              }
            : Q,
        ),
      );
      shareContent({
        title: `Reel by ${c.find((Y?: any) => Y.id === H.authorId)?.name ?? "someone on Thursday"}`,
        text: H.caption,
        url: `${window.location.origin}${window.location.pathname}#reel=${H.id}`,
      }).then((Y?: any) => {
        Y === "copied"
          ? Te(
              "Reel link copied",
              "Paste it anywhere — Thursday never adds a tracking tag.",
            )
          : Y === "shared" && Te("Reel shared");
      });
    },
    en = (H?: any) => {
      te((Y?: any) => [H, ...Y]);
      apiCreateReel(H);
      Te("Your reel is live", "It is at the front of your Reels feed.");
    },
    tn = (H?: any, Y?: any) => {
      const comment = {
        id: `reel_c_${Date.now()}`,
        authorId: meId,
        text: Y,
        time: "now",
        likes: 0,
      };
      te((Q?: any) =>
        Q.map((oe?: any) =>
          oe.id === H
            ? {
                ...oe,
                comments: [...oe.comments, comment],
              }
            : oe,
        ),
      );
      apiReelAction(H, "comments", comment);
    },
    handleVotePrompt = (promptId: string, option: string) => {
      setPromptVotes((prev: any) => ({ ...prev, [promptId]: option }));
      setPrompts((prev: any[]) =>
        prev.map((p) =>
          p.id === promptId ? { ...p, votes: Number(p.votes || 0) + 1 } : p,
        ),
      );
      apiVotePrompt(promptId, option);
    },
    handleToggleSaveGuide = (guideId: string) => {
      let nextSaved = false;
      setSavedGuideIds((prev: string[]) => {
        nextSaved = !prev.includes(guideId);
        return nextSaved ? [...prev, guideId] : prev.filter((xId) => xId !== guideId);
      });
      apiSaveGuideProgress(guideId, { saved: nextSaved });
    },
    handleToggleGuideStep = (guideId: string, stepIdx: number) => {
      setGuideSteps((prev: Record<string, number[]>) => {
        const curr = prev[guideId] || [];
        const next = curr.includes(stepIdx)
          ? curr.filter((idx) => idx !== stepIdx)
          : [...curr, stepIdx];
        apiSaveGuideProgress(guideId, { completedSteps: next });
        return { ...prev, [guideId]: next };
      });
    },
    h0 = () => {
      downloadTextFile(
        `thursday-workspace-${new Date().toISOString().slice(0, 10)}.json`,
        exportWorkspaceSnapshot(),
      );
      Te("Workspace exported", "A JSON copy of your workspace is downloading.");
    },
    handleImportWorkspace = (rawJson: string) => {
      try {
        const count = importWorkspaceSnapshot(rawJson);
        Te("Backup imported", `Restored ${count} workspace collections. Reloading…`);
        window.setTimeout(() => window.location.reload(), 650);
      } catch (err) {
        Te(
          "Could not import file",
          err instanceof Error ? err.message : "Choose a valid Thursday JSON backup.",
        );
      }
    },
    ut = () => {
      apiResetBackend();
      clearWorkspaceStorage();
      window.location.reload();
    },
    Nt = () => {
      switch ($) {
        case "explore":
          return (
            <ExploreView
              people={c}
              posts={m}
              circles={x}
              meId={meId}
              onlineIds={onlineIds}
              followingIds={y}
              onToggleFollow={je}
              onOpenPerson={ge}
              onOpenPost={(H?: any) => D(H.id ?? H)}
              onLike={Vt}
              onSave={V1}
              onRepost={P0}
              onVote={C1}
              onOpenCircle={_1}
            />
          );
        case "ai":
          return <AiView me={fe} onToast={Te} />;
        case "reels":
          return createPortal(
            <ReelsView
              reels={J}
              people={c}
              me={fe}
              meId={meId}
              onlineIds={onlineIds}
              followingIds={y}
              onToggleFollow={je}
              onLike={Pl}
              onSave={Wa}
              onShare={Ia}
              onAddComment={tn}
              onOpenPerson={ge}
              onCreateReel={en}
              onRecordView={apiRecordReelView}
              onOpenMessages={() => E("inbox")}
              onClose={() => E("home")}
            />,
            document.body,
          );
        case "circles":
          return (
            <CirclesView
              circles={x}
              events={A}
              people={c}
              posts={m}
              me={fe}
              meId={meId}
              onlineIds={onlineIds}
              onCreatePost={handleCreateCirclePost}
              initialSelectedId={I}
              onToggleCircle={Ls}
              onCreate={() => setCreateCircleOpen(true)}
              onOpenPerson={ge}
              onLike={Vt}
              onSave={V1}
              onRepost={P0}
              onOpenPost={(H?: any) => D(H)}
              onVote={C1}
            />
          );
        case "events":
          return (
            <GatheringsView
              events={A}
              circles={x}
              people={c}
              meId={meId}
              onlineIds={onlineIds}
              onToggleEvent={Il}
              onOpenPerson={ge}
              onSuggest={() => setCreateGatheringOpen(true)}
              onOpenCircle={_1}
              onMessage={w0}
            />
          );
        case "notifications":
          return (
            <NotificationsView
              notices={v}
              people={c}
              posts={m}
              onOpenPost={(H?: any) => D(H.id ?? H)}
              onToggleFollow={je}
              followingIds={y}
              onMarkAllRead={() => {
                q((H?: any) =>
                  H.map((Y?: any) => ({
                    ...Y,
                    unread: false,
                  })),
                );
                apiMarkNotificationsRead();
                Te("All caught up", "Notifications marked as read.");
              }}
              onOpenPerson={ge}
            />
          );
        case "messages":
          return (
            <InboxView
              key={le ?? "inbox"}
              me={fe}
              meId={meId}
              onlineIds={onlineIds}
              people={c}
              conversations={R}
              followingIds={y}
              readReceipts={K.privacy.readReceipts}
              initialPersonId={le}
              onSend={L1}
              onReact={la}
              onTyping={sendTyping}
              onCallSignal={sendCallSignal}
              onMarkRead={na}
              onTogglePin={N0}
              onToggleMute={sa}
              onArchive={T1}
              onAcceptRequest={zs}
              onDeclineRequest={Wl}
              onStartConversation={Ka}
              onOpenPerson={ge}
              onToggleFollow={je}
              onToast={Te}
            />
          );
        case "bookmarks":
          return (
            <BookmarksView
              posts={m}
              people={c}
              meId={meId}
              onlineIds={onlineIds}
              onLike={Vt}
              onSave={V1}
              onRepost={P0}
              onOpenPost={(H?: any) => D(H.id)}
              onOpenPerson={ge}
              onExplore={() => E("explore")}
              circles={x}
              onVote={C1}
              onOpenCircle={_1}
            />
          );
        case "profile":
          return (
            <ProfileView
              key={Ft.id}
              person={Ft}
              isMe={Ft.id === meId}
              visitors={Ft.id === meId ? visitors : []}
              onlineIds={onlineIds}
              meId={meId}
              posts={m}
              people={c}
              stories={_}
              highlights={highlights}
              onOpenStory={At_local}
              onToggleBlock={handleSetBlock}
              onToggleMute={handleSetMute}
              onReport={(type: string, id: string) => setReportTarget({ type, id })}
              onOpenHighlight={handleOpenHighlight}
              onAddHighlight={() => setCreateHighlightOpen(true)}
              onToast={Te}
              followingIds={y}
              onToggleFollow={je}
              onOpenPost={(H?: any) => D(H.id)}
              onLike={Vt}
              onSave={V1}
              onRepost={P0}
              onOpenPerson={ge}
              onMessage={w0}
              onShare={() => {
                shareContent({
                  title: `${Ft.name} on Thursday`,
                  text: Ft.bio,
                  url: `${window.location.origin}${window.location.pathname}#@${Ft.handle}`,
                }).then((H?: any) => {
                  H === "copied"
                    ? Te(
                        "Profile link copied",
                        "Paste it anywhere to share this profile.",
                      )
                    : H === "shared" && Te("Profile shared");
                });
              }}
              onEdit={() => h(true)}
              circles={x}
              onVote={C1}
              onOpenCircle={_1}
            />
          );
        case "settings":
          return (
            <SettingsView
              me={fe}
              preferences={K}
              draftsCount={drafts.length}
              savedGuidesCount={savedGuideIds.length}
              stats={{
                circles: x.filter((H?: any) => H.joined).length,
                saved:
                  m.filter((H?: any) => H.saved).length +
                  J.filter((H?: any) => H.saved).length,
                conversations: R.filter((H?: any) => !H.request).length,
                following: y.length,
              }}
              onUpdate={I0}
              onEditProfile={() => h(true)}
              onExport={h0}
              onImportWorkspace={handleImportWorkspace}
              onReloadFromStorage={() => window.location.reload()}
              onReset={ut}
              onToast={Te}
              onOpenPerson={ge}
              onSignOut={handleSignOut}
              onBackHome={() => E("home")}
              blockedPeople={c.filter((p: any) => (blockedIds || []).includes(p.id))}
              mutedPeople={c.filter((p: any) => (mutedIds || []).includes(p.id))}
              onUnblock={(id: string) => handleSetBlock(id, false)}
              onUnmute={(id: string) => handleSetMute(id, false)}
              onChangePassword={async (currentPassword: string, newPassword: string) => {
                const res = await apiChangePassword(currentPassword, newPassword);
                return {
                  ok: res.ok,
                  error: res.ok ? undefined : res.error || "Could not change your password.",
                };
              }}
              onDeleteAccount={async (password: string, confirm: string) => {
                const res = await apiDeleteAccount(password, confirm);
                if (res.ok) {
                  resetStoredWorkspaceState();
                  setAuthUser(null);
                  window.location.reload();
                  return { ok: true };
                }
                return {
                  ok: false,
                  error: res.error || "Could not delete your account.",
                };
              }}
            />
          );
        default:
          return (
            <FeedView
              me={fe}
              meId={meId}
              onlineIds={onlineIds}
              people={c}
              posts={m}
              stories={_}
              circles={x}
              events={A}
              reels={J}
              prompts={prompts}
              guides={guides}
              promptVotes={promptVotes}
              onVotePrompt={handleVotePrompt}
              savedGuideIds={savedGuideIds}
              guideSteps={guideSteps}
              onToggleSaveGuide={handleToggleSaveGuide}
              onToggleGuideStep={handleToggleGuideStep}
              followingIds={y}
              seenStories={C}
              onToggleFollow={je}
              onLike={Vt}
              onSave={V1}
              onRepost={P0}
              onVote={C1}
              onOpenPost={(H?: any) => D(H.id)}
              onOpenPerson={ge}
              onOpenCircle={_1}
              onOpenCircles={() => E("circles")}
              onOpenEvents={() => E("events")}
              onOpenReels={() => E("reels")}
              onCompose={() => W(true)}
              onOpenStory={At_local}
              onCreateStory={() => u0(true)}
              onExplore={() => E("explore")}
            />
          );
      }
    };

  const handleEditPost = useCallback(
    async (post: any, nextText: string) => {
      if (!post?.id) return;
      d((prev: any[]) =>
        prev.map((p: any) =>
          p.id === post.id
            ? { ...p, text: nextText, editedAt: new Date().toISOString() }
            : p,
        ),
      );
      await apiEditPost(post.id, { text: nextText });
      Te("Post updated", "Everyone in your circle sees the new version.");
    },
    [Te],
  );

  const handleSharePost = useCallback(
    async (post: any) => {
      if (!post?.id) return;
      const url = `${window.location.origin}${window.location.pathname}#post=${post.id}`;
      const outcome = await shareContent({
        title: "A note on Thursday",
        text: post.text?.slice(0, 140) || "A note from my circle on Thursday.",
        url,
      });
      if (outcome === "copied") {
        Te("Link copied", "Paste it anywhere to share this note.");
      } else if (outcome === "shared") {
        Te("Shared", "Thanks for passing it along.");
      }
    },
    [Te],
  );

  const postActions = {
    meId,
    onlineIds,
    onEdit: (post: any) => {
      D(post.id);
    },
    onDeletePost: f0,
    onPinPost: Ss,
    onSharePost: handleSharePost,
    onSaveEdit: handleEditPost,
    onOpenTopic: (tag: string) => {
      ye("explore");
      He(false);
      $t();
      window.location.hash = `topic=${tag}`;
    },
    onOpenHandle: (handle: string) => {
      const person = c.find(
        (p: any) => p.handle?.toLowerCase() === String(handle).toLowerCase(),
      );
      if (person) ge(person.id);
    },
  };

  const activeViewerStories = highlightViewerStories ?? _;

  // Blocking and muting are optimistic: the list updates immediately, then the
  // server confirms. If it fails we put the list back.
  const handleSetBlock = useCallback(
    async (personId: string, blocked: boolean) => {
      const before = blockedIds;
      setBlockedIds((prev) =>
        blocked ? Array.from(new Set([...prev, personId])) : prev.filter((id) => id !== personId),
      );
      const res = await apiBlockPerson(personId, blocked);
      if (!res.ok) {
        setBlockedIds(before);
        Te(
          "Could not update block",
          res.error || "Please try again.",
        );
        return;
      }
      const confirmed = (res.data?.blockedIds as string[]) || [];
      if (Array.isArray(confirmed)) setBlockedIds(confirmed);
      // The server unfollows on block; mirror that locally or the person
      // lingers in the "Following" list with no way back.
      if (blocked) {
        const following = (res.data?.followingIds as string[]) || [];
        if (Array.isArray(following)) g(following);
        else g((prev: string[]) => prev.filter((id) => id !== personId));
      }
      u((people: any[]) =>
        blocked ? people.filter((p) => p.id !== personId) : people,
      );
      Te(
        blocked ? "Blocked" : "Unblocked",
        blocked
          ? "They can no longer message you or appear in your feed."
          : "You can see each other again.",
      );
    },
    [blockedIds, Te],
  );

  const handleSetMute = useCallback(
    async (personId: string, muted: boolean) => {
      const before = mutedIds;
      setMutedIds((prev) =>
        muted ? Array.from(new Set([...prev, personId])) : prev.filter((id) => id !== personId),
      );
      const res = await apiMutePerson(personId, muted);
      if (!res.ok) {
        setMutedIds(before);
        Te("Could not update mute", res.error || "Please try again.");
        return;
      }
      const confirmed = (res.data?.mutedIds as string[]) || [];
      if (Array.isArray(confirmed)) setMutedIds(confirmed);
      Te(muted ? "Muted" : "Unmuted", muted ? "You won't be notified about them." : "Their updates are back.");
    },
    [mutedIds, Te],
  );

  const handleAuthenticated = useCallback(
    (user: AuthUser) => {
      setAuthUser(user);
      setAuthChecked(true);
      pe(user.id);
      ye("home");
      // Fresh account caches are scoped per-account, so allow state to rehydrate.
      window.setTimeout(() => window.dispatchEvent(new Event("resize")), 30);
    },
    [],
  );

  const handleSignOut = useCallback(async () => {
    await apiLogout();
    resetStoredWorkspaceState();
    setAuthUser(null);
    setOnlineIds([]);
    setLive(false);
    setVisitors([]);
    setIncomingCall(null);
    pe(ME_ID);
    ye("home");
    Te("Signed out", "See you next Thursday.");
  }, [Te]);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <ColdStartSplash onDone={() => {}} />
      </div>
    );
  }

  if (!authUser) {
    return (
      <AuthView
        theme={K.theme}
        onToggleTheme={m0}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  const meOnline = onlineIds.includes(meId);

  return (
    <PostActionsContext.Provider value={postActions}>
    <div className="min-h-screen bg-canvas">
      {pt ? <ColdStartSplash onDone={() => St(false)} /> : null}
      <ScrollProgressBar />
      <DesktopSidebar
        view={$}
        me={fe}
        live={live}
        onlineIds={onlineIds}
        onSignOut={handleSignOut}
        unreadNotices={A0}
        unreadMessages={s0}
        followingIds={y}
        blockedIds={blockedIds}
        people={c}
        circles={x}
        events={A}
        theme={K.theme}
        onToggleTheme={m0}
        onNavigate={E}
        onCreate={() => W(true)}
        onOpenPerson={ge}
      />
      <MobileDrawer
        open={Ce}
        onClose={() => He(false)}
        view={$}
        me={fe}
        live={live}
        onlineIds={onlineIds}
        onSignOut={handleSignOut}
        unreadNotices={A0}
        unreadMessages={s0}
        followingIds={y}
        blockedIds={blockedIds}
        people={c}
        circles={x}
        events={A}
        theme={K.theme}
        onToggleTheme={m0}
        onNavigate={E}
        onCreate={() => W(true)}
        onOpenPerson={ge}
      />
      <div className="lg:pl-[264px]">
        <TopBar
          view={$}
          me={fe}
          live={live}
          onlineCount={onlineIds.length}
          onlineIds={onlineIds}
          onSignOut={handleSignOut}
          unreadNotices={A0}
          unreadMessages={s0}
          onSearch={() => X_local(true)}
          onNavigate={E}
          onOpenPerson={ge}
          mobileNavOpen={Ce}
          onOpenMobile={() => He(true)}
        />
        <main className="min-h-[calc(100dvh-64px)] pb-16 lg:pb-0">
          <div key={$} className="animate-page">
            {Nt()}
          </div>
        </main>
      </div>
      <MobileBottomDock view={$} onNavigate={E} onCreate={() => W(true)} />
      <ComposerModal
        open={V}
        onClose={() => W(false)}
        me={fe}
        people={c}
        circles={x}
        drafts={drafts}
        onSubmit={z1}
        onSaveDraft={handleSaveDraft}
        onDeleteDraft={handleDeleteDraft}
        photoOptions={COMPOSER_PHOTO_PRESETS}
      />
      <PostDetailModal
        onDelete={f0}
        post={Ae}
        author={d0}
        me={fe}
        people={c}
        onClose={() => D(null)}
        onLike={() => Ae && Vt(Ae.id)}
        onSave={() => Ae && V1(Ae.id)}
        onRepost={() => Ae && P0(Ae.id)}
        onAddComment={(H?: any) => Ae && Hs(Ae.id, H)}
        onOpenPerson={(H?: any) => {
          D(null);
          ge(H);
        }}
        onVote={C1}
        onTogglePinPost={Ss}
      />
      <StoryComposerModal
        open={Mt}
        onClose={() => u0(false)}
        onShare={Vs}
        me={fe}
      />
      <CreateHighlightModal
        open={createHighlightOpen}
        onClose={() => setCreateHighlightOpen(false)}
        onCreate={handleCreateHighlight}
      />
      <CreateCircleModal
        open={createCircleOpen}
        onClose={() => setCreateCircleOpen(false)}
        onCreate={handleCreateCircle}
      />
      <CreateGatheringModal
        open={createGatheringOpen}
        onClose={() => setCreateGatheringOpen(false)}
        circles={x}
        onCreate={handleCreateGathering}
      />
      {ve !== null ? (
        <StoryViewerModal
          stories={activeViewerStories}
          people={c}
          index={ve}
          onClose={() => {
            de(null);
            setHighlightViewerStories(null);
          }}
          onChange={de}
          onSeen={Cs}
          onReply={Zt}
          meId={meId}
        />
      ) : null}
      <SearchPaletteModal
        open={G}
        onClose={() => X_local(false)}
        people={c}
        posts={m}
        topics={TOPICS}
        meId={meId}
        onOpenPerson={ge}
        onOpenPost={(H?: any) => D(H.id)}
        onOpenTopic={() => E("explore")}
        onNavigate={E}
        onCreate={() => W(true)}
      />
      <EditProfileModal
        open={se}
        onClose={() => h(false)}
        me={fe}
        onSave={async (H?: any) => {
          const updatedMe = { ...fe, ...H };
          // Optimistic: paint it immediately so the profile never looks blank.
          u((Y?: any) =>
            Y.map((Q?: any) => (Q.id === meId ? updatedMe : Q)),
          );
          const result = await apiUpdateMeDetailed(updatedMe);
          if (!result.ok) {
            // Put the previous values back rather than leaving a photo on screen
            // that the server never accepted.
            u((Y?: any) =>
              Y.map((Q?: any) => (Q.id === meId ? fe : Q)),
            );
            return {
              ok: false,
              error:
                result.error ||
                "Could not save your profile. Please try again.",
            };
          }
          if (result.data?.me) {
            const confirmed = { ...updatedMe, ...result.data.me };
            u((Y?: any) =>
              Y.map((Q?: any) => (Q.id === meId ? confirmed : Q)),
            );
            if (authUser) {
              const nextUser = {
                ...authUser,
                handle: confirmed.handle || authUser.handle,
                profile: { ...authUser.profile, ...confirmed },
              } as AuthUser;
              setAuthUser(nextUser);
              saveAuthSession(getAuthToken(), nextUser);
            }
          } else if (authUser) {
            const nextUser = {
              ...authUser,
              handle: updatedMe.handle || authUser.handle,
              profile: { ...authUser.profile, ...updatedMe },
            } as AuthUser;
            setAuthUser(nextUser);
            saveAuthSession(getAuthToken(), nextUser);
          }
          Te(
            "Profile updated",
            "Your circle will see the new details right away.",
          );
          return { ok: true };
        }}
      />
      <ReportModal
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
        reasons={REPORT_REASONS}
        targetLabel={
          reportTarget?.type === "person"
            ? `@${c.find((p: any) => p.id === reportTarget.id)?.handle || "this person"}`
            : undefined
        }
        onSubmit={async ({ reason, note }: any) =>
          apiReportContent({
            targetType: (reportTarget?.type || "person") as any,
            targetId: reportTarget?.id || "",
            reason,
            note,
          }).then((res) => ({
            ok: res.ok,
            error: res.ok ? undefined : res.error,
          }))
        }
      />
      {incomingCall ? (
        <IncomingCallBanner
          call={incomingCall}
          people={c}
          onAccept={(call: any) => {
            const other = c.find((p: any) => p.id === call.fromUserId);
            setCallLog((prev: any[]) => [...prev, { ...call, type: "accept" }]);
            apiSendCallSignal({ ...call, type: "accept" });
            if (other) {
              Ee(other.id);
              ye("messages");
            }
            Te(
              "Nudge accepted",
              `${other?.name ?? "Your friend"} accepted — say hello in the chat.`,
            );
            setIncomingCall(null);
          }}
          onDecline={(call: any) => {
            apiSendCallSignal({ ...call, type: "decline" });
            setIncomingCall(null);
            Te("Call declined");
          }}
        />
      ) : null}
      <BackToTopButton />
      {qe ? (
        <ToastBanner
          key={qe.id}
          title={qe.title}
          description={qe.description}
          onDismiss={() => De(null)}
        />
      ) : null}
    </div>
    </PostActionsContext.Provider>
  );
}

function ScrollProgressBar() {
  const [c, u] = useState<any>(0);
  useEffect(() => {
    const m = () => {
      const d = document.documentElement,
        x = d.scrollHeight - d.clientHeight;
      u(x > 0 ? Math.min(1, d.scrollTop / x) : 0);
    };
    m();
    window.addEventListener("scroll", m, {
      passive: true,
    });
    window.addEventListener("resize", m);
    return () => {
      window.removeEventListener("scroll", m);
      window.removeEventListener("resize", m);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] bg-transparent">
      <div
        className="scroll-progress h-full bg-forest transition-[transform] duration-150 ease-out"
        style={{
          transform: `scaleX(${c})`,
        }}
      />
    </div>
  );
}

function BackToTopButton() {
  const [c, u] = useState<any>(false);
  useEffect(() => {
    const m = () => u(window.scrollY > 900);
    m();
    window.addEventListener("scroll", m, {
      passive: true,
    });
    return () => window.removeEventListener("scroll", m);
  }, []);
  return c ? (
    <button
      type="button"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        })
      }
      aria-label="Back to top"
      className="animate-pop fixed right-4 bottom-20 z-40 inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-[0_8px_24px_rgba(16,19,24,0.14)] transition-colors hover:border-line-strong hover:bg-canvas-deep sm:right-6 lg:bottom-6"
    >
      <ArrowUp size={16} weight="bold" aria-hidden="true" />
    </button>
  ) : null;
}
