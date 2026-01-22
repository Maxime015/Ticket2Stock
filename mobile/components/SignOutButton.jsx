import { Alert, Text, TouchableOpacity } from "react-native";
import styles from "../assets/styles/home.styles"; // Import par défaut
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { useAuthStore } from "../store/authStore"; 

export const SignOutButton = () => {
  const logout = useAuthStore((state) => state.logout);

  const handleSignOut = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive", 
        onPress: () => logout()
      },
    ]);
  };

  return (
    <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
      <Ionicons name="log-out-outline" size={22} color={COLORS.text} />
    </TouchableOpacity>
  );
};