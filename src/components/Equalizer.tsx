import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface EqualizerProps {
  enabled: boolean;
  onToggle: () => void;
  gains: number[];
  onGainChange: (index: number, value: number) => void;
  presets: { name: string; gains: number[] }[];
  onPresetSelect: (gains: number[]) => void;
}

const BANDS = ['32', '64', '125', '250', '500', '1K', '2K', '4K', '8K', '16K'];

export default function Equalizer({ enabled, onToggle, gains, onGainChange, presets, onPresetSelect }: EqualizerProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handlePreset = (preset: { name: string; gains: number[] }) => {
    onPresetSelect(preset.gains);
    setActivePreset(preset.name);
  };

  const handleReset = () => {
    onPresetSelect(new Array(10).fill(0));
    setActivePreset(null);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-4 rounded-full relative cursor-pointer transition-all ${enabled ? 'bg-[var(--neon-green)]' : 'bg-[var(--panel-border)]'}`}
            onClick={onToggle}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${enabled ? 'left-4' : 'left-0.5'}`}
              style={{ boxShadow: enabled ? '0 0 4px var(--neon-green)' : 'none' }}
            />
          </div>
          <span className={`text-xs font-mono font-semibold ${enabled ? 'text-[var(--neon-green)]' : 'text-[var(--text-dim)]'}`}>
            EQ {enabled ? 'ON' : 'OFF'}
          </span>
        </div>
        <button
          onClick={handleReset}
          className="btn-wamp text-[10px] font-mono text-[var(--text-dim)] hover:text-[var(--text-mid)] transition-colors px-2 py-0.5 rounded border border-[var(--panel-border)] hover:border-[var(--text-mid)]"
        >
          RESET
        </button>
      </div>

      {/* Presets */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {presets.map(p => (
          <button
            key={p.name}
            onClick={() => handlePreset(p)}
            className={`btn-wamp shrink-0 px-2 py-1 text-[9px] font-mono rounded border transition-all ${
              activePreset === p.name
                ? 'border-[var(--neon-blue)] text-[var(--neon-blue)] bg-[rgba(0,200,255,0.08)]'
                : 'border-[var(--panel-border)] text-[var(--text-dim)] hover:text-[var(--text-mid)]'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* EQ bands */}
      <div className="flex-1 flex items-end justify-around gap-1 px-1">
        {BANDS.map((band, i) => {
          const gain = gains[i] ?? 0;
          const pct = ((gain + 12) / 24) * 100;
          return (
            <div key={band} className="flex flex-col items-center gap-1.5 flex-1">
              {/* dB value */}
              <span className={`text-[8px] font-mono transition-colors ${
                gain > 0 ? 'text-[var(--neon-green)]' : gain < 0 ? 'text-[var(--neon-orange)]' : 'text-[var(--text-dim)]'
              }`}>
                {gain > 0 ? `+${gain}` : gain}
              </span>

              {/* Slider */}
              <div className="relative flex justify-center" style={{ height: 80 }}>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={1}
                  value={gain}
                  disabled={!enabled}
                  onChange={e => {
                    setActivePreset(null);
                    onGainChange(i, Number(e.target.value));
                  }}
                  className="eq-slider"
                  style={{
                    opacity: enabled ? 1 : 0.3,
                    background: `linear-gradient(to top, ${gain >= 0 ? 'var(--neon-green)' : 'var(--neon-orange)'} 0%, ${gain >= 0 ? 'var(--neon-green)' : 'var(--neon-orange)'} ${pct}%, var(--panel-border) ${pct}%, var(--panel-border) 100%)`,
                  }}
                />
              </div>

              {/* 0dB line indicator */}
              <div className="w-full h-px bg-[var(--panel-border)]" />

              {/* Band label */}
              <span className="text-[8px] font-mono text-[var(--text-dim)]">{band}</span>
            </div>
          );
        })}
      </div>

      {/* Preamp */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-[9px] font-mono text-[var(--text-dim)] shrink-0">PREAMP</span>
        <div className="flex-1 relative">
          <input
            type="range"
            min={-12}
            max={12}
            step={1}
            defaultValue={0}
            disabled={!enabled}
            className="progress-bar"
            style={{
              opacity: enabled ? 1 : 0.3,
              background: 'linear-gradient(to right, var(--neon-blue), var(--panel-border))',
            }}
          />
        </div>
        <span className="text-[9px] font-mono text-[var(--neon-blue)] shrink-0 w-8">0 dB</span>
      </div>
    </div>
  );
}
