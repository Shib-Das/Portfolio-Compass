'use client';

import { useState, useEffect } from 'react';
import { Leaf, Cpu, ShieldCheck } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import BiopunkSlider from './BiopunkSlider';
import NumberTicker from './ui/NumberTicker';

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut" as const
    }
  })
};

const titleWords = [
  { text: "protected", font: "font-display italic", color: "text-bio-cyan" },
  { text: "optimized", font: "font-display italic", color: "text-bio-green" },
  { text: "adaptive", font: "font-display italic", color: "text-bio-red" }
];

export default function Hero({ onStart }: { onStart?: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [marketStatus, setMarketStatus] = useState('OPEN');
  const [titleIndex, setTitleIndex] = useState(0);
  const [riskValue, setRiskValue] = useState(65);
  const [yearsValue, setYearsValue] = useState(10);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 50, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 50, damping: 20 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["3deg", "-3deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-3deg", "3deg"]);

  const y1 = useTransform(mouseY, [-0.5, 0.5], [-20, 20]);
  const y2 = useTransform(mouseY, [-0.5, 0.5], [20, -20]);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % titleWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXFromCenter = e.clientX - rect.left - width / 2;
    const mouseYFromCenter = e.clientY - rect.top - height / 2;
    x.set(mouseXFromCenter / width);
    y.set(mouseYFromCenter / height);
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-void-950 text-text-body font-sans selection:bg-bio-cyan/30 bg-noise"
      onMouseMove={handleMouseMove}
    >

      {/* 1. Organic Background Layer - "The Cellular Grid" */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-structure-900/30 via-void-950 to-void-950" />
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />

        {/* Floating Cells */}
        {mounted && [...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute border border-structure-500/20 rounded-full blur-[1px]"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5,
              opacity: 0.1,
            }}
            animate={{
              y: [null, Math.random() * -100],
              x: [null, Math.random() * 40 - 20],
              opacity: [0.1, 0.3, 0.1],
              scale: [null, Math.random() * 0.2 + 0.5],
            }}
            transition={{
              duration: Math.random() * 20 + 20,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
            }}
          >
             {/* Inner Nucleus */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-structure-500/30 rounded-full" />
          </motion.div>
        ))}
      </div>

      {/* 2. Main Content Wrapper */}
      <div className="container relative z-10 px-4 mx-auto grid lg:grid-cols-2 gap-12 lg:gap-12 items-center pt-24 pb-12 lg:pt-20 lg:pb-0">

        {/* Left Column: Text & CTA */}
        <div className="text-left space-y-6 lg:space-y-8 pointer-events-none">
          <div className="pointer-events-auto">
            <motion.div
              initial="hidden"
              animate="visible"
              custom={0}
              variants={textVariants}
              className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full border border-bio-green/20 bg-bio-green/5 backdrop-blur-md"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bio-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-bio-green"></span>
              </span>
              <span className="text-xs font-mono font-bold tracking-widest text-bio-green uppercase">
                System Nominal • Protected
              </span>
            </motion.div>

            <motion.h1
              custom={1}
              variants={textVariants}
              className="text-5xl sm:text-6xl md:text-8xl font-display font-medium leading-[0.9] mt-6 tracking-tight text-white"
            >
              The Immune <br /> System For <br />
              <div className="relative inline-block">
                Your Capital
                <div className="absolute -bottom-2 left-0 right-0 h-[2px] bg-gradient-to-r from-bio-cyan via-bio-green to-transparent opacity-50" />
              </div>
            </motion.h1>

            <motion.p
              custom={2}
              variants={textVariants}
              className="text-lg sm:text-xl text-text-muted max-w-xl leading-relaxed mt-6 font-light"
            >
              <span className="text-white font-medium">PortfolioCompass</span> acts as a biological shield for your wealth.
              Deploying algorithmic antibodies to neutralize volatility and cultivate compounded growth.
            </motion.p>

            <motion.div
              custom={3}
              variants={textVariants}
              className="flex flex-col sm:flex-row gap-4 mt-8"
            >
              <motion.button
                onClick={onStart}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 rounded-full bg-white text-void-950 font-display font-bold text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden w-full sm:w-auto"
              >
                <span className="relative z-10">Initialize Sequence</span>
                <Leaf className="w-5 h-5 relative z-10 group-hover:rotate-45 transition-transform text-bio-green" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-stone-200/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </motion.button>

              <motion.button
                onClick={onStart}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 rounded-full border border-white/10 text-white font-medium transition-colors backdrop-blur-md cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto hover:border-white/30"
              >
                <Cpu className="w-4 h-4 text-bio-cyan" />
                <span className="font-mono text-sm tracking-wide">READ_PROTOCOL_V1</span>
              </motion.button>
            </motion.div>

            {/* Metrics / Trust Indicators */}
            <motion.div
              custom={4}
              variants={textVariants}
              className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10 mt-12"
            >
              {[
                { label: 'Latency', val: '24ms', icon: ShieldCheck, color: 'text-bio-green' },
                { label: 'Architecture', val: 'Hybrid', icon: Cpu, color: 'text-bio-cyan' },
                { label: 'Status', val: 'Secure', icon: Leaf, color: 'text-white' },
              ].map((item, i) => (
                <div key={i} className="space-y-1 group cursor-default">
                  <div className="flex items-center gap-2 mb-2">
                     <item.icon className={`w-4 h-4 ${item.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                     <div className="text-[10px] sm:text-xs text-text-muted uppercase tracking-wider font-mono">{item.label}</div>
                  </div>
                  <div className={`text-2xl sm:text-3xl font-display font-light text-white group-hover:tracking-wider transition-all duration-300`}>
                    {item.val}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Right Column: Interactive Visuals */}
        <div className="relative h-[400px] lg:h-[600px] flex items-center justify-center perspective-[1000px] w-full pointer-events-none">

          {/* Background Glow */}
          <motion.div
            style={{ y: y2 }}
            className="absolute inset-0 bg-gradient-to-tr from-structure-500/10 to-transparent rounded-full blur-[100px]"
          />

          {/* The "Artifact" - Lab Card + Interactive Slider */}
          <motion.div
            style={{
              y: y1,
              rotateX,
              rotateY,
              transformStyle: "preserve-3d"
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="lab-card w-full max-w-md rounded-xl p-8 pointer-events-auto"
          >

            {/* Scanlines Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20" />


            <div className="space-y-8 relative z-30" style={{ transform: "translateZ(30px)" }}>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-sm font-mono tracking-widest text-bio-cyan uppercase">Sim__Sequence.01</h3>
                <div className="flex gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-bio-cyan animate-pulse" />
                   <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                </div>
              </div>

              <div
                className="h-32 sm:h-40 relative group"
                style={{ transform: "translateZ(20px)" }}
              >
                {/* Simulated Chart */}
                <div className="flex items-end justify-between h-full gap-1 px-1">
                  {[...Array(16)].map((_, i) => {
                    // Logic:
                    // Risk (0-100) -> Annual Return Rate (2% to 15%)
                    // Years (1-50) -> Duration

                    const rate = 0.02 + (riskValue / 100) * 0.13; // 2% to 15%
                    const maxYears = yearsValue;
                    const yearForBar = (i / 15) * maxYears;

                    // Compound Interest: (1 + r)^t
                    const growth = Math.pow(1 + rate, yearForBar);
                    const logGrowth = Math.log10(growth);
                    const maxLogScale = 2.5;

                    const barHeight = 10 + (logGrowth / maxLogScale) * 90;
                    const finalHeight = Math.min(100, barHeight + Math.random() * 2);

                    return (
                      <motion.div
                        key={i}
                        className="w-full bg-bio-cyan/40 hover:bg-bio-cyan/80 transition-colors rounded-sm"
                        animate={{ height: `${finalHeight}%` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      />
                    );
                  })}
                </div>
                {/* Overlay Text */}
                <div className="absolute top-0 right-0 text-right">
                    <div className="text-[10px] text-text-muted font-mono uppercase mb-1">Proj. Yield</div>
                    <div className="text-2xl font-display font-light text-white tracking-tighter">
                        +<NumberTicker value={((Math.pow(1 + (0.02 + (riskValue / 100) * 0.13), yearsValue) - 1) * 100)} />%
                    </div>
                </div>
              </div>

              <div className="space-y-6" style={{ transform: "translateZ(40px)" }}>
                <BiopunkSlider
                  label="Time_Horizon"
                  min={1}
                  max={50}
                  defaultValue={10}
                  unit="Y"
                  onChange={(v) => setYearsValue(v)}
                />

                <BiopunkSlider
                  label="Risk_Tolerance"
                  min={1}
                  max={100}
                  defaultValue={65}
                  unit="%"
                  onChange={(v) => setRiskValue(v)}
                />
              </div>

              <div className="pt-4 flex justify-between text-[10px] font-mono text-text-muted/50 border-t border-white/5 mt-4" style={{ transform: "translateZ(10px)" }}>
                <span>ID: 884-29-X</span>
                <span>SEC: A-1</span>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
