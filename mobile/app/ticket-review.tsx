import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Check, Cloud, Cpu, Store, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Button } from "../components/ui/Button";
import { PressableScale } from "../components/ui/PressableScale";
import { Screen } from "../components/ui/Screen";
import { Stepper } from "../components/ui/Stepper";
import { SwipeableRow } from "../components/ui/SwipeableRow";
import { category } from "../lib/categories";
import { useColors } from "../lib/theme";
import { saveTicket } from "../services/tickets";
import { useScanStore } from "../store/scanStore";

function formatDate(iso: string | null) {
  if (!iso) return "Non détectée";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function TicketReviewScreen() {
  const c = useColors();
  const router = useRouter();
  const { result, updateArticle, removeArticle, clear } = useScanStore();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!result) {
      router.replace("/(tabs)");
    }
  }, [result, router]);

  if (!result) {
    return null;
  }

  const computedTotal =
    result.totals.total ??
    result.articles.reduce((sum, article) => sum + (article.total_price ?? 0), 0);

  const changeQuantity = (index: number, delta: number) => {
    const article = result.articles[index];
    const quantity = Math.max(1, Number(article.quantity) + delta);
    const unitPrice = article.unit_price ?? article.total_price ?? 0;
    updateArticle(index, {
      quantity,
      total_price: Math.round(quantity * unitPrice * 100) / 100,
    });
  };

  const handleDiscard = () => {
    clear();
    router.back();
  };

  const handleSave = async () => {
    if (!result.articles.length) {
      Alert.alert("Ticket vide", "Ajoutez au moins un article avant d'enregistrer.");
      return;
    }
    setIsSaving(true);
    try {
      await saveTicket(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clear();
      router.back();
    } catch (error: any) {
      Alert.alert("Erreur", error.message ?? "Enregistrement impossible.");
    } finally {
      setIsSaving(false);
    }
  };

  const isCloud = result.ocr_engine !== "easyocr";
  const engineLabel =
    result.ocr_engine === "gemini" ? "Gemini" : isCloud ? "Cloud" : "Local";

  return (
    <Screen edges={["top", "bottom"]}>
      <View className="flex-row items-center justify-between px-5 pt-2">
        <Text className="text-ink text-2xl font-extrabold">Contenu du ticket</Text>
        <PressableScale onPress={handleDiscard} haptic={false}>
          <View className="w-9 h-9 items-center justify-center rounded-full bg-surface-2 border border-border">
            <X size={20} color={c.ink} />
          </View>
        </PressableScale>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}>
        {/* Résumé */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="mt-4 rounded-3xl bg-surface/90 border border-border p-5">
          <View className="flex-row items-center gap-3">
            <View className="w-11 h-11 rounded-xl bg-primary/12 items-center justify-center">
              <Store size={20} color={c.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-ink text-lg font-bold" numberOfLines={1}>
                {result.shop.name || "Enseigne inconnue"}
              </Text>
              <Text className="text-muted text-sm">{formatDate(result.shop.date)}</Text>
            </View>
          </View>

          <View className="flex-row gap-3 mt-4">
            <Summary label="Articles" value={String(result.articles.length)} />
            <Summary label="Total" value={`${computedTotal.toFixed(2)} €`} accent />
            <Summary
              label="Moteur"
              value={engineLabel}
              icon={
                isCloud ? (
                  <Cloud size={13} color={c.muted} />
                ) : (
                  <Cpu size={13} color={c.muted} />
                )
              }
            />
          </View>
        </Animated.View>

        {/* Articles éditables */}
        <Text className="text-ink text-base font-bold mt-6 mb-2">Articles détectés</Text>
        {result.articles.map((article, index) => (
          <Animated.View
            key={`${article.label}-${index}`}
            entering={FadeInDown.duration(260).delay(Math.min(index * 30, 240))}>
            <SwipeableRow onDelete={() => removeArticle(index)}>
              <View className="mb-2 flex-row items-center rounded-2xl bg-surface/90 border border-border p-4">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: `${category(article.category).color}1f` }}>
                  <Text className="text-base">{category(article.category).emoji}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-ink font-semibold" numberOfLines={1}>
                    {article.label}
                  </Text>
                  <Text className="text-muted text-xs mt-0.5">
                    {(article.total_price ?? 0).toFixed(2)} €
                    {article.unit === "kg" ? ` · ${article.quantity} kg` : ""}
                  </Text>
                </View>

                {article.unit !== "kg" && (
                  <Stepper
                    size={36}
                    value={article.quantity}
                    onDecrement={() => changeQuantity(index, -1)}
                    onIncrement={() => changeQuantity(index, 1)}
                  />
                )}
              </View>
            </SwipeableRow>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Actions */}
      <View className="flex-row gap-3 px-5 pt-3 pb-1 border-t border-border">
        <View className="flex-1">
          <Button label="Reprendre" variant="secondary" onPress={handleDiscard} />
        </View>
        <View className="flex-1">
          <Button
            label="Enregistrer"
            onPress={handleSave}
            loading={isSaving}
            icon={<Check size={20} color="#ffffff" />}
          />
        </View>
      </View>
    </Screen>
  );
}

function Summary({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <View className="flex-1 items-center rounded-2xl bg-surface-2 py-3">
      <View className="flex-row items-center gap-1">
        {icon}
        <Text className="text-muted text-xs">{label}</Text>
      </View>
      <Text className={`text-lg font-extrabold mt-1 ${accent ? "text-primary" : "text-ink"}`}>
        {value}
      </Text>
    </View>
  );
}
