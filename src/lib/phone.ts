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
  const code = (error as { code?: string })?.code;
  if (code === "over_sms_send_rate_limit" || code === "over_request_rate_limit")
    return "تعداد درخواست‌ها زیاد است. کمی صبر کنید و دوباره تلاش کنید.";
  if (code === "otp_expired")
    return "کد اشتباه است یا اعتبار آن تمام شده؛ دوباره بررسی کنید یا کد تازه بگیرید.";
  return verifying
    ? "تأیید انجام نشد؛ کد و اتصال اینترنت را بررسی کنید."
    : "ارسال کد انجام نشد؛ کمی بعد دوباره تلاش کنید.";
}
