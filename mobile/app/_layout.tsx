import "../global.css";
import "../lib/notifications"; // configure le handler de notifications au démarrage

import { useFonts } from "expo-font";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColors } from "../lib/theme";
import { darkVars, lightVars } from "../lib/theme-vars";
import { useAuthStore } from "../store/authStore";

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const c = useColors();
  const { user, token, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    if (isCheckingAuth) return;
    const inAuthScreen = segments[0] === "(auth)";
    const isSignedIn = user && token;

    if (!isSignedIn && !inAuthScreen) router.replace("/(auth)");
    else if (isSignedIn && inAuthScreen) router.replace("/(tabs)");
  }, [user, token, segments, isCheckingAuth, router]);

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen
        name="ticket-review"
        options={{ presentation: "modal", gestureEnabled: false }}
      />
      <Stack.Screen name="ticket/[id]" options={{ presentation: "card" }} />
      <Stack.Screen name="budgets" options={{ presentation: "card" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const themeVars = scheme === "dark" ? darkVars : lightVars;
  const { checkAuth } = useAuthStore();

  const [fontsLoaded] = useFonts({
    "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* Le View racine porte les variables de thème pour tout le sous-arbre. */}
        <View style={themeVars} className="flex-1 bg-background">
          <AuthGate />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
