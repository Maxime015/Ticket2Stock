import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ChartColumn,
  ChevronRight,
  ReceiptText,
  Store,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PressableScale } from "../../components/ui/PressableScale";
import { Screen } from "../../components/ui/Screen";
import { StatCard } from "../../components/ui/StatCard";
import { fetchWithCache } from "../../lib/cache";
import { category } from "../../lib/categories";
import { checkBudgetAlerts } from "../../lib/notifications";
import { cardShadow, useColors } from "../../lib/theme";
import { getStatsOverview, StatsOverview } from "../../services/stats";

const euro = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;
const euroShort = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : Math.round(n).toString());

export default function StatsScreen() {
  const c = useColors();
  const router = useRouter();
  const [data, setData] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: overview } = await fetchWithCache("stats", getStatsOverview);
      setData(overview);
      // Notifie si un budget franchit 90 % / 100 % ce mois-ci
      checkBudgetAlerts(overview).catch(() => {});
    } catch {
      // silencieux : l'écran affiche l'état vide en cas d'échec
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const hasData =
    !!data && (data.monthTotal > 0 || data.series.some((s) => s.total > 0));

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <View className="flex-row items-center gap-2">
          <View className="w-9 h-9 rounded-xl bg-primary items-center justify-center">
            <ChartColumn size={20} color="#ffffff" />
          </View>
          <Text className="text-ink text-xl font-extrabold">Statistiques</Text>
        </View>
        <PressableScale onPress={() => router.push("/budgets")} haptic={false}>
          <View className="flex-row items-center gap-1 rounded-full bg-primary/12 px-3 py-1.5">
            <Wallet size={15} color={c.primary} />
            <Text className="text-primary text-sm font-semibold">Budgets</Text>
          </View>
        </PressableScale>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.primary} />
        </View>
      ) : !hasData ? (
        <EmptyState
          icon={<ChartColumn size={30} color={c.primary} />}
          title="Pas encore de données"
          subtitle="Scannez quelques tickets pour voir vos dépenses, vos catégories et vos budgets."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              tintColor={c.primary}
            />
          }>
          {data && (
            <>
              <BudgetHero data={data} onManage={() => router.push("/budgets")} />

              <View className="flex-row gap-3 mt-4">
                <StatCard
                  icon={<ReceiptText size={18} color={c.primary} />}
                  value={data.ticketCount}
                  label={`Ticket${data.ticketCount > 1 ? "s" : ""} ce mois`}
                  tint={c.primary}
                />
                <StatCard
                  icon={<Wallet size={18} color={c.info} />}
                  value={euro(data.avgBasket)}
                  label="Panier moyen"
                  tint={c.info}
                />
              </View>

              <MonthlyChart data={data} />
              <CategoryBreakdown data={data} onManage={() => router.push("/budgets")} />
              <TopProducts data={data} />
              <TopShops data={data} />
            </>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */

function BudgetHero({ data, onManage }: { data: StatsOverview; onManage: () => void }) {
  const c = useColors();
  const budget = data.budgets.global;
  const up = (data.deltaPct ?? 0) >= 0;

  const ratio = budget && budget.amount > 0 ? data.monthTotal / budget.amount : 0;
  const over = ratio > 1;
  const pct = budget && budget.amount > 0 ? Math.round(ratio * 100) : null;

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <View style={cardShadow} className="rounded-3xl overflow-hidden">
        <LinearGradient
          colors={c.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 22 }}>
          {/* Illustration liste de courses, à droite */}
          <Image
            source={require("../../assets/images/list.png")}
            style={{ position: "absolute", top: 8, right: 8, width: 104, height: 104 }}
            contentFit="contain"
          />

          <View style={{ paddingRight: 92 }}>
            {/* Ligne mois + variation */}
            <View className="flex-row items-center justify-between">
            <Text className="text-white/75 text-sm font-medium capitalize">
              {data.monthLabel}
            </Text>
            {data.deltaPct != null && (
              <View
                className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
                style={{ backgroundColor: "rgba(255,255,255,0.18)" }}>
                {up ? (
                  <TrendingUp size={13} color="#ffffff" />
                ) : (
                  <TrendingDown size={13} color="#ffffff" />
                )}
                <Text className="text-white text-xs font-bold">
                  {up ? "+" : ""}
                  {data.deltaPct}%
                </Text>
              </View>
            )}
          </View>

          {/* Montant dépensé */}
          <Text className="text-white text-4xl font-extrabold mt-1.5" numberOfLines={1}>
            {euro(data.monthTotal)}
          </Text>
          <Text className="text-white/70 text-xs mt-1">
            {data.deltaPct != null
              ? `vs ${euro(data.prevMonthTotal)} le mois dernier`
              : "Dépenses du mois en cours"}
          </Text>
          </View>

          {budget ? (
            <View className="mt-4">
              <View
                className="h-2.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
                <View
                  style={{
                    width: `${Math.min(ratio, 1) * 100}%`,
                    backgroundColor: over ? c.warning : "#ffffff",
                  }}
                  className="h-full rounded-full"
                />
              </View>
              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-white/75 text-xs">
                  Budget {euro(budget.amount)} · {pct}%
                </Text>
                <Text className="text-white text-xs font-bold">
                  {over
                    ? `⚠️ Dépassé de ${euro(data.monthTotal - budget.amount)}`
                    : `Reste ${euro(budget.amount - data.monthTotal)}`}
                </Text>
              </View>
            </View>
          ) : (
            <PressableScale onPress={onManage} scaleTo={0.98} className="mt-4">
              <View
                className="rounded-xl py-3 items-center border"
                style={{
                  backgroundColor: "rgba(255,255,255,0.16)",
                  borderColor: "rgba(255,255,255,0.35)",
                }}>
                <Text className="text-white font-semibold text-sm">
                  + Définir un budget mensuel
                </Text>
              </View>
            </PressableScale>
          )}
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text className="text-ink text-base font-bold mt-6 mb-2">{children}</Text>;
}

function MonthlyChart({ data }: { data: StatsOverview }) {
  const c = useColors();
  const max = Math.max(...data.series.map((s) => s.total), 1);

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(80)}>
      <SectionTitle>Évolution sur 6 mois</SectionTitle>
      <Card className="p-4">
        <View className="flex-row items-end justify-between" style={{ height: 130 }}>
          {data.series.map((point, i) => {
            const current = i === data.series.length - 1;
            const h = Math.max((point.total / max) * 100, point.total > 0 ? 6 : 2);
            return (
              <View key={point.month} className="flex-1 items-center justify-end">
                <Text className="text-[10px] text-muted mb-1" numberOfLines={1}>
                  {point.total > 0 ? euroShort(point.total) : ""}
                </Text>
                <View
                  style={{
                    height: h,
                    width: "58%",
                    backgroundColor: current ? c.primary : `${c.primary}40`,
                  }}
                  className="rounded-t-lg"
                />
                <Text
                  className="text-[10px] mt-1.5"
                  style={{ color: current ? c.primary : c.subtle, fontWeight: current ? "700" : "400" }}>
                  {point.label}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>
    </Animated.View>
  );
}

function CategoryBreakdown({ data, onManage }: { data: StatsOverview; onManage: () => void }) {
  const c = useColors();
  if (data.categories.length === 0) return null;
  const total = data.categories.reduce((s, cat) => s + cat.amount, 0) || 1;
  const budgetByCat = new Map(data.budgets.categories.map((b) => [b.category, b]));

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(160)}>
      <View className="flex-row items-center justify-between mt-6 mb-2">
        <Text className="text-ink text-base font-bold">Par catégorie</Text>
        <PressableScale onPress={onManage} haptic={false}>
          <Text className="text-primary text-sm font-semibold">Budgets</Text>
        </PressableScale>
      </View>
      <Card className="p-4">
        {data.categories.map((cat, i) => {
          const share = cat.amount / total;
          const budget = budgetByCat.get(cat.category);
          const over = budget && cat.amount > budget.amount;
          return (
            <View key={cat.category} className={i > 0 ? "mt-3.5" : ""}>
              <View className="flex-row items-center justify-between mb-1.5">
                <View className="flex-row items-center gap-2 flex-1">
                  <Text className="text-base">{cat.emoji}</Text>
                  <Text className="text-ink text-sm font-medium" numberOfLines={1}>
                    {cat.label}
                  </Text>
                </View>
                <Text className="text-ink text-sm font-semibold ml-2">{euro(cat.amount)}</Text>
              </View>
              <View className="h-2 rounded-full bg-surface-2 overflow-hidden">
                <View
                  style={{ width: `${Math.max(share * 100, 3)}%`, backgroundColor: cat.color }}
                  className="h-full rounded-full"
                />
              </View>
              {budget && (
                <Text
                  className="text-[11px] mt-1"
                  style={{ color: over ? c.danger : c.muted }}>
                  {over ? "⚠️ " : ""}
                  {Math.round((cat.amount / budget.amount) * 100)}% du budget {euro(budget.amount)}
                </Text>
              )}
            </View>
          );
        })}
      </Card>
    </Animated.View>
  );
}

function TopProducts({ data }: { data: StatsOverview }) {
  if (data.topProducts.length === 0) return null;
  return (
    <Animated.View entering={FadeInDown.duration(400).delay(240)}>
      <SectionTitle>Top produits</SectionTitle>
      <Card className="p-2">
        {data.topProducts.map((p, i) => {
          const meta = category(p.category);
          return (
            <View
              key={`${p.label}-${i}`}
              className="flex-row items-center gap-3 px-2 py-2.5"
              style={i > 0 ? { borderTopWidth: 1, borderTopColor: "#0000000d" } : undefined}>
              <View
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${meta.color}1f` }}>
                <Text className="text-base">{meta.emoji}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-ink text-sm font-medium" numberOfLines={1}>
                  {p.label}
                </Text>
                <Text className="text-muted text-xs mt-0.5">
                  acheté {p.times} fois
                </Text>
              </View>
              <Text className="text-ink text-sm font-bold">{euro(p.amount)}</Text>
            </View>
          );
        })}
      </Card>
    </Animated.View>
  );
}

function TopShops({ data }: { data: StatsOverview }) {
  const c = useColors();
  if (data.topShops.length === 0) return null;
  return (
    <Animated.View entering={FadeInDown.duration(400).delay(320)}>
      <SectionTitle>Top enseignes</SectionTitle>
      <Card className="p-2">
        {data.topShops.map((s, i) => (
          <View
            key={`${s.shop}-${i}`}
            className="flex-row items-center gap-3 px-2 py-2.5"
            style={i > 0 ? { borderTopWidth: 1, borderTopColor: "#0000000d" } : undefined}>
            <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center">
              <Store size={17} color={c.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-ink text-sm font-medium" numberOfLines={1}>
                {s.shop}
              </Text>
              <Text className="text-muted text-xs mt-0.5">
                {s.count} ticket{s.count > 1 ? "s" : ""}
              </Text>
            </View>
            <Text className="text-ink text-sm font-bold">{euro(s.amount)}</Text>
            <ChevronRight size={16} color={c.subtle} />
          </View>
        ))}
      </Card>
    </Animated.View>
  );
}
