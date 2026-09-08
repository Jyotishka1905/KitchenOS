import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function PulsingRing() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.05;
      ringRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[3, 3.1, 32]} />
      <meshBasicMaterial color="#8d3217" transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function DataNodePulses() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
      <Canvas camera={{ position: [0, 0, 8] }}>
        <ambientLight intensity={0.5} />
        <PulsingRing />
      </Canvas>
    </div>
  );
}