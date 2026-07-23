/**
 * Cache local (AsyncStorage) pour un mode hors-connexion en lecture.
 *
 * Stratégie « réseau d'abord » : on tente la requête, on met le résultat en
 * cache si elle réussit, et en cas d'échec (pas de réseau) on renvoie la
 * dernière version connue. Les clés sont cloisonnées par utilisateur pour
 * éviter toute fuite de données entre comptes sur un même appareil.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuthStore } from "../store/authStore";

const PREFIX = "cache:";

function keyFor(name: string): string {
  const userId = useAuthStore.getState().user?.id ?? "anon";
  return `${PREFIX}${userId}:${name}`;
}

export async function cacheSet<T>(name: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(name), JSON.stringify({ v: value, t: Date.now() }));
  } catch {
    // Le cache est best-effort : on ignore les erreurs d'écriture.
  }
}

export async function cacheGet<T>(name: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(name));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed?.v ?? null) as T | null;
  } catch {
    return null;
  }
}

/**
 * Exécute `fetcher` (réseau). En cas de succès, met en cache et renvoie les
 * données fraîches. En cas d'échec, renvoie le cache s'il existe (fromCache),
 * sinon relaie l'erreur.
 */
export async function fetchWithCache<T>(
  name: string,
  fetcher: () => Promise<T>,
): Promise<{ data: T; fromCache: boolean }> {
  try {
    const data = await fetcher();
    cacheSet(name, data);
    return { data, fromCache: false };
  } catch (error) {
    const cached = await cacheGet<T>(name);
    if (cached != null) return { data: cached, fromCache: true };
    throw error;
  }
}

/** Efface tout le cache local (déconnexion / effacement des données). */
export async function clearCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k) => k.startsWith(PREFIX));
    if (ours.length) await AsyncStorage.multiRemove(ours);
  } catch {
    // best-effort
  }
}
