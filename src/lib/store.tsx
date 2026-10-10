import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Platform } from "react-native";
import { File, Paths } from "expo-file-system";

import { supabase } from "./supabase";
export type Artwork = {
  id: string;
  owner: string;
  name: string;
  title: string;
  story: string;
  image?: string;
  audio?: string;
  lesson: number;
  created: string;
  variant: number;
};
export type Comment = {
  id: string;
  artwork: string;
  name: string;
  text: string;
  created: string;
};
export type Settings = {
  font: number;
  dark: boolean;
  notifications: boolean;
  autoplay: boolean;
};
export type Meeting = {
  id: string;
  after: number;
  starts: string;
  url: string;
  provider?: "external" | "livekit";
};
type Data = {
  avatar?: string;
  completed: number[];
  artworks: Artwork[];
  comments: Comment[];
  likes: string[];
  settings: Settings;
  name: string;
  onboarded: boolean;
};
const initial: Data = {
  completed: [],
  artworks: [],
  comments: [],
  likes: [],
  settings: { font: 1, dark: false, notifications: true, autoplay: false },
  name: "هنرمند عزیز",
  onboarded: false,
};
export const samples: Artwork[] = [
  {
    id: "sample-1",
    owner: "sample",
    name: "خانم رضایی",
    title: "باغ کوچک من",
    story:
      "این برگ مرا به یاد باغ خانهٔ مادرم می‌اندازد؛ عصرهایی که کنار هم چای می‌نوشیدیم.",
    lesson: 3,
    variant: 0,
    created: "",
  },
  {
    id: "sample-2",
    owner: "sample",
    name: "آقای محمدی",
    title: "آرامش در تکرار",
    story: "خط‌ها را آرام کشیدم و از تکرارشان لذت بردم.",
    lesson: 3,
    variant: 1,
    created: "",
  },
  {
    id: "sample-3",
    owner: "sample",
    name: "خانم احمدی",
    title: "برگ خاطره‌ها",
    story: "هر بخش این برگ، یک خاطرهٔ کوچک دارد.",
    lesson: 3,
    variant: 2,
    created: "",
  },
  {
    id: "sample-4",
    owner: "sample",
    name: "خانم کریمی",
    title: "نقش خیال",
    story: "ترکیبی از نقش‌هایی که دوست دارم.",
    lesson: 3,
    variant: 3,
    created: "",
  },
];
type Context = {
  data: Data;
  ready: boolean;
  userId: string | null;
  demo: boolean;
  role: string;
  groupId: string | null;
  meetings: Meeting[];
  videos: Record<number, string>;
  notice: string;
  notify: (s: string) => void;
  enterDemo: () => void;
  patch: (p: Partial<Data>) => void;
  updateSettings: (s: Partial<Settings>) => void;
  complete: (id: number) => Promise<void>;
  addArtwork: (
    a: Omit<Artwork, "id" | "owner" | "name" | "created" | "variant">,
  ) => Promise<string>;
  addComment: (id: string, text: string) => Promise<void>;
  like: (id: string) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};
const Store = createContext<Context | null>(null);
async function durableUri(uri: string, name: string) {
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  const target = new File(Paths.document, name);
  new File(uri).copy(target);
  return target.uri;
}
async function upload(uri: string, path: string, contentType: string) {
  if (!supabase) throw new Error("سرویس متصل نیست.");
  const blob = Platform.OS === "web" ? await (await fetch(uri)).blob() : null;
  const file = Platform.OS !== "web" ? new File(uri) : null;
  const buffer = blob ? await blob.arrayBuffer() : await file!.arrayBuffer();
  if (contentType.startsWith("image/"))
    contentType = blob?.type || file?.type || contentType;
  const { error } = await supabase.storage
    .from("artworks")
    .upload(path, buffer, { contentType });
  if (error) throw error;
  return path;
}
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>(initial);
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [role, setRole] = useState("participant");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [videos, setVideos] = useState<Record<number, string>>({});
  const authGeneration = useRef(0);
  const [notice, setNotice] = useState("");
  const settingsQueue = useRef<Promise<void>>(Promise.resolve());
  const pendingLikes = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (s: string) => {
    setNotice(s);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(""), 6000);
  };
  const patch = (p: Partial<Data>) => setData((d) => ({ ...d, ...p }));
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const value = await AsyncStorage.getItem("zentangle.local.v1");
        if (alive && value) {
          const cached = JSON.parse(value);
          setData((d) => ({
            ...d,
            onboarded: cached.onboarded === true,
            settings: { ...d.settings, ...cached.settings },
          }));
          setDemo(false); // Production sessions never resume a cached preview.
        }
        if (supabase) {
          const { data: auth } = await supabase.auth.getSession();
          if (alive) {
            setUserId(auth.session?.user.id ?? null);
            if (auth.session) setDemo(false);
          }
        }
      } catch {
        if (alive) setNotice("بازیابی اطلاعات محلی ممکن نشد.");
      } finally {
        if (alive) setReady(true);
      }
    })();
    const subscription = supabase?.auth.onAuthStateChange((_event, session) => {
      authGeneration.current += 1;
      setUserId(session?.user.id ?? null);
      if (session) setDemo(false);
    });
    const appSubscription = AppState.addEventListener("change", (s) => {
      if (s === "active") supabase?.auth.startAutoRefresh();
      else supabase?.auth.stopAutoRefresh();
    });
    return () => {
      alive = false;
      subscription?.data.subscription.unsubscribe();
      appSubscription.remove();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (ready && (!userId || demo))
      AsyncStorage.setItem(
        "zentangle.local.v1",
        JSON.stringify({ ...data, demoActive: demo }),
      ).catch(() => notify("فضای ذخیره‌سازی کافی نیست؛ اطلاعات ذخیره نشد."));
  }, [data, ready, userId, demo]);
  const refresh = async () => {
    if (!supabase || !userId || demo) return;
    const generation = authGeneration.current;
    const [
      profile,
      progress,
      arts,
      feedback,
      schedules,
      content,
      preferences,
      favorites,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("progress").select("lesson_id").eq("user_id", userId),
      supabase
        .from("artworks")
        .select("*, profiles(display_name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("comments")
        .select("*, profiles(display_name)")
        .order("created_at"),
      supabase.from("meetings").select("*").order("starts_at"),
      supabase.from("lesson_content").select("*"),
      supabase
        .from("account_settings")
        .select("font,dark,notifications,autoplay")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("artwork_likes").select("artwork_id").eq("user_id", userId),
    ]);
    for (const r of [
      profile,
      progress,
      arts,
      feedback,
      schedules,
      content,
      preferences,
      favorites,
    ])
      if (r.error) throw r.error;

    const paths = [
      ...new Set(
        (arts.data ?? [])
          .flatMap((a) => [a.image_path, a.audio_path])
          .filter(Boolean),
      ),
    ] as string[];
    const signed = paths.length
      ? await supabase.storage.from("artworks").createSignedUrls(paths, 3600)
      : { data: [], error: null };
    if (signed.error) throw signed.error;
    const urls = new Map(
      (signed.data ?? []).map((item) => [item.path, item.signedUrl]),
    );
    const artworkRows: Artwork[] = (arts.data ?? []).map((a) => ({
      id: a.id,
      owner: a.user_id,
      name: a.profiles?.display_name ?? "هنرمند",
      title: a.title,
      story: a.story,
      image: urls.get(a.image_path) ?? undefined,
      audio: urls.get(a.audio_path) ?? undefined,
      lesson: a.lesson_id,
      created: a.created_at,
      variant: 0,
    }));
    const avatarFiles = await supabase.storage
      .from("avatars")
      .list(userId, { limit: 1, search: "profile.jpg" });
    const avatar = avatarFiles.data?.some((f) => f.name === "profile.jpg")
      ? await supabase.storage
          .from("avatars")
          .createSignedUrl(userId + "/profile.jpg", 3600)
      : { data: null };
    if (generation !== authGeneration.current) return;
    setRole(profile.data.role);
    setGroupId(profile.data.group_id);
    setData((d) => ({
      ...d,
      name: profile.data.display_name,
      likes: (favorites.data ?? []).map((x) => x.artwork_id),
      settings: preferences.data
        ? { ...initial.settings, ...preferences.data }
        : initial.settings,
      avatar: avatar.data?.signedUrl,
      completed: (progress.data ?? []).map((p) => p.lesson_id),
      artworks: artworkRows,
      comments: (feedback.data ?? []).map((c) => ({
        id: c.id,
        artwork: c.artwork_id,
        name: c.profiles?.display_name ?? "هنرمند",
        text: c.body,
        created: c.created_at,
      })),
    }));
    setMeetings(
      (schedules.data ?? []).map((m) => ({
        id: m.id,
        after: m.after_lesson,
        starts: m.starts_at,
        url: m.url,
        provider: m.provider,
      })),
    );
    setVideos(
      Object.fromEntries(
        (content.data ?? [])
          .filter((c) => c.video_url)
          .map((c) => [c.lesson_id, c.video_url]),
      ),
    );
  };
  useEffect(() => {
    if (userId && !demo) {
      Promise.resolve()
        .then(refresh)
        .catch(() =>
          notify(
            "دریافت اطلاعات حساب ناموفق بود. اتصال و تنظیمات سرویس را بررسی کنید.",
          ),
        );
    }
  }, [userId, demo]); // eslint-disable-line react-hooks/exhaustive-deps
  const complete = async (id: number) => {
    if (supabase && userId && !demo) {
      const { error } = await supabase
        .from("progress")
        .upsert(
          { user_id: userId, lesson_id: id },
          { onConflict: "user_id,lesson_id" },
        );
      if (error) throw error;
    }
    setData((d) => ({ ...d, completed: [...new Set([...d.completed, id])] }));
  };
  const addArtwork: Context["addArtwork"] = async (a) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (supabase && userId && !demo) {
      if (!groupId)
        throw new Error("درمانگر باید ابتدا شما را به گروه اضافه کند.");
      const imagePath = a.image
        ? await upload(a.image, `${userId}/${id}.jpg`, "image/jpeg")
        : null;
      const audioPath = a.audio
        ? await upload(
            a.audio,
            `${userId}/${id}.${Platform.OS === "web" ? "webm" : "m4a"}`,
            Platform.OS === "web" ? "audio/webm" : "audio/mp4",
          )
        : null;
      const { data: row, error } = await supabase
        .from("artworks")
        .insert({
          user_id: userId,
          group_id: groupId,
          lesson_id: a.lesson,
          title: a.title,
          story: a.story,
          image_path: imagePath,
          audio_path: audioPath,
        })
        .select("id")
        .single();
      if (error) throw error;
      await complete(a.lesson);
      await refresh();
      return row.id;
    }
    const saved = {
      ...a,
      image: a.image ? await durableUri(a.image, `${id}.jpg`) : undefined,
      audio: a.audio ? await durableUri(a.audio, `${id}.m4a`) : undefined,
      id,
      owner: "local",
      name: data.name,
      created: new Date().toISOString(),
      variant: 0,
    };
    setData((d) => ({
      ...d,
      artworks: [saved, ...d.artworks],
      completed: [...new Set([...d.completed, a.lesson])],
    }));
    return id;
  };
  const addComment = async (id: string, text: string) => {
    if (!text.trim()) return;
    if (supabase && userId && !demo) {
      const { error } = await supabase
        .from("comments")
        .insert({ user_id: userId, artwork_id: id, body: text.trim() });
      if (error) throw error;
      await refresh();
    } else
      setData((d) => ({
        ...d,
        comments: [
          ...d.comments,
          {
            id: String(Date.now()),
            artwork: id,
            name: d.name,
            text: text.trim(),
            created: new Date().toISOString(),
          },
        ],
      }));
  };
  return (
    <Store.Provider
      value={{
        data,
        ready,
        userId,
        demo,
        role,
        groupId,
        meetings,
        videos,
        notice,
        notify,
        patch,
        refresh,
        complete,
        addArtwork,
        addComment,
        enterDemo: () => {
          authGeneration.current += 1;
          setDemo(true);
          setRole("participant");
          setMeetings([]);
          setVideos({});
          setData((d) => ({
            ...initial,
            settings: d.settings,
            onboarded: true,
            completed: [1, 2],
            name: "خانم احمدی",
          }));
        },
        updateSettings: (changes) => {
          if (!supabase || !userId || demo) {
            notify("برای ذخیره تنظیمات وارد حساب شوید.");
            return;
          }
          settingsQueue.current = settingsQueue.current
            .then(async () => {
              const { error } = await supabase!
                .from("account_settings")
                .upsert(
                  { user_id: userId, ...changes },
                  { defaultToNull: false },
                );
              if (error) {
                notify("تنظیمات ذخیره نشد؛ دوباره تلاش کنید.");
                return;
              }
              setData((d) => ({
                ...d,
                settings: { ...d.settings, ...changes },
              }));
            })
            .catch(() => notify("ذخیره تنظیمات ناموفق بود."));
        },
        like: (id) => {
          if (!supabase || !userId || demo) {
            notify("برای ذخیره علاقه‌مندی وارد حساب شوید.");
            return;
          }
          if (pendingLikes.current.has(id)) return;
          pendingLikes.current.add(id);
          void (async () => {
            const liked = data.likes.includes(id);
            const result = liked
              ? await supabase
                  .from("artwork_likes")
                  .delete()
                  .eq("user_id", userId)
                  .eq("artwork_id", id)
              : await supabase
                  .from("artwork_likes")
                  .insert({ user_id: userId, artwork_id: id });
            if (result.error && result.error.code !== "23505") {
              notify("علاقه‌مندی ذخیره نشد؛ دوباره تلاش کنید.");
              return;
            }
            setData((d) => ({
              ...d,
              likes: liked
                ? d.likes.filter((x) => x !== id)
                : [...new Set([...d.likes, id])],
            }));
          })()
            .catch(() => notify("ذخیره علاقه‌مندی ناموفق بود."))
            .finally(() => pendingLikes.current.delete(id));
        },
        logout: async () => {
          if (supabase && userId) await supabase.auth.signOut();
          setDemo(false);
          setUserId(null);
          setRole("participant");
          setData((d) => ({
            ...initial,
            settings: d.settings,
            onboarded: true,
          }));
        },
      }}
    >
      {children}
    </Store.Provider>
  );
}
export function useStore() {
  const value = useContext(Store);
  if (!value) throw new Error("StoreProvider is missing");
  return value;
}
