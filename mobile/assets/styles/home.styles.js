import { StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors"; 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  headerImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },

  content: {
    padding: 20,
    marginTop: -20, // Optionnel: pour faire remonter légèrement le contenu sur l'image
  },

  // --- NOUVEAU : Conteneur pour aligner Titre et Bouton ---
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between", // Pousse les éléments aux extrémités
    alignItems: "center",            // Centre verticalement
    marginBottom: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textPrimary,
    // marginBottom retiré ici car géré par headerRow
  },
  // -------------------------------------------------------

  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: COLORS.text,
  },

  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 30,
    justifyContent: "center",
    marginBottom: 15,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  scanButtonText: {
    color: COLORS.white,
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "600",
  },

  importButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 30,
    paddingVertical: 15,
    justifyContent: "center",
    marginBottom: 25,
  },

  importText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "600",
    color: COLORS.primary,
  },

  history: {
    marginTop: 10,
  },

  historyTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 5,
    color: COLORS.textPrimary,
  },

  historySubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
  },

  // Amélioration visuelle du bouton logout
  logoutButton: {
    padding: 10,
    borderRadius: 50, // Rend le bouton parfaitement rond si carré
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: "#E0E0E0", // Bordure subtile
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    top: 10,
  },
  
});

export default styles;