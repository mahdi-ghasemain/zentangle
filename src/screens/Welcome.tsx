import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Image,
  Pressable,
  Keyboard,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { T, Button, Field, Row, Shell, useColors } from "../components/ui";
import { Lotus, LeafArt, Botanical } from "../components/Art";
import { useStore } from "../lib/store";
import { supabase } from "../lib/supabase";
import { latinDigits, normalizeIranPhone, phoneAuthError } from "../lib/phone";

export function Welcome() {
  const [step, setStep] = useState(0);
  const { patch } = useStore();
  const c = useColors();
  const { width, height } = useWindowDimensions();
  const compact = height < 740;
  const [artHeight, setArtHeight] = useState(100);
  const artSize = Math.max(0, Math.min(300, width - 48, artHeight));
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flex: 1, minHeight: 0, width: "100%", maxWidth: 600, alignSelf: "center", paddingHorizontal: 20, paddingVertical: 8, gap: compact ? 8 : 16 }}>
      <View onLayout={(e) => setArtHeight(e.nativeEvent.layout.height)} style={{ flex: 1, minHeight: 0, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {step === 0 ? (
          <View
            style={{
              height: "100%",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View style={{ position: "absolute", left: -15, bottom: 0 }}>
              <Botanical size={Math.min(100, artSize / 2)} />
            </View>
            <Lotus size={Math.min(70, artSize / 4)} />
            <T size={compact ? 36 : 49} bold style={{ color: c.green, lineHeight: compact ? 50 : 66 }}>
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
            style={{ width: "100%", height: "100%", borderRadius: 25 }}
            resizeMode="cover"
          />
        ) : (
          <LeafArt size={artSize} />
        )}
      </View>
        <T center bold size={compact ? 23 : 28} style={{ lineHeight: compact ? 32 : 40 }}>
          {
            [
              "هر خط، فرصتی برای آرامش",
              "خلق آرامش\nبا هر خط",
              "همراه هم یاد می‌گیریم",
            ][step]
          }
        </T>
        <T center muted size={compact ? 15 : 17} style={{ lineHeight: compact ? 25 : 30 }}>
          {
            [
              "در کنار هم، از نقش‌های ساده به داستان‌های زیبای زندگی می‌رسیم.",
              "با هنر زنتنگل، لحظه‌ای برای خودتان بسازید.\nقلم را بردارید؛ اینجا هر نقشی زیباست.",
              "آموزش‌های مرحله‌به‌مرحله\nتمرین‌های ساده و لذت‌بخش\nجلسات گروهی و گفت‌وگو با دوستان",
            ][step]
          }
        </T>

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
        <View style={{ width: "100%", gap: 4, flexShrink: 0 }}>
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
    </SafeAreaView>
  );
}

export function Login() {
  const [signup, setSignup] = useState(false);
  const [phone, setPhone] = useState("");
  const [sentPhone, setSentPhone] = useState("");
  const [requestAccepted, setRequestAccepted] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [retryAt, setRetryAt] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const inFlight = useRef(false);
  const { height } = useWindowDimensions();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const compact = height < 740 || keyboardOpen;
  useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardOpen(true),
    );
    const hidden = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardOpen(false),
    );
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);
  useEffect(() => {
    const tick = () =>
      setRemaining(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [retryAt]);
  const sendCode = async () => {
    if (inFlight.current || Date.now() < retryAt) return;
    setError("");
    const normalized = normalizeIranPhone(phone);
    if (!normalized) {
      setError("شماره موبایل معتبر ایران را وارد کنید؛ مانند ۰۹۱۲۳۴۵۶۷۸۹.");
      return;
    }
    if (signup && (!name.trim() || !consent)) {
      setError("نام و موافقت با شرایط ثبت‌نام ضروری است.");
      return;
    }
    if (!supabase) {
      setError(
        "اتصال ورود در این نسخه تنظیم نشده است؛ لطفاً نسخهٔ به‌روز برنامه را نصب کنید.",
      );
      return;
    }
    setSentPhone(normalized);
    setRequestAccepted(false);
    setCode("");
    inFlight.current = true;
    setBusy(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        phone: normalized,
        options: {
          shouldCreateUser: signup,
          ...(signup ? { data: { display_name: name.trim() } } : {}),
        },
      });
      if (authError) throw authError;
      setRequestAccepted(true);
      setCode("");
      setRetryAt(Date.now() + 60000);
    } catch (e) {
      setError(phoneAuthError(e));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const verifyCode = async () => {
    if (inFlight.current || !supabase || !sentPhone || !requestAccepted)
      return;
    setError("");
    const token = latinDigits(code).trim();
    if (!/^\d{6}$/.test(token)) {
      setError("کد ۶ رقمی پیامک‌شده را وارد کنید.");
      return;
    }
    inFlight.current = true;
    setBusy(true);
    try {
      const { data, error: authError } = await supabase.auth.verifyOtp({
        phone: sentPhone,
        token,
        type: "sms",
      });
      if (authError) throw authError;
      if (!data.session) throw new Error("Missing session");
      router.replace("/home");
    } catch (e) {
      setError(phoneAuthError(e, true));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return (
    <Shell
      title=""
      noNav
      back={false}
      centered
      scrollable={false}
      compact={compact}
    >
      <View
        style={{
          alignItems: "center",
          gap: compact ? 2 : 5,
          marginBottom: compact ? 0 : 8,
        }}
      >
        {!keyboardOpen && <Lotus size={compact ? 36 : signup ? 44 : 68} />}
        <T bold size={compact ? 23 : 29}>
          {sentPhone
            ? "کد تأیید را وارد کنید"
            : signup
              ? "به جمع ما خوش آمدید"
              : "ورود با شماره موبایل"}
        </T>
        {!keyboardOpen && (
          <T muted center size={compact ? 13 : 16}>
            {sentPhone
              ? requestAccepted
                ? "درخواست ارسال به " + "0" + sentPhone.slice(3) + " پذیرفته شد. دریافت پیامک ممکن است کمی طول بکشد."
                : busy
                  ? "در حال درخواست ارسال کد…"
                  : "ارسال کد کامل نشد؛ پیام زیر را بررسی کنید و دوباره ارسال کنید."
              : "با شماره موبایل و کد پیامکی وارد شوید."}
          </T>
        )}
      </View>
      <View style={{ gap: compact ? 6 : signup ? 8 : 12 }}>
        {signup && !sentPhone && (
          <>
            {!keyboardOpen && (
              <T size={compact ? 12 : 14}>نام و نام خانوادگی</T>
            )}
            <Field
              value={name}
              onChangeText={setName}
              editable={!busy}
              maxLength={100}
              placeholder="نام شما"
              accessibilityLabel="نام و نام خانوادگی"
              style={compact ? { minHeight: 46, padding: 10 } : undefined}
            />
          </>
        )}
        {sentPhone ? (
          <>
            {!keyboardOpen && (
              <T size={compact ? 12 : 14}>کد تأیید ۶ رقمی</T>
            )}
            <Field
              key="otp"
              value={code}
              onChangeText={(v) => setCode(latinDigits(v))}
              placeholder="کد پیامک‌شده"
              accessibilityLabel="کد تأیید"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              maxLength={6}
              editable={!busy}
              style={{
                minHeight: compact ? 46 : undefined,
                padding: compact ? 10 : undefined,
                textAlign: "center",
                writingDirection: "ltr",
                letterSpacing: 8,
              }}
              onSubmitEditing={verifyCode}
            />
            {!keyboardOpen && (
              <Button
                small={compact}
                secondary
                disabled={busy || remaining > 0}
                label={remaining > 0 ? "ارسال مجدد تا " + remaining.toLocaleString("fa-IR") + " ثانیه دیگر" : "ارسال مجدد کد"}
                onPress={sendCode}
              />
            )}
            {!keyboardOpen && (
              <Button
                small={compact}
                secondary
                disabled={busy}
                label="ویرایش شماره موبایل"
                onPress={() => {
                  setSentPhone("");
                  setCode("");
                  setError("");
                }}
              />
            )}
          </>
        ) : (
          <>
            {!keyboardOpen && (
              <T size={compact ? 12 : 14}>شماره موبایل</T>
            )}
            <Field
              key="phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="09123456789"
              keyboardType="phone-pad"
              autoComplete="tel"
              accessibilityLabel="شماره موبایل"
              editable={!busy}
              maxLength={24}
              style={{
                minHeight: compact ? 46 : undefined,
                padding: compact ? 10 : undefined,
                textAlign: "left",
                writingDirection: "ltr",
              }}
              onSubmitEditing={sendCode}
            />
            {signup && (
              <Pressable
                disabled={busy}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: consent, disabled: busy }}
                onPress={() => setConsent(!consent)}
              >
                <T size={compact ? 12 : 14}>
                  {consent ? "☑" : "☐"} می‌دانم آثارم برای اعضای گروه و درمانگر
                  قابل مشاهده است. این ثبت‌نام جایگزین رضایت‌نامهٔ پژوهش نیست.
                </T>
              </Pressable>
            )}
          </>
        )}
        {error ? (
          <View accessibilityRole="alert" accessibilityLiveRegion="polite">
            <T size={compact ? 12 : 14} style={{ color: "#B34032" }}>
              {error}
            </T>
          </View>
        ) : null}
        <Button
          small={compact}
          label={
            busy
              ? "لطفاً کمی صبر کنید…"
              : sentPhone
                ? "تأیید و ورود"
                : remaining > 0
                  ? "دریافت کد تا " +
                    remaining.toLocaleString("fa-IR") +
                    " ثانیه دیگر"
                  : "دریافت کد تأیید"
          }
          disabled={busy || (sentPhone ? !requestAccepted : remaining > 0)}
          onPress={sentPhone ? verifyCode : sendCode}
        />
        {!keyboardOpen && (
          <Button
            small={compact}
            secondary
            disabled={busy}
            label={signup ? "حساب دارم؛ ورود" : "ثبت‌نام جدید"}
            onPress={() => {
              setSignup(!signup);
              setSentPhone("");
              setCode("");
              setError("");
            }}
          />
        )}
      </View>
    </Shell>
  );
}
