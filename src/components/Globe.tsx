"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

// ---- Destination pin that drops onto the globe ----
function DestinationPin({
  position,
  visible,
}: {
  position: THREE.Vector3;
  visible: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [scale, setScale] = useState(0);

  useFrame((_, delta) => {
    if (visible && scale < 1) {
      setScale((s) => Math.min(s + delta * 4, 1));
    }
    if (!visible && scale > 0) {
      setScale(0);
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Pin body */}
      <mesh position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial color="#F4845F" emissive="#F4845F" emissiveIntensity={0.3} />
      </mesh>
      {/* Pin stick */}
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.05, 8]} />
        <meshStandardMaterial color="#E17055" />
      </mesh>
      {/* Glow ring */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.02, 0.04, 32]} />
        <meshBasicMaterial
          color="#F4845F"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ---- The spinning Earth globe ----
function Earth({
  isSpinning,
  onSpinComplete,
  spinSpeed,
  destinationCoords,
  showPin,
}: {
  isSpinning: boolean;
  onSpinComplete: () => void;
  spinSpeed: React.MutableRefObject<number>;
  destinationCoords: { lat: number; lng: number } | null;
  showPin: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const idleSpeed = 0.001;
  const friction = 0.97;

  useFrame(() => {
    if (!meshRef.current) return;

    if (isSpinning) {
      // Apply friction to slow down
      spinSpeed.current *= friction;
      meshRef.current.rotation.y += spinSpeed.current;

      // Once slow enough, stop and trigger complete
      if (Math.abs(spinSpeed.current) < 0.002) {
        spinSpeed.current = 0;
        onSpinComplete();
      }
    } else {
      // Idle gentle rotation
      meshRef.current.rotation.y += idleSpeed;
    }
  });

  // Convert lat/lng to 3D position on sphere surface
  const pinPosition = useMemo(() => {
    if (!destinationCoords) return new THREE.Vector3(0, 1.02, 0);
    const phi = (90 - destinationCoords.lat) * (Math.PI / 180);
    const theta = (destinationCoords.lng + 180) * (Math.PI / 180);
    const r = 1.02;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }, [destinationCoords]);

  return (
    <group>
      {/* Earth sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color="#14A3A8"
          roughness={0.8}
          metalness={0.1}
        />
        {/* Wireframe overlay for geographic feel */}
        <mesh>
          <sphereGeometry args={[1.002, 32, 32]} />
          <meshBasicMaterial
            color="#0D7377"
            wireframe
            transparent
            opacity={0.15}
          />
        </mesh>
      </mesh>

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[1.05, 64, 64]} />
        <meshBasicMaterial
          color="#14A3A8"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[1.12, 64, 64]} />
        <meshBasicMaterial
          color="#B2E4E6"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Destination pin */}
      <DestinationPin position={pinPosition} visible={showPin} />
    </group>
  );
}

// ---- Particle field around the globe ----
function Particles() {
  const count = 200;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 1.5 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0003;
    }
  });

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial
        size={0.015}
        color="#B2E4E6"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// ---- Sample destinations for demo ----
const DEMO_DESTINATIONS = [
  { name: "Barcelona, Spain", lat: 41.39, lng: 2.17, theme: "Cultural Immersion", days: 4 },
  { name: "Kyoto, Japan", lat: 35.01, lng: 135.77, theme: "Ancient Wonders", days: 5 },
  { name: "Santorini, Greece", lat: 36.39, lng: 25.46, theme: "Island Escape", days: 4 },
  { name: "Banff, Canada", lat: 51.18, lng: -115.57, theme: "Mountain Adventure", days: 3 },
  { name: "Marrakech, Morocco", lat: 31.63, lng: -8.0, theme: "Exotic Discovery", days: 5 },
  { name: "Queenstown, NZ", lat: -45.03, lng: 168.66, theme: "Thrill Seeker", days: 4 },
  { name: "Reykjavik, Iceland", lat: 64.15, lng: -21.94, theme: "Northern Lights", days: 3 },
  { name: "Amalfi Coast, Italy", lat: 40.63, lng: 14.60, theme: "Coastal Romance", days: 5 },
  { name: "Sedona, Arizona", lat: 34.87, lng: -111.76, theme: "Desert Wellness", days: 3 },
  { name: "Tulum, Mexico", lat: 20.21, lng: -87.43, theme: "Beach Bliss", days: 4 },
];

// ---- Main exported component ----
export type GlobeDestination = (typeof DEMO_DESTINATIONS)[number] | null;

interface GlobeProps {
  onDestinationRevealed?: (dest: GlobeDestination) => void;
}

export default function Globe({ onDestinationRevealed }: GlobeProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [destination, setDestination] = useState<GlobeDestination>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const spinSpeed = useRef(0);

  const handleSpin = useCallback(() => {
    if (isSpinning) return;

    setShowPin(false);
    setDestination(null);
    setHasSpun(false);

    // Random spin speed
    spinSpeed.current = 0.15 + Math.random() * 0.1;
    setIsSpinning(true);
  }, [isSpinning]);

  const handleSpinComplete = useCallback(() => {
    setIsSpinning(false);
    // Pick random destination
    const dest =
      DEMO_DESTINATIONS[Math.floor(Math.random() * DEMO_DESTINATIONS.length)];
    setDestination(dest);
    setShowPin(true);
    setHasSpun(true);
    onDestinationRevealed?.(dest);
  }, [onDestinationRevealed]);

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        className="globe-canvas"
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 3, 5]} intensity={0.8} color="#ffffff" />
        <directionalLight
          position={[-3, -2, -3]}
          intensity={0.3}
          color="#B2E4E6"
        />
        <pointLight position={[0, 0, 3]} intensity={0.2} color="#F4845F" />

        <Earth
          isSpinning={isSpinning}
          onSpinComplete={handleSpinComplete}
          spinSpeed={spinSpeed}
          destinationCoords={
            destination ? { lat: destination.lat, lng: destination.lng } : null
          }
          showPin={showPin}
        />
        <Particles />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={!isSpinning}
          autoRotate={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={(3 * Math.PI) / 4}
        />
      </Canvas>

      {/* Spin button overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        {!hasSpun && !isSpinning && (
          <p className="text-sm text-teal-light/80 animate-pulse">
            Spin the globe to discover your trip
          </p>
        )}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className={`
            px-8 py-3 rounded-full font-semibold text-white text-lg
            transition-all duration-300 cursor-pointer
            ${
              isSpinning
                ? "bg-slate opacity-60 cursor-not-allowed scale-95"
                : "bg-peach hover:bg-coral hover:scale-105 shadow-lg shadow-peach/30 hover:shadow-peach/50"
            }
          `}
        >
          {isSpinning ? "Rolling..." : hasSpun ? "Roll Again" : "Roll the Globe"}
        </button>
      </div>
    </div>
  );
}
