import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  speedMultiplier: number;
  type: 'dust' | 'heart' | 'spade' | 'diamond' | 'club' | 'coin';
  angle: number;
  rotationSpeed: number;
}

interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number; // 1 to 0
  decay: number;
}

interface FloatingText {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  text: string;
  color: string;
  alpha: number;
  life: number; // 1 to 0
  decay: number;
  scale: number;
}

export const GamingDustBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number; isActive: boolean; isClicking: boolean }>({
    x: 0,
    y: 0,
    isActive: false,
    isClicking: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let sparkles: Sparkle[] = [];
    let floatingTexts: FloatingText[] = [];
    let width = 0;
    let height = 0;

    // Vibrant gambling neon colors (emerald green, slot machine gold, cherry red, royal violet, electric blue)
    const colors = [
      'rgba(16, 185, 129, ',  // Emerald Green
      'rgba(245, 158, 11, ',  // Slot Gold
      'rgba(244, 63, 94, ',   // Cherry Red
      'rgba(139, 92, 246, ',  // Violet
      'rgba(56, 189, 248, ',  // Sky/Diamond Blue
    ];

    const createParticle = (initX?: number, initY?: number): Particle => {
      const size = Math.random() * 4 + 1.2;
      const baseAlpha = Math.random() * 0.16 + 0.08;
      const colorIndex = Math.floor(Math.random() * colors.length);
      
      // Select particle type: standard dust, card suits, or golden slot coin
      const rand = Math.random();
      let type: Particle['type'] = 'dust';
      if (rand < 0.12) type = 'coin';
      else if (rand < 0.22) type = 'heart';
      else if (rand < 0.32) type = 'spade';
      else if (rand < 0.42) type = 'diamond';
      else if (rand < 0.52) type = 'club';

      return {
        x: initX ?? Math.random() * width,
        y: initY ?? Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22 - 0.12, // Upward drifting motion
        size,
        color: colors[colorIndex],
        alpha: baseAlpha,
        baseAlpha,
        speedMultiplier: Math.random() * 0.7 + 0.4,
        type,
        angle: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.015,
      };
    };

    const initParticles = (count: number) => {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(createParticle());
      }
    };

    // Use ResizeObserver to automatically resize canvas nicely
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const { width: newWidth, height: newHeight } = entry.contentRect;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = newWidth * dpr;
      canvas.height = newHeight * dpr;
      canvas.style.width = `${newWidth}px`;
      canvas.style.height = `${newHeight}px`;

      ctx.scale(dpr, dpr);
      width = newWidth;
      height = newHeight;

      // Base count of ambient gaming nodes and suits on area
      const density = Math.min(Math.floor((width * height) / 10000), 95);
      initParticles(density);
    });

    resizeObserver.observe(container);

    // Track mouse & touch on window to keep coordinates consistent
    const handleMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Only track active coordinates if reasonably close to the hero or active window space
      if (x >= -150 && x <= width + 150 && y >= -150 && y <= height + 150) {
        mouseRef.current.x = x;
        mouseRef.current.y = y;
        mouseRef.current.isActive = true;

        // Emit delicate sparkling golden dust as the mouse moves
        if (Math.random() < 0.28) {
          const colorIndex = Math.floor(Math.random() * colors.length);
          sparkles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2 - 0.3,
            size: Math.random() * 2.2 + 1.0,
            color: colors[colorIndex],
            alpha: 1.0,
            life: 1.0,
            decay: Math.random() * 0.025 + 0.018,
          });
        }
      } else {
        mouseRef.current.isActive = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!container || e.touches.length === 0) return;
      const rect = container.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;

      if (x >= 0 && x <= width && y >= 0 && y <= height) {
        mouseRef.current.x = x;
        mouseRef.current.y = y;
        mouseRef.current.isActive = true;

        if (Math.random() < 0.3) {
          const colorIndex = Math.floor(Math.random() * colors.length);
          sparkles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 1.0,
            vy: (Math.random() - 0.5) * 1.0 - 0.2,
            size: Math.random() * 1.8 + 0.8,
            color: colors[colorIndex],
            alpha: 1.0,
            life: 1.0,
            decay: Math.random() * 0.03 + 0.02,
          });
        }
      } else {
        mouseRef.current.isActive = false;
      }
    };

    // Text arrays to make interactions feel like a slot/spin live slot machine
    const gameTexts = [
      'JACKPOT!', 'BIG WIN!', 'MEGA WIN!', 'LUCKY 7', '777', 'SPIN!',
      'DOUBLE UP', 'x100', 'x2.5', 'x50', 'BONUS!', 'WILD!', 'BAR'
    ];

    const textColors = [
      '#fbbf24', // Yellow Gold
      '#34d399', // Emerald
      '#f43f5e', // Rose
      '#a78bfa', // Purple
      '#38bdf8', // Blue
    ];

    const handleMouseDown = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= width && y >= 0 && y <= height) {
        mouseRef.current.isClicking = true;
        mouseRef.current.x = x;
        mouseRef.current.y = y;

        // 1. Interactive burst of physical gaming sparkles
        for (let i = 0; i < 15; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 3.5 + 1.2;
          const colorIndex = Math.floor(Math.random() * colors.length);
          sparkles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.4,
            size: Math.random() * 3.2 + 1.5,
            color: colors[colorIndex],
            alpha: 1.0,
            life: 1.0,
            decay: Math.random() * 0.035 + 0.015,
          });
        }

        // 2. Rising glowing game multipliers or action feedback text
        const randomText = gameTexts[Math.floor(Math.random() * gameTexts.length)];
        const randomColor = textColors[Math.floor(Math.random() * textColors.length)];
        floatingTexts.push({
          id: Math.random().toString(),
          x,
          y: y - 10,
          vx: (Math.random() - 0.5) * 1.5,
          vy: - (Math.random() * 1.5 + 1.2),
          text: randomText,
          color: randomColor,
          alpha: 1.0,
          life: 1.0,
          decay: Math.random() * 0.02 + 0.016, // Lasts about 1.5 - 2 seconds
          scale: Math.random() * 0.3 + 0.85,
        });
      }
    };

    const handleMouseUp = () => {
      mouseRef.current.isClicking = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Canvas Path Drawing Helpers for Card Suits & Slot Coins
    const drawDiamond = (cx: number, cy: number, size: number) => {
      ctx.moveTo(cx, cy - size);
      ctx.lineTo(cx + size * 0.75, cy);
      ctx.lineTo(cx, cy + size);
      ctx.lineTo(cx - size * 0.75, cy);
    };

    const drawHeart = (cx: number, cy: number, size: number) => {
      ctx.moveTo(cx, cy + size * 0.4);
      ctx.bezierCurveTo(cx - size, cy - size * 0.8, cx - size * 1.4, cy + size * 0.7, cx, cy + size * 1.3);
      ctx.bezierCurveTo(cx + size * 1.4, cy + size * 0.7, cx + size, cy - size * 0.8, cx, cy + size * 0.4);
    };

    const drawSpade = (cx: number, cy: number, size: number) => {
      ctx.moveTo(cx, cy - size);
      ctx.bezierCurveTo(cx + size * 1.2, cy - size * 0.2, cx + size * 0.5, cy + size * 0.7, cx, cy + size * 0.4);
      ctx.bezierCurveTo(cx - size * 0.5, cy + size * 0.7, cx - size * 1.2, cy - size * 0.2, cx, cy - size);
      // Stem
      ctx.moveTo(cx, cy + size * 0.3);
      ctx.lineTo(cx - size * 0.3, cy + size * 1.0);
      ctx.lineTo(cx + size * 0.3, cy + size * 1.0);
    };

    const drawClub = (cx: number, cy: number, size: number) => {
      // Top circle
      ctx.moveTo(cx + size * 0.4, cy - size * 0.3);
      ctx.arc(cx, cy - size * 0.3, size * 0.42, 0, Math.PI * 2);
      // Left circle
      ctx.moveTo(cx - size * 0.1, cy + size * 0.2);
      ctx.arc(cx - size * 0.4, cy + size * 0.1, size * 0.42, 0, Math.PI * 2);
      // Right circle
      ctx.moveTo(cx + size * 0.7, cy + size * 0.2);
      ctx.arc(cx + size * 0.4, cy + size * 0.1, size * 0.42, 0, Math.PI * 2);
      // Stem
      ctx.moveTo(cx, cy + size * 0.15);
      ctx.lineTo(cx - size * 0.22, cy + size * 0.95);
      ctx.lineTo(cx + size * 0.22, cy + size * 0.95);
    };

    const drawCoin = (cx: number, cy: number, size: number, angle: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      
      // Outer rim
      ctx.arc(0, 0, size * 1.2, 0, Math.PI * 2);
      // Inner star patterns or slot mark
      ctx.moveTo(-size * 0.6, 0);
      ctx.lineTo(size * 0.6, 0);
      ctx.moveTo(0, -size * 0.6);
      ctx.lineTo(0, size * 0.6);
      
      ctx.restore();
    };

    // Main animation loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;

      // 1. Update and render gambling themed ambient particles
      particles.forEach((p) => {
        p.x += p.vx * p.speedMultiplier;
        p.y += p.vy * p.speedMultiplier;
        p.angle += p.rotationSpeed;

        // Smooth boundaries wrapping
        if (p.x < -15) p.x = width + 15;
        if (p.x > width + 15) p.x = -15;
        if (p.y < -15) p.y = height + 15;
        if (p.y > height + 15) p.y = -15;

        // Magnetic hover reaction to mouse cursor
        if (mouse.isActive) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            const force = (150 - distance) / 150;
            const angle = Math.atan2(dy, dx);

            // Connect nearest cards/coins with dynamic matrix-like laser vectors
            if (distance < 75) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.strokeStyle = `${p.color}${force * 0.08})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }

            // Click behavior pushes particles away, hover swirls them
            if (mouse.isClicking) {
              p.x -= Math.cos(angle) * force * 1.8;
              p.y -= Math.sin(angle) * force * 1.8;
              p.alpha = Math.min(0.7, p.alpha + 0.04);
            } else {
              p.x += Math.sin(angle) * force * 0.35;
              p.y -= Math.cos(angle) * force * 0.35;
              p.alpha = Math.min(p.baseAlpha * 2.5, p.alpha + 0.008);
            }
          } else {
            if (p.alpha > p.baseAlpha) p.alpha -= 0.004;
          }
        } else {
          if (p.alpha > p.baseAlpha) p.alpha -= 0.004;
        }

        // Draw individual particle styled by its gaming type
        ctx.beginPath();
        ctx.fillStyle = `${p.color}${p.alpha})`;
        
        ctx.shadowColor = `${p.color}0.4)`;
        ctx.shadowBlur = p.size * 1.5;

        if (p.type === 'dust') {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.beginPath();
          ctx.fillStyle = `${p.color}${p.alpha * 1.4})`; // Make shapes slightly easier to distinguish
          
          if (p.type === 'diamond') {
            drawDiamond(0, 0, p.size * 1.5);
          } else if (p.type === 'heart') {
            drawHeart(0, 0, p.size * 1.4);
          } else if (p.type === 'spade') {
            drawSpade(0, 0, p.size * 1.4);
          } else if (p.type === 'club') {
            drawClub(0, 0, p.size * 1.4);
          } else if (p.type === 'coin') {
            // Draw golden coin outline
            ctx.fillStyle = `rgba(245, 158, 11, ${p.alpha * 1.6})`;
            drawCoin(0, 0, p.size * 1.3, p.angle);
          }
          
          ctx.fill();
          ctx.restore();
        }

        ctx.shadowBlur = 0; // Reset shadow
      });

      // 2. Update and render interactive sparking trails (concentric bursts)
      sparkles.forEach((s, idx) => {
        s.x += s.vx;
        s.y += s.vy;
        s.life -= s.decay;
        s.alpha = s.life;

        if (s.life <= 0) {
          sparkles.splice(idx, 1);
          return;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fillStyle = `${s.color}${s.alpha * 0.8})`;
        ctx.shadowColor = `${s.color}0.7)`;
        ctx.shadowBlur = s.size * 2.5;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 3. Update and render rising high-fidelity slot text feedback
      floatingTexts.forEach((t, idx) => {
        t.x += t.vx;
        t.y += t.vy;
        t.life -= t.decay;
        t.alpha = t.life;

        // Apply slight deceleration/gravity drift
        t.vy *= 0.98;
        t.vx *= 0.98;

        if (t.life <= 0) {
          floatingTexts.splice(idx, 1);
          return;
        }

        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.scale(t.scale * (1 + (1 - t.life) * 0.2), t.scale * (1 + (1 - t.life) * 0.2)); // Dynamic scaling pop
        
        ctx.font = 'black 14px "Inter", "Space Grotesk", sans-serif';
        if (t.text.includes('JACKPOT') || t.text.includes('777')) {
          ctx.font = '900 16px "Space Grotesk", sans-serif';
        }
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // High contrast text glowing stroke & drop shadow
        ctx.shadowColor = `${t.color}80`;
        ctx.shadowBlur = 12;
        
        // Dark outline for gorgeous readability against either dark/light backgrounds
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.lineWidth = 3;
        ctx.strokeText(t.text, 0, 0);

        ctx.fillStyle = t.color;
        ctx.fillText(t.text, 0, 0);

        ctx.restore();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0"
      id="gaming-dust-container"
    >
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full opacity-65 dark:opacity-80 mix-blend-screen dark:mix-blend-lighten pointer-events-none"
        id="gaming-dust-canvas"
      />
    </div>
  );
};
