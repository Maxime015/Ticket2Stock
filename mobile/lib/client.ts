import { API_URL } from "../constants/api";
import { useAuthStore } from "../store/authStore";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Client HTTP central : ajoute le token JWT, sérialise le JSON et
 * transforme les réponses d'erreur du backend en ApiError.
 */
export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = useAuthStore.getState().token;

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // réponse vide ou non-JSON
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Token expiré : on déconnecte pour renvoyer vers l'écran de login
      useAuthStore.getState().logout();
    }
    throw new ApiError(data?.message ?? "Une erreur est survenue.", response.status);
  }

  return data as T;
}
