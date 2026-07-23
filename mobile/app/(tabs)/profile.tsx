import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import {
  Bell,
  ChevronRight,
  Database,
  Download,
  Info,
  LogOut,
  Moon,
  ScanLine,
  Trash2,
  UserCircle2,
} from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { PressableScale } from "../../components/ui/PressableScale";
import { Screen } from "../../components/ui/Screen";
import { clearCache } from "../../lib/cache";
import { ensureNotificationPermissions } from "../../lib/notifications";
import { cardShadow, useColors } from "../../lib/theme";
import { clearAllData, deleteAccount } from "../../services/account";
import { exportExpensesCsv } from "../../services/export";
import { useAuthStore } from "../../store/authStore";

function memberSince(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export default function ProfileScreen() {
  const c = useColors();
  const { user, logout } = useAuthStore();
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", style: "destructive", onPress: () => logout() },
    ]);
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportExpensesCsv();
    } catch (error: any) {
      Alert.alert("Export", error.message ?? "Export impossible.");
    } finally {
      setExporting(false);
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await ensureNotificationPermissions();
    Alert.alert(
      "Notifications",
      granted
        ? "Vous serez alerté avant la péremption de vos produits et au dépassement de vos budgets."
        : "Les notifications sont désactivées. Activez-les dans les réglages de votre téléphone pour recevoir les alertes.",
    );
  };

  const doClearData = async () => {
    setClearing(true);
    try {
      await clearAllData();
      await clearCache(); // vide aussi le cache hors-connexion
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Données effacées", "Vos tickets, stock, courses et budgets ont été supprimés.");
    } catch (error: any) {
      Alert.alert("Erreur", error.message ?? "Effacement impossible.");
    } finally {
      setClearing(false);
    }
  };

  const handleClearData = () => {
    if (clearing) return;
    // Double confirmation : action destructive et irréversible
    Alert.alert(
      "Effacer toutes les données",
      "Vos tickets, votre stock, votre liste de courses et vos budgets seront définitivement supprimés. Votre compte est conservé.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Tout effacer",
          style: "destructive",
          onPress: () =>
            Alert.alert("Êtes-vous sûr ?", "Cette action est irréversible.", [
              { text: "Annuler", style: "cancel" },
              { text: "Oui, tout effacer", style: "destructive", onPress: doClearData },
            ]),
        },
      ],
    );
  };

  const doDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await deleteAccount(); // supprime le compte + données en cascade côté serveur
      await clearCache(); // vide aussi le cache hors-connexion
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await logout(); // efface le token/session → renvoie vers l'écran de connexion
    } catch (error: any) {
      setDeletingAccount(false); // on reste sur l'écran seulement en cas d'échec
      Alert.alert("Erreur", error.message ?? "Suppression du compte impossible.");
    }
  };

  const handleDeleteAccount = () => {
    if (deletingAccount) return;
    // Double confirmation : suppression définitive et irréversible du compte
    Alert.alert(
      "Supprimer mon compte",
      "Votre compte et TOUTES vos données (tickets, stock, courses, budgets) seront définitivement supprimés. Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Êtes-vous sûr ?",
              "Cette action est définitive : votre compte ne pourra pas être récupéré.",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Oui, supprimer mon compte",
                  style: "destructive",
                  onPress: doDeleteAccount,
                },
              ],
            ),
        },
      ],
    );
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>
        <Text className="text-ink text-xl font-extrabold mb-5">Profil</Text>

        {/* Carte profil */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={cardShadow}
          className="bg-surface/90 border border-border rounded-3xl p-5">
          {/* Illustration à droite */}
          <Image
            source={require("../../assets/images/food.png")}
            style={{ position: "absolute", right: 4, top: 8, bottom: 8, width: 108 }}
            contentFit="contain"
          />
          <View className="flex-row items-center gap-4">
            <View className="w-16 h-16 rounded-full bg-primary/15 items-center justify-center overflow-hidden">
              {user?.profileImage ? (
                <Image
                  source={{ uri: user.profileImage }}
                  style={{ width: 64, height: 64 }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <UserCircle2 size={40} color={c.primary} />
              )}
            </View>
            <View className="flex-1" style={{ paddingRight: 84 }}>
              <Text className="text-ink text-xl font-extrabold" numberOfLines={1}>
                {user?.username || "Utilisateur"}
              </Text>
              <Text className="text-muted text-sm" numberOfLines={1}>
                {user?.email}
              </Text>
              {user?.createdAt && (
                <View className="self-start bg-primary/15 rounded-full px-3 py-1 mt-1.5">
                  <Text className="text-primary text-xs font-semibold">
                    Membre depuis {memberSince(user.createdAt)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Données & alertes */}
        <Text className="text-ink text-lg font-bold mt-7 mb-3">Données & alertes</Text>
        <Animated.View
          entering={FadeInDown.duration(400).delay(80)}
          className="bg-surface/90 border border-border rounded-2xl overflow-hidden">
          <InfoRow
            icon={
              exporting ? (
                <ActivityIndicator size="small" color={c.success} />
              ) : (
                <Download size={18} color={c.success} />
              )
            }
            label="Exporter mes dépenses"
            value={exporting ? "Préparation…" : "CSV"}
            onPress={handleExport}
          />
          <InfoRow
            icon={<Bell size={18} color={c.warning} />}
            label="Alertes budget & péremption"
            value="Notifications"
            onPress={handleEnableNotifications}
          />
          <InfoRow
            icon={
              clearing ? (
                <ActivityIndicator size="small" color={c.danger} />
              ) : (
                <Trash2 size={18} color={c.danger} />
              )
            }
            label="Effacer toutes les données"
            value=""
            danger
            onPress={handleClearData}
            last
          />
        </Animated.View>

        {/* À propos */}
        <Text className="text-ink text-lg font-bold mt-7 mb-3">À propos</Text>
        <Animated.View
          entering={FadeInDown.duration(400).delay(120)}
          className="bg-surface/90 border border-border rounded-2xl overflow-hidden">
          <InfoRow
            icon={<ScanLine size={18} color={c.primary} />}
            label="Scan de tickets"
            value="Gemini + OCR.space"
          />
          <InfoRow
            icon={<Database size={18} color={c.info} />}
            label="Données"
            value="Synchronisées dans le cloud"
          />
          <InfoRow
            icon={<Moon size={18} color={c.pink} />}
            label="Apparence"
            value="Automatique"
            onPress={() =>
              Alert.alert(
                "Apparence",
                "Le thème clair ou sombre suit automatiquement le réglage de votre téléphone.",
              )
            }
          />
          <InfoRow
            icon={<Info size={18} color={c.muted} />}
            label="Version"
            value="1.0.0"
            last
          />
        </Animated.View>

        {/* Déconnexion */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} className="mt-6">
          <PressableScale onPress={handleLogout} scaleTo={0.98}>
            <View className="flex-row items-center justify-center gap-2 rounded-2xl bg-danger/10 border border-danger/20 py-4">
              <LogOut size={20} color={c.danger} />
              <Text className="text-danger font-semibold text-base">Se déconnecter</Text>
            </View>
          </PressableScale>
        </Animated.View>

        {/* Suppression définitive du compte */}
        <Animated.View entering={FadeInDown.duration(400).delay(240)} className="mt-4">
          <PressableScale onPress={handleDeleteAccount} scaleTo={0.98}>
            <View className="flex-row items-center justify-center gap-2 rounded-2xl bg-danger py-4">
              {deletingAccount ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Trash2 size={20} color="#ffffff" />
              )}
              <Text className="text-white font-semibold text-base">
                {deletingAccount ? "Suppression…" : "Supprimer mon compte"}
              </Text>
            </View>
          </PressableScale>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

function InfoRow({
  icon,
  label,
  value,
  onPress,
  last,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
  last?: boolean;
  danger?: boolean;
}) {
  const c = useColors();
  const body = (
    <View
      className={`flex-row items-center gap-3 px-4 py-4 ${last ? "" : "border-b border-border/60"}`}>
      <View
        className="w-9 h-9 rounded-xl items-center justify-center"
        style={{ backgroundColor: danger ? `${c.danger}14` : c.surface2 }}>
        {icon}
      </View>
      <Text className={`flex-1 ${danger ? "text-danger font-semibold" : "text-muted"}`}>
        {label}
      </Text>
      {value ? (
        <Text className="text-ink font-medium max-w-[52%] text-right" numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {onPress ? (
        <ChevronRight size={18} color={danger ? c.danger : c.subtle} />
      ) : null}
    </View>
  );
  return onPress ? (
    <PressableScale onPress={onPress} scaleTo={0.99} haptic={false}>
      {body}
    </PressableScale>
  ) : (
    body
  );
}
