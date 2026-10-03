import React, { useState } from "react";
import {
  View,
  Image,
  Pressable,
  useWindowDimensions,
  Platform,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import {
  Shell,
  T,
  Card,
  Button,
  Row,
  Icon,
  Field,
  Chip,
  Avatar,
  useColors,
} from "../components/ui";
import { LeafArt } from "../components/Art";
import { useStore, samples, Artwork } from "../lib/store";
import { lessons, fa } from "../data/program";

export function AudioPlayback({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  return (
    <Button
      secondary
      label={status.playing ? "توقف روایت صوتی" : "شنیدن روایت اثر"}
      icon={status.playing ? "pause-circle-outline" : "play-circle-outline"}
      onPress={() => {
        if (status.playing) player.pause();
        else {
          if (status.didJustFinish) player.seekTo(0);
          player.play();
        }
      }}
    />
  );
}
function VoiceRecorder({
  onSave,
  onRecordingChange,
}: {
  onSave: (uri: string) => void;
  onRecordingChange: (recording: boolean) => void;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);
  const { notify } = useStore();
  const [uri, setUri] = useState<string>();
  const toggle = async () => {
    try {
      if (state.isRecording) {
        await recorder.stop();
        onRecordingChange(false);
        await setAudioModeAsync({ allowsRecording: false });
        if (recorder.uri) {
          setUri(recorder.uri);
          onSave(recorder.uri);
        }
      } else {
        const permission = await requestRecordingPermissionsAsync();
        if (!permission.granted) {
          notify(
            "برای روایت صوتی، اجازهٔ میکروفن لازم است. می‌توانید روایت را بنویسید.",
          );
          return;
        }
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
        await recorder.prepareToRecordAsync();
        recorder.record();
        onRecordingChange(true);
      }
    } catch {
      onRecordingChange(false);
      notify("ضبط صدا ممکن نشد. دسترسی میکروفن را بررسی کنید.");
    }
  };
  return (
    <Card>
      <Row>
        <Icon name="mic-outline" color="#246D52" size={30} />
        <View style={{ flex: 1 }}>
          <T bold>می‌توانید داستان خود را بگویید</T>
          <T muted size={13}>
            {state.isRecording
              ? `در حال ضبط · ${fa(Math.floor(state.durationMillis / 1000))} ثانیه`
              : "ضبط اختیاری است؛ هر وقت آماده‌اید شروع کنید."}
          </T>
        </View>
      </Row>
      <Button
        label={
          state.isRecording
            ? "توقف و نگهداری صدا"
            : uri
              ? "ضبط دوباره"
              : "شروع ضبط صدا"
        }
        secondary
        icon={state.isRecording ? "stop-circle-outline" : "mic-outline"}
        onPress={toggle}
      />
      {uri && !state.isRecording && <AudioPlayback uri={uri} />}
    </Card>
  );
}
export function Upload({
  id,
  storyMode = false,
}: {
  id: number;
  storyMode?: boolean;
}) {
  const { addArtwork, notify, demo } = useStore();
  const c = useColors();
  const [image, setImage] = useState<string>();
  const [audio, setAudio] = useState<string>();
  const [recording, setRecording] = useState(false);
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const l = lessons[id - 1];
  const pick = async (camera: boolean) => {
    try {
      if (camera && Platform.OS !== "web") {
        const p = await ImagePicker.requestCameraPermissionsAsync();
        if (!p.granted) {
          notify("اجازهٔ دوربین داده نشد؛ از گالری عکس انتخاب کنید.");
          return;
        }
      }
      const result = camera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.75,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.75,
          });
      if (!result.canceled) {
        if ((result.assets[0].fileSize ?? 0) > 8 * 1024 * 1024) {
          notify("لطفاً تصویری کوچک‌تر از ۸ مگابایت انتخاب کنید.");
          return;
        }
        setImage(result.assets[0].uri);
      }
    } catch {
      notify("انتخاب تصویر انجام نشد. دوباره تلاش کنید.");
    }
  };
  const save = async () => {
    if (!image) {
      notify("ابتدا عکس اثر خود را انتخاب کنید.");
      return;
    }
    if (!title.trim()) {
      notify("یک نام برای اثر بنویسید.");
      return;
    }
    if (!agreed) {
      notify("برای ارسال، نمایش اثر در گروه را تأیید کنید.");
      return;
    }
    setBusy(true);
    try {
      const key = await addArtwork({
        image,
        audio,
        title: title.trim(),
        story: story.trim(),
        lesson: id,
      });
      notify(
        demo
          ? "اثر روی این دستگاه ذخیره شد؛ جلسه تکمیل شد."
          : "اثر ثبت شد؛ جلسه تکمیل شد.",
      );
      router.replace(`/artwork?art=${key}`);
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "ارسال ناموفق بود. دوباره تلاش کنید.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell
      title={storyMode ? "داستان اثر من" : "ارسال اثر"}
      subtitle={l.prompt}
    >
      <Pressable
        onPress={() => pick(false)}
        accessibilityRole="button"
        accessibilityLabel="انتخاب عکس اثر"
      >
        <Card
          style={{
            minHeight: 220,
            borderStyle: "dashed",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {image ? (
            <Image
              source={{ uri: image }}
              style={{ width: "100%", height: 250, borderRadius: 13 }}
              resizeMode="contain"
            />
          ) : (
            <>
              <Icon name="camera-outline" size={56} color={c.green} />
              <T>عکس بگیرید یا انتخاب کنید</T>
              <T muted size={12}>
                حداکثر اندازهٔ تصویر: ۸ مگابایت
              </T>
            </>
          )}
        </Card>
      </Pressable>
      <Row>
        <View style={{ flex: 1 }}>
          <Button
            secondary
            label="انتخاب از گالری"
            icon="images-outline"
            onPress={() => pick(false)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            secondary
            label="گرفتن عکس"
            icon="camera-outline"
            onPress={() => pick(true)}
          />
        </View>
      </Row>
      <T bold>نام اثر شما</T>
      <Field
        value={title}
        onChangeText={setTitle}
        placeholder="مثلاً: برگ خاطره‌ها"
        maxLength={100}
        accessibilityLabel="نام اثر"
      />
      <T bold>دربارهٔ اثر خود بنویسید</T>
      <Field
        multiline
        value={story}
        onChangeText={setStory}
        placeholder="چه احساسی داشتید؟ این نقش چه خاطره‌ای دارد؟"
        maxLength={3000}
        accessibilityLabel="داستان اثر"
      />
      <VoiceRecorder onSave={setAudio} onRecordingChange={setRecording} />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
        onPress={() => setAgreed(!agreed)}
      >
        <Row>
          <Icon name={agreed ? "checkbox" : "square-outline"} color={c.green} />
          <View style={{ flex: 1 }}>
            <T size={14}>
              {demo
                ? "با ذخیرهٔ اثر در نسخهٔ آزمایشی این دستگاه موافقم."
                : "با نمایش این اثر و روایت برای اعضای گروه و درمانگر موافقم."}
            </T>
          </View>
        </Row>
      </Pressable>
      <Button
        label={
          recording
            ? "ابتدا ضبط صدا را متوقف کنید"
            : busy
              ? "در حال ذخیره…"
              : "ثبت و ارسال اثر"
        }
        disabled={busy || recording}
        onPress={save}
      />
    </Shell>
  );
}
function ArtPicture({ art, size = 180 }: { art: Artwork; size?: number }) {
  return art.image ? (
    <Image
      source={{ uri: art.image }}
      style={{ width: "100%", height: size, borderRadius: 15 }}
      resizeMode="cover"
    />
  ) : (
    <View
      style={{
        height: size,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 15,
        backgroundColor: "#F0E8D9",
        overflow: "hidden",
      }}
    >
      <LeafArt size={size - 4} variant={art.variant} />
    </View>
  );
}
export function Gallery({ initialFilter }: { initialFilter?: string }) {
  const { data, demo, userId, like, refresh, notify } = useStore();
  const [filter, setFilter] = useState(initialFilter ?? "all");
  const { width } = useWindowDimensions();
  const cols = width > 1250 ? 3 : 2;
  const all = [...data.artworks, ...(demo ? samples : [])];
  const shown = all.filter((a) =>
    filter === "mine"
      ? a.owner === (demo ? "local" : userId)
      : filter === "liked"
        ? data.likes.includes(a.id)
        : true,
  );
  const c = useColors();
  return (
    <Shell title="گالری آثار" subtitle="هر نقش، یک داستان؛ هر هنرمند، یک دنیا">
      <Row>
        {[
          { id: "all", t: "همهٔ آثار" },
          { id: "mine", t: "آثار من" },
          { id: "liked", t: "علاقه‌مندی‌ها" },
        ].map((x) => (
          <Chip
            key={x.id}
            label={x.t}
            selected={filter === x.id}
            onPress={() => setFilter(x.id)}
          />
        ))}
      </Row>
      {demo && (
        <T size={12} muted>
          آثار دوستان در این نسخه نمونه هستند.
        </T>
      )}
      {!shown.length && (
        <Card>
          <T center>هنوز اثری اینجا ثبت نشده است.</T>
          <T center muted size={14}>
            با یک نقش کوچک شروع کنید.
          </T>
        </Card>
      )}
      <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 14 }}>
        {shown.map((a) => (
          <View
            key={a.id}
            style={{
              width: `${100 / cols - 2.5}%`,
              flexGrow: 1,
              maxWidth: cols === 3 ? "33%" : "49%",
            }}
          >
            <Card style={{ padding: 10, gap: 5 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`نمایش اثر ${a.title}`}
                onPress={() => router.push(`/artwork?art=${a.id}`)}
              >
                <ArtPicture art={a} size={width < 450 ? 145 : 210} />
                <T bold size={15} style={{ marginTop: 9 }}>
                  {a.title}
                </T>
                <T size={12} muted>
                  {a.name}
                </T>
              </Pressable>
              <Row style={{ justifyContent: "space-between" }}>
                <T size={11} muted>
                  جلسه {fa(a.lesson)}
                </T>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`علاقه‌مندی ${a.title}`}
                  onPress={() => like(a.id)}
                  style={{ padding: 10 }}
                >
                  <Icon
                    name={data.likes.includes(a.id) ? "heart" : "heart-outline"}
                    color={data.likes.includes(a.id) ? "#B94E43" : c.muted}
                    size={22}
                  />
                </Pressable>
              </Row>
            </Card>
          </View>
        ))}
      </View>
      <Button
        label="ثبت اثر تازه"
        icon="add"
        onPress={() =>
          router.push(`/upload?id=${Math.min(data.completed.length + 1, 12)}`)
        }
      />
      {!demo && (
        <Button
          secondary
          label="تازه‌سازی گالری"
          onPress={() =>
            refresh().catch(() => notify("دریافت اطلاعات ناموفق بود."))
          }
        />
      )}
    </Shell>
  );
}
export function ArtworkScreen({ artId }: { artId: string }) {
  const { data, demo, addComment, notify, like } = useStore();
  const art = [...data.artworks, ...(demo ? samples : [])].find(
    (a) => a.id === artId,
  );
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  if (!art)
    return (
      <Shell title="اثر هنری">
        <T>این اثر پیدا نشد یا دسترسی به آن ندارید.</T>
        <Button
          label="بازگشت به گالری"
          onPress={() => router.replace("/gallery")}
        />
      </Shell>
    );
  const comments = data.comments.filter((x) => x.artwork === art.id);
  const send = async () => {
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await addComment(art.id, comment);
      setComment("");
      notify("نظر شما ثبت شد.");
    } catch {
      notify("ثبت نظر ناموفق بود.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell title="بازخورد و گفت‌وگو" subtitle={art.title}>
      <Card>
        <ArtPicture art={art} size={320} />
        <Row>
          <Avatar sample={demo} />
          <View style={{ flex: 1 }}>
            <T bold>{art.name}</T>
            <T muted size={13}>
              جلسه {fa(art.lesson)}
              {art.owner === "sample" ? " · اثر نمونه" : ""}
            </T>
          </View>
          <Pressable
            accessibilityLabel="علاقه‌مندی"
            onPress={() => like(art.id)}
            style={{ padding: 12 }}
          >
            <Icon
              name={data.likes.includes(art.id) ? "heart" : "heart-outline"}
              color="#B94E43"
            />
          </Pressable>
        </Row>
        <T>{art.story || "روایتی برای این اثر نوشته نشده است."}</T>
        {art.audio && <AudioPlayback uri={art.audio} />}
      </Card>
      <T bold size={19}>
        گفت‌وگو دربارهٔ این اثر
      </T>
      {!comments.length && (
        <T size={14} muted>
          اولین پیام دلگرم‌کننده را شما بنویسید.
        </T>
      )}
      {comments.map((x) => (
        <Card key={x.id}>
          <Row>
            <Avatar size={38} />
            <T bold size={15}>
              {x.name}
            </T>
          </Row>
          <T size={15}>{x.text}</T>
          <T size={11} muted>
            {new Date(x.created).toLocaleString("fa-IR")}
          </T>
        </Card>
      ))}
      <Card>
        <T size={13} muted>
          دربارهٔ چیزی که دوست داشتید بنویسید؛ هر اثر بیان شخصی هنرمند است.
        </T>
        <Field
          multiline
          value={comment}
          onChangeText={setComment}
          placeholder="نظر خود را بنویسید…"
          accessibilityLabel="متن نظر"
          maxLength={1000}
        />
        <Button
          label={busy ? "در حال ارسال…" : "ارسال نظر"}
          disabled={busy || !comment.trim()}
          icon="send-outline"
          onPress={send}
        />
      </Card>
    </Shell>
  );
}
