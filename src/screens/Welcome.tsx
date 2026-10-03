import React, { useState } from "react";
import { View, Image, Pressable, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { T, Button, Field, Row, Shell, useColors } from "../components/ui";
import { Lotus, LeafArt, Botanical } from "../components/Art";
import { useStore } from "../lib/store";
import { supabase, isConfigured } from "../lib/supabase";

export function Welcome() {
  const [step, setStep] = useState(0);
  const { patch } = useStore();
  const c = useColors();
  const { width } = useWindowDimensions();
  return (
    <Shell title="" noNav back={false}>
      <View style={{ alignItems: "center", gap: 20 }}>
        {step === 0 ? (
          <View
            style={{
              height: width > 700 ? 300 : 270,
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View style={{ position: "absolute", left: -15, bottom: 0 }}>
              <Botanical size={130} />
            </View>
            <Lotus size={80} />
            <T size={49} bold style={{ color: c.green }}>
              هنر زندگی
            </T>
            <T center muted>
              هنردرمانی آنلاین برای سالمندان
            </T>
            <T center size={14}>
              با روش Zentangle
            </T>
          </View>
        ) : step === 1 ? (
          <Image
            source={require("../../assets/hero.png")}
            style={{ width: "100%", height: 330, borderRadius: 25 }}
            resizeMode="cover"
          />
        ) : (
          <LeafArt size={300} />
        )}
        <T center bold size={28}>
          {
            [
              "هر خط، فرصتی برای آرامش",
              "خلق آرامش\nبا هر خط",
              "همراه هم یاد می‌گیریم",
            ][step]
          }
        </T>
        <T center muted size={17}>
          {
            [
              "در کنار هم، از نقش‌های ساده به داستان‌های زیبای زندگی می‌رسیم.",
              "با هنر زنتنگل، لحظه‌ای برای خودتان بسازید.\nقلم را بردارید؛ اینجا هر نقشی زیباست.",
              "آموزش‌های مرحله‌به‌مرحله\nتمرین‌های ساده و لذت‌بخش\nجلسات گروهی و گفت‌وگو با دوستان",
            ][step]
          }
        </T>
        {step === 0 && <LeafArt size={180} />}
        <Row style={{ justifyContent: "center", marginVertical: 7 }}>
          {[0, 1, 2].map((i) => (
            <Pressable
              accessibilityLabel={`صفحه معرفی ${i + 1}`}
              key={i}
              onPress={() => setStep(i)}
              style={{
                width: step === i ? 24 : 8,
                height: 8,
                borderRadius: 8,
                backgroundColor: step === i ? c.green : "#CBD2C2",
              }}
            />
          ))}
        </Row>
        <View style={{ width: "100%", gap: 10 }}>
          <Button
            label={step === 2 ? "شروع مسیر من" : "ادامه"}
            onPress={() => {
              if (step < 2) setStep(step + 1);
              else {
                patch({ onboarded: true });
                router.replace("/login");
              }
            }}
          />
          <Pressable
            onPress={() => {
              patch({ onboarded: true });
              router.replace("/login");
            }}
            style={{ padding: 12 }}
          >
            <T center muted size={14}>
              قبلاً همراه ما بوده‌اید؟ ورود به حساب
            </T>
          </Pressable>
        </View>
      </View>
    </Shell>
  );
}

export function Login() {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const { enterDemo, notify } = useStore();
  const submit = async () => {
    setError("");
    if (!supabase) {
      setError(
        "ورود واقعی پس از اتصال سرویس فعال می‌شود. اکنون می‌توانید نسخهٔ آزمایشی را ببینید.",
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("لطفاً یک نشانی ایمیل معتبر بنویسید.");
      return;
    }
    if (password.length < 8) {
      setError("رمز عبور باید حداقل ۸ نویسه داشته باشد.");
      return;
    }
    if (signup && (!name.trim() || !consent)) {
      setError("نام و موافقت با شرایط ثبت‌نام ضروری است.");
      return;
    }
    setBusy(true);
    try {
      const result = signup
        ? await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { display_name: name.trim() } },
          })
        : await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
      if (result.error) throw result.error;
      if (signup && !result.data.session)
        notify("پیوند تأیید به ایمیل شما ارسال شد. پس از تأیید وارد شوید.");
      else router.replace("/home");
    } catch {
      setError("ورود انجام نشد؛ اطلاعات حساب و اتصال اینترنت را بررسی کنید.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell title="" noNav>
      <View style={{ alignItems: "center", gap: 7, marginBottom: 20 }}>
        <Lotus size={68} />
        <T bold size={29}>
          {signup ? "به جمع ما خوش آمدید" : "ورود به حساب"}
        </T>
        <T muted center>
          برای ادامه، وارد شوید یا ثبت‌نام کنید.
        </T>
      </View>
      <View style={{ gap: 14 }}>
        {signup && (
          <>
            <T size={14}>نام و نام خانوادگی</T>
            <Field
              value={name}
              onChangeText={setName}
              placeholder="نام شما"
              accessibilityLabel="نام و نام خانوادگی"
            />
          </>
        )}
        <T size={14}>ایمیل</T>
        <Field
          value={email}
          onChangeText={setEmail}
          placeholder="example@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="ایمیل"
        />
        <T size={14}>رمز عبور</T>
        <Field
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="حداقل ۸ نویسه"
          accessibilityLabel="رمز عبور"
          onSubmitEditing={submit}
        />
        {signup ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consent }}
            onPress={() => setConsent(!consent)}
          >
            <T size={14}>
              {consent ? "☑" : "☐"} می‌دانم آثارم برای اعضای گروه و درمانگر قابل
              مشاهده است. این ثبت‌نام جایگزین رضایت‌نامهٔ پژوهش نیست.
            </T>
          </Pressable>
        ) : (
          <Pressable
            onPress={async () => {
              if (!supabase) {
                notify("بازیابی رمز پس از اتصال سرویس فعال می‌شود.");
                return;
              }
              if (!process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL) {
                notify("پیوند بازیابی رمز هنوز توسط مدیر تنظیم نشده است.");
                return;
              }
              if (!email.includes("@")) {
                notify("ابتدا ایمیل حساب خود را وارد کنید.");
                return;
              }
              const { error: e } = await supabase.auth.resetPasswordForEmail(
                email.trim(),
                { redirectTo: process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL },
              );
              notify(
                e
                  ? "ارسال پیوند ناموفق بود."
                  : "در صورت وجود حساب، ایمیل بازیابی ارسال می‌شود.",
              );
            }}
          >
            <T size={13}>رمز عبور را فراموش کرده‌اید؟</T>
          </Pressable>
        )}
        {error ? (
          <T size={14} style={{ color: "#B34032" }}>
            {error}
          </T>
        ) : null}
        <Button
          label={busy ? "لطفاً کمی صبر کنید…" : signup ? "ثبت‌نام" : "ورود"}
          disabled={busy}
          onPress={submit}
        />
        <T center muted size={13}>
          یا
        </T>
        <Button
          secondary
          label={signup ? "حساب دارم؛ ورود" : "ثبت‌نام جدید"}
          onPress={() => {
            setSignup(!signup);
            setError("");
          }}
        />
        <LinearGradient
          colors={["#E2E7D8", "#F2E8D6"]}
          style={{ padding: 18, borderRadius: 20, gap: 10 }}
        >
          <T center bold>
            ابتدا با هنر زندگی آشنا شوید
          </T>
          <T size={13} center style={{ color: "#526347" }}>
            بدون حساب، صفحات و امکانات را با داده‌های نمونه تجربه کنید.
          </T>
          <Button
            label="ورود به نسخهٔ آزمایشی"
            secondary
            onPress={() => {
              enterDemo();
              router.replace("/home");
            }}
          />
        </LinearGradient>
        {!isConfigured && (
          <T size={12} muted center>
            حساب واقعی هنوز به سرویس متصل نشده است.
          </T>
        )}
      </View>
    </Shell>
  );
}
