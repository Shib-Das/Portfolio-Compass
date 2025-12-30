'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface BiopunkSliderProps {
  label: string;
  min?: number;
  max?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  className?: string;
  unit?: string;
}

export default function BiopunkSlider({
  label,
  min = 0,
  max = 100,
  defaultValue = 50,
  onChange,
  className = '',
  unit = '%'
}: BiopunkSliderProps) {
  const [value, setValue] = useState(defaultValue);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);

  // Swiss Design Dial aesthetics
  // Track: precise line
  const color = useTransform(
    x,
    [0, trackWidth || 1],
    ['#00f0ff', '#39ff14'] // Bio-cyan to Bio-green
  );

  useEffect(() => {
    if (constraintsRef.current) {
      setTrackWidth(constraintsRef.current.offsetWidth);

      // Handle resize
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setTrackWidth(entry.contentRect.width);
        }
      });
      observer.observe(constraintsRef.current);
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    // Initialize position based on default value
    if (trackWidth > 0) {
      const initialX = ((defaultValue - min) / (max - min)) * trackWidth;
      x.set(initialX);
    }
  }, [trackWidth, defaultValue, min, max]);

  const handleDrag = () => {
    const currentX = x.get();
    if (trackWidth === 0) return;

    const newPercent = Math.max(0, Math.min(100, (currentX / trackWidth) * 100));
    const newValue = Math.round(((newPercent / 100) * (max - min)) + min);

    if (newValue !== value) {
      setValue(newValue);
      onChange?.(newValue);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex justify-between items-end">
        <span className="text-text-muted text-[10px] font-mono uppercase tracking-widest">{label}</span>
        <span className="text-white font-mono text-xs tabular-nums tracking-wide">
          {value}{unit}
        </span>
      </div>

      <div className="relative h-6 flex items-center w-full" ref={constraintsRef}>
        {/* Track Background - Thin Precise Line */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/10 -translate-y-1/2 rounded-full overflow-hidden">
             {/* Tick marks */}
            {[0, 25, 50, 75, 100].map(p => (
                <div key={p} className="absolute top-0 w-[1px] h-full bg-white/20" style={{ left: `${p}%` }} />
            ))}
        </div>

        {/* Active Fill Track (optional, minimal) */}
        <div className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 pointer-events-none">
          <motion.div
            className="h-full bg-white/40"
            style={{ width: x }}
          />
        </div>

        {/* Thumb - "Swiss Dial" */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: trackWidth }}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          onDrag={handleDrag}
          style={{ x }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="absolute top-1/2 left-0 -translate-y-1/2 -ml-3 cursor-grab active:cursor-grabbing z-10"
        >
          {/* Tooltip on Drag */}
          {isDragging && (
             <motion.div
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: -20 }}
               className="absolute left-1/2 -translate-x-1/2 -top-4 bg-void-900 border border-white/20 px-2 py-1 rounded text-[10px] text-white font-mono whitespace-nowrap z-20 pointer-events-none"
             >
                {value}{unit}
             </motion.div>
          )}

          {/* The Dial */}
          <div className="relative w-6 h-6 bg-void-900 rounded-full border border-white/30 flex items-center justify-center shadow-lg hover:border-bio-cyan/50 transition-colors">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />

            {/* Indicator Dot (Optional spin or alignment) */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[1px] h-1 bg-white/50" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
