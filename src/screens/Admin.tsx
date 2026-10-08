import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Shell, T, Card, Button, Row, Chip, Field } from "../components/ui";
import { useStore } from "../lib/store";
import { supabase } from "../lib/supabase";
import { fa, groupCheckpoints, lessons } from "../data/program";

export function Admin() {
  const { role, demo, data, notify, groupId, refresh } = useStore();
  const [tab, setTab] = useState("members");
  const [members, setMembers] = useState<
    { id: string; name: string; count: number }[]
  >([]);
  const [lesson, setLesson] = useState("1");
  const [video, setVideo] = useState("");
  const [after, setAfter] = useState(2);
  const [date, setDate] = useState("");
  const [url, setUrl] = useState("");
  const [provider, setProvider] = useState<"livekit" | "external">("livekit");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (demo || role !== "therapist" || !supabase) return;
    (async () => {
      const profiles = await supabase!
        .from("profiles")
        .select("id, display_name")
        .eq("role", "participant");
      const progress = await supabase!
        .from("progress")
        .select("user_id, lesson_id");
      if (profiles.error || progress.error) {
        notify("دریافت فهرست اعضا ناموفق بود.");
        return;
      }
      setMembers(
        (profiles.data ?? []).map((p) => ({
          id: p.id,
          name: p.display_name,
          count: (progress.data ?? []).filter((x) => x.user_id === p.id).length,
        })),
      );
    })();
  }, [demo, role]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!demo && role !== "therapist")
    return (
      <Shell title="دسترسی محدود">
        <T>این بخش فقط برای درمانگر گروه در دسترس است.</T>
      </Shell>
    );
  const saveVideo = async () => {
    if (demo) {
      notify("این بخش پیش‌نمایش است؛ برای ذخیره به حساب درمانگر متصل شوید.");
      return;
    }
    const id = Number(
      lesson.replace(/[۰-۹]/g, (x) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(x))),
    );
    if (
      !Number.isInteger(id) ||
      id < 1 ||
      id > 12 ||
      !/^https:\/\//.test(video)
    ) {
      notify("شمارهٔ جلسهٔ ۱ تا ۱۲ و پیوند HTTPS مستقیم ویدیو را وارد کنید.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase!
        .from("lesson_content")
        .upsert(
          { group_id: groupId, lesson_id: id, video_url: video },
          { onConflict: "group_id,lesson_id" },
        );
      if (error) throw error;
      await refresh();
      notify("ویدیوی آموزشی ذخیره شد.");
    } catch {
      notify("ذخیرهٔ ویدیو انجام نشد.");
    } finally {
      setBusy(false);
    }
  };
  const saveMeeting = async () => {
    if (demo) {
      notify("ذخیرهٔ جلسه نیازمند اتصال و حساب درمانگر است.");
      return;
    }
    if (
      (provider === "external" && !/^https:\/\//.test(url)) ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(`${date}:00+03:30`))
    ) {
      notify("پیوند HTTPS و زمان میلادی در قالب مشخص‌شده را وارد کنید.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase!.from("meetings").upsert(
        {
          group_id: groupId,
          after_lesson: after,
          starts_at: new Date(`${date}:00+03:30`).toISOString(),
          url: provider === "external" ? url : null,
          provider,
        },
        { onConflict: "group_id,after_lesson" },
      );
      if (error) throw error;
      await refresh();
      notify("زمان جلسه ثبت شد.");
    } catch {
      notify("ذخیرهٔ جلسه انجام نشد.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell title="پنل درمانگر" subtitle="همراهی با هنرمندان گروه">
      {demo && (
        <Card>
          <T bold>پیش‌نمایش مدیریت</T>
          <T size={14} muted>
            این نمایش، دسترسی مدیریتی واقعی ایجاد نمی‌کند. ذخیره در سرور فقط
            برای درمانگر تأییدشدهٔ گروه مجاز است.
          </T>
        </Card>
      )}
      <Row>
        <Chip
          label="اعضا"
          selected={tab === "members"}
          onPress={() => setTab("members")}
        />
        <Chip
          label="محتوای جلسات"
          selected={tab === "content"}
          onPress={() => setTab("content")}
        />
        <Chip
          label="جلسات آنلاین"
          selected={tab === "meetings"}
          onPress={() => setTab("meetings")}
        />
      </Row>
      {tab === "members" ? (
        <>
          <Row>
            <Card style={{ flex: 1 }}>
              <T bold size={26}>
                {fa(demo ? 1 : members.length)}
              </T>
              <T muted>عضو گروه</T>
            </Card>
            <Card style={{ flex: 1 }}>
              <T bold size={26}>
                {fa(data.artworks.length)}
              </T>
              <T muted>اثر ثبت‌شده</T>
            </Card>
          </Row>
          {(demo
            ? [
                {
                  id: "sample",
                  name: "خانم احمدی (نمونه)",
                  count: data.completed.length,
                },
              ]
            : members
          ).map((p) => (
            <Card key={p.id}>
              <T bold>{p.name}</T>
              <T muted>{fa(p.count)} از ۱۲ جلسه تکمیل شده</T>
            </Card>
          ))}
          <Button
            label="مشاهدهٔ آثار و ارائهٔ بازخورد"
            onPress={() => router.push("/gallery")}
          />
        </>
      ) : tab === "content" ? (
        <Card>
          <T bold size={20}>
            آموزش ویدیویی جلسه
          </T>
          <T muted size={14}>
            راهنمای نوشتاری هر ۱۲ جلسه در برنامه موجود است. پیوند مستقیم فایل
            ویدیویی تأییدشدهٔ گروه را اینجا ثبت کنید.
          </T>
          <T>شمارهٔ جلسه</T>
          <Field
            value={lesson}
            onChangeText={setLesson}
            keyboardType="number-pad"
            accessibilityLabel="شماره جلسه"
          />
          <T>پیوند فایل ویدیو</T>
          <Field
            value={video}
            onChangeText={setVideo}
            placeholder="https://…/lesson.mp4"
            autoCapitalize="none"
            accessibilityLabel="پیوند ویدیو"
          />
          <Button
            label="ذخیرهٔ محتوای ویدیویی"
            disabled={busy}
            onPress={saveVideo}
          />
          <T size={13} muted>
            {lessons[Number(lesson) - 1]?.title}
          </T>
        </Card>
      ) : (
        <Card>
          <T bold size={20}>
            برنامه‌ریزی جلسهٔ گروهی
          </T>
          <T>پس از جلسهٔ</T>
          <View
            style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}
          >
            {groupCheckpoints.map((n) => (
              <View key={n} style={{ width: "30%" }}>
                <Chip
                  label={fa(n)}
                  selected={after === n}
                  onPress={() => setAfter(n)}
                />
              </View>
            ))}
          </View>
          <T>تاریخ و ساعت تهران (میلادی)</T>
          <Field
            value={date}
            onChangeText={setDate}
            placeholder="2026-10-10T16:00"
            autoCapitalize="none"
            accessibilityLabel="زمان جلسه"
          />
          <T muted size={12}>
            نمونه: 2026-10-10T16:00 — ساعت ۱۶ به وقت تهران
          </T>
          <Row>
            <Chip
              label="تماس داخل برنامه"
              selected={provider === "livekit"}
              onPress={() => setProvider("livekit")}
            />
            <Chip
              label="پیوند سرویس دیگر"
              selected={provider === "external"}
              onPress={() => setProvider("external")}
            />
          </Row>
          {provider === "external" && (
            <>
              <T>پیوند ورود به سرویس جلسه</T>
              <Field
                value={url}
                onChangeText={setUrl}
                placeholder="https://…"
                autoCapitalize="none"
                accessibilityLabel="پیوند جلسه"
              />
            </>
          )}
          <Button
            label="ذخیرهٔ برنامهٔ جلسه"
            disabled={busy}
            onPress={saveMeeting}
          />
        </Card>
      )}
    </Shell>
  );
}
