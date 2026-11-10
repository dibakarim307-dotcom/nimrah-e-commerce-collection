import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Pause, 
  Play
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ShowcaseSlide } from '../types';

export const AtelierShowcaseDisplay: React.FC = () => {
  const { 
    showcaseSlides 
  } = useStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isZooming, setIsZooming] = useState(false);

  const SLIDE_DURATION = 4500; // 4.5 seconds per slide
  const PROGRESS_INTERVAL = 50; // update progress every 50ms

  const slides = showcaseSlides.length > 0 ? showcaseSlides : [
    {
      id: "fallback-1",
      imageUrl: "/src/assets/images/product_artisan_kaftan_1793448136736.jpg",
      title: "Precision Craftsmanship & Pure Silk Velvet",
      subtitle: "Hand-embroidered zardozi and crystalline beadwork tailored with modesty.",
      badge: "Atelier Heritage · Shop G7"
    }
  ];

  const currentSlide: ShowcaseSlide = slides[currentIndex % slides.length];

  // Auto-play timer with progress indicator
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    setProgress(0);
    setIsZooming(true);

    const step = (PROGRESS_INTERVAL / SLIDE_DURATION) * 100;
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((idx) => (idx + 1) % slides.length);
          setIsZooming(false);
          return 0;
        }
        return prev + step;
      });
    }, PROGRESS_INTERVAL);

    return () => clearInterval(progressTimer);
  }, [currentIndex, isPaused, slides.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProgress(0);
    setCurrentIndex((idx) => (idx - 1 + slides.length) % slides.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProgress(0);
    setCurrentIndex((idx) => (idx + 1) % slides.length);
  };

  const handleSelectDot = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setProgress(0);
    setCurrentIndex(idx);
  };

  return (
    <div 
      className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-stone-900 border border-amber-500/30 shadow-2xl group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. Main Display Image with Smooth Animation Effect */}
      <img 
        key={currentSlide.id + currentSlide.imageUrl}
        src={currentSlide.imageUrl} 
        alt={currentSlide.title || "Nimrah Collection Atelier Craftsmanship"}
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover brightness-90 transition-transform duration-[4500ms] ease-out ${
          isZooming ? 'scale-105' : 'scale-100'
        }`}
      />

      {/* Atmospheric deep noir & gold radial gradient scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 pointer-events-none" />

      {/* 2. Top Bar: Live Animation Status */}
      <div className="absolute top-4 left-4 flex items-center z-20 pointer-events-auto">
        {/* Slide Counter & Animation Pulse */}
        <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-500/30 text-[11px] font-mono text-amber-300 shadow-md">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>
            {String((currentIndex % slides.length) + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </span>
          <span className="text-stone-500">|</span>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPaused(!isPaused);
            }}
            className="hover:text-white transition-colors cursor-pointer"
            title={isPaused ? "Resume Animation" : "Pause Animation"}
          >
            {isPaused ? <Play className="w-3 h-3 text-amber-400" /> : <Pause className="w-3 h-3 text-stone-300" />}
          </button>
        </div>
      </div>

      {/* 3. Left & Right Interactive Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-amber-500 text-stone-300 hover:text-stone-950 backdrop-blur-md border border-amber-500/30 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg hover:scale-110 active:scale-90"
            title="Previous Picture"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-amber-500 text-stone-300 hover:text-stone-950 backdrop-blur-md border border-amber-500/30 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg hover:scale-110 active:scale-90"
            title="Next Picture"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* 4. Active Slide Information & Storytelling Overlay */}
      <div className="absolute bottom-6 left-6 right-6 text-white space-y-1.5 z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 bg-amber-950/70 border border-amber-500/30 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1 shadow-xs">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            <span>{currentSlide.badge || 'Atelier Heritage · Shop G7'}</span>
          </span>
        </div>

        <h3 className="font-serif text-xl sm:text-2xl font-medium text-amber-100 tracking-tight transition-all duration-300">
          {currentSlide.title}
        </h3>

        <p className="text-xs text-stone-300 font-light max-w-lg leading-relaxed line-clamp-2">
          {currentSlide.subtitle}
        </p>

        {/* 5. Pagination Indicators & Progress Bar */}
        <div className="flex items-center justify-between pt-2 pointer-events-auto">
          {/* Slide Dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((slide, idx) => (
              <button
                key={slide.id || idx}
                type="button"
                onClick={(e) => handleSelectDot(idx, e)}
                className={`transition-all rounded-full cursor-pointer ${
                  idx === currentIndex % slides.length
                    ? 'w-6 h-1.5 bg-amber-400 shadow-xs'
                    : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80'
                }`}
                title={`Go to picture ${idx + 1}`}
              />
            ))}
          </div>

          <span className="text-[10px] font-mono text-stone-400/80">
            {isPaused ? 'Animation Paused' : 'Continuous Display'}
          </span>
        </div>
      </div>

      {/* 6. Subtle Bottom Animation Progress Bar */}
      {!isPaused && slides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60 z-30">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-50"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
