import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  TextInputProps,
  ViewStyle,
  StyleProp,
  TextStyle,
  useWindowDimensions,
  Image,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "../lib/store";
import { Lotus, Botanical } from "./Art";
export const colors = {
  bg: "#F8F3E9",
  card: "#FFFCF6",
  text: "#172B28",
  muted: "#6E776D",
  green: "#246D52",
  line: "#E8DFD0",
  sage: "#DDE5D4",
  gold: "#B1854C",
};
export function useColors() {
  const { data } = useStore();
  return data.settings.dark
    ? {
        ...colors,
        bg: "#18251F",
        card: "#24352C",
        text: "#F6F0E5",
        muted: "#C2CCBC",
        line: "#455447",
        sage: "#344B3C",
      }
    : colors;
}
export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export function Icon({
  name,
  size = 23,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const c = useColors();
  return <Ionicons name={name} size={size} color={color ?? c.text} />;
}
export function T({
  children,
  size = 16,
  bold,
  muted,
  style,
  center,
  lines,
}: {
  children: React.ReactNode;
  size?: number;
  bold?: boolean;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
  center?: boolean;
  lines?: number;
}) {
  const { data } = useStore();
  const c = useColors();
  return (
    <Text
      numberOfLines={lines}
      style={[
        {
          fontFamily: bold ? "Vazirmatn_700Bold" : "Vazirmatn_400Regular",
          fontSize: size * data.settings.font,
          lineHeight: size * data.settings.font * 1.85,
          color: muted ? c.muted : c.text,
          textAlign: center ? "center" : "right",
          writingDirection: "rtl",
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Row({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        { flexDirection: "row-reverse", alignItems: "center", gap: 12 },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  return (
    <View
      style={[s.card, { backgroundColor: c.card, borderColor: c.line }, style]}
    >
      {children}
    </View>
  );
}
export function Button({
  label,
  onPress,
  icon,
  secondary,
  disabled,
  small,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  secondary?: boolean;
  disabled?: boolean;
  small?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 52,
          paddingVertical: small ? 7 : 11,
          paddingHorizontal: 20,
          borderRadius: 17,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: secondary ? c.card : c.green,
          borderWidth: 1,
          borderColor: secondary ? c.line : c.green,
          opacity: disabled ? 0.45 : pressed ? 0.78 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <Row>
        {icon && <Icon name={icon} color={secondary ? c.green : "#fff"} />}
        <T
          bold
          size={small ? 14 : 17}
          style={{ color: secondary ? c.text : "#fff" }}
        >
          {label}
        </T>
      </Row>
    </Pressable>
  );
}
export function Field(props: TextInputProps) {
  const c = useColors();
  const { data } = useStore();
  return (
    <TextInput
      placeholderTextColor={c.muted}
      {...props}
      style={[
        {
          minHeight: 56,
          borderWidth: 1,
          borderColor: c.line,
          borderRadius: 15,
          backgroundColor: c.card,
          color: c.text,
          fontFamily: "Vazirmatn_400Regular",
          fontSize: 16 * data.settings.font,
          padding: 15,
          textAlign: "right",
          writingDirection: "rtl",
        },
        props.multiline && { height: 120, textAlignVertical: "top" },
        props.style,
      ]}
    />
  );
}
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        flex: 1,
        padding: 10,
        minHeight: 48,
        borderRadius: 13,
        alignItems: "center",
        backgroundColor: selected ? c.green : c.card,
        borderWidth: 1,
        borderColor: selected ? c.green : c.line,
      }}
    >
      <T
        size={14}
        bold={selected}
        style={selected ? { color: "#fff" } : undefined}
      >
        {label}
      </T>
    </Pressable>
  );
}
export function Avatar({
  uri,
  size = 50,
  sample = false,
}: {
  size?: number;
  sample?: boolean;
  uri?: string;
}) {
  const c = useColors();
  return uri || sample ? (
    <Image
      source={uri ? { uri } : require("../../assets/hero.png")}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 3,
        borderColor: "#fff",
      }}
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.sage,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name="person-outline" color={c.green} size={size / 2} />
    </View>
  );
}
const navigation: { path: string; label: string; icon: IconName }[] = [
  { path: "/home", label: "خانه", icon: "home-outline" },
  { path: "/sessions", label: "جلسات من", icon: "leaf-outline" },
  { path: "/gallery", label: "گالری آثار", icon: "images-outline" },
  { path: "/calendar", label: "جلسات آنلاین", icon: "videocam-outline" },
  { path: "/profile", label: "پروفایل من", icon: "person-outline" },
];
export function Shell({
  title,
  subtitle,
  children,
  back = true,
  noNav = false,
  centered = false,
  scrollable = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  back?: boolean;
  noNav?: boolean;
  centered?: boolean;
  scrollable?: boolean;
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const c = useColors();
  const path = usePathname();
  const { notice, demo, role } = useStore();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: c.bg }}
      edges={["top", "bottom"]}
    >
      <View style={{ flex: 1, flexDirection: "row-reverse" }}>
        {wide && !noNav && (
          <View
            style={{
              width: 245,
              padding: 25,
              backgroundColor: c.card,
              borderLeftWidth: 1,
              borderColor: c.line,
            }}
          >
            <Row style={{ justifyContent: "center", marginVertical: 26 }}>
              <Lotus />
              <View>
                <T bold size={27}>
                  هنر زندگی
                </T>
                <T muted size={11}>
                  آرامش، خلاقیت، ارتباط
                </T>
              </View>
            </Row>
            <View style={{ gap: 10, marginTop: 36 }}>
              {navigation.map((n) => (
                <Pressable
                  key={n.path}
                  onPress={() => router.push(n.path as never)}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: path === n.path ? c.sage : "transparent",
                  }}
                >
                  <Row>
                    <Icon name={n.icon} color={c.green} />
                    <T bold={path === n.path}>{n.label}</T>
                  </Row>
                </Pressable>
              ))}
            </View>
            <View style={{ flex: 1 }} />
            <Botanical size={110} />
            <Button
              label="راهنما و پشتیبانی"
              secondary
              icon="help-circle-outline"
              onPress={() => router.push("/help")}
            />
            {(demo || role === "therapist") && (
              <Pressable
                onPress={() => router.push("/admin")}
                style={{ padding: 14 }}
              >
                <T size={13} muted center>
                  {demo ? "پیش‌نمایش پنل درمانگر" : "پنل درمانگر"}
                </T>
              </Pressable>
            )}
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View
            style={{
              display: !title && !back && noNav ? "none" : "flex",
              paddingHorizontal: wide ? 38 : 22,
              paddingVertical: 16,
              borderBottomWidth: wide ? 1 : 0,
              borderColor: c.line,
            }}
          >
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <T bold size={wide ? 24 : 21}>
                  {title}
                </T>
                {subtitle && (
                  <T muted size={13}>
                    {subtitle}
                  </T>
                )}
              </View>
              {back ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="بازگشت"
                  onPress={() =>
                    router.canGoBack() ? router.back() : router.replace("/home")
                  }
                  style={s.iconButton}
                >
                  <Icon name="chevron-back" />
                </Pressable>
              ) : (
                !noNav && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="اعلان‌ها"
                    onPress={() => router.push("/notifications")}
                    style={s.iconButton}
                  >
                    <Icon name="notifications-outline" />
                  </Pressable>
                )
              )}
            </Row>
          </View>
          <ScrollView
            scrollEnabled={scrollable}
            bounces={scrollable}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: wide ? 32 : 20,
              paddingTop: 12,
              paddingBottom: centered ? 20 : 36,
              flexGrow: centered ? 1 : undefined,
              justifyContent: centered ? "center" : undefined,
              width: "100%",
              maxWidth: noNav ? 600 : 1120,
              alignSelf: "center",
              gap: 20,
            }}
          >
            {demo && !noNav && (
              <View
                style={{
                  alignSelf: "flex-end",
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 3,
                  backgroundColor: c.sage,
                }}
              >
                <T size={11} muted>
                  نسخهٔ آزمایشی · اطلاعات نمونه و ذخیره روی این دستگاه
                </T>
              </View>
            )}
            {children}
          </ScrollView>
          {!wide && !noNav && (
            <View
              style={{
                flexDirection: "row-reverse",
                paddingTop: 9,
                paddingBottom: Platform.OS === "web" ? 10 : 0,
                backgroundColor: c.card,
                borderTopWidth: 1,
                borderColor: c.line,
              }}
            >
              {navigation.map((n) => (
                <Pressable
                  key={n.path}
                  accessibilityRole="button"
                  accessibilityLabel={n.label}
                  onPress={() => router.push(n.path as never)}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    minHeight: 56,
                    gap: 2,
                  }}
                >
                  <Icon
                    name={n.icon}
                    size={24}
                    color={path === n.path ? c.green : c.muted}
                  />
                  <T
                    size={10}
                    bold={path === n.path}
                    style={{ color: path === n.path ? c.green : c.muted }}
                  >
                    {n.label}
                  </T>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
      {notice ? (
        <View
          accessibilityLiveRegion="polite"
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: noNav ? 20 : 86,
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <View
            style={{
              maxWidth: 560,
              borderRadius: 16,
              backgroundColor: "#203F32",
              padding: 16,
            }}
          >
            <T center size={14} style={{ color: "white" }}>
              {notice}
            </T>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
export function Banner({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={["#E2E7D8", "#F4EAD8"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ padding: 24, borderRadius: 23, overflow: "hidden" }}
    >
      {children}
    </LinearGradient>
  );
}
export function MenuItem({
  label,
  icon,
  onPress,
  detail,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
  detail?: string;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ borderBottomWidth: 1, borderColor: c.line, paddingVertical: 16 }}
    >
      <Row>
        <Icon name={icon} />
        <View style={{ flex: 1 }}>
          <T>{label}</T>
          {detail && (
            <T size={12} muted>
              {detail}
            </T>
          )}
        </View>
        <Icon name="chevron-back" size={17} />
      </Row>
    </Pressable>
  );
}
const s = StyleSheet.create({
  card: { borderRadius: 21, padding: 19, borderWidth: 1, gap: 13 },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
