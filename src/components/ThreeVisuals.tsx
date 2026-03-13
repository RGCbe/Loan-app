import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Float, Text, MeshDistortMaterial, Sphere, PerspectiveCamera,
  Environment, ContactShadows, Stars, MeshTransmissionMaterial,
  RoundedBox, Torus, MeshWobbleMaterial, Trail
} from '@react-three/drei';
import * as THREE from 'three';

// ─── Shared Components ───

const Particles = ({ count = 150, color = '#ffffff', size = 0.02, spread = 10 }) => {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * spread;
      p[i * 3 + 1] = (Math.random() - 0.5) * spread;
      p[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    return p;
  }, [count, spread]);

  const ref = useRef<THREE.Points>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.0008;
      ref.current.rotation.x += 0.0004;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={points} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={size} color={color} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
};

// ─── Orbiting Ring ───

const OrbitRing = ({ radius = 2, speed = 0.5, color = '#6366f1', thickness = 0.015 }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * speed) * 0.3 + 0.8;
      ref.current.rotation.z = state.clock.elapsedTime * speed * 0.5;
    }
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, thickness, 16, 100]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.6} />
    </mesh>
  );
};

// ─── Floating Coin ───

const FloatingCoin = ({ position = [0, 0, 0] as [number, number, number], color = '#f59e0b', speed = 1 }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * speed;
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed * 0.8) * 0.15;
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh>
        <cylinderGeometry args={[0.35, 0.35, 0.06, 32]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} emissive={color} emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, 0.035, 0]}>
        <ringGeometry args={[0.15, 0.25, 32]} />
        <meshStandardMaterial color={color} metalness={1} roughness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.035, 0]} rotation={[Math.PI, 0, 0]}>
        <ringGeometry args={[0.15, 0.25, 32]} />
        <meshStandardMaterial color={color} metalness={1} roughness={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// ─── Morphing Blob ───

const MorphBlob = ({ position = [0, 0, 0] as [number, number, number], color = '#8b5cf6', scale = 1 }) => {
  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={1}>
      <Sphere args={[0.6 * scale, 64, 64]} position={position}>
        <MeshDistortMaterial
          color={color}
          speed={4}
          distort={0.5}
          radius={1}
          emissive={color}
          emissiveIntensity={0.15}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
};

// ─── DNA Helix (represents growth) ───

const HelixStrand = ({ color = '#10b981', offset = 0 }) => {
  const ref = useRef<THREE.Group>(null);
  const spheres = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 20; i++) {
      const t = i * 0.3;
      arr.push({
        x: Math.cos(t + offset) * 0.5,
        y: t * 0.3 - 1.5,
        z: Math.sin(t + offset) * 0.5,
        scale: 0.06 + Math.sin(t) * 0.02,
      });
    }
    return arr;
  }, [offset]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <group ref={ref}>
      {spheres.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]}>
          <sphereGeometry args={[s.scale, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
};

// ─── Animated Torus Knot ───

const AnimatedTorusKnot = ({ color = '#6366f1', position = [0, 0, 0] as [number, number, number] }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.2;
      ref.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={ref} position={position}>
        <torusKnotGeometry args={[0.8, 0.25, 128, 32]} />
        <MeshWobbleMaterial
          color={color}
          factor={0.3}
          speed={2}
          metalness={0.7}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={0.1}
        />
      </mesh>
    </Float>
  );
};

// ─── Glowing Orb with Trail ───

const GlowOrb = ({ color = '#ec4899', radius = 1.5, speed = 0.5 }) => {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.z = Math.sin(t) * radius;
    ref.current.position.y = Math.sin(t * 2) * 0.5;
  });

  return (
    <Trail width={0.3} length={8} color={color} attenuation={(w) => w * w}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
    </Trail>
  );
};

// ─── Wireframe Icosahedron ───

const WireIco = ({ position = [0, 0, 0] as [number, number, number], color = '#22d3ee', scale = 1 }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.15;
      ref.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color={color} wireframe emissive={color} emissiveIntensity={0.3} />
    </mesh>
  );
};

// ═══════════════════════════════════════
// SCENE 1: Login Background (3D space)
// ═══════════════════════════════════════

const LoginScene = () => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 8]} />
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#6366f1" />
      <pointLight position={[-5, -3, 5]} intensity={0.5} color="#ec4899" />

      <Stars radius={80} depth={60} count={3000} factor={4} saturation={0.2} fade speed={0.8} />
      <Particles count={200} color="#6366f1" size={0.025} spread={15} />

      {/* Central glassy torus knot */}
      <AnimatedTorusKnot color="#6366f1" position={[0, 0, 0]} />

      {/* Orbiting rings */}
      <OrbitRing radius={2.2} speed={0.4} color="#6366f1" />
      <OrbitRing radius={2.8} speed={0.3} color="#8b5cf6" thickness={0.01} />
      <OrbitRing radius={3.4} speed={0.2} color="#ec4899" thickness={0.008} />

      {/* Floating coins */}
      <FloatingCoin position={[-3, 1.5, -1]} color="#f59e0b" speed={0.8} />
      <FloatingCoin position={[3.5, -0.5, -2]} color="#10b981" speed={1.2} />
      <FloatingCoin position={[-2, -1.5, 1]} color="#6366f1" speed={0.6} />

      {/* Trailing orbs */}
      <GlowOrb color="#6366f1" radius={3} speed={0.4} />
      <GlowOrb color="#ec4899" radius={2.5} speed={0.6} />
      <GlowOrb color="#10b981" radius={3.5} speed={0.3} />

      {/* Wireframe shapes */}
      <WireIco position={[4, 2, -3]} color="#22d3ee" scale={0.6} />
      <WireIco position={[-4, -2, -4]} color="#8b5cf6" scale={0.8} />

      <Environment preset="night" />
    </>
  );
};

export const LoginVisualizer = () => {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas dpr={[1, 1.5]} camera={{ fov: 50 }}>
        <LoginScene />
      </Canvas>
    </div>
  );
};

// ═══════════════════════════════════════
// SCENE 2: Enhanced Dashboard Visualizer
// ═══════════════════════════════════════

const DashboardScene = ({ lent, borrowed, capital }: { lent: number, borrowed: number, capital: number }) => {
  const total = Math.max(lent + borrowed + capital, 1);
  const lentRatio = lent / total;
  const borrowedRatio = borrowed / total;
  const capitalRatio = capital / total;

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 7]} />
      <ambientLight intensity={0.15} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={0.8} color="#6366f1" />

      <Particles count={250} color="#ffffff" size={0.02} spread={12} />
      <Stars radius={100} depth={50} count={4000} factor={4} saturation={0} fade speed={0.8} />

      {/* Central Capital — Large glassy sphere with transmission */}
      <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
        <Sphere args={[1.5 * capitalRatio + 1, 64, 64]} position={[0, 0, -2]}>
          <MeshTransmissionMaterial
            backside
            samples={4}
            thickness={0.8}
            chromaticAberration={0.03}
            anisotropy={0.1}
            distortion={0.15}
            distortionScale={0.2}
            temporalDistortion={0.15}
            color="#8b5cf6"
            roughness={0}
            transmission={1}
          />
        </Sphere>
      </Float>

      {/* Orbiting rings around capital */}
      <OrbitRing radius={2 * capitalRatio + 1.5} speed={0.3} color="#8b5cf6" />
      <OrbitRing radius={2.5 * capitalRatio + 1.8} speed={0.2} color="#6366f1" thickness={0.01} />

      {/* Lent — Green morphing blob with helix */}
      <MorphBlob position={[-2.5, 0.5, 0]} color="#10b981" scale={1.2 * lentRatio + 0.5} />
      <group position={[-2.5, 0, 0]} scale={0.6}>
        <HelixStrand color="#10b981" offset={0} />
        <HelixStrand color="#10b981" offset={Math.PI} />
      </group>
      <Text position={[-2.5, -1.8, 0]} fontSize={0.22} color="#10b981" font="https://fonts.gstatic.com/s/inter/v12/UcCOjFwrW2mtfZ84CP92.woff">
        LENT
      </Text>

      {/* Borrowed — Red morphing blob */}
      <MorphBlob position={[2.5, 0.5, 0]} color="#ef4444" scale={1.2 * borrowedRatio + 0.5} />
      <FloatingCoin position={[2.5, 1.8, 0.5]} color="#ef4444" speed={1} />
      <Text position={[2.5, -1.8, 0]} fontSize={0.22} color="#ef4444" font="https://fonts.gstatic.com/s/inter/v12/UcCOjFwrW2mtfZ84CP92.woff">
        BORROWED
      </Text>

      {/* Trailing orbs circling the scene */}
      <GlowOrb color="#10b981" radius={3.5} speed={0.3} />
      <GlowOrb color="#ef4444" radius={3} speed={0.4} />
      <GlowOrb color="#8b5cf6" radius={4} speed={0.2} />

      {/* Floating coins decorating edges */}
      <FloatingCoin position={[-4, 2, -2]} color="#f59e0b" speed={0.5} />
      <FloatingCoin position={[4, -1.5, -3]} color="#f59e0b" speed={0.7} />

      <ContactShadows position={[0, -2.5, 0]} opacity={0.3} scale={15} blur={2.5} far={4.5} />
      <Environment preset="night" />
    </>
  );
};

export const FinancialVisualizer = ({ lent, borrowed, capital }: { lent: number, borrowed: number, capital: number }) => {
  return (
    <div className="w-full h-[400px] bg-zinc-950 rounded-3xl overflow-hidden relative border border-white/5 shadow-2xl">
      <div className="absolute top-6 left-6 z-10">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Financial Ecosystem</h4>
        <p className="text-sm font-medium text-white/80 mt-1">Real-time balance visualization</p>
      </div>
      <div className="absolute bottom-6 right-6 z-10 flex gap-4 text-[9px] font-bold uppercase tracking-widest text-white/25">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span>Lent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <span>Borrowed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
          <span>Capital</span>
        </div>
      </div>
      <Canvas dpr={[1, 1.5]} camera={{ fov: 45 }}>
        <DashboardScene lent={lent} borrowed={borrowed} capital={capital} />
      </Canvas>
    </div>
  );
};

// ═══════════════════════════════════════
// SCENE 3: Stats Card Mini 3D (small)
// ═══════════════════════════════════════

const MiniScene = ({ type }: { type: 'lent' | 'borrowed' | 'capital' | 'chit' }) => {
  const configs = {
    lent: { color: '#10b981', bg: '#064e3b' },
    borrowed: { color: '#ef4444', bg: '#7f1d1d' },
    capital: { color: '#8b5cf6', bg: '#4c1d95' },
    chit: { color: '#6366f1', bg: '#312e81' },
  };
  const c = configs[type];

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 4]} />
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 3, 3]} intensity={0.6} color={c.color} />

      {type === 'lent' && <MorphBlob position={[0, 0, 0]} color={c.color} scale={0.8} />}
      {type === 'borrowed' && (
        <Float speed={3} rotationIntensity={2} floatIntensity={1}>
          <mesh>
            <octahedronGeometry args={[0.7, 0]} />
            <MeshDistortMaterial color={c.color} speed={3} distort={0.3} emissive={c.color} emissiveIntensity={0.2} metalness={0.8} roughness={0.2} />
          </mesh>
        </Float>
      )}
      {type === 'capital' && <AnimatedTorusKnot color={c.color} position={[0, 0, 0]} />}
      {type === 'chit' && <WireIco position={[0, 0, 0]} color={c.color} scale={0.7} />}

      <GlowOrb color={c.color} radius={1.5} speed={0.6} />
      <Particles count={40} color={c.color} size={0.03} spread={4} />
    </>
  );
};

export const MiniVisualizer = ({ type }: { type: 'lent' | 'borrowed' | 'capital' | 'chit' }) => {
  return (
    <div className="w-full h-full min-h-[80px]">
      <Canvas dpr={[1, 1.5]} camera={{ fov: 40 }}>
        <MiniScene type={type} />
      </Canvas>
    </div>
  );
};
