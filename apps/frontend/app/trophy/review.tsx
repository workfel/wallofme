import { useState, useEffect } from "react";
import {
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  View,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { StepIndicator } from "@/components/ui/step-indicator";
import { ImageReveal } from "@/components/ui/image-reveal";
import { ResultCard } from "@/components/ui/result-card";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { api } from "@/lib/api";
import i18n from "@/lib/i18n";

const SPORT_OPTIONS = [
  "running",
  "trail",
  "triathlon",
  "cycling",
  "swimming",
  "obstacle",
  "other",
] as const;

type Sport = (typeof SPORT_OPTIONS)[number];

const STEPS = () => [
  i18n.t("review.step1"),
  i18n.t("review.step2"),
  i18n.t("review.step3"),
  i18n.t("review.step4"),
];

export default function ReviewScreen() {
  const router = useRouter();
  const { trophyId, originalImageUri } = useLocalSearchParams<{
    trophyId: string;
    originalImageUri: string;
  }>();
  const colorScheme = useColorScheme() ?? "light";
  const tint = Colors[colorScheme].tint;
  const icon = Colors[colorScheme].icon;
  const bg = Colors[colorScheme].background;
  const textColor = Colors[colorScheme].text;

  // Current step: 0=processing, 1=form, 2=searching, 3=done
  const [currentStep, setCurrentStep] = useState(0);

  // Image processing
  const [processedImageUri, setProcessedImageUri] = useState<string | null>(
    null,
  );
  const [isProcessingImage, setIsProcessingImage] = useState(true);
  const [statusText, setStatusText] = useState(i18n.t("review.processing"));

  // Form fields
  const [type, setType] = useState<"medal" | "bib">("medal");
  const [raceName, setRaceName] = useState("");
  const [date, setDate] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [sport, setSport] = useState<Sport | null>(null);
  const [distance, setDistance] = useState("");

  // Results
  const [raceResultId, setRaceResultId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<{
    found: boolean;
    time?: string | null;
    ranking?: number | null;
    categoryRanking?: number | null;
    totalParticipants?: number | null;
    source?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Button press animation
  const buttonScale = useSharedValue(1);
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Step 0: Sequential — remove-bg first, then analyze
  useEffect(() => {
    if (!trophyId) return;

    (async () => {
      // 1. Remove background
      try {
        setStatusText(i18n.t("review.removingBg"));
        const res = await api.api.scan["remove-background"].$post({
          json: { trophyId },
        });

        if (res.ok) {
          const { data } = await res.json();
          setProcessedImageUri(data.processedImageUrl);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch {
        // Non-blocking — image just won't have bg removed
      } finally {
        setIsProcessingImage(false);
      }

      // 2. Analyze image (AI OCR)
      try {
        setStatusText(i18n.t("review.analyzing"));
        const res = await api.api.scan.analyze.$post({
          json: { trophyId },
        });

        if (!res.ok) {
          const err = await res.json();
          if (res.status === 422) {
            Alert.alert(
              i18n.t("common.error"),
              i18n.t("review.inappropriateContent"),
            );
            router.back();
            return;
          }
          throw new Error("error" in err ? err.error : "Analysis failed");
        }

        const { data } = await res.json();

        // Pre-fill form
        if (data.imageKind && data.imageKind !== "unknown") {
          setType(data.imageKind);
        }
        if (data.raceName) setRaceName(data.raceName);
        if (data.date) setDate(data.date);
        if (data.city) setCity(data.city);
        if (data.country) setCountry(data.country);
        if (data.sportKind) setSport(data.sportKind);
        if (data.distance) setDistance(data.distance);
      } catch {
        // Non-critical — user can fill form manually
      }

      setCurrentStep(1);
    })();
  }, [trophyId]);

  // Step 2: Validate + search
  const handleGetResults = async () => {
    if (!raceName.trim()) {
      Alert.alert(i18n.t("common.error"), i18n.t("review.raceNameRequired"));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setCurrentStep(2);

    try {
      // Validate — creates race + raceResult
      const validateRes = await api.api.scan.validate.$post({
        json: {
          trophyId: trophyId!,
          type,
          raceName: raceName.trim(),
          date: date || null,
          city: city || null,
          country: country || null,
          sport: sport || null,
          distance: distance || null,
        },
      });

      if (!validateRes.ok) throw new Error("Validation failed");
      const { data: validateData } = await validateRes.json();
      setRaceResultId(validateData.raceResult.id);

      // Search for results
      const searchRes = await api.api.scan["search-results"].$post({
        json: { raceResultId: validateData.raceResult.id },
      });

      if (searchRes.ok) {
        const { data: results } = await searchRes.json();
        setSearchResults(results);
        if (results.found) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }

      setCurrentStep(3);
    } catch (e: any) {
      Alert.alert(i18n.t("common.error"), e.message);
      setCurrentStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(`/trophy/${trophyId}`);
  };

  const handleChipPress = (callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    callback();
  };

  const inputStyle = [
    styles.input,
    {
      borderColor: icon + "4D",
      color: textColor,
      backgroundColor: colorScheme === "dark" ? "#1e2022" : "#f8f9fa",
    },
  ];

  const steps = STEPS();

  // ─── Step 0: Processing ───────────────────────────────
  if (currentStep === 0) {
    return (
      <ScrollView
        style={[styles.scroll, { backgroundColor: bg }]}
        contentContainerStyle={styles.scrollContent}
      >
        <StepIndicator steps={steps} currentStep={0} />

        {originalImageUri && (
          <ImageReveal
            originalUri={originalImageUri}
            processedUri={processedImageUri}
            isProcessing={isProcessingImage}
          />
        )}

        <Animated.View entering={FadeIn.delay(300)} style={styles.statusRow}>
          <ThemedText style={styles.statusText}>{statusText}</ThemedText>
        </Animated.View>
      </ScrollView>
    );
  }

  // ─── Step 2: Searching ────────────────────────────────
  if (currentStep === 2) {
    return (
      <ScrollView
        style={[styles.scroll, { backgroundColor: bg }]}
        contentContainerStyle={styles.centeredContent}
      >
        <StepIndicator steps={steps} currentStep={2} />

        {(processedImageUri || originalImageUri) && (
          <Image
            source={{ uri: processedImageUri ?? originalImageUri }}
            style={styles.thumbnailImage}
            resizeMode="contain"
          />
        )}

        <Animated.View entering={FadeIn} style={styles.statusRow}>
          <PulsingDots tint={tint} />
          <ThemedText style={styles.statusText}>
            {i18n.t("review.searchingResults")}
          </ThemedText>
        </Animated.View>
      </ScrollView>
    );
  }

  // ─── Step 3: Done ─────────────────────────────────────
  if (currentStep === 3) {
    return (
      <ScrollView
        style={[styles.scroll, { backgroundColor: bg }]}
        contentContainerStyle={styles.centeredContent}
      >
        <StepIndicator steps={steps} currentStep={3} />

        <Animated.View entering={FadeInDown.springify().damping(15)}>
          <ThemedText type="title" style={styles.doneTitle}>
            {i18n.t("review.done")}
          </ThemedText>
        </Animated.View>

        {(processedImageUri || originalImageUri) && (
          <Animated.View entering={FadeInDown.delay(100)}>
            <Image
              source={{ uri: processedImageUri ?? originalImageUri }}
              style={styles.thumbnailImage}
              resizeMode="contain"
            />
          </Animated.View>
        )}

        {searchResults?.found ? (
          <ResultCard
            time={searchResults.time}
            ranking={searchResults.ranking}
            categoryRanking={searchResults.categoryRanking}
            totalParticipants={searchResults.totalParticipants}
            source={searchResults.source}
          />
        ) : (
          <Animated.View entering={FadeInDown.delay(200)}>
            <ThemedText style={styles.noResults}>
              {i18n.t("review.noResultsMessage")}
            </ThemedText>
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInDown.delay(400)}
          style={{ width: "100%" }}
        >
          <Pressable
            style={[styles.button, { backgroundColor: tint }]}
            onPress={handleDone}
          >
            <ThemedText style={styles.buttonText}>
              {i18n.t("review.finish")}
            </ThemedText>
          </Pressable>
        </Animated.View>
      </ScrollView>
    );
  }

  // ─── Step 1: Form ─────────────────────────────────────
  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: bg }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <StepIndicator steps={steps} currentStep={1} />

      {/* Thumbnail of processed image */}
      {(processedImageUri || originalImageUri) && (
        <Animated.View entering={FadeIn} style={styles.formImageWrapper}>
          <Image
            source={{ uri: processedImageUri ?? originalImageUri }}
            style={styles.formImage}
            resizeMode="contain"
          />
        </Animated.View>
      )}

      {/* Trophy type */}
      <Animated.View entering={FadeInDown.delay(50)}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {i18n.t("review.trophyType")}
        </ThemedText>
        <View style={styles.chipRow}>
          {(["medal", "bib"] as const).map((t, idx) => (
            <Animated.View key={t} entering={FadeInRight.delay(100 * idx)}>
              <Pressable
                style={[
                  styles.chip,
                  { borderColor: icon + "4D" },
                  type === t && { backgroundColor: tint, borderColor: tint },
                ]}
                onPress={() => handleChipPress(() => setType(t))}
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    type === t && styles.chipTextActive,
                  ]}
                >
                  {i18n.t(`trophies.${t}`)}
                </ThemedText>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* Race info */}
      <Animated.View entering={FadeInDown.delay(150)}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {i18n.t("review.raceInfo")}
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200)}>
        <TextInput
          style={inputStyle}
          placeholder={i18n.t("review.raceName")}
          value={raceName}
          onChangeText={setRaceName}
          placeholderTextColor={icon}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(250)}>
        <TextInput
          style={inputStyle}
          placeholder={i18n.t("review.date")}
          value={date}
          onChangeText={setDate}
          placeholderTextColor={icon}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300)}>
        <View style={styles.row}>
          <TextInput
            style={[...inputStyle, styles.halfInput]}
            placeholder={i18n.t("review.city")}
            value={city}
            onChangeText={setCity}
            placeholderTextColor={icon}
          />
          <TextInput
            style={[...inputStyle, styles.halfInput]}
            placeholder={i18n.t("review.country")}
            value={country}
            onChangeText={setCountry}
            autoCapitalize="characters"
            maxLength={2}
            placeholderTextColor={icon}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(350)}>
        <TextInput
          style={inputStyle}
          placeholder={i18n.t("review.distance")}
          value={distance}
          onChangeText={setDistance}
          placeholderTextColor={icon}
        />
      </Animated.View>

      {/* Sport */}
      <Animated.View entering={FadeInDown.delay(400)}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {i18n.t("review.sport")}
        </ThemedText>
        <View style={styles.chipRow}>
          {SPORT_OPTIONS.map((s, idx) => (
            <Animated.View key={s} entering={FadeInRight.delay(50 * idx)}>
              <Pressable
                style={[
                  styles.chip,
                  { borderColor: icon + "4D" },
                  sport === s && { backgroundColor: tint, borderColor: tint },
                ]}
                onPress={() =>
                  handleChipPress(() => setSport(sport === s ? null : s))
                }
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    sport === s && styles.chipTextActive,
                  ]}
                >
                  {i18n.t(`sports.${s}`)}
                </ThemedText>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* Submit button */}
      <Animated.View entering={FadeInDown.delay(500)}>
        <Pressable
          onPressIn={() => {
            buttonScale.value = withSpring(0.96);
          }}
          onPressOut={() => {
            buttonScale.value = withSpring(1);
          }}
          onPress={handleGetResults}
          disabled={loading}
        >
          <Animated.View
            style={[
              styles.button,
              { backgroundColor: tint },
              loading && styles.buttonDisabled,
              buttonAnimatedStyle,
            ]}
          >
            <ThemedText style={styles.buttonText}>
              {i18n.t("review.getMyResults")}
            </ThemedText>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

// Pulsating dots animation for searching state
function PulsingDots({ tint }: { tint: string }) {
  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2].map((i) => (
        <PulsingDot key={i} delay={i * 200} tint={tint} />
      ))}
    </View>
  );
}

function PulsingDot({ delay, tint }: { delay: number; tint: string }) {
  const scale = useSharedValue(0.6);

  useEffect(() => {
    const pulse = () => {
      scale.value = withSpring(1, { damping: 4, stiffness: 80 }, () => {
        scale.value = withSpring(0.6, { damping: 4, stiffness: 80 });
      });
    };
    const timeout = setTimeout(pulse, delay);
    const interval = setInterval(pulse, 1200);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: tint }, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  centeredContent: {
    padding: 24,
    paddingBottom: 48,
    alignItems: "center",
  },
  statusRow: {
    alignItems: "center",
    marginTop: 24,
    gap: 12,
  },
  statusText: {
    opacity: 0.6,
    fontSize: 15,
  },
  formImageWrapper: {
    alignItems: "center",
    marginBottom: 16,
  },
  formImage: {
    width: 120,
    height: 160,
    borderRadius: 12,
  },
  thumbnailImage: {
    width: 140,
    height: 186,
    borderRadius: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
  },
  chipTextActive: {
    color: "#fff",
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  doneTitle: {
    marginBottom: 24,
    textAlign: "center",
  },
  noResults: {
    opacity: 0.6,
    marginBottom: 24,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
