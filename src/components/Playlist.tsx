import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  genre?: string;
}

interface PlaylistItem {
  id: string;
  track: Track;
}

interface PlaylistsProps {
  playlists: { id: string; name: string; tracks: PlaylistItem[] }[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onTrackSelect: (track: Track) => void;
  onCreatePlaylist: (name: string) => void;
  onDeletePlaylist: (id: string) => void;
  onRemoveFromPlaylist: (playlistId: string, itemId: string) => void;
}

function formatDuration(s: number): string {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function totalDuration(tracks: PlaylistItem[]): string {
  const total = tracks.reduce((acc, t) => acc + (t.track.duration || 0), 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return h > 0 ? `${h}ч ${m}м` : `${m} мин`;
}

export default function Playlists({
  playlists, currentTrackId, isPlaying,
  onTrackSelect, onCreatePlaylist, onDeletePlaylist, onRemoveFromPlaylist
}: PlaylistsProps) {
  const [activePlaylist, setActivePlaylist] = useState<string | null>(playlists[0]?.id || null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const currentPL = playlists.find(p => p.id === activePlaylist);

  const handleCreate = () => {
    if (newName.trim()) {
      onCreatePlaylist(newName.trim());
      setNewName('');
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Playlist tabs header */}
      <div className="flex items-center gap-1.5">
        <div className="flex gap-1 flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {playlists.map(pl => (
            <button
              key={pl.id}
              onClick={() => setActivePlaylist(pl.id)}
              className={`btn-wamp shrink-0 px-2.5 py-1 text-[10px] font-rajdhani font-semibold rounded border transition-all ${
                activePlaylist === pl.id
                  ? 'border-[var(--neon-purple)] text-[var(--neon-purple)] bg-[rgba(179,71,255,0.08)]'
                  : 'border-[var(--panel-border)] text-[var(--text-dim)] hover:text-[var(--text-mid)]'
              }`}
            >
              {pl.name}
              <span className="ml-1 text-[8px] opacity-60">{pl.tracks.length}</span>
            </button>
          ))}
        </div>

        {/* New playlist */}
        <button
          onClick={() => setCreating(!creating)}
          className={`btn-wamp shrink-0 w-7 h-7 rounded border flex items-center justify-center transition-all ${
            creating ? 'border-[var(--neon-green)] text-[var(--neon-green)]' : 'border-[var(--panel-border)] text-[var(--text-dim)] hover:text-[var(--neon-green)] hover:border-[var(--neon-green)]'
          }`}
        >
          <Icon name={creating ? 'X' : 'Plus'} size={12} />
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="flex gap-1.5 animate-fade-in">
          <input
            autoFocus
            type="text"
            placeholder="Название плейлиста..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="flex-1 h-7 px-2.5 text-xs bg-[var(--panel-surface)] border border-[var(--neon-purple)] rounded text-white placeholder-[var(--text-dim)] focus:outline-none font-rajdhani"
          />
          <button
            onClick={handleCreate}
            className="btn-wamp h-7 px-3 text-xs rounded text-[#0a0d12] font-semibold font-rajdhani"
            style={{ background: 'var(--neon-purple)' }}
          >
            Создать
          </button>
        </div>
      )}

      {/* Playlist info */}
      {currentPL && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="ListMusic" size={12} className="text-[var(--neon-purple)]" />
            <span className="text-[10px] font-mono text-[var(--text-mid)]">
              {currentPL.tracks.length} треков · {totalDuration(currentPL.tracks)}
            </span>
          </div>
          <button
            onClick={() => onDeletePlaylist(currentPL.id)}
            className="btn-wamp p-1 text-[var(--text-dim)] hover:text-red-400 transition-colors"
          >
            <Icon name="Trash2" size={11} />
          </button>
        </div>
      )}

      {/* Tracks */}
      <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
        {!currentPL ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
            <Icon name="ListMusic" size={24} className="text-[var(--text-dim)]" />
            <p className="text-sm text-[var(--text-dim)] font-rajdhani">Создай плейлист</p>
          </div>
        ) : currentPL.tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
            <Icon name="Music2" size={24} className="text-[var(--text-dim)]" />
            <p className="text-xs text-[var(--text-dim)] font-rajdhani text-center">
              Плейлист пуст. Добавь треки из библиотеки
            </p>
          </div>
        ) : (
          currentPL.tracks.map((item, i) => {
            const isActive = item.track.id === currentTrackId;
            return (
              <div
                key={item.id}
                className={`group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[rgba(179,71,255,0.08)] border border-[rgba(179,71,255,0.2)]'
                    : 'hover:bg-[var(--panel-surface)] border border-transparent'
                }`}
                onClick={() => onTrackSelect(item.track)}
              >
                <span className={`text-[10px] font-mono w-5 text-right shrink-0 ${isActive ? 'text-[var(--neon-purple)]' : 'text-[var(--text-dim)]'}`}>
                  {isActive && isPlaying ? '▶' : i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-rajdhani font-semibold truncate ${isActive ? 'text-[var(--neon-purple)]' : 'text-white'}`}>
                    {item.track.title}
                  </div>
                  <div className="text-[10px] text-[var(--text-mid)] truncate">{item.track.artist}</div>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-dim)] shrink-0">{formatDuration(item.track.duration)}</span>
                <button
                  onClick={e => { e.stopPropagation(); onRemoveFromPlaylist(currentPL.id, item.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-dim)] hover:text-red-400 transition-all"
                >
                  <Icon name="X" size={11} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
