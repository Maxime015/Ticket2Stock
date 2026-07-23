import { Link } from "expo-router";
import { Lock, Mail, ReceiptText } from "lucide-react-native";
import { useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Screen } from "../../components/ui/Screen";
import { TileMarquee } from "../../components/ui/TileMarquee";
import { cardShadow, useColors } from "../../lib/theme";
import { useAuthStore } from "../../store/authStore";

const MARQUEE_H = Math.min(Dimensions.get("window").height * 0.4, 360);

export default function LoginScreen() {
  const c = useColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const { isLoading, login, isCheckingAuth } = useAuthStore();

  const handleLogin = async () => {
    setFormError(null);
    if (!email.trim() || !password) {
      setFormError("Renseignez votre e-mail et votre mot de passe.");
      return;
    }
    const result = await login(email.trim(), password);
    if (!result.success) setFormError(result.error ?? "Connexion impossible.");
  };

  if (isCheckingAuth) return null;

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <TileMarquee height={MARQUEE_H} />

          {/* Panneau formulaire qui chevauche le marquee */}
          <View className="flex-1 bg-background rounded-t-3xl px-6 pb-8" style={{ marginTop: -28 }}>
            <View className="items-center" style={{ marginTop: -34 }}>
              <View
                className="w-16 h-16 rounded-3xl bg-primary items-center justify-center"
                style={cardShadow}>
                <ReceiptText size={30} color="#ffffff" />
              </View>
            </View>

            <Text className="text-ink text-3xl font-extrabold text-center mt-3">Ticket2Stock</Text>
            <Text className="text-muted text-center mt-1">
              Vos tickets deviennent votre stock
            </Text>

            <Animated.View entering={FadeInUp.duration(500).delay(150)} className="gap-4 mt-7">
              <Text className="text-ink text-xl font-bold">Bon retour 👋</Text>

              <Input
                label="E-mail"
                placeholder="vous@exemple.com"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                icon={<Mail size={20} color={c.subtle} />}
              />
              <Input
                label="Mot de passe"
                placeholder="••••••••"
                secure
                value={password}
                onChangeText={setPassword}
                icon={<Lock size={20} color={c.subtle} />}
              />

              {formError ? (
                <View className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">
                  <Text className="text-danger text-sm">{formError}</Text>
                </View>
              ) : null}

              <Button label="Se connecter" onPress={handleLogin} loading={isLoading} className="mt-2" />

              <View className="flex-row justify-center mt-4">
                <Text className="text-muted">Pas encore de compte ? </Text>
                <Link href="/signup">
                  <Text className="text-primary font-semibold">Créer un compte</Text>
                </Link>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
