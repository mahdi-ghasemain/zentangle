import React from "react";
import { Button, Card, T } from "./ui";
import * as Linking from "expo-linking";

export default function MeetingRoom({ meetingId }: { meetingId: string }) {
  const site = process.env.EXPO_PUBLIC_WEB_URL;
  return (
    <Card>
      <T>
        برای تماس صوتی و تصویری، نسخهٔ وب برنامه را در مرورگر باز کنید و وارد
        حساب خود شوید.
      </T>
      {site?.startsWith("https://") && (
        <Button
          label="باز کردن جلسه در مرورگر"
          onPress={() => {
            void Linking.openURL(
              site.replace(/\/$/, "") +
                "/meeting?meeting=" +
                encodeURIComponent(meetingId),
            );
          }}
        />
      )}
    </Card>
  );
}
