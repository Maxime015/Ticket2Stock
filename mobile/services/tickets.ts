import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

import { apiFetch } from "../lib/client";

export type ReceiptArticle = {
  label: string;
  normalized_label?: string;
  quantity: number;
  unit: string;
  unit_price: number | null;
  total_price: number | null;
  category?: string;
};

export type ScanResult = {
  shop: { name: string; date: string | null; nb_articles: number };
  articles: ReceiptArticle[];
  totals: { total: number | null; total_ht: number | null; total_tva: number | null };
  ocr_engine: string;
};

export type TicketSummary = {
  id: string;
  shopName: string;
  purchaseDate: string | null;
  total: number | null;
  nbArticles: number | null;
  itemsCount: number;
  createdAt: string;
};

export type TicketDetail = TicketSummary & {
  totalHt: number | null;
  totalTva: number | null;
  items: {
    id: string;
    label: string;
    quantity: number;
    unitPrice: number | null;
    totalPrice: number | null;
    category?: string;
  }[];
};

/**
 * Redimensionne et compresse la photo (OCR.space limite à 1 Mo) puis
 * lance l'analyse OCR côté serveur. 1400 px de large suffisent largement
 * pour lire un ticket.
 */
export async function scanTicket(imageUri: string): Promise<ScanResult> {
  const context = ImageManipulator.manipulate(imageUri).resize({ width: 1400 });
  const image = await context.renderAsync();
  const result = await image.saveAsync({
    compress: 0.7,
    format: SaveFormat.JPEG,
    base64: true,
  });

  if (!result.base64) throw new Error("Lecture de l'image impossible.");

  return apiFetch<ScanResult>("/tickets/scan", {
    method: "POST",
    body: { base64String: result.base64 },
  });
}

export function saveTicket(scan: ScanResult) {
  return apiFetch<{ message: string; ticketId: string }>("/tickets", {
    method: "POST",
    body: scan,
  });
}

export function listTickets() {
  return apiFetch<{ tickets: TicketSummary[] }>("/tickets");
}

export function getTicket(id: string) {
  return apiFetch<TicketDetail>(`/tickets/${id}`);
}

export function deleteTicket(id: string) {
  return apiFetch<{ message: string }>(`/tickets/${id}`, { method: "DELETE" });
}
