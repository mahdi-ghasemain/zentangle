import React, { useEffect, useState } from "react";
import { Button, Card, T } from "./ui";
type InstallEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
declare global {
  interface Window {
    zentangleInstallPrompt?: InstallEvent | null;
  }
}
export default function InstallApp() {
  const [available, setAvailable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const refresh = () => {
      setAvailable(!!window.zentangleInstallPrompt);
      setInstalled(
        window.matchMedia("(display-mode: standalone)").matches ||
          !!(navigator as Navigator & { standalone?: boolean }).standalone,
      );
    };
    const done = () => {
      setInstalled(true);
      setAvailable(false);
    };
    refresh();
    window.addEventListener("zentangle-install-ready", refresh);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("zentangle-install-ready", refresh);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  const install = async () => {
    const event = window.zentangleInstallPrompt;
    if (!event || busy) return;
    setBusy(true);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      setMessage(
        choice.outcome === "accepted"
          ? "درخواست نصب پذیرفته شد؛ آیکون برنامه را روی دستگاه بررسی کنید."
          : "هر وقت مایل بودید می‌توانید از منوی مرورگر نصب کنید.",
      );
    } catch {
      setMessage("از منوی مرورگر گزینهٔ نصب یا افزودن به صفحهٔ اصلی را بزنید.");
    } finally {
      window.zentangleInstallPrompt = null;
      setAvailable(false);
      setBusy(false);
    }
  };
  return (
    <Card>
      {installed ? (
        <T bold>برنامه از روی صفحهٔ اصلی باز شده است.</T>
      ) : (
        <>
          <T bold size={22}>
            نصب رایگان روی گوشی
          </T>
          {available && (
            <Button
              icon="download-outline"
              disabled={busy}
              label="نصب هنر زندگی"
              onPress={() => void install()}
            />
          )}
          <T bold>آیفون</T>
          <T>
            این سایت را در Safari باز کنید؛ دکمهٔ اشتراک‌گذاری را بزنید، «Add to
            Home Screen» و سپس «Add» را انتخاب کنید.
          </T>
          <T bold>اندروید</T>
          <T>
            در Chrome منوی سه‌نقطه را باز کنید و «Install app» یا «Add to Home
            screen» را بزنید.
          </T>
          <T muted size={14}>
            پس از نصب، آیکون هنر زندگی روی گوشی قرار می‌گیرد. برای ورود و تماس
            به اینترنت نیاز دارید. هنگام تماس، برنامه را باز نگه دارید.
          </T>
        </>
      )}
      {message ? <T>{message}</T> : null}
    </Card>
  );
}
