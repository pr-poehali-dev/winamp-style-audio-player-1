import { useState, useMemo } from 'react';
import Icon from '@/components/ui/icon';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  genre?: string;
}

interface LibraryProps {
  tracks: Track[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onTrackSelect: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
  onScanMusic: () => void;
  isScanning: boolean;
}

type SortBy = 'title' | 'artist' | 'album' | 'genre';
type ViewMode = 'all' | 'artists' | 'albums' | 'genres';

function formatDuration(s: number): string {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function Library({ tracks, currentTrackId, isPlaying, onTrackSelect, onAddToPlaylist, onScanMusic, isScanning }: LibraryProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('title');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = tracks;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
      );
    }
    if (selectedGroup && viewMode !== 'all') {
      if (viewMode === 'artists') list = list.filter(t => t.artist === selectedGroup);
      if (viewMode === 'albums') list = list.filter(t => t.album === selectedGroup);
      if (viewMode === 'genres') list = list.filter(t => t.genre === selectedGroup);
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
      if (sortBy === 'album') return a.album.localeCompare(b.album);
      if (sortBy === 'genre') return (a.genre || '').localeCompare(b.genre || '');
      return 0;
    });
  }, [tracks, search, sortBy, viewMode, selectedGroup]);

  const groups = useMemo(() => {
    if (viewMode === 'artists') return [...new Set(tracks.map(t => t.artist))].sort();
    if (viewMode === 'albums') return [...new Set(tracks.map(t => t.album))].sort();
    if (viewMode === 'genres') return [...new Set(tracks.map(t => t.genre || 'Unknown'))].sort();
    return [];
  }, [tracks, viewMode]);

  const viewTabs: { key: ViewMode; label: string; icon: string }[] = [
    { key: 'all', label: 'Все', icon: 'Music' },
    { key: 'artists', label: 'Исполнители', icon: 'Mic2' },
    { key: 'albums', label: 'Альбомы', icon: 'Disc3' },
    { key: 'genres', label: 'Жанры', icon: 'Tag' },
  ];

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Search + Scan */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Icon name="Search" size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            type="text"
            placeholder="Поиск треков..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-8 pl-7 pr-3 text-xs bg-[var(--panel-surface)] border border-[var(--panel-border)] rounded text-white placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--neon-green)] transition-colors font-rajdhani"
          />
        </div>
        <button
          onClick={onScanMusic}
          disabled={isScanning}
          className="btn-wamp h-8 px-3 text-xs font-rajdhani rounded border border-[var(--panel-border)] text-[var(--text-mid)] hover:text-[var(--neon-green)] hover:border-[var(--neon-green)] transition-all flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
        >
          <Icon name={isScanning ? 'Loader2' : 'Upload'} size={12} className={isScanning ? 'animate-spin' : ''} />
          {isScanning ? 'Загрузка...' : 'Загрузить'}
        </button>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 p-1 bg-[var(--panel-surface)] rounded border border-[var(--panel-border)]">
        {viewTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setViewMode(tab.key); setSelectedGroup(null); }}
            className={`btn-wamp flex-1 py-1 text-[10px] font-rajdhani font-semibold rounded transition-all flex items-center justify-center gap-1 ${
              viewMode === tab.key
                ? 'bg-[rgba(0,255,179,0.1)] text-[var(--neon-green)]'
                : 'text-[var(--text-dim)] hover:text-[var(--text-mid)]'
            }`}
          >
            <Icon name={tab.icon} size={10} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Groups (artists/albums/genres) */}
      {viewMode !== 'all' && groups.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setSelectedGroup(null)}
            className={`btn-wamp shrink-0 px-2 py-0.5 text-[10px] rounded border transition-all ${
              !selectedGroup ? 'border-[var(--neon-green)] text-[var(--neon-green)]' : 'border-[var(--panel-border)] text-[var(--text-dim)]'
            }`}
          >
            Все
          </button>
          {groups.map(g => (
            <button
              key={g}
              onClick={() => setSelectedGroup(g === selectedGroup ? null : g)}
              className={`btn-wamp shrink-0 px-2 py-0.5 text-[10px] rounded border transition-all ${
                selectedGroup === g ? 'border-[var(--neon-purple)] text-[var(--neon-purple)]' : 'border-[var(--panel-border)] text-[var(--text-dim)]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Sort bar */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-[var(--text-dim)] font-mono">СОРТ:</span>
        {(['title', 'artist', 'album', 'genre'] as SortBy[]).map(s => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`text-[9px] font-mono transition-colors ${sortBy === s ? 'text-[var(--neon-green)]' : 'text-[var(--text-dim)] hover:text-[var(--text-mid)]'}`}
          >
            {s.toUpperCase()}
          </button>
        ))}
        <span className="ml-auto text-[9px] text-[var(--text-dim)] font-mono">{filtered.length} ТРЕКОВ</span>
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
            <div className="w-12 h-12 rounded-full bg-[var(--panel-surface)] border border-[var(--panel-border)] flex items-center justify-center">
              <Icon name="Music" size={20} className="text-[var(--text-dim)]" />
            </div>
            <p className="text-sm text-[var(--text-dim)] font-rajdhani text-center px-4">
              {search ? 'Ничего не найдено' : 'Нажми «Загрузить», чтобы добавить MP3 с устройства'}
            </p>
          </div>
        ) : (
          filtered.map((track, i) => {
            const isActive = track.id === currentTrackId;
            return (
              <div
                key={track.id}
                className={`group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[rgba(0,255,179,0.08)] border border-[rgba(0,255,179,0.2)]'
                    : 'hover:bg-[var(--panel-surface)] border border-transparent'
                }`}
                onClick={() => onTrackSelect(track)}
              >
                <span className={`text-[10px] font-mono w-5 text-right shrink-0 ${isActive ? 'text-[var(--neon-green)]' : 'text-[var(--text-dim)]'}`}>
                  {isActive && isPlaying ? '▶' : i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-rajdhani font-semibold truncate leading-tight ${isActive ? 'text-[var(--neon-green)]' : 'text-white'}`}>
                    {track.title}
                  </div>
                  <div className="text-[10px] text-[var(--text-mid)] truncate">{track.artist}</div>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-dim)] shrink-0">{formatDuration(track.duration)}</span>
                <button
                  onClick={e => { e.stopPropagation(); onAddToPlaylist(track); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-dim)] hover:text-[var(--neon-purple)] transition-all"
                >
                  <Icon name="ListPlus" size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}