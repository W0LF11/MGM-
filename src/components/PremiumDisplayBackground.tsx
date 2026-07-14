import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export const PremiumDisplayBackground: React.FC<{ theme?: 'emerald' | 'indigo' | 'rose' | 'amber' | 'sky' | 'violet' }> = ({ theme = 'emerald' }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; duration: number; delay: number }>>([]);

  useEffect(() => {
    const items = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3.5 + 1.5,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 3,
    }));
    setParticles(items);
  }, []);

  const colorMap = {
    emerald: 'bg-emerald-400 shadow-emerald-400/50',
    indigo: 'bg-indigo-400 shadow-indigo-400/50',
    rose: 'bg-rose-400 shadow-rose-400/50',
    amber: 'bg-amber-400 shadow-amber-400/50',
    sky: 'bg-sky-400 shadow-sky-400/50',
    violet: 'bg-violet-400 shadow-violet-400/50',
  };

  const glowClass = colorMap[theme] || colorMap.emerald;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* 1. Base Cyber Dark Grid Overlays */}
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.4)_0%,#020617_100%)]" />
      
      {/* Cyber Grid Texture */}
      <div 
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.1]" 
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      {/* 2. Rotating Radiant Aura */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
        className="absolute -top-24 -left-24 -right-24 -bottom-24 m-auto h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.025)_0%,transparent_60%)]"
      />

      {/* 3. Glowing Core Radial Pulse */}
      <motion.div 
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.6, 0.4]
        }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.08)_0%,transparent_70%)] blur-xl"
        style={{
          backgroundImage: theme === 'indigo' ? 'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)' :
                           theme === 'rose' ? 'radial-gradient(circle,rgba(244,63,94,0.12) 0%,transparent 70%)' :
                           theme === 'amber' ? 'radial-gradient(circle,rgba(245,158,11,0.12) 0%,transparent 70%)' :
                           theme === 'sky' ? 'radial-gradient(circle,rgba(14,165,233,0.12) 0%,transparent 70%)' :
                           theme === 'violet' ? 'radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%)' : undefined
        }}
      />

      {/* 4. Vertical Scan Beam */}
      <motion.div 
        animate={{ y: ['-100%', '250%'] }}
        transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
        className="absolute left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />

      {/* 5. Floating Gaming Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0.1, y: `${p.y}%` }}
          animate={{ 
            opacity: [0.1, 0.8, 0.1], 
            y: [`${p.y}%`, `${Math.max(5, p.y - 20)}%`, `${p.y}%`],
            scale: [1, 1.3, 1]
          }}
          transition={{ 
            duration: p.duration, 
            delay: p.delay, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className={`absolute rounded-full shadow-[0_0_8px_var(--tw-shadow-color)] ${glowClass} blur-[0.5px]`}
          style={{
            left: `${p.x}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
          }}
        />
      ))}
    </div>
  );
};
