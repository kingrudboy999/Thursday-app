import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUp } from "./lib/icons";
import { ColdStartSplash } from "./components/brand";
import { StoryComposerModal } from "./components/features";
import {
  ComposerModal,
  DesktopSidebar,
  EditProfileModal,
  MobileBottomDock,
  MobileDrawer,
  PostDetailModal,
  SearchPaletteModal,
  StoryViewerModal,
  TopBar,
} from "./components/social-shell";
import { ToastBanner } from "./components/social";
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
  exportWorkspaceSnapshot,
  useStoredState,
} from "./lib/storage";
import { NotificationsView } from "./views/Connect";
import { BookmarksView, ExploreView } from "./views/Explore";
import { FeedView } from "./views/Feed";
import { InboxView } from "./views/Inbox";
import { ProfileView } from "./views/Profile";
import { ReelsView } from "./views/Reels";
import { SettingsView } from "./views/SettingsView";
import { CirclesView, GatheringsView } from "./views/Spaces";

const DEFAULT_FOLLOWING_IDS = ["maya", "priya", "jonah"];
const COMPOSER_PHOTO_PRESETS = {
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
    [R, z] = useStoredState("conversations", INITIAL_CONVERSATIONS),
    [v, q] = useStoredState("notices", INITIAL_NOTICES),
    [_, j] = useState<any>(INITIAL_STORIES),
    [C, U] = useStoredState("seenStories", []),
    [J, te] = useStoredState("reels", INITIAL_REELS),
    [Ne, he] = useStoredState("preferences", DEFAULT_PREFERENCES),
    [K, ae] = useState<any>(() => ({
      ...DEFAULT_PREFERENCES,
      ...Ne,
    })),
    [$, ye] = useState<any>("home"),
    [Ve, pe] = useState<any>(ME_ID),
    [le, Ee] = useState<any>(undefined),
    [Ce, He] = useState<any>(false),
    [V, W] = useState<any>(false),
    [G, X_local] = useState<any>(false),
    [se, h] = useState<any>(false),
    [k, D] = useState<any>(null),
    [I, me] = useState<any>(undefined),
    [ve, de] = useState<any>(null),
    [qe, De] = useState<any>(null),
    [pt, St] = useState<any>(true),
    [Mt, u0] = useState<any>(false),
    fe = c.find((H?: any) => H.id === ME_ID) ?? c[0],
    Ae = m.find((H?: any) => H.id === k) ?? null,
    d0 = Ae ? (c.find((H?: any) => H.id === Ae.authorId) ?? null) : null,
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
  const $t = () =>
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      }),
    E = useCallback((H?: any) => {
      ye(H);
      He(false);
      H === "profile" && pe(ME_ID);
      H === "circles" && me(undefined);
      H === "messages" && Ee(undefined);
      $t();
    }, []),
    ge = useCallback((H?: any) => {
      pe(H);
      ye("profile");
      He(false);
      $t();
    }, []);
  useEffect(() => {
    const H = document.documentElement;
    H.dataset.theme = K.theme;
    H.dataset.motion = K.reduceMotion ? "reduced" : "full";
  }, [K.theme, K.reduceMotion]);
  useEffect(() => {
    const H = {
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
    document.title = `${H[$]} · Thursday`;
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
    },
    m0 = (H?: any) => {
      const Y = {
        ...K,
        theme: H,
      };
      ae(Y);
      he(Y);
    },
    I0 = (H?: any) => {
      ae(H);
      he(H);
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
      Y
        ? Te("Saved to your collection", "Find this post later under Saved.")
        : Te("Removed from saved");
    },
    P0 = (H?: any) => {
      tt(H, (Y?: any) => ({
        ...Y,
        reposts: Y.reposts + 1,
      }));
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
      Te("Vote counted", "You can see how the circle is leaning.");
    },
    Hs = (H?: any, Y?: any) => {
      tt(H, (Q?: any) => ({
        ...Q,
        comments: [
          ...Q.comments,
          {
            id: `comment_${Date.now()}`,
            authorId: ME_ID,
            text: Y,
            time: "now",
            likes: 0,
          },
        ],
      }));
    },
    z1 = (H?: any, Y?: any) => {
      const Q = {
        id: `post_${Date.now()}`,
        authorId: ME_ID,
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
        place: fe.location,
      };
      d((oe?: any) => [Q, ...oe]);
      W(false);
      ye("home");
      $t();
      Te(
        "Posted to your circle",
        "Your moment is now part of the conversation.",
      );
    },
    At_local = (H?: any) => {
      const Y = _.findIndex((Q?: any) => Q.id === H);
      Y >= 0 && de(Y);
    },
    f0 = (H?: any) => {
      d((Y?: any) => Y.filter((Q?: any) => Q.id !== H));
      D(null);
      Te("Post deleted", "It has been removed from your profile and feeds.");
    },
    Zt = (H?: any, Y?: any) => {
      let Q = R.find((et?: any) => et.personId === H);
      Q ||
        ((Q = {
          id: `conv_${H}_${Date.now()}`,
          personId: H,
          messages: [],
          unread: 0,
          online: false,
          lastActive: "Active recently",
        }),
        z((et?: any) => [Q, ...et]));
      const oe = Q;
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
      Te("Profile updated", "Pinned posts appear first on your profile.");
    },
    Vs = (H?: any, Y?: any) => {
      j((Q?: any) => [
        {
          id: `story_${Date.now()}`,
          authorId: ME_ID,
          image: Y,
          caption: H,
        },
        ...Q,
      ]);
      Te(
        "Added to your story",
        "Your circle can see it for the next 24 hours.",
      );
    },
    Cs = useCallback(
      (H?: any) => {
        U((Y?: any) => (Y.includes(H) ? Y : [...Y, H]));
      },
      [U],
    ),
    L1 = (H?: any, Y?: any) => {
      z((Q?: any) =>
        Q.map((oe?: any) =>
          oe.id === H
            ? {
                ...oe,
                messages: [
                  ...oe.messages,
                  {
                    ...Y,
                    id: `msg_${Date.now()}`,
                  },
                ],
                unread: 0,
              }
            : oe,
        ),
      );
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
    },
    N0 = (H?: any) => {
      z((Y?: any) =>
        Y.map((Q?: any) =>
          Q.id === H
            ? {
                ...Q,
                pinned: !Q.pinned,
              }
            : Q,
        ),
      );
    },
    sa = (H?: any) => {
      z((Y?: any) =>
        Y.map((Q?: any) =>
          Q.id === H
            ? {
                ...Q,
                muted: !Q.muted,
              }
            : Q,
        ),
      );
    },
    T1 = (H?: any) => {
      z((Y?: any) =>
        Y.map((Q?: any) =>
          Q.id === H
            ? {
                ...Q,
                archived: true,
                unread: 0,
              }
            : Q,
        ),
      );
      Te(
        "Conversation archived",
        "Find it again under Archived in your inbox.",
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
      Te("Request accepted", "You can reply now.");
    },
    Wl = (H?: any) => {
      z((Y?: any) => Y.filter((Q?: any) => Q.id !== H));
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
        Ee(H);
        return;
      }
      z((Q?: any) => [
        {
          id: `conv_${H}_${Date.now()}`,
          personId: H,
          messages: [],
          unread: 0,
          online: false,
          lastActive: "Active recently",
        },
        ...Q,
      ]);
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
      const Y = x.find((Q?: any) => Q.id === H);
      Y &&
        Te(
          Y.joined ? `Left ${Y.name}` : `Welcome to ${Y.name}`,
          Y.joined
            ? "You can rejoin any time."
            : "Say hello, or just read for a while.",
        );
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
      const Y = A.find((Q?: any) => Q.id === H);
      Y &&
        Te(
          Y.joined ? "You're no longer going" : `You're going to ${Y.title}`,
          Y.joined
            ? "Your spot has been released."
            : `${Y.weekday} ${Y.day}, ${Y.time}`,
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
      Te("Your reel is live", "It is at the front of your Reels feed.");
    },
    tn = (H?: any, Y?: any) => {
      te((Q?: any) =>
        Q.map((oe?: any) =>
          oe.id === H
            ? {
                ...oe,
                comments: [
                  ...oe.comments,
                  {
                    id: `reel_c_${Date.now()}`,
                    authorId: ME_ID,
                    text: Y,
                    time: "now",
                    likes: 0,
                  },
                ],
              }
            : oe,
        ),
      );
    },
    h0 = () => {
      downloadTextFile(
        `thursday-workspace-${new Date().toISOString().slice(0, 10)}.json`,
        exportWorkspaceSnapshot(),
      );
      Te("Workspace exported", "A JSON copy of your workspace is downloading.");
    },
    ut = () => {
      clearWorkspaceStorage();
      window.location.reload();
    },
    Nt = () => {
      switch ($) {
        case "explore":
          return (
            <ExploreView
              people={c}
              followingIds={y}
              onToggleFollow={je}
              onOpenPerson={ge}
            />
          );
        case "reels":
          return createPortal(
            <ReelsView
              reels={J}
              people={c}
              me={fe}
              followingIds={y}
              onToggleFollow={je}
              onLike={Pl}
              onSave={Wa}
              onShare={Ia}
              onAddComment={tn}
              onOpenPerson={ge}
              onCreateReel={en}
              onOpenMessages={() => w0("maya")}
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
              initialSelectedId={I}
              onToggleCircle={Ls}
              onCreate={() =>
                Te("Circles open monthly", "The next round opens on 1 July.")
              }
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
              onToggleEvent={Il}
              onOpenPerson={ge}
              onSuggest={() =>
                Te("Suggest a gathering", "Tell us the place and the people.")
              }
              onOpenCircle={_1}
              onMessage={w0}
            />
          );
        case "notifications":
          return (
            <NotificationsView
              notices={v}
              people={c}
              onMarkAllRead={() => {
                q((H?: any) =>
                  H.map((Y?: any) => ({
                    ...Y,
                    unread: false,
                  })),
                );
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
              people={c}
              conversations={R}
              followingIds={y}
              readReceipts={K.privacy.readReceipts}
              initialPersonId={le}
              onSend={L1}
              onReact={la}
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
              isMe={Ft.id === ME_ID}
              posts={m}
              people={c}
              stories={_}
              onOpenStory={At_local}
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
              onReset={ut}
              onToast={Te}
              onOpenPerson={ge}
              onBackHome={() => E("home")}
            />
          );
        default:
          return (
            <FeedView
              me={fe}
              people={c}
              posts={m}
              stories={_}
              circles={x}
              events={A}
              reels={J}
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
  return (
    <div className="min-h-screen bg-canvas">
      {pt ? <ColdStartSplash onDone={() => St(false)} /> : null}
      <ScrollProgressBar />
      <DesktopSidebar
        view={$}
        me={fe}
        unreadNotices={A0}
        unreadMessages={s0}
        followingIds={y}
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
        unreadNotices={A0}
        unreadMessages={s0}
        followingIds={y}
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
        onSubmit={z1}
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
      {ve !== null ? (
        <StoryViewerModal
          stories={_}
          people={c}
          index={ve}
          onClose={() => de(null)}
          onChange={de}
          onSeen={Cs}
          onReply={Zt}
        />
      ) : null}
      <SearchPaletteModal
        open={G}
        onClose={() => X_local(false)}
        people={c}
        posts={m}
        topics={TOPICS}
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
        onSave={(H?: any) => {
          u((Y?: any) =>
            Y.map((Q?: any) =>
              Q.id === ME_ID
                ? {
                    ...Q,
                    ...H,
                  }
                : Q,
            ),
          );
          Te(
            "Profile updated",
            "Your circle will see the new details right away.",
          );
        }}
      />
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
