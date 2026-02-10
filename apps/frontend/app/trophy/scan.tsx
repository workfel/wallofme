import { useState, useRef } from "react";
import {
  StyleSheet,
  Pressable,
  Alert,
  View,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { api } from "@/lib/api";
import i18n from "@/lib/i18n";

type ScanState = "camera" | "preview" | "uploading";

export default function TrophyScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>("camera");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const colorScheme = useColorScheme() ?? "light";
  const tint = Colors[colorScheme].tint;
  const icon = Colors[colorScheme].icon;

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (photo) {
      setPhotoUri(photo.uri);
      setState("preview");
    }
  };

  const pickFromGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setState("preview");
    }
  };

  const retake = () => {
    setPhotoUri(null);
    setState("camera");
  };

  const handleUpload = async () => {
    if (!photoUri) return;

    setUploading(true);
    setState("uploading");

    try {
      // 1. Create trophy
      const createRes = await api.api.trophies.$post({
        json: { type: "medal" },
      });
      if (!createRes.ok) throw new Error("Failed to create trophy");
      const { data: newTrophy } = await createRes.json();

      // 2. Get presigned URL
      const presignRes = await api.api.upload["presigned-url"].$post({
        json: { type: "trophy-photo", contentType: "image/jpeg" },
      });
      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      const { url, key } = await presignRes.json();

      // 3. Upload to R2
      const photoResponse = await fetch(photoUri);
      const blob = await photoResponse.blob();
      const uploadRes = await fetch(url, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": "image/jpeg" },
      });
      if (!uploadRes.ok) throw new Error("Failed to upload image");

      // 4. Confirm upload
      const confirmRes = await api.api.upload.confirm[":id"].$post({
        param: { id: newTrophy.id },
        json: { key },
      });
      if (!confirmRes.ok) throw new Error("Failed to confirm upload");

      // 5. Navigate to review — pass originalImageUri for immediate display
      router.replace(
        `/trophy/review?trophyId=${newTrophy.id}&originalImageUri=${encodeURIComponent(photoUri)}`,
      );
    } catch (e: any) {
      Alert.alert(i18n.t("common.error"), e.message);
      setState("preview");
    } finally {
      setUploading(false);
    }
  };

  // Permission handling
  if (!permission) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.permissionText}>
          {i18n.t("scan.permissionRequired")}
        </ThemedText>
        <Pressable
          style={[styles.button, { backgroundColor: tint }]}
          onPress={requestPermission}
        >
          <ThemedText style={styles.buttonText}>
            {i18n.t("scan.grantPermission")}
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.button, styles.secondaryButton, { borderColor: icon + "4D" }]}
          onPress={pickFromGallery}
        >
          <ThemedText style={styles.secondaryButtonText}>
            {i18n.t("scan.pickFromGallery")}
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  // Uploading state
  if (state === "uploading") {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={tint} />
        <ThemedText style={styles.uploadingText}>
          {i18n.t("scan.uploading")}
        </ThemedText>
      </ThemedView>
    );
  }

  // Preview state
  if (state === "preview" && photoUri) {
    return (
      <ThemedView style={styles.container}>
        <Image source={{ uri: photoUri }} style={styles.preview} />
        <View style={styles.previewActions}>
          <Pressable
            style={[styles.button, styles.secondaryButton, { borderColor: icon + "4D" }]}
            onPress={retake}
          >
            <ThemedText style={styles.secondaryButtonText}>
              {i18n.t("scan.retake")}
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.button,
              { backgroundColor: tint },
              uploading && styles.buttonDisabled,
            ]}
            onPress={handleUpload}
            disabled={uploading}
          >
            <ThemedText style={styles.buttonText}>
              {i18n.t("scan.continue")}
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  // Camera state
  return (
    <View style={styles.cameraContainer}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraActions}>
            <Pressable style={styles.galleryButton} onPress={pickFromGallery}>
              <ThemedText style={styles.galleryButtonText}>
                {i18n.t("scan.gallery")}
              </ThemedText>
            </Pressable>
            <Pressable style={styles.captureButton} onPress={takePhoto}>
              <View style={styles.captureButtonInner} />
            </Pressable>
            <View style={styles.spacer} />
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  cameraActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  galleryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  galleryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  spacer: {
    width: 60,
  },
  preview: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 12,
    marginBottom: 24,
  },
  previewActions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: "600",
    fontSize: 16,
  },
  permissionText: {
    textAlign: "center",
    marginBottom: 20,
  },
  uploadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
});
