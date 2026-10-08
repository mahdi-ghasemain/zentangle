import React from "react";
import { Image, View } from "react-native";
import { Shell, T } from "../components/ui";
import InstallApp from "../components/InstallApp";
export default function Install() {
  return (
    <Shell title="هنر زندگی در گوشی شما" noNav>
      <View style={{ alignItems: "center", gap: 16, padding: 20 }}>
        <Image
          source={require("../../assets/icon.png")}
          accessibilityLabel="نشان هنر زندگی"
          style={{ width: 116, height: 116, borderRadius: 28 }}
        />
        <T bold size={28}>
          هر خط، فرصتی برای آرامش
        </T>
      </View>
      <InstallApp />
    </Shell>
  );
}
