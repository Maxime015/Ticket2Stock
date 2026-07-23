import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import {
  Check,
  Plus,
  ShoppingCart,
  Sparkles,
  Trash2,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { DeleteButton } from "../../components/ui/DeleteButton";
import { EmptyState } from "../../components/ui/EmptyState";
import { PressableScale } from "../../components/ui/PressableScale";
import { Screen } from "../../components/ui/Screen";
import { fetchWithCache } from "../../lib/cache";
import { useColors } from "../../lib/theme";
import {
  addShoppingItem,
  clearChecked,
  deleteShoppingItem,
  generateShoppingList,
  listShopping,
  ShoppingItem,
  toggleShoppingItem,
} from "../../services/shopping";

export default function ShoppingScreen() {
  const c = useColors();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadList = useCallback(async () => {
    try {
      const { data } = await fetchWithCache("shopping", listShopping);
      setItems(data.items);
    } catch (error: any) {
      Alert.alert("Erreur", error.message ?? "Chargement de la liste impossible.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadList();
    }, [loadList]),
  );

  const checkedCount = items.filter((item) => item.checked).length;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateShoppingList();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadList();
      Alert.alert("Liste générée", result.message);
    } catch (error: any) {
      Alert.alert("Erreur", error.message ?? "Génération impossible.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdd = async () => {
    const label = newLabel.trim();
    if (!label) return;
    setNewLabel("");
    try {
      const { item } = await addShoppingItem(label);
      setItems((current) => [item, ...current]);
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    }
  };

  const handleToggle = async (item: ShoppingItem) => {
    Haptics.selectionAsync();
    setItems((current) =>
      current.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)),
    );
    try {
      await toggleShoppingItem(item.id);
    } catch {
      loadList();
    }
  };

  const handleDelete = async (item: ShoppingItem) => {
    setItems((current) => current.filter((i) => i.id !== item.id));
    try {
      await deleteShoppingItem(item.id);
    } catch {
      loadList();
    }
  };

  const handleClearChecked = async () => {
    try {
      await clearChecked();
      setItems((current) => current.filter((i) => !i.checked));
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    }
  };

  return (
    <Screen>
      {/* En-tête */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-9 h-9 rounded-xl bg-primary items-center justify-center">
            <ShoppingCart size={20} color="#ffffff" />
          </View>
          <Text className="text-ink text-xl font-extrabold">Mes courses</Text>
        </View>
        {checkedCount > 0 && (
          <PressableScale onPress={handleClearChecked} haptic={false}>
            <View className="flex-row items-center gap-1">
              <Trash2 size={15} color={c.danger} />
              <Text className="text-danger text-sm font-semibold">Vider ({checkedCount})</Text>
            </View>
          </PressableScale>
        )}
      </View>

      <View className="px-5">
        {/* Génération automatique */}
        <PressableScale onPress={handleGenerate} scaleTo={0.98} disabled={isGenerating}>
          <View className="rounded-2xl bg-primary/10 border border-primary/25 p-4 flex-row items-center gap-3">
            <View className="w-11 h-11 rounded-2xl bg-primary/15 items-center justify-center">
              {isGenerating ? (
                <ActivityIndicator color={c.primary} />
              ) : (
                <Sparkles size={22} color={c.primary} />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-ink font-bold text-base">Générer depuis mon stock</Text>
              <Text className="text-muted text-sm">Ajoute les produits qui manquent</Text>
            </View>
          </View>
        </PressableScale>

        {/* Ajout manuel */}
        <View className="mt-3 flex-row items-center rounded-2xl bg-surface-2 border border-border pl-4 pr-2">
          <Plus size={20} color={c.subtle} />
          <TextInput
            className="ml-2 flex-1 py-3.5 text-base text-ink"
            placeholder="Ajouter un article…"
            placeholderTextColor={c.subtle}
            value={newLabel}
            onChangeText={setNewLabel}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          {newLabel.trim().length > 0 && (
            <PressableScale onPress={handleAdd}>
              <View className="rounded-xl bg-primary px-4 py-2">
                <Text className="text-white text-sm font-semibold">Ajouter</Text>
              </View>
            </PressableScale>
          )}
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={async () => {
              setIsRefreshing(true);
              await loadList();
              setIsRefreshing(false);
            }}
            tintColor={c.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<ShoppingCart size={30} color={c.primary} />}
            title="Liste vide"
            subtitle="Générez la liste depuis votre stock ou ajoutez des articles à la main."
          />
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.duration(300).delay(Math.min(index * 30, 240))}>
            <View className="bg-surface/90 border border-border rounded-2xl px-4 py-5 flex-row items-center gap-3">
              {/* flex:1 en style inline : NativeWind n'applique pas de façon
                  fiable les classes de layout sur le Pressable animé. */}
              <PressableScale
                onPress={() => handleToggle(item)}
                style={{ flex: 1 }}
                scaleTo={0.99}
                haptic={false}>
                <View className="flex-row items-center gap-3">
                  <View
                    className="w-7 h-7 rounded-full items-center justify-center border-2"
                    style={{
                      borderColor: item.checked ? c.success : c.subtle,
                      backgroundColor: item.checked ? c.success : "transparent",
                    }}>
                    {item.checked && <Check size={16} color="#ffffff" />}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={
                        item.checked
                          ? "text-subtle line-through text-base"
                          : "text-ink font-semibold text-base"
                      }
                      numberOfLines={1}>
                      {item.label}
                    </Text>
                    {item.source === "auto" && !item.checked && (
                      <Text className="text-primary text-[13px] mt-1">Suggéré depuis le stock</Text>
                    )}
                  </View>
                </View>
              </PressableScale>

              <DeleteButton onPress={() => handleDelete(item)} />
            </View>
          </Animated.View>
        )}
      />
    </Screen>
  );
}
