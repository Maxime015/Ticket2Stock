import React from "react";
import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";
import { SignOutButton } from "@/components/SignOutButton";

import styles from "../../assets/styles/home.styles";
import { uploadTicketToAPI } from "../../services/uploadTicket";

export default function TicketsScreen() {
  const scanTicketWithCamera = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission requise", "Accès à la caméra refusé");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        const ocrResult = await uploadTicketToAPI(imageUri);
        console.log("OCR RESULT (camera):", ocrResult);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de scanner le ticket");
    }
  };

  const importTicketFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission requise", "Accès à la galerie refusé");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        const ocrResult = await uploadTicketToAPI(imageUri);
        console.log("OCR RESULT (gallery):", ocrResult);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible d'importer le ticket");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <Image
          source={require("../../assets/images/ticket-header.jpeg")}
          style={styles.headerImage}
        />

        <View style={styles.content}>
          {/* --- MODIFICATION ICI : Header Row --- */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Tickets 👋</Text>
            <SignOutButton />
          </View>
          {/* ----------------------------------- */}

          <Text style={styles.subtitle}>Scan de tickets</Text>

          <TouchableOpacity
            style={styles.scanButton}
            onPress={scanTicketWithCamera}
          >
            <Ionicons name="camera-outline" size={20} color="#fff" />
            <Text style={styles.scanButtonText}>
              Scanner un nouveau ticket
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.importButton}
            onPress={importTicketFromGallery}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={18}
              color="#6C47FF"
            />
            <Text style={styles.importText}>Importer un ticket</Text>
          </TouchableOpacity>

          <View style={styles.history}>
            <Text style={styles.historyTitle}>Historique</Text>
            <Text style={styles.historySubtitle}>
              Tickets enregistrés
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}