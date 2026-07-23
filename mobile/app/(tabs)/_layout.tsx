import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";

// Tab bar native (liquid glass sur iOS 26). L'accent suit l'identité violette.
export default function TabLayout() {
  return (
    <NativeTabs tintColor="#6C47FF">
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "camera.viewfinder", selected: "camera.viewfinder" }} />
        <Label>Scanner</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="stock">
        <Icon sf={{ default: "shippingbox", selected: "shippingbox.fill" }} />
        <Label>Stock</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="courses">
        <Icon sf={{ default: "cart", selected: "cart.fill" }} />
        <Label>Courses</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="stats">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label>Stats</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
