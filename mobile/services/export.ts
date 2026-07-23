import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { API_URL } from "../constants/api";
import { useAuthStore } from "../store/authStore";

/**
 * Récupère le CSV des dépenses depuis le backend (réponse texte, pas JSON —
 * on n'utilise donc pas apiFetch), l'écrit dans le cache, puis ouvre la
 * feuille de partage native (Fichiers, Mail, AirDrop…).
 */
export async function exportExpensesCsv(): Promise<void> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_URL}/stats/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (response.status === 401) {
    useAuthStore.getState().logout();
    throw new Error("Session expirée, reconnectez-vous.");
  }
  if (!response.ok) {
    throw new Error("Export impossible pour le moment.");
  }

  const csv = await response.text();
  const stamp = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `depenses-${stamp}.csv`);
  file.create({ overwrite: true });
  file.write(csv);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Le partage n'est pas disponible sur cet appareil.");
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    dialogTitle: "Exporter mes dépenses",
    UTI: "public.comma-separated-values-text",
  });
}
