import { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import Visualizer from '@/components/Visualizer';
import PlayerControls from '@/components/PlayerControls';
import TrackInfo from '@/components/TrackInfo';
import Library from '@/components/Library';
import Playlists from '@/components/Playlist';
import Equalizer from '@/components/Equalizer';
import Settings from '@/components/Settings';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  genre?: string;
  url?: string;
}

interface PlaylistItem {
  id: string;
  track: Track;
}

interface Playlist {
  id: string;
  name: string;
  tracks: PlaylistItem[];
}

const DEMO_TRACKS: Track[] = [
  { id: '1', title: 'Cosmic Drift', artist: 'Stellar Echo', album: 'Deep Space', duration: 214, genre: 'Electronic' },
  { id: '2', title: 'Neon Pulse', artist: 'CyberWave', album: 'Urban Nights', duration: 187, genre: 'Synthwave' },
  { id: '3', title: 'Aurora Rising', artist: 'Polar Circuit', album: 'Northern Lights', duration: 263, genre: 'Ambient' },
  { id: '4', title: 'Midnight Protocol', artist: 'BinaryFlow', album: 'System//Override', duration: 198, genre: 'Techno' },
  { id: '5', title: 'Quantum Bloom', artist: 'Stellar Echo', album: 'Deep Space', duration: 241, genre: 'Electronic' },
  { id: '6', title: 'Solar Flare', artist: 'Nova Engine', album: 'Ignition', duration: 156, genre: 'Electro' },
  { id: '7', title: 'Ghost Signal', artist: 'CyberWave', album: 'Urban Nights', duration: 223, genre: 'Synthwave' },
  { id: '8', title: 'Iron Cathedral', artist: 'BinaryFlow', album: 'System//Override', duration: 308, genre: 'Industrial' },
];

const EQ_PRESETS = [
  { name: 'Flat', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'Bass Boost', gains: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0] },
  { name: 'Treble', gains: [0, 0, 0, 0, 0, 2, 4, 6, 7, 8] },
  { name: 'V-Shape', gains: [6, 4, 1, -1, -2, -2, -1, 1, 4, 6] },
  { name: 'Club', gains: [0, 0, 4, 4, 4, 4, 4, 0, 0, 0] },
  { name: 'Rock', gains: [5, 4, 2, -1, -2, 0, 3, 5, 6, 6] },
  { name: 'Jazz', gains: [4, 2, 0, 2, 4, 4, 2, 0, 1, 3] },
  { name: 'Classical', gains: [4, 3, 2, 2, -2, -2, 0, 0, 3, 4] },
];

type Tab = 'library' | 'playlists' | 'equalizer' | 'settings';

export default function Index() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const eqNodesRef = useRef<BiquadFilterNode[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const tracksRef = useRef<Track[]>(DEMO_TRACKS);

  const [tracks, setTracks] = useState<Track[]>(DEMO_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('library');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([
    { id: 'fav', name: 'Избранное', tracks: [] },
  ]);
  const [eqEnabled, setEqEnabled] = useState(false);
  const [eqGains, setEqGains] = useState<number[]>(new Array(10).fill(0));
  const [theme, setTheme] = useState('classic');

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.82;
    analyserRef.current = analyser;

    const gainNode = ctx.createGain();
    gainNodeRef.current = gainNode;

    const freqs = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    const eqNodes = freqs.map(freq => {
      const filter = ctx.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1.4;
      filter.gain.value = 0;
      return filter;
    });
    eqNodesRef.current = eqNodes;

    if (audioRef.current && !sourceRef.current) {
      const source = ctx.createMediaElementSource(audioRef.current);
      sourceRef.current = source;
      let prev: AudioNode = source;
      for (const node of eqNodes) {
        prev.connect(node);
        prev = node;
      }
      prev.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(ctx.destination);
    }
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) gainNodeRef.current.gain.value = volume / 100;
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    eqNodesRef.current.forEach((node, i) => {
      node.gain.value = eqEnabled ? (eqGains[i] ?? 0) : 0;
    });
  }, [eqGains, eqEnabled]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onDuration = () => setDuration(audio.duration || 0);
    const onEnded = () => handleNext();
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('durationchange', onDuration);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('durationchange', onDuration);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  const playTrack = useCallback(async (track: Track) => {
    initAudio();
    if (audioCtxRef.current?.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    setCurrentTrack(track);
    setCurrentTime(0);
    if (audioRef.current && track.url) {
      audioRef.current.src = track.url;
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    } else {
      // Demo mode
      setIsPlaying(true);
      setDuration(track.duration);
    }
  }, [initAudio]);

  const currentTrackRef = useRef<Track | null>(null);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);

  const handleNext = useCallback(() => {
    const list = tracksRef.current;
    if (!list.length) return;
    if (isShuffle) {
      playTrack(list[Math.floor(Math.random() * list.length)]);
    } else {
      const idx = list.findIndex(t => t.id === currentTrackRef.current?.id);
      playTrack(list[(idx + 1) % list.length]);
    }
  }, [isShuffle, playTrack]);

  const handlePrev = useCallback(() => {
    const list = tracksRef.current;
    if (!list.length) return;
    const idx = list.findIndex(t => t.id === currentTrackRef.current?.id);
    playTrack(list[(idx - 1 + list.length) % list.length]);
  }, [playTrack]);

  const handlePlayPause = useCallback(() => {
    initAudio();
    if (audioRef.current?.src && audioRef.current.src !== window.location.href) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(() => {});
    } else {
      if (!currentTrack && tracks.length > 0) {
        playTrack(tracks[0]);
      } else {
        setIsPlaying(p => !p);
      }
    }
  }, [isPlaying, currentTrack, tracks, playTrack, initAudio]);

  const handleSeek = (val: number) => {
    setCurrentTime(val);
    if (audioRef.current) audioRef.current.currentTime = val;
  };

  // Demo playback simulation
  useEffect(() => {
    const hasRealSrc = audioRef.current?.src && audioRef.current.src !== window.location.href;
    if (!isPlaying || !currentTrack || hasRealSrc) return;
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= currentTrack.duration) {
          handleNext();
          return 0;
        }
        return prev + 0.5;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, handleNext]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFilesSelected = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newTracks: Track[] = [];
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('audio/')) return;
      const url = URL.createObjectURL(file);
      objectUrlsRef.current.push(url);
      // Parse title/artist from filename: "Artist - Title.mp3" or just "Title.mp3"
      const name = file.name.replace(/\.[^.]+$/, '');
      const parts = name.split(' - ');
      const artist = parts.length >= 2 ? parts[0].trim() : 'Неизвестный';
      const title = parts.length >= 2 ? parts.slice(1).join(' - ').trim() : name;
      newTracks.push({
        id: `file_${Date.now()}_${Math.random()}`,
        title,
        artist,
        album: 'Загруженные',
        duration: 0,
        genre: 'Без жанра',
        url,
      });
    });
    if (newTracks.length > 0) {
      setTracks(prev => {
        const next = [...prev, ...newTracks];
        tracksRef.current = next;
        return next;
      });
      // Auto-play first loaded track
      playTrack(newTracks[0]);
    }
  }, [playTrack]);

  const handleScan = () => {
    fileInputRef.current?.click();
  };

  const handleAddToPlaylist = (track: Track) => {
    setPlaylists(pls => pls.map(pl =>
      pl.id === 'fav'
        ? { ...pl, tracks: pl.tracks.some(i => i.track.id === track.id) ? pl.tracks : [...pl.tracks, { id: `${Date.now()}`, track }] }
        : pl
    ));
  };

  const handleCreatePlaylist = (name: string) => {
    setPlaylists(pls => [...pls, { id: `pl_${Date.now()}`, name, tracks: [] }]);
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists(pls => pls.filter(p => p.id !== id));
  };

  const handleRemoveFromPlaylist = (playlistId: string, itemId: string) => {
    setPlaylists(pls => pls.map(pl =>
      pl.id === playlistId ? { ...pl, tracks: pl.tracks.filter(t => t.id !== itemId) } : pl
    ));
  };

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'library', icon: 'Library', label: 'Библиотека' },
    { key: 'playlists', icon: 'ListMusic', label: 'Плейлисты' },
    { key: 'equalizer', icon: 'BarChart2', label: 'EQ' },
    { key: 'settings', icon: 'Settings', label: 'Настройки' },
  ];

  return (
    <div className="h-[100dvh] flex flex-col bg-[var(--panel-bg)] overflow-hidden select-none">
      <audio ref={audioRef} style={{ display: 'none' }} />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => handleFilesSelected(e.target.files)}
      />

      {/* Fullscreen visualizer */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black" style={{ touchAction: 'none' }}>
          <Visualizer
            analyser={analyserRef.current}
            isPlaying={isPlaying}
            isFullscreen={true}
            onFullscreen={() => setIsFullscreen(false)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 p-4 pt-8"
            style={{ background: 'linear-gradient(to top, rgba(5,8,15,0.98), transparent)' }}
          >
            <TrackInfo track={currentTrack} isPlaying={isPlaying} />
            <div className="mt-3">
              <PlayerControls
                isPlaying={isPlaying} isShuffle={isShuffle} isRepeat={isRepeat}
                volume={volume} progress={progress} duration={duration} currentTime={currentTime}
                onPlayPause={handlePlayPause} onPrev={handlePrev} onNext={handleNext}
                onShuffle={() => setIsShuffle(s => !s)} onRepeat={() => setIsRepeat(r => !r)}
                onVolumeChange={setVolume} onSeek={handleSeek}
              />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-[var(--panel-border)]"
        style={{ background: 'linear-gradient(135deg, #0a0d12 0%, #0d1220 100%)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--neon-green)]" style={{ boxShadow: '0 0 8px var(--neon-green)' }} />
          </div>
          <span className="text-sm font-orbitron font-bold tracking-[0.2em] text-white">WAMP</span>
          <span className="text-[9px] font-mono text-[var(--text-dim)] tracking-widest hidden">v3.0</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[var(--text-dim)]">
            {tracks.length} треков
          </span>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-wamp flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-semibold transition-all"
            style={{
              background: 'rgba(0,255,179,0.1)',
              color: 'var(--neon-green)',
              border: '1px solid rgba(0,255,179,0.3)',
            }}
          >
            <Icon name="FolderOpen" size={11} />
            + Музыка
          </button>
        </div>
      </div>

      {/* Visualizer */}
      <div className="shrink-0 relative" style={{ height: 150 }}>
        <div className="scanlines absolute inset-0 pointer-events-none z-10" />
        <Visualizer
          analyser={analyserRef.current}
          isPlaying={isPlaying}
          isFullscreen={false}
          onFullscreen={() => setIsFullscreen(true)}
        />
      </div>

      {/* Track info + controls */}
      <div
        className="shrink-0 px-4 pt-3 pb-3 space-y-3 border-t border-b border-[var(--panel-border)]"
        style={{ background: 'linear-gradient(to bottom, #0d1018, #0a0d12)' }}
      >
        <TrackInfo track={currentTrack} isPlaying={isPlaying} />
        <PlayerControls
          isPlaying={isPlaying} isShuffle={isShuffle} isRepeat={isRepeat}
          volume={volume} progress={progress} duration={duration} currentTime={currentTime}
          onPlayPause={handlePlayPause} onPrev={handlePrev} onNext={handleNext}
          onShuffle={() => setIsShuffle(s => !s)} onRepeat={() => setIsRepeat(r => !r)}
          onVolumeChange={setVolume} onSeek={handleSeek}
        />
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-[var(--panel-border)]" style={{ background: '#080b10' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`btn-wamp flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${
              activeTab === tab.key ? 'tab-active' : 'text-[var(--text-dim)] hover:text-[var(--text-mid)]'
            }`}
          >
            <Icon name={tab.icon} size={14} />
            <span className="text-[9px] font-mono">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden px-3 py-3 min-h-0">
        {activeTab === 'library' && (
          <Library
            tracks={tracks}
            currentTrackId={currentTrack?.id ?? null}
            isPlaying={isPlaying}
            onTrackSelect={playTrack}
            onAddToPlaylist={handleAddToPlaylist}
            onScanMusic={handleScan}
            isScanning={isScanning}
          />
        )}
        {activeTab === 'playlists' && (
          <Playlists
            playlists={playlists}
            currentTrackId={currentTrack?.id ?? null}
            isPlaying={isPlaying}
            onTrackSelect={playTrack}
            onCreatePlaylist={handleCreatePlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onRemoveFromPlaylist={handleRemoveFromPlaylist}
          />
        )}
        {activeTab === 'equalizer' && (
          <Equalizer
            enabled={eqEnabled}
            onToggle={() => setEqEnabled(e => !e)}
            gains={eqGains}
            onGainChange={(i, v) => setEqGains(g => g.map((val, idx) => idx === i ? v : val))}
            presets={EQ_PRESETS}
            onPresetSelect={setEqGains}
          />
        )}
        {activeTab === 'settings' && (
          <Settings
            theme={theme}
            onThemeChange={setTheme}
            scanPaths={[]}
            autoScan={false}
            onAutoScanToggle={() => {}}
          />
        )}
      </div>
    </div>
  );
}