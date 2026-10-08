import React, { useState } from "react";
import { View, Pressable, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  Card,
  T,
  Button,
  Row,
  Shell,
  Icon,
  Banner,
  Avatar,
  Chip,
  useColors,
} from "../components/ui";
import { LeafArt, Botanical } from "../components/Art";
import { useStore } from "../lib/store";
import { lessons, currentLesson, canOpenLesson, fa } from "../data/program";

export function Home() {
  const { data, demo, meetings } = useStore();
  const c = useColors();
  const current = currentLesson(data.completed);
  const l = lessons[current - 1];
  const { width } = useWindowDimensions();
  const wide = width > 1150;
  return (
    <Shell
      title="امروز، فرصتی برای خلق آرامش"
      subtitle="به هنر زندگی خوش آمدید"
      back={false}
    >
      <Row>
        <Avatar uri={data.avatar} sample={demo} size={61} />
        <View style={{ flex: 1 }}>
          <T bold size={width < 500 ? 20 : 23}>
            سلام {data.name}
          </T>
          <T muted>روز خوبی داشته باشید ☀</T>
        </View>
        {width >= 500 && (
          <View
            style={{
              backgroundColor: c.sage,
              paddingHorizontal: 13,
              paddingVertical: 5,
              borderRadius: 20,
            }}
          >
            <T size={12}>مسیر آرامش من</T>
          </View>
        )}
      </Row>
      <View style={{ flexDirection: wide ? "row-reverse" : "column", gap: 22 }}>
        <View style={{ flex: 1, gap: 20 }}>
          <Banner>
            <View
              style={{
                position: "absolute",
                left: -35,
                top: -30,
                opacity: 0.4,
              }}
            >
              <Botanical size={160} />
            </View>
            <Row>
              <View style={{ flex: 1 }}>
                <T size={14} style={{ color: "#516348" }}>
                  جلسهٔ فعلی شما
                </T>
                <T bold size={31} style={{ color: "#203D30" }}>
                  جلسه {fa(current)}
                </T>
                <T bold size={20} style={{ color: "#203D30" }}>
                  {l.title}
                </T>
                <T size={13} style={{ color: "#526347", marginTop: 8 }}>
                  {l.subtitle}
                </T>
              </View>
              <LeafArt size={wide ? 165 : 135} />
            </Row>
            <View style={{ height: 18 }} />
            <Button
              label={
                data.completed.length === 12 ? "مرور جلسه‌ها" : "ادامهٔ جلسه"
              }
              icon="arrow-back"
              onPress={() => router.push(`/lesson?id=${current}`)}
            />
          </Banner>
          <Card>
            <Row style={{ justifyContent: "space-between" }}>
              <T bold>پیشرفت شما</T>
              <T muted size={13}>
                {fa(data.completed.length)} از ۱۲ جلسه
              </T>
            </Row>
            <View
              style={{
                height: 9,
                borderRadius: 8,
                backgroundColor: c.line,
                overflow: "hidden",
                alignItems: "flex-end",
              }}
            >
              <View
                style={{
                  height: 9,
                  borderRadius: 8,
                  width: `${(data.completed.length / 12) * 100}%`,
                  backgroundColor: c.green,
                }}
              />
            </View>
            <T size={13} muted>
              هر قدم کوچک، بخشی از یک مسیر زیباست.
            </T>
          </Card>
          <Row>
            {[
              {
                title: "آثار من",
                icon: "color-palette-outline" as const,
                url: "/gallery?filter=mine",
              },
              {
                title: "جلسات آنلاین",
                icon: "videocam-outline" as const,
                url: "/calendar",
              },
              {
                title: "جامعهٔ هنرمندان",
                icon: "people-outline" as const,
                url: "/gallery",
              },
            ].map((x) => (
              <Pressable
                key={x.title}
                onPress={() => router.push(x.url as never)}
                style={{ flex: 1 }}
              >
                <Card
                  style={{
                    alignItems: "center",
                    paddingHorizontal: 5,
                    paddingVertical: 21,
                  }}
                >
                  <Icon name={x.icon} size={30} color={c.green} />
                  <T center size={12}>
                    {x.title}
                  </T>
                </Card>
              </Pressable>
            ))}
          </Row>
        </View>
        <View style={{ flex: wide ? 0.82 : undefined, gap: 20 }}>
          <Card>
            <Row>
              <View
                style={{
                  width: 52,
                  height: 52,
                  backgroundColor: c.sage,
                  borderRadius: 15,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Icon name="calendar-outline" color={c.green} size={28} />
              </View>
              <View style={{ flex: 1 }}>
                <T bold>جلسهٔ آنلاین بعدی</T>
                <T size={13} muted>
                  {meetings[0]
                    ? new Date(meetings[0].starts).toLocaleString("fa-IR")
                    : "پس از هر دو جلسه، کنار هم هستیم"}
                </T>
              </View>
            </Row>
            <T size={14} muted>
              {meetings[0]
                ? "با دوستانتان دربارهٔ آثار و تجربه‌ها گفت‌وگو کنید."
                : "زمان و پیوند ورود توسط درمانگر اعلام می‌شود."}
            </T>
            <Button
              label="مشاهدهٔ برنامه"
              secondary
              onPress={() => router.push("/calendar")}
            />
          </Card>
          <Card>
            <Row>
              <Icon name="sparkles-outline" color={c.gold} />
              <T bold>یادآوری مهربان امروز</T>
            </Row>
            <T size={19}>
              «برای خلق کردن، کافی است شروع کنید؛ هر خط شما ارزشمند است.»
            </T>
            <T size={13} muted>
              یک جای آرام، یک کاغذ و چند دقیقه برای خودتان.
            </T>
          </Card>
          <Pressable onPress={() => router.push("/resources")}>
            <Row style={{ justifyContent: "space-between", padding: 10 }}>
              <T bold style={{ color: c.green }}>
                منابع و ابزارهای نقاشی
              </T>
              <Icon name="arrow-back" color={c.green} />
            </Row>
          </Pressable>
        </View>
      </View>
    </Shell>
  );
}
export function Sessions() {
  const [part, setPart] = useState(1);
  const { data, notify } = useStore();
  const c = useColors();
  return (
    <Shell title="جلسات برنامه" subtitle="۱۲ قدم، از اولین خط تا داستان زندگی">
      <Banner>
        <T bold size={21} style={{ color: "#203D30" }}>
          {part === 1
            ? "بخش اول: آشنایی و خلق کردن"
            : "بخش دوم: داستان زندگی در هنر"}
        </T>
        <T size={14} style={{ color: "#526347" }}>
          با سرعت خودتان پیش بروید؛ اینجا عجله‌ای نیست.
        </T>
      </Banner>
      <Row>
        <Chip
          label="جلسات ۱ تا ۶"
          selected={part === 1}
          onPress={() => setPart(1)}
        />
        <Chip
          label="جلسات ۷ تا ۱۲"
          selected={part === 2}
          onPress={() => setPart(2)}
        />
      </Row>
      <View style={{ gap: 11 }}>
        {lessons
          .filter((l) => l.part === part)
          .map((l) => {
            const done = data.completed.includes(l.id);
            const open = canOpenLesson(l.id, data.completed);
            const active = l.id === currentLesson(data.completed);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`جلسه ${fa(l.id)} ${l.title}${!open ? " قفل" : ""}`}
                key={l.id}
                onPress={() =>
                  open
                    ? router.push(`/lesson?id=${l.id}`)
                    : notify("ابتدا تمرین جلسهٔ قبل را ثبت کنید.")
                }
              >
                <Card
                  style={{
                    padding: 15,
                    backgroundColor: active ? c.sage : c.card,
                    borderColor: active ? c.green : c.line,
                  }}
                >
                  <Row>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: done
                          ? "#DDEBDD"
                          : active
                            ? "#A9C5AB"
                            : "#F8E2D7",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <T
                        bold
                        size={24}
                        style={{ color: active ? "#245039" : "#7D4F38" }}
                      >
                        {fa(l.id)}
                      </T>
                    </View>
                    <View style={{ flex: 1 }}>
                      <T bold={active}>{l.title}</T>
                      <T size={12} muted>
                        {done
                          ? "تکمیل شده"
                          : active
                            ? "در حال انجام"
                            : l.subtitle}
                      </T>
                    </View>
                    <Icon
                      name={
                        done
                          ? "checkmark-circle"
                          : open
                            ? "chevron-back"
                            : "lock-closed-outline"
                      }
                      color={done ? c.green : c.muted}
                      size={22}
                    />
                  </Row>
                </Card>
              </Pressable>
            );
          })}
      </View>
      <T muted size={13}>
        جلسهٔ گروهی پس از جلسات ۲، ۴، ۶، ۸، ۱۰ و ۱۲ برگزار می‌شود.
      </T>
    </Shell>
  );
}
function LessonVideo({ url }: { url: string }) {
  const { data } = useStore();
  const player = useVideoPlayer(url, (p) => {
    if (data.settings.autoplay) p.play();
  });
  return (
    <VideoView
      player={player}
      style={{ width: "100%", height: 270, borderRadius: 18 }}
      nativeControls
      fullscreenOptions={{ enable: true }}
    />
  );
}
export function Lesson({ id }: { id: number }) {
  const [tab, setTab] = useState(0);
  const { videos } = useStore();
  const l = lessons[id - 1];
  const c = useColors();
  return (
    <Shell title={`جلسه ${fa(id)}`} subtitle={l.title}>
      <Row>
        {["آموزش", "تمرین", "نمونه‌ها"].map((x, i) => (
          <Chip
            key={x}
            label={x}
            selected={tab === i}
            onPress={() => setTab(i)}
          />
        ))}
      </Row>
      {tab === 0 ? (
        <>
          {videos[id] ? (
            <LessonVideo url={videos[id]} />
          ) : (
            <Card
              style={{
                alignItems: "center",
                padding: 22,
                backgroundColor: c.sage,
              }}
            >
              <LeafArt size={230} />
              <T bold size={19}>
                از یک خط ساده شروع کنیم
              </T>
              <T size={13} center muted>
                آموزش تصویری مرحله‌به‌مرحله آماده است.
              </T>
              <Button
                label="دیدن راهنمای تصویری"
                icon="play-circle-outline"
                secondary
                onPress={() => router.push(`/guide?id=${id}`)}
              />
            </Card>
          )}
          <Card>
            <T bold size={20}>
              آنچه در این جلسه یاد می‌گیریم
            </T>
            {l.goals.map((g) => (
              <Row key={g}>
                <Icon name="checkmark-circle" color={c.green} size={20} />
                <View style={{ flex: 1 }}>
                  <T size={15}>{g}</T>
                </View>
              </Row>
            ))}
          </Card>
          <Button
            label="شروع تمرین"
            onPress={() => router.push(`/practice?id=${id}`)}
          />
        </>
      ) : tab === 1 ? (
        <>
          <Card>
            <T bold size={20}>
              تمرین امروز شما
            </T>
            <T>{l.prompt}</T>
            <T muted size={14}>
              کاغذ، مداد یا قلم مشکی را آماده کنید. هر زمان نیاز داشتید استراحت
              کنید.
            </T>
          </Card>
          <Button
            label="شروع راهنمای مرحله‌ای"
            onPress={() => router.push(`/guide?id=${id}`)}
          />
          <Button
            label="آماده‌ام؛ ارسال اثر"
            secondary
            onPress={() => router.push(`/upload?id=${id}`)}
          />
        </>
      ) : (
        <>
          <Card style={{ alignItems: "center" }}>
            <LeafArt size={280} />
            <T muted size={13}>
              نمونهٔ الهام‌بخش؛ اثر شما می‌تواند کاملاً متفاوت باشد.
            </T>
          </Card>
          <Button
            label="گالری دوستان"
            secondary
            onPress={() => router.push("/gallery")}
          />
        </>
      )}
    </Shell>
  );
}
export function Guide({ id }: { id: number }) {
  const [step, setStep] = useState(0);
  const l = lessons[id - 1];
  const c = useColors();
  return (
    <Shell title="راهنمای مرحله‌به‌مرحله" subtitle={l.title}>
      <Row style={{ justifyContent: "space-between" }}>
        <T muted size={13}>
          با آرامش، یک قدم در هر بار
        </T>
        <T bold>{fa(step + 1)} از ۵</T>
      </Row>
      <Card style={{ alignItems: "center", paddingVertical: 34 }}>
        <LeafArt stage={step + 1} size={290} />
        <T bold size={23}>
          مرحله {fa(step + 1)}
        </T>
        <T center size={19}>
          {l.steps[step]}
        </T>
      </Card>
      <Row>
        {l.steps.map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 3,
              backgroundColor: i <= step ? c.green : c.line,
            }}
          />
        ))}
      </Row>
      <Button
        label={step === 4 ? "انجام دادم؛ ثبت اثر" : "مرحلهٔ بعد"}
        onPress={() =>
          step < 4 ? setStep(step + 1) : router.push(`/upload?id=${id}`)
        }
      />
      <Button
        secondary
        label="مرحلهٔ قبل"
        disabled={step === 0}
        onPress={() => setStep(step - 1)}
      />
      <T center size={13} muted>
        {id !== 3
          ? "برگ نمونه‌ای برای نمایش افزوده شدن جزئیات است؛ دستور هر مرحله را برای موضوع خودتان انجام دهید."
          : "اگر خطی متفاوت شد، آن را بخشی از نقش خودتان بدانید."}
      </T>
    </Shell>
  );
}
export function Practice({ id }: { id: number }) {
  const l = lessons[id - 1];
  return (
    <Shell title="تمرین امروز" subtitle="حالا شما امتحان کنید">
      <Card style={{ alignItems: "center" }}>
        <LeafArt size={290} />
        <T bold size={22}>
          {l.title}
        </T>
        <T center muted>
          {l.prompt}
        </T>
      </Card>
      <Button
        label="ارسال اثر من"
        icon="cloud-upload-outline"
        onPress={() => router.push(`/upload?id=${id}`)}
      />
      <Row>
        <View style={{ flex: 1 }}>
          <Button
            label="راهنمای تصویری"
            secondary
            onPress={() => router.push(`/guide?id=${id}`)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="ابزارها"
            secondary
            onPress={() => router.push("/resources")}
          />
        </View>
      </Row>
    </Shell>
  );
}
