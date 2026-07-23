import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { Card } from "../components/ui/Card";
import { Header } from "../components/ui/Header";
import { PressableScale } from "../components/ui/PressableScale";
import { Screen } from "../components/ui/Screen";
import { fetchWithCache } from "../lib/cache";
import { CATEGORY_ORDER, category } from "../lib/categories";
import { ThemeColors, useColors } from "../lib/theme";
import { listBudgets, setBudget } from "../services/budgets";

// Accessoire clavier iOS : remplace le « Done » système par un bouton centré.
const ACCESSORY_ID = "budgetsAccessory";

type Row = { key: string; label: string; emoji: string; color: string };

const GLOBAL: Row = { key: "", label: "Budget global", emoji: "💶", color: "#6C47FF" };
const CATEGORY_ROWS: Row[] = CATEGORY_ORDER.filter((k) => k !== "autres").map((k) => ({
  key: k,
  ...category(k),
}));

export default function BudgetsScreen() {
  const c = useColors();
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Enregistre le champ en cours (via la perte de focus) puis revient en arrière.
  const handleSave = () => {
    Keyboard.dismiss();
    router.back();
  };

  const load = useCallback(async () => {
    try {
      const { data } = await fetchWithCache("budgets", listBudgets);
      const map: Record<string, string> = {};
      data.budgets.forEach((b) => {
        map[b.category] = String(b.amount);
      });
      setValues(map);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const commit = async (key: string, raw: string) => {
    const amount = parseFloat(raw.replace(",", ".")) || 0;
    setSaving(key);
    try {
      await setBudget(key, amount);
      setValues((v) => ({ ...v, [key]: amount > 0 ? String(amount) : "" }));
    } catch {
      load();
    } finally {
      setSaving(null);
    }
  };

  const rowProps = (row: Row) => ({
    row,
    colors: c,
    value: values[row.key] ?? "",
    saving: saving === row.key,
    onChange: (t: string) => setValues((v) => ({ ...v, [row.key]: t })),
    onCommit: (t: string) => commit(row.key, t),
  });

  return (
    <Screen edges={["top", "bottom"]}>
      <Header title="Budgets mensuels" />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.primary} />
        </View>
      ) : (
        <>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1">
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {/* Budget global mis en avant */}
              <Card className="px-4">
                <BudgetRow {...rowProps(GLOBAL)} emphasized subtitle="Toutes dépenses confondues" />
              </Card>

              <Text className="text-ink text-base font-bold mt-7 mb-2.5 ml-1">Par catégorie</Text>

              <Card className="px-4">
                {CATEGORY_ROWS.map((row, i) => (
                  <View key={row.key}>
                    {i > 0 && (
                      <View
                        className="h-px"
                        style={{ backgroundColor: c.borderSoft, marginLeft: 52 }}
                      />
                    )}
                    <BudgetRow {...rowProps(row)} />
                  </View>
                ))}
              </Card>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Bouton d'enregistrement centré, fixe en bas */}
          <View className="px-5 pt-2 pb-1 border-t border-border/60 items-center">
            <PressableScale onPress={handleSave} scaleTo={0.97}>
              <View className="rounded-full bg-primary px-16 py-3.5">
                <Text className="text-white font-bold text-base">Enregistrer</Text>
              </View>
            </PressableScale>
          </View>

          {Platform.OS === "ios" && (
            <InputAccessoryView nativeID={ACCESSORY_ID}>
              <View
                className="border-t border-border px-5 py-2 items-center"
                style={{ backgroundColor: c.surface }}>
                <PressableScale onPress={() => Keyboard.dismiss()} scaleTo={0.97}>
                  <View className="rounded-full bg-primary px-12 py-2.5">
                    <Text className="text-white font-bold text-base">Enregistrer</Text>
                  </View>
                </PressableScale>
              </View>
            </InputAccessoryView>
          )}
        </>
      )}
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */

function BudgetRow({
  row,
  colors: c,
  value,
  saving,
  onChange,
  onCommit,
  emphasized,
  subtitle,
}: {
  row: Row;
  colors: ThemeColors;
  value: string;
  saving: boolean;
  onChange: (t: string) => void;
  onCommit: (t: string) => void;
  emphasized?: boolean;
  subtitle?: string;
}) {
  const filled = value.trim().length > 0;

  return (
    <View className="flex-row items-center gap-3 py-3.5">
      <View
        className="w-10 h-10 rounded-2xl items-center justify-center"
        style={{ backgroundColor: `${row.color}1a` }}>
        <Text className="text-lg">{row.emoji}</Text>
      </View>

      <View className="flex-1">
        <Text
          className={`text-[15px] ${emphasized ? "text-ink font-bold" : "text-ink font-medium"}`}
          numberOfLines={1}>
          {row.label}
        </Text>
        {subtitle ? <Text className="text-muted text-xs mt-0.5">{subtitle}</Text> : null}
      </View>

      <View className="flex-row items-center gap-2">
        {saving ? <ActivityIndicator size="small" color={c.primary} /> : null}
        <View
          className="flex-row items-center rounded-xl px-3"
          style={{
            backgroundColor: filled ? `${row.color}14` : c.surface2,
            borderWidth: 1,
            borderColor: filled ? `${row.color}59` : c.border,
          }}>
          <TextInput
            className="py-2 text-base font-bold text-right"
            style={{ minWidth: 58, color: filled ? c.ink : c.subtle }}
            keyboardType="decimal-pad"
            placeholder="—"
            placeholderTextColor={c.subtle}
            value={value}
            onChangeText={onChange}
            onEndEditing={(e) => onCommit(e.nativeEvent.text)}
            inputAccessoryViewID={Platform.OS === "ios" ? ACCESSORY_ID : undefined}
            returnKeyType="done"
          />
          <Text className="text-base ml-1 font-semibold" style={{ color: filled ? row.color : c.subtle }}>
            €
          </Text>
        </View>
      </View>
    </View>
  );
}
