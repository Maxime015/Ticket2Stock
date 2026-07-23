import * as Haptics from "expo-haptics";
import { remapProps } from "nativewind";
import { forwardRef } from "react";
import { Platform, Pressable, type PressableProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// `createAnimatedComponent` produit un composant tiers que NativeWind ne mappe
// pas automatiquement : sans ça le `className` (ex. `w-full`) passé au wrapper
// est ignoré et les boutons se réduisent à la largeur de leur contenu.
remapProps(AnimatedPressable, { className: "style" });

interface Props extends PressableProps {
  /** Facteur d'échelle à l'appui (défaut 0.96). */
  scaleTo?: number;
  /** Déclenche un retour haptique léger à l'appui. */
  haptic?: boolean;
}

/**
 * Pressable animé (press-scale + haptics) réutilisé par les boutons et cartes
 * cliquables pour des micro-interactions cohérentes.
 */
export const PressableScale = forwardRef<React.ElementRef<typeof Pressable>, Props>(
  ({ scaleTo = 0.96, haptic = true, onPressIn, onPressOut, children, style, ...rest }, ref) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedPressable
        ref={ref}
        style={[animatedStyle, style as any]}
        onPressIn={(e) => {
          scale.value = withSpring(scaleTo, { damping: 15, stiffness: 320 });
          if (haptic && Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.value = withSpring(1, { damping: 15, stiffness: 320 });
          onPressOut?.(e);
        }}
        {...rest}>
        {children as any}
      </AnimatedPressable>
    );
  },
);

PressableScale.displayName = "PressableScale";
