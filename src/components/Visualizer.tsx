import { useEffect, useRef, useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
}

// 8 GLSL пресетов в духе Milkdrop
const PRESETS = [
  {
    name: 'PLASMA TUNNEL',
    frag: `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_res;
      uniform float u_bass, u_mid, u_high, u_avg, u_beat;
      void main() {
        vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
        uv.x *= u_res.x / u_res.y;
        uv *= 1.0 - u_beat * 0.08;
        float t = u_time * 0.4;
        vec2 p = uv;
        float r = length(p);
        float a = atan(p.y, p.x);
        float tunnel = 1.0 / (r + 0.1 + u_bass * 0.3);
        float wave = sin(tunnel * 6.0 - t * 3.0 + a * 3.0 + u_mid * 4.0) * 0.5 + 0.5;
        float wave2 = sin(tunnel * 4.0 + t * 2.0 - a * 5.0) * 0.5 + 0.5;
        float plasma = sin(uv.x * 4.0 + t + u_high * 2.0) * sin(uv.y * 4.0 - t * 0.7);
        vec3 col = vec3(
          wave * 0.5 + plasma * 0.3 + u_bass * 0.4,
          wave2 * 0.4 + u_mid * 0.3,
          (1.0 - wave) * 0.6 + u_high * 0.5
        );
        col *= 1.2 + u_avg * 0.8 + u_beat * 0.6;
        col = pow(col, vec3(0.8));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    name: 'WARP GRID',
    frag: `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_res;
      uniform float u_bass, u_mid, u_high, u_avg, u_beat;
      float grid(vec2 p, float s) {
        vec2 g = abs(fract(p * s) - 0.5);
        return 1.0 - smoothstep(0.0, 0.04, min(g.x, g.y));
      }
      void main() {
        vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
        uv.x *= u_res.x / u_res.y;
        float t = u_time * 0.3;
        vec2 warp = uv + vec2(
          sin(uv.y * 3.0 + t + u_bass * 2.0) * 0.15,
          cos(uv.x * 2.5 - t * 0.8 + u_mid) * 0.15
        );
        float r = length(warp);
        float zoom = 1.0 / (r + 0.3 + u_bass * 0.2);
        vec2 gp = warp * zoom + vec2(t * 0.1, t * 0.07);
        float g1 = grid(gp, 4.0);
        float g2 = grid(gp * 2.0 + 0.25, 4.0) * 0.5;
        float gval = g1 + g2;
        float hue = fract(r * 0.4 - t * 0.2 + u_avg * 0.3);
        vec3 col = vec3(
          abs(sin(hue * 6.28)),
          abs(sin(hue * 6.28 + 2.09)),
          abs(sin(hue * 6.28 + 4.19))
        );
        col *= gval * (1.0 + u_high * 1.5 + u_beat * 1.2);
        col += vec3(0.05, 0.02, 0.1) * (1.0 - gval);
        col += vec3(u_beat * 0.3, u_beat * 0.1, 0.0) * gval;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    name: 'BEAT FLASH',
    frag: `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_res;
      uniform float u_bass, u_mid, u_high, u_avg, u_beat;
      void main() {
        vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
        uv.x *= u_res.x / u_res.y;
        float t = u_time * 0.5;
        float r = length(uv);
        float a = atan(uv.y, uv.x);

        // Shockwave rings on beat
        float shock1 = exp(-abs(r - u_beat * 1.4) * 12.0) * u_beat * 3.0;
        float shock2 = exp(-abs(r - u_beat * 0.8) * 18.0) * u_beat * 2.0;
        float shock3 = exp(-abs(r - u_beat * 0.4) * 22.0) * u_beat * 1.5;

        // Background spiral that reacts to beat
        float spiral = sin(r * 8.0 - t * 3.0 + a * 4.0 + u_mid * 3.0) * 0.5 + 0.5;
        float spiral2 = sin(r * 5.0 + t * 2.0 - a * 3.0 + u_bass * 2.0) * 0.5 + 0.5;

        // Beat-reactive zoom pulse
        float zoom = 1.0 + u_beat * 0.3;
        vec2 zuv = uv / zoom;
        float zr = length(zuv);
        float strobe = exp(-zr * (3.0 - u_beat * 2.0)) * u_beat;

        vec3 beatCol = vec3(1.0, 0.4 + u_mid * 0.4, 0.1) * (shock1 + shock2 + shock3);
        vec3 bgCol = vec3(
          spiral * 0.3 + u_bass * 0.5,
          spiral2 * 0.2 + u_mid * 0.4,
          (1.0 - spiral) * 0.4 + u_high * 0.6
        );
        vec3 strobeCol = vec3(1.0, 0.8, 0.6) * strobe * 0.8;

        // Angular slices that light up on beat
        float slices = abs(sin(a * 12.0 + t + u_beat * 6.28)) * u_beat;
        vec3 sliceCol = vec3(0.5, 1.0, 0.8) * slices * exp(-r * 2.0);

        vec3 col = bgCol + beatCol + strobeCol + sliceCol;
        col *= 0.5 + u_avg * 1.2;
        float vign = 1.0 - smoothstep(0.5, 1.3, r);
        gl_FragColor = vec4(col * vign, 1.0);
      }
    `,
  },
  {
    name: 'NEON RIPPLE',
    frag: `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_res;
      uniform float u_bass, u_mid, u_high, u_avg, u_beat;
      void main() {
        vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
        uv.x *= u_res.x / u_res.y;
        float t = u_time * 0.5;
        float r = length(uv);
        float a = atan(uv.y, uv.x);
        float ripple = sin(r * 12.0 - t * 4.0 + u_bass * 6.0) * 0.5 + 0.5;
        float ripple2 = sin(r * 8.0 + t * 2.5 + u_mid * 4.0 + a * 2.0) * 0.5 + 0.5;
        float ang = sin(a * 6.0 + r * 3.0 - t * 2.0 + u_high * 3.0) * 0.5 + 0.5;
        float glow = 0.05 / (abs(ripple - 0.5) + 0.02 + u_avg * 0.05);
        glow += 0.03 / (abs(ripple2 - 0.5) + 0.02);
        glow = min(glow, 3.0);
        vec3 col = vec3(
          glow * (0.5 + ang * 0.5) * vec3(0.0, 1.0, 0.7) +
          ripple * vec3(0.6, 0.0, 1.0) * 0.3
        );
        col *= 0.4 + u_avg * 1.5 + u_beat * 0.8;
        float vign = 1.0 - smoothstep(0.4 - u_beat * 0.1, 1.2, r);
        gl_FragColor = vec4(col * vign, 1.0);
      }
    `,
  },
  {
    name: 'ACID FRACTAL',
    frag: `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_res;
      uniform float u_bass, u_mid, u_high, u_avg, u_beat;
      void main() {
        vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
        uv.x *= u_res.x / u_res.y;
        float t = u_time * 0.2;
        vec2 z = uv * (1.8 + u_bass * 0.6);
        vec2 c = vec2(
          sin(t * 0.3 + u_mid) * 0.6,
          cos(t * 0.4 + u_high * 0.5) * 0.4
        );
        float iter = 0.0;
        for (int i = 0; i < 48; i++) {
          float x = z.x * z.x - z.y * z.y + c.x;
          float y = 2.0 * z.x * z.y + c.y;
          z = vec2(x, y);
          if (dot(z, z) > 4.0) break;
          iter += 1.0;
        }
        float n = iter / 48.0;
        float hue = fract(n * 3.0 + t * 0.4 + u_avg * 0.5);
        vec3 col = vec3(
          abs(sin(hue * 6.28 + 0.0)),
          abs(sin(hue * 6.28 + 2.09)),
          abs(sin(hue * 6.28 + 4.19))
        );
        col *= n * (1.0 + u_avg * 1.0 + u_beat * 0.7) * 1.3;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    name: 'SOLAR STORM',
    frag: `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_res;
      uniform float u_bass, u_mid, u_high, u_avg, u_beat;
      float noise(vec2 p) {
        return sin(p.x * 2.1 + sin(p.y * 1.7 + u_time * 0.3)) *
               sin(p.y * 1.9 + sin(p.x * 2.3 - u_time * 0.2));
      }
      void main() {
        vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
        uv.x *= u_res.x / u_res.y;
        float t = u_time * 0.25;
        float r = length(uv);
        float a = atan(uv.y, uv.x);
        vec2 polar = vec2(r, a / 6.28);
        float n = 0.0;
        vec2 q = polar;
        n += noise(q * 3.0 + t);
        n += noise(q * 6.0 - t * 0.8 + u_bass) * 0.5;
        n += noise(q * 12.0 + t * 0.5 + u_mid) * 0.25;
        n = n * 0.5 + 0.5;
        float corona = exp(-r * (2.5 - u_bass * 1.0)) * (1.0 + n * u_avg * 2.0);
        vec3 sunCol = mix(
          vec3(1.0, 0.3, 0.0),
          vec3(1.0, 0.9, 0.1),
          n
        );
        vec3 outerCol = mix(
          vec3(0.5, 0.0, 0.8),
          vec3(0.0, 0.3, 1.0),
          n + u_high * 0.5
        );
        vec3 col = mix(outerCol * corona, sunCol, smoothstep(0.3, 0.1, r)) * (1.5 + u_beat * 1.0);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    name: 'HYPERSPACE',
    frag: `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_res;
      uniform float u_bass, u_mid, u_high, u_avg, u_beat;
      void main() {
        vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
        uv.x *= u_res.x / u_res.y;
        float t = u_time * 0.6;
        float speed = 1.0 + u_bass * 3.0;
        float r = length(uv);
        float a = atan(uv.y, uv.x);
        float streak = abs(sin(a * 60.0 + u_mid * 10.0)) * 0.5 + 0.5;
        float tunnel = pow(max(0.0, 1.0 - r), 2.0);
        float stars = step(0.97 - u_avg * 0.05, fract(
          sin(a * 123.4 + floor(r * 20.0) * 456.7) * 789.0
        ));
        float trail = exp(-r * 3.0) * streak;
        float zoom = fract(r - t * speed * 0.15);
        float beam = exp(-zoom * 8.0) * streak * (1.0 + u_high * 2.0);
        float hue = fract(a / 6.28 + t * 0.1 + u_mid * 0.2);
        vec3 starCol = vec3(0.8, 0.9, 1.0) * stars * (1.0 + u_avg);
        vec3 beamCol = vec3(
          abs(sin(hue * 6.28)),
          abs(sin(hue * 6.28 + 2.09)),
          abs(sin(hue * 6.28 + 4.19))
        ) * beam * 2.0;
        vec3 col = starCol + beamCol + trail * 0.1 * vec3(0.2, 0.4, 1.0);
        col *= 0.5 + u_avg * 0.8 + u_beat * 0.6;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
  {
    name: 'CRYSTAL BLOOM',
    frag: `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_res;
      uniform float u_bass, u_mid, u_high, u_avg, u_beat;
      vec2 fold(vec2 p, float n) {
        float a = 3.14159 / n;
        float angle = atan(p.y, p.x);
        angle = mod(angle, 2.0 * a) - a;
        return length(p) * vec2(cos(angle), sin(angle));
      }
      void main() {
        vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
        uv.x *= u_res.x / u_res.y;
        float t = u_time * 0.2;
        vec2 p = uv;
        float scale = 1.0;
        float col_acc = 0.0;
        for (int i = 0; i < 6; i++) {
          p = fold(p, 6.0 + u_mid * 2.0);
          p = abs(p) - vec2(0.5 + u_bass * 0.1, 0.3);
          p *= 1.4 + u_avg * 0.1;
          scale *= 1.4;
          col_acc += exp(-abs(length(p) - 0.5) * 8.0) / scale;
        }
        float hue = fract(col_acc * 0.5 + t * 0.3 + u_high * 0.4);
        vec3 col = vec3(
          abs(sin(hue * 6.28)),
          abs(sin(hue * 6.28 + 2.09)),
          abs(sin(hue * 6.28 + 4.19))
        ) * col_acc * (2.0 + u_avg * 2.0 + u_beat * 1.5);
        col = min(col, vec3(1.5));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  },
];

const VERT = `
  attribute vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

function buildProgram(gl: WebGLRenderingContext, frag: string) {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  return prog;
}

export default function Visualizer({ analyser, isPlaying, onFullscreen, isFullscreen }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programsRef = useRef<WebGLProgram[]>([]);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const fadeRef = useRef<number>(1);
  const fadingRef = useRef<boolean>(false);

  // Beat detection state
  const bassHistoryRef = useRef<number[]>(new Array(43).fill(0));
  const beatRef = useRef<number>(0);         // 0..1, decays each frame
  const beatFlashRef = useRef<number>(0);    // CSS overlay flash 0..1
  const lastBeatTimeRef = useRef<number>(0); // throttle
  const [flashOpacity, setFlashOpacity] = useState(0);

  const [presetIdx, setPresetIdx] = useState(0);
  const [showName, setShowName] = useState(true);
  const presetIdxRef = useRef(0);

  // Auto-switch every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const next = (presetIdxRef.current + 1) % PRESETS.length;
      presetIdxRef.current = next;
      setPresetIdx(next);
      setShowName(true);
      setTimeout(() => setShowName(false), 2000);
    }, 7000);

    setTimeout(() => setShowName(false), 2000);
    return () => clearInterval(interval);
  }, []);

  // Init WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return;
    glRef.current = gl;

    // Build all programs
    programsRef.current = PRESETS.map(p => buildProgram(gl, p.frag));

    // Fullscreen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const resize = () => {
      canvas.width = canvas.offsetWidth * Math.min(window.devicePixelRatio, 2);
      canvas.height = canvas.offsetHeight * Math.min(window.devicePixelRatio, 2);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const render = useCallback(() => {
    const gl = glRef.current;
    const canvas = canvasRef.current;
    if (!gl || !canvas) {
      animRef.current = requestAnimationFrame(render);
      return;
    }

    const W = canvas.width;
    const H = canvas.height;
    const t = (Date.now() - startTimeRef.current) / 1000;

    // Get audio data
    let bass = 0, mid = 0, high = 0, avg = 0;
    if (analyser) {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const len = data.length;
      const bassEnd = Math.floor(len * 0.05);
      const midEnd = Math.floor(len * 0.35);
      for (let i = 0; i < bassEnd; i++) bass += data[i];
      bass = bass / bassEnd / 255;
      for (let i = bassEnd; i < midEnd; i++) mid += data[i];
      mid = mid / (midEnd - bassEnd) / 255;
      for (let i = midEnd; i < len; i++) high += data[i];
      high = high / (len - midEnd) / 255;
      for (let i = 0; i < len; i++) avg += data[i];
      avg = avg / len / 255;
    } else if (isPlaying) {
      bass = (Math.sin(t * 2.1) * 0.5 + 0.5) * 0.4;
      mid  = (Math.sin(t * 1.3 + 1) * 0.5 + 0.5) * 0.3;
      high = (Math.sin(t * 3.7 + 2) * 0.5 + 0.5) * 0.2;
      avg  = (bass + mid + high) / 3;
    }

    // ── Beat detection (energy vs. local average) ──
    const history = bassHistoryRef.current;
    history.push(bass);
    if (history.length > 43) history.shift();
    const localAvg = history.reduce((a, b) => a + b, 0) / history.length;
    const variance = history.reduce((a, b) => a + (b - localAvg) ** 2, 0) / history.length;
    const threshold = localAvg + 1.4 * Math.sqrt(variance + 0.001);
    const now = Date.now();
    const isBeat = bass > threshold && bass > 0.15 && (now - lastBeatTimeRef.current) > 250;

    if (isBeat) {
      lastBeatTimeRef.current = now;
      beatRef.current = 1.0;
      beatFlashRef.current = 1.0;
      setFlashOpacity(1);
    }

    // Decay beat value
    beatRef.current *= 0.82;
    beatFlashRef.current *= 0.75;
    if (beatFlashRef.current < 0.01) {
      setFlashOpacity(0);
    } else {
      setFlashOpacity(beatFlashRef.current);
    }

    const beat = beatRef.current;

    const drawPreset = (idx: number) => {
      const prog = programsRef.current[idx];
      if (!prog) return;
      gl.useProgram(prog);

      const pos = gl.getAttribLocation(prog, 'a_pos');
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

      const set1f = (name: string, val: number) => {
        const loc = gl.getUniformLocation(prog, name);
        if (loc) gl.uniform1f(loc, val);
      };
      const set2f = (name: string, x: number, y: number) => {
        const loc = gl.getUniformLocation(prog, name);
        if (loc) gl.uniform2f(loc, x, y);
      };

      set1f('u_time', t);
      set2f('u_res', W, H);
      set1f('u_bass', bass);
      set1f('u_mid', mid);
      set1f('u_high', high);
      set1f('u_avg', avg);
      set1f('u_beat', beat);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    drawPreset(presetIdxRef.current);

    animRef.current = requestAnimationFrame(render);
  }, [analyser, isPlaying]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [render]);

  const switchPreset = (idx: number) => {
    presetIdxRef.current = idx;
    setPresetIdx(idx);
    setShowName(true);
    setTimeout(() => setShowName(false), 2000);
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Beat flash overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: flashOpacity * 0.18,
          background: 'radial-gradient(ellipse at center, rgba(255,220,80,1) 0%, rgba(255,80,20,0.6) 40%, transparent 70%)',
          transition: flashOpacity > 0.5 ? 'none' : 'opacity 0.15s ease-out',
        }}
      />

      {/* Preset name flash */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-700"
        style={{ opacity: showName ? 1 : 0 }}
      >
        <span
          className="text-[11px] font-mono font-bold tracking-[0.3em] px-3 py-1 rounded"
          style={{
            color: 'var(--neon-green)',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(0,255,179,0.2)',
            textShadow: '0 0 10px var(--neon-green)',
          }}
        >
          {PRESETS[presetIdx]?.name}
        </span>
      </div>

      {/* Preset dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {PRESETS.map((_, i) => (
          <button
            key={i}
            onClick={() => switchPreset(i)}
            className="transition-all btn-wamp"
            style={{
              width: i === presetIdx ? 16 : 5,
              height: 5,
              borderRadius: 3,
              background: i === presetIdx ? 'var(--neon-green)' : 'rgba(255,255,255,0.2)',
              boxShadow: i === presetIdx ? '0 0 6px var(--neon-green)' : 'none',
              padding: 0,
              border: 'none',
            }}
          />
        ))}
      </div>

      {/* Fullscreen button */}
      {onFullscreen && (
        <button
          onClick={onFullscreen}
          className="btn-wamp absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.4)] hover:text-[var(--neon-green)] hover:border-[var(--neon-green)] transition-all"
        >
          <Icon name={isFullscreen ? 'Minimize2' : 'Maximize2'} size={12} />
        </button>
      )}
    </div>
  );
}