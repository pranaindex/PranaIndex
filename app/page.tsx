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

  useEffect(() => {
    let timer: any;
    if (isTesting && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTesting(false);
      calculateScore();
    }
    return () => clearInterval(timer);
  }, [isTesting, timeLeft]);

  const calculateScore = () => {
    if (taps.length < 3) {
      setScore("More taps needed");
      return;
    }
    setScore("Regulated"); // Simplified for the first build
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="text-[#FFD700] text-6xl mb-4">π</div>
      <h1 className="text-[#FFD700] tracking-widest mb-8">PRANA INDEX</h1>
      
      {!isTesting ? (
        <button 
          onClick={startTest}
          className="border border-[#FFD700] p-6 text-[#FFD700] hover:bg-[#FFD700] hover:text-black transition-all"
        >
          {score ? `Result: ${score} - Try Again` : "START STRESS TEST"}
        </button>
      ) : (
        <div 
          onClick={() => setTaps([...taps, Date.now()])}
          className="w-64 h-64 border-2 border-dashed border-[#FFD700] flex flex-col items-center justify-center cursor-pointer"
        >
          <span className="text-4xl text-[#FFD700]">{timeLeft}s</span>
          <p className="text-xs mt-2">TAP IN RHYTHM</p>
        </div>
      )}
    </main>
  );
}
