import { Text, View } from "react-native";

import { cardShadow } from "../../lib/theme";

interface Props {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  tint: string;
  className?: string;
}

/**
 * Tuile statistique — icône teintée + valeur en gras, libellé en dessous.
 * Le fond et la bordure reprennent la teinte à faible opacité.
 */
export function StatCard({ icon, value, label, tint, className }: Props) {
  return (
    <View
      style={[cardShadow, { backgroundColor: `${tint}14`, borderColor: `${tint}38` }]}
      className={`flex-1 border rounded-2xl p-3 ${className ?? ""}`}>
      <View className="flex-row items-center gap-2">
        <View
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: `${tint}22` }}>
          {icon}
        </View>
        <Text className="text-ink text-xl font-extrabold">{value}</Text>
      </View>
      <Text className="text-muted text-[11px] leading-tight mt-2">{label}</Text>
    </View>
  );
}
