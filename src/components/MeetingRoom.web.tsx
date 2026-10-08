import React, { useRef, useState } from "react";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  StartAudio,
  useTracks,
  useLocalParticipant,
  useRoomContext,
  useConnectionState,
} from "@livekit/components-react";
import { Track, ConnectionState } from "livekit-client";
import "@livekit/components-styles";
import { Button, Card, T } from "./ui";
import { supabase } from "../lib/supabase";
import { useStore } from "../lib/store";

function Controls() {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } =
    useLocalParticipant();
  const room = useRoomContext();
  const state = useConnectionState();
  const [error, setError] = useState("");
  const toggle = async (camera: boolean) => {
    try {
      setError("");
      if (camera) await localParticipant.setCameraEnabled(!isCameraEnabled);
      else await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch {
      setError("اجازهٔ دسترسی به دوربین یا میکروفن را در مرورگر بررسی کنید.");
    }
  };
  return (
    <div dir="rtl">
      {state !== ConnectionState.Connected && <T>در حال برقراری ارتباط…</T>}
      {error ? <T>{error}</T> : null}
      <div style={{ display: "grid", gap: 8 }}>
        <Button
          secondary
          label={
            isMicrophoneEnabled ? "خاموش کردن میکروفن" : "روشن کردن میکروفن"
          }
          onPress={() => void toggle(false)}
        />
        <Button
          secondary
          label={isCameraEnabled ? "خاموش کردن دوربین" : "روشن کردن دوربین"}
          onPress={() => void toggle(true)}
        />
      </div>
      <Button label="پایان تماس" onPress={() => void room.disconnect()} />
    </div>
  );
}
function Participants() {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false },
  );
  return (
    <GridLayout tracks={tracks} style={{ height: 380 }}>
      <ParticipantTile />
    </GridLayout>
  );
}
export default function MeetingRoom({ meetingId }: { meetingId: string }) {
  const { demo, userId } = useStore();
  const [credentials, setCredentials] = useState<{
    token: string;
    serverUrl: string;
  } | null>(null);
  const [video, setVideo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const join = async (withVideo: boolean) => {
    if (pending.current) return;
    if (!supabase || demo || !userId) {
      setError("برای تماس واقعی، وارد حساب عضو گروه شوید.");
      return;
    }
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
      setVideo(withVideo);
      setCredentials(data);
    } catch {
      setError(
        "ورود به تماس ممکن نشد. زمان جلسه، عضویت گروه و فعال‌بودن سرویس را بررسی کنید.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <Card>
      {error ? (
        <div role="alert">
          <T>{error}</T>
        </div>
      ) : null}
      {credentials ? (
        <div
          data-lk-theme="default"
          style={{ borderRadius: 18, overflow: "hidden", padding: 10 }}
        >
          <LiveKitRoom
            serverUrl={credentials.serverUrl}
            token={credentials.token}
            connect
            audio
            video={video}
            options={{
              adaptiveStream: true,
              dynacast: true,
              videoCaptureDefaults: {
                resolution: { width: 640, height: 360, frameRate: 20 },
              },
            }}
            onDisconnected={() => setCredentials(null)}
            onError={() =>
              setError("اتصال یا دسترسی به دوربین و میکروفن را بررسی کنید.")
            }
            onMediaDeviceFailure={() =>
              setError(
                "مرورگر به دوربین یا میکروفن دسترسی ندارد؛ اجازهٔ دسترسی را بررسی کنید.",
              )
            }
          >
            <Participants />
            <RoomAudioRenderer />
            <StartAudio label="برای شنیدن صدای جلسه لمس کنید" />
            <Controls />
          </LiveKitRoom>
        </div>
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
