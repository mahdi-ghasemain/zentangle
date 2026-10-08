import React, { useEffect, useRef, useState } from "react";
import { View, Image, Pressable, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { T, Button, Field, Row, Shell, useColors } from "../components/ui";
import { Lotus, LeafArt, Botanical } from "../components/Art";
import { useStore } from "../lib/store";
import { supabase, isConfigured } from "../lib/supabase";
import { latinDigits, normalizeIranPhone, phoneAuthError } from "../lib/phone";

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
  const [phone, setPhone] = useState("");
  const [sentPhone, setSentPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [retryAt, setRetryAt] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const inFlight = useRef(false);
  const { enterDemo } = useStore();
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
        "ورود پیامکی هنوز فعال نشده است. می‌توانید نسخهٔ آزمایشی را ببینید.",
      );
      return;
    }
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
      setSentPhone(normalized);
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
    if (inFlight.current || !supabase || !sentPhone) return;
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
    <Shell title="" noNav>
      <View style={{ alignItems: "center", gap: 7, marginBottom: 20 }}>
        <Lotus size={68} />
        <T bold size={29}>
          {sentPhone
            ? "کد تأیید را وارد کنید"
            : signup
              ? "به جمع ما خوش آمدید"
              : "ورود با شماره موبایل"}
        </T>
        <T muted center>
          {sentPhone
            ? "کد تأیید به " + "0" + sentPhone.slice(3) + " ارسال شد."
            : "با شماره موبایل و کد پیامکی وارد شوید."}
        </T>
      </View>
      <View style={{ gap: 14 }}>
        {signup && !sentPhone && (
          <>
            <T size={14}>نام و نام خانوادگی</T>
            <Field
              value={name}
              onChangeText={setName}
              editable={!busy}
              maxLength={100}
              placeholder="نام شما"
              accessibilityLabel="نام و نام خانوادگی"
            />
          </>
        )}
        {sentPhone ? (
          <>
            <T size={14}>کد تأیید ۶ رقمی</T>
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
                textAlign: "center",
                writingDirection: "ltr",
                letterSpacing: 8,
              }}
              onSubmitEditing={verifyCode}
            />
            <Button
              secondary
              disabled={busy || remaining > 0}
              label={
                remaining > 0
                  ? "ارسال مجدد تا " +
                    remaining.toLocaleString("fa-IR") +
                    " ثانیه دیگر"
                  : "ارسال مجدد کد"
              }
              onPress={sendCode}
            />
            <Button
              secondary
              disabled={busy}
              label="ویرایش شماره موبایل"
              onPress={() => {
                setSentPhone("");
                setCode("");
                setError("");
              }}
            />
          </>
        ) : (
          <>
            <T size={14}>شماره موبایل</T>
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
              style={{ textAlign: "left", writingDirection: "ltr" }}
              onSubmitEditing={sendCode}
            />
            {signup && (
              <Pressable
                disabled={busy}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: consent, disabled: busy }}
                onPress={() => setConsent(!consent)}
              >
                <T size={14}>
                  {consent ? "☑" : "☐"} می‌دانم آثارم برای اعضای گروه و درمانگر
                  قابل مشاهده است. این ثبت‌نام جایگزین رضایت‌نامهٔ پژوهش نیست.
                </T>
              </Pressable>
            )}
          </>
        )}
        {error ? (
          <View accessibilityRole="alert" accessibilityLiveRegion="polite">
            <T size={14} style={{ color: "#B34032" }}>
              {error}
            </T>
          </View>
        ) : null}
        <Button
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
          disabled={busy || (!sentPhone && remaining > 0)}
          onPress={sentPhone ? verifyCode : sendCode}
        />
        <Button
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
            disabled={busy}
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
