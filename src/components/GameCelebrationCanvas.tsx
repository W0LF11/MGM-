import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Frown, Sparkle } from 'lucide-react';

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: 'circle' | 'square' | 'triangle' | 'star';
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
}

interface LossPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  type: 'droplet' | 'broken_chip' | 'sad_emoji' | 'broken_heart';
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

interface BigWinPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  type: 'coin' | 'star' | 'diamond' | 'ring' | 'sparkle';
  color: string;
  wobble: number;
  wobbleSpeed: number;
  ringRadius?: number;
}

interface CelebrationProps {
  type: 'win' | 'big_win' | 'loss' | null;
  onClose: () => void;
  winAmount?: number;
  multiplier?: number;
}

export const GameCelebrationCanvas: React.FC<CelebrationProps> = ({ type, onClose, winAmount, multiplier }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-close celebration to avoid irritating the player or blocking rapid gameplay
  useEffect(() => {
    if (!type) return;
    const autoCloseTimer = setTimeout(() => {
      onClose();
    }, 2000); // 2 seconds is perfect for an immersive but fast toast feeling
    return () => clearTimeout(autoCloseTimer);
  }, [type, onClose]);

  useEffect(() => {
    if (!type) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let confettis: ConfettiPiece[] = [];
    let losses: LossPiece[] = [];
    let bigWins: BigWinPiece[] = [];
    let frameCount = 0;
    let width = 0;
    let height = 0;

    const colors = [
      '#fbbf24', // Gold
      '#34d399', // Emerald Green
      '#f43f5e', // Rose Red
      '#38bdf8', // Electric Blue
      '#a78bfa', // Purple
      '#f472b6', // Pink
      '#fb923c', // Orange
    ];

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(container);

    const spawnBigWinParticles = (startX: number, startY: number, count: number, forceMultiplier = 1) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 11 + 5) * forceMultiplier;
        const types: BigWinPiece['type'][] = ['coin', 'coin', 'star', 'diamond', 'sparkle'];
        const itemType = types[Math.floor(Math.random() * types.length)];
        
        bigWins.push({
          x: startX,
          y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          size: Math.random() * 7 + 5,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.22,
          opacity: 1.0,
          type: itemType,
          color: itemType === 'coin' 
            ? '#fbbf24' 
            : (itemType === 'diamond' ? '#38bdf8' : '#fbbf24'),
          wobble: Math.random() * Math.PI,
          wobbleSpeed: Math.random() * 0.12 + 0.04,
        });
      }
      
      bigWins.push({
        x: startX,
        y: startY,
        vx: 0,
        vy: 0,
        size: 1,
        rotation: 0,
        rotationSpeed: 0,
        opacity: 0.9,
        type: 'ring',
        color: '#fbbf24',
        wobble: 0,
        wobbleSpeed: 0,
        ringRadius: 10,
      });
    };

    // Initial bursts
    if (type === 'win') {
      // Create confetti exploding from left & right bottom corners, and center
      const spawnConfetti = (startX: number, startY: number, angleRangeStart: number, angleRangeEnd: number, count: number) => {
        for (let i = 0; i < count; i++) {
          const angle = angleRangeStart + Math.random() * (angleRangeEnd - angleRangeStart);
          const velocity = Math.random() * 12 + 8;
          const shapes: ConfettiPiece['shape'][] = ['circle', 'square', 'triangle', 'star'];
          
          confettis.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            size: Math.random() * 6 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            shape: shapes[Math.floor(Math.random() * shapes.length)],
            opacity: 1.0,
            wobble: Math.random() * Math.PI,
            wobbleSpeed: Math.random() * 0.15 + 0.05,
          });
        }
      };

      // Left-corner shoot, right-corner shoot, center burst
      spawnConfetti(0, height, -Math.PI / 4, -Math.PI / 8, 45);
      spawnConfetti(width, height, -7 * Math.PI / 8, -3 * Math.PI / 4, 45);
      spawnConfetti(width / 2, height / 2 + 50, -Math.PI, 0, 45);

    } else if (type === 'big_win') {
      // Epic big win bursts! Center, left corner, right corner, plus some top spawns
      spawnBigWinParticles(width / 2, height / 2 - 40, 75, 1.25);
      spawnBigWinParticles(0, height, 40, 1.5);
      spawnBigWinParticles(width, height, 40, 1.5);

    } else if (type === 'loss') {
      // Create raining tear droplets and shattered pieces from the top
      for (let i = 0; i < 40; i++) {
        const types: LossPiece['type'][] = ['droplet', 'broken_chip', 'sad_emoji', 'broken_heart'];
        losses.push({
          x: Math.random() * width,
          y: -Math.random() * height * 0.5,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * 3 + 2, // Steady downward drift
          size: Math.random() * 8 + 6,
          type: types[Math.floor(Math.random() * types.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.05,
          opacity: Math.random() * 0.5 + 0.4,
        });
      }
    }

    // DRAWING SHAPES HELPERS
    const drawStar = (cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
    };

    const drawHeart = (cx: number, cy: number, size: number) => {
      ctx.moveTo(cx, cy + size * 0.3);
      ctx.bezierCurveTo(cx - size, cy - size * 0.7, cx - size * 1.3, cy + size * 0.6, cx, cy + size * 1.2);
      ctx.bezierCurveTo(cx + size * 1.3, cy + size * 0.6, cx + size, cy - size * 0.7, cx, cy + size * 0.3);
    };

    const drawLossPiece = (p: LossPiece) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;

      if (p.type === 'droplet') {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.7)'; // Clear sky blue
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo(-p.size * 0.6, p.size * 0.3, -p.size * 0.6, p.size, 0, p.size);
        ctx.bezierCurveTo(p.size * 0.6, p.size, p.size * 0.6, p.size * 0.3, 0, -p.size);
        ctx.fill();
      } else if (p.type === 'broken_heart') {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(244, 63, 94, 0.65)'; // Translucent rose
        drawHeart(0, 0, p.size);
        ctx.fill();

        // Draw crack line
        ctx.beginPath();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, -p.size * 0.5);
        ctx.lineTo(-p.size * 0.1, 0);
        ctx.lineTo(p.size * 0.1, p.size * 0.5);
        ctx.stroke();
      } else if (p.type === 'broken_chip') {
        // Disappointed split casino chip half
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.lineWidth = 2.5;
        ctx.arc(0, 0, p.size, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(0, p.size);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (p.type === 'sad_emoji') {
        ctx.font = `${p.size * 1.5}px "Inter", "Segoe UI Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('😢', 0, 0);
      }

      ctx.restore();
    };

    // ANIMATION LOOP
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (type === 'win') {
        // Render confettis
        confettis.forEach((p, idx) => {
          // Physics
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.28; // Gravity
          p.vx *= 0.98; // Drag
          p.rotation += p.rotationSpeed;
          p.wobble += p.wobbleSpeed;

          // Fade out as they get close to bottom or age
          if (p.y > height - 20) {
            p.opacity -= 0.02;
          }

          if (p.opacity <= 0) {
            confettis.splice(idx, 1);
            return;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          // Wobble effect for fluttery paper motion
          const wobbleX = Math.sin(p.wobble) * p.size * 0.35;

          ctx.beginPath();
          if (p.shape === 'circle') {
            ctx.arc(wobbleX, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === 'square') {
            ctx.fillRect(wobbleX - p.size, -p.size, p.size * 2, p.size * 2);
          } else if (p.shape === 'triangle') {
            ctx.moveTo(wobbleX, -p.size);
            ctx.lineTo(wobbleX + p.size, p.size);
            ctx.lineTo(wobbleX - p.size, p.size);
            ctx.closePath();
            ctx.fill();
          } else if (p.shape === 'star') {
            drawStar(wobbleX, 0, 5, p.size * 1.3, p.size * 0.65);
            ctx.fill();
          }

          ctx.restore();
        });
      } else if (type === 'big_win') {
        frameCount++;

        // 1. Spawning ambient gold rain & diamonds from top
        if (Math.random() < 0.18) {
          const shapes: BigWinPiece['type'][] = ['coin', 'star', 'diamond', 'sparkle'];
          const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
          bigWins.push({
            x: Math.random() * width,
            y: -25,
            vx: (Math.random() - 0.5) * 2.5,
            vy: Math.random() * 3 + 1.5,
            size: Math.random() * 6 + 4,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.15,
            opacity: 1.0,
            type: shapeType,
            color: shapeType === 'coin' 
              ? '#fbbf24' 
              : (shapeType === 'diamond' ? '#38bdf8' : '#fbbf24'),
            wobble: Math.random() * Math.PI,
            wobbleSpeed: Math.random() * 0.08 + 0.03,
          });
        }

        // 2. Continuous firework burst every 100 frames
        if (frameCount % 100 === 0) {
          const rx = Math.random() * (width - 160) + 80;
          const ry = Math.random() * (height / 2);
          spawnBigWinParticles(rx, ry, 25, 0.75);
        }

        // 3. Draw & update all big win pieces
        bigWins.forEach((p, idx) => {
          p.x += p.vx;
          p.y += p.vy;
          
          if (p.type === 'ring') {
            if (p.ringRadius !== undefined) {
              p.ringRadius += 3.5;
            }
            p.opacity -= 0.015;
          } else {
            p.vy += 0.16; // soft gravity
            p.vx *= 0.985; // soft drag
            p.rotation += p.rotationSpeed;
            p.wobble += p.wobbleSpeed;

            // Fade close to bottom
            if (p.y > height - 30) {
              p.opacity -= 0.025;
            }
          }

          if (p.opacity <= 0 || p.y > height + 20) {
            bigWins.splice(idx, 1);
            return;
          }

          // Draw the piece
          if (p.type === 'coin') {
            ctx.save();
            ctx.translate(p.x, p.y);
            // Spin X scale based on rotation
            const spinScale = Math.abs(Math.sin(p.rotation));
            ctx.scale(spinScale > 0.05 ? spinScale : 0.05, 1.0);
            ctx.globalAlpha = p.opacity;

            // Outer golden ring
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fillStyle = '#d97706'; // border dark gold
            ctx.fill();

            // Inner face
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = '#fbbf24'; // main bright gold
            ctx.fill();

            // Inner circle highlight
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
            ctx.strokeStyle = '#fef08a'; // bright gold line
            ctx.lineWidth = 1;
            ctx.stroke();

            // Embossed dollar symbol
            ctx.font = `bold ${p.size * 0.85}px "Inter", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#78350f'; // deep rich gold-brown
            ctx.fillText('$', 0, 0);

            ctx.restore();
          } else if (p.type === 'diamond') {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = p.opacity;

            ctx.beginPath();
            ctx.moveTo(0, -p.size);
            ctx.lineTo(p.size * 0.7, 0);
            ctx.lineTo(0, p.size);
            ctx.lineTo(-p.size * 0.7, 0);
            ctx.closePath();
            ctx.fillStyle = '#38bdf8'; // neon blue
            ctx.fill();

            // Diamond spark shine line
            ctx.beginPath();
            ctx.moveTo(0, -p.size);
            ctx.lineTo(0, p.size);
            ctx.moveTo(-p.size * 0.7, 0);
            ctx.lineTo(p.size * 0.7, 0);
            ctx.strokeStyle = '#e0f2fe';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
          } else if (p.type === 'sparkle') {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = p.opacity;

            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
              ctx.lineTo(0, -p.size);
              ctx.lineTo(p.size * 0.25, -p.size * 0.25);
              ctx.rotate(Math.PI / 2);
            }
            ctx.closePath();
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            ctx.restore();
          } else if (p.type === 'star') {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            drawStar(0, 0, 5, p.size, p.size * 0.45);
            ctx.fill();
            ctx.restore();
          } else if (p.type === 'ring' && p.ringRadius !== undefined) {
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.restore();
          }
        });
      } else if (type === 'loss') {
        // Render falling items
        losses.forEach((p, idx) => {
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotationSpeed;

          // Slowly fade out as they reach bottom
          if (p.y > height - 60) {
            p.opacity -= 0.015;
          }

          if (p.opacity <= 0 || p.y > height + 20) {
            losses.splice(idx, 1);
            // Spawn replacements from top to maintain steady gloomy feel
            if (losses.length < 25 && Math.random() < 0.3) {
              const types: LossPiece['type'][] = ['droplet', 'broken_chip', 'sad_emoji', 'broken_heart'];
              losses.push({
                x: Math.random() * width,
                y: -15,
                vx: (Math.random() - 0.5) * 1.5,
                vy: Math.random() * 2.5 + 1.8,
                size: Math.random() * 8 + 6,
                type: types[Math.floor(Math.random() * types.length)],
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.04,
                opacity: Math.random() * 0.45 + 0.35,
              });
            }
            return;
          }

          drawLossPiece(p);
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [type]);

  return (
    <AnimatePresence>
      {type && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 w-full h-full pointer-events-none z-40 overflow-hidden flex flex-col justify-center items-center"
          id="game-celebration-overlay"
        >
          {/* Transparent interaction canvas layer */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block pointer-events-none"
            id="celebration-canvas"
          />

          {/* Centered High-Fidelity Professional Floating Card announcement */}
          <motion.div
            initial={{ scale: 0.8, x: 50, opacity: 0 }}
            animate={{ scale: 1, x: 0, opacity: 1 }}
            exit={{ scale: 0.8, x: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`p-4 rounded-2xl border shadow-2xl absolute top-6 right-6 z-50 text-left max-w-xs backdrop-blur-md pointer-events-auto ${
              type === 'big_win'
                ? 'bg-amber-950/90 dark:bg-amber-950/95 border-amber-500/50 text-amber-50 shadow-[0_10px_30px_rgba(245,158,11,0.2)]'
                : type === 'win'
                ? 'bg-emerald-950/90 dark:bg-emerald-950/95 border-emerald-500/40 text-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.15)]'
                : 'bg-slate-900/90 dark:bg-slate-950/95 border-slate-800 text-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.3)]'
            }`}
          >
            {type === 'big_win' ? (
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 bg-gradient-to-br from-yellow-400 via-amber-300 to-orange-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.4)] relative shrink-0">
                  <Trophy className="h-6 w-6 text-slate-950" />
                  <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-yellow-200 animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono font-black text-amber-400 uppercase tracking-widest block">
                    🔥 JACKPOT HIT!
                  </span>
                  <h4 className="text-xs font-black text-white uppercase leading-tight">
                    SUPER BIG WIN!
                  </h4>
                  {(winAmount !== undefined && winAmount > 0) ? (
                    <span className="text-sm font-black text-amber-300 font-mono block">
                      +₹{winAmount.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <p className="text-[10px] text-amber-300 font-medium">Balance updated!</p>
                  )}
                </div>
              </div>
            ) : type === 'win' ? (
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] relative shrink-0">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest block">
                    🏆 GAME WON!
                  </span>
                  <h4 className="text-xs font-black text-white uppercase leading-tight">
                    PAYOUT SETTLED
                  </h4>
                  {(winAmount !== undefined && winAmount > 0) ? (
                    <span className="text-sm font-black text-emerald-400 font-mono block">
                      +₹{winAmount.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <p className="text-[10px] text-emerald-300 font-medium">Balance updated!</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 shrink-0">
                  <Frown className="h-6 w-6 text-rose-400" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest block">
                    ❌ GAME ENDED
                  </span>
                  <h4 className="text-xs font-black text-slate-200 uppercase leading-tight">
                    UNLUCKY RESULT
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium leading-normal">
                    Try again next round!
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
