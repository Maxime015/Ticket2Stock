import { Minus, Plus } from "lucide-react-native";
import { Text, View } from "react-native";

import { useColors } from "../../lib/theme";
import { PressableScale } from "./PressableScale";

interface Props {
  value: number | string;
  onDecrement: () => void;
  onIncrement: () => void;
  /** Côté des boutons carrés (px). Défaut 44. */
  size?: number;
  disabled?: boolean;
}

/**
 * Compteur +/- : deux boutons carrés arrondis séparés, valeur centrée entre
 * les deux. Réutilisé pour la quantité du stock et la relecture de ticket.
 */
export function Stepper({ value, onDecrement, onIncrement, size = 44, disabled }: Props) {
  const c = useColors();
  const iconSize = Math.max(16, Math.round(size * 0.42));

  return (
    <View className="flex-row items-center" style={{ gap: Math.round(size * 0.26) }}>
      <StepButton onPress={onDecrement} size={size} disabled={disabled}>
        <Minus size={iconSize} color={c.muted} strokeWidth={2.5} />
      </StepButton>

      <Text
        className="text-ink font-bold text-center"
        style={{ minWidth: Math.round(size * 0.5), fontSize: Math.round(size * 0.36) }}>
        {value}
      </Text>

      <StepButton onPress={onIncrement} size={size} disabled={disabled}>
        <Plus size={iconSize} color={c.muted} strokeWidth={2.5} />
      </StepButton>
    </View>
  );
}

function StepButton({
  onPress,
  size,
  disabled,
  children,
}: {
  onPress: () => void;
  size: number;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <PressableScale onPress={onPress} disabled={disabled} scaleTo={0.9} haptic>
      {/* Le fond/bordure est porté par une View interne : NativeWind ne mappe
          pas de façon fiable ces classes sur le Pressable animé. */}
      <View
        className="rounded-2xl bg-surface-2 border border-border items-center justify-center"
        style={{ width: size, height: size, opacity: disabled ? 0.4 : 1 }}>
        {children}
      </View>
    </PressableScale>
  );
}
