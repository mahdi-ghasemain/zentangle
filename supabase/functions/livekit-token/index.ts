import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import {
  AccessToken,
  RoomServiceClient,
  TrackSource,
} from "npm:livekit-server-sdk@2.19.1";
import { canJoinMeeting } from "./access.mjs";

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
  if (origin && allowed.includes(origin))
    headers["Access-Control-Allow-Origin"] = origin;
  headers["Access-Control-Allow-Headers"] =
    "authorization, x-client-info, apikey, content-type";
  headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
  const respond = (status: number, error: string) =>
    new Response(JSON.stringify({ error }), { status, headers });
  if (origin && !allowed.includes(origin))
    return respond(403, "Origin not allowed");
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return respond(405, "Method not allowed");
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer "))
    return respond(401, "Sign in required");
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const client = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser(authorization.slice(7));
    if (authError || !user) return respond(401, "Sign in required");
    const raw = await req.text();
    if (raw.length > 1024) return respond(400, "Invalid request");
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return respond(400, "Invalid request");
    }
    if (
      typeof body.meetingId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(body.meetingId)
    )
      return respond(400, "Invalid meeting");
    const [profile, meeting] = await Promise.all([
      client
        .from("profiles")
        .select("group_id,display_name")
        .eq("id", user.id)
        .single(),
      client
        .from("meetings")
        .select("id,group_id,provider,starts_at")
        .eq("id", body.meetingId)
        .single(),
    ]);
    if (
      profile.error ||
      meeting.error ||
      !canJoinMeeting(profile.data, meeting.data)
    )
      return respond(403, "Meeting unavailable");
    const apiKey = Deno.env.get("LIVEKIT_API_KEY");
    const secret = Deno.env.get("LIVEKIT_API_SECRET");
    const serverUrl = Deno.env.get("LIVEKIT_URL");
    if (!apiKey || !secret || !serverUrl?.startsWith("wss://"))
      return respond(503, "Calls are not configured");
    const admin = createClient(
      url,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const quota = await admin.rpc("reserve_call_token", { p_user: user.id });
    if (quota.error || quota.data !== true)
      return respond(429, "Please try later");
    const room = "zentangle-" + meeting.data.id;
    const rooms = new RoomServiceClient(
      serverUrl.replace(/^wss:/, "https:"),
      apiKey,
      secret,
    );
    await rooms.createRoom({
      name: room,
      maxParticipants: 12,
      emptyTimeout: 60,
      departureTimeout: 30,
    });
    const token = new AccessToken(apiKey, secret, {
      identity: user.id,
      name: profile.data.display_name.slice(0, 100),
      ttl: "5m",
    });
    token.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: false,
      canPublishSources: [TrackSource.CAMERA, TrackSource.MICROPHONE],
    });
    return new Response(
      JSON.stringify({ token: await token.toJwt(), serverUrl }),
      { headers },
    );
  } catch {
    // Never include credentials, access tokens or upstream errors in logs/responses.
    return respond(503, "Call connection unavailable");
  }
});
