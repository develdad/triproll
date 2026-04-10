"use client";

import { useRef, useState, useCallback, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

// Sample destinations for demo
const DEMO_DESTINATIONS = [
  {
    name: "Barcelona, Spain", lat: 41.39, lng: 2.17, theme: "Cultural Immersion", days: 4,
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&h=300&fit=crop",
    climate: "Warm Mediterranean", tempRange: "18-28°C", costRange: "$1,800 - $2,400",
  },
  {
    name: "Kyoto, Japan", lat: 35.01, lng: 135.77, theme: "Ancient Wonders", days: 5,
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=300&fit=crop",
    climate: "Mild & Seasonal", tempRange: "10-26°C", costRange: "$2,200 - $3,100",
  },
  {
    name: "Santorini, Greece", lat: 36.39, lng: 25.46, theme: "Island Escape", days: 4,
    image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600&h=300&fit=crop",
    climate: "Sunny & Dry", tempRange: "20-30°C", costRange: "$2,000 - $2,800",
  },
  {
    name: "Banff, Canada", lat: 51.18, lng: -115.57, theme: "Mountain Adventure", days: 3,
    image: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=600&h=300&fit=crop",
    climate: "Cool Alpine", tempRange: "-5-20°C", costRange: "$1,500 - $2,200",
  },
  {
    name: "Marrakech, Morocco", lat: 31.63, lng: -8.0, theme: "Exotic Discovery", days: 5,
    image: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=600&h=300&fit=crop",
    climate: "Hot & Arid", tempRange: "22-38°C", costRange: "$1,400 - $2,000",
  },
  {
    name: "Queenstown, NZ", lat: -45.03, lng: 168.66, theme: "Thrill Seeker", days: 4,
    image: "https://images.unsplash.com/photo-1589871973318-9ca1258faa5d?w=600&h=300&fit=crop",
    climate: "Cool & Crisp", tempRange: "5-22°C", costRange: "$2,400 - $3,200",
  },
  {
    name: "Reykjavik, Iceland", lat: 64.15, lng: -21.94, theme: "Northern Lights", days: 3,
    image: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=600&h=300&fit=crop",
    climate: "Cold & Dramatic", tempRange: "-2-14°C", costRange: "$2,100 - $2,900",
  },
  {
    name: "Amalfi Coast, Italy", lat: 40.63, lng: 14.60, theme: "Coastal Romance", days: 5,
    image: "https://images.unsplash.com/photo-1455587734955-081b22074882?w=600&h=300&fit=crop",
    climate: "Warm Mediterranean", tempRange: "16-30°C", costRange: "$2,500 - $3,500",
  },
  {
    name: "Sedona, Arizona", lat: 34.87, lng: -111.76, theme: "Desert Wellness", days: 3,
    image: "https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=600&h=300&fit=crop",
    climate: "Warm & Dry", tempRange: "15-35°C", costRange: "$1,200 - $1,800",
  },
  {
    name: "Tulum, Mexico", lat: 20.21, lng: -87.43, theme: "Beach Bliss", days: 4,
    image: "https://images.unsplash.com/photo-1682553064541-0add5c1e44f0?w=600&h=300&fit=crop",
    climate: "Tropical & Humid", tempRange: "24-33°C", costRange: "$1,600 - $2,300",
  },
];

export type GlobeDestination = (typeof DEMO_DESTINATIONS)[number] | null;

interface GlobeProps {
  onDestinationRevealed?: (dest: GlobeDestination) => void;
}

// ---- Hook to detect mobile ----
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
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
      <pointsMaterial size={0.015} color="#ffffff" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

// ---- Destination pin that lives on the globe surface ----
function DestinationPin({ pinRef }: { pinRef: React.MutableRefObject<THREE.Group | null> }) {
  return (
    <group ref={pinRef} scale={[0, 0, 0]}>
      <mesh position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#F4845F" emissive="#F4845F" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.1, 8]} />
        <meshStandardMaterial color="#E17055" />
      </mesh>
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.03, 0.06, 32]} />
        <meshBasicMaterial color="#F4845F" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.08, 32]} />
        <meshBasicMaterial color="#F4845F" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ---- Card position tracker (must be inside Canvas for useFrame) ----
function CardPositionTracker({
  pinRef,
  cameraRef,
  showCard,
  onPositionUpdate,
}: {
  pinRef: React.MutableRefObject<THREE.Group | null>;
  cameraRef: React.MutableRefObject<THREE.Camera | null>;
  showCard: boolean;
  onPositionUpdate: (pos: { x: number; y: number } | null) => void;
}) {
  useFrame(() => {
    if (!showCard || !pinRef.current || !pinRef.current.visible || !cameraRef.current) return;

    if (pinRef.current.parent) {
      pinRef.current.parent.updateMatrixWorld(true);
    }

    const pinHead = new THREE.Vector3(0, 0.12, 0);
    pinRef.current.localToWorld(pinHead);

    const ndc = pinHead.clone().project(cameraRef.current);
    if (ndc.z > 1) {
      onPositionUpdate(null);
      return;
    }

    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    onPositionUpdate({
      x: rect.left + (ndc.x * 0.5 + 0.5) * rect.width,
      y: rect.top + (-ndc.y * 0.5 + 0.5) * rect.height,
    });
  });

  return null;
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
  isMobile,
}: {
  isSpinning: React.MutableRefObject<boolean>;
  isAutoRotating: React.MutableRefObject<boolean>;
  isLanded: React.MutableRefObject<boolean>;
  globeRef: React.MutableRefObject<THREE.Mesh | null>;
  isMobile: boolean;
}) {
  const { gl } = useThree();
  const isDraggingRef = useRef(false);
  const prevXRef = useRef(0);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const dragLockedRef = useRef<"horizontal" | "vertical" | null>(null);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);
  const idleAxisY = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (!isSpinning.current && !isLanded.current) {
        isDraggingRef.current = true;
        prevXRef.current = e.clientX;
        startXRef.current = e.clientX;
        startYRef.current = e.clientY;
        dragLockedRef.current = null;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (
        !isDraggingRef.current ||
        isSpinning.current ||
        isAutoRotating.current ||
        isLanded.current ||
        !globeRef.current
      ) return;

      if (isMobile && !dragLockedRef.current) {
        const dx = Math.abs(e.clientX - startXRef.current);
        const dy = Math.abs(e.clientY - startYRef.current);
        const threshold = 8;
        if (dx > threshold || dy > threshold) {
          dragLockedRef.current = dx > dy ? "horizontal" : "vertical";
        }
        return;
      }

      if (isMobile && dragLockedRef.current === "vertical") return;

      const dx = e.clientX - prevXRef.current;
      tempQuat.setFromAxisAngle(idleAxisY, dx * 0.005);
      globeRef.current.quaternion.premultiply(tempQuat);
      prevXRef.current = e.clientX;
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      dragLockedRef.current = null;
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
  }, [gl, isSpinning, isAutoRotating, isLanded, tempQuat, idleAxisY, globeRef, isMobile]);

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

  const earthTexture = useTexture(
    "https://unpkg.com/three-globe@2.34.2/example/img/earth-blue-marble.jpg"
  );

  useEffect(() => {
    if (earthTexture) {
      earthTexture.colorSpace = THREE.SRGBColorSpace;
      earthTexture.needsUpdate = true;
    }
  }, [earthTexture]);

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
      spinSpeed.current *= friction;
      tempQuat.setFromAxisAngle(spinAxis.current, spinSpeed.current);
      meshRef.current.quaternion.premultiply(tempQuat);

      if (Math.abs(spinSpeed.current) < 0.0015) {
        spinSpeed.current = 0;
        isSpinning.current = false;
        onSpinComplete();
      }
    } else if (isAutoRotating.current && targetQuaternion.current) {
      meshRef.current.quaternion.slerp(targetQuaternion.current, 0.045);
      if (meshRef.current.quaternion.angleTo(targetQuaternion.current) < 0.005) {
        meshRef.current.quaternion.copy(targetQuaternion.current);
        isAutoRotating.current = false;
        isLanded.current = true;
      }
    } else if (!isLanded.current) {
      tempQuat.setFromAxisAngle(idleAxisY, idleSpeed);
      meshRef.current.quaternion.premultiply(tempQuat);
    }
  });

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
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial map={earthTexture} roughness={0.55} metalness={0.02} />
        <DestinationPin pinRef={pinRef} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.04, 64, 64]} />
        <meshBasicMaterial color={0x4fc3f7} transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.1, 64, 64]} />
        <meshBasicMaterial color={0x81d4fa} transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

// ---- Card content shared by both layouts ----
function CardBody({
  destination,
  isMobile,
}: {
  destination: NonNullable<GlobeDestination>;
  isMobile: boolean;
}) {
  const imgH = isMobile ? 160 : 140;

  return (
    <>
      <div style={{ position: "relative", width: "100%", height: imgH, overflow: "hidden" }}>
        <img
          src={destination.image}
          alt={destination.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
          background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
        }} />
        <span style={{
          position: "absolute", top: 10, right: 10,
          background: "#0D7377", color: "white",
          fontSize: isMobile ? 12 : 11, fontWeight: 600,
          padding: "3px 10px", borderRadius: 20,
        }}>
          {destination.days} nights
        </span>
        <div style={{ position: "absolute", bottom: 10, left: 14, right: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, color: "#F4845F", marginBottom: 2 }}>
            Your Destination
          </p>
          <h3 style={{ fontSize: isMobile ? 22 : 20, fontWeight: 700, color: "white", lineHeight: 1.2, textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
            {destination.name}
          </h3>
        </div>
      </div>

      <div style={{ padding: isMobile ? "16px 16px 20px" : "14px 16px 16px" }}>
        <div className="rounded-lg px-3 py-2.5 mb-3" style={{ background: "#FFF5F0" }}>
          <p style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>Trip Theme</p>
          <p style={{ fontSize: isMobile ? 15 : 14, fontWeight: 600, color: "#2D3436" }}>
            {destination.theme}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: isMobile ? 14 : 12 }}>
          <div className="rounded-lg px-3 py-2" style={{ flex: 1, background: "#F0FAFA" }}>
            <p style={{ fontSize: 10, color: "#999", marginBottom: 1 }}>Climate</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#0D7377" }}>{destination.climate}</p>
            <p style={{ fontSize: 11, color: "#666" }}>{destination.tempRange}</p>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ flex: 1, background: "#FFF8F5" }}>
            <p style={{ fontSize: 10, color: "#999", marginBottom: 1 }}>Est. Cost / person</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#E17055" }}>{destination.costRange}</p>
            <p style={{ fontSize: 11, color: "#666" }}>Flights + hotel + activities</p>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: isMobile ? 16 : 14 }}>
          {[
            { icon: "\u2708\uFE0F", label: "Flights" },
            { icon: "\uD83C\uDFE8", label: "Hotel" },
            { icon: "\uD83C\uDFAF", label: "Activities" },
            { icon: "\uD83D\uDE97", label: "Transport" },
          ].map((item) => (
            <span
              key={item.label}
              style={{
                fontSize: isMobile ? 12 : 11, color: "#666", background: "#f5f5f3",
                padding: "3px 8px", borderRadius: 6, display: "inline-flex",
                alignItems: "center", gap: 4,
              }}
            >
              <span style={{ fontSize: isMobile ? 14 : 13 }}>{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button style={{
            flex: 1, background: "#0D7377", color: "white", fontWeight: 600,
            padding: isMobile ? "12px 0" : "10px 0", borderRadius: 12,
            fontSize: isMobile ? 15 : 13, border: "none", cursor: "pointer",
          }}>
            Book This Trip
          </button>
          <button style={{
            padding: isMobile ? "12px 18px" : "10px 16px",
            border: "1px solid #e0e0e0", color: "#666",
            borderRadius: 12, fontSize: isMobile ? 15 : 13,
            background: "white", cursor: "pointer",
          }}>
            Details
          </button>
        </div>

        <p style={{ fontSize: 11, color: "#bbb", textAlign: "center", marginTop: 8 }}>
          Demo preview. Real trips coming soon.
        </p>
      </div>
    </>
  );
}

// ---- Smooth cubic ease-out for genie feel ----
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ---- DESKTOP: Trip card with genie from pin head (bottom-left origin) ----
// Card travels from pin position to its final resting spot.
function DesktopTripCard({
  destination,
  pinScreenPos,
  isVisible,
}: {
  destination: GlobeDestination;
  pinScreenPos: { x: number; y: number } | null;
  isVisible: boolean;
}) {
  const [genieProgress, setGenieProgress] = useState(0);
  const animFrameRef = useRef<number>(0);
  const targetProgress = useRef(0);

  useEffect(() => {
    const animate = () => {
      setGenieProgress((prev) => {
        const diff = targetProgress.current - prev;
        if (Math.abs(diff) < 0.003) return targetProgress.current;
        // Slower, smoother easing
        return prev + diff * 0.06;
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      targetProgress.current = 0;
      return;
    }
    targetProgress.current = 1;

    const handleScroll = () => {
      targetProgress.current = window.scrollY > 5 ? 0 : 1;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isVisible]);

  if (!destination || !pinScreenPos) return null;

  const cardW = 340;

  // Final resting position for the card (bottom-left at pin, then clamped)
  let finalLeft = pinScreenPos.x;
  if (typeof window !== "undefined") {
    const vw = window.innerWidth;
    if (finalLeft + cardW > vw - 12) finalLeft = vw - cardW - 12;
    if (finalLeft < 12) finalLeft = 12;
  }
  // Card sits above the pin (translateY(-100%) equivalent)
  // We'll compute the card's bottom-left anchor point at the pin
  // and the card position naturally offsets upward via translateY(-100%)

  // Apply eased progress
  const p = easeOutCubic(genieProgress);
  const rawP = genieProgress;

  const scale = p;
  const opacity = Math.min(p * 1.8, 1);
  const skewX = (1 - p) * -6;
  const scaleY = 0.5 + p * 0.5;
  const isShowing = rawP > 0.01;

  return isShowing ? (
    <div
      style={{
        position: "fixed",
        left: `${finalLeft}px`,
        top: `${pinScreenPos.y}px`,
        width: `${cardW}px`,
        zIndex: 50,
        transformOrigin: "bottom left",
        transform: `translateY(-100%) scale(${scale}) scaleY(${scaleY}) skewX(${skewX}deg)`,
        opacity,
        pointerEvents: rawP > 0.8 ? "auto" : "none",
        willChange: "transform, opacity",
      }}
    >
      <div
        className="backdrop-blur-sm rounded-2xl border border-teal-100/30 relative overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.97)",
          boxShadow: `0 ${20 * p}px ${60 * p}px rgba(0,0,0,${0.18 * p}), 0 0 0 1px rgba(178,228,230,0.3)`,
        }}
      >
        <CardBody destination={destination} isMobile={false} />
        <div
          style={{
            position: "absolute", bottom: -8, left: 8,
            width: 0, height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "8px solid rgba(255,255,255,0.97)",
            filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.08))",
          }}
        />
      </div>
    </div>
  ) : null;
}

// ---- MOBILE: Full-screen modal card with genie from pin head (center origin) ----
// At p=0 the card is a tiny point at the pin head. At p=1 it fills the screen.
// The card translates from the pin position to screen center as it scales up.
function MobileTripCard({
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
  const [genieProgress, setGenieProgress] = useState(0);
  const animFrameRef = useRef<number>(0);
  const targetProgress = useRef(0);

  useEffect(() => {
    const animate = () => {
      setGenieProgress((prev) => {
        const diff = targetProgress.current - prev;
        if (Math.abs(diff) < 0.003) return targetProgress.current;
        // Slower, smoother genie feel
        return prev + diff * 0.06;
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      targetProgress.current = 0;
      return;
    }
    targetProgress.current = 1;

    const handleScroll = () => {
      targetProgress.current = window.scrollY > 5 ? 0 : 1;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isVisible]);

  if (!destination || !pinScreenPos) return null;

  const rawP = genieProgress;
  const p = easeOutCubic(rawP);
  const isShowing = rawP > 0.01;

  // Final card rect (20% smaller than full screen, below navbar)
  const vw = typeof window !== "undefined" ? window.innerWidth : 375;
  const vh = typeof window !== "undefined" ? window.innerHeight : 700;
  const hMargin = Math.round(vw * 0.1);
  const navH = 72;
  const topMargin = navH + Math.round((vh - navH) * 0.1);
  const bottomMargin = Math.round(vh * 0.1);

  const finalW = vw - hMargin * 2;
  const finalH = vh - topMargin - bottomMargin;
  const finalCenterX = hMargin + finalW / 2;
  const finalCenterY = topMargin + finalH / 2;

  // Pin position is where the genie starts/ends
  const pinX = pinScreenPos.x;
  const pinY = pinScreenPos.y;

  // Interpolate center position from pin to final center
  const currentCenterX = pinX + (finalCenterX - pinX) * p;
  const currentCenterY = pinY + (finalCenterY - pinY) * p;

  // Scale: from 0 at pin to 1 at full size
  const scale = p;
  const scaleY = 0.6 + p * 0.4;
  const opacity = Math.min(rawP * 2.5, 1);

  // Position the card so its center is at the interpolated point
  const left = currentCenterX - (finalW / 2);
  const top = currentCenterY - (finalH / 2);

  return (
    <>
      {/* Backdrop */}
      {isShowing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 49,
            background: `rgba(0,0,0,${0.25 * p})`,
            pointerEvents: rawP > 0.5 ? "auto" : "none",
          }}
          onClick={onDismiss}
        />
      )}

      {isShowing && (
        <div
          style={{
            position: "fixed",
            left: `${left}px`,
            top: `${top}px`,
            width: `${finalW}px`,
            height: `${finalH}px`,
            zIndex: 50,
            transformOrigin: "center center",
            transform: `scale(${scale}) scaleY(${scaleY})`,
            opacity,
            pointerEvents: rawP > 0.8 ? "auto" : "none",
            willChange: "transform, opacity",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            className="rounded-2xl border border-teal-100/30 relative overflow-hidden flex-1 flex flex-col"
            style={{
              background: "rgba(255,255,255,0.97)",
              boxShadow: `0 ${20 * p}px ${60 * p}px rgba(0,0,0,${0.2 * p}), 0 0 0 1px rgba(178,228,230,0.3)`,
            }}
          >
            <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
              <CardBody destination={destination} isMobile={true} />
            </div>
          </div>
        </div>
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
  const isMobile = useIsMobile();

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

  const handlePositionUpdate = useCallback((pos: { x: number; y: number } | null) => {
    if (pos) {
      setCardPosition(pos);
    }
  }, []);

  const handleSpin = useCallback(() => {
    if (isSpinning || isSpinningRef.current) return;

    isLandedRef.current = false;
    setShowCard(false);
    pinRef.current!.visible = false;
    pinRef.current!.scale.set(0, 0, 0);

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
      const phi = (90 - dest.lat) * (Math.PI / 180);
      const theta = (dest.lng + 180) * (Math.PI / 180);
      const r = 1.03;
      const px = -r * Math.sin(phi) * Math.cos(theta);
      const py = r * Math.cos(phi);
      const pz = r * Math.sin(phi) * Math.sin(theta);
      pinRef.current.position.set(px, py, pz);

      const normal = new THREE.Vector3(px, py, pz).normalize();
      const defaultUp = new THREE.Vector3(0, 1, 0);
      pinRef.current.quaternion.setFromUnitVectors(defaultUp, normal);

      pinRef.current.visible = true;
      pinRef.current.scale.set(0, 0, 0);

      const globeMesh = globeRef.current!;
      const worldDest = normal.clone().applyQuaternion(globeMesh.quaternion);
      const cameraDir = new THREE.Vector3(0, 0, 1);
      const rotateToFace = new THREE.Quaternion().setFromUnitVectors(worldDest, cameraDir);
      targetQuaternion.current = rotateToFace.multiply(globeMesh.quaternion.clone());
      isAutoRotatingRef.current = true;

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
    <div className="relative w-full h-full flex flex-col">
      {/* Globe canvas - fills available space, vertically centered */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0, 0, isMobile ? 3.15 : 3], fov: 45 }}
          className="globe-canvas"
          style={{
            background: "transparent",
            touchAction: "pan-y",
          }}
        >
          <CameraCapture cameraRef={cameraRef} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[5, 2, 4]} intensity={1.8} color="#ffffff" />
          <directionalLight position={[-4, -1, -3]} intensity={0.6} color="#aaddff" />
          <pointLight position={[-2, 1, 4]} intensity={0.3} color="#F4845F" />
          <directionalLight position={[0, 0, 5]} intensity={0.5} color="#ffffff" />

          <Suspense fallback={null}>
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
          </Suspense>
          <Particles />
          <CanvasInteraction
            isSpinning={isSpinningRef}
            isAutoRotating={isAutoRotatingRef}
            isLanded={isLandedRef}
            globeRef={globeRef}
            isMobile={isMobile}
          />
          <CardPositionTracker
            pinRef={pinRef}
            cameraRef={cameraRef}
            showCard={showCard}
            onPositionUpdate={handlePositionUpdate}
          />
        </Canvas>
      </div>

      {/* Trip card: desktop pin-anchored vs mobile full-screen, both genie from pin */}
      {isMobile ? (
        <MobileTripCard
          destination={destination.current}
          pinScreenPos={cardPosition}
          isVisible={showCard}
          onDismiss={handleDismissCard}
        />
      ) : (
        <DesktopTripCard
          destination={destination.current}
          pinScreenPos={cardPosition}
          isVisible={showCard}
        />
      )}

      {/* Spin button overlay - sits at bottom of the container */}
      <div className="flex flex-col items-center gap-2 sm:gap-3 pb-3 sm:pb-6 pt-1">
        {!hasSpun && !isSpinning && (
          <p className="text-xs sm:text-sm text-teal-light/80 animate-pulse text-center px-4">
            Spin the globe to discover your trip
          </p>
        )}
        <button
          id="spin-btn"
          onClick={handleSpin}
          disabled={isSpinning}
          className={`
            px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold text-white text-base sm:text-lg
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
