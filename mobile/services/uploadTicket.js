// services/uploadTicket.js
import { API_URL } from "../constants/api";

export const uploadTicketToAPI = async (imageUri) => {
  // Convertir l'image en base64
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const base64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });

  console.log(base64)

  const apiResponse = await fetch(`${API_URL}/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      base64String: base64,
    }),
  });

  if (!apiResponse.ok) {
    const errorText = await apiResponse.text();
    console.error("API ERROR:", errorText);
    throw new Error("Erreur OCR : " + errorText);
  }

  return await apiResponse.json();
};