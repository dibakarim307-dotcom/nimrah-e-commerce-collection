import React, { useState, useEffect } from 'react';
import { Sparkles, Wind } from 'lucide-react';

interface PerfumeAnimationOverlayProps {
  /** If true, renders a slightly more compact overlay suitable for catalog cards */
  compact?: boolean;
  /** Callback when user clicks the interactive spray trigger */
  onSprayed?: () => void;
}

interface Particle {
  id: number;
  x: number;
  driftX: number;
  delay: number;
  size: number;
  duration: number;
}

export const PerfumeAnimationOverlay: React.FC<PerfumeAnimationOverlayProps> = ({ 
  compact = false,
  onSprayed 
}) => {
  const [isSpraying, setIsSpraying] = useState(false);
  const [sprayCount, setSprayCount] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [activeNotes, setActiveNotes] = useState<string[]>([]);

  // Generate randomized floating fragrance particles
  useEffect(() => {
    const count = compact ? 8 : 14;
    const generated: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60, // percentage across
      driftX: (Math.random() - 0.5) * 40,
      delay: Math.random() * 4,
      size: 2 + Math.random() * 3,
      duration: 3 + Math.random() * 2.5
    }));
    setParticles(generated);
  }, [compact]);

  const fragranceNotes = [
    { name: 'Cambodian Oud', tier: 'Base Note', color: '#78350f' },
    { name: 'Bulgarian Rose', tier: 'Heart Note', color: '#be185d' },
    { name: 'Tahitian Vanilla', tier: 'Base Note', color: '#b45309' },
    { name: 'Italian Bergamot', tier: 'Top Note', color: '#15803d' },
    { name: 'Smoky Amber', tier: 'Fixative', color: '#d97706' }
  ];

  const handleSpritz = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSpraying(true);
    setSprayCount(prev => prev + 1);
    
    // Pick 2 random olfactory notes to reveal during this spritz
    const shuffled = [...fragranceNotes].sort(() => 0.5 - Math.random());
    setActiveNotes([shuffled[0].name, shuffled[1].name]);

    if (onSprayed) {
      onSprayed();
    }

    // Reset spraying after animation
    setTimeout(() => {
      setIsSpraying(false);
    }, 1800);
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 select-none">
      {/* 1. Ambient Golden Sillage Aura (breathing behind and around bottle) */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 rounded-full animate-perfume-aura opacity-70"
        style={{
          background: 'radial-gradient(circle, rgba(217, 119, 6, 0.45) 0%, rgba(245, 158, 11, 0.25) 45%, rgba(0, 0, 0, 0) 75%)'
        }}
      />

      {/* 2. Concentric Sillage Soundless Ripple Waves */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-amber-400/40 animate-perfume-ripple" />
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-amber-300/30 animate-perfume-ripple"
        style={{ animationDelay: '1s' }}
      />

      {/* 3. Rising Fragrance Mist Plumes from Atomizer Neck */}
      <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-28 h-28">
        {/* Mist Cloud 1 */}
        <div 
          className="absolute inset-0 rounded-full animate-perfume-mist-1"
          style={{
            background: 'radial-gradient(circle, rgba(254, 243, 199, 0.55) 0%, rgba(245, 158, 11, 0.28) 45%, transparent 70%)'
          }}
        />
        {/* Mist Cloud 2 */}
        <div 
          className="absolute inset-0 rounded-full animate-perfume-mist-2"
          style={{
            background: 'radial-gradient(circle, rgba(253, 230, 138, 0.5) 0%, rgba(217, 119, 6, 0.25) 50%, transparent 75%)'
          }}
        />
        {/* Mist Cloud 3 */}
        <div 
          className="absolute inset-0 rounded-full animate-perfume-mist-3"
          style={{
            background: 'radial-gradient(circle, rgba(255, 251, 235, 0.45) 0%, rgba(251, 191, 36, 0.2) 50%, transparent 70%)'
          }}
        />
      </div>

      {/* 4. Drifting Golden Scent Droplets & Gilded Micro-Sparkles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${35 + (p.id % 4) * 8}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.id % 2 === 0 ? '#fbbf24' : '#fef08a',
            boxShadow: '0 0 6px rgba(251, 191, 36, 0.9)',
            animation: `perfume-particle-drift ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
            ['--drift-x' as any]: `${p.driftX}px`
          }}
        />
      ))}

      {/* 5. Gilded Light Sheen Bar sweeping across flacon */}
      <div 
        className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-amber-200/30 to-transparent skew-x-12 animate-perfume-shimmer pointer-events-none"
      />

      {/* 6. Active Interactive Spray Burst Plume */}
      {isSpraying && (
        <div className="absolute top-[26%] left-1/2 -translate-x-1/2 w-48 h-48 animate-perfume-burst z-20">
          {/* Intense center mist cloud */}
          <div 
            className="w-full h-full rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.85) 0%, rgba(251, 191, 36, 0.6) 35%, rgba(217, 119, 6, 0.2) 65%, transparent 80%)'
            }}
          />
          {/* Spray nozzle droplet streams */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </div>
        </div>
      )}

      {/* 7. Animated Olfactory Notes released during Spray */}
      {isSpraying && activeNotes.length > 0 && (
        <div className="absolute top-12 left-0 right-0 flex flex-col items-center gap-1.5 z-30 transition-all">
          <div className="flex items-center gap-2 animate-bounce">
            {activeNotes.map((note, i) => (
              <span 
                key={i} 
                className="px-2.5 py-1 text-[10px] font-mono font-bold text-amber-950 bg-amber-300 border border-amber-200 rounded-full shadow-lg shadow-amber-950/40"
              >
                ✨ {note}
              </span>
            ))}
          </div>
          <span className="text-[10px] font-mono text-amber-200 bg-black/80 px-2 py-0.5 rounded-md border border-amber-500/40 backdrop-blur-xs">
            Extrait Sillage Diffused
          </span>
        </div>
      )}

      {/* 8. Luxury Floating Badges & Interactive Spritz Trigger */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/85 border border-amber-400/50 rounded-lg backdrop-blur-md shadow-lg shadow-amber-950/30">
          <Sparkles className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-[10px] font-mono font-bold text-amber-300 tracking-wider uppercase">
            35% Extrait · 24H Sillage
          </span>
        </div>

        {/* Interactive Spritz Button */}
        <button
          type="button"
          onClick={handleSpritz}
          title="Spritz Nimrah Noir to experience the animated fragrance vapor"
          className="p-1.5 sm:px-2.5 sm:py-1 text-[11px] font-bold text-stone-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 hover:from-amber-200 hover:to-amber-300 rounded-lg shadow-md border border-amber-200 flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105 active:scale-95"
        >
          <Wind className={`w-3.5 h-3.5 ${isSpraying ? 'animate-spin text-amber-900' : 'text-stone-950'}`} />
          <span className="hidden sm:inline">{isSpraying ? 'Spraying Mist...' : 'Spritz Mist'}</span>
        </button>
      </div>
    </div>
  );
};
