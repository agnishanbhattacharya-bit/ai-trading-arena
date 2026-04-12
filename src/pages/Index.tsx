import { useEffect, useState, useRef, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { AuthForm } from "@/components/AuthForm";
import { ChevronRight, ArrowRight } from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Environment } from "@react-three/drei";
import * as THREE from "three";

// 3D Animated Sphere
function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.15;
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.2;
    }
  });
  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={1.5}>
      <Sphere ref={meshRef} args={[1.8, 128, 128]}>
        <MeshDistortMaterial
          color="#d4d4d8"
          roughness={0.15}
          metalness={0.95}
          distort={0.25}
          speed={1.5}
          envMapIntensity={1}
        />
      </Sphere>
    </Float>
  );
}

// Floating particles
function Particles() {
  const count = 80;
  const meshRef = useRef<THREE.Points>(null);
  const positions = useRef(new Float32Array(count * 3));

  useEffect(() => {
    for (let i = 0; i < count * 3; i += 3) {
      positions.current[i] = (Math.random() - 0.5) * 12;
      positions.current[i + 1] = (Math.random() - 0.5) * 12;
      positions.current[i + 2] = (Math.random() - 0.5) * 12;
    }
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.03;
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#a1a1aa" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

const features = [
  { title: "AI Execution", desc: "Natural language to live paper trades in milliseconds" },
  { title: "Real-Time Charts", desc: "Professional-grade interactive candlestick charts" },
  { title: "Global Leaderboard", desc: "Compete with traders worldwide" },
  { title: "Zero Risk", desc: "Paper trading with $100K virtual capital" },
];

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (user && !loading) navigate("/dashboard");
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <pointLight position={[-5, -5, 5]} intensity={0.4} color="#71717a" />
          <Suspense fallback={null}>
            <AnimatedSphere />
            <Particles />
            <Environment preset="city" />
          </Suspense>
        </Canvas>
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background/90" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm text-foreground tracking-wide">Vanguard</span>
        </div>
        <button
          onClick={() => setShowAuth(true)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide"
        >
          Sign In
        </button>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6">
        <AnimatePresence mode="wait">
          {!showAuth ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98, filter: "blur(12px)" }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl text-center"
            >
              {/* Status */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] mb-10"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 pulse-glow" />
                <span className="text-xs text-foreground/50 tracking-widest uppercase">Season 1 — Live</span>
              </motion.div>

              {/* Typography */}
              <div className="space-y-1 mb-8">
                {["The AI", "Trading", "Terminal"].map((word, i) => (
                  <motion.h1
                    key={word}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.4 + i * 0.1,
                      type: "spring",
                      stiffness: 120,
                      damping: 20,
                    }}
                    className="text-5xl md:text-7xl lg:text-8xl font-semibold leading-[0.95] tracking-tight text-foreground"
                  >
                    {word}
                  </motion.h1>
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-muted-foreground text-sm md:text-base max-w-md mx-auto mb-12 leading-relaxed"
              >
                Describe your strategy in plain English. AI parses, validates, and executes paper trades instantly.
              </motion.p>

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAuth(true)}
                className="group inline-flex items-center gap-3 bg-foreground text-background px-8 py-3.5 rounded-full font-medium text-sm transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]"
              >
                Get Started
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </motion.button>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20"
              >
                {features.map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 + i * 0.08 }}
                    className="glass-card p-5 text-left"
                  >
                    <h3 className="font-medium text-xs text-foreground mb-1.5">{f.title}</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.95, filter: "blur(12px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
              className="w-full max-w-sm"
            >
              <button
                onClick={() => setShowAuth(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-6 flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 rotate-180" />
                Back
              </button>
              <div className="glass-card p-8">
                <div className="flex items-center gap-2 mb-8">
                  <span className="font-semibold text-base text-foreground">Vanguard</span>
                </div>
                <AuthForm />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
