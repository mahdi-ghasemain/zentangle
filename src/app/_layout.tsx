import React from "react";
import { Stack } from "expo-router";
import { View, ActivityIndicator, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Vazirmatn_400Regular } from "@expo-google-fonts/vazirmatn/400Regular";
import { Vazirmatn_700Bold } from "@expo-google-fonts/vazirmatn/700Bold";
import { StoreProvider, useStore } from "../lib/store";

function Routes() {
  const { ready, data } = useStore();
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: "#F8F3E9",
        }}
      >
        <ActivityIndicator color="#246D52" />
      </View>
    );
  return (
    <>
      <StatusBar style={data.settings.dark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#F8F3E9" },
          animation: "fade",
        }}
      />
    </>
  );
}
export default function Layout() {
  const [fonts, error] = useFonts({ Vazirmatn_400Regular, Vazirmatn_700Bold });
  if (error)
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 30 }}>
        <Text>بارگذاری فونت انجام نشد. برنامه را دوباره باز کنید.</Text>
      </View>
    );
  if (!fonts)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: "#F8F3E9",
        }}
      >
        <ActivityIndicator color="#246D52" />
      </View>
    );
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Routes />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
