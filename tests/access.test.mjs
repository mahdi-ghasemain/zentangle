import test from "node:test";
import assert from "node:assert/strict";
import { canJoinMeeting } from "../supabase/functions/livekit-token/access.mjs";
const now = Date.parse("2026-10-08T10:00:00Z");
const profile = { group_id: "group-a" };
const meeting = {
  group_id: "group-a",
  provider: "livekit",
  starts_at: new Date(now).toISOString(),
};
test("only a member of the scheduled group can obtain call access", () => {
  assert.equal(canJoinMeeting(profile, meeting, now), true);
  assert.equal(canJoinMeeting({ group_id: "group-b" }, meeting, now), false);
  assert.equal(canJoinMeeting({ group_id: null }, meeting, now), false);
  assert.equal(
    canJoinMeeting(profile, { ...meeting, provider: "external" }, now),
    false,
  );
  assert.equal(canJoinMeeting(profile, null, now), false);
});
test("call admission window rejects early, late and malformed schedules", () => {
  assert.equal(canJoinMeeting(profile, meeting, now - 15 * 60000), true);
  assert.equal(canJoinMeeting(profile, meeting, now - 15 * 60000 - 1), false);
  assert.equal(canJoinMeeting(profile, meeting, now + 120 * 60000), false);
  assert.equal(
    canJoinMeeting(profile, { ...meeting, starts_at: "invalid" }, now),
    false,
  );
});
