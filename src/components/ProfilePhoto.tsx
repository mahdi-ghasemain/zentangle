import React, { useState } from "react";
import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File } from "expo-file-system";
import { Button, T } from "./ui";
import { useStore } from "../lib/store";
import { supabase } from "../lib/supabase";

export default function ProfilePhoto() {
  const { userId, demo, refresh, notify, data } = useStore();
  const [busy, setBusy] = useState(false);
  const change = async (remove = false) => {
    if (!supabase || !userId || demo) {
      notify("برای ذخیرهٔ عکس پروفایل وارد حساب خود شوید.");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const path = userId + "/profile.jpg";
      if (remove) {
        const result = await supabase.storage.from("avatars").remove([path]);
        if (result.error) throw result.error;
      } else {
        const picked = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (picked.canceled) return;
        const asset = picked.assets[0];
        if ((asset.fileSize ?? 0) > 10 * 1024 * 1024) throw new Error("large");
        const size = Math.min(asset.width, asset.height);
        if (size <= 0) throw new Error("invalid");
        const context = ImageManipulator.manipulate(asset.uri);
        context
          .crop({
            originX: Math.floor((asset.width - size) / 2),
            originY: Math.floor((asset.height - size) / 2),
            width: size,
            height: size,
          })
          .resize({ width: 512, height: 512 });
        const image = await context.renderAsync();
        const result = await image.saveAsync({
          format: SaveFormat.JPEG,
          compress: 0.8,
        });
        const bytes =
          Platform.OS === "web"
            ? await (await fetch(result.uri)).arrayBuffer()
            : await new File(result.uri).arrayBuffer();
        if (bytes.byteLength > 2 * 1024 * 1024) throw new Error("large");
        const saved = await supabase.storage
          .from("avatars")
          .upload(path, bytes, {
            contentType: "image/jpeg",
            upsert: true,
            cacheControl: "0",
          });
        if (saved.error) throw saved.error;
      }
      await refresh();
      notify(remove ? "عکس پروفایل حذف شد." : "عکس پروفایل ذخیره شد.");
    } catch {
      notify(
        "ذخیرهٔ عکس انجام نشد. تصویر زیر ۱۰ مگابایت و اتصال اینترنت را بررسی کنید.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button
        secondary
        icon="camera-outline"
        disabled={busy}
        label={busy ? "در حال ذخیره…" : "انتخاب عکس پروفایل"}
        onPress={() => void change()}
      />
      {data.avatar && (
        <Button
          secondary
          disabled={busy}
          label="حذف عکس پروفایل"
          onPress={() => void change(true)}
        />
      )}
      <T muted size={12}>
        عکس شما برای خودتان و اعضای گروهتان قابل مشاهده است.
      </T>
    </>
  );
}
