import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text, MeshDistortMaterial, Sphere, PerspectiveCamera, Environment, ContactShadows, Stars, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

const Particles = ({ count = 100 }) => {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 10;
      p[i * 3 + 1] = (Math.random() - 0.5) * 10;
      p[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return p;
  }, [count]);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.001;
      ref.current.rotation.x += 0.0005;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#ffffff" transparent opacity={0.3} />
    </points>
  );
};

const FinancialScene = ({ lent, borrowed, capital }: { lent: number, borrowed: number, capital: number }) => {
  const total = Math.max(lent + borrowed + capital, 1);
  const lentRatio = lent / total;
  const borrowedRatio = borrowed / total;
  const capitalRatio = capital / total;

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
      
      <Particles count={200} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Capital Representation (Large Glassy Sphere in background) */}
      <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
        <Sphere args={[2 * capitalRatio + 1, 64, 64]} position={[0, 0, -2]}>
          <MeshTransmissionMaterial
            backside
            samples={4}
            thickness={1}
            chromaticAberration={0.02}
            anisotropy={0.1}
            distortion={0.1}
            distortionScale={0.1}
            temporalDistortion={0.1}
            color="#ffffff"
            roughness={0}
            transmission={1}
          />
        </Sphere>
      </Float>

      {/* Lent Representation (Green Sphere) */}
      <Float speed={3} rotationIntensity={2} floatIntensity={2}>
        <Sphere args={[1.2 * lentRatio + 0.4, 64, 64]} position={[-2, 0.5, 0]}>
          <MeshDistortMaterial
            color="#10b981"
            speed={3}
            distort={0.4}
            radius={1}
            emissive="#10b981"
            emissiveIntensity={0.2}
          />
        </Sphere>
      </Float>
      <Text
        position={[-2, -1.5, 0]}
        fontSize={0.25}
        color="#10b981"
        font="https://fonts.gstatic.com/s/inter/v12/UcCOjFwrW2mtfZ84CP92.woff"
      >
        LENT
      </Text>

      {/* Borrowed Representation (Red Sphere) */}
      <Float speed={3} rotationIntensity={2} floatIntensity={2}>
        <Sphere args={[1.2 * borrowedRatio + 0.4, 64, 64]} position={[2, 0.5, 0]}>
          <MeshDistortMaterial
            color="#ef4444"
            speed={3}
            distort={0.4}
            radius={1}
            emissive="#ef4444"
            emissiveIntensity={0.2}
          />
        </Sphere>
      </Float>
      <Text
        position={[2, -1.5, 0]}
        fontSize={0.25}
        color="#ef4444"
        font="https://fonts.gstatic.com/s/inter/v12/UcCOjFwrW2mtfZ84CP92.woff"
      >
        BORROWED
      </Text>

      <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={15} blur={2.5} far={4.5} />
      <Environment preset="night" />
    </>
  );
};

export const FinancialVisualizer = ({ lent, borrowed, capital }: { lent: number, borrowed: number, capital: number }) => {
  return (
    <div className="w-full h-[350px] bg-zinc-950 rounded-3xl overflow-hidden relative border border-white/5 shadow-2xl">
      <div className="absolute top-8 left-8 z-10">
        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Live Financial Ecosystem</h4>
        <p className="text-sm font-medium text-white/80 mt-1">Real-time balance visualization</p>
      </div>
      <div className="absolute bottom-8 right-8 z-10 flex gap-6 text-[10px] font-bold uppercase tracking-widest text-white/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span>Lent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <span>Borrowed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white/20" />
          <span>Capital</span>
        </div>
      </div>
      <Canvas dpr={[1, 2]} camera={{ fov: 45 }}>
        <FinancialScene lent={lent} borrowed={borrowed} capital={capital} />
      </Canvas>
    </div>
  );
};
