"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function PranaIndexApp() {
  const [screen, setScreen] = useState<'landing' | 'stress' | 'score' | 'email' | 'regulation' | 'win'>('landing');
  const [p1Taps, setP1Taps] = useState<number[]>([]);
  const [p2Taps, setP2Taps] = useState<number[]>([]);
  const [p2Start, setP2Start] = useState<number>(0);
  const [p3Hits, setP3Hits] = useState<number[]>([]);
  const [finalScore, setFinalScore] = useState<number>(0);
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
  const arenaRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  const P1_DURATION = 15000;
  const P2_TARGETS = 5;
  const P3_PEAK_TARGET = 85;
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
  
  const startStressGame = () => {
    setScreen('stress');
    setP1Taps([]);
    setTimeLeft(15);
    setP1Progress(0);
  };

  const handleP1Tap = () => {
    if (phaseTimerRef.current) {
      const elapsed = Date.now() - p1StartTimeRef.current;
      setP1Taps(prev => [...prev, elapsed]);
      const progress = Math.min((elapsed / P1_DURATION) * 100, 100);
      setP1Progress(progress);
    }
  };

  const p1StartTimeRef = useRef<number>(0);

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
  
  const calculateScore = () => {
    let rScore = 100;
    if (p1Taps.length > 5) {
      const intervals = [];
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
    if (final >= 75) {
      title = 'USTAAD! FULL KIRRAAK!';
      body = 'Baap! You are in the right mood today! Like a double-masala Biryani, you are perfect. Your rhythm is elite. Lure Veer status unlocked!';
      tone = 'gold';
    } else if (final >= 55) {
      title = 'ZABARDAST MOOD!';
      body = 'Smooth like midnight Irani Chai. You are steady and focused. System noise is low. Definitely a solid baseline today, mawa!';
      tone = 'white';
    } else {
      title = 'TOTAL GHOTALA!';
      body = 'Kya re? Your timing is shaky like an old auto on a pothole road. Brain is doing Nagin Dance. Take a break and reboot your baseline!';
      tone = 'red';
    }
    setVerdict({ title, body, tone });
    setScreen('score');
  };
  
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      setScreen('regulation');
    }
  };

  const startRegulation = () => {
    setRegPhase('ready');
    setBubbleScale(1);
    setRegCycles(0);
    setRegTimer(5);
    setRegInstruction('HOLD TO INHALE');
    regHoldingRef.current = false;
  };

  const handleRegDown = () => {
    if (regPhase === 'exhale') return;
    regHoldingRef.current = true;
    setRegPhase('inhale');
    setRegInstruction('INHALE...');

    let startTime = Date.now();
    if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);

    phaseTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > 5.5) {
        clearInterval(phaseTimerRef.current!);
        setRegInstruction('HOLD TO INHALE');
        setRegPhase('ready');
        regHoldingRef.current = false;
        return;
      }
      const scale = 1 + (1.8 * Math.min(elapsed / 5, 1));
      setBubbleScale(scale);
      setRegTimer(parseFloat((5 - elapsed).toFixed(1)));
    }, 16);
  };

  const handleRegUp = () => {
    if (!regHoldingRef.current || regPhase !== 'inhale') return;
    regHoldingRef.current = false;
    clearInterval(phaseTimerRef.current!);

    const inhaleOk = true;
    if (inhaleOk) {
      setRegPhase('exhale');
      setRegInstruction('EXHALE...');

      let startTime = Date.now();
      phaseTimerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= 5) {
          clearInterval(phaseTimerRef.current!);
          const newCycles = regCycles + 1;
          setRegCycles(newCycles);
          if (newCycles >= 3) {
            setScreen('win');
          } else {
            setRegPhase('ready');
            setRegInstruction('HOLD TO INHALE');
          }
        } else {
          const scale = 2.8 - (1.8 * (elapsed / 5));
          setBubbleScale(Math.max(1, scale));
          setRegTimer(parseFloat((5 - elapsed).toFixed(1)));
        }
      }, 16);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center select-none relative overflow-hidden">
      {/* Neural Network Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `radial-gradient(circle at 30% 40%, rgba(212,175,55,0.15) 0%, transparent 40%),
            radial-gradient(circle at 70% 60%, rgba(57,255,20,0.12) 0%, transparent 35%),
            radial-gradient(circle at 50% 20%, rgba(212,175,55,0.1) 0%, transparent 30%),
            radial-gradient(circle at 20% 80%, rgba(57,255,20,0.08) 0%, transparent 25%),
            radial-gradient(circle at 80% 30%, rgba(212,175,55,0.1) 0%, transparent 35%),
            radial-gradient(circle at 40% 70%, rgba(57,255,20,0.15) 0%, transparent 30%)`,
          backgroundSize: '100% 100%',
        }} />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(212,175,55,0.03) 2px, rgba(212,175,55,0.03) 3px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(57,255,20,0.03) 2px, rgba(57,255,20,0.03) 3px)`,
        }} />
      </div>

      {/* Home/Logo Button */}
      {screen !== 'landing' && (
        <button onClick={() => setScreen('landing')} className="absolute top-6 left-6 z-50 flex flex-col items-center">
          <img src="/gold-pi-logo.png" alt="PI" className="w-16 h-16 object-contain" />
        </button>
      )}
      
      {/* LANDING SCREEN */}
      {screen === 'landing' && (
        <div className="z-10 flex flex-col items-center max-w-lg px-6">
          <img src="/gold-pi-logo.png" alt="Prana Index" className="w-64 h-64 md:w-80 md:h-80 object-contain mb-6 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase bg-gradient-to-r from-[#D4AF37] via-[#39FF14] to-[#D4AF37] bg-clip-text text-transparent italic mb-2 text-center">PRANA INDEX</h1>
          <p className="text-xs tracking-[0.3em] text-[#D4AF37] font-bold mb-10 uppercase italic text-center">Play Your Rhythm</p>
          <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 text-left text-sm mb-10 w-full shadow-2xl space-y-4">
            <p><span className="text-[#D4AF37] font-black uppercase text-xs">Phase 01 — RHYTHM</span><br/><span className="text-white/70 italic">Tap a steady beat for 15 seconds. Dont stop clicking!</span></p>
            <p><span className="text-[#D4AF37] font-black uppercase text-xs">Phase 02 — AGILITY</span><br/><span className="text-white/70 italic">Catch 5 nodes as fast as possible.</span></p>
            <p><span className="text-[#D4AF37] font-black uppercase text-xs">Phase 03 — FLOW</span><br/><span className="text-white/70 italic">Hit the button at the peak of the wave.</span></p>
          </div>
          <button onClick={startStressGame} className="bg-gradient-to-r from-[#D4AF37] via-[#FFE135] to-[#D4AF37] text-black font-black px-16 py-5 rounded-full text-xl shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter italic">BEGIN STRESS TEST</button>
        </div>
      )}{/* STRESS GAME PHASE 1 */}
{screen === 'p1' && (
  <div className="z-10 flex flex-col items-center w-full pt-24">
    <div className="text-center mb-4">
      <p className="text-[#D4AF37] text-xs tracking-[0.2em] uppercase font-bold">Phase 01</p>
      <p className="text-white text-lg font-bold italic">RHYTHM</p>
    </div>
    <div className="text-center">
      <p className="text-white/70 text-sm mb-6">Tap rapidly to match the rhythm</p>
      <div className="text-6xl font-black text-[#39FF14] mb-4" style={{ textShadow: '0 0 30px rgba(57,255,20,0.6)' }}>
        {phase1Score}
      </div>
      <div className="flex items-center justify-center gap-2">
        <span className="text-[#D4AF37] text-xs">Taps: </span>
        <span className="text-[#D4AF37] font-bold text-lg">{phase1Taps}</span>
      </div>
      <p className="text-white/50 text-xs mt-4">Keep tapping!</p>
    </div>
  </div>
)}

{/* STRESS GAME PHASE 2 */}
{screen === 'p2' && (
  <div className="z-10 flex flex-col items-center justify-center w-full h-full pt-32">
    <div className="text-center mb-6">
      <p className="text-[#D4AF37] text-xs tracking-[0.2em] uppercase font-bold">Phase 02</p>
      <p className="text-white text-lg font-bold italic">AGILITY</p>
    </div>
    <div className="relative w-full max-w-lg h-64 border-2 border-[#D4AF37]/30 rounded-2xl bg-gradient-to-br from-gray-900/80 to-black/80">
      <div
        className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-[#39FF14] to-[#D4AF37] cursor-pointer transition-all duration-100 shadow-[0_0_20px_rgba(57,255,20,0.6)]"
        style={{ left: nodeX, top: nodeY }}
        onClick={handleNodeTap}
      />
    </div>
    <div className="flex items-center gap-6 mt-6">
      <div className="text-center">
        <span className="text-[#D4AF37] text-xs">NODES</span>
        <div className="text-[#39FF14] font-black text-2xl">{phase2Caught}</div>
      </div>
      <div className="text-center">
        <span className="text-[#D4AF37] text-xs">LEFT</span>
        <div className="text-white font-bold text-2xl">{5 - phase2Caught}</div>
      </div>
      <div className="text-center">
        <span className="text-[#D4AF37] text-xs">SCORE</span>
        <div className="text-[#D4AF37] font-bold text-2xl">{phase2Score}</div>
      </div>
    </div>
    <p className="text-white/50 text-xs mt-4">Catch all nodes!</p>
  </div>
)}

{/* STRESS GAME PHASE 3 */}
{screen === 'p3' && (
  <div className="z-10 flex flex-col items-center w-full pt-24">
    <div className="text-center mb-6">
      <p className="text-[#D4AF37] text-xs tracking-[0.2em] uppercase font-bold">Phase 03</p>
      <p className="text-white text-lg font-bold italic">FLOW</p>
    </div>
    <p className="text-white/70 text-sm mb-6">Hit at the peak of the wave</p>
    <div className="relative w-full max-w-lg h-48 border-2 border-[#D4AF37]/30 rounded-2xl bg-gradient-to-br from-gray-900/80 to-black/80 overflow-hidden">
      <div className="absolute inset-0 flex items-end justify-center pb-0">
        <div className="w-full transition-all duration-75" style={{ height: `${waveHeight}%`, background: 'linear-gradient(to top, rgba(212,175,55,0.3), rgba(57,255,20,0.6), rgba(212,175,55,0.3))' }} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <button onClick={handleWaveHit} className="w-24 h-24 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#39FF14] shadow-[0_0_30px_rgba(212,175,55,0.5)] hover:scale-110 active:scale-95 transition-all" />
      </div>
    </div>
    <div className="flex items-center gap-4 mt-6">
      <div className="text-center"><span className="text-[#D4AF37] text-xs">WAVE</span><div className="text-white font-bold text-xl">{waveProgress}%</div></div>
      <div className="text-center"><span className="text-[#D4AF37] text-xs">HITS</span><div className="text-[#39FF14] font-black text-xl">{phase3Hits}</div></div>
      <div className="text-center"><span className="text-[#D4AF37] text-xs">SCORE</span><div className="text-[#D4AF37] font-bold text-xl">{phase3Score}</div></div>
    </div>
  </div>
)}

{/* SCORE CARD SCREEN */}
{screen === 'score' && (
  <div className="z-10 flex flex-col items-center w-full pt-16 px-6">
    <h2 className="text-3xl font-black text-[#D4AF37] mb-2 italic">STRESS TEST COMPLETE</h2>
    <p className="text-white/70 text-sm mb-8">Here are your results</p>
    <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 w-full max-w-md space-y-4">
      <div className="flex justify-between items-center py-3 border-b border-white/10"><span className="text-[#D4AF37] text-sm">RHYTHM</span><span className="text-[#39FF14] font-bold text-xl">{phase1Score}</span></div>
      <div className="flex justify-between items-center py-3 border-b border-white/10"><span className="text-[#D4AF37] text-sm">AGILITY</span><span className="text-[#39FF14] font-bold text-xl">{phase2Score}</span></div>
      <div className="flex justify-between items-center py-3 border-b border-white/10"><span className="text-[#D4AF37] text-sm">FLOW</span><span className="text-[#39FF14] font-bold text-xl">{phase3Score}</span></div>
      <div className="flex justify-between items-center py-3 pt-4"><span className="text-white font-bold uppercase">TOTAL</span><span className="text-[#FFE135] font-black text-3xl">{totalScore}</span></div>
    </div>
    <p className="text-white/70 text-sm mt-8 mb-4 text-center">Ready for the Regulation Game?</p>
    <p className="text-[#D4AF37] text-xs mb-6 text-center">Enter your email to continue</p>
    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full max-w-xs px-6 py-4 rounded-full bg-white/10 border border-[#D4AF37]/30 text-white placeholder-white/40 text-center text-lg focus:outline-none focus:border-[#39FF14] mb-6" />
    <button onClick={handleStartReg} disabled={!email.includes('@')} className="bg-gradient-to-r from-[#D4AF37] via-[#FFE135] to-[#D4AF37] text-black font-black px-12 py-4 rounded-full text-lg shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter italic disabled:opacity-50 disabled:cursor-not-allowed">Begin Regulation Game</button>
  </div>
)}

{/* REGULATION GAME SCREEN */}
{screen === 'reg' && (
  <div className="z-10 flex flex-col items-center w-full pt-16 px-6">
    <div className="text-center mb-6">
      <p className="text-[#D4AF37] text-xs tracking-[0.2em] uppercase font-bold">REGULATION</p>
      <p className="text-white text-lg font-bold italic">Breathe with the Rhythm</p>
    </div>
    <div className="text-center mb-4">
      <p className="text-white text-sm font-bold italic">{regInstruction}</p>
      <div className="text-[#39FF14] font-bold text-lg">Cycle {regCycles + 1} of 3</div>
    </div>
    <div className="relative w-full max-w-md h-64 flex items-center justify-center">
      <div
        className="w-24 h-24 rounded-full bg-gradient-to-br from-[#39FF14] to-[#D4AF37] shadow-[0_0_40px_rgba(57,255,20,0.5)] transition-all duration-75"
        style={{ transform: `scale(${bubbleScale})` }}
      />
    </div>
    <div className="flex items-center gap-6 mt-6">
      <div className="text-center"><span className="text-[#D4AF37] text-xs">TIMER</span><div className="text-white font-bold text-xl">{regTimer}s</div></div>
      <div className="text-center"><span className="text-[#D4AF37] text-xs">CYCLES</span><div className="text-[#39FF14] font-black text-xl">{regCycles}/3</div></div>
    </div>
    <p className="text-white/50 text-xs mt-4">Hold to inhale, release to exhale</p>
  </div>
)}

{/* WIN SCREEN */}
{screen === 'win' && (
  <div className="z-10 flex flex-col items-center w-full pt-16 px-6">
    <div className="text-center mb-6">
      <p className="text-[#39FF14] text-xs tracking-[0.2em] uppercase font-bold">COMPLETE</p>
      <h2 className="text-3xl font-black text-[#D4AF37] mb-2 italic">CONGRATULATIONS</h2>
      <p className="text-white/70 text-sm">You completed the Regulation Game</p>
    </div>
    <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 w-full max-w-md text-center">
      <p className="text-white text-sm mb-4">Your stress test total was</p>
      <div className="text-[#FFE135] font-black text-5xl mb-4">{totalScore}</div>
      <p className="text-[#39FF14] text-sm font-bold">Email: {email}</p>
    </div>
    <button onClick={() => setScreen('landing')} className="mt-8 bg-gradient-to-r from-[#D4AF37] via-[#FFE135] to-[#D4AF37] text-black font-black px-12 py-4 rounded-full text-lg shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter italic">Play Again</button>
  </div>
)}
  </div>
    );

    }
