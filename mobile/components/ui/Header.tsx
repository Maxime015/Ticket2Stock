import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { useColors } from "../../lib/theme";

interface Props {
  title: string;
  right?: React.ReactNode;
  onBack?: () => void;
}

/** En-tête d'écran : flèche retour + titre centré + action optionnelle. */
export function Header({ title, right, onBack }: Props) {
  const router = useRouter();
  const c = useColors();
  return (
    <View className="flex-row items-center justify-between px-4 py-2">
      <Pressable
        onPress={onBack ?? (() => router.back())}
        hitSlop={10}
        className="w-10 h-10 rounded-full bg-surface-2 items-center justify-center">
        <ChevronLeft size={24} color={c.ink} />
      </Pressable>
      <Text className="text-ink text-lg font-bold flex-1 text-center" numberOfLines={1}>
        {title}
      </Text>
      <View className="w-10 h-10 items-center justify-center">{right}</View>
    </View>
  );
}
