import { Suspense, useRef, useState, useEffect, Component, type ReactNode, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Float, Environment } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Eye, Lock, Zap, CheckCircle2, BarChart2, Clock, Users, ArrowRight, Search, MapPin, Maximize2, Minimize2, Crown, Shield, Wifi } from "lucide-react";
import { LogoIcon } from "@/components/Logo";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const LS_KEY = "ps_username";


// ─── Analytics Lookup Component ───────────────────────────────────────────

function AnalyticsLookup() {
  const [, navigate] = useLocation();
  const [ownerToken, setOwnerToken] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = ownerToken.trim();
    if (!token) { setError("Please enter your Tracking UID."); return; }
    setError("");
    navigate(`/dashboard?token=${encodeURIComponent(token)}`);
  };

  return (
    <section className="py-8 sm:py-12 relative" style={{ background: "#080b1e" }}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl mx-auto rounded-2xl border border-white/8 bg-white/5 p-4 sm:p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Already shared a file?</p>
              <p className="text-white/40 text-xs">Enter your Tracking UID to see who viewed it.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={ownerToken}
              onChange={e => { setOwnerToken(e.target.value); setError(""); }}
              placeholder="Paste Tracking UID..."
              autoComplete="off"
              className="flex-1 h-9 rounded-lg bg-white/5 border border-white/10 text-white text-sm px-3 outline-none focus:border-indigo-500 placeholder-white/25 transition-colors min-w-0"
            />
            <button type="submit"
              className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0">
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View</span>
            </button>
          </form>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>
      </div>
    </section>
  );
}

// ─── WebGL Error Boundary ─────────────────────────────────────────────────

class WebGLErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

function CSS3DFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ minHeight: 400 }}>
      <div className="relative flex items-center justify-center" style={{ width: 340, height: 340 }}>
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full bg-indigo-600/20 blur-3xl animate-pulse" />
        {/* Rotating ring 1 */}
        <div className="absolute inset-8 rounded-full border border-indigo-500/40" style={{ animation: "spin 8s linear infinite" }} />
        {/* Rotating ring 2 */}
        <div className="absolute inset-16 rounded-full border border-violet-500/30" style={{ animation: "spin 12s linear infinite reverse" }} />
        {/* Central icon */}
        <div className="relative z-10 w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-2xl shadow-indigo-500/50" style={{ animation: "float 4s ease-in-out infinite" }}>
          <LogoIcon size={64} />
        </div>
        {/* Dot particles */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <div key={deg} className="absolute w-2 h-2 rounded-full bg-indigo-400/70"
            style={{ transform: `rotate(${deg}deg) translateX(130px)`, animation: `pulse ${1.5 + deg / 360}s ease-in-out infinite` }} />
        ))}
      </div>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

// ─── 3D Scene Components ───────────────────────────────────────────────────

function CentralShield() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const innerRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.18;
      meshRef.current.rotation.x = Math.sin(t * 0.25) * 0.12;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.3;
      innerRef.current.rotation.z = t * 0.15;
    }
  });

  return (
    <group>
      {/* Outer glowing shell */}
      <mesh ref={meshRef}>
        <dodecahedronGeometry args={[1.5, 0]} />
        <meshPhysicalMaterial
          color="#0d0824"
          metalness={0.95}
          roughness={0.05}
          emissive="#4338ca"
          emissiveIntensity={0.4}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* Wireframe overlay */}
      <mesh>
        <dodecahedronGeometry args={[1.52, 0]} />
        <meshBasicMaterial color="#818cf8" wireframe transparent opacity={0.18} />
      </mesh>
      {/* Inner floating core */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.3}>
        <mesh ref={innerRef} scale={0.45}>
          <octahedronGeometry args={[1, 0]} />
          <meshPhysicalMaterial
            color="#1e1b4b"
            metalness={1}
            roughness={0}
            emissive="#7c3aed"
            emissiveIntensity={1.2}
            transparent
            opacity={0.9}
          />
        </mesh>
      </Float>
    </group>
  );
}

function OrbitalRings() {
  const ring1 = useRef<THREE.Mesh>(null!);
  const ring2 = useRef<THREE.Mesh>(null!);
  const ring3 = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ring1.current) { ring1.current.rotation.z = t * 0.4; ring1.current.rotation.x = Math.PI / 3; }
    if (ring2.current) { ring2.current.rotation.z = -t * 0.25; ring2.current.rotation.y = Math.PI / 4; }
    if (ring3.current) { ring3.current.rotation.x = t * 0.2; ring3.current.rotation.z = Math.PI / 6; }
  });

  return (
    <group>
      <mesh ref={ring1}>
        <torusGeometry args={[2.4, 0.016, 8, 100]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.55} />
      </mesh>
      <mesh ref={ring2}>
        <torusGeometry args={[3.1, 0.011, 8, 100]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.38} />
      </mesh>
      <mesh ref={ring3}>
        <torusGeometry args={[2.0, 0.02, 8, 100]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function FloatingDots() {
  const group = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = clock.elapsedTime * 0.05;
  });
  const positions = Array.from({ length: 30 }, () => [
    (Math.random() - 0.5) * 8,
    (Math.random() - 0.5) * 8,
    (Math.random() - 0.5) * 8,
  ]);
  return (
    <group ref={group}>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color={i % 2 === 0 ? "#6366f1" : "#a78bfa"} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[4, 4, 4]} intensity={3} color="#6366f1" />
      <pointLight position={[-4, -2, -4]} intensity={2} color="#7c3aed" />
      <pointLight position={[0, 6, -2]} intensity={1.5} color="#818cf8" />

      <Stars radius={60} depth={40} count={2500} factor={3} saturation={0.8} fade speed={0.5} />
      <FloatingDots />

      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.5}>
        <CentralShield />
      </Float>

      <OrbitalRings />

      <Environment preset="night" />
    </>
  );
}

// ─── Floating Info Cards ───────────────────────────────────────────────────

function FloatingCard({ icon, label, value, delay, className }: {
  icon: React.ReactNode; label: string; value: string; delay: number; className: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      className={`absolute backdrop-blur-md bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 shadow-2xl ${className}`}
    >
      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 text-indigo-300 [&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-4 sm:[&>svg]:h-4">
        {icon}
      </div>
      <div>
        <p className="text-[10px] sm:text-xs text-white/50 font-medium leading-none mb-0.5 sm:mb-1">{label}</p>
        <p className="text-xs sm:text-sm font-bold text-white leading-none">{value}</p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.12, ease: "easeOut" } }),
};

function useWebGLSupport() {
  const [supported] = useState(() => {
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl") || (c.getContext as any)("experimental-webgl"));
    } catch { return false; }
  });
  return supported;
}

export default function Home() {
  const webgl = useWebGLSupport();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [username, setUsername] = useState(() => (typeof window !== "undefined" ? localStorage.getItem(LS_KEY) || "" : ""));
  const [planTagVisible, setPlanTagVisible] = useState(() => !!(typeof window !== "undefined" && localStorage.getItem(LS_KEY)));

  useEffect(() => {
    const onStorage = () => {
      const name = localStorage.getItem(LS_KEY) || "";
      setUsername(name);
      if (name) setPlanTagVisible(true);
    };
    window.addEventListener("storage", onStorage);
    const interval = setInterval(() => {
      const name = localStorage.getItem(LS_KEY) || "";
      if (name !== username) { setUsername(name); if (name) setPlanTagVisible(true); }
    }, 800);
    return () => { window.removeEventListener("storage", onStorage); clearInterval(interval); };
  }, [username]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      canvasRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleGetStarted = useCallback(() => {
    setPlanTagVisible(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#06081a", color: "#fff" }}>
      <Navbar />
      <main className="flex-1">

        {/* ─── Hero ──────────────────────────────────────────────── */}
        <section className="relative sm:min-h-[92vh] flex items-center overflow-hidden py-10 sm:py-0">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-700/20 rounded-full blur-[120px]" />
            <div className="absolute right-40 top-1/3 w-[350px] h-[350px] bg-violet-700/15 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-4 md:px-6 relative z-10 w-full">
            {/* Mobile: stacked layout */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

              {/* Left — Text */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs sm:text-sm font-medium mb-4 sm:mb-6"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400"></span>
                  </span>
                  Trusted by 10,000+ freelancers
                </motion.div>

                <motion.h1
                  custom={0}
                  initial="hidden"
                  animate="show"
                  variants={fadeUp}
                  className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-3 sm:mb-5"
                >
                  Share files.{" "}
                  <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                    Stay protected.
                  </span>
                </motion.h1>

                <motion.p
                  custom={1}
                  initial="hidden"
                  animate="show"
                  variants={fadeUp}
                  className="text-sm sm:text-lg text-white/55 leading-relaxed mb-5 sm:mb-8 max-w-lg"
                >
                  The professional layer between your creative work and untrustworthy clients. Watermarked, view-only previews with full analytics — no downloads, no theft.
                </motion.p>

                <motion.div
                  custom={2}
                  initial="hidden"
                  animate="show"
                  variants={fadeUp}
                  className="flex flex-row items-center gap-2 sm:gap-3"
                >
                  <Link href="/share">
                    <button onClick={handleGetStarted} className="group inline-flex items-center gap-1.5 h-9 sm:h-11 px-5 sm:px-6 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 hover:-translate-y-0.5">
                      Start for Free
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                  <Link href="/how-it-works">
                    <button className="h-9 sm:h-11 px-4 sm:px-5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs sm:text-sm transition-all">
                      How It Works
                    </button>
                  </Link>
                </motion.div>

                {/* Social proof row */}
                <motion.div
                  custom={3}
                  initial="hidden"
                  animate="show"
                  variants={fadeUp}
                  className="flex items-center gap-5 sm:gap-6 mt-6 sm:mt-10"
                >
                  {[
                    { n: "10K+", label: "Freelancers" },
                    { n: "500K+", label: "Previews sent" },
                    { n: "99.9%", label: "Uptime" },
                  ].map((s) => (
                    <div key={s.n}>
                      <p className="text-xl sm:text-2xl font-black text-white">{s.n}</p>
                      <p className="text-[10px] sm:text-xs text-white/40 font-medium">{s.label}</p>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Right — 3D Canvas */}
              <div ref={canvasRef} className="relative h-[200px] sm:h-[360px] md:h-[420px] lg:h-[560px] group">
                {webgl ? (
                  <WebGLErrorBoundary fallback={<CSS3DFallback />}>
                    <Canvas camera={{ position: [0, 0, 5.5], fov: 50 }} style={{ borderRadius: "1.25rem", width: "100%", height: "100%" }}>
                      <Suspense fallback={null}>
                        <Scene3D />
                      </Suspense>
                    </Canvas>
                  </WebGLErrorBoundary>
                ) : (
                  <CSS3DFallback />
                )}

                {/* ── Canvas UI Overlay Tags ── */}

                {/* Top-left: WebGL / Interactive badge */}
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-black/50 border border-white/10 backdrop-blur-md text-white/60 text-[9px] sm:text-[10px] font-semibold tracking-wide"
                >
                  <Wifi className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400" />
                  <span className="hidden sm:inline">Interactive 3D</span>
                  <span className="sm:hidden">3D Live</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                </motion.div>

                {/* Top-right: Fullscreen button */}
                <motion.button
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-black/50 border border-white/10 backdrop-blur-md text-white/60 hover:text-white hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-all text-[9px] sm:text-[10px] font-semibold"
                >
                  {isFullscreen
                    ? <><Minimize2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /><span className="hidden sm:inline">Exit</span></>
                    : <><Maximize2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /><span className="hidden sm:inline">Fullscreen</span></>}
                </motion.button>

                {/* Bottom-left: Shield status */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 z-10 flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-black/50 border border-indigo-500/25 backdrop-blur-md text-[9px] sm:text-[10px] font-semibold"
                >
                  <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-400" />
                  <span className="text-indigo-300">Shield Active</span>
                </motion.div>

                {/* Bottom-right: Current Plan tag — visible when user is known */}
                <AnimatePresence>
                  {planTagVisible && (
                    <motion.div
                      key="plan-tag"
                      initial={{ opacity: 0, scale: 0.85, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ type: "spring", stiffness: 300, damping: 24 }}
                      className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 z-10 flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 backdrop-blur-md text-[9px] sm:text-[10px] font-bold"
                    >
                      <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                      <span className="text-amber-300">
                        {username ? `${username.split(" ")[0]} · ` : ""}Free Plan
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Floating cards — hidden on mobile, shown sm+ */}
                <div className="hidden sm:block">
                  <FloatingCard
                    icon={<Eye className="w-4 h-4" />}
                    label="Views Tracked"
                    value="Real-time"
                    delay={1.0}
                    className="top-8 right-0 min-w-[150px]"
                  />
                  <FloatingCard
                    icon={<Lock className="w-4 h-4" />}
                    label="Copy Protected"
                    value="Always On"
                    delay={1.2}
                    className="bottom-24 right-0 min-w-[150px]"
                  />
                  <FloatingCard
                    icon={<BarChart2 className="w-4 h-4" />}
                    label="Analytics"
                    value="Name · IP · City"
                    delay={1.4}
                    className="bottom-4 left-2 min-w-[170px]"
                  />
                  <FloatingCard
                    icon={<Clock className="w-4 h-4" />}
                    label="Auto Expiry"
                    value="24h Default"
                    delay={1.6}
                    className="top-12 left-2 min-w-[150px]"
                  />
                </div>

                {/* Mobile-only: two compact stat pills below canvas */}
                <div className="flex sm:hidden justify-center gap-2 mt-2">
                  {[
                    { icon: <Eye className="w-3 h-3" />, label: "Real-time views" },
                    { icon: <Lock className="w-3 h-3" />, label: "Copy protected" },
                  ].map((p, i) => (
                    <div key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-[10px] font-medium">
                      <span className="text-indigo-400">{p.icon}</span>
                      {p.label}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─── Analytics Lookup ──────────────────────────────────── */}
        <AnalyticsLookup />

        {/* ─── Feature Cards ─────────────────────────────────────── */}
        <section className="py-14 sm:py-20 md:py-28 relative overflow-hidden" style={{ background: "#080b1e" }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1e1b4b20_0%,_transparent_70%)] pointer-events-none" />
          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-indigo-400 font-semibold text-sm tracking-widest uppercase mb-4"
              >
                Why PreviewShield
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-3 sm:mb-5"
              >
                Built to protect your work
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-white/50 text-sm sm:text-lg"
              >
                Every feature designed to keep your creative assets safe before payment lands.
              </motion.p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                {
                  icon: <LogoIcon size={24} />,
                  color: "from-indigo-600/20 to-indigo-800/5",
                  border: "border-indigo-500/20",
                  glow: "shadow-indigo-500/10",
                  iconColor: "text-indigo-400",
                  title: "Encrypted File Streaming",
                  desc: "Files are served via short-lived encrypted tokens. Even DevTools can't expose the real URL — it expires in minutes.",
                },
                {
                  icon: <Eye className="w-6 h-6" />,
                  color: "from-violet-600/20 to-violet-800/5",
                  border: "border-violet-500/20",
                  glow: "shadow-violet-500/10",
                  iconColor: "text-violet-400",
                  title: "Dynamic Watermarks",
                  desc: "Your name is stamped across the content at a diagonal. Every screenshot is traceable back to the recipient.",
                },
                {
                  icon: <Lock className="w-6 h-6" />,
                  color: "from-purple-600/20 to-purple-800/5",
                  border: "border-purple-500/20",
                  glow: "shadow-purple-500/10",
                  iconColor: "text-purple-400",
                  title: "Password Protection",
                  desc: "Layer an additional password gate in front of any preview link — hashed and secure, never stored in plain text.",
                },
                {
                  icon: <Clock className="w-6 h-6" />,
                  color: "from-blue-600/20 to-blue-800/5",
                  border: "border-blue-500/20",
                  glow: "shadow-blue-500/10",
                  iconColor: "text-blue-400",
                  title: "Auto-Expiry & Deletion",
                  desc: "Links die on schedule and the file is deleted from the server. Set 1 hour to 7 days, or never — your choice.",
                },
                {
                  icon: <BarChart2 className="w-6 h-6" />,
                  color: "from-cyan-600/20 to-cyan-800/5",
                  border: "border-cyan-500/20",
                  glow: "shadow-cyan-500/10",
                  iconColor: "text-cyan-400",
                  title: "Viewer Analytics",
                  desc: "Know exactly who opened your link: their name, IP address, browser, and precise timestamp — in real time.",
                },
                {
                  icon: <Users className="w-6 h-6" />,
                  color: "from-pink-600/20 to-pink-800/5",
                  border: "border-pink-500/20",
                  glow: "shadow-pink-500/10",
                  iconColor: "text-pink-400",
                  title: "Client Consent Gate",
                  desc: "Clients must acknowledge data collection and enter their name before viewing — creating a digital paper trail.",
                },
              ].map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className={`group relative p-5 sm:p-6 rounded-2xl border ${feat.border} bg-gradient-to-br ${feat.color} backdrop-blur-sm hover:shadow-xl ${feat.glow} transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/2 rounded-2xl" />
                  <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 ${feat.iconColor}`}>
                    {feat.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{feat.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Use Cases / Who is it for ─────────────────────────── */}
        <section className="py-14 sm:py-20 md:py-28 overflow-hidden" style={{ background: "#06081a" }}>
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <p className="text-indigo-400 font-semibold text-xs sm:text-sm tracking-widest uppercase mb-3 sm:mb-4">Who it's for</p>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6">
                  Built for creative{" "}
                  <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                    professionals
                  </span>
                </h2>
                <p className="text-sm sm:text-lg text-white/50 mb-6 sm:mb-10 leading-relaxed">
                  Whether you're delivering a brand identity, a motion reel, or a proposal draft — PreviewShield keeps you in control until payment clears.
                </p>
                <ul className="space-y-5">
                  {[
                    "Designers sharing logos and brand assets",
                    "Video editors sending rough cuts for approval",
                    "Copywriters pitching article and content drafts",
                    "Developers showcasing UI mockups and prototypes",
                    "Agencies managing multi-client deliverables",
                  ].map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <span className="text-white/70 font-medium">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {/* Visual mockup */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-violet-600/10 rounded-3xl blur-3xl" />
                <div className="relative rounded-2xl border border-white/10 bg-white/3 backdrop-blur p-6 space-y-4">
                  {/* Analytics preview */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <BarChart2 className="w-4 h-4 text-indigo-400" />
                      </div>
                      <span className="font-bold text-white text-sm">Preview Analytics</span>
                    </div>
                    <span className="text-xs text-indigo-400 border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 rounded-full">Live</span>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { n: "24", label: "Total Views", color: "text-indigo-400" },
                      { n: "8", label: "Unique IPs", color: "text-violet-400" },
                      { n: "3h", label: "Last Viewed", color: "text-cyan-400" },
                    ].map((s) => (
                      <div key={s.n} className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
                        <p className={`text-2xl font-black ${s.color}`}>{s.n}</p>
                        <p className="text-[10px] text-white/40 mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Visitor list */}
                  <div className="space-y-2 mt-4">
                    {[
                      { name: "Acme Corp", ip: "185.42.xx.xx", loc: "New York, US", time: "2 min ago", color: "bg-green-400" },
                      { name: "Studio X", ip: "94.201.xx.xx", loc: "London, UK", time: "1 hr ago", color: "bg-indigo-400" },
                      { name: "John Client", ip: "72.14.xx.xx", loc: "Toronto, CA", time: "4 hrs ago", color: "bg-violet-400" },
                    ].map((v, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/3 rounded-xl p-3 border border-white/5">
                        <div className={`w-8 h-8 rounded-full ${v.color}/20 border border-white/10 flex items-center justify-center text-xs font-bold text-white`}>
                          {v.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{v.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/40 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5 text-indigo-400/60" />{v.loc}</span>
                          </div>
                        </div>
                        <span className="text-xs text-white/30 shrink-0">{v.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── Pricing ──────────────────────────────────────────── */}
        <section id="pricing" className="py-14 sm:py-20 md:py-28 relative overflow-hidden" style={{ background: "#06081a" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-700/10 rounded-full blur-[100px]" />
          </div>
          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="text-center mb-12">
              <p className="text-indigo-400 font-semibold text-xs tracking-widest uppercase mb-3">Simple pricing</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
                Start free.{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  No credit card.
                </span>
              </h2>
              <p className="text-white/50 text-base max-w-xl mx-auto">
                Every feature you need to protect your work and track clients — always free.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
              {/* Free Plan */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 to-violet-600/10 p-6 sm:p-8 overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-gradient-to-bl from-indigo-500/20 to-transparent w-32 h-32 rounded-bl-full" />
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Current Plan
                </div>
                <p className="text-4xl font-black text-white mb-1">$0<span className="text-lg font-medium text-white/40">/mo</span></p>
                <p className="text-white/50 text-sm mb-6">Free forever · No card required</p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Unlimited secure previews",
                    "Password protection",
                    "Link expiry (24h/48h/7d)",
                    "IP + location tracking",
                    "Client name gate",
                    "Real-time visitor analytics",
                    "File upload or URL embed",
                    "Watermarked image previews",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/share">
                  <button className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
                    Get Started Free
                  </button>
                </Link>
              </motion.div>

              {/* Pro Plan — Coming Soon */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative rounded-2xl border border-white/10 bg-white/3 p-6 sm:p-8 overflow-hidden"
              >
                <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ background: "radial-gradient(ellipse at top right, rgba(139,92,246,0.08) 0%, transparent 60%)" }} />
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-xs font-semibold mb-5">
                  Coming Soon
                </div>
                <p className="text-4xl font-black text-white/30 mb-1">$9<span className="text-lg font-medium text-white/20">/mo</span></p>
                <p className="text-white/30 text-sm mb-6">Pro plan · Early access</p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Everything in Free",
                    "Custom branded preview page",
                    "Geo-block by country",
                    "Download after payment",
                    "Team collaboration",
                    "Priority support",
                    "Advanced export reports",
                    "Custom domain for share links",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/30">
                      <CheckCircle2 className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button disabled className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-white/30 text-sm font-semibold cursor-not-allowed">
                  Notify Me
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── CTA ───────────────────────────────────────────────── */}
        <section className="py-32 relative overflow-hidden" style={{ background: "#080b1e" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#3730a340_0%,_transparent_70%)]" />
          </div>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-indigo-400 font-semibold text-sm tracking-widest uppercase mb-4">Get started free</p>
              <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight">
                Stop giving away your work before getting paid.
              </h2>
              <p className="text-sm sm:text-xl text-white/50 mb-6 sm:mb-10">
                Join thousands of freelancers who use PreviewShield to protect their deliverables, track viewers, and close deals safely.
              </p>
              <Link href="/share">
                <button className="group inline-flex items-center gap-2 h-11 sm:h-14 px-7 sm:px-10 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm sm:text-lg shadow-2xl shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 hover:-translate-y-1">
                  Create Your First Preview
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </motion.div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
