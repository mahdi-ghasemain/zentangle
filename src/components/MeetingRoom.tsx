import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import {
  AudioSession,
  LiveKitRoom,
  VideoTrack,
  useTracks,
  useLocalParticipant,
  useRoomContext,
  useParticipants,
  isTrackReference,
  registerGlobals,
} from "@livekit/react-native";
import { Track } from "livekit-client";
import { Button, Card, T } from "./ui";
import { supabase } from "../lib/supabase";
registerGlobals();
function RoomContents() {
  const tracks = useTracks([Track.Source.Camera]);
  const participants = useParticipants();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } =
    useLocalParticipant();
  const room = useRoomContext();
  const [error, setError] = useState("");
  const toggle = async (camera: boolean) => {
    try {
      setError("");
      if (camera) await localParticipant.setCameraEnabled(!isCameraEnabled);
      else await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch {
      setError("اجازه دوربین و میکروفن را در تنظیمات گوشی بررسی کنید.");
    }
  };
  return (
    <View style={{ gap: 12 }}>
      <T>افراد حاضر: {participants.length.toLocaleString("fa-IR")}</T>
      {participants.map((p) => (
        <T key={p.identity}>
          {p.name || "عضو گروه"}
          {p.isSpeaking ? " — در حال صحبت" : ""}
        </T>
      ))}
      {tracks.filter(isTrackReference).map((t) => (
        <VideoTrack
          key={t.publication.trackSid}
          trackRef={t}
          style={{ height: 220, width: "100%" }}
        />
      ))}
      {error ? <T>{error}</T> : null}
      <Button
        secondary
        label={isMicrophoneEnabled ? "خاموش کردن میکروفن" : "روشن کردن میکروفن"}
        onPress={() => void toggle(false)}
      />
      <Button
        secondary
        label={isCameraEnabled ? "خاموش کردن دوربین" : "روشن کردن دوربین"}
        onPress={() => void toggle(true)}
      />
      <Button label="پایان تماس" onPress={() => void room.disconnect()} />
    </View>
  );
}
export default function MeetingRoom({ meetingId }: { meetingId: string }) {
  const [credentials, setCredentials] = useState<{
    token: string;
    serverUrl: string;
  } | null>(null);
  const [video, setVideo] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const pending = useRef(false),
    mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
      void AudioSession.stopAudioSession();
    },
    [],
  );
  const join = async (withVideo: boolean) => {
    if (pending.current || !supabase) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const { data, error: failure } = await supabase.functions.invoke(
        "livekit-token",
        { body: { meetingId } },
      );
      if (failure || !data?.token || !data?.serverUrl)
        throw new Error("unavailable");
      if (!mounted.current) return;
      await AudioSession.startAudioSession();
      if (!mounted.current) {
        await AudioSession.stopAudioSession();
        return;
      }
      setVideo(withVideo);
      setCredentials(data);
    } catch {
      if (mounted.current)
        setError(
          "ورود به تماس ممکن نشد؛ زمان جلسه، عضویت گروه و فعال بودن سرویس را بررسی کنید.",
        );
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <Card>
      {error ? <T>{error}</T> : null}
      {credentials ? (
        <LiveKitRoom
          serverUrl={credentials.serverUrl}
          token={credentials.token}
          connect
          audio
          video={video}
          options={{
            adaptiveStream: { pixelDensity: "screen" },
            dynacast: true,
            videoCaptureDefaults: {
              resolution: { width: 640, height: 360, frameRate: 20 },
            },
          }}
          onDisconnected={() => {
            setCredentials(null);
            void AudioSession.stopAudioSession();
          }}
          onError={() =>
            setError("اتصال تماس یا مجوز دوربین و میکروفن را بررسی کنید.")
          }
        >
          <RoomContents />
        </LiveKitRoom>
      ) : (
        <>
          <T>
            از ۱۵ دقیقه پیش از شروع تا دو ساعت پس از زمان جلسه می‌توانید وارد
            شوید. برنامه تماس را ضبط نمی‌کند.
          </T>
          <Button
            disabled={busy}
            label={busy ? "در حال اتصال…" : "ورود با صدا"}
            onPress={() => void join(false)}
          />
          <Button
            disabled={busy}
            secondary
            label="ورود با صدا و تصویر"
            onPress={() => void join(true)}
          />
        </>
      )}
    </Card>
  );
}
