import React from "react";
import { Redirect } from "expo-router";
import { useStore } from "../lib/store";
export default function Index() {
  const { data, userId, demo } = useStore();
  return (
    <Redirect
      href={userId || demo ? "/home" : data.onboarded ? "/login" : "/welcome"}
    />
  );
}
