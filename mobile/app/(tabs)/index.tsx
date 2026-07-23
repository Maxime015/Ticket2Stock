import { Camera } from "expo-camera";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  ChevronRight,
  Images,
  Package,
  Receipt,
  ReceiptText,
  ShoppingCart,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { PressableScale } from "../../components/ui/PressableScale";
import { Screen } from "../../components/ui/Screen";
import { StatCard } from "../../components/ui/StatCard";
import { fetchWithCache } from "../../lib/cache";
import { useColors, useIsDark } from "../../lib/theme";
import { listTickets, scanTicket, TicketSummary } from "../../services/tickets";
import { useScanStore } from "../../store/scanStore";

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ScanScreen() {
  const router = useRouter();
  const c = useColors();
  const isDark = useIsDark();
  const setScanResult = useScanStore((state) => state.setResult);

  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      const { data } = await fetchWithCache("tickets", listTickets);
      setTickets(data.tickets);
    } catch {
      // silencieux : l'historique n'est pas bloquant pour scanner
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTickets();
    }, [loadTickets]),
  );

  const totalSpent = tickets.reduce((sum, t) => sum + (t.total ?? 0), 0);
  const totalItems = tickets.reduce((sum, t) => sum + (t.itemsCount ?? 0), 0);

  const analyzeImage = async (imageUri: string) => {
    setIsAnalyzing(true);
    try {
      const result = await scanTicket(imageUri);
      if (!result.articles?.length) {
        Alert.alert(
          "Aucun article détecté",
          "Le ticket n'a pas pu être lu. Essayez avec une photo plus nette et bien éclairée.",
        );
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScanResult(result);
      router.push("/ticket-review");
    } catch (error: any) {
      Alert.alert("Erreur", error.message ?? "Impossible d'analyser le ticket.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scanWithCamera = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Accès à la caméra refusé.");
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (!result.canceled) await analyzeImage(result.assets[0].uri);
    } catch (error: any) {
      Alert.alert(
        "Caméra indisponible",
        error?.message?.includes("simulator")
          ? "La caméra n'est pas disponible sur le simulateur. Utilisez « Importer depuis la galerie » ou testez sur un appareil réel."
          : (error?.message ?? "Impossible d'ouvrir la caméra."),
      );
    }
  };

  const importFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Accès à la galerie refusé.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled) await analyzeImage(result.assets[0].uri);
  };

  return (
    <Screen>
      <View className="flex-1">
        {/* Partie fixe (ne défile pas) */}
        <View className="px-5 pt-5">
        {/* En-tête */}
        <View className="flex-row items-center gap-3 mb-5">
          <View className="w-11 h-11 rounded-2xl bg-primary items-center justify-center">
            <ReceiptText size={24} color="#ffffff" />
          </View>
          <Text className="text-ink text-2xl font-extrabold">Ticket2Stock</Text>
        </View>

        {/* Carte de scan */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <View className="rounded-3xl overflow-hidden">
            <LinearGradient
              colors={c.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 24 }}>
    <Text className="text-white text-xl font-extrabold">
      Scanner un ticket de caisse
    </Text>

    <Text className="text-white/80 mt-1.5 leading-5">
      Vos achats sont ajoutés automatiquement à votre stock.
    </Text>

            <View className="mt-3 gap-3">
              <PressableScale
                onPress={scanWithCamera}
                scaleTo={0.98}
                disabled={isAnalyzing}>
                {/* Bouton principal : blanc en clair, surface sombre en mode sombre */}
                <View
                  className="rounded-2xl py-4 flex-row items-center justify-center gap-2"
                  style={{ backgroundColor: isDark ? c.surface : "#FFFFFF" }}>
                  <Ionicons
                    name="camera-outline"
                    size={20}
                    color={isDark ? c.ink : c.primary}
                  />
                  <Text
                    className="font-bold text-base"
                    style={{ color: isDark ? c.ink : c.primary }}>
                    Prendre une photo
                  </Text>
                </View>
              </PressableScale>

              <PressableScale
                onPress={importFromGallery}
                scaleTo={0.98}
                disabled={isAnalyzing}>
                {/* Bouton secondaire : contour en clair, léger fond translucide en sombre */}
                <View
                  className="rounded-2xl py-4 flex-row items-center justify-center gap-2 border"
                  style={{
                    backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "transparent",
                    borderColor: isDark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.5)",
                  }}>
                  <Images size={20} color="#ffffff" />
                  <Text className="text-white font-bold text-base">
                    Importer depuis la galerie
                  </Text>
                </View>
              </PressableScale>
            </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Aperçu rapide */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          className="flex-row gap-3 mt-7">
          <StatCard
            icon={<Receipt size={18} color={c.primary} />}
            value={tickets.length}
            label="Tickets scannés"
            tint={c.primary}
          />
          <StatCard
            icon={<Package size={18} color={c.info} />}
            value={totalItems}
            label="Articles achetés"
            tint={c.info}
          />
          <StatCard
            icon={<ShoppingCart size={18} color={c.success} />}
            value={`${totalSpent.toFixed(0)}€`}
            label="Total dépensé"
            tint={c.success}
          />
        </Animated.View>

        {/* Historique */}
        <View className="flex-row items-center justify-between mt-7 mb-3">
          <Text className="text-ink text-lg font-bold">Historique</Text>
          <Text className="text-muted text-sm">
            {tickets.length} ticket{tickets.length > 1 ? "s" : ""}
          </Text>
        </View>
        </View>

        {/* Liste des tickets (défile seule) */}
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={async () => {
                setIsRefreshing(true);
                await loadTickets();
                setIsRefreshing(false);
              }}
              tintColor={c.primary}
            />
          }
          ListEmptyComponent={
            <View className="bg-surface/90 border border-border rounded-2xl items-center py-10 px-6">
              <View className="w-14 h-14 rounded-full bg-primary/15 items-center justify-center mb-3">
                <Receipt size={26} color={c.primary} />
              </View>
              <Text className="text-ink font-bold">Aucun ticket enregistré</Text>
              <Text className="text-muted text-center text-sm mt-1">
                Scannez votre premier ticket pour remplir votre stock.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(300).delay(Math.min(index * 40, 300))}>
              <PressableScale onPress={() => router.push(`/ticket/${item.id}`)} scaleTo={0.98}>
                <View className="bg-surface/90 border border-border rounded-2xl p-4 flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center">
                    <Receipt size={22} color={c.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-ink font-bold" numberOfLines={1}>
                      {item.shopName || "Ticket"}
                    </Text>
                    <Text className="text-muted text-xs mt-0.5">
                      {formatDate(item.purchaseDate ?? item.createdAt)} · {item.itemsCount} article
                      {item.itemsCount > 1 ? "s" : ""}
                    </Text>
                  </View>
                  {item.total != null && (
                    <Text className="text-ink font-extrabold">{item.total.toFixed(2)} €</Text>
                  )}
                  <ChevronRight size={18} color={c.subtle} />
                </View>
              </PressableScale>
            </Animated.View>
          )}
        />
      </View>

      {/* Overlay d'analyse */}
      {isAnalyzing && (
        <View className="absolute inset-0 items-center justify-center bg-black/50">
          <View className="items-center bg-surface rounded-3xl px-10 py-8 border border-border">
            <ActivityIndicator size="large" color={c.primary} />
            <Text className="text-ink font-bold text-base mt-4">Analyse du ticket…</Text>
            <Text className="text-muted text-sm mt-1">Extraction des articles en cours</Text>
          </View>
        </View>
      )}
    </Screen>
  );
}
