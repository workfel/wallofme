import React from "react";
import { Canvas } from "@react-three/fiber";
import type { ViewProps } from "react-native";

interface FiberCanvasProps {
  children: React.ReactNode;
  style?: ViewProps["style"];
  orthographic?: boolean;
  room?: any; // used by native only, ignored on web
}

export const FiberCanvas = ({
  children,
  style,
  orthographic = false,
}: FiberCanvasProps) => {
  return (
    <Canvas
      style={style as React.CSSProperties}
      orthographic={orthographic}
      camera={
        orthographic
          ? { zoom: 50, position: [5, 5, 5] as [number, number, number] }
          : undefined
      }
    >
      {children}
    </Canvas>
  );
};
