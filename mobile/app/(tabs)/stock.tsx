import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { AlertTriangle, CalendarClock, Package, Search, X } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Chip } from "../../components/ui/Chip";
import { EmptyState } from "../../components/ui/EmptyState";
import { PressableScale } from "../../components/ui/PressableScale";
import { Screen } from "../../components/ui/Screen";
import { Stepper } from "../../components/ui/Stepper";
import { fetchWithCache } from "../../lib/cache";
import { category } from "../../lib/categories";
import { syncExpiryReminders } from "../../lib/notifications";
import { useColors } from "../../lib/theme";
import {
  deleteStockItem,
  listStock,
  StockItem,
  updateStockItem,
} from "../../services/stock";

type Filter = "all" | "low" | "expiring";

const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

function expiryInfo(item: StockItem, c: ReturnType<typeof useColors>) {
  if (item.daysLeft == null) return null;
  if (item.daysLeft < 0) return { text: "Périmé", color: c.danger };
  if (item.daysLeft === 0) return { text: "Périme aujourd'hui", color: c.danger };
  if (item.daysLeft <= 3) return { text: `Périme dans ${item.daysLeft} j`, color: c.warning };
  return { text: `Périme dans ${item.daysLeft} j`, color: c.muted };
}

export default function StockScreen() {
  const c = useColors();
  const [items, setItems] = useState<StockItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expiryTarget, setExpiryTarget] = useState<StockItem | null>(null);

  const loadStock = useCallback(async () => {
    try {
      const { data } = await fetchWithCache("stock", listStock);
      setItems(data.items);
      // Reprogramme les rappels de péremption selon l'état à jour du stock
      syncExpiryReminders(data.items).catch(() => {});
    } catch (error: any) {
      Alert.alert("Erreur", error.message ?? "Chargement du stock impossible.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStock();
    }, [loadStock]),
  );

  const lowCount = items.filter((item) => item.isLow).length;
  const expiringCount = items.filter((item) => item.isExpiringSoon).length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .filter((item) =>
        filter === "low" ? item.isLow : filter === "expiring" ? item.isExpiringSoon : true,
      )
      .filter((item) => (query ? item.label.toLowerCase().includes(query) : true));
  }, [items, search, filter]);

  const changeQuantity = async (item: StockItem, delta: number) => {
    const quantity = Math.max(0, item.quantity + delta);
    setItems((current) =>
      current.map((i) =>
        i.id === item.id ? { ...i, quantity, isLow: quantity <= i.minQuantity } : i,
      ),
    );
    Haptics.selectionAsync();
    try {
      const { item: updated } = await updateStockItem(item.id, { quantity });
      setItems((current) => current.map((i) => (i.id === updated.id ? updated : i)));
    } catch {
      loadStock();
    }
  };

  const setExpiry = async (item: StockItem, expiryDate: string | null) => {
    setExpiryTarget(null);
    Haptics.selectionAsync();
    try {
      const { item: updated } = await updateStockItem(item.id, { expiryDate });
      setItems((current) => {
        const next = current.map((i) => (i.id === updated.id ? updated : i));
        syncExpiryReminders(next).catch(() => {});
        return next;
      });
    } catch (error: any) {
      Alert.alert("Erreur", error.message ?? "Mise à jour impossible.");
    }
  };

  const confirmDelete = (item: StockItem) => {
    Alert.alert("Supprimer", `Retirer « ${item.label} » du stock ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteStockItem(item.id);
            setItems((current) => current.filter((i) => i.id !== item.id));
          } catch (error: any) {
            Alert.alert("Erreur", error.message);
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      {/* En-tête */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-9 h-9 rounded-xl bg-primary items-center justify-center">
            <Package size={20} color="#ffffff" />
          </View>
          <Text className="text-ink text-xl font-extrabold">Mon stock</Text>
        </View>
        {lowCount > 0 && (
          <View className="flex-row items-center gap-1 rounded-full bg-warning/15 px-3 py-1.5">
            <AlertTriangle size={14} color={c.warning} />
            <Text className="text-warning text-sm font-semibold">{lowCount} à racheter</Text>
          </View>
        )}
      </View>

      {/* Recherche */}
      <View className="px-5">
        <View className="flex-row items-center rounded-2xl bg-surface-2 border border-border px-4">
          <Search size={18} color={c.subtle} />
          <TextInput
            className="ml-2 flex-1 py-3.5 text-base text-ink"
            placeholder="Rechercher un produit…"
            placeholderTextColor={c.subtle}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <PressableScale onPress={() => setSearch("")} haptic={false}>
              <X size={18} color={c.subtle} />
            </PressableScale>
          )}
        </View>
      </View>

      {/* Filtres */}
      <View className="flex-row gap-2 px-5 pt-3 pb-1">
        <Chip label="Tout" active={filter === "all"} onPress={() => setFilter("all")} />
        <Chip
          label="Stock bas"
          color={c.warning}
          active={filter === "low"}
          onPress={() => setFilter("low")}
        />
        <Chip
          label={expiringCount > 0 ? `Périme bientôt · ${expiringCount}` : "Périme bientôt"}
          color={c.danger}
          active={filter === "expiring"}
          onPress={() => setFilter("expiring")}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={async () => {
              setIsRefreshing(true);
              await loadStock();
              setIsRefreshing(false);
            }}
            tintColor={c.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Package size={30} color={c.primary} />}
            title={search || filter !== "all" ? "Aucun résultat" : "Stock vide"}
            subtitle={
              search || filter !== "all"
                ? "Aucun produit ne correspond à ce filtre."
                : "Scannez un ticket pour remplir automatiquement votre stock."
            }
          />
        }
        renderItem={({ item, index }) => {
          const meta = category(item.category);
          const expiry = expiryInfo(item, c);
          return (
            <Animated.View entering={FadeInDown.duration(300).delay(Math.min(index * 30, 240))}>
              <PressableScale
                onPress={() => setExpiryTarget(item)}
                onLongPress={() => confirmDelete(item)}
                scaleTo={0.99}
                haptic={false}>
                <View className="bg-surface/90 border border-border rounded-2xl p-4 flex-row items-center gap-3">
                  <View
                    className="w-11 h-11 rounded-xl items-center justify-center"
                    style={{ backgroundColor: item.isLow ? `${c.warning}22` : `${meta.color}1f` }}>
                    {item.isLow ? (
                      <AlertTriangle size={20} color={c.warning} />
                    ) : (
                      <Text className="text-lg">{meta.emoji}</Text>
                    )}
                  </View>

                  <View className="flex-1">
                    <Text className="text-ink font-semibold" numberOfLines={1}>
                      {item.label}
                    </Text>
                    <View className="flex-row items-center gap-1.5 mt-0.5">
                      <Text className="text-muted text-xs">
                        {item.isLow ? "Stock bas" : meta.label}
                        {item.lastPrice != null ? ` · ${item.lastPrice.toFixed(2)} €` : ""}
                      </Text>
                    </View>
                    {expiry && (
                      <View className="flex-row items-center gap-1 mt-1">
                        <CalendarClock size={12} color={expiry.color} />
                        <Text className="text-[11px] font-medium" style={{ color: expiry.color }}>
                          {expiry.text}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Stepper
                    size={40}
                    value={Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(1)}
                    onDecrement={() => changeQuantity(item, -1)}
                    onIncrement={() => changeQuantity(item, 1)}
                  />
                </View>
              </PressableScale>
            </Animated.View>
          );
        }}
      />

      <ExpirySheet
        item={expiryTarget}
        onClose={() => setExpiryTarget(null)}
        onPick={(days) => expiryTarget && setExpiry(expiryTarget, days == null ? null : addDays(days))}
      />
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */

const PRESETS: { label: string; days: number }[] = [
  { label: "3 jours", days: 3 },
  { label: "1 semaine", days: 7 },
  { label: "2 semaines", days: 14 },
  { label: "1 mois", days: 30 },
  { label: "3 mois", days: 90 },
];

function ExpirySheet({
  item,
  onClose,
  onPick,
}: {
  item: StockItem | null;
  onClose: () => void;
  onPick: (days: number | null) => void;
}) {
  const c = useColors();
  return (
    <Modal visible={!!item} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <Pressable
          className="bg-surface rounded-t-3xl border-t border-border px-5 pt-5 pb-9"
          onPress={(e) => e.stopPropagation()}>
          <View className="items-center mb-3">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>
          <Text className="text-ink text-lg font-bold">Date de péremption</Text>
          <Text className="text-muted text-sm mt-0.5 mb-4" numberOfLines={1}>
            {item?.label} · à consommer avant…
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {PRESETS.map((p) => (
              <PressableScale key={p.days} onPress={() => onPick(p.days)} scaleTo={0.95}>
                <View className="rounded-full border border-primary/40 bg-primary/8 px-4 py-2.5">
                  <Text className="text-primary font-semibold text-sm">Dans {p.label}</Text>
                </View>
              </PressableScale>
            ))}
          </View>

          {item?.expiryDate && (
            <PressableScale onPress={() => onPick(null)} scaleTo={0.97} style={{ marginTop: 24 }}>
              <View className="rounded-xl bg-surface-2 border border-border py-3 items-center">
                <Text className="font-semibold text-sm" style={{ color: c.danger }}>
                  Retirer la date
                </Text>
              </View>
            </PressableScale>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
