import { Trash2 } from "lucide-react-native";
import { View } from "react-native";

import { useColors } from "../../lib/theme";
import { PressableScale } from "./PressableScale";

interface Props {
  onPress: () => void;
  /** Côté du carré (px). Défaut 38. */
  size?: number;
  iconSize?: number;
}

/**
 * Bouton de suppression : carré arrondi à fond rouge translucide + icône
 * corbeille rouge. Style unique pour toutes les suppressions de l'app.
 */
export function DeleteButton({ onPress, size = 38, iconSize }: Props) {
  const c = useColors();
  return (
    <PressableScale onPress={onPress} scaleTo={0.9} haptic={false}>
      <View
        className="rounded-2xl items-center justify-center"
        style={{
          width: size,
          height: size,
          backgroundColor: `${c.danger}1f`,
          borderWidth: 1,
          borderColor: `${c.danger}33`,
        }}>
        <Trash2 size={iconSize ?? Math.round(size * 0.48)} color={c.danger} />
      </View>
    </PressableScale>
  );
}
