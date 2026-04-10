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
      {/* Pin head (larger sphere) */}
      <mesh position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial
          color="#F4845F"
          emissive="#F4845F"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Pin stick (longer, thicker) */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.1, 8]} />
        <meshStandardMaterial color="#E17055" />
      </mesh>
      {/* Glow ring at base */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.03, 0.06, 32]} />
        <meshBasicMaterial
          color="#F4845F"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Outer pulse ring */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.08, 32]} />
        <meshBasicMaterial
          color="#F4845F"
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
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

    // Update matrices
    if (pinRef.current.parent) {
      pinRef.current.parent.updateMatrixWorld(true);
    }

    // Get pin head center in world space (pin head sphere is at y=0.12)
    const pinHead = new THREE.Vector3(0, 0.12, 0);
    pinRef.current.localToWorld(pinHead);

    // Project to NDC
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
// On mobile, only handles horizontal drag (vertical touch passes through for native scroll)
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
  const startYRef = useRef(0);
  const startXRef = useRef(0);
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

      // On mobile, determine drag direction before committing
      if (isMobile && !dragLockedRef.current) {
        const dx = Math.abs(e.clientX - startXRef.current);
        const dy = Math.abs(e.clientY - startYRef.current);
        const threshold = 8;
        if (dx > threshold || dy > threshold) {
          dragLockedRef.current = dx > dy ? "horizontal" : "vertical";
        }
        return; // Wait until direction is determined
      }

      // On mobile, if vertical drag detected, let the browser scroll instead
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
  const { camera } = useThree();

  // Load NASA Blue Marble Earth texture
  const earthTexture = useTexture(
    "https://unpkg.com/three-globe@2.34.2/example/img/earth-blue-marble.jpg"
  );

  // Critical: set SRGB color space so the texture renders bright (not dark/linear)
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
      {/* Earth mesh with NASA Blue Marble texture -- pin is a CHILD so it rotates with the globe */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.55}
          metalness={0.02}
        />
        {/* Destination pin (child of mesh, rotates with globe quaternion) */}
        <DestinationPin pinRef={pinRef} />
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
    </group>
  );
}

// ---- Trip card overlay with genie effect (unified for all screen sizes) ----
function TripCard({
  destination,
  pinScreenPos,
  isVisible,
  onDismiss,
  isMobile,
}: {
  destination: GlobeDestination;
  pinScreenPos: { x: number; y: number } | null;
  isVisible: boolean;
  onDismiss: () => void;
  isMobile: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  // track the genie animation progress (0 = fully in pin, 1 = fully expanded)
  const [genieProgress, setGenieProgress] = useState(0);
  const animFrameRef = useRef<number>(0);

  // Animate genie progress smoothly
  const targetProgress = useRef(0);
  useEffect(() => {
    const animate = () => {
      setGenieProgress((prev) => {
        const diff = targetProgress.current - prev;
        if (Math.abs(diff) < 0.005) return targetProgress.current;
        // Ease out cubic for smooth genie feel
        return prev + diff * 0.12;
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Determine target: show or collapse based on visibility and scroll
  useEffect(() => {
    if (!isVisible) {
      targetProgress.current = 0;
      return;
    }

    // Card just became visible: expand it
    targetProgress.current = 1;

    const handleScroll = () => {
      if (window.scrollY > 5) {
        targetProgress.current = 0;
      } else {
        targetProgress.current = 1;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isVisible]);

  if (!destination || !pinScreenPos) return null;

  // Responsive card width
  const cardW = isMobile ? Math.min(300, window.innerWidth - 24) : 340;
  const imgH = isMobile ? 110 : 140;

  // Position: bottom-left corner of card anchored exactly at pin head
  let cardLeft = pinScreenPos.x;
  let cardTop = pinScreenPos.y;

  // Keep card within viewport
  if (typeof window !== "undefined") {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Horizontal clamping
    if (cardLeft + cardW > vw - 8) cardLeft = vw - cardW - 8;
    if (cardLeft < 8) cardLeft = 8;

    // On mobile, if the card would go above the viewport (pin is too high),
    // flip it below the pin instead of above
    if (isMobile && cardTop < 80) {
      // Card will render below the pin instead
      cardTop = pinScreenPos.y + 12;
    }
  }

  // Genie effect: scale from 0 at bottom-left corner, with slight vertical squash
  const p = genieProgress;
  const scale = p;
  const opacity = Math.min(p * 2, 1); // fade in faster than scale
  const skewX = (1 - p) * -4; // slight skew that resolves as card expands
  const scaleY = 0.6 + p * 0.4; // vertical stretch: starts squished, ends normal

  // Determine if card should render below pin (flipped) on mobile
  const isFlipped = isMobile && pinScreenPos.y < 80;
  const transformOrigin = isFlipped ? "top left" : "bottom left";
  const translateY = isFlipped ? "0%" : "-100%";

  const isShowing = p > 0.01;

  return (
    <>
      {isShowing && (
        <div
          ref={cardRef}
          style={{
            position: "fixed",
            left: `${cardLeft}px`,
            top: `${cardTop}px`,
            width: `${cardW}px`,
            zIndex: 50,
            transformOrigin,
            // translateY(-100%) shifts card up by its own height so bottom-left = pin head
            transform: `translateY(${translateY}) scale(${scale}) scaleY(${scaleY}) skewX(${skewX}deg)`,
            opacity,
            pointerEvents: p > 0.8 ? "auto" : "none",
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
            {/* Destination image */}
            <div style={{ position: "relative", width: "100%", height: imgH, overflow: "hidden" }}>
              <img
                src={destination.image}
                alt={destination.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              {/* Gradient overlay for text readability */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
                background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
              }} />
              {/* Nights badge on image */}
              <span style={{
                position: "absolute", top: 8, right: 8,
                background: "#0D7377", color: "white",
                fontSize: isMobile ? 10 : 11, fontWeight: 600,
                padding: "2px 8px", borderRadius: 20,
              }}>
                {destination.days} nights
              </span>
              {/* Destination name on image */}
              <div style={{ position: "absolute", bottom: 8, left: 12, right: 12 }}>
                <p style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, color: "#F4845F", marginBottom: 2 }}>
                  Your Destination
                </p>
                <h3 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, color: "white", lineHeight: 1.2, textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
                  {destination.name}
                </h3>
              </div>
            </div>

            {/* Card body */}
            <div style={{ padding: isMobile ? "10px 12px 12px" : "14px 16px 16px" }}>
              {/* Trip theme */}
              <div className="rounded-lg px-3 py-2 mb-2" style={{ background: "#FFF5F0" }}>
                <p style={{ fontSize: isMobile ? 10 : 11, color: "#999", marginBottom: 1 }}>Trip Theme</p>
                <p style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: "#2D3436" }}>
                  {destination.theme}
                </p>
              </div>

              {/* Climate and cost row */}
              <div style={{ display: "flex", gap: 6, marginBottom: isMobile ? 8 : 12 }}>
                <div className="rounded-lg px-2.5 py-1.5" style={{ flex: 1, background: "#F0FAFA" }}>
                  <p style={{ fontSize: isMobile ? 9 : 10, color: "#999", marginBottom: 1 }}>Climate</p>
                  <p style={{ fontSize: isMobile ? 11 : 12, fontWeight: 600, color: "#0D7377" }}>{destination.climate}</p>
                  <p style={{ fontSize: isMobile ? 10 : 11, color: "#666" }}>{destination.tempRange}</p>
                </div>
                <div className="rounded-lg px-2.5 py-1.5" style={{ flex: 1, background: "#FFF8F5" }}>
                  <p style={{ fontSize: isMobile ? 9 : 10, color: "#999", marginBottom: 1 }}>Est. Cost / person</p>
                  <p style={{ fontSize: isMobile ? 11 : 12, fontWeight: 600, color: "#E17055" }}>{destination.costRange}</p>
                  <p style={{ fontSize: isMobile ? 10 : 11, color: "#666" }}>Flights + hotel + activities</p>
                </div>
              </div>

              {/* Package includes (compact) */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? 4 : 6, marginBottom: isMobile ? 10 : 14 }}>
                {[
                  { icon: "\u2708\uFE0F", label: "Flights" },
                  { icon: "\uD83C\uDFE8", label: "Hotel" },
                  { icon: "\uD83C\uDFAF", label: "Activities" },
                  { icon: "\uD83D\uDE97", label: "Transport" },
                ].map((item) => (
                  <span
                    key={item.label}
                    style={{
                      fontSize: isMobile ? 10 : 11, color: "#666", background: "#f5f5f3",
                      padding: isMobile ? "2px 6px" : "3px 8px", borderRadius: 6, display: "inline-flex",
                      alignItems: "center", gap: 3,
                    }}
                  >
                    <span style={{ fontSize: isMobile ? 11 : 13 }}>{item.icon}</span>
                    {item.label}
                  </span>
                ))}
              </div>

              {/* CTA buttons */}
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{
                  flex: 1, background: "#0D7377", color: "white", fontWeight: 600,
                  padding: isMobile ? "8px 0" : "10px 0", borderRadius: 12,
                  fontSize: isMobile ? 12 : 13, border: "none", cursor: "pointer",
                }}>
                  Book This Trip
                </button>
                <button style={{
                  padding: isMobile ? "8px 12px" : "10px 16px",
                  border: "1px solid #e0e0e0", color: "#666",
                  borderRadius: 12, fontSize: isMobile ? 12 : 13,
                  background: "white", cursor: "pointer",
                }}>
                  Details
                </button>
              </div>

              <p style={{ fontSize: isMobile ? 10 : 11, color: "#bbb", textAlign: "center", marginTop: 6 }}>
                Demo preview. Real trips coming soon.
              </p>
            </div>

            {/* Small triangle pointer at bottom-left pointing down toward pin */}
            {!isFlipped && (
              <div
                style={{
                  position: "absolute",
                  bottom: -8,
                  left: 8,
                  width: 0,
                  height: 0,
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderTop: "8px solid rgba(255,255,255,0.97)",
                  filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.08))",
                }}
              />
            )}
            {/* Arrow pointing up when card is flipped below pin */}
            {isFlipped && (
              <div
                style={{
                  position: "absolute",
                  top: -8,
                  left: 8,
                  width: 0,
                  height: 0,
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderBottom: "8px solid rgba(255,255,255,0.97)",
                  filter: "drop-shadow(0 -2px 2px rgba(0,0,0,0.08))",
                }}
              />
            )}
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
      // Pin is now a child of globeRef (the mesh), so use globeRef quaternion
      const globeMesh = globeRef.current!;
      const worldDest = normal.clone().applyQuaternion(globeMesh.quaternion);
      const cameraDir = new THREE.Vector3(0, 0, 1);
      const rotateToFace = new THREE.Quaternion().setFromUnitVectors(worldDest, cameraDir);
      targetQuaternion.current = rotateToFace.multiply(globeMesh.quaternion.clone());
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
        camera={{ position: [0, 0, isMobile ? 3.5 : 3], fov: isMobile ? 50 : 45 }}
        className="globe-canvas"
        style={{
          background: "transparent",
          touchAction: "pan-y",  // Allow vertical scroll to pass through canvas
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

      {/* Trip card overlay - same genie effect on all screen sizes */}
      <TripCard
        destination={destination.current}
        pinScreenPos={cardPosition}
        isVisible={showCard}
        onDismiss={handleDismissCard}
        isMobile={isMobile}
      />

      {/* Spin button overlay */}
      <div className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 sm:gap-3 ${isMobile ? "bottom-3" : "bottom-8"}`}>
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
