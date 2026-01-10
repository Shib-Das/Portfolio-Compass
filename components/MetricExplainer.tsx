"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricDefinition {
  description: string;
  insight: string; // The "Good/Bad" or context
  verdict?: "good" | "bad" | "neutral" | "warning"; // Optional explicit verdict
}

// Simple dictionary for common metrics
export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  "Market Cap": {
    description: "The total market value of a company's outstanding shares.",
    insight: "Large caps (>10B) are stable. Small caps (<2B) offer growth but higher risk.",
    verdict: "neutral"
  },
  "PE Ratio": {
    description: "Price-to-Earnings Ratio. The price you pay for $1 of earnings.",
    insight: "Lower (<20) often means 'Value'. Higher (>30) often means 'Growth' or Overvalued.",
    verdict: "neutral"
  },
  "Forward PE": {
    description: "Predicted PE Ratio for the next 12 months.",
    insight: "If Lower than current PE, earnings are expected to grow.",
    verdict: "good"
  },
  "EPS (ttm)": {
    description: "Earnings Per Share over the trailing twelve months.",
    insight: "Positive and growing EPS is the primary driver of stock prices.",
    verdict: "good"
  },
  "Beta": {
    description: "Volatility relative to the overall market (S&P 500).",
    insight: "1.0 is market average. <1.0 is stable/defensive. >1.5 is aggressive/risky.",
    verdict: "neutral"
  },
  "Div Yield": {
    description: "Annual dividend income as a percentage of the stock price.",
    insight: "2-5% is healthy. >8% can be a risk signal (yield trap).",
    verdict: "good"
  },
  "Dividend Yield": {
    description: "Annual dividend income as a percentage of the stock price.",
    insight: "2-5% is healthy. >8% can be a risk signal (yield trap).",
    verdict: "good"
  },
  "Payout Ratio": {
    description: "Percentage of earnings paid out as dividends.",
    insight: "<60% is sustainable. >90% suggests the dividend might be cut.",
    verdict: "neutral"
  },
  "Expense Ratio": {
    description: "Annual fee charged by the fund manager.",
    insight: "Lower is better. <0.10% is excellent. >0.75% is expensive.",
    verdict: "bad"
  },
  "Volume": {
    description: "Number of shares traded daily.",
    insight: "High volume means high liquidity (easy to buy/sell). Low volume spreads are wider.",
    verdict: "good"
  },
  "RSI (14)": {
    description: "Relative Strength Index. Momentum oscillator.",
    insight: ">70 is Overbought (sell signal). <30 is Oversold (buy signal).",
    verdict: "neutral"
  },
  "Revenue": {
    description: "Total money brought in by business operations.",
    insight: "Look for consistent year-over-year growth.",
    verdict: "good"
  }
};

interface MetricExplainerProps {
  label: string;
  value: string;
  subValue?: string;
  highlight?: boolean;
  className?: string;
}

export default function MetricExplainer({
  label,
  value,
  subValue,
  highlight,
  className
}: MetricExplainerProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Normalize label to find definition
  const defKey = Object.keys(METRIC_DEFINITIONS).find(k => k.toLowerCase() === label.toLowerCase()) || label;
  const definition = METRIC_DEFINITIONS[defKey];

  return (
    <div
      className={cn(
        "relative bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 transition-all duration-300 group cursor-help",
        "hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider truncate group-hover:text-emerald-400 transition-colors">
          {label}
        </div>
        {definition && (
           <Info className="w-3 h-3 text-neutral-600 group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all transform scale-50 group-hover:scale-100" />
        )}
      </div>

      <div
        className={cn(
          "text-sm font-bold truncate font-mono",
          highlight ? "text-emerald-400" : "text-white",
          "group-hover:scale-105 origin-left transition-transform"
        )}
      >
        {value}
      </div>

      {subValue && (
        <div className="text-[10px] text-neutral-500 mt-0.5 group-hover:text-neutral-400">{subValue}</div>
      )}

      {/* Biopunk Tooltip */}
      <AnimatePresence>
        {isHovered && definition && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 bottom-full left-0 mb-2 w-64 p-4 rounded-xl bg-[#0c0a09] border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] text-left backdrop-blur-xl"
            style={{ pointerEvents: 'none' }} // Prevent blocking interactions if overlapping
          >
            <div className="absolute inset-0 bg-emerald-500/5 rounded-xl" />

            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-emerald-500/50 rounded-tl-sm" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-emerald-500/50 rounded-tr-sm" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-emerald-500/50 rounded-bl-sm" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-emerald-500/50 rounded-br-sm" />

            <div className="relative">
              <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Wait, what is this?
              </h4>
              <p className="text-stone-300 text-xs leading-relaxed mb-3 font-medium">
                {definition.description}
              </p>

              <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                 <div className="text-[10px] text-emerald-500 font-bold uppercase mb-1">The Verdict</div>
                 <p className="text-stone-400 text-[11px] leading-snug">
                   {definition.insight}
                 </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="absolute left-6 -bottom-1.5 w-3 h-3 bg-[#0c0a09] border-b border-r border-emerald-500/30 rotate-45 transform" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
