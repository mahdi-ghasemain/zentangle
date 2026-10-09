// Only Supabase Auth calls this hook. Never expose provider keys in the app.
export function createSmsHandler({
  apiKey,
  patternId,
  verify,
  authorize,
  fetcher = fetch,
  report = (event) => console.error(JSON.stringify(event)),
}) {
  const fail = (status, message) =>
    Response.json({ error: { http_code: status, message } }, { status });
  return async (req) => {
    if (req.method !== "POST") return fail(405, "Method not allowed");
    let payload;
    try {
      payload = await verify(await req.text(), Object.fromEntries(req.headers));
    } catch {
      return fail(401, "Invalid webhook signature");
    }
    if (
      !apiKey ||
      !/^[1-9]\d*$/.test(patternId ?? "") ||
      !Number.isSafeInteger(Number(patternId))
    )
      return fail(500, "SMS service is not configured");
    const phone = payload?.user?.phone;
    const otp = payload?.sms?.otp;
    if (
      typeof phone !== "string" ||
      !/^\+?989\d{9}$/.test(phone) ||
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp)
    )
      return fail(400, "Invalid SMS payload");
    try {
      if (!authorize || !(await authorize(phone.replace(/^\+/, ""))))
        return fail(429, "SMS limit reached");
      const response = await fetcher(
        "https://api.limosms.com/api/sendpatternmessage",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ApiKey: apiKey },
          body: JSON.stringify({
            OtpId: Number(patternId),
            ReplaceToken: [otp],
            MobileNumber: `0${phone.slice(-10)}`,
            Send: true,
          }),
          signal: AbortSignal.timeout(4000),
        },
      );
      if (!response.ok) {
        report({ event: "sms_provider_http_error", status: response.status });
        return fail(502, "SMS delivery failed");
      }
      let result;
      try { result = await response.json(); }
      catch {
        report({ event: "sms_provider_invalid_json" });
        return fail(502, "SMS delivery failed");
      }
      if (result?.Success !== true && result?.success !== true) {
        const rawCode = result?.Code ?? result?.code ?? result?.StatusCode ?? result?.statusCode;
        const providerCode = typeof rawCode === "number" && Number.isFinite(rawCode) && Math.abs(rawCode) < 10000 ? rawCode : null;
        report({ event: "sms_provider_rejected", providerCode });
        return fail(502, "SMS delivery failed");
      }
      return Response.json({});
    } catch (error) {
      report({ event: error?.name === "TimeoutError" || error?.name === "AbortError" ? "sms_provider_timeout" : "sms_provider_connection_error" });
      // Never log the phone, OTP, credentials, raw exception or provider response.
      return fail(502, "SMS delivery failed");
    }
  };
}
