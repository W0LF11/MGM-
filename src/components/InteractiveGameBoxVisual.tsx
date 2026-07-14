import React, { useEffect, useRef } from 'react';

interface InteractiveGameBoxVisualProps {
  gameId: string;
}

export const InteractiveGameBoxVisual: React.FC<InteractiveGameBoxVisualProps> = ({ gameId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let tick = 0;

    // Resizing relative to the card container
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      const w = rect?.width || 180;
      const h = rect?.height || 200;
      const dpr = window.devicePixelRatio || 1;
      
      width = w;
      height = h;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();

    // Set up local state for animations
    // 1. Dice states
    let diceValue = 1;
    let diceRotation = 0;
    let diceScale = 1;
    let nextDiceChange = 60;

    // 2. Lucky number states
    const luckyParticles: Array<{ x: number; y: number; val: string; alpha: number; scale: number; vy: number }> = [];
    let nextLuckyNumberSpawn = 30;

    // 3. Coin flip states
    let coinRotationY = 0;

    // 4. Chest states
    let chestOpenAmount = 0;
    let chestState: 'opening' | 'open' | 'closing' | 'closed' = 'closed';
    let chestTimer = 0;

    // 5. Card clash states
    let cardSlide = 0;
    let cardClashed = false;
    let cardSparks: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }> = [];

    // 6. Slot state
    let slotOffset1 = 0;
    let slotOffset2 = 0;
    let slotOffset3 = 0;
    let slotSpinning = false;
    let slotTimer = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      tick++;

      // Global composition settings for blending inside background
      ctx.globalAlpha = 0.45; // Subtle overlay

      // Render custom animation based on gameId
      switch (gameId) {
        case 'dice': {
          // Dice animation: Continuous tumbling with changing faces
          nextDiceChange--;
          if (nextDiceChange <= 0) {
            diceValue = Math.floor(Math.random() * 6) + 1;
            nextDiceChange = 70 + Math.floor(Math.random() * 40);
            diceScale = 1.35; // Bump scale
          }

          // Ease dice scale back to 1
          diceScale += (1 - diceScale) * 0.1;
          diceRotation += 0.015;

          const cx = width * 0.82;
          const cy = height * 0.32;
          const size = 26 * diceScale;

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(diceRotation + Math.sin(tick * 0.02) * 0.2);

          // Shadow / Glow
          ctx.shadowColor = 'rgba(139, 92, 246, 0.6)';
          ctx.shadowBlur = 15;

          // Dice base
          ctx.beginPath();
          ctx.roundRect(-size / 2, -size / 2, size, size, 8);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Reset shadow
          ctx.shadowBlur = 0;

          // Draw dice dots
          ctx.fillStyle = '#4c1d95'; // Dark purple dots
          const dotSize = size * 0.12;

          const drawDot = (dx: number, dy: number) => {
            ctx.beginPath();
            ctx.arc(dx, dy, dotSize, 0, Math.PI * 2);
            ctx.fill();
          };

          const offset = size * 0.25;

          if (diceValue === 1) {
            drawDot(0, 0);
          } else if (diceValue === 2) {
            drawDot(-offset, -offset);
            drawDot(offset, offset);
          } else if (diceValue === 3) {
            drawDot(-offset, -offset);
            drawDot(0, 0);
            drawDot(offset, offset);
          } else if (diceValue === 4) {
            drawDot(-offset, -offset);
            drawDot(offset, -offset);
            drawDot(-offset, offset);
            drawDot(offset, offset);
          } else if (diceValue === 5) {
            drawDot(-offset, -offset);
            drawDot(offset, -offset);
            drawDot(0, 0);
            drawDot(-offset, offset);
            drawDot(offset, offset);
          } else {
            drawDot(-offset, -offset);
            drawDot(offset, -offset);
            drawDot(-offset, 0);
            drawDot(offset, 0);
            drawDot(-offset, offset);
            drawDot(offset, offset);
          }

          ctx.restore();
          break;
        }

        case 'lucky_number': {
          // Glass Crystal ball with floating glowing numbers
          const cx = width * 0.82;
          const cy = height * 0.3;
          const radius = 24;

          // Glowing glass ball sphere base
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(cx - 5, cy - 5, 2, cx, cy, radius);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
          gradient.addColorStop(0.4, 'rgba(165, 180, 252, 0.45)');
          gradient.addColorStop(1, 'rgba(79, 70, 229, 0.2)');
          ctx.fillStyle = gradient;
          ctx.shadowColor = 'rgba(99, 102, 241, 0.8)';
          ctx.shadowBlur = 18;
          ctx.fill();
          ctx.restore();

          // Spawning floating lucky numbers
          nextLuckyNumberSpawn--;
          if (nextLuckyNumberSpawn <= 0) {
            luckyParticles.push({
              x: cx + (Math.random() - 0.5) * 12,
              y: cy,
              val: String(Math.floor(Math.random() * 99) + 1),
              alpha: 1.0,
              scale: 0.5,
              vy: -0.45 - Math.random() * 0.3,
            });
            nextLuckyNumberSpawn = 80 + Math.floor(Math.random() * 40);
          }

          // Update & draw lucky digits
          ctx.save();
          luckyParticles.forEach((p, idx) => {
            p.y += p.vy;
            p.alpha -= 0.009;
            p.scale += (1.1 - p.scale) * 0.04;

            if (p.alpha <= 0) {
              luckyParticles.splice(idx, 1);
              return;
            }

            ctx.font = `900 ${14 * p.scale}px "Space Grotesk", sans-serif`;
            ctx.fillStyle = `rgba(254, 240, 138, ${p.alpha})`; // glowing bright yellow
            ctx.shadowColor = 'rgba(253, 224, 71, 0.8)';
            ctx.shadowBlur = 8;
            ctx.textAlign = 'center';
            ctx.fillText(p.val, p.x, p.y);
          });
          ctx.restore();
          break;
        }

        case 'spin_wheel': {
          // Spinning fortune roulette wheel
          const cx = width * 0.82;
          const cy = height * 0.32;
          const radius = 28;

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(tick * 0.025); // continuous spinning

          // Outer ring
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fillStyle = '#0f172a';
          ctx.fill();
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Drawing color wedges
          const wedges = 8;
          for (let i = 0; i < wedges; i++) {
            const angle = (Math.PI * 2 / wedges) * i;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius - 1.5, angle, angle + (Math.PI * 2 / wedges));
            ctx.fillStyle = i % 2 === 0 ? 'rgba(244, 63, 94, 0.45)' : 'rgba(251, 113, 133, 0.2)';
            ctx.fill();
          }

          // Center golden pin
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 6;
          ctx.fill();

          ctx.restore();
          break;
        }

        case 'coin_flip': {
          // Flipping golden coin on Y-axis
          const cx = width * 0.82;
          const cy = height * 0.32;
          const radius = 24;

          coinRotationY += 0.035;
          const scaleX = Math.cos(coinRotationY);

          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(scaleX, 1);

          // Coin outer face
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(-2, -2, 2, 0, 0, radius);
          gradient.addColorStop(0, '#fef08a'); // Light gold
          gradient.addColorStop(0.5, '#f59e0b'); // Amber
          gradient.addColorStop(1, '#b45309'); // Deep gold/brown
          ctx.fillStyle = gradient;
          ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
          ctx.shadowBlur = 12;
          ctx.fill();

          // Inner ridge decoration
          ctx.beginPath();
          ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Center currency mark
          ctx.font = '900 15px "Space Grotesk", sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 0, 0);

          ctx.restore();
          break;
        }

        case 'color_match': {
          // Concentric rotating prism chroma rings
          const cx = width * 0.82;
          const cy = height * 0.32;

          ctx.save();
          ctx.translate(cx, cy);

          // Ring 1 (Emerald Green, inner)
          ctx.beginPath();
          ctx.arc(0, 0, 16, tick * 0.015, tick * 0.015 + Math.PI * 1.2);
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Ring 2 (Amber Gold, middle)
          ctx.beginPath();
          ctx.arc(0, 0, 22, -tick * 0.02, -tick * 0.02 + Math.PI * 0.9);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Center core spark prism
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fillStyle = 'white';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.fill();

          ctx.restore();
          break;
        }

        case 'lucky_seven': {
          // Slot machine vertical numbers reel spinning continuously
          const cx = width * 0.82;
          const cy = height * 0.32;
          const boxW = 42;
          const boxH = 46;

          ctx.save();
          ctx.translate(cx, cy);

          // Slot reel backdrop card
          ctx.beginPath();
          ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 6);
          ctx.fillStyle = '#0f172a';
          ctx.fill();
          ctx.strokeStyle = '#f472b6';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Clip to keep reel content contained
          ctx.beginPath();
          ctx.rect(-boxW / 2, -boxH / 2, boxW, boxH);
          ctx.clip();

          // Scrolling numbers offset
          slotOffset1 += 0.4;
          if (slotOffset1 >= boxH) slotOffset1 = 0;

          const slotSymbols = ['7', 'BAR', '🍒', '7', '💎'];

          ctx.font = '900 14px "Space Grotesk", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          slotSymbols.forEach((sym, idx) => {
            const y = -boxH + slotOffset1 + (idx * (boxH / 2));
            ctx.fillStyle = sym === '7' ? '#ec4899' : '#ffffff';
            ctx.fillText(sym, 0, y);
          });

          ctx.restore();
          break;
        }

        case 'card_clash': {
          // Vector cards sliding into center and clashing with sparks
          const cx = width * 0.82;
          const cy = height * 0.32;

          cardSlide += 0.025;
          const xOffset = Math.sin(cardSlide) * 20;

          ctx.save();
          ctx.translate(cx, cy);

          // Card 1: Player (Left sliding right)
          ctx.save();
          ctx.translate(-14 + xOffset, -2);
          ctx.rotate(-0.08);
          // Card plate
          ctx.beginPath();
          ctx.roundRect(-10, -15, 20, 30, 4);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // Face details
          ctx.fillStyle = '#0284c7';
          ctx.font = 'bold 8px "Inter", sans-serif';
          ctx.fillText('A', -6, -8);
          ctx.restore();

          // Card 2: Dealer (Right sliding left)
          ctx.save();
          ctx.translate(14 - xOffset, 2);
          ctx.rotate(0.08);
          // Card plate
          ctx.beginPath();
          ctx.roundRect(-10, -15, 20, 30, 4);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // Face details
          ctx.fillStyle = '#e11d48';
          ctx.font = 'bold 8px "Inter", sans-serif';
          ctx.fillText('K', -6, -8);
          ctx.restore();

          // Detect collision around center to generate active spark bursts
          const distance = Math.abs(xOffset);
          if (distance < 2.5 && !cardClashed) {
            cardClashed = true;
            for (let i = 0; i < 8; i++) {
              cardSparks.push({
                x: (Math.random() - 0.5) * 4,
                y: (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 1.0,
                color: Math.random() < 0.5 ? '#f59e0b' : '#ffffff',
              });
            }
          } else if (distance > 10) {
            cardClashed = false;
          }

          // Render active sparks
          cardSparks.forEach((s, idx) => {
            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.035;

            if (s.life <= 0) {
              cardSparks.splice(idx, 1);
              return;
            }

            ctx.beginPath();
            ctx.arc(s.x, s.y, 2 * s.life, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.shadowColor = s.color;
            ctx.shadowBlur = 4;
            ctx.fill();
          });

          ctx.restore();
          break;
        }

        case 'treasure_box': {
          // Locked chest that periodically opens, shoots a beam of light/particles, and closes
          const cx = width * 0.82;
          const cy = height * 0.35;
          const boxW = 34;
          const boxH = 26;

          chestTimer--;
          if (chestTimer <= 0) {
            if (chestState === 'closed') {
              chestState = 'opening';
              chestTimer = 35;
            } else if (chestState === 'open') {
              chestState = 'closing';
              chestTimer = 25;
            } else if (chestState === 'opening') {
              chestState = 'open';
              chestTimer = 60; // Stay open emitting light
            } else {
              chestState = 'closed';
              chestTimer = 80; // Stay closed for a bit
            }
          }

          // Ease chest open amount
          if (chestState === 'opening') {
            chestOpenAmount = Math.min(1.0, chestOpenAmount + 0.05);
          } else if (chestState === 'closing') {
            chestOpenAmount = Math.max(0.0, chestOpenAmount - 0.06);
          }

          ctx.save();
          ctx.translate(cx, cy);

          // Golden treasure rays if open
          if (chestOpenAmount > 0.1) {
            ctx.save();
            ctx.globalAlpha = chestOpenAmount * 0.5;
            const rayGradient = ctx.createLinearGradient(0, 0, 0, -35);
            rayGradient.addColorStop(0, 'rgba(253, 224, 71, 0.7)');
            rayGradient.addColorStop(1, 'rgba(253, 224, 71, 0.0)');
            ctx.fillStyle = rayGradient;
            ctx.beginPath();
            ctx.moveTo(-12, 0);
            ctx.lineTo(12, 0);
            ctx.lineTo(18, -35);
            ctx.lineTo(-18, -35);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // Tiny golden sparkle floaters
            if (Math.random() < 0.25) {
              cardSparks.push({
                x: (Math.random() - 0.5) * 16,
                y: -4,
                vx: (Math.random() - 0.5) * 0.8,
                vy: -Math.random() * 0.8 - 0.4,
                life: 1.0,
                color: '#fbbf24',
              });
            }
          }

          // Base of Chest
          ctx.beginPath();
          ctx.roundRect(-boxW / 2, -1, boxW, boxH / 2, 3);
          ctx.fillStyle = '#7c2d12'; // Rich mahogany wood
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Lid of Chest (Pivot at top)
          ctx.save();
          ctx.translate(0, -1);
          ctx.rotate(-chestOpenAmount * 0.65); // Pivot rotation based on open progress
          
          ctx.beginPath();
          ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH / 2, 4);
          ctx.fillStyle = '#9a3412';
          ctx.fill();
          ctx.stroke();

          // Iron band decoration
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(-boxW / 4, -boxH / 2, 4, boxH / 2);
          ctx.fillRect(boxW / 4 - 4, -boxH / 2, 4, boxH / 2);

          ctx.restore();

          // Render active chest sparkles
          cardSparks.forEach((s, idx) => {
            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.02;

            if (s.life <= 0) {
              cardSparks.splice(idx, 1);
              return;
            }

            ctx.beginPath();
            ctx.arc(s.x, s.y, 1.8 * s.life, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.fill();
          });

          ctx.restore();
          break;
        }

        case 'puzzle_arena': {
          // Sliding puzzle pieces rotating or shifting positions inside a neat grid
          const cx = width * 0.82;
          const cy = height * 0.32;
          const size = 36;
          const pieceSize = 10;
          const offsetTick = tick * 0.03;

          ctx.save();
          ctx.translate(cx, cy);

          // Grid frame
          ctx.beginPath();
          ctx.roundRect(-size / 2, -size / 2, size, size, 4);
          ctx.fillStyle = '#1e1b4b';
          ctx.fill();
          ctx.strokeStyle = '#a78bfa';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // 4 Sliding blocks moving with trigonometric offsets
          const pos = [
            { x: -size/4 + Math.sin(offsetTick) * 3, y: -size/4 },
            { x: size/4, y: -size/4 + Math.cos(offsetTick) * 3 },
            { x: -size/4, y: size/4 - Math.cos(offsetTick) * 3 },
            { x: size/4 - Math.sin(offsetTick) * 3, y: size/4 }
          ];

          pos.forEach((p, idx) => {
            ctx.beginPath();
            ctx.roundRect(p.x - pieceSize/2, p.y - pieceSize/2, pieceSize, pieceSize, 2);
            ctx.fillStyle = idx === 3 ? '#ec4899' : '#8b5cf6'; // One highlight key piece
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          });

          ctx.restore();
          break;
        }

        case 'quiz_battle': {
          // Glowing lightbulb shape with floating/pulsing "?" marks
          const cx = width * 0.82;
          const cy = height * 0.35;
          
          ctx.save();
          ctx.translate(cx, cy);

          // Pulsing glow background
          const pulse = Math.abs(Math.sin(tick * 0.04));
          ctx.beginPath();
          ctx.arc(0, -6, 12 + pulse * 6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34, 211, 238, ${0.15 + pulse * 0.25})`;
          ctx.fill();

          // Draw Lightbulb dome
          ctx.beginPath();
          ctx.arc(0, -6, 10, 0.3 * Math.PI, 0.7 * Math.PI, true);
          ctx.lineTo(-4, 4);
          ctx.lineTo(4, 4);
          ctx.closePath();
          ctx.fillStyle = '#e2e8f0';
          ctx.fill();
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Filaments inside
          ctx.beginPath();
          ctx.moveTo(-3, -6);
          ctx.lineTo(0, -11);
          ctx.lineTo(3, -6);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Base cap
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-5, 4, 10, 4);
          ctx.fillRect(-3, 8, 6, 2);

          // Small question marks floating up
          if (Math.random() < 0.06) {
            luckyParticles.push({
              x: cx + (Math.random() - 0.5) * 20,
              y: cy - 10,
              val: '?',
              alpha: 1.0,
              scale: 0.8,
              vy: -0.6 - Math.random() * 0.6
            });
          }

          ctx.restore();

          // Update & draw lucky digits
          ctx.save();
          luckyParticles.forEach((p, idx) => {
            p.y += p.vy;
            p.alpha -= 0.012;
            p.scale += (1.1 - p.scale) * 0.04;

            if (p.alpha <= 0) {
              luckyParticles.splice(idx, 1);
              return;
            }

            ctx.font = `900 ${14 * p.scale}px "Space Grotesk", sans-serif`;
            ctx.fillStyle = `rgba(34, 211, 238, ${p.alpha})`; // cyan question marks
            ctx.shadowColor = 'rgba(34, 211, 238, 0.8)';
            ctx.shadowBlur = 8;
            ctx.textAlign = 'center';
            ctx.fillText(p.val, p.x, p.y);
          });
          ctx.restore();
          break;
        }

        case 'number_rush': {
          // Neon timer counting up or numbers flashing with speed waves
          const cx = width * 0.82;
          const cy = height * 0.32;
          const radius = 24;

          ctx.save();
          ctx.translate(cx, cy);

          // Speed dial circle
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Speed meter arc
          ctx.beginPath();
          ctx.arc(0, 0, radius - 4, -Math.PI / 2, -Math.PI / 2 + ((tick % 100) / 100) * Math.PI * 2);
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Flashing digit
          const digit = (Math.floor(tick / 15) % 10).toString();
          ctx.font = '900 16px "JetBrains Mono", monospace';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 12;
          ctx.fillText(digit, 0, 0);

          ctx.restore();
          break;
        }

        case 'fortune_draw': {
          // Shiny scratch ticket with gold dust stars falling
          const cx = width * 0.82;
          const cy = height * 0.32;
          const boxW = 38;
          const boxH = 26;

          ctx.save();
          ctx.translate(cx, cy);

          // Card shape
          ctx.beginPath();
          ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 4);
          ctx.fillStyle = '#1e293b';
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Drawing shiny scratch areas (3 circles)
          ctx.beginPath();
          ctx.arc(-10, 0, 5, 0, Math.PI * 2);
          ctx.arc(10, 0, 5, 0, Math.PI * 2);
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(251, 191, 36, 0.7)'; // Shiny gold scratch area
          ctx.fill();

          // Draw a small scratch stroke path
          const strokeX = Math.sin(tick * 0.05) * 12;
          ctx.beginPath();
          ctx.arc(strokeX, 0, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 8;
          ctx.fill();

          // Tiny gold stars floating out
          if (Math.random() < 0.1) {
            luckyParticles.push({
              x: cx + strokeX + (Math.random() - 0.5) * 4,
              y: cy + (Math.random() - 0.5) * 4,
              val: '★',
              alpha: 1.0,
              scale: 0.6,
              vy: -0.4 - Math.random() * 0.4
            });
          }

          ctx.restore();

          // Update & draw lucky digits (stars)
          ctx.save();
          luckyParticles.forEach((p, idx) => {
            p.y += p.vy;
            p.alpha -= 0.015;
            p.scale += (1.1 - p.scale) * 0.04;

            if (p.alpha <= 0) {
              luckyParticles.splice(idx, 1);
              return;
            }

            ctx.font = `900 ${14 * p.scale}px "Space Grotesk", sans-serif`;
            ctx.fillStyle = `rgba(251, 191, 36, ${p.alpha})`; // golden stars
            ctx.shadowColor = 'rgba(251, 191, 36, 0.8)';
            ctx.shadowBlur = 8;
            ctx.textAlign = 'center';
            ctx.fillText(p.val, p.x, p.y);
          });
          ctx.restore();
          break;
        }

        default:
          break;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameId]);

  return (
    <canvas 
      ref={canvasRef}
      className="absolute top-0 right-0 h-full w-[150px] pointer-events-none z-10 select-none mix-blend-screen"
      style={{
        maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
        WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)'
      }}
    />
  );
};
