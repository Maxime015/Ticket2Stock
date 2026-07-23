/**
 * Notifications locales : alertes de péremption (programmées) et de budget
 * (immédiates au chargement des stats). Aucune infra de push distant n'est
 * nécessaire — ces alertes découlent de données déjà présentes côté client.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { StockItem } from "../services/stock";
import type { StatsOverview } from "../services/stats";

// Bannière visible même app au premier plan, sans son ni pastille.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let permissionChecked = false;
let permissionGranted = false;

/** Demande la permission une seule fois par session ; mémorise le résultat. */
export async function ensureNotificationPermissions(): Promise<boolean> {
  if (permissionChecked) return permissionGranted;
  permissionChecked = true;

  const current = await Notifications.getPermissionsAsync();
  permissionGranted = current.granted;
  if (!permissionGranted && current.canAskAgain) {
    const asked = await Notifications.requestPermissionsAsync();
    permissionGranted = asked.granted;
  }

  if (permissionGranted && Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Alertes Ticket2Stock",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return permissionGranted;
}

/**
 * Reprogramme les rappels de péremption : un rappel 2 jours avant (9 h) et un
 * le jour même (9 h) pour chaque article daté. On efface d'abord les anciens
 * rappels de type "expiry" pour refléter l'état courant du stock.
 */
export async function syncExpiryReminders(items: StockItem[]): Promise<void> {
  if (!(await ensureNotificationPermissions())) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => (n.content.data as any)?.type === "expiry")
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  const now = Date.now();
  for (const item of items) {
    if (!item.expiryDate) continue;
    const dueDay = new Date(`${item.expiryDate}T09:00:00`);
    const twoDaysBefore = new Date(dueDay);
    twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);

    const targets: { when: Date; sameDay: boolean }[] = [
      { when: twoDaysBefore, sameDay: false },
      { when: dueDay, sameDay: true },
    ];
    for (const { when, sameDay } of targets) {
      if (when.getTime() <= now) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏰ Produit à consommer",
          body: sameDay
            ? `${item.label} périme aujourd'hui.`
            : `${item.label} périme dans 2 jours.`,
          data: { type: "expiry", id: item.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
        },
      });
    }
  }
}

/**
 * Vérifie les budgets du mois et notifie au franchissement de 90 % puis 100 %.
 * Chaque seuil n'est notifié qu'une fois par mois et par budget (mémorisé
 * dans AsyncStorage) pour éviter le spam à chaque ouverture de l'écran.
 */
export async function checkBudgetAlerts(overview: StatsOverview): Promise<void> {
  const checks: { key: string; label: string; ratio: number }[] = [];
  if (overview.budgets.global && overview.budgets.global.amount > 0) {
    checks.push({
      key: "global",
      label: "budget global",
      ratio: overview.monthTotal / overview.budgets.global.amount,
    });
  }
  for (const b of overview.budgets.categories) {
    if (b.amount > 0) {
      checks.push({ key: b.category, label: `budget ${b.label}`, ratio: b.spent / b.amount });
    }
  }

  const alerts = checks
    .map((c) => ({ ...c, threshold: c.ratio >= 1 ? 100 : c.ratio >= 0.9 ? 90 : 0 }))
    .filter((c) => c.threshold > 0);
  if (alerts.length === 0) return;

  if (!(await ensureNotificationPermissions())) return;

  for (const alert of alerts) {
    const storeKey = `budgetAlert:${overview.month}:${alert.key}:${alert.threshold}`;
    if (await AsyncStorage.getItem(storeKey)) continue;
    await AsyncStorage.setItem(storeKey, "1");
    await Notifications.scheduleNotificationAsync({
      content: {
        title: alert.threshold >= 100 ? "🔴 Budget dépassé" : "🟠 Budget bientôt atteint",
        body: `Votre ${alert.label} est à ${Math.round(alert.ratio * 100)} % ce mois-ci.`,
        data: { type: "budget", key: alert.key },
      },
      trigger: null, // immédiate
    });
  }
}
