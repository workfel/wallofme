import { TrophyFrame } from "./trophy-frame";
import { DecorationModel } from "./decoration-model";

// Room dimensions
const ROOM_WIDTH = 6;
const ROOM_DEPTH = 6;
const ROOM_HEIGHT = 3;
const WALL_THICKNESS = 0.15;

// Diorama palette — warm cartoon / low poly
const FLOOR_COLOR = "#c9a87c";
const LEFT_WALL_COLOR = "#faedcd";
const BACK_WALL_COLOR = "#fefae0";

// Types matching the backend API response
type Trophy = {
  id: string;
  type: "medal" | "bib";
  textureUrl: string | null;
  thumbnailUrl: string | null;
};

type Decoration = {
  id: string;
  name: string;
  modelUrl: string | null;
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
  decoration?: Decoration | null;
};

type Room = {
  id: string;
  userId: string;
  themeId: string | null;
  floor: string | null;
  items: RoomItem[];
};

export type PainCaveSceneProps = {
  room: Room;
  onItemPress?: (itemId: string) => void;
  editable?: boolean;
};

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <boxGeometry args={[ROOM_WIDTH, ROOM_DEPTH, WALL_THICKNESS]} />
      <meshStandardMaterial color={FLOOR_COLOR} roughness={0.9} />
    </mesh>
  );
}

function LeftWall() {
  return (
    <mesh
      position={[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]}
      receiveShadow
    >
      <boxGeometry args={[WALL_THICKNESS, ROOM_HEIGHT, ROOM_DEPTH]} />
      <meshStandardMaterial color={LEFT_WALL_COLOR} roughness={0.95} />
    </mesh>
  );
}

function BackWall() {
  return (
    <mesh
      position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]}
      receiveShadow
    >
      <boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS]} />
      <meshStandardMaterial color={BACK_WALL_COLOR} roughness={0.95} />
    </mesh>
  );
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={1.0} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, 2.5, 0]} intensity={0.5} color="#fff5e6" />
    </>
  );
}

/**
 * Maps DB wall values to 3D positions and rotations.
 *
 * DB "left"  → left wall (X = -ROOM_WIDTH/2), faces +X
 * DB "right" → back wall (Z = -ROOM_DEPTH/2), faces +Z
 */
function getWallPosition(
  item: RoomItem
): { position: [number, number, number]; rotation: [number, number, number] } {
  const y = item.positionY || 1.5;
  const offset = WALL_THICKNESS / 2 + 0.01;

  if (item.wall === "left") {
    return {
      position: [-ROOM_WIDTH / 2 + offset, y, item.positionZ || 0],
      rotation: [0, Math.PI / 2, 0],
    };
  }

  // "right" in DB → back wall in 3D
  return {
    position: [item.positionX || 0, y, -ROOM_DEPTH / 2 + offset],
    rotation: [0, 0, 0],
  };
}

export function PainCaveScene({
  room,
  onItemPress,
  editable = false,
}: PainCaveSceneProps) {
  const trophyItems = room.items.filter(
    (item) => item.trophyId && item.trophy?.textureUrl
  );
  const decorationItems = room.items.filter(
    (item) => item.decorationId && item.decoration?.modelUrl
  );

  return (
    <>
      <Lighting />
      <Floor />
      <LeftWall />
      <BackWall />

      {/* TEST CUBE — bright red, sitting on the floor center */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#ff3333" />
      </mesh>

      {trophyItems.map((item) => {
        const { position, rotation } = getWallPosition(item);
        return (
          <TrophyFrame
            key={item.id}
            textureUrl={item.trophy!.textureUrl!}
            trophyType={item.trophy!.type}
            position={position}
            rotation={rotation}
            editable={editable}
            onPress={() => onItemPress?.(item.id)}
          />
        );
      })}

      {decorationItems.map((item) => (
        <DecorationModel
          key={item.id}
          modelUrl={item.decoration!.modelUrl!}
          position={[item.positionX, 0, item.positionZ]}
          rotationY={item.rotationY}
        />
      ))}
    </>
  );
}
