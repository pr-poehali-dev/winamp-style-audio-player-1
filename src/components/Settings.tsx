import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface SettingsProps {
  theme: string;
  onThemeChange: (theme: string) => void;
  scanPaths: string[];
  autoScan: boolean;
  onAutoScanToggle: () => void;
}

const THEMES = [
  { id: 'classic', name: 'Classic Dark', bg: '#0a0d12', accent: '#00ffb3', secondary: '#b347ff' },
  { id: 'amber', name: 'Amber Retro', bg: '#0d0a00', accent: '#ffb300', secondary: '#ff6b2b' },
  { id: 'cyber', name: 'Cyber Blue', bg: '#000d1a', accent: '#00c8ff', secondary: '#ff0080' },
  { id: 'matrix', name: 'Matrix Green', bg: '#000800', accent: '#00ff41', secondary: '#00cc33' },
  { id: 'sunset', name: 'Sunset', bg: '#120008', accent: '#ff6b9d', secondary: '#ffb347' },
];

export default function Settings({ theme, onThemeChange, scanPaths, autoScan, onAutoScanToggle }: SettingsProps) {
  const [activeSection, setActiveSection] = useState<'themes' | 'scan' | 'audio'>('themes');

  const sections = [
    { key: 'themes' as const, label: 'Темы', icon: 'Palette' },
    { key: 'scan' as const, label: 'Сканирование', icon: 'FolderSearch' },
    { key: 'audio' as const, label: 'Аудио', icon: 'Settings2' },
  ];

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Sections */}
      <div className="flex gap-1 p-1 bg-[var(--panel-surface)] rounded border border-[var(--panel-border)]">
        {sections.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`btn-wamp flex-1 py-1.5 text-[10px] font-rajdhani font-semibold rounded transition-all flex items-center justify-center gap-1 ${
              activeSection === s.key
                ? 'bg-[rgba(0,255,179,0.1)] text-[var(--neon-green)]'
                : 'text-[var(--text-dim)] hover:text-[var(--text-mid)]'
            }`}
          >
            <Icon name={s.icon} size={10} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Themes */}
      {activeSection === 'themes' && (
        <div className="space-y-2 animate-fade-in">
          <p className="text-[10px] font-mono text-[var(--text-dim)]">ТЕМА ОФОРМЛЕНИЯ</p>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className={`btn-wamp w-full flex items-center gap-3 p-2.5 rounded border transition-all ${
                theme === t.id
                  ? 'border-[var(--neon-green)] bg-[rgba(0,255,179,0.05)]'
                  : 'border-[var(--panel-border)] hover:border-[var(--text-mid)]'
              }`}
            >
              {/* Preview */}
              <div
                className="w-10 h-6 rounded flex items-center justify-center shrink-0"
                style={{ background: t.bg, border: `1px solid ${t.accent}33` }}
              >
                <div className="flex gap-0.5 items-end h-3">
                  {[3, 5, 4, 6, 3].map((h, i) => (
                    <div key={i} className="w-1 rounded-sm" style={{ height: `${h * 2}px`, background: i % 2 === 0 ? t.accent : t.secondary }} />
                  ))}
                </div>
              </div>
              <span className={`text-xs font-rajdhani ${theme === t.id ? 'text-[var(--neon-green)]' : 'text-white'}`}>
                {t.name}
              </span>
              {theme === t.id && (
                <Icon name="Check" size={12} className="ml-auto text-[var(--neon-green)]" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Scan settings */}
      {activeSection === 'scan' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between p-3 rounded border border-[var(--panel-border)] bg-[var(--panel-surface)]">
            <div>
              <p className="text-xs font-rajdhani text-white">Автосканирование</p>
              <p className="text-[10px] text-[var(--text-dim)] mt-0.5">При запуске приложения</p>
            </div>
            <div
              className={`w-8 h-4 rounded-full relative cursor-pointer transition-all ${autoScan ? 'bg-[var(--neon-green)]' : 'bg-[var(--panel-border)]'}`}
              onClick={onAutoScanToggle}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${autoScan ? 'left-4' : 'left-0.5'}`} />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono text-[var(--text-dim)] mb-2">ПУТИ СКАНИРОВАНИЯ</p>
            <div className="space-y-1.5">
              {['/storage/emulated/0/Music', '/storage/sdcard/Music', '/storage/emulated/0/Downloads'].map(path => (
                <div key={path} className="flex items-center gap-2 p-2 rounded border border-[var(--panel-border)] bg-[var(--panel-surface)]">
                  <Icon name="FolderOpen" size={12} className="text-[var(--neon-green)] shrink-0" />
                  <span className="text-[10px] font-mono text-[var(--text-mid)] truncate flex-1">{path}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--neon-green)]" />
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded border border-dashed border-[var(--panel-border)] text-center">
            <p className="text-[10px] text-[var(--text-dim)] font-rajdhani">
              Поддерживаемые форматы: MP3, FLAC, AAC, OGG, WAV, M4A
            </p>
          </div>
        </div>
      )}

      {/* Audio settings */}
      {activeSection === 'audio' && (
        <div className="space-y-3 animate-fade-in">
          {[
            { label: 'Кроссфейд', desc: 'Плавный переход между треками', defaultOn: false },
            { label: 'Нормализация громкости', desc: 'Выравнивание уровня треков', defaultOn: true },
            { label: 'Bass Boost', desc: 'Усиление низких частот', defaultOn: false },
            { label: 'Виртуальный объём', desc: '3D пространство звука', defaultOn: false },
          ].map(item => (
            <ToggleRow key={item.label} label={item.label} desc={item.desc} defaultOn={item.defaultOn} />
          ))}

          <div className="p-3 rounded border border-[var(--panel-border)] bg-[var(--panel-surface)]">
            <p className="text-[10px] font-mono text-[var(--text-dim)] mb-2">БУФЕР ВОСПРОИЗВЕДЕНИЯ</p>
            <div className="flex items-center gap-2">
              <input type="range" min={50} max={500} defaultValue={150} className="progress-bar flex-1" />
              <span className="text-[10px] font-mono text-[var(--neon-blue)] w-14">150 мс</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({ label, desc, defaultOn }: { label: string; desc: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between p-3 rounded border border-[var(--panel-border)] bg-[var(--panel-surface)]">
      <div>
        <p className="text-xs font-rajdhani text-white">{label}</p>
        <p className="text-[10px] text-[var(--text-dim)] mt-0.5">{desc}</p>
      </div>
      <div
        className={`w-8 h-4 rounded-full relative cursor-pointer transition-all ${on ? 'bg-[var(--neon-green)]' : 'bg-[var(--panel-border)]'}`}
        onClick={() => setOn(!on)}
      >
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${on ? 'left-4' : 'left-0.5'}`}
          style={{ boxShadow: on ? '0 0 4px var(--neon-green)' : 'none' }} />
      </div>
    </div>
  );
}
