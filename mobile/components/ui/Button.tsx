import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useColors } from "../../lib/theme";
import { PressableScale } from "./PressableScale";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  className,
  fullWidth = true,
}: Props) {
  const c = useColors();
  const isDisabled = disabled || loading;
  const filled = variant === "primary" || variant === "danger";

  const content = (
    <View className="flex-row items-center justify-center gap-2">
      {loading ? (
        <ActivityIndicator color={filled ? "#ffffff" : c.primary} />
      ) : (
        <>
          {icon}
          <Text
            className={
              filled ? "text-white font-bold text-base" : "text-ink font-semibold text-base"
            }>
            {label}
          </Text>
        </>
      )}
    </View>
  );

  const boxClass =
    variant === "secondary"
      ? "bg-surface-2 border border-border"
      : variant === "danger"
        ? "bg-danger/90"
        : variant === "ghost"
          ? "border border-border"
          : "";

  return (
    <PressableScale
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      className={`${fullWidth ? "w-full" : ""} ${isDisabled ? "opacity-60" : ""} ${className ?? ""}`}>
      <View className={`rounded-2xl px-5 py-4 overflow-hidden ${boxClass}`}>
        {variant === "primary" && (
          <LinearGradient
            colors={c.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        {content}
      </View>
    </PressableScale>
  );
}
