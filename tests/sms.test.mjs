import test from "node:test";
import assert from "node:assert/strict";
import { createSmsHandler } from "../supabase/functions/send-sms/handler.mjs";
const payload = { user: { phone: "+989123456789" }, sms: { otp: "123456" } };
const request = () =>
  new Request("https://example.test", {
    method: "POST",
    body: JSON.stringify(payload),
  });
const config = {
  apiKey: "test-key",
  patternId: "123",
  verify: JSON.parse,
  authorize: async () => true,
};
test("signed payload is sent as a single LimoSMS pattern token", async () => {
  let calls = 0;
  const handler = createSmsHandler({
    ...config,
    fetcher: async (url, options) => {
      calls++;
      assert.equal(url, "https://api.limosms.com/api/sendpatternmessage");
      assert.equal(options.headers.ApiKey, "test-key");
      assert.deepEqual(JSON.parse(options.body), {
        OtpId: 123,
        MobileNumber: "09123456789",
        ReplaceToken: ["123456"],
        Send: true,
      });
      return Response.json({ success: true });
    },
  });
  assert.equal((await handler(request())).status, 200);
  assert.equal(calls, 1);
});
test("invalid signature and invalid input never contact provider", async () => {
  for (const override of [
    {
      verify: () => {
        throw new Error("invalid signature");
      },
    },
    { verify: () => ({ ...payload, user: { phone: "+12025550123" } }) },
    { verify: () => ({ ...payload, sms: { otp: "abc" } }) },
    { apiKey: "" },
    { patternId: "bad" },
  ]) {
    let called = false;
    const handler = createSmsHandler({
      ...config,
      ...override,
      fetcher: async () => {
        called = true;
      },
    });
    assert.ok((await handler(request())).status >= 400);
    assert.equal(called, false);
  }
});
test("provider rejection, malformed JSON and network failure cannot report success", async () => {
  for (const fetcher of [
    async () =>
      Response.json({ Success: false, Message: "private provider detail" }),
    async () => Response.json({ Success: true }, { status: 500 }),
    async () => new Response("not JSON"),
    async () => {
      throw new Error("timeout");
    },
  ]) {
    const response = await createSmsHandler({ ...config, fetcher })(request());
    assert.equal(response.status, 502);
    assert.equal((await response.text()).includes("private"), false);
  }
});
test("non-POST requests are rejected", async () => {
  assert.equal(
    (await createSmsHandler(config)(new Request("https://example.test")))
      .status,
    405,
  );
});

test("exhausted or unavailable SMS budget never contacts the provider", async () => {
  for (const authorize of [
    undefined,
    async () => false,
    async () => {
      throw new Error("db unavailable");
    },
  ]) {
    let sent = false;
    const handler = createSmsHandler({
      ...config,
      authorize,
      fetcher: async () => {
        sent = true;
        return Response.json({ success: true });
      },
    });
    assert.ok((await handler(request())).status >= 400);
    assert.equal(sent, false);
  }
});

test("diagnostics never expose provider messages, credentials, phone or OTP", async () => {
  const events = [];
  const handler = createSmsHandler({ ...config, report: e => events.push(e),
    fetcher: async () => Response.json({ Success: false, Code: 17, Message: "test-key +989123456789 123456" }) });
  assert.equal((await handler(request())).status, 502);
  assert.deepEqual(events, [{ event: "sms_provider_rejected", providerCode: 17 }]);
});
