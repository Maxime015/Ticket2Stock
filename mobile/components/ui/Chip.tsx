import { Text, View } from "react-native";

import { useColors } from "../../lib/theme";
import { PressableScale } from "./PressableScale";

interface Props {
  label: string;
  active?: boolean;
  color?: string;
  onPress?: () => void;
}

/** Puce/filtre (Tout / En stock / Stock bas, etc.). */
export function Chip({ label, active = false, color, onPress }: Props) {
  const c = useColors();
  const tint = color ?? c.primary;
  const body = (
    <View
      className="px-4 py-2 rounded-full border"
      style={{
        backgroundColor: active ? tint : "transparent",
        borderColor: active ? tint : c.border,
      }}>
      <Text className="text-sm font-semibold" style={{ color: active ? "#FFFFFF" : c.muted }}>
        {label}
      </Text>
    </View>
  );
  return onPress ? (
    <PressableScale onPress={onPress} scaleTo={0.95} haptic>
      {body}
    </PressableScale>
  ) : (
    body
  );
}
