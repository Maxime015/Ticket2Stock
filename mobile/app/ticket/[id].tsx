import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { DeleteButton } from "../../components/ui/DeleteButton";
import { Header } from "../../components/ui/Header";
import { Screen } from "../../components/ui/Screen";
import { useColors } from "../../lib/theme";
import { deleteTicket, getTicket, TicketDetail } from "../../services/tickets";

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function TicketDetailScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);

  useEffect(() => {
    if (!id) return;
    getTicket(id)
      .then(setTicket)
      .catch((error: any) => {
        Alert.alert("Erreur", error.message ?? "Ticket introuvable.");
        router.back();
      });
  }, [id, router]);

  const handleDelete = () => {
    Alert.alert(
      "Supprimer le ticket",
      "Le stock déjà ajouté ne sera pas retiré. Continuer ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTicket(id);
              router.back();
            } catch (error: any) {
              Alert.alert("Erreur", error.message);
            }
          },
        },
      ],
    );
  };

  if (!ticket) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title={ticket.shopName || "Ticket"}
        right={<DeleteButton onPress={handleDelete} size={40} iconSize={18} />}
      />

      <FlatList
        data={ticket.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Animated.View entering={FadeInDown.duration(400)}>
              <LinearGradient
                colors={c.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                // padding/marge en style : NativeWind n'applique pas les classes
                // de layout au LinearGradient (composant tiers) → sinon texte collé
                style={{ borderRadius: 24, padding: 22, marginTop: 8 }}>
                <Text className="text-white/75 text-sm capitalize">
                  {formatDate(ticket.purchaseDate ?? ticket.createdAt)}
                </Text>
                <Text className="text-white text-4xl font-extrabold mt-1.5" numberOfLines={1}>
                  {ticket.total != null ? `${ticket.total.toFixed(2)} €` : "—"}
                </Text>
                <View className="flex-row gap-5 mt-3">
                  {ticket.totalHt != null && (
                    <Text className="text-white/85 text-sm">HT {ticket.totalHt.toFixed(2)} €</Text>
                  )}
                  {ticket.totalTva != null && (
                    <Text className="text-white/85 text-sm">
                      TVA {ticket.totalTva.toFixed(2)} €
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </Animated.View>
            <Text className="text-ink text-lg font-bold mt-6 mb-3">
              {ticket.items.length} article{ticket.items.length > 1 ? "s" : ""}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.duration(280).delay(Math.min(index * 30, 240))}>
            <View className="bg-surface/90 border border-border rounded-2xl p-4 flex-row items-center gap-3">
              <View className="flex-1">
                <Text className="text-ink font-semibold" numberOfLines={1}>
                  {item.label}
                </Text>
                <Text className="text-muted text-xs mt-0.5">
                  Quantité : {item.quantity}
                  {item.unitPrice != null ? ` · ${item.unitPrice.toFixed(2)} € / unité` : ""}
                </Text>
              </View>
              {item.totalPrice != null && (
                <Text className="text-ink font-extrabold">{item.totalPrice.toFixed(2)} €</Text>
              )}
            </View>
          </Animated.View>
        )}
      />
    </Screen>
  );
}
