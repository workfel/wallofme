import * as THREE from "three";
import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";

// Trophy aspect ratios: medals ~1:1, bibs ~1.3:1 (landscape)
const FRAME_HEIGHT = 0.8;
const MEDAL_ASPECT = 1;
const BIB_ASPECT = 1.3;

interface TrophyFrameProps {
  textureUrl: string;
  trophyType?: "medal" | "bib";
  position: [number, number, number];
  rotation: [number, number, number];
  editable?: boolean;
  onPress?: () => void;
}

export function TrophyFrame({
  textureUrl,
  trophyType = "medal",
  position,
  rotation,
  editable = false,
  onPress,
}: TrophyFrameProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!textureUrl) return;
    const loader = new THREE.TextureLoader();
    loader.load(textureUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      setTexture(tex);
    });
  }, [textureUrl]);

  const aspect = trophyType === "bib" ? BIB_ASPECT : MEDAL_ASPECT;
  const width = FRAME_HEIGHT * aspect;

  // Subtle idle sway
  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.01;
  });

  if (!texture) return null;

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      castShadow
      onClick={editable ? onPress : undefined}
      onPointerOver={editable ? () => setHovered(true) : undefined}
      onPointerOut={editable ? () => setHovered(false) : undefined}
    >
      <planeGeometry args={[width, FRAME_HEIGHT]} />
      <meshStandardMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
        emissive={hovered && editable ? new THREE.Color(0xffcc66) : undefined}
        emissiveIntensity={hovered && editable ? 0.3 : 0}
      />
    </mesh>
  );
}
