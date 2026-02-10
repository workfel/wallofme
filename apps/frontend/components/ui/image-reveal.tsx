import { useState } from "react";
import { StyleSheet, View, Image } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

type ImageRevealProps = {
  originalUri: string;
  processedUri: string | null;
  isProcessing: boolean;
};

export function ImageReveal({
  originalUri,
  processedUri,
  isProcessing,
}: ImageRevealProps) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  return (
    <View
      style={styles.container}
      onLayout={(e) =>
        setLayout({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        })
      }
    >
      {/* Base image (original or processed) */}
      {processedUri ? (
        <Animated.View entering={FadeIn.duration(600)} style={styles.imageFill}>
          <Image
            source={{ uri: processedUri }}
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>
      ) : (
        <Image
          source={{ uri: originalUri }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Shimmer overlay while processing */}
      {isProcessing && layout.width > 0 && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(400)}
          style={styles.shimmerOverlay}
        >
          <ShimmerEffect width={layout.width} />
        </Animated.View>
      )}
    </View>
  );
}

function ShimmerEffect({ width }: { width: number }) {
  const translateX = useSharedValue(-width);

  // Start animation
  translateX.value = withRepeat(
    withTiming(width, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
    -1,
    false,
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.shimmerContainer}>
      <Animated.View style={[styles.shimmerGradient, animatedStyle]}>
        <LinearGradient
          colors={[
            "rgba(255,255,255,0)",
            "rgba(255,255,255,0.3)",
            "rgba(255,255,255,0)",
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ width: width * 0.6, height: "100%" }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  imageFill: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  shimmerGradient: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
  },
});
