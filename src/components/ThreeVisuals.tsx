import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text, Sphere, Torus, PerspectiveCamera, Environment, ContactShadows, MeshTransmissionMaterial, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// --- Flowing Liquid Data Streams ---
const FlowingLines = ({ count = 50, radius = 4, color = "#d4af37" }) => {
  const linesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      linesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <group ref={linesRef}>
      {Array.from({ length: count }).map((_, i) => {
        const yPos = (Math.random() - 0.5) * 8;
        const speed = Math.random() * 0.5 + 0.1;
        const ringRadius = radius + (Math.random() - 0.5);
        return (
          <Torus key={i} position={[0, yPos, 0]} rotation={[Math.PI / 2, 0, 0]} args={[ringRadius, 0.005, 3, 64]}>
            <meshBasicMaterial color={color} transparent opacity={0.15 + Math.random() * 0.2} />
          </Torus>
        );
      })}
    </group>
  );
};

// --- High-End Abstract Coin/Wealth Node ---
const WealthNode = ({ ratio, position, color, label }: any) => {
  const nodeRef = useRef<THREE.Group>(null);
  const liquidRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (nodeRef.current) {
      nodeRef.current.position.y = position[1] + Math.sin(t + position[0]) * 0.2;
    }
    if (liquidRef.current) {
      liquidRef.current.rotation.y = t * 0.5;
      liquidRef.current.rotation.z = t * 0.3;
    }
  });

  const size = 0.5 + (ratio * 0.8);

  return (
    <group position={position} ref={nodeRef}>
      {/* Outer Glass Casing */}
      <Sphere args={[size + 0.1, 64, 64]}>
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.5}
          chromaticAberration={0.05}
          anisotropy={0.2}
          distortion={0.1}
          distortionScale={0.2}
          temporalDistortion={0.1}
          color="#ffffff"
          roughness={0}
          transmission={1}
        />
      </Sphere>

      {/* Inner Liquid Wealth/Gold Core */}
      <Sphere ref={liquidRef} args={[size, 64, 64]}>
        <MeshDistortMaterial
          color={color}
          envMapIntensity={2}
          clearcoat={1}
          clearcoatRoughness={0}
          metalness={0.9}
          roughness={0.1}
          distort={0.4}
          speed={2}
        />
      </Sphere>

      {/* Elegant Label underneath the node */}
      <Text
        position={[0, -size - 0.6, 0]}
        fontSize={0.2}
        color={color}
        letterSpacing={0.15}
        font="https://fonts.gstatic.com/s/inter/v12/UcCOjFwrW2mtfZ84CP92.woff"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {label}
      </Text>
    </group>
  );
};

const FinancialScene = ({ lent, borrowed, capital }: { lent: number, borrowed: number, capital: number }) => {
  const total = Math.max(lent + borrowed + capital, 1);
  const lentRatio = lent / total;
  const borrowedRatio = borrowed / total;
  const capitalRatio = capital / total;

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 7]} />

      {/* Elegant Studio Lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-5, -5, -5]} intensity={0.5} color="#d4af37" />
      <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={2} color="#ffffff" castShadow />

      {/* Abstract Background Flow representing data streams */}
      <FlowingLines count={80} radius={5} />

      {/* Main Capital Structure (Luxurious Vault Core) */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
        <group position={[0, 0, -2]}>
          {/* Deep dark matte inner core */}
          <Sphere args={[2, 64, 64]}>
            <meshStandardMaterial color="#0a0a0a" roughness={0.8} metalness={0.2} />
          </Sphere>

          {/* Golden wireframe constellation mapping over the core */}
          <Sphere args={[2.05, 32, 32]}>
            <meshStandardMaterial color="#d4af37" wireframe opacity={0.15} transparent />
          </Sphere>

          {/* Liquid Gold 'Capital' level wrapper */}
          <Sphere args={[2.1 * capitalRatio + 0.1, 64, 64]} scale={[1, capitalRatio, 1]}>
            <MeshDistortMaterial color="#d4af37" metalness={1} roughness={0} distort={0.2} speed={1.5} opacity={0.8} transparent />
          </Sphere>
        </group>
      </Float>

      {/* Outbound Wealth (Emerald/Teal Glass) */}
      <WealthNode ratio={lentRatio} position={[-2.5, 0, 1]} color="#10b981" label="LENT FUNDS" />

      {/* Inbound Wealth (Ruby/Rose Glass) */}
      <WealthNode ratio={borrowedRatio} position={[2.5, 0, 1]} color="#e11d48" label="BORROWED" />

      {/* Subtle crisp floor reflection */}
      <ContactShadows position={[0, -3.5, 0]} opacity={0.6} scale={15} blur={1.5} far={10} color="#000000" />

      {/* City environment provides premium reflections in the glass/gold */}
      <Environment preset="city" />
    </>
  );
};

export const FinancialVisualizer = ({ lent, borrowed, capital }: { lent: number, borrowed: number, capital: number }) => {
  return (
    <div className="w-full h-[350px] bg-gradient-to-b from-[#0a0a0a] to-[#000000] rounded-[2rem] overflow-hidden relative border border-white/5 shadow-2xl">
      {/* Soft radial glow behind the text */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

      <div className="absolute top-8 left-8 z-10 font-sans">
        <h4 className="text-xs font-black uppercase tracking-[0.25em] text-[#d4af37]">Wealth Matrix</h4>
        <p className="text-sm font-medium text-white/50 mt-1 uppercase tracking-wider">Asset Flow Visualization</p>
      </div>

      <div className="absolute bottom-8 right-8 z-10 flex gap-6 sm:gap-8 text-[9px] sm:text-xs font-bold uppercase tracking-widest text-white/40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span>Lent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.5)]" />
          <span>Borrowed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
          <span>Capital Base</span>
        </div>
      </div>

      <Canvas dpr={[1, 2]} camera={{ fov: 45 }}>
        <FinancialScene lent={lent} borrowed={borrowed} capital={capital} />
      </Canvas>
    </div>
  );
};
