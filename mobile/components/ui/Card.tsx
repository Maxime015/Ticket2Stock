import { View } from "react-native";

import { cardShadow } from "../../lib/theme";
import { PressableScale } from "./PressableScale";

interface Props {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
}

/** Carte de surface : bordure subtile + ombre douce. Cliquable si `onPress`. */
export function Card({ children, className, onPress }: Props) {
  const base = `bg-surface/90 border border-border rounded-2xl ${className ?? ""}`;
  if (onPress) {
    return (
      <PressableScale onPress={onPress} scaleTo={0.98} className={base} style={cardShadow}>
        {children}
      </PressableScale>
    );
  }
  return (
    <View className={base} style={cardShadow}>
      {children}
    </View>
  );
}
