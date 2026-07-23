import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { useColors, useIsDark } from "../../lib/theme";

interface Props {
  children: React.ReactNode;
  edges?: Edge[];
  /** Retire le SafeArea (utile pour les écrans plein-cadre). */
  bare?: boolean;
  className?: string;
}

/** Conteneur d'écran : fond dégradé adapté au thème + gestion des safe areas. */
export function Screen({ children, edges = ["top"], bare = false, className }: Props) {
  const c = useColors();
  const isDark = useIsDark();
  return (
    <View className="flex-1 bg-background">
      <StatusBar style={isDark ? "light" : "dark"} />
      <LinearGradient
        colors={c.screenGradient}
        locations={[0, 0.5, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {bare ? (
        <View className={`flex-1 ${className ?? ""}`}>{children}</View>
      ) : (
        <SafeAreaView edges={edges} className={`flex-1 ${className ?? ""}`}>
          {children}
        </SafeAreaView>
      )}
    </View>
  );
}
