import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BiopunkHeadingProps {
  children: React.ReactNode;
  subtitle?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  light?: boolean;
}

export default function BiopunkHeading({
  children,
  subtitle,
  className,
  size = "lg",
  light = false
}: BiopunkHeadingProps) {

  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl md:text-5xl",
    xl: "text-5xl md:text-7xl"
  };

  return (
    <div className={cn("relative group", className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10"
      >
        <h2 className={cn(
          "font-display font-bold tracking-tight uppercase leading-none",
          sizeClasses[size],
          light ? "text-stone-100" : "text-transparent bg-clip-text bg-gradient-to-b from-white via-stone-200 to-stone-500"
        )}>
          {children}
          <span className="text-emerald-500 text-[0.6em] align-top ml-1 animate-pulse">.</span>
        </h2>

        {subtitle && (
          <div className="flex items-center gap-3 mt-2">
            <div className="h-[1px] w-8 bg-emerald-500/50" />
            <p className="text-stone-400 font-mono text-sm tracking-widest uppercase">
              {subtitle}
            </p>
          </div>
        )}
      </motion.div>

      {/* Decorative background glow/elements */}
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    </div>
  );
}
