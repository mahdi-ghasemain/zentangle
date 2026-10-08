import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import { Webhook } from "npm:standardwebhooks@1.0.0";
import { createSmsHandler } from "./handler.mjs";

const secret = Deno.env.get("SEND_SMS_HOOK_SECRET")?.replace(/^v1,whsec_/, "");
const webhook = secret ? new Webhook(secret) : null;
Deno.serve(
  createSmsHandler({
    apiKey: Deno.env.get("LIMOSMS_API_KEY"),
    patternId: Deno.env.get("LIMOSMS_PATTERN_ID"),
    authorize: async (phone: string) => {
      const db = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { auth: { persistSession: false } },
      );
      const { data, error } = await db.rpc("reserve_sms", {
        p_phone: phone,
        p_daily_limit: Number(Deno.env.get("SMS_DAILY_LIMIT") ?? "100"),
      });
      return !error && data === true;
    },
    verify: (body: string, headers: Record<string, string>) => {
      if (!webhook) throw new Error("Missing hook secret");
      return webhook.verify(body, headers);
    },
  }),
);
