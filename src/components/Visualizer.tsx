import { useEffect, useRef, useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
}

type VisMode = 'bars' | 'wave' | 'circle' | 'milkdrop';

export default function Visualizer({ analyser, isPlaying, onFullscreen, isFullscreen }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [mode, setMode] = useState<VisMode>('milkdrop');
  const timeRef = useRef(0);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; hue: number; size: number }>>([]);

  const modes: VisMode[] = ['milkdrop', 'bars', 'wave', 'circle'];
  const modeLabels: Record<VisMode, string> = {
    milkdrop: 'MILKDROP',
    bars: 'BARS',
    wave: 'WAVE',
    circle: 'CIRCLE',
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const t = (timeRef.current += 0.016);

    let dataArray: Uint8Array;
    let bufferLength: number;

    if (analyser) {
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);
    } else {
      bufferLength = 128;
      dataArray = new Uint8Array(bufferLength);
      for (let i = 0; i < bufferLength; i++) {
        dataArray[i] = isPlaying ? Math.sin(t * 2 + i * 0.2) * 40 + 50 : 0;
      }
    }

    if (mode === 'milkdrop') {
      drawMilkdrop(ctx, W, H, t, dataArray, bufferLength);
    } else if (mode === 'bars') {
      drawBars(ctx, W, H, dataArray, bufferLength);
    } else if (mode === 'wave') {
      drawWave(ctx, W, H, dataArray, bufferLength, t);
    } else if (mode === 'circle') {
      drawCircle(ctx, W, H, dataArray, bufferLength, t);
    }

    animRef.current = requestAnimationFrame(draw);
  }, [analyser, isPlaying, mode]);

  function drawMilkdrop(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, data: Uint8Array, len: number) {
    // Fade with trail
    ctx.fillStyle = 'rgba(5, 8, 15, 0.15)';
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;
    const avg = data.reduce((a, b) => a + b, 0) / len / 255;
    const bass = (data[0] + data[1] + data[2]) / 3 / 255;
    const mid = (data[20] + data[30] + data[40]) / 3 / 255;
    const high = (data[60] + data[80] + data[100]) / 3 / 255;

    // Kaleidoscope warped tunnel
    const spokes = 8;
    for (let s = 0; s < spokes; s++) {
      const angle = (s / spokes) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle + t * 0.2 * (s % 2 === 0 ? 1 : -1));

      for (let r = 10; r < Math.min(W, H) * 0.6; r += 8) {
        const di = Math.floor((r / (Math.min(W, H) * 0.6)) * len);
        const v = data[di] / 255;
        const hue = (t * 40 + r * 1.2 + s * 45) % 360;
        const alpha = v * 0.7 + 0.05;

        ctx.beginPath();
        ctx.arc(0, 0, r + v * 12 * bass, angle, angle + (Math.PI * 2) / spokes + 0.02);
        ctx.strokeStyle = `hsla(${hue}, 100%, ${50 + v * 30}%, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Floating plasma orbs
    const numOrbs = 6;
    for (let i = 0; i < numOrbs; i++) {
      const phase = (i / numOrbs) * Math.PI * 2;
      const r = Math.min(W, H) * (0.15 + mid * 0.15);
      const ox = cx + Math.cos(t * 0.5 + phase) * r;
      const oy = cy + Math.sin(t * 0.7 + phase * 1.3) * r * 0.6;
      const hue = (t * 60 + i * 60) % 360;
      const size = 4 + bass * 20 + high * 8;

      const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, size * 3);
      g.addColorStop(0, `hsla(${hue}, 100%, 80%, 0.8)`);
      g.addColorStop(0.4, `hsla(${hue + 30}, 100%, 60%, 0.3)`);
      g.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(ox, oy, size * 3, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }

    // Central pulsing star
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.3);
    const starPoints = 6;
    const innerR = 5 + bass * 25;
    const outerR = 15 + bass * 50 + mid * 20;
    ctx.beginPath();
    for (let i = 0; i < starPoints * 2; i++) {
      const a = (i / (starPoints * 2)) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    const hue = (t * 80) % 360;
    ctx.fillStyle = `hsla(${hue}, 100%, 70%, 0.9)`;
    ctx.shadowBlur = 20;
    ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
    ctx.fill();
    ctx.restore();

    // Particle emission
    if (isPlaying && bass > 0.4) {
      for (let i = 0; i < 3; i++) {
        particlesRef.current.push({
          x: cx + (Math.random() - 0.5) * 40,
          y: cy + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4 - 1,
          life: 1,
          hue: (t * 100 + Math.random() * 60) % 360,
          size: 2 + Math.random() * 4,
        });
      }
    }

    // Update & draw particles
    particlesRef.current = particlesRef.current.filter(p => p.life > 0.01);
    for (const p of particlesRef.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy -= 0.05;
      p.life *= 0.96;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.life})`;
      ctx.fill();
    }

    // Outer ring freq
    for (let i = 0; i < len; i++) {
      const a = (i / len) * Math.PI * 2 - Math.PI / 2;
      const v = data[i] / 255;
      const r1 = Math.min(W, H) * 0.42;
      const r2 = r1 + v * 20;
      const hue = (a * (180 / Math.PI) + t * 60) % 360;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${v * 0.8 + 0.1})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawBars(ctx: CanvasRenderingContext2D, W: number, H: number, data: Uint8Array, len: number) {
    ctx.fillStyle = 'rgba(5, 8, 15, 0.4)';
    ctx.fillRect(0, 0, W, H);

    const bars = Math.min(len, 80);
    const bw = W / bars - 1;
    for (let i = 0; i < bars; i++) {
      const v = data[i] / 255;
      const bh = v * H * 0.9;
      const hue = 160 - v * 60;
      const g = ctx.createLinearGradient(0, H - bh, 0, H);
      g.addColorStop(0, `hsla(${hue}, 100%, 70%, 1)`);
      g.addColorStop(1, `hsla(${hue - 40}, 100%, 40%, 0.8)`);
      ctx.fillStyle = g;
      ctx.fillRect(i * (bw + 1), H - bh, bw, bh);

      ctx.shadowBlur = 8;
      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
    }
    ctx.shadowBlur = 0;
  }

  function drawWave(ctx: CanvasRenderingContext2D, W: number, H: number, data: Uint8Array, len: number, t: number) {
    ctx.fillStyle = 'rgba(5, 8, 15, 0.25)';
    ctx.fillRect(0, 0, W, H);

    let timeData: Uint8Array;
    if (analyser) {
      timeData = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(timeData);
    } else {
      timeData = new Uint8Array(512);
      for (let i = 0; i < 512; i++) {
        timeData[i] = 128 + Math.sin(t * 3 + i * 0.05) * 60;
      }
    }

    for (let layer = 0; layer < 3; layer++) {
      const hue = 166 + layer * 40;
      ctx.beginPath();
      ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${0.8 - layer * 0.2})`;
      ctx.lineWidth = 2 - layer * 0.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;

      const sliceW = W / timeData.length;
      let x = 0;
      for (let i = 0; i < timeData.length; i++) {
        const v = timeData[i] / 128;
        const y = (v * H) / 2 + layer * 8 - layer * 4;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceW;
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  function drawCircle(ctx: CanvasRenderingContext2D, W: number, H: number, data: Uint8Array, len: number, t: number) {
    ctx.fillStyle = 'rgba(5, 8, 15, 0.2)';
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const baseR = Math.min(W, H) * 0.25;

    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath();
      for (let i = 0; i < len; i++) {
        const a = (i / len) * Math.PI * 2 - Math.PI / 2 + t * 0.3 * (layer % 2 === 0 ? 1 : -1);
        const v = data[i] / 255;
        const r = baseR + v * 40 + layer * 15;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      const hue = (166 + layer * 60 + t * 20) % 360;
      ctx.strokeStyle = `hsla(${hue}, 100%, 65%, 0.8)`;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [draw]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="visualizer-canvas"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Mode selector */}
      <div className="absolute top-2 left-2 flex gap-1">
        {modes.map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`btn-wamp px-2 py-0.5 text-[9px] font-mono rounded border transition-all ${
              mode === m
                ? 'border-[var(--neon-green)] text-[var(--neon-green)] bg-[rgba(0,255,179,0.1)]'
                : 'border-[var(--panel-border)] text-[var(--text-dim)] hover:text-[var(--text-mid)]'
            }`}
          >
            {modeLabels[m]}
          </button>
        ))}
      </div>

      {/* Fullscreen button */}
      {onFullscreen && (
        <button
          onClick={onFullscreen}
          className="btn-wamp absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded border border-[var(--panel-border)] text-[var(--text-mid)] hover:text-[var(--neon-green)] hover:border-[var(--neon-green)] transition-all"
        >
          <Icon name={isFullscreen ? 'Minimize2' : 'Maximize2'} size={12} />
        </button>
      )}
    </div>
  );
}
