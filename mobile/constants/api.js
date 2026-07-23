import Constants from "expo-constants";

// En dev, "localhost" ne fonctionne pas depuis un téléphone physique :
// on déduit l'IP de la machine qui sert le bundle Expo.
const devHost = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";

export const API_URL = __DEV__
  ? `http://${devHost}:8080/api`
  : "https://ticket2stock.vercel.app/api";
