import React, { useMemo } from "react";
import * as THREE from "three";
import { RBox } from "./Props";
import { fabric, pictureTex, rugTex, woodFloor } from "./textures";

/*
  Layout (metres). Room A (living room) x∈[-6,0], Room B (kitchen) x∈[0,6].
  Back wall at z=-3, open "dollhouse" front. Dividing wall at x=0 from z=-3 to z=1.6
  with a doorway z∈[-0.48,0.48]. Door hinge at z=-0.45, opens into room B.
*/

export const DOOR = { x: 0, zMin: -0.48, zMax: 0.48, h: 2.1 };
export const SOFA = { x: -3.7, z: -2.05 };
export const BOX_POS: [number, number, number] = [-0.95, 0.62, 1.5];

const WALL_T = 0.14;

const Wall: React.FC<{
  from: [number, number];
  to: [number, number];
  h?: number;
  y0?: number;
  mat: THREE.Material;
}> = ({ from, to, h = 2.9, y0 = 0, mat }) => {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const len = Math.hypot(dx, dz);
  const ang = Math.atan2(dx, dz);
  return (
    <mesh
      material={mat}
      position={[(from[0] + to[0]) / 2, y0 + h / 2, (from[1] + to[1]) / 2]}
      rotation={[0, ang, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[WALL_T, h, len]} />
    </mesh>
  );
};

/** Back wall with a window hole (x from a to b, sill y1, top y2). */
const WindowWall: React.FC<{
  x0: number;
  x1: number;
  wa: number;
  wb: number;
  mat: THREE.Material;
  frame: THREE.Material;
  glass: THREE.Material;
}> = ({ x0, x1, wa, wb, mat, frame, glass }) => {
  const z = -3;
  const y1 = 0.95;
  const y2 = 2.35;
  const H = 2.9;
  const seg = (xa: number, xb: number, ya: number, yb: number, k: string) => (
    <mesh
      key={k}
      material={mat}
      position={[(xa + xb) / 2, (ya + yb) / 2, z]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[xb - xa, yb - ya, WALL_T]} />
    </mesh>
  );
  const cx = (wa + wb) / 2;
  const cy = (y1 + y2) / 2;
  return (
    <group>
      {seg(x0, wa, 0, H, "l")}
      {seg(wb, x1, 0, H, "r")}
      {seg(wa, wb, 0, y1, "b")}
      {seg(wa, wb, y2, H, "t")}
      {/* frame */}
      <mesh material={frame} position={[cx, y1 - 0.03, z + 0.09]} castShadow>
        <boxGeometry args={[wb - wa + 0.22, 0.06, 0.24]} />
      </mesh>
      {[
        [cx, y2, wb - wa, 0.06],
        [cx, cy, wb - wa, 0.05],
        [wa, cy, 0.06, y2 - y1],
        [wb, cy, 0.06, y2 - y1],
        [cx, cy, 0.05, y2 - y1],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} material={frame} position={[x, y, z]} castShadow>
          <boxGeometry args={[w, h, 0.1]} />
        </mesh>
      ))}
      {/* bright sky behind */}
      <mesh material={glass} position={[cx, cy, z - 0.3]}>
        <planeGeometry args={[wb - wa + 0.6, y2 - y1 + 0.6]} />
      </mesh>
    </group>
  );
};

export const Door: React.FC<{ open: number; glow: number }> = ({
  open,
  glow,
}) => {
  const doorMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#8B5A3C",
        roughness: 0.45,
        clearcoat: 0.5,
        clearcoatRoughness: 0.35,
      }),
    [],
  );
  const panelMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#7A4C31",
        roughness: 0.5,
        clearcoat: 0.4,
      }),
    [],
  );
  const frameMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#F3EEE6", roughness: 0.5 }),
    [],
  );
  const glowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#FFD27A",
        toneMapped: false,
        transparent: true,
      }),
    [],
  );
  const brass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#E2B857",
        metalness: 1,
        roughness: 0.25,
      }),
    [],
  );
  doorMat.emissive.set("#FF9F40");
  doorMat.emissiveIntensity = glow * 0.35;
  glowMat.opacity = Math.min(1, glow);
  const w = DOOR.zMax - DOOR.zMin;
  const dh = DOOR.h - 0.02;
  return (
    <group>
      {/* frame (both faces) */}
      {[
        [0, DOOR.h + 0.05, 0, WALL_T + 0.05, 0.1, w + 0.2],
        [0, DOOR.h / 2, DOOR.zMin - 0.05, WALL_T + 0.05, DOOR.h, 0.1],
        [0, DOOR.h / 2, DOOR.zMax + 0.05, WALL_T + 0.05, DOOR.h, 0.1],
      ].map(([x, y, z, a, b, c], i) => (
        <mesh
          key={i}
          material={frameMat}
          position={[x, y, z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[a, b, c]} />
        </mesh>
      ))}
      {/* glowing outline */}
      {glow > 0.01
        ? [
            [0, DOOR.h + 0.11, 0, WALL_T + 0.08, 0.03, w + 0.26],
            [
              0,
              DOOR.h / 2,
              DOOR.zMin - 0.11,
              WALL_T + 0.08,
              DOOR.h + 0.2,
              0.03,
            ],
            [
              0,
              DOOR.h / 2,
              DOOR.zMax + 0.11,
              WALL_T + 0.08,
              DOOR.h + 0.2,
              0.03,
            ],
          ].map(([x, y, z, a, b, c], i) => (
            <mesh key={"g" + i} material={glowMat} position={[x, y, z]}>
              <boxGeometry args={[a, b, c]} />
            </mesh>
          ))
        : null}
      {/* leaf, hinged at zMin */}
      <group
        position={[0.0, 0, DOOR.zMin + 0.02]}
        rotation={[0, open * 1.75, 0]}
      >
        <group position={[0, dh / 2, w / 2 - 0.02]}>
          <mesh material={doorMat} castShadow receiveShadow>
            <boxGeometry args={[0.05, dh, w - 0.04]} />
          </mesh>
          {[0.45, -0.38].map((y, i) =>
            [-1, 1].map((sd) => (
              <mesh
                key={i + "" + sd}
                material={panelMat}
                position={[sd * 0.028, y, 0]}
                castShadow
              >
                <boxGeometry args={[0.012, i === 0 ? 0.62 : 0.75, w - 0.24]} />
              </mesh>
            )),
          )}
          {[-1, 1].map((sd) => (
            <mesh
              key={sd}
              material={brass}
              position={[sd * 0.05, -0.05, w / 2 - 0.12]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <capsuleGeometry args={[0.014, 0.08, 6, 10]} />
            </mesh>
          ))}
        </group>
      </group>
      {glow > 0.01 ? (
        <>
          <pointLight
            position={[0.6, 1.2, 0]}
            intensity={glow * 6}
            distance={4}
            color="#FFB45A"
          />
          <pointLight
            position={[-0.6, 1.2, 0]}
            intensity={glow * 3}
            distance={3}
            color="#FFB45A"
          />
        </>
      ) : null}
    </group>
  );
};

const Sofa: React.FC = () => {
  const mat = useMemo(() => {
    const n = fabric();
    return new THREE.MeshPhysicalMaterial({
      color: "#C8664A",
      roughness: 0.95,
      roughnessMap: n,
    });
  }, []);
  const cushion = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#E9C46A", roughness: 0.9 }),
    [],
  );
  const leg = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#3B2A1F", roughness: 0.5 }),
    [],
  );
  return (
    <group position={[SOFA.x, 0, SOFA.z]}>
      <RBox
        size={[2.2, 0.28, 0.9]}
        position={[0, 0.3, 0]}
        material={mat}
        radius={0.08}
      />
      <RBox
        size={[2.2, 0.6, 0.25]}
        position={[0, 0.65, -0.34]}
        material={mat}
        radius={0.1}
      />
      <RBox
        size={[0.25, 0.42, 0.9]}
        position={[-1.1, 0.5, 0]}
        material={mat}
        radius={0.1}
      />
      <RBox
        size={[0.25, 0.42, 0.9]}
        position={[1.1, 0.5, 0]}
        material={mat}
        radius={0.1}
      />
      {[-0.5, 0.5].map((x) => (
        <RBox
          key={x}
          size={[0.95, 0.14, 0.7]}
          position={[x, 0.5, 0.07]}
          material={mat}
          radius={0.06}
        />
      ))}
      <RBox
        size={[0.42, 0.42, 0.14]}
        position={[-0.7, 0.72, -0.15]}
        rotation={[-0.25, 0.2, 0.1]}
        material={cushion}
        radius={0.07}
      />
      {[-1.05, 1.05].map((x) =>
        [-0.35, 0.35].map((z) => (
          <mesh key={x + "" + z} material={leg} position={[x, 0.08, z]}>
            <cylinderGeometry args={[0.03, 0.02, 0.16, 10]} />
          </mesh>
        )),
      )}
    </group>
  );
};

const Plant: React.FC<{ position: [number, number, number]; s?: number }> = ({
  position,
  s = 1,
}) => {
  const leaf = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#4F8A5B",
        roughness: 0.6,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const leaves = useMemo(() => {
    const arr: {
      p: [number, number, number];
      r: [number, number, number];
      sc: number;
    }[] = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 * 2.3;
      const h = 0.45 + (i % 5) * 0.12;
      arr.push({
        p: [Math.cos(a) * 0.12, h, Math.sin(a) * 0.12],
        r: [0.6 + (i % 3) * 0.2, -a, 0],
        sc: 0.8 + (i % 4) * 0.12,
      });
    }
    return arr;
  }, []);
  return (
    <group position={position} scale={s}>
      <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.2, 0.15, 0.4, 24]} />
        <meshStandardMaterial color="#D9A47A" roughness={0.8} />
      </mesh>
      {leaves.map((l, i) => (
        <mesh
          key={i}
          material={leaf}
          position={l.p}
          rotation={l.r}
          scale={[l.sc * 0.12, l.sc * 0.32, 1]}
          castShadow
        >
          <circleGeometry args={[1, 16]} />
        </mesh>
      ))}
    </group>
  );
};

const FloorLamp: React.FC<{
  position: [number, number, number];
  on?: number;
}> = ({ position, on = 1 }) => (
  <group position={position}>
    <mesh position={[0, 0.02, 0]} castShadow>
      <cylinderGeometry args={[0.18, 0.2, 0.04, 24]} />
      <meshStandardMaterial color="#2E2E2E" metalness={0.6} roughness={0.4} />
    </mesh>
    <mesh position={[0, 0.8, 0]} castShadow>
      <cylinderGeometry args={[0.015, 0.015, 1.6, 8]} />
      <meshStandardMaterial color="#2E2E2E" metalness={0.6} roughness={0.4} />
    </mesh>
    <mesh position={[0, 1.65, 0]} castShadow>
      <cylinderGeometry args={[0.16, 0.26, 0.32, 28, 1, true]} />
      <meshStandardMaterial
        color="#F6E7C8"
        emissive="#FFD9A0"
        emissiveIntensity={0.9 * on}
        side={THREE.DoubleSide}
        roughness={0.9}
      />
    </mesh>
    <pointLight
      position={[0, 1.55, 0]}
      intensity={4 * on}
      distance={5}
      decay={2}
      color="#FFC98A"
    />
  </group>
);

const Picture: React.FC<{
  position: [number, number, number];
  seed: number;
  size?: [number, number];
}> = ({ position, seed, size = [0.45, 0.56] }) => (
  <group position={position}>
    <mesh castShadow>
      <boxGeometry args={[size[0] + 0.06, size[1] + 0.06, 0.03]} />
      <meshStandardMaterial color="#2F2A26" roughness={0.6} />
    </mesh>
    <mesh position={[0, 0, 0.017]}>
      <planeGeometry args={size} />
      <meshStandardMaterial map={pictureTex(seed)} roughness={0.7} />
    </mesh>
  </group>
);

const Kitchen: React.FC<{ highlight: number }> = ({ highlight }) => {
  const cab = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#7FA88F",
        roughness: 0.5,
        clearcoat: 0.3,
      }),
    [],
  );
  const top = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#F1ECE2",
        roughness: 0.25,
        clearcoat: 0.8,
      }),
    [],
  );
  const handle = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#D8B25A",
        metalness: 1,
        roughness: 0.3,
      }),
    [],
  );
  const wood = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#B07A4F",
        roughness: 0.45,
        clearcoat: 0.4,
      }),
    [],
  );
  const hl = (base: string) => ({
    emissive: base,
    emissiveIntensity: highlight * 0.45,
  });
  return (
    <group>
      {/* counter */}
      <RBox
        size={[3.2, 0.86, 0.62]}
        position={[3.4, 0.43, -2.62]}
        material={cab}
        radius={0.02}
      />
      <RBox
        size={[3.3, 0.05, 0.68]}
        position={[3.4, 0.885, -2.6]}
        material={top}
        radius={0.015}
      />
      {[2.2, 3.0, 3.8, 4.6].map((x) => (
        <mesh
          key={x}
          material={handle}
          position={[x, 0.7, -2.3]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <capsuleGeometry args={[0.01, 0.16, 4, 8]} />
        </mesh>
      ))}
      {/* upper cabinets */}
      <RBox
        size={[2.4, 0.7, 0.38]}
        position={[3.0, 2.05, -2.75]}
        material={cab}
        radius={0.02}
      />
      {/* fridge */}
      <RBox
        size={[0.8, 1.9, 0.7]}
        position={[5.4, 0.95, -2.55]}
        color="#E8ECEF"
        roughness={0.25}
        metalness={0.2}
        radius={0.05}
      />
      <mesh material={handle} position={[5.08, 1.2, -2.18]}>
        <capsuleGeometry args={[0.012, 0.5, 4, 8]} />
      </mesh>
      {/* kettle */}
      <group position={[2.4, 0.91, -2.6]}>
        <mesh castShadow>
          <sphereGeometry
            args={[0.12, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]}
          />
          <meshStandardMaterial
            color="#D9534F"
            roughness={0.3}
            {...hl("#D9534F")}
          />
        </mesh>
        <mesh position={[0, 0.0, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.13, 0.12, 24]} />
          <meshStandardMaterial
            color="#D9534F"
            roughness={0.3}
            {...hl("#D9534F")}
          />
        </mesh>
      </group>
      {/* fruit bowl */}
      <group position={[3.6, 0.91, -2.55]}>
        <mesh castShadow>
          <sphereGeometry
            args={[0.18, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]}
          />
          <meshStandardMaterial
            color="#F4F1DE"
            side={THREE.DoubleSide}
            roughness={0.4}
          />
        </mesh>
        {[
          [0, 0.05, 0, "#F4A261"],
          [0.08, 0.04, 0.05, "#E76F51"],
          [-0.07, 0.04, 0.04, "#E9C46A"],
          [0.02, 0.05, -0.08, "#90BE6D"],
        ].map(([x, y, z, c], i) => (
          <mesh
            key={i}
            position={[x as number, y as number, z as number]}
            castShadow
          >
            <sphereGeometry args={[0.065, 16, 12]} />
            <meshStandardMaterial
              color={c as string}
              roughness={0.5}
              {...hl(c as string)}
            />
          </mesh>
        ))}
      </group>
      {/* table + chairs */}
      <group position={[3.3, 0, 0.3]}>
        <mesh material={wood} position={[0, 0.75, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.6, 0.6, 0.05, 40]} />
        </mesh>
        <mesh material={wood} position={[0, 0.37, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.09, 0.74, 16]} />
        </mesh>
        <mesh position={[0.1, 0.8, 0.05]} castShadow>
          <cylinderGeometry args={[0.05, 0.04, 0.1, 20]} />
          <meshStandardMaterial
            color="#3D85C6"
            roughness={0.3}
            {...hl("#3D85C6")}
          />
        </mesh>
        {[-1, 1].map((sd) => (
          <group
            key={sd}
            position={[sd * 0.85, 0, 0]}
            rotation={[0, (sd * -Math.PI) / 2, 0]}
          >
            <RBox
              size={[0.45, 0.05, 0.45]}
              position={[0, 0.46, 0]}
              material={wood}
              radius={0.02}
            />
            <RBox
              size={[0.45, 0.45, 0.05]}
              position={[0, 0.7, -0.2]}
              material={wood}
              radius={0.02}
            />
            {[-0.18, 0.18].map((x) =>
              [-0.18, 0.18].map((z) => (
                <mesh key={x + "" + z} material={wood} position={[x, 0.22, z]}>
                  <cylinderGeometry args={[0.02, 0.02, 0.44, 8]} />
                </mesh>
              )),
            )}
          </group>
        ))}
      </group>
      {/* pendant lamp */}
      <group position={[3.3, 2.3, 0.3]}>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.7, 6]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh>
          <sphereGeometry
            args={[0.24, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
          />
          <meshStandardMaterial
            color="#2F4858"
            side={THREE.DoubleSide}
            roughness={0.5}
          />
        </mesh>
        <mesh position={[0, -0.02, 0]}>
          <sphereGeometry args={[0.07, 16, 12]} />
          <meshBasicMaterial color="#FFE2B0" toneMapped={false} />
        </mesh>
        <pointLight
          position={[0, -0.15, 0]}
          intensity={5}
          distance={4.5}
          color="#FFCF94"
        />
      </group>
    </group>
  );
};

export const Sun: React.FC<{
  position: [number, number, number];
  target: [number, number, number];
  intensity: number;
  color: string;
  extent?: number;
}> = ({ position, target, intensity, color, extent = 8 }) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  return (
    <>
      <primitive object={tgt} position={target} />
      <directionalLight
        position={position}
        target={tgt}
        intensity={intensity}
        color={color}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-extent}
        shadow-camera-right={extent}
        shadow-camera-top={extent}
        shadow-camera-bottom={-extent}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={6}
      />
    </>
  );
};

export const House: React.FC<{
  doorOpen: number;
  doorGlow: number;
  kitchenHighlight?: number;
  children?: React.ReactNode;
}> = ({ doorOpen, doorGlow, kitchenHighlight = 0, children }) => {
  const m = useMemo(() => {
    const floorTex = woodFloor([4, 3]);
    return {
      floor: new THREE.MeshPhysicalMaterial({
        map: floorTex,
        roughness: 0.42,
        clearcoat: 0.35,
        clearcoatRoughness: 0.4,
      }),
      wallA: new THREE.MeshStandardMaterial({
        color: "#EADBC8",
        roughness: 0.92,
      }),
      wallB: new THREE.MeshStandardMaterial({
        color: "#D3E4D6",
        roughness: 0.92,
      }),
      wallMid: new THREE.MeshStandardMaterial({
        color: "#E8DDCF",
        roughness: 0.92,
      }),
      frame: new THREE.MeshStandardMaterial({
        color: "#F7F3EC",
        roughness: 0.5,
      }),
      sky: new THREE.MeshBasicMaterial({ color: "#FFF4DC", toneMapped: false }),
      skirting: new THREE.MeshStandardMaterial({
        color: "#F7F3EC",
        roughness: 0.5,
      }),
      table: new THREE.MeshPhysicalMaterial({
        color: "#8C5A3A",
        roughness: 0.4,
        clearcoat: 0.5,
      }),
      rug: new THREE.MeshStandardMaterial({ map: rugTex(), roughness: 1 }),
    };
  }, []);

  return (
    <group>
      {/* floor */}
      <mesh
        material={m.floor}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[12.4, 7.2]} />
      </mesh>
      {/* outside ground far away (behind window) */}
      {/* back walls with windows */}
      <WindowWall
        x0={-6.2}
        x1={0}
        wa={-5.3}
        wb={-4.0}
        mat={m.wallA}
        frame={m.frame}
        glass={m.sky}
      />
      <WindowWall
        x0={0}
        x1={6.2}
        wa={0.9}
        wb={1.9}
        mat={m.wallB}
        frame={m.frame}
        glass={m.sky}
      />
      {/* side walls */}
      <Wall from={[-6.2, -3]} to={[-6.2, 3.6]} mat={m.wallA} />
      <Wall from={[6.2, -3]} to={[6.2, 3.6]} mat={m.wallB} />
      {/* dividing wall with doorway */}
      <Wall from={[0, -3]} to={[0, DOOR.zMin - 0.1]} mat={m.wallMid} />
      <Wall from={[0, DOOR.zMax + 0.1]} to={[0, 0.95]} mat={m.wallMid} />
      <Wall
        from={[0, DOOR.zMin - 0.1]}
        to={[0, DOOR.zMax + 0.1]}
        y0={DOOR.h + 0.1}
        h={2.9 - DOOR.h - 0.1}
        mat={m.wallMid}
      />
      {/* skirting */}
      <mesh material={m.skirting} position={[0, 0.05, -2.92]}>
        <boxGeometry args={[12.4, 0.1, 0.03]} />
      </mesh>
      <Door open={doorOpen} glow={doorGlow} />

      {/* ROOM A: living room */}
      <mesh
        material={m.rug}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-3.6, 0.006, -0.9]}
        receiveShadow
      >
        <circleGeometry args={[1.5, 64]} />
      </mesh>
      <Sofa />
      <group position={[-3.7, 0, -0.75]}>
        <RBox
          size={[1.1, 0.06, 0.6]}
          position={[0, 0.42, 0]}
          material={m.table}
          radius={0.02}
        />
        {[-0.48, 0.48].map((x) =>
          [-0.24, 0.24].map((z) => (
            <mesh key={x + "" + z} material={m.table} position={[x, 0.2, z]}>
              <cylinderGeometry args={[0.025, 0.02, 0.4, 8]} />
            </mesh>
          )),
        )}
        <mesh position={[0.25, 0.5, 0.05]} castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.1, 20]} />
          <meshStandardMaterial color="#F4F1DE" roughness={0.3} />
        </mesh>
        <RBox
          size={[0.3, 0.04, 0.22]}
          position={[-0.2, 0.47, 0]}
          rotation={[0, 0.3, 0]}
          color="#3D5A80"
          radius={0.01}
        />
      </group>
      <FloorLamp position={[-5.4, 0, -2.4]} />
      <Plant position={[-0.75, 0, -2.5]} s={1.1} />
      {/* side table near the door, holds the memory box */}
      <group position={[BOX_POS[0], 0, BOX_POS[2]]}>
        <RBox
          size={[0.7, 0.05, 0.5]}
          position={[0, 0.595, 0]}
          material={m.table}
          radius={0.015}
        />
        {[-0.3, 0.3].map((x) =>
          [-0.2, 0.2].map((z) => (
            <mesh key={x + "" + z} material={m.table} position={[x, 0.3, z]}>
              <cylinderGeometry args={[0.02, 0.018, 0.6, 8]} />
            </mesh>
          )),
        )}
      </group>
      <Picture position={[-2.6, 1.75, -2.92]} seed={1} />
      <Picture position={[-1.95, 1.6, -2.92]} seed={2} size={[0.36, 0.36]} />
      <Picture position={[-6.12, 1.6, -1.2]} seed={3} />

      {/* ROOM B: kitchen */}
      <Kitchen highlight={kitchenHighlight} />
      <Plant position={[5.6, 0, 1.2]} s={0.9} />
      <Picture position={[4.5, 1.9, -2.92]} seed={4} size={[0.5, 0.36]} />

      {/* LIGHTING */}
      <hemisphereLight args={["#FFF1DD", "#8C6E55", 0.35]} />
      {/* warm low daylight from a big window on the left/front: long soft shadows */}
      <Sun
        position={[-7.5, 6.0, 5.5]}
        target={[-0.5, 0, -1.0]}
        intensity={3.4}
        color="#FFD9A8"
        extent={9}
      />
      {/* daylight through the back windows */}
      <directionalLight
        position={[-3.6, 6.5, -9]}
        intensity={0.8}
        color="#FFE1B5"
      />
      {/* cool fill from the open side */}
      <directionalLight position={[6, 3, 7]} intensity={0.45} color="#DCE8FF" />
      {children}
    </group>
  );
};
