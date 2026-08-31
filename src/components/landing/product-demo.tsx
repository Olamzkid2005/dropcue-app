"use client";

import { useState, useRef, useEffect } from "react";

// Deterministic pseudo-random so server and client produce the same heights
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

const WAVES = Array.from({ length: 48 }, (_, i) => ({
  height: Math.floor(seededRandom(i) * 70) + 30,
}));

const TRACK_NAME = "Back (90 Bpm E Minor)";
const TRACK_GENRE = "Afro Chill • Rhodes • Sax";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function ProductDemo() {
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeBar, setActiveBar] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/demo-beat.mp3");
    audioRef.current.addEventListener("timeupdate", () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        // Calculate which bar should be active based on progress
        const progress = audioRef.current.currentTime / audioRef.current.duration;
        setActiveBar(Math.floor(progress * WAVES.length));
      }
    });
    audioRef.current.addEventListener("loadedmetadata", () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    });
    audioRef.current.addEventListener("ended", () => {
      setPlaying(false);
      setActiveBar(0);
    });
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  }

  function handleCopy() {
    navigator.clipboard.writeText("dropcue.co/beats/back-afro-chill");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSeekBar(index: number) {
    if (!audioRef.current || !duration) return;
    const progress = index / WAVES.length;
    audioRef.current.currentTime = progress * duration;
  }

  return (
    <div className="bg-surface rounded-[var(--radius-jumbo)] shadow-jumbo border border-hairline overflow-hidden">
      {/* Cover Art */}
      <div className="relative aspect-[4/3] bg-ink overflow-hidden">
        <img
          src="/midnight-drive-cover.png"
          alt="Midnight Drive cover art"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-hairline flex items-center gap-2">
          <i className="fa-solid fa-music text-accent text-xs" />
          <span className="text-xs font-semibold text-ink">Premium Beat</span>
        </div>
      </div>

      {/* Audio Player */}
      <div className="px-6 py-4 border-t border-hairline">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shrink-0 hover:bg-[#2d25a3] transition-colors"
          >
            <i
              className={`fa-solid ${playing ? "fa-pause" : "fa-play"} text-sm`}
            />
          </button>
          <div className="flex-1 flex items-center h-8 gap-[2px]">
            {WAVES.map((w, i) => (
              <div
                key={i}
                onClick={() => handleSeekBar(i)}
                className={`w-[3px] rounded-full transition-colors duration-200 cursor-pointer hover:opacity-80 ${
                  i <= activeBar ? "bg-accent" : "bg-hairline"
                }`}
                style={{ height: `${w.height}%` }}
              />
            ))}
          </div>
          <span className="text-xs text-muted shrink-0 w-10 text-right">
            {duration > 0 ? formatTime(currentTime) : "0:00"}
          </span>
        </div>
      </div>

      {/* Product Info + Copy Link */}
      <div className="px-6 pb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-ink">{TRACK_NAME}</h3>
            <p className="text-sm text-muted">{TRACK_GENRE}</p>
          </div>
          <span className="text-2xl font-semibold text-ink">$29</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-10 bg-gray-50 rounded-lg border border-hairline flex items-center px-4 text-xs text-muted truncate font-mono">
            dropcue.co/beats/back-afro-chill
          </div>
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-ink text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            {copied ? (
              <i className="fa-solid fa-check" />
            ) : (
              <i className="fa-solid fa-copy" />
            )}
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-hairline">
            <i className="fa-solid fa-share-nodes text-muted text-sm" />
          </button>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <i className="fa-solid fa-lock text-accent" /> Secure checkout
          </span>
          <span className="flex items-center gap-1.5">
            <i className="fa-solid fa-lock text-accent" /> Secure delivery
          </span>
        </div>
      </div>
    </div>
  );
}
