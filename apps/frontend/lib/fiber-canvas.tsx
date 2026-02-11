import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import type { ViewProps } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

import * as THREE from "three";
import { GLView } from "expo-gl";

type Trophy = {
  id: string;
  type: "medal" | "bib";
  textureUrl: string | null;
  thumbnailUrl: string | null;
};

type RoomItem = {
  id: string;
  trophyId: string | null;
  decorationId: string | null;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationY: number;
  wall: "left" | "right" | null;
  trophy?: Trophy | null;
  decoration?: { id: string; name: string; modelUrl: string | null } | null;
};

type RoomData = {
  id: string;
  userId: string;
  themeId: string | null;
  floor: string | null;
  items: RoomItem[];
};

interface FiberCanvasProps {
  children?: React.ReactNode;
  style?: ViewProps["style"];
  orthographic?: boolean;
  room?: RoomData | null;
}

const ROOM_WIDTH = 6;
const ROOM_DEPTH = 6;
const ROOM_HEIGHT = 3;
const WALL_THICKNESS = 0.15;

const ORBIT_TARGET = new THREE.Vector3(0, 1, 0);
const MIN_PHI = 0.3;
const MAX_PHI = Math.PI / 2.2;
const MIN_RADIUS = 4;
const MAX_RADIUS = 15;
const PAN_SENSITIVITY = 0.005;

/**
 * Native FiberCanvas — expo-gl + imperative Three.js.
 * Renders on demand (no rAF loop) because expo-gl buffer swap
 * is not compatible with continuous requestAnimationFrame.
 */
export const FiberCanvas = ({
  style,
  orthographic = false,
  room,
}: FiberCanvasProps) => {
  const [error, setError] = useState<string | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const glRef = useRef<any>(null);
  const trophyGroupRef = useRef<THREE.Group | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dirtyRef = useRef(false);

  // Spherical orbit state
  const thetaRef = useRef(0);
  const phiRef = useRef(0);
  const radiusRef = useRef(0);
  const gestureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Update camera position from spherical coords (no render — just set dirty) */
  const updateCameraFromSpherical = useCallback(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    const theta = thetaRef.current;
    const phi = phiRef.current;
    const radius = radiusRef.current;
    camera.position.set(
      ORBIT_TARGET.x + radius * Math.sin(phi) * Math.sin(theta),
      ORBIT_TARGET.y + radius * Math.cos(phi),
      ORBIT_TARGET.z + radius * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(ORBIT_TARGET);
    dirtyRef.current = true;
  }, []);

  /** Start a fast render loop (~30fps) while a gesture is active */
  const startGestureLoop = useCallback(() => {
    if (gestureIntervalRef.current) return;
    gestureIntervalRef.current = setInterval(() => {
      if (!dirtyRef.current) return;
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const gl = glRef.current;
      if (!renderer || !scene || !camera || !gl) return;
      renderer.render(scene, camera);
      gl.endFrameEXP();
      dirtyRef.current = false;
    }, 33);
  }, []);

  /** Stop the fast render loop, go back to idle keep-alive */
  const stopGestureLoop = useCallback(() => {
    if (gestureIntervalRef.current) {
      clearInterval(gestureIntervalRef.current);
      gestureIntervalRef.current = null;
    }
    // One final render to make sure last position is flushed
    dirtyRef.current = true;
  }, []);

  // Re-render when room items change
  useEffect(() => {
    if (!sceneRef.current || !trophyGroupRef.current || !room) return;
    rebuildTrophies(trophyGroupRef.current, room.items);
    dirtyRef.current = true;
  }, [room?.items]);

  const onContextCreate = useCallback(
    (gl: any) => {
      try {
        glRef.current = gl;
        const width = gl.drawingBufferWidth || 300;
        const height = gl.drawingBufferHeight || 300;

        // Renderer
        const canvas = createCanvasShim(width, height);
        const renderer = new THREE.WebGLRenderer({
          canvas: canvas as any,
          context: gl as any,
          antialias: false,
        });
        renderer.setSize(width, height, false);
        rendererRef.current = renderer;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0ead6);
        sceneRef.current = scene;

        // Camera
        const camera = createCamera(orthographic, width / height);
        cameraRef.current = camera;

        // Compute initial spherical coords from camera position
        const dx = camera.position.x - ORBIT_TARGET.x;
        const dy = camera.position.y - ORBIT_TARGET.y;
        const dz = camera.position.z - ORBIT_TARGET.z;
        const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
        radiusRef.current = r;
        phiRef.current = Math.acos(Math.min(1, Math.max(-1, dy / r)));
        thetaRef.current = Math.atan2(dx, dz);

        // Diorama shell + test cube
        buildDioramaShell(scene);

        // Trophy group
        const trophyGroup = new THREE.Group();
        scene.add(trophyGroup);
        trophyGroupRef.current = trophyGroup;
        if (room) {
          rebuildTrophies(trophyGroup, room.items);
        }

        // Initial render
        renderer.render(scene, camera);
        gl.endFrameEXP();

        // Keep-alive loop — expo-gl invalidates the context if endFrameEXP
        // is not called regularly. Use setInterval (~4fps) instead of
        // requestAnimationFrame (60fps) which crashes the Metal backend.
        keepAliveRef.current = setInterval(() => {
          try {
            if (dirtyRef.current) {
              renderer.render(scene, camera);
              dirtyRef.current = false;
            }
            gl.endFrameEXP();
          } catch {
            // context lost — stop the loop
            if (keepAliveRef.current) clearInterval(keepAliveRef.current);
          }
        }, 250);
      } catch (e: any) {
        console.error("[FiberCanvas]", e);
        setError(e?.message ?? "GL setup failed");
      }
    },
    [orthographic, room]
  );

  useEffect(() => {
    return () => {
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
      if (gestureIntervalRef.current) clearInterval(gestureIntervalRef.current);
      rendererRef.current?.dispose();
    };
  }, []);

  // Gesture: pan to orbit
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(1)
        .onStart(() => startGestureLoop())
        .onChange((e) => {
          thetaRef.current -= e.changeX * PAN_SENSITIVITY;
          phiRef.current = Math.max(
            MIN_PHI,
            Math.min(MAX_PHI, phiRef.current + e.changeY * PAN_SENSITIVITY)
          );
          updateCameraFromSpherical();
        })
        .onEnd(() => stopGestureLoop())
        .onFinalize(() => stopGestureLoop()),
    [updateCameraFromSpherical, startGestureLoop, stopGestureLoop]
  );

  // Gesture: pinch to zoom
  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .runOnJS(true)
        .onStart(() => startGestureLoop())
        .onChange((e) => {
          radiusRef.current = Math.max(
            MIN_RADIUS,
            Math.min(MAX_RADIUS, radiusRef.current / e.scaleChange)
          );
          updateCameraFromSpherical();
        })
        .onEnd(() => stopGestureLoop())
        .onFinalize(() => stopGestureLoop()),
    [updateCameraFromSpherical, startGestureLoop, stopGestureLoop]
  );

  const composedGesture = useMemo(
    () => Gesture.Simultaneous(panGesture, pinchGesture),
    [panGesture, pinchGesture]
  );

  if (error) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackTitle}>3D Error</Text>
        <Text style={styles.fallbackSub}>{error}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={[{ flex: 1 }, style]}>
      <GestureDetector gesture={composedGesture}>
        <View style={{ flex: 1 }}>
          <GLView
            style={StyleSheet.absoluteFill}
            onContextCreate={onContextCreate}
          />
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createCanvasShim(width: number, height: number) {
  let _w = width;
  let _h = height;
  return {
    get width() { return _w; },
    set width(v: number) { _w = v; },
    get height() { return _h; },
    set height(v: number) { _h = v; },
    get clientWidth() { return _w; },
    get clientHeight() { return _h; },
    style: {} as Record<string, any>,
    addEventListener: () => {},
    removeEventListener: () => {},
    getContext: () => null,
    toDataURL: () => "",
    captureStream: () => null,
  };
}

function createCamera(orthographic: boolean, aspect: number): THREE.Camera {
  if (orthographic) {
    const frustum = 12;
    const cam = new THREE.OrthographicCamera(
      (-frustum * aspect) / 2,
      (frustum * aspect) / 2,
      frustum / 2,
      -frustum / 2,
      0.1,
      1000
    );
    cam.position.set(5, 5, 5);
    cam.lookAt(ORBIT_TARGET);
    return cam;
  }
  const cam = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
  cam.position.set(6, 5, 6);
  cam.lookAt(ORBIT_TARGET);
  return cam;
}

function buildDioramaShell(scene: THREE.Scene) {
  // Floor
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM_WIDTH, WALL_THICKNESS, ROOM_DEPTH),
    new THREE.MeshBasicMaterial({ color: 0xc9a87c })
  );
  floor.position.set(0, -WALL_THICKNESS / 2, 0);
  scene.add(floor);

  // Left wall
  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(WALL_THICKNESS, ROOM_HEIGHT, ROOM_DEPTH),
    new THREE.MeshBasicMaterial({ color: 0xfaedcd })
  );
  leftWall.position.set(-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0);
  scene.add(leftWall);

  // Back wall
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS),
    new THREE.MeshBasicMaterial({ color: 0xfefae0 })
  );
  backWall.position.set(0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2);
  scene.add(backWall);

  // TEST CUBE — bright red, sitting on the floor center
  const testCube = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.8, 0.8),
    new THREE.MeshBasicMaterial({ color: 0xff3333 })
  );
  testCube.position.set(0, 0.4, 0);
  scene.add(testCube);
}

function rebuildTrophies(group: THREE.Group, items: RoomItem[]) {
  while (group.children.length) {
    const child = group.children[0];
    group.remove(child);
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (child.material instanceof THREE.Material) child.material.dispose();
    }
  }

  const trophyItems = items.filter((i) => i.trophyId && i.trophy?.textureUrl);
  const offset = WALL_THICKNESS / 2 + 0.02;
  const FRAME_HEIGHT = 0.8;

  for (const item of trophyItems) {
    const aspect = item.trophy!.type === "bib" ? 1.3 : 1;
    const frameW = FRAME_HEIGHT * aspect;
    const y = item.positionY || 1.5;

    let position: [number, number, number];
    let rotation: [number, number, number];

    if (item.wall === "left") {
      position = [-ROOM_WIDTH / 2 + offset, y, item.positionZ || 0];
      rotation = [0, Math.PI / 2, 0];
    } else {
      position = [item.positionX || 0, y, -ROOM_DEPTH / 2 + offset];
      rotation = [0, 0, 0];
    }

    const geo = new THREE.PlaneGeometry(frameW, FRAME_HEIGHT);
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      color: 0xcccccc,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    group.add(mesh);

    const loader = new THREE.TextureLoader();
    loader.load(
      item.trophy!.textureUrl!,
      (tex) => {
        mat.map = tex;
        mat.needsUpdate = true;
      },
      undefined,
      (err) => console.warn("[FiberCanvas] texture fail:", err)
    );
  }
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  fallbackTitle: {
    fontWeight: "600",
    color: "#888",
    fontSize: 16,
  },
  fallbackSub: {
    marginTop: 8,
    color: "#888",
    opacity: 0.6,
    textAlign: "center",
    fontSize: 12,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
});
