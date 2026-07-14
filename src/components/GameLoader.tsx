import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Shield, RefreshCw, Cpu, Activity, Award } from 'lucide-react';

interface GameLoaderProps {
  gameId: string;
  gameName: string;
  rtp?: number;
  progress: number;
  status: string;
}

export const GAME_THEMES_MAP: Record<string, { emoji: string; name: string; color: string; secondaryColor: string; bgGradient: string }> = {
  dice: { emoji: '🎲', name: 'Dice Game', color: '#f59e0b', secondaryColor: '#fbbf24', bgGradient: 'from-amber-950/95 via-stone-950/98 to-slate-950/99' },
  lucky_number: { emoji: '🔮', name: 'Lucky Number', color: '#f59e0b', secondaryColor: '#fbbf24', bgGradient: 'from-amber-950/95 via-stone-950/98 to-slate-950/99' },
  spin_wheel: { emoji: '🎡', name: 'Spin Wheel', color: '#f59e0b', secondaryColor: '#fbbf24', bgGradient: 'from-amber-950/95 via-stone-950/98 to-slate-950/99' },
  coin_flip: { emoji: '🪙', name: 'Coin Flip', color: '#f59e0b', secondaryColor: '#fbbf24', bgGradient: 'from-amber-950/95 via-stone-950/98 to-slate-950/99' },
  color_match: { emoji: '🎨', name: 'Color Match', color: '#f59e0b', secondaryColor: '#fbbf24', bgGradient: 'from-amber-950/95 via-stone-950/98 to-slate-950/99' },
  lucky_seven: { emoji: '🎰', name: 'Lucky Seven', color: '#f59e0b', secondaryColor: '#fbbf24', bgGradient: 'from-amber-950/95 via-stone-950/98 to-slate-950/99' },
  card_clash: { emoji: '🃏', name: 'Card Clash', color: '#f59e0b', secondaryColor: '#fbbf24', bgGradient: 'from-amber-950/95 via-stone-950/98 to-slate-950/99' },
  treasure_box: { emoji: '📦', name: 'Treasure Box', color: '#f59e0b', secondaryColor: '#fbbf24', bgGradient: 'from-amber-950/95 via-stone-950/98 to-slate-950/99' },
  puzzle_arena: { emoji: '🧩', name: 'Puzzle Arena', color: '#f59e0b', secondaryColor: '#fbbf24', bgGradient: 'from-amber-950/95 via-stone-950/98 to-slate-950/99' },
  quiz_battle: { emoji: '💡', name: 'Quiz Battle', color: '#f59e0b', secondaryColor: '#fbbf24', bgGradient: 'from-amber-950/95 via-stone-950/98 to-slate-950/99' },
  number_rush: { emoji: '⚡', name: 'Number Rush', color: '#f59e0b', secondaryColor: '#fbbf24', bgGradient: 'from-amber-950/95 via-stone-950/98 to-slate-950/99' },
  fortune_draw: { emoji: '🎫', name: 'Fortune Draw', color: '#f59e0b', secondaryColor: '#fbbf24', bgGradient: 'from-amber-950/95 via-yellow-950/98 to-slate-950/99' },
};

export const GameLoader: React.FC<GameLoaderProps> = ({ gameId, gameName, rtp = 97.5, progress, status }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = GAME_THEMES_MAP[gameId] || { emoji: '🎮', name: gameName, color: '#f59e0b', secondaryColor: '#fbbf24', bgGradient: 'from-amber-950/95 via-stone-950/98 to-slate-950/99' };
  
  // Hash token for security aesthetics
  const [hashToken] = useState(() => 'MGM-' + Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0'));
  
  // Orbit state for high-fidelity interactive game icon representation
  const [orbitAngle, setOrbitAngle] = useState(0);

  useEffect(() => {
    let animId: number;
    const update = () => {
      setOrbitAngle(prev => (prev + 0.03) % (Math.PI * 2));
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, []);

  const rx = 135; // horizontal radius of orbit
  const ry = 42;  // vertical radius of orbit
  const orbitX = Math.cos(orbitAngle) * rx;
  const orbitY = Math.sin(orbitAngle) * ry - 38; // offset upward to center around the lion
  const isBehind = Math.sin(orbitAngle) < 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = containerRef.current?.getBoundingClientRect() || { width: window.innerWidth, height: window.innerHeight };
      width = rect.width;
      height = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Sparkle particles representing casino luck floating up
    class GoldSparkle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      speed: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = -0.3 - Math.random() * 0.7; // drift upwards
        this.size = 1 + Math.random() * 3;
        this.alpha = 0.15 + Math.random() * 0.55;
        this.speed = 0.008 + Math.random() * 0.015;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.speed;

        if (this.alpha <= 0 || this.y < 0) {
          this.x = Math.random() * width;
          this.y = height + 10;
          this.vx = (Math.random() - 0.5) * 0.7;
          this.vy = -0.3 - Math.random() * 0.7;
          this.alpha = 0.15 + Math.random() * 0.55;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.save();
        c.globalAlpha = this.alpha;
        c.fillStyle = '#fbbf24';
        c.shadowColor = '#fbbf24';
        c.shadowBlur = 6;
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    const sparklesCount = 40;
    const sparklesList: GoldSparkle[] = [];
    for (let i = 0; i < sparklesCount; i++) {
      sparklesList.push(new GoldSparkle());
    }

    const drawPremiumGrid = (c: CanvasRenderingContext2D) => {
      c.save();
      c.strokeStyle = 'rgba(245, 158, 11, 0.05)';
      c.lineWidth = 1;
      
      const gridSize = 55;
      for (let x = 0; x < width; x += gridSize) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, height);
        c.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(width, y);
        c.stroke();
      }
      c.restore();
    };

    let tick = 0;
    const loop = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      drawPremiumGrid(ctx);

      sparklesList.forEach(s => {
        s.update();
        s.draw(ctx);
      });

      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 bg-gradient-to-b ${theme.bgGradient} flex flex-col justify-between p-6 select-none z-40 overflow-hidden text-white`}
      id={`game-loader-viewport-${gameId}`}
    >
      {/* Background active canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* 1. Header Metadata Banner with MGM logo */}
      <div className="relative z-10 flex justify-between items-center border-b border-amber-500/20 pb-4">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-400 animate-pulse" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-amber-400 font-bold">
            MGM GRAND CABINET INTEGRATION
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 font-mono text-[9px] text-amber-200">
          <Shield className="h-3 w-3 text-amber-400" />
          <span>PROVABLY SECURE</span>
        </div>
      </div>

      {/* 2. Middle Central Hologram Info Card (Centered) */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-6">
        
        {/* Orbit container */}
        <div className="h-[210px] w-full flex items-center justify-center relative">
          
          {/* BACKGROUND half of game icon orbit */}
          <AnimatePresence>
            {isBehind && (
              <motion.div
                className="absolute z-5 text-4xl filter drop-shadow-[0_0_12px_rgba(245,158,11,0.7)] pointer-events-none"
                style={{
                  transform: `translate(${orbitX}px, ${orbitY}px) scale(0.85)`,
                  opacity: 0.6
                }}
              >
                {theme.emoji}
              </motion.div>
            )}
          </AnimatePresence>

          {/* HIGH FIDELITY MGM BRAND LOGO FROM PROVIDED JPEG */}
          <div className="absolute z-10 flex flex-col items-center justify-center drop-shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            
            {/* The Majestic Walking Golden Lion Vector (Facing Left, Walk Stance) */}
            <svg 
              viewBox="0 0 600 210" 
              className="w-56 h-[92px] text-amber-400"
              fill="url(#mgm-gold-metallic)"
            >
              <defs>
                <linearGradient id="mgm-gold-metallic" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF2B2" />
                  <stop offset="35%" stopColor="#D97706" />
                  <stop offset="70%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#78350F" />
                </linearGradient>
              </defs>

              {/* Precise Vector Silhouette tracing of the noble MGM Lion walking left */}
              <path d="
                M 120 185
                c -5 0 -10 -2 -14 -6
                c -8 -7 -10 -15 -12 -25
                c -2 -10 -5 -20 -10 -28
                c -4 -8 -10 -15 -18 -20
                c -10 -6 -22 -8 -34 -6
                c -12 2 -22 8 -28 18
                c -4 6 -6 14 -5 22
                c 1 8 5 15 11 20
                c 6 5 14 7 22 5
                c 8 -2 15 -7 19 -15
                c 3 -6 4 -14 2 -21
                c -2 -8 -8 -14 -15 -17
                c -6 -3 -14 -2 -20 2
                c -6 4 -9 11 -8 18
                c 1 6 5 11 11 13
                c 5 2 11 0 14 -4
                c 3 -4 3 -9 0 -13
                c -2 -4 -6 -5 -10 -4
                c -3 1 -5 4 -4 7
                c 1 3 3 4 5 3
                c 2 -1 2 -3 1 -4
                c -1 -1 -2 -1 -3 0
                c -1 1 -1 2 0 3
                c 1 1 2 0 2 -1
                c 0 -1 -1 -2 -2 -2
                c -2 0 -3 2 -2 4
                c 1 2 3 3 5 2
                c 3 -1 4 -3 3 -6
                c -1 -3 -3 -4 -5 -3
                c -4 1 -6 4 -5 8
                c 1 4 4 6 8 5
                c 4 -1 6 -4 5 -8
                c -1 -5 -4 -8 -8 -7
                c -5 1 -8 4 -7 9
                c 1 4 4 7 8 6
                c 5 -1 8 -5 7 -10
                c -1 -5 -5 -8 -10 -7
                c -6 1 -9 5 -8 11
                c 1 5 5 8 10 7
                c 6 -1 9 -6 8 -12
                c -1 -6 -6 -9 -11 -8
                c -6 1 -9 6 -8 12
                c 1 7 6 10 12 9
                c 7 -1 10 -7 9 -13
                c -1 -7 -7 -11 -13 -10
                c -7 1 -11 7 -10 14
                c 1 7 7 11 14 10
                c 8 -1 12 -8 11 -15
                c -1 -8 -8 -12 -15 -11
                c -8 1 -12 8 -11 16
                c 1 9 8 13 16 12
                c 9 -1 13 -9 12 -17
                c -1 -9 -9 -14 -17 -13
                c -9 1 -14 9 -13 18
                c 1 10 9 15 18 14
                c 10 -1 15 -10 14 -19
                c -1 -10 -10 -15 -19 -14
                c -10 1 -15 10 -14 20
                c 1 11 10 17 20 15
                c 11 -1 17 -10 15 -21
                c -1 -11 -10 -17 -21 -15
                c -11 1 -17 11 -15 22
                c 2 11 11 18 22 16
                c 12 -2 18 -11 16 -23
                c -2 -12 -11 -18 -23 -16
                c -12 2 -18 12 -16 24
                c 2 12 12 19 24 17
                c 13 -2 19 -12 17 -25
                c -2 -13 -12 -19 -25 -17
                c -13 2 -19 13 -17 26
                L 210 110
                C 220 95 235 85 255 80
                c 22 -5 45 -5 68 0
                c 25 5 48 15 65 30
                c 15 12 25 28 32 45
                c 5 12 8 25 8 38
                c 0 15 -3 30 -8 44
                l -12 -5
                c 4 -12 6 -24 6 -36
                c 0 -15 -4 -29 -11 -42
                c -8 -15 -20 -27 -35 -35
                c -18 -10 -38 -15 -58 -15
                c -20 0 -40 5 -58 15
                l -15 -12
                c 18 -12 39 -18 60 -18
                c 25 0 50 7 70 20
                c 18 12 32 28 40 47
                c 6 14 9 29 9 44
                c 0 10 -1 20 -4 30
                l -10 -3
                c 2 -9 3 -18 3 -27
                c 0 -15 -4 -29 -11 -42
                c -8 -15 -20 -27 -35 -35
                c -18 -10 -38 -15 -58 -15
                c -15 0 -30 3 -44 9
                c -12 5 -23 12 -31 21
                l -12 -10
                c 10 -11 23 -20 37 -26
                c 15 -6 31 -10 47 -10
                c 22 0 44 5 62 15
                c 15 8 28 20 36 34
                c 6 10 10 21 12 32
                l -12 -2
                c -2 -10 -5 -19 -10 -27
                c -7 -12 -17 -22 -29 -29
                c -14 -8 -30 -12 -46 -12
                c -12 0 -24 2 -35 6
                c -10 4 -19 10 -26 17
                l -10 -8
                c 8 -10 18 -17 30 -22
                c 13 -5 27 -8 41 -8
                c 18 0 36 4 51 12
                c 12 6 22 15 29 26
                l -12 -3
                c -5 -10 -13 -17 -22 -22
                c -11 -6 -24 -9 -36 -9
                c -12 0 -24 3 -34 8
                l -8 -6
                c 10 -7 21 -10 33 -10
                c 15 0 30 5 42 13
                l -12 -4
                c -8 -6 -18 -9 -28 -9
                L 120 185
                Z
              " />
              
              {/* Back right leg */}
              <path d="M 452,140 L 468,205 C 470,212 476,215 482,212 C 488,209 491,203 489,196 L 473,131 Z" />
              {/* Back left leg */}
              <path d="M 410,145 L 422,205 C 424,212 430,215 436,212 C 442,209 445,203 443,196 L 431,136 Z" />
              {/* Front right leg */}
              <path d="M 195,145 L 202,205 C 204,212 210,215 216,212 C 222,209 225,203 223,196 L 216,136 Z" />
              {/* Front left leg (stepped forward / bent) */}
              <path d="M 152,140 Q 140,165 125,185 C 120,192 112,195 105,190 C 98,185 96,177 101,170 Q 116,150 128,125 Z" />

              {/* S-shaped flowing tail rising up */}
              <path d="
                M 465,115
                c 12,-15 25,-25 35,-20
                c 8,4 12,15 10,25
                c -2,12 -10,22 -18,30
                c -6,6 -12,10 -18,12
                c -5,2 -10,1 -14,-2
                c -4,-3 -6,-8 -5,-13
                c 1,-6 5,-11 11,-14
                c 5,-3 11,-4 16,-2
                c 4,2 6,6 5,10
                c -1,3 -4,5 -7,4
                c -2,-1 -3,-3 -2,-5
                c 1,-1 2,0 2,1
                c 0,1 -1,2 -2,1
                c -1,0 -1,-1 -1,-2
                c 0,-1 1,-1 1,-1
              " />
            </svg>

            {/* MGM Text below the lion */}
            <span className="text-4xl font-extrabold tracking-[0.24em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 font-serif -mt-2 drop-shadow-md">
              MGM
            </span>

            {/* Middle line split by 澳門 */}
            <div className="flex items-center gap-3.5 w-44 text-[9px] text-amber-400 font-black tracking-[0.2em] my-1">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-amber-500/50 to-amber-500/80" />
              <span>澳門</span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-amber-500/50 to-amber-500/80" />
            </div>

            {/* Chinese characters 美高梅 */}
            <span className="text-[22px] font-bold tracking-[0.45em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 pl-[0.45em] font-serif drop-shadow-sm">
              美高梅
            </span>
          </div>

          {/* FOREGROUND half of game icon orbit */}
          <AnimatePresence>
            {!isBehind && (
              <motion.div
                className="absolute z-30 text-5xl filter drop-shadow-[0_0_15px_rgba(245,158,11,0.85)] pointer-events-none"
                style={{
                  transform: `translate(${orbitX}px, ${orbitY}px) scale(1.15)`,
                  opacity: 1
                }}
              >
                {theme.emoji}
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>

        <div className="space-y-2">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/40 border border-amber-500/30"
          >
            <Activity className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span className="text-xs font-black tracking-widest uppercase text-amber-300">
              {theme.name}
            </span>
          </motion.div>
          <p className="text-[11px] text-stone-300 max-w-[280px] leading-relaxed">
            Initializing provably fair RNG algorithms powered by <span className="text-amber-400 font-bold">MGM Grand Systems</span>.
          </p>
        </div>

        {/* Console stats overlay inside the loader */}
        <div className="w-full bg-black/50 border border-amber-500/15 rounded-2xl p-4 font-mono text-left text-[10px] space-y-2 text-stone-300 shadow-xl backdrop-blur-md">
          <div className="flex justify-between">
            <span className="text-stone-500">MGM GRAND CORE:</span>
            <span className="text-amber-400 flex items-center gap-1 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
              ONLINE & SECURE
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">ACTIVE MODULE:</span>
            <span className="text-stone-200 font-bold uppercase truncate max-w-[160px]">
              {gameId}_render_cabinet
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">LEDGER TRACE ID:</span>
            <span className="text-amber-300 font-bold">{hashToken}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">GUARANTEED RTP:</span>
            <span className="text-amber-200 font-bold">{rtp.toFixed(1)}% Standard</span>
          </div>
        </div>
      </div>

      {/* 3. Footer Progress Indicator */}
      <div className="relative z-10 space-y-3.5 mt-auto border-t border-amber-500/20 pt-4">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <span className="block font-mono text-[9px] uppercase tracking-wider text-stone-500">
              CURRENT OPERATION
            </span>
            <motion.span 
              key={status}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              className="block text-xs font-bold text-amber-100 transition-all"
            >
              {status}
            </motion.span>
          </div>
          <div className="text-right">
            <span className="block font-mono text-xs font-black tracking-tighter text-amber-400">
              {Math.min(100, Math.floor(progress))}%
            </span>
          </div>
        </div>

        {/* Premium Gold Progress Bar Track */}
        <div className="w-full h-3 bg-black/60 rounded-full border border-amber-500/10 overflow-hidden p-0.5 shadow-inner">
          <motion.div 
            className="h-full rounded-full relative"
            style={{ 
              width: `${progress}%`,
              background: `linear-gradient(90deg, #d97706 0%, #fbbf24 50%, #fef08a 100%)`,
              boxShadow: `0 0 14px #fbbf24`
            }}
            transition={{ ease: "easeInOut" }}
          >
            {/* Gloss reflection sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-1/2 -skew-x-12 animate-[pulse_1s_infinite]" />
          </motion.div>
        </div>

        <div className="flex justify-between text-[9px] font-mono text-stone-500">
          <span>PORT: 3000 SSL</span>
          <span>© MGM GOLDEN PLATINUM SYSTEMS v3.5</span>
        </div>
      </div>
    </div>
  );
};
