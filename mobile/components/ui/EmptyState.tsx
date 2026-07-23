import { Text, View } from "react-native";

interface Props {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/** État vide illustré : pastille d'icône, titre, sous-titre, action optionnelle. */
export function EmptyState({ icon, title, subtitle, action }: Props) {
  return (
    <View className="items-center justify-center px-8 py-12">
      <View className="w-16 h-16 rounded-full bg-primary/15 items-center justify-center mb-4">
        {icon}
      </View>
      <Text className="text-ink text-lg font-bold text-center">{title}</Text>
      {subtitle ? (
        <Text className="text-muted text-center mt-1.5 leading-5">{subtitle}</Text>
      ) : null}
      {action ? <View className="mt-6">{action}</View> : null}
    </View>
  );
}
