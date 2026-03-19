"use client"; import React, { useState, useEffect, useRef } from 'react';

export default function PranaIndexApp() {
  const [screen, setScreen] = useState<'landing' | 'stress' | 'score' | 'email' | 'reg' | 'p1' | 'p2' | 'p3' | 'win'>('landing');
  const [p1Taps, setP1Taps] = useState<number[]>([]);
  const [p2Taps, setP2Taps] = useState<number[]>([]);
  const [p2Start, setP2Start] = useState(0);
  const [p3Hits, setP3Hits] = useState<number[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const [email, setEmail] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [p1Progress, setP1Progress] = useState(0);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [pulseSize, setPulseSize] = useState(0);
  const [pulseDir, setPulseDir] = useState(1);
  const [hitCount, setHitCount] = useState(0);
  const [verdict, setVerdict] = useState({ title: '', body: '', tone: 'neutral' as 'gold' | 'white' | 'red' });
  const [regPhase, setRegPhase] = useState<'ready' | 'inhale' | 'exhale'>('ready');
  const [bubbleScale, setBubbleScale] = useState(1);
  const [regTimer, setRegTimer] = useState(5);
  const [regCycles, setRegCycles] = useState(0);
  const [regInstruction, setRegInstruction] = useState('HOLD TO INHALE');
  const regHoldingRef = useRef(false);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const p1TimerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseRef = useRef<number | null>(null);
  const arenaRef = useRef(null);
  const targetRef = useRef(null);
  const p1StartTimeRef = useRef(0);
  const P1_DURATION = 15000;;
  const P3_PEAK_TARGET = 85;;
  const P2_TARGETS = 5;
  const P3_TOLERANCE = 10;

  useEffect(() => {
    if (screen === 'landing') {
      setP1Taps([]); setP2Taps([]); setP3Hits([]); setTimeLeft(15);
      setP1Progress(0); setHitCount(0); setPulseSize(0);
      setRegPhase('ready'); setBubbleScale(1); setRegCycles(0);
      setRegInstruction('HOLD TO INHALE');
      regHoldingRef.current = false;
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
      if (p1TimerRef.current) clearInterval(p1TimerRef.current);
      if (pulseRef.current) cancelAnimationFrame(pulseRef.current);
    }
    return () => {
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
      if (p1TimerRef.current) clearInterval(p1TimerRef.current);
      if (pulseRef.current) cancelAnimationFrame(pulseRef.current);
    };
  }, [screen]);

  const startPhase1 = () => {
    setP1Taps([]); setTimeLeft(15); setP1Progress(0);
    p1StartTimeRef.current = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - p1StartTimeRef.current;
      setP1Progress(Math.min((elapsed / P1_DURATION) * 100, 100));
      setTimeLeft(Math.max(0, 15 - elapsed / 1000));
      if (elapsed >= P1_DURATION) { clearInterval(progressInterval); startPhase2(); }
    }, 50);
    p1TimerRef.current = progressInterval;
  };

  const startPhase2 = () => {
    setP2Taps([]); setP2Start(Date.now());
    setTargetPos({ x: Math.random() * 70 + 15, y: Math.random() * 60 + 20 });
  };

  const handleTargetTap = () => {
    const newTaps = [...p2Taps, Date.now() - p2Start];
    setP2Taps(newTaps);
    if (newTaps.length >= P2_TARGETS) {
      startPhase3();
    } else {
      setTargetPos({ x: Math.random() * 70 + 15, y: Math.random() * 60 + 20 });
    }
  };

  const startPhase3 = () => {
    setP3Hits([]); setHitCount(0); setPulseSize(0); setPulseDir(1);
    const animatePulse = () => {
      setPulseSize(prev => {
        let newSize = prev + pulseDir * 1.5;
        if (newSize >= 100) { newSize = 0; setPulseDir(1); }
        if (newSize <= 0) { setPulseDir(-1); }
        return newSize;
      });
      pulseRef.current = requestAnimationFrame(animatePulse);
    };
    pulseRef.current = requestAnimationFrame(animatePulse);
  };

  const handleFlowTap = () => {
    setP3Hits(prev => [...prev, pulseSize]);
    setHitCount(prev => {
      const nc = prev + 1;
      if (nc >= 3 && pulseRef.current) cancelAnimationFrame(pulseRef.current);
      if (nc >= 3) calculateScore();
      return nc;
    });
  };

  const calculateScore = () => {
    let rScore = 100;
    if (p1Taps.length > 5) {
      const intervals: number[] = [];
      for (let i = 1; i < p1Taps.length; i++) intervals.push(p1Taps[i] - p1Taps[i - 1]);
      const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const stdDev = Math.sqrt(intervals.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / intervals.length);
      const cv = (stdDev / mean) * 100;
      rScore = Math.max(0, 100 - cv * 5);
    }
    let sScore = 100;
    if (p2Taps.length >= P2_TARGETS) {
      const avgReflex = p2Taps.reduce((a, b) => a + b, 0) / p2Taps.length;
      sScore = Math.max(0, Math.min(100, 125 - avgReflex / 5));
    }
    let fScore = 100;
    if (p3Hits.length >= 3) {
      const avgPeak = p3Hits.reduce((a, b) => a + b, 0) / p3Hits.length;
      const diff = Math.abs(avgPeak - P3_PEAK_TARGET);
      fScore = Math.max(0, 100 - diff * 3);
    }
    const final = Math.min(99, Math.round(rScore * 0.4 + sScore * 0.3 + fScore * 0.3));
    setFinalScore(final);
    let title = '', body = '', tone: 'gold' | 'white' | 'red' = 'white';
    if (final >= 75) { title = 'USTAAD! FULL KIRRAAK!'; body = 'Baap! You are in the right mood today!'; tone = 'gold'; }
    else if (final >= 55) { title = 'ZABARDAST MOOD!'; body = 'Smooth like midnight Irani Chai.'; tone = 'white'; }
    else { title = 'TOTAL GHOTALA!'; body = 'Kya re? Your timing is shaky.'; tone = 'red'; }
    setVerdict({ title, body, tone });
    setScreen('score');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) setScreen('reg');
  };

  const startRegulation = () => {
    setRegPhase('ready'); setBubbleScale(1); setRegCycles(0); setRegTimer(5);
    setRegInstruction('HOLD TO INHALE'); regHoldingRef.current = false;
  };

  const handleRegDown = () => {
    if (regPhase === 'exhale') return;
    regHoldingRef.current = true;
    setRegPhase('inhale'); setRegInstruction('INHALE...');
    let startTime = Date.now();
    if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    phaseTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > 5.5) {
        clearInterval(phaseTimerRef.current!);
        setRegInstruction('HOLD TO INHALE'); setRegPhase('ready');
        regHoldingRef.current = false;
        return;
      }
      setBubbleScale(1 + 1.8 * Math.min(elapsed / 5, 1));
      setRegTimer(parseFloat((5 - elapsed).toFixed(1)));
    }, 16);
  };

  const handleRegUp = () => {
    if (!regHoldingRef.current || regPhase !== 'inhale') return;
    regHoldingRef.current = false;
    clearInterval(phaseTimerRef.current!);
    setRegPhase('exhale'); setRegInstruction('EXHALE...');
    let startTime = Date.now();
    phaseTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= 5) {
        clearInterval(phaseTimerRef.current!);
        const nc = regCycles + 1; setRegCycles(nc);
        if (nc >= 3) { setScreen('win'); }
        else { setRegPhase('ready'); setRegInstruction('HOLD TO INHALE'); }
      } else {
        setBubbleScale(Math.max(1, 2.8 - 1.8 * (elapsed / 5)));
        setRegTimer(parseFloat((5 - elapsed).toFixed(1)));
      }
    }, 16);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {screen !== 'landing' && (
        <button onClick={() => setScreen('landing')} className="absolute top-6 left-6 z-50">
          <span className="text-xl font-black tracking-widest text-[#39FF14]">PI</span>
        </button>
      )}

      {screen === 'landing' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-6xl font-black mb-2 tracking-tighter">Prana Index</h1>
          <p className="text-[#39FF14] mb-12 tracking-widest">YOUR STRESS BASELINE</p>
          <div className="space-y-6 mb-12">
            <div className="bg-white/5 border border-[#D4AF37]/30 p-6 rounded-2xl max-w-md">
              <h3 className="text-[#39FF14] font-bold text-lg mb-2">Phase 01 — RHYTHM</h3>
              <p className="text-white/70">Tap a steady beat for 15 seconds. Dont stop clicking!</p>
            </div>
            <div className="bg-white/5 border border-[#D4AF37]/30 p-6 rounded-2xl max-w-md">
              <h3 className="text-[#39FF14] font-bold text-lg mb-2">Phase 02 — AGILITY</h3>
              <p className="text-white/70">Catch 5 nodes as fast as possible.</p>
            </div>
            <div className="bg-white/5 border border-[#D4AF37]/30 p-6 rounded-2xl max-w-md">
              <h3 className="text-[#39FF14] font-bold text-lg mb-2">Phase 03 — FLOW</h3>
              <p className="text-white/70">Hit the button at the peak of the wave.</p>
            </div>
          </div>
          <button onClick={startPhase1} className="bg-gradient-to-r from-[#D4AF37] via-[#FFE135] to-[#D4AF37] text-black font-black px-12 py-4 rounded-full text-lg shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter italic">BEGIN STRESS TEST</button>
        </div>
      )}

      {screen === 'p1' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-3xl font-bold text-[#39FF14] mb-2">Phase 01</h2>
          <h1 className="text-5xl font-black mb-8">RHYTHM</h1>
          <p className="text-white/70 mb-8">Tap rapidly to match the rhythm</p>
          <div className="w-full max-w-md bg-white/5 rounded-full h-8 mb-4">
            <div className="bg-[#39FF14] h-full rounded-full transition-all" style={{ width: `${p1Progress}%` }} />
          </div>
          <p className="text-2xl font-bold text-[#39FF14]">Taps: {p1Taps.length}</p>
          <p className="text-white/70">Keep tapping!</p>
        </div>
      )}

      {screen === 'p2' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <h2 className="text-3xl font-bold text-[#39FF14] mb-2">Phase 02</h2>
          <h1 className="text-5xl font-black mb-8">AGILITY</h1>
          <p className="text-white/70 mb-8">Catch all nodes!</p>
          <div className="text-4xl font-bold text-[#39FF14] mb-8">
            {p2Taps.length}/{P2_TARGETS} caught
          </div>
          <div className="relative w-80 h-80 bg-white/5 rounded-2xl" ref={arenaRef}>
            <button
              onClick={handleTargetTap}
              ref={targetRef}
              className="absolute w-16 h-16 bg-[#D4AF37] rounded-full shadow-[0_0_30px_rgba(212,175,55,0.6)] hover:scale-110 active:scale-95 transition-all"
              style={{ left: `${targetPos.x}%`, top: `${targetPos.y}%` }}
            />
          </div>
          <p className="text-white/70 mt-8">{P2_TARGETS - p2Taps.length} nodes left</p>
        </div>
      )}

      {screen === 'p3' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-3xl font-bold text-[#39FF14] mb-2">Phase 03</h2>
          <h1 className="text-5xl font-black mb-8">FLOW</h1>
          <p className="text-white/70 mb-8">Hit at the peak of the wave</p>
          <div className="w-full max-w-md bg-white/5 rounded-2xl p-8 mb-8">
            <div className="relative h-32 bg-white/5 rounded-xl overflow-hidden">
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-gradient-to-t from-[#39FF14] to-transparent rounded-full transition-all"
                style={{ width: `${pulseSize}%`, height: `${pulseSize}%` }}
              />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm text-white/50">Peak Zone: {P3_PEAK_TARGET}%</div>
            </div>
          </div>
          <button
            onClick={handleFlowTap}
            className="w-32 h-32 bg-[#D4AF37] rounded-full shadow-[0_0_40px_rgba(212,175,55,0.6)] hover:scale-105 active:scale-95 transition-all text-black font-black text-lg"
          >TAP!</button>
          <p className="text-white/70 mt-6">Hits: {hitCount}/3</p>
        </div>
      )}

      {screen === 'score' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-4xl font-bold text-[#39FF14] mb-2">STRESS TEST COMPLETE</h2>
          <p className="text-white/70 mb-8">Here are your results</p>
          <div className={`bg-gradient-to-br from-[#${verdict.tone === 'gold' ? 'D4AF37' : verdict.tone === 'red' ? 'FF4444' : '9CA3AF'}/20 to-black border border-[#${verdict.tone === 'gold' ? 'D4AF37' : verdict.tone === 'red' ? 'FF4444' : '9CA3AF'}/30 p-8 rounded-2xl mb-8`}>
            <h3 className={`text-3xl font-black mb-2 text-[#${verdict.tone === 'gold' ? 'D4AF37' : verdict.tone === 'red' ? 'FF4444' : '39FF14'}]`}>
              {verdict.title}
            </h3>
            <p className="text-white/70">{verdict.body}</p>
          </div>
          <p className="text-6xl font-black text-[#D4AF37] mb-8">{finalScore}</p>
          <p className="text-white/70 mb-8">Ready for the Regulation Game?</p>
          <form onSubmit={handleEmailSubmit} className="w-full max-w-xs">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-6 py-4 rounded-full bg-white/10 border border-[#D4AF37]/30 text-white placeholder-white/40 text-center focus:outline-none focus:border-[#39FF14] mb-4"
            />
            <button type="submit" className="w-full bg-gradient-to-r from-[#39FF14] to-[#D4AF37] text-black font-black px-8 py-4 rounded-full text-lg shadow-[0_0_40px_rgba(57,255,20,0.4)] hover:scale-105 active:scale-95 transition-all">
              Begin Regulation Game
            </button>
          </form>
        </div>
      )}

      {screen === 'reg' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-3xl font-bold text-[#39FF14] mb-2">REGULATION</h2>
          <h1 className="text-5xl font-black mb-4">Breathe with the Rhythm</h1>
          <p className="text-2xl font-bold text-[#D4AF37] mb-4">{regInstruction}</p>
          <p className="text-white/70 mb-8">Cycle {regCycles + 1} of 3</p>
          <div className="relative w-64 h-64 mb-8">
            <div
              className="absolute inset-0 bg-[#39FF14]/20 rounded-full transition-all duration-300"
              style={{ transform: `scale(${bubbleScale})`, left: '50%', top: '50%', marginLeft: '-50%', marginTop: '-50%' }}
              onMouseDown={handleRegDown}
              onMouseUp={handleRegUp}
              onTouchStart={handleRegDown}
              onTouchEnd={handleRegUp}
            />
          </div>
          <p className="text-white/70">Timer: {regTimer}s</p>
          <p className="text-white/70">Cycles: {regCycles}/3</p>
          <p className="text-white/50 mt-4">Hold to inhale, release to exhale</p>
        </div>
      )}

      {screen === 'win' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-4xl font-bold text-[#39FF14] mb-2">COMPLETE</h2>
          <h1 className="text-6xl font-black mb-8 text-[#D4AF37]">CONGRATULATIONS!</h1>
          <p className="text-white/70 mb-4">You completed the Regulation Game</p>
          <p className="text-white/70 mb-8">Your stress test total was</p>
          <p className="text-8xl font-black text-[#D4AF37] mb-4">{finalScore}</p>
          <p className="text-white/70 mb-12">Email: {email}</p>
          <button onClick={() => setScreen('landing')} className="bg-gradient-to-r from-[#D4AF37] via-[#FFE135] to-[#D4AF37] text-black font-black px-12 py-4 rounded-full text-lg shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter italic">Play Again</button>
        </div>
      )}
    </div>
  );
}
  const P3_TOLERANCE = 10;

  useEffect(() => {
    if (screen === 'landing') {
      setP1Taps([]);
      setP2Taps([]);
      setP3Hits([]);
      setTimeLeft(15);
      setP1Progress(0);
      setHitCount(0);
      setPulseSize(0);
      setRegPhase('ready');
      setBubbleScale(1);
      setRegCycles(0);
      setRegInstruction('HOLD TO INHALE');
      regHoldingRef.current = false;
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
      if (p1TimerRef.current) clearInterval(p1TimerRef.current);
      if (pulseRef.current) cancelAnimationFrame(pulseRef.current);
    }
    return () => {
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
      if (p1TimerRef.current) clearInterval(p1TimerRef.current);
      if (pulseRef.current) cancelAnimationFrame(pulseRef.current);
    };
  }, [screen]);

  const startPhase1 = () => {
    setP1Taps([]);
    setTimeLeft(15);
    setP1Progress(0);
    p1StartTimeRef.current = Date.now();
    setTimeLeft(15);
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - p1StartTimeRef.current;
      const progress = (elapsed / P1_DURATION) * 100;
      setP1Progress(progress);
      setTimeLeft(Math.max(0, 15 - elapsed / 1000));
      if (elapsed >= P1_DURATION) {
        clearInterval(progressInterval);
        startPhase2();
      }
    }, 50);
    p1TimerRef.current = progressInterval;
  };

  const startPhase2 = () => {
    setP2Taps([]);
    setP2Start(Date.now());
    setTargetPos({ x: Math.random() * 70 + 15, y: Math.random() * 60 + 20 });
  };

  const handleTargetTap = () => {
    const newTaps = [...p2Taps, Date.now() - p2Start];
    setP2Taps(newTaps);
    if (newTaps.length >= P2_TARGETS) {
      startPhase3();
    } else {
      setTargetPos({ x: Math.random() * 70 + 15, y: Math.random() * 60 + 20 });
    }
  };

  const startPhase3 = () => {
    setP3Hits([]);
    setHitCount(0);
    setPulseSize(0);
    setPulseDir(1);
    const animatePulse = () => {
      setPulseSize(prev => {
        let newSize = prev + (pulseDir * 1.5);
        if (newSize >= 100) { newSize = 0; setPulseDir(1); }
        if (newSize <= 0) { setPulseDir(-1); }
        return newSize;
      });
      pulseRef.current = requestAnimationFrame(animatePulse);
    };
    pulseRef.current = requestAnimationFrame(animatePulse);
  };

  const handleFlowTap = () => {
    setP3Hits(prev => [...prev, pulseSize]);
    setHitCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        if (pulseRef.current) cancelAnimationFrame(pulseRef.current);
        calculateScore();
      }
      return newCount;
    });
  };
  const P2_TARGETS = 5;
  const P3_PEAK_TARGET = 85;
  const P3_TOLERANCE = 10;
