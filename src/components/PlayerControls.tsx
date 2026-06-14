import Icon from '@/components/ui/icon';

interface PlayerControlsProps {
  isPlaying: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  volume: number;
  progress: number;
  duration: number;
  currentTime: number;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onShuffle: () => void;
  onRepeat: () => void;
  onVolumeChange: (v: number) => void;
  onSeek: (v: number) => void;
}

function formatTime(s: number): string {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function PlayerControls({
  isPlaying, isShuffle, isRepeat,
  volume, progress, duration, currentTime,
  onPlayPause, onPrev, onNext, onShuffle, onRepeat,
  onVolumeChange, onSeek,
}: PlayerControlsProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-[var(--text-mid)] w-8 text-right shrink-0">
          {formatTime(currentTime)}
        </span>
        <div className="relative flex-1 group">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime || 0}
            onChange={e => onSeek(Number(e.target.value))}
            className="progress-bar"
            style={{
              background: `linear-gradient(to right, var(--neon-green) 0%, var(--neon-green) ${progress}%, var(--panel-border) ${progress}%, var(--panel-border) 100%)`
            }}
          />
        </div>
        <span className="text-[10px] font-mono text-[var(--text-mid)] w-8 shrink-0">
          {formatTime(duration)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Shuffle + Repeat */}
        <div className="flex items-center gap-2">
          <button
            onClick={onShuffle}
            className={`btn-wamp p-1.5 rounded transition-all ${isShuffle ? 'text-[var(--neon-green)]' : 'text-[var(--text-dim)] hover:text-[var(--text-mid)]'}`}
          >
            <Icon name="Shuffle" size={14} />
          </button>
          <button
            onClick={onRepeat}
            className={`btn-wamp p-1.5 rounded transition-all relative ${isRepeat ? 'text-[var(--neon-purple)]' : 'text-[var(--text-dim)] hover:text-[var(--text-mid)]'}`}
          >
            <Icon name="Repeat" size={14} />
          </button>
        </div>

        {/* Prev / Play / Next */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPrev}
            className="btn-wamp p-2 text-[var(--text-mid)] hover:text-white transition-colors"
          >
            <Icon name="SkipBack" size={18} />
          </button>

          <button
            onClick={onPlayPause}
            className="btn-wamp relative w-12 h-12 rounded-full flex items-center justify-center transition-all"
            style={{
              background: isPlaying
                ? 'linear-gradient(135deg, var(--neon-green), var(--neon-blue))'
                : 'linear-gradient(135deg, #1a2535, #0f1a28)',
              boxShadow: isPlaying
                ? '0 0 20px rgba(0,255,179,0.4), 0 0 40px rgba(0,255,179,0.1)'
                : '0 0 10px rgba(0,0,0,0.5)',
              border: isPlaying ? 'none' : '1px solid var(--panel-border)',
            }}
          >
            <Icon
              name={isPlaying ? 'Pause' : 'Play'}
              size={20}
              className={isPlaying ? 'text-[#0a0d12]' : 'text-white'}
            />
          </button>

          <button
            onClick={onNext}
            className="btn-wamp p-2 text-[var(--text-mid)] hover:text-white transition-colors"
          >
            <Icon name="SkipForward" size={18} />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-1.5 w-20">
          <Icon
            name={volume === 0 ? 'VolumeX' : volume < 50 ? 'Volume1' : 'Volume2'}
            size={12}
            className="text-[var(--text-dim)] shrink-0"
          />
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={e => onVolumeChange(Number(e.target.value))}
            className="volume-slider flex-1"
            style={{
              background: `linear-gradient(to right, var(--neon-purple) 0%, var(--neon-purple) ${volume}%, var(--panel-border) ${volume}%, var(--panel-border) 100%)`
            }}
          />
        </div>
      </div>
    </div>
  );
}
