export function latinDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) =>
    String(digit.charCodeAt(0) - (digit >= "۰" ? 1776 : 1632)),
  );
}

export function normalizeIranPhone(value: string): string | null {
  const phone = latinDigits(value).replace(/[\s()\-]/g, "");
  if (/^09\d{9}$/.test(phone)) return `+98${phone.slice(1)}`;
  if (/^9\d{9}$/.test(phone)) return `+98${phone}`;
  if (/^(?:\+98|0098|98)9\d{9}$/.test(phone)) return `+98${phone.slice(-10)}`;
  return null;
}

export function phoneAuthError(error: unknown, verifying = false): string {
  const detail = error as { code?: string; status?: number; message?: string; name?: string };
  const code = detail?.code;
  const message = detail?.message ?? "";
  if (/sms delivery|sms service|sms.*provider|hook/i.test(message))
    return "سرویس ارسال پیامک درخواست را رد کرد؛ تنظیمات اتصال پیامک باید بررسی شود.";
  if (/signups? not allowed|signup.*disabled|user.*not found/i.test(message))
    return "برای این شماره ابتدا ثبت‌نام جدید را انتخاب کنید.";
  if (/fetch|network|connection/i.test(message))
    return "ارتباط برنامه با سرور برقرار نشد؛ اینترنت یا اتصال VPN را بررسی کنید.";
  if (/lock|timeout/i.test(message))
    return "پاسخ سرویس ورود طول کشید؛ برنامه را ببندید و دوباره باز کنید.";
  if (code === "over_sms_send_rate_limit" || code === "over_request_rate_limit")
    return "تعداد درخواست‌ها زیاد است. کمی صبر کنید و دوباره تلاش کنید.";
  if (code === "otp_expired")
    return "کد اشتباه است یا اعتبار آن تمام شده؛ دوباره بررسی کنید یا کد تازه بگیرید.";
  const reference = typeof code === "string" && /^[a-z_]{3,60}$/.test(code) ? " (" + code + ")" : "";
  return (verifying
    ? "تأیید انجام نشد؛ کد و اتصال اینترنت را بررسی کنید."
    : "ارسال کد انجام نشد؛ اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.") + reference;
}
