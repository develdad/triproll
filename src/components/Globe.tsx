"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

// Sample destinations for demo
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

export type GlobeDestination = (typeof DEMO_DESTINATIONS)[number] | null;

interface GlobeProps {
  onDestinationRevealed?: (dest: GlobeDestination) => void;
}

// ---- Particle field around the globe ----
function Particles() {
  const count = 300;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 1.6 + Math.random() * 2;
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
      pointsRef.current.rotation.y += 0.0002;
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
        color="#ffffff"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

// ---- Destination pin that lives on the globe surface ----
function DestinationPin({ pinRef }: { pinRef: React.MutableRefObject<THREE.Group | null> }) {
  return (
    <group ref={pinRef} scale={[0, 0, 0]}>
      {/* Pin head */}
      <mesh position={[0, 0.065, 0]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial
          color="#F4845F"
          emissive="#F4845F"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Pin stick */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.06, 8]} />
        <meshStandardMaterial color="#E17055" />
      </mesh>
      {/* Glow ring */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.025, 0.045, 32]} />
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

// ---- Capture camera reference ----
function CameraCapture({
  cameraRef,
}: {
  cameraRef: React.MutableRefObject<THREE.Camera | null>;
}) {
  const { camera } = useThree();
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera, cameraRef]);
  return null;
}

// ---- Interaction handler for canvas ----
function CanvasInteraction({
  isSpinning,
  isAutoRotating,
  isLanded,
  globeRef,
}: {
  isSpinning: React.MutableRefObject<boolean>;
  isAutoRotating: React.MutableRefObject<boolean>;
  isLanded: React.MutableRefObject<boolean>;
  globeRef: React.MutableRefObject<THREE.Mesh | null>;
}) {
  const { gl } = useThree();
  const isDraggingRef = useRef(false);
  const prevXRef = useRef(0);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);
  const idleAxisY = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (!isSpinning.current && !isLanded.current) {
        isDraggingRef.current = true;
        prevXRef.current = (e as any).clientX;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (
        isDraggingRef.current &&
        !isSpinning.current &&
        !isAutoRotating.current &&
        !isLanded.current &&
        globeRef.current
      ) {
        const dx = (e as any).clientX - prevXRef.current;
        tempQuat.setFromAxisAngle(idleAxisY, dx * 0.005);
        globeRef.current.quaternion.premultiply(tempQuat);
        prevXRef.current = (e as any).clientX;
      }
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointerleave", handlePointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointerleave", handlePointerUp);
    };
  }, [gl, isSpinning, isAutoRotating, isLanded, tempQuat, idleAxisY, globeRef]);

  return null;
}

// ---- The Earth globe with quaternion-based rotation ----
function Earth({
  onPinReady,
  onSpinComplete,
  spinSpeed,
  spinAxis,
  targetQuaternion,
  isSpinning,
  isAutoRotating,
  isLanded,
  destination,
  globeRef,
}: {
  onPinReady: (pin: THREE.Group) => void;
  onSpinComplete: () => void;
  spinSpeed: React.MutableRefObject<number>;
  spinAxis: React.MutableRefObject<THREE.Vector3>;
  targetQuaternion: React.MutableRefObject<THREE.Quaternion | null>;
  isSpinning: React.MutableRefObject<boolean>;
  isAutoRotating: React.MutableRefObject<boolean>;
  isLanded: React.MutableRefObject<boolean>;
  destination: React.MutableRefObject<GlobeDestination>;
  globeRef: React.MutableRefObject<THREE.Mesh | null>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pinRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Load NASA Blue Marble Earth texture
  const earthTexture = useTexture(
    "https://unpkg.com/three-globe@2.34.2/example/img/earth-blue-marble.jpg"
  );

  useEffect(() => {
    if (meshRef.current) {
      globeRef.current = meshRef.current;
    }
    if (pinRef.current) {
      onPinReady(pinRef.current);
    }
  }, [onPinReady, globeRef]);

  const idleSpeed = 0.002;
  const friction = 0.975;
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);
  const idleAxisY = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame(() => {
    if (!meshRef.current) return;

    if (isSpinning.current) {
      // Multilateral spin: rotate around random axis with lateral tilt
      spinSpeed.current *= friction;
      tempQuat.setFromAxisAngle(spinAxis.current, spinSpeed.current);
      meshRef.current.quaternion.premultiply(tempQuat);

      if (Math.abs(spinSpeed.current) < 0.0015) {
        spinSpeed.current = 0;
        isSpinning.current = false;
        onSpinComplete();
      }
    } else if (isAutoRotating.current && targetQuaternion.current) {
      // Smoothly slerp globe quaternion to center pin toward camera
      meshRef.current.quaternion.slerp(targetQuaternion.current, 0.045);
      if (meshRef.current.quaternion.angleTo(targetQuaternion.current) < 0.005) {
        meshRef.current.quaternion.copy(targetQuaternion.current);
        isAutoRotating.current = false;
        isLanded.current = true;
      }
    } else if (!isLanded.current) {
      // Idle: gentle Y rotation using quaternion premultiply
      tempQuat.setFromAxisAngle(idleAxisY, idleSpeed);
      meshRef.current.quaternion.premultiply(tempQuat);
    }
  });

  // Animate pin scale (pop-in effect)
  useFrame(() => {
    if (pinRef.current) {
      const target = pinRef.current.visible ? 1 : 0;
      const s = pinRef.current.scale.x;
      if (Math.abs(s - target) > 0.01) {
        const ns = s + (target - s) * 0.06;
        pinRef.current.scale.set(ns, ns, ns);
      }
    }
  });

  return (
    <group>
      {/* Earth mesh with NASA Blue Marble texture */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.04, 64, 64]} />
        <meshBasicMaterial
          color={0x4fc3f7}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer atmosphere halo */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.1, 64, 64]} />
        <meshBasicMaterial
          color={0x81d4fa}
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Destination pin (child of globe, rotates with it) */}
      <DestinationPin pinRef={pinRef} />
    </group>
  );
}

// ---- Trip card overlay HTML component ----
function TripCard({
  destination,
  pinScreenPos,
  isVisible,
  onDismiss,
}: {
  destination: GlobeDestination;
  pinScreenPos: { x: number; y: number } | null;
  isVisible: boolean;
  onDismiss: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(window.scrollY);

  useEffect(() => {
    const handleScroll = () => {
      const dy = Math.abs(window.scrollY - lastScrollY.current);
      if (dy > 5 && isVisible) {
        onDismiss();
      }
      lastScrollY.current = window.scrollY;
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (isVisible && cardRef.current && !cardRef.current.contains(e.target as Node)) {
        const spinBtn = document.getElementById("spin-btn");
        if (!spinBtn || !spinBtn.contains(e.target as Node)) {
          onDismiss();
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isVisible, onDismiss]);

  if (!destination) return null;

  return (
    <>
      <div
        ref={cardRef}
        className={`fixed bg-white rounded-lg shadow-lg p-6 min-w-64 transition-opacity duration-300 ${
          isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{
          left: pinScreenPos ? `${pinScreenPos.x}px` : "0",
          top: pinScreenPos ? `${pinScreenPos.y}px` : "0",
          zIndex: 50,
        }}
      >
        <h3 className="font-bold text-lg mb-2">{destination.name}</h3>
        <p className="text-sm text-gray-600 mb-1">{destination.theme}</p>
        <p className="text-sm text-gray-600">{destination.days} nights</p>
      </div>

      {/* SVG connector line from card to pin */}
      {isVisible && pinScreenPos && (
        <svg
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 40,
          }}
        >
          <line
            x1={pinScreenPos.x}
            y1={pinScreenPos.y}
            x2={pinScreenPos.x}
            y2={pinScreenPos.y - 80}
            stroke="#F4845F"
            strokeWidth={2}
            strokeDasharray="5,5"
            opacity={0.6}
          />
        </svg>
      )}
    </>
  );
}

// ---- Main exported component ----
export default function Globe({ onDestinationRevealed }: GlobeProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number } | null>(null);

  // Mutable refs for animation state
  const spinSpeed = useRef(0);
  const spinAxis = useRef(new THREE.Vector3(0, 1, 0));
  const targetQuaternion = useRef<THREE.Quaternion | null>(null);
  const isSpinningRef = useRef(false);
  const isAutoRotatingRef = useRef(false);
  const isLandedRef = useRef(false);
  const destination = useRef<GlobeDestination>(null);
  const pinRef = useRef<THREE.Group | null>(null);
  const globeRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);

  const handlePinReady = useCallback((pin: THREE.Group) => {
    pinRef.current = pin;
  }, []);

  const getPinScreenPos = useCallback(() => {
    if (
      !pinRef.current ||
      !pinRef.current.visible ||
      !cameraRef.current ||
      typeof window === "undefined"
    ) {
      return null;
    }

    // Update matrices after render
    if (pinRef.current.parent) {
      pinRef.current.parent.updateMatrixWorld(true);
    }

    // Get pin tip position in world space
    const pinTip = new THREE.Vector3(0, 0.08, 0);
    pinRef.current.localToWorld(pinTip);

    // Project to normalized device coordinates
    const ndc = pinTip.clone().project(cameraRef.current);

    // Check if behind camera
    if (ndc.z > 1) return null;

    // Get canvas dimensions from document
    const canvas = document.querySelector("canvas");
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: rect.left + (ndc.x * 0.5 + 0.5) * rect.width,
      y: rect.top + (-ndc.y * 0.5 + 0.5) * rect.height,
    };
  }, []);

  // Update card position to follow pin
  useFrame(() => {
    if (showCard && pinRef.current?.visible) {
      const pos = getPinScreenPos();
      if (pos) {
        setCardPosition(pos);
      }
    }
  });

  const handleSpin = useCallback(() => {
    if (isSpinning || isSpinningRef.current) return;

    isLandedRef.current = false;
    setShowCard(false);
    pinRef.current!.visible = false;
    pinRef.current!.scale.set(0, 0, 0);

    // Random spin axis with lateral tilt for multilateral movement
    spinAxis.current = new THREE.Vector3(
      (Math.random() - 0.5) * 0.6,
      1,
      (Math.random() - 0.5) * 0.4
    ).normalize();

    spinSpeed.current = 0.12 + Math.random() * 0.08;
    isSpinningRef.current = true;
    isAutoRotatingRef.current = false;
    targetQuaternion.current = null;
    setIsSpinning(true);
  }, [isSpinning]);

  const handleSpinComplete = useCallback(() => {
    setIsSpinning(false);
    const dest =
      DEMO_DESTINATIONS[Math.floor(Math.random() * DEMO_DESTINATIONS.length)];
    destination.current = dest;

    if (pinRef.current && cameraRef.current) {
      // Position pin at destination coordinates
      const phi = (90 - dest.lat) * (Math.PI / 180);
      const theta = (dest.lng + 180) * (Math.PI / 180);
      const r = 1.03;
      const px = -r * Math.sin(phi) * Math.cos(theta);
      const py = r * Math.cos(phi);
      const pz = r * Math.sin(phi) * Math.sin(theta);
      pinRef.current.position.set(px, py, pz);

      // Orient pin to stick radially outward from globe
      const normal = new THREE.Vector3(px, py, pz).normalize();
      const defaultUp = new THREE.Vector3(0, 1, 0);
      pinRef.current.quaternion.setFromUnitVectors(defaultUp, normal);

      pinRef.current.visible = true;
      pinRef.current.scale.set(0, 0, 0);

      // Compute target quaternion to center pin toward camera
      const globeParent = pinRef.current.parent as THREE.Object3D;
      const worldDest = normal.clone().applyQuaternion((globeParent as any).quaternion);
      const cameraDir = new THREE.Vector3(0, 0, 1);
      const rotateToFace = new THREE.Quaternion().setFromUnitVectors(worldDest, cameraDir);
      targetQuaternion.current = rotateToFace.multiply((globeParent as any).quaternion.clone());
      isAutoRotatingRef.current = true;

      // Show card after auto-rotate settles
      setTimeout(() => {
        setShowCard(true);
      }, 600);
    }

    setHasSpun(true);
    onDestinationRevealed?.(dest);
  }, [onDestinationRevealed]);

  const handleDismissCard = useCallback(() => {
    setShowCard(false);
    if (pinRef.current) {
      pinRef.current.visible = false;
      pinRef.current.scale.set(0, 0, 0);
    }
    isLandedRef.current = false;
  }, []);

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        className="globe-canvas"
        style={{ background: "transparent" }}
      >
        <CameraCapture cameraRef={cameraRef} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 2, 4]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-4, -1, -3]} intensity={0.2} color="#88ccff" />
        <pointLight position={[-2, 1, 4]} intensity={0.1} color="#F4845F" />

        <Earth
          onPinReady={handlePinReady}
          onSpinComplete={handleSpinComplete}
          spinSpeed={spinSpeed}
          spinAxis={spinAxis}
          targetQuaternion={targetQuaternion}
          isSpinning={isSpinningRef}
          isAutoRotating={isAutoRotatingRef}
          isLanded={isLandedRef}
          destination={destination}
          globeRef={globeRef}
        />
        <Particles />
        <CanvasInteraction
          isSpinning={isSpinningRef}
          isAutoRotating={isAutoRotatingRef}
          isLanded={isLandedRef}
          globeRef={globeRef}
        />
      </Canvas>

      {/* Trip card overlay */}
      <TripCard
        destination={destination.current}
        pinScreenPos={cardPosition}
        isVisible={showCard}
        onDismiss={handleDismissCard}
      />

      {/* Spin button overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        {!hasSpun && !isSpinning && (
          <p className="text-sm text-teal-light/80 animate-pulse">
            Spin the globe to discover your trip
          </p>
        )}
        <button
          id="spin-btn"
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
