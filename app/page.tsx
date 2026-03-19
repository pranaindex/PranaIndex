"use client";
import React, { useState, useEffect } from 'react';

export default function PranaIndex() {
  const [isTesting, setIsTesting] = useState(false);
  const [taps, setTaps] = useState<number[]>([]);
  const [score, setScore] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);

  const startTest = () => {
    setIsTesting(true);
    setTaps([]);
    setScore(null);
    setTimeLeft(15);
  };

  const recordTap = () => {
    if (isTesting) {
      setTaps([...taps, performance.now()]);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTesting && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t), 1000);
    } else if (timeLeft === 0) {
      finishTest();
    }
    return () => clearInterval(timer);
  }, [isTesting, timeLeft]);

  const finishTest = () => {
    setIsTesting(false);
    if (taps.length < 5) {
      setScore("Need more taps!");
      return;
    }
    // Calculate Variability (Simplified Prana Score)
    const intervals = taps.slice(1).map((t, i) => t - taps[i]);
    const mean = intervals.reduce((a, b) => a + b) / intervals.length;
    const stdDev = Math.sqrt(intervals.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / intervals.length);
    setScore(stdDev.toFixed(2));
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans">
      {/* 1. THE LOGO - Pulsing Gold Pi */}
      <div className={`transition-all duration-500 ${isTesting ? 'scale-75' : 'scale-100'}`}>
        <img 
          src="/gold-pi-logo.png" 
          alt="Prana Index Logo" 
          className="w-48 h-48 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)] animate-pulse"
        />
        <h1 className="text-center text-2xl font-light tracking-widest mt-2 text-[#FFD700]">PRANA INDEX</h1>
      </div>

      {/* 2. THE INTRO */}
      {!isTesting && !score && (
        <div className="mt-12 text-center animate-fade-in">
          <p className="text-3xl font-serif italic text-gray-300">Find your Pi <span className="text-xs align-top">stress score</span></p>
        </div>
      )}

      {/* 3. THE GAME ZONE */}
      <div className="mt-12 w-full max-w-md">
        {!isTesting ? (
          <button 
            onClick={startTest}
            className="w-full border-2 border-[#FFD700] py-8 rounded-xl text-[#FFD700] text-2xl font-bold hover:bg-[#FFD700] hover:text-black transition-all"
          >
            {score ? `Your Score: ${score} (Tap to Retry)` : "START STRESS GAME"}
          </button>
        ) : (
          <div 
            onMouseDown={recordTap}
            className="w-full h-64 border-4 border-dashed border-[#FFD700] rounded-3xl flex flex-col items-center justify-center cursor-pointer active:bg-yellow-900/20 transition-colors"
          >
            <span className="text-6xl font-bold text-[#FFD700]">{timeLeft}s</span>
            <p className="mt-4 text-gray-400 uppercase tracking-widest">Tap the rhythm of your breath</p>
            <p className="text-sm text-yellow-600 mt-2">Taps: {taps.length}</p>
          </div>
        )}
      </div>

      {/* SNARKY FEEDBACK */}
      {score && !isTesting && (
        <p className="mt-8 text-[#FFD700] italic animate-bounce">
          {Number(score) < 50 ? "Zen Master detected." : "You're more wound up than a cheap watch."}
        </p>
      )}
    </main>
  );
}
