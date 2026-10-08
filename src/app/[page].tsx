import React from "react";
import Install from "../screens/Install";
import { useLocalSearchParams, Redirect, router } from "expo-router";
import { Welcome, Login } from "../screens/Welcome";
import { Home, Sessions, Lesson, Guide, Practice } from "../screens/Learning";
import { Upload, Gallery, ArtworkScreen } from "../screens/Community";
import {
  Profile,
  Settings,
  Calendar,
  Meeting,
  Notifications,
  Resources,
  Help,
} from "../screens/Account";
import { Admin } from "../screens/Admin";
import { useStore } from "../lib/store";
import { canOpenLesson } from "../data/program";
import { Shell, T, Button } from "../components/ui";

export default function Screen() {
  const params = useLocalSearchParams<{
    page: string;
    id?: string;
    filter?: string;
    art?: string;
    meeting?: string;
  }>();
  const screen = params.page;
  const { userId, demo, data } = useStore();
  if (screen === "install") return <Install />;
  if (screen === "welcome") return <Welcome />;
  if (screen === "login") return userId ? <Redirect href="/home" /> : <Login />;
  if (!userId && !demo) return <Redirect href="/login" />;
  const id = Number(params.id ?? 1);
  if (["lesson", "guide", "practice", "upload", "story"].includes(screen)) {
    if (
      !Number.isInteger(id) ||
      id < 1 ||
      id > 12 ||
      !canOpenLesson(id, data.completed)
    )
      return (
        <Shell title="جلسه در دسترس نیست">
          <T>برای ادامه، تمرین جلسهٔ قبلی را ثبت کنید.</T>
          <Button
            label="بازگشت به جلسات"
            onPress={() => router.replace("/sessions")}
          />
        </Shell>
      );
    if (screen === "lesson") return <Lesson key={id} id={id} />;
    if (screen === "guide") return <Guide key={id} id={id} />;
    if (screen === "practice") return <Practice key={id} id={id} />;
    return <Upload key={id} id={id} storyMode={screen === "story"} />;
  }
  switch (screen) {
    case "home":
      return <Home />;
    case "sessions":
      return <Sessions />;
    case "gallery":
      return <Gallery key={params.filter} initialFilter={params.filter} />;
    case "artwork":
      return <ArtworkScreen key={params.art} artId={params.art ?? ""} />;
    case "profile":
      return <Profile />;
    case "settings":
      return <Settings />;
    case "calendar":
      return <Calendar />;
    case "meeting":
      return <Meeting meetingId={params.meeting ?? ""} />;
    case "notifications":
      return <Notifications />;
    case "resources":
      return <Resources />;
    case "help":
      return <Help />;
    case "admin":
      return <Admin />;
    default:
      return (
        <Shell title="صفحه پیدا نشد">
          <Button
            label="بازگشت به خانه"
            onPress={() => router.replace("/home")}
          />
        </Shell>
      );
  }
}
