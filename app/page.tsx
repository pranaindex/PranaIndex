"use client";
import React, { useState, useEffect } from 'react';

export default function PranaIndex() {
  const [isTesting, setIsTesting] = useState(false);
  const [taps, setTaps] = useState([]);
  const [score, setScore] = useState(null);
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
    setScore("Regulated");
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
          <div className="text-4xl text-[#FFD700] mb-2">{timeLeft}s</div>
          <div className="text-[#FFD700]">TAP IN RHYTHM</div>
        </div>
      )}
    </main>
  );
}
