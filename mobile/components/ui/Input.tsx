import { Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, type TextInputProps, View } from "react-native";

import { useColors } from "../../lib/theme";

interface Props extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  secure?: boolean;
}

export function Input({ label, icon, error, secure, ...rest }: Props) {
  const c = useColors();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secure));

  return (
    <View className="w-full">
      {label ? <Text className="text-muted text-sm mb-2 ml-1 font-medium">{label}</Text> : null}
      <View
        className={`flex-row items-center rounded-2xl border px-4 ${
          error ? "border-danger" : focused ? "border-primary" : "border-border"
        } bg-surface-2`}>
        {icon ? <View className="mr-3">{icon}</View> : null}
        <TextInput
          className="flex-1 text-ink text-base py-4"
          placeholderTextColor={c.subtle}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((val) => !val)} hitSlop={10} className="ml-2">
            {hidden ? <EyeOff size={20} color={c.subtle} /> : <Eye size={20} color={c.subtle} />}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-danger text-xs mt-1.5 ml-1">{error}</Text> : null}
    </View>
  );
}
