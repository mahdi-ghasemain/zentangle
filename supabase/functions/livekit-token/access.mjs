export function canJoinMeeting(profile, meeting, now = Date.now()) {
  if (!profile?.group_id || !meeting || meeting.provider !== "livekit")
    return false;
  if (profile.group_id !== meeting.group_id) return false;
  const starts = Date.parse(meeting.starts_at);
  return (
    Number.isFinite(starts) &&
    now >= starts - 15 * 60000 &&
    now < starts + 120 * 60000
  );
}
