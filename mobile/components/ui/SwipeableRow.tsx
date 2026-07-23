import * as Haptics from "expo-haptics";
import { Trash2 } from "lucide-react-native";
import { ReactNode, useRef } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, {
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { useColors } from "../../lib/theme";

const ACTION_WIDTH = 96;

interface Props {
  children: ReactNode;
  /** Appelé quand l'utilisateur confirme la suppression (tap sur « Suppr. »). */
  onDelete: () => void;
}

/**
 * Enveloppe une ligne pour révéler un bouton de suppression par glissement
 * vers la gauche. Le tap sur le bouton révélé déclenche `onDelete`.
 */
export function SwipeableRow({ children, onDelete }: Props) {
  const swipeableRef = useRef<SwipeableMethods>(null);

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      onSwipeableWillOpen={() =>
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
      renderRightActions={(_progress, drag) => (
        <RightAction
          drag={drag}
          onDelete={() => {
            swipeableRef.current?.close();
            onDelete();
          }}
        />
      )}>
      {children}
    </ReanimatedSwipeable>
  );
}

function RightAction({
  drag,
  onDelete,
}: {
  drag: SharedValue<number>;
  onDelete: () => void;
}) {
  const c = useColors();

  // Le bouton « suit » le doigt : à l'ouverture complète translateX = 0.
  const styleAnimation = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + ACTION_WIDTH }],
  }));

  return (
    <Reanimated.View style={[styles.wrapper, styleAnimation]}>
      <Pressable
        onPress={onDelete}
        style={[styles.button, { backgroundColor: c.danger }]}>
        <Trash2 size={22} color="#ffffff" />
        <Text style={styles.label}>Suppr.</Text>
      </Pressable>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  // Largeur fixe : c'est elle que la Swipeable mesure pour l'ouverture.
  // Pas de hauteur → étirée à la hauteur de la ligne (alignItems: stretch).
  wrapper: {
    width: ACTION_WIDTH,
  },
  // flex:1 remplit la hauteur du wrapper ; marges pour aligner sur la carte
  // (mb-2 / rounded-2xl de la ligne voisine).
  button: {
    flex: 1,
    marginBottom: 8,
    marginLeft: 8,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
});
