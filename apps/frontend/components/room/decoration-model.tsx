import * as THREE from "three";
import { useRef, useEffect, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface DecorationModelProps {
  modelUrl: string;
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
}

export function DecorationModel({
  modelUrl,
  position,
  rotationY = 0,
  scale = 0.5,
}: DecorationModelProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const [scene, setScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    if (!modelUrl) return;
    const loader = new GLTFLoader();
    loader.load(modelUrl, (gltf) => {
      setScene(gltf.scene);
    });
  }, [modelUrl]);

  if (!scene) return null;

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      <primitive object={scene.clone()} scale={scale} />
    </group>
  );
}
