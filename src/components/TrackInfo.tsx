import { useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  genre?: string;
}

interface TrackInfoProps {
  track: Track | null;
  isPlaying: boolean;
}

export default function TrackInfo({ track, isPlaying }: TrackInfoProps) {
  const titleRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    if (el.scrollWidth > el.clientWidth) {
      el.style.animation = 'marquee 12s linear infinite';
    } else {
      el.style.animation = 'none';
    }
  }, [track]);

  return (
    <div className="flex items-center gap-3 w-full min-w-0">
      {/* Album art CD */}
      <div className="relative shrink-0">
        <div
          className={`w-14 h-14 rounded-full cd-outer flex items-center justify-center ${isPlaying ? 'animate-spin-slow' : ''}`}
          style={{ willChange: 'transform' }}
        >
          <div className="w-4 h-4 rounded-full bg-[var(--panel-bg)] border border-[var(--panel-border)]" />
        </div>
        {isPlaying && (
          <div className="absolute inset-0 rounded-full"
            style={{ boxShadow: '0 0 15px rgba(0,255,179,0.3)' }} />
        )}
      </div>

      {/* Track text */}
      <div className="flex-1 min-w-0">
        <div className="overflow-hidden w-full">
          <span
            ref={titleRef}
            className="block text-base font-semibold text-white font-rajdhani leading-tight whitespace-nowrap"
            style={{ display: 'inline-block', paddingRight: '2rem' }}
          >
            {track ? track.title : 'Нет трека'}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs text-[var(--text-mid)] truncate">
            {track ? track.artist : '—'}
          </span>
          {track?.album && (
            <>
              <span className="text-[var(--text-dim)] text-xs">·</span>
              <span className="text-xs text-[var(--text-dim)] truncate">{track.album}</span>
            </>
          )}
        </div>
        {track?.genre && (
          <div className="mt-1">
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(0,255,179,0.08)',
                color: 'var(--neon-green)',
                border: '1px solid rgba(0,255,179,0.2)',
              }}
            >
              {track.genre.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Playing indicator bars */}
      {isPlaying && (
        <div className="shrink-0 flex items-end gap-0.5 h-5">
          {[1, 1.5, 0.7, 1.2, 0.9].map((spd, i) => (
            <div
              key={i}
              className="w-1 rounded-sm"
              style={{
                height: '100%',
                background: 'var(--neon-green)',
                animation: `equalizer ${spd}s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
