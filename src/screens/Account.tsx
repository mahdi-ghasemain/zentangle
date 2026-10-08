import React, { useState } from "react";
import ProfilePhoto from "../components/ProfilePhoto";
import MeetingRoom from "../components/MeetingRoom";
import { View, Pressable, Switch, Platform } from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
  T,
  Card,
  Button,
  Shell,
  Row,
  Icon,
  Avatar,
  MenuItem,
  Chip,
  Banner,
  useColors,
} from "../components/ui";
import { Lotus, LeafArt } from "../components/Art";
import { useStore } from "../lib/store";
import { fa, groupCheckpoints } from "../data/program";

export async function downloadText(
  name: string,
  text: string,
  type = "text/plain",
) {
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else {
    const file = new File(Paths.cache, name);
    file.create({ overwrite: true });
    file.write(text);
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri);
    else throw new Error("اشتراک‌گذاری فایل در این دستگاه در دسترس نیست.");
  }
}
export function Profile() {
  const { data, demo, userId, role, logout, notify } = useStore();
  const mine = data.artworks.filter(
    (a) => a.owner === (demo ? "local" : userId),
  );
  const [confirm, setConfirm] = useState(false);
  return (
    <Shell title="پروفایل من">
      <Row>
        <Avatar uri={data.avatar} sample={demo} size={82} />
        <View style={{ flex: 1 }}>
          <T bold size={24}>
            {data.name}
          </T>
          <T muted size={13}>
            {demo ? "عضو نمونهٔ هنر زندگی" : "همراه هنر زندگی"}
          </T>
        </View>
      </Row>
      <ProfilePhoto />
      <Button
        secondary
        icon="download-outline"
        label="نصب برنامه روی گوشی"
        onPress={() => router.push("/install")}
      />
      <Row>
        {[
          { n: data.completed.length, t: "جلسه تکمیل‌شده" },
          { n: mine.length, t: "اثر ثبت‌شده" },
          { n: data.likes.length, t: "علاقه‌مندی" },
        ].map((x) => (
          <Card
            key={x.t}
            style={{ flex: 1, alignItems: "center", padding: 11 }}
          >
            <T bold size={26}>
              {fa(x.n)}
            </T>
            <T size={11} center muted>
              {x.t}
            </T>
          </Card>
        ))}
      </Row>
      <Card>
        <MenuItem
          label="آثار من"
          icon="images-outline"
          onPress={() => router.push("/gallery?filter=mine")}
        />
        <MenuItem
          label="علاقه‌مندی‌ها"
          icon="heart-outline"
          onPress={() => router.push("/gallery?filter=liked")}
        />
        <MenuItem
          label="تنظیمات"
          icon="settings-outline"
          onPress={() => router.push("/settings")}
        />
        <MenuItem
          label="راهنما و پشتیبانی"
          icon="help-circle-outline"
          onPress={() => router.push("/help")}
        />
        {(demo || role === "therapist") && (
          <MenuItem
            label={demo ? "پیش‌نمایش پنل درمانگر" : "پنل درمانگر"}
            icon="grid-outline"
            onPress={() => router.push("/admin")}
          />
        )}
        <MenuItem
          label="خروج از حساب"
          icon="log-out-outline"
          onPress={() => setConfirm(true)}
        />
      </Card>
      {confirm && (
        <Card>
          <T>از حساب خارج می‌شوید؟</T>
          <Button
            label="بله، خروج"
            onPress={async () => {
              try {
                await logout();
                router.replace("/login");
              } catch {
                notify("خروج انجام نشد؛ دوباره تلاش کنید.");
              }
            }}
          />
          <Button
            secondary
            label="ماندن در برنامه"
            onPress={() => setConfirm(false)}
          />
        </Card>
      )}
    </Shell>
  );
}
export function Settings() {
  const { data, updateSettings } = useStore();
  const c = useColors();
  return (
    <Shell title="تنظیمات">
      <Card>
        <T bold>اندازهٔ نوشته‌ها</T>
        <Row>
          {[
            { value: 1, label: "معمولی" },
            { value: 1.15, label: "درشت" },
            { value: 1.3, label: "خیلی درشت" },
          ].map((v) => (
            <Chip
              key={v.value}
              label={v.label}
              selected={data.settings.font === v.value}
              onPress={() => updateSettings({ font: v.value })}
            />
          ))}
        </Row>
        <T center>هر خط شما، یک شروع زیباست.</T>
      </Card>
      <Card>
        <T bold>حالت نمایش</T>
        <Row>
          <Chip
            label="☀ روشن"
            selected={!data.settings.dark}
            onPress={() => updateSettings({ dark: false })}
          />
          <Chip
            label="☾ تاریک"
            selected={data.settings.dark}
            onPress={() => updateSettings({ dark: true })}
          />
        </Row>
      </Card>
      <Card>
        {[
          { key: "notifications" as const, title: "اعلان‌های داخل برنامه" },
          { key: "autoplay" as const, title: "پخش خودکار آموزش ویدیویی" },
        ].map((x) => (
          <Row
            key={x.key}
            style={{ justifyContent: "space-between", paddingVertical: 9 }}
          >
            <View style={{ flex: 1 }}>
              <T size={15}>{x.title}</T>
            </View>
            <Switch
              accessibilityLabel={x.title}
              value={data.settings[x.key]}
              onValueChange={(v) => updateSettings({ [x.key]: v })}
              trackColor={{ true: c.green, false: c.line }}
            />
          </Row>
        ))}
        <MenuItem
          label="راهنمای استفاده"
          icon="help-circle-outline"
          onPress={() => router.push("/help")}
        />
        <Row style={{ justifyContent: "space-between" }}>
          <T>زبان برنامه</T>
          <T muted>فارسی</T>
        </Row>
      </Card>
      <T center muted size={12}>
        هنر زندگی · نسخهٔ ۱.۰.۰
      </T>
    </Shell>
  );
}

export function Calendar() {
  const { meetings, notify } = useStore();
  const [month, setMonth] = useState(0);
  const c = useColors();
  const today = new Date();
  const persianParts = new Intl.DateTimeFormat("en-u-ca-persian", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(today);
  const day = Number(persianParts.find((x) => x.type === "day")?.value ?? 1);
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - day + 1,
  );
  for (let offset = 0; offset < Math.abs(month); offset++) {
    start.setDate(start.getDate() + (month > 0 ? 32 : -1));
    const offsetDay = Number(
      new Intl.DateTimeFormat("en-u-ca-persian", { day: "numeric" }).format(
        start,
      ),
    );
    start.setDate(start.getDate() - offsetDay + 1);
  }
  const pDay = Number(
    new Intl.DateTimeFormat("en-u-ca-persian", { day: "numeric" }).format(
      start,
    ),
  );
  start.setDate(start.getDate() - pDay + 1);
  const cells: (Date | null)[] = Array((start.getDay() + 1) % 7).fill(null);
  for (let i = 0; i < 31; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (
      i > 0 &&
      Number(
        new Intl.DateTimeFormat("en-u-ca-persian", { day: "numeric" }).format(
          d,
        ),
      ) === 1
    )
      break;
    cells.push(d);
  }
  const exportCalendar = async () => {
    if (!meetings.length) {
      notify("هنوز زمانی برای جلسه تعیین نشده است.");
      return;
    }
    const stamp = (s: string) =>
      new Date(s).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const events = meetings
      .map(
        (m) =>
          `BEGIN:VEVENT\r\nUID:${m.id}@zentangle\r\nDTSTAMP:${stamp(new Date().toISOString())}\r\nDTSTART:${stamp(m.starts)}\r\nDURATION:PT1H\r\nSUMMARY:جلسه گروهی هنر زندگی\r\nURL:${m.url.replace(/[\r\n]/g, "")}\r\nEND:VEVENT`,
      )
      .join("\r\n");
    try {
      await downloadText(
        "zentangle-sessions.ics",
        `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Zentangle//FA\r\n${events}\r\nEND:VCALENDAR`,
        "text/calendar",
      );
    } catch {
      notify("خروجی تقویم ساخته نشد.");
    }
  };
  return (
    <Shell title="تقویم جلسات" subtitle="با هم بودن، بخشی از مسیر ماست">
      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <Pressable
            accessibilityLabel="ماه بعد"
            onPress={() => setMonth(month + 1)}
            style={{ padding: 12 }}
          >
            <Icon name="chevron-forward" />
          </Pressable>
          <T bold size={20}>
            {new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
              month: "long",
              year: "numeric",
            }).format(start)}
          </T>
          <Pressable
            accessibilityLabel="ماه قبل"
            onPress={() => setMonth(month - 1)}
            style={{ padding: 12 }}
          >
            <Icon name="chevron-back" />
          </Pressable>
        </Row>
        <View style={{ flexDirection: "row-reverse", flexWrap: "wrap" }}>
          {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((x, i) => (
            <View key={i} style={{ width: "14.285%", paddingVertical: 12 }}>
              <T center muted size={14}>
                {x}
              </T>
            </View>
          ))}
          {cells.map((d, i) => {
            const active = d?.toDateString() === today.toDateString();
            const event = meetings.some(
              (m) => new Date(m.starts).toDateString() === d?.toDateString(),
            );
            return (
              <View
                key={i}
                style={{
                  width: "14.285%",
                  alignItems: "center",
                  paddingVertical: 4,
                }}
              >
                <View
                  style={{
                    minWidth: 35,
                    minHeight: 39,
                    borderRadius: 22,
                    backgroundColor: active ? c.green : "transparent",
                    justifyContent: "center",
                  }}
                >
                  <T
                    center
                    size={15}
                    style={active ? { color: "#fff" } : undefined}
                  >
                    {d
                      ? new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
                          day: "numeric",
                        }).format(d)
                      : ""}
                  </T>
                </View>
                {event && (
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: c.gold,
                    }}
                  />
                )}
              </View>
            );
          })}
        </View>
      </Card>
      <T bold size={20}>
        جلسات گروهی
      </T>
      {groupCheckpoints.map((n) => {
        const m = meetings.find((x) => x.after === n);
        return (
          <Card key={n}>
            <Row>
              <Icon name="calendar-outline" color={c.green} size={30} />
              <View style={{ flex: 1 }}>
                <T bold>گفت‌وگوی گروهی پس از جلسه {fa(n)}</T>
                <T size={13} muted>
                  {m
                    ? new Date(m.starts).toLocaleString("fa-IR")
                    : "در انتظار اعلام زمان توسط درمانگر"}
                </T>
              </View>
            </Row>
            {m && (
              <Button
                label="مشاهده و ورود به جلسه"
                secondary
                onPress={() => router.push(`/meeting?meeting=${m.id}`)}
              />
            )}
          </Card>
        );
      })}
      <Button
        label="افزودن برنامه به تقویم"
        secondary
        icon="calendar-outline"
        onPress={exportCalendar}
      />
    </Shell>
  );
}
export function Meeting({ meetingId }: { meetingId: string }) {
  const { meetings, notify } = useStore();
  const meeting = meetings.find((m) => m.id === meetingId);
  return (
    <Shell title="جلسهٔ آنلاین گروهی">
      <Banner>
        <Row>
          <Icon name="videocam-outline" size={50} color="#246D52" />
          <View style={{ flex: 1 }}>
            <T bold size={22} style={{ color: "#203D30" }}>
              زمانی برای شنیدن یکدیگر
            </T>
            <T size={14} style={{ color: "#526347" }}>
              ارائهٔ آثار و گفت‌وگو با راهنمایی درمانگر
            </T>
          </View>
        </Row>
      </Banner>
      <Card>
        <T bold>
          {meeting
            ? `جلسهٔ گروهی پس از جلسه ${fa(meeting.after)}`
            : "هنوز جلسه‌ای تنظیم نشده است"}
        </T>
        <T muted>
          {meeting
            ? new Date(meeting.starts).toLocaleString("fa-IR")
            : "پیوند ورود پس از برنامه‌ریزی درمانگر در این قسمت نمایش داده می‌شود."}
        </T>
        <T size={15}>
          اثر خود را آماده کنید، در جای آرامی بنشینید و هنگام ورود اجازهٔ دوربین
          و میکروفن را در سرویس جلسه بررسی کنید.
        </T>
        {meeting?.provider !== "livekit" && (
          <Button
            disabled={!meeting}
            label="ورود به جلسهٔ آنلاین"
            icon="videocam-outline"
            onPress={async () => {
              if (meeting && /^https:\/\//i.test(meeting.url)) {
                try {
                  await Linking.openURL(meeting.url);
                } catch {
                  notify("باز کردن پیوند جلسه ممکن نشد.");
                }
              } else notify("پیوند معتبر جلسه هنوز ثبت نشده است.");
            }}
          />
        )}
        <T muted size={12}>
          {meeting?.provider === "livekit"
            ? "تماس صوتی یا تصویری را در پایین انتخاب کنید."
            : "تماس در سرویس تعیین‌شده توسط درمانگر باز می‌شود."}
        </T>
      </Card>
      {meeting?.provider === "livekit" && (
        <MeetingRoom key={meeting.id} meetingId={meeting.id} />
      )}
    </Shell>
  );
}

export function Notifications() {
  const { data, meetings } = useStore();
  const [filter, setFilter] = useState("همه");
  const entries = [
    ...meetings.map((m) => ({
      category: "جلسات",
      title: "جلسهٔ آنلاین برنامه‌ریزی شده است",
      detail: new Date(m.starts).toLocaleString("fa-IR"),
      path: `/meeting?meeting=${m.id}`,
      icon: "calendar-outline" as const,
    })),
    ...data.comments.map((x) => ({
      category: "بازخوردها",
      title: `${x.name} نظری ثبت کرده است`,
      detail: x.text,
      path: `/artwork?art=${x.artwork}`,
      icon: "chatbubble-outline" as const,
    })),
    {
      category: "سیستم",
      title: "به هنر زندگی خوش آمدید",
      detail: "مسیر خود را با یک نقش ساده آغاز کنید.",
      path: "/sessions",
      icon: "leaf-outline" as const,
    },
  ];
  return (
    <Shell title="اعلان‌ها">
      <Row>
        {["همه", "جلسات", "بازخوردها", "سیستم"].map((x) => (
          <Chip
            key={x}
            label={x}
            selected={filter === x}
            onPress={() => setFilter(x)}
          />
        ))}
      </Row>
      {!data.settings.notifications ? (
        <Card>
          <T>اعلان‌های داخل برنامه خاموش هستند.</T>
          <Button
            secondary
            label="تغییر تنظیمات"
            onPress={() => router.push("/settings")}
          />
        </Card>
      ) : (
        entries
          .filter((x) => filter === "همه" || x.category === filter)
          .map((x, i) => (
            <Card key={i}>
              <MenuItem
                label={x.title}
                detail={x.detail}
                icon={x.icon}
                onPress={() => router.push(x.path as never)}
              />
            </Card>
          ))
      )}
    </Shell>
  );
}
export function Resources() {
  const { notify } = useStore();
  return (
    <Shell title="منابع و ابزارها" subtitle="هرچه برای شروع نیاز دارید">
      <Card>
        <Row>
          <LeafArt size={95} />
          <View style={{ flex: 1 }}>
            <T bold size={20}>
              نمونهٔ الگوها
            </T>
            <T muted size={14}>
              نقطه، خط، منحنی و برگ
            </T>
          </View>
        </Row>
        <Button
          secondary
          label="مشاهدهٔ نمونه‌ها"
          onPress={() => router.push("/lesson?id=1")}
        />
      </Card>
      <Card>
        <T bold size={20}>
          راهنمای ابزار
        </T>
        {[
          "کاغذ سفید یا کرم، با اندازه‌ای که برایتان راحت است.",
          "یک قلم مشکی روان یا مداد نرم؛ ابزار گران لازم نیست.",
          "نور کافی، میز مناسب و صندلی راحت.",
          "در صورت خستگی دست یا چشم، تمرین را متوقف و استراحت کنید.",
        ].map((x) => (
          <T key={x} size={15}>
            {x}
          </T>
        ))}
      </Card>
      <Card>
        <T bold>برگهٔ تمرین</T>
        <T muted size={14}>
          برگهٔ قابل چاپ برای تمرین خط، دایره و الگوهای آزاد
        </T>
        <Button
          secondary
          icon="download-outline"
          label="دریافت برگهٔ تمرین"
          onPress={() =>
            downloadText(
              "zentangle-practice.svg",
              `<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123" viewBox="0 0 794 1123"><rect width="794" height="1123" fill="#fffdf7"/><text x="397" y="65" text-anchor="middle" font-family="sans-serif" font-size="25">ZENTANGLE · Practice sheet</text>${[0, 1, 2, 3].map((x) => `<rect x="65" y="${110 + x * 230}" width="664" height="200" rx="20" fill="none" stroke="#a7b8a0" stroke-width="2"/><text x="90" y="${145 + x * 230}" font-size="18" fill="#246d52">${["1. Dots & lines", "2. Circles & curves", "3. Repeating patterns", "4. Your own creation"][x]}</text>`).join("")}</svg>`,
              "image/svg+xml",
            ).catch(() => notify("دریافت فایل انجام نشد."))
          }
        />
      </Card>
    </Shell>
  );
}
export function Help() {
  const [open, setOpen] = useState<number | null>(0);
  const { notify } = useStore();
  const questions = [
    {
      q: "از کجا شروع کنم؟",
      a: "از صفحهٔ خانه، «ادامهٔ جلسه» را بزنید. آموزش را ببینید، قدم‌به‌قدم تمرین کنید و در پایان عکس اثر خود را ثبت کنید.",
    },
    {
      q: "چطور عکس نقاشی را ارسال کنم؟",
      a: "در صفحهٔ تمرین «ارسال اثر من» را انتخاب کنید. از دوربین یا گالری عکس بردارید، یک نام بنویسید و نمایش در گروه را تأیید کنید.",
    },
    {
      q: "چه کسانی آثار من را می‌بینند؟",
      a: "در نسخهٔ متصل، فقط اعضای گروه شما و درمانگر گروه به آثار دسترسی دارند. در نسخهٔ آزمایشی داده‌ها روی همین دستگاه نگهداری می‌شوند.",
    },
    {
      q: "اگر نقاشی بلد نباشم چه کنم؟",
      a: "برای شروع به تجربهٔ قبلی نیاز نیست. از نقطه و خط شروع می‌کنیم. می‌توانید هر مرحله را چند بار مرور کنید.",
    },
    {
      q: "چرا جلسهٔ بعدی قفل است؟",
      a: "جلسات به‌ترتیب باز می‌شوند. عکس تمرین جلسهٔ جاری را ثبت کنید تا جلسهٔ بعد باز شود.",
    },
  ];
  return (
    <Shell title="راهنما و پشتیبانی">
      <Row style={{ justifyContent: "center" }}>
        <Lotus size={65} />
      </Row>
      <T bold center size={24}>
        ما همراه شما هستیم
      </T>
      <T muted center>
        هر سؤالی دارید، از اینجا شروع کنید.
      </T>
      {questions.map((x, i) => (
        <Card key={x.q}>
          <Pressable
            onPress={() => setOpen(open === i ? null : i)}
            accessibilityRole="button"
            accessibilityState={{ expanded: open === i }}
          >
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <T bold>{x.q}</T>
              </View>
              <Icon name={open === i ? "remove" : "add"} />
            </Row>
          </Pressable>
          {open === i && (
            <T size={15} muted>
              {x.a}
            </T>
          )}
        </Card>
      ))}
      <Button
        label="مرور راهنمای تصویری"
        secondary
        onPress={() => router.push("/guide?id=1")}
      />
      <Button
        label="تماس با پشتیبانی"
        icon="call-outline"
        onPress={() => {
          const email = process.env.EXPO_PUBLIC_SUPPORT_EMAIL;
          if (email)
            Linking.openURL(`mailto:${email}`).catch(() =>
              notify("برنامهٔ ایمیل در دسترس نیست."),
            );
          else notify("نشانی پشتیبانی هنوز توسط مدیر برنامه تنظیم نشده است.");
        }}
      />
    </Shell>
  );
}
