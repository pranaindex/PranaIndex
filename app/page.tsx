"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function PranaIndexApp() {
  const [screen, setScreen] = useState<'landing' | 'p1' | 'p2' | 'p3' | 'score' | 'email' | 'reg' | 'win'>('landing');
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
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLButtonElement | null>(null);
  const p1StartTimeRef = useRef(0);

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

  const startPhase1 = () => {
    setScreen('p1');
    setP1Taps([]);
    setTimeLeft(15);
    setP1Progress(0);
    p1StartTimeRef.current = Date.now();
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

  const handleP1Tap = () => {
    if (phaseTimerRef.current) {
      const elapsed = Date.now() - p1StartTimeRef.current;
      setP1Taps(prev => [...prev, elapsed]);
    }
  };

  const startPhase2 = () => {
    setScreen('p2');
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
    setScreen('p3');
    setP3Hits([]);
    setHitCount(0);
    setPulseSize(0);
    setPulseDir(1);
    const animatePulse = () => {
      setPulseSize(prev => {
        let newSize = prev + (pulseDir * 1.5);
        if (newSize >= 100) {
          newSize = 0;
          setPulseDir(1);
        }
        if (newSize <= 0) {
          setPulseDir(-1);
        }
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
    if (p1Taps.length > 1) {
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
    if (final >= 75) {
      title = 'USTAAD! FULL KIRRAAK!';
      body = 'Baap! You are in the right mood today!';
      tone = 'gold';
    } else if (final >= 55) {
      title = 'ZABARDAST MOOD!';
      body = 'Smooth like midnight Irani Chai.';
      tone = 'white';
    } else {
      title = 'TOTAL GHOTALA!';
      body = 'Your timing is shaky.';
      tone = 'red';
    }
    setVerdict({ title, body, tone });
    setScreen('score');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      setScreen('reg');
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #000000 0%, #1a0033 50%, #000000 100%)', color: 'white', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden' }}>
      {/* Neural Network Background */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />

      {/* Home Button */}
      {screen !== 'landing' && (
        <button onClick={() => setScreen('landing')} style={{ position: 'absolute', top: 20, left: 20, zIndex: 50, background: 'rgba(212,175,55,0.2)', border: '1px solid #D4AF37', borderRadius: 8, padding: '8px 16px', color: '#D4AF37', fontSize: 14, cursor: 'pointer' }}>PI Home</button>
      )}

      {/* LANDING SCREEN */}
      {screen === 'landing' && (
        <div style={{ textAlign: 'center', zIndex: 10 }}>
          <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 8, background: 'linear-gradient(135deg, #D4AF37, #FFE135)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textTransform: 'uppercase', letterSpacing: 4 }}>Prana Index</h1>
          <p style={{ fontSize: 18, color: '#fff8', marginBottom: 40 }}>STRESS TEST SYSTEM v1.0</p>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 32, maxWidth: 500, border: '1px solid rgba(212,175,55,0.3)' }}>
            <div style={{ marginBottom: 24, textAlign: 'left' }}>
              <h3 style={{ color: '#D4AF37', fontSize: 14, marginBottom: 8, letterSpacing: 2 }}>PHASE 01 — RHYTHM</h3>
              <p style={{ color: '#fff8', fontSize: 13 }}>Tap a steady beat for 15 seconds. Dont stop clicking!</p>
            </div>
            <div style={{ marginBottom: 24, textAlign: 'left' }}>
              <h3 style={{ color: '#39FF14', fontSize: 14, marginBottom: 8, letterSpacing: 2 }}>PHASE 02 — AGILITY</h3>
              <p style={{ color: '#fff8', fontSize: 13 }}>Catch 5 nodes as fast as possible.</p>
            </div>
            <div style={{ marginBottom: 32, textAlign: 'left' }}>
              <h3 style={{ color: '#39E6FF', fontSize: 14, marginBottom: 8, letterSpacing: 2 }}>PHASE 03 — FLOW</h3>
              <p style={{ color: '#fff8', fontSize: 13 }}>Hit the button at the peak of the wave.</p>
            </div>
            <button onClick={startPhase1} style={{ width: '100%', padding: '16px 32px', fontSize: 18, fontWeight: 900, background: 'linear-gradient(135deg, #D4AF37, #FFE135)', border: 'none', borderRadius: 50, color: '#000', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 2, boxShadow: '0 0 40px rgba(212,175,55,0.4)' }}>BEGIN STRESS TEST</button>
          </div>
        </div>
      )}

      {/* PHASE 1 - RHYTHM */}
      {screen === 'p1' && (
        <div style={{ textAlign: 'center', width: '100%', maxWidth: 500, zIndex: 10 }}>
          <h2 style={{ fontSize: 24, color: '#D4AF37', marginBottom: 8 }}>PHASE 01</h2>
          <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 8, background: 'linear-gradient(135deg, #D4AF37, #FFE135)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RHYTHM</h1>
          <p style={{ color: '#fff8', marginBottom: 24 }}>Tap as fast as you can!</p>
          <div style={{ width: '100%', height: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ width: `${p1Progress}%`, height: '100%', background: 'linear-gradient(90deg, #D4AF37, #FFE135)', transition: 'width 0.1s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <span style={{ color: '#fff8' }}>Time: {timeLeft.toFixed(1)}s</span>
            <span style={{ color: '#D4AF37', fontWeight: 700 }}>Taps: {p1Taps.length}</span>
          </div>
          <button onClick={handleP1Tap} onMouseDown={handleP1Tap} onTouchStart={handleP1Tap} style={{ width: '100%', padding: '80px 0', fontSize: 32, fontWeight: 900, background: `linear-gradient(135deg, rgba(${100 + p1Progress/2},0,0), rgba(180,50,0))`, border: '3px solid #D4AF37', borderRadius: 50, color: 'white', cursor: 'pointer', boxShadow: '0 0 30px rgba(212,175,55,0.3)' }}>TAP!</button>
        </div>
      )}

      {/* PHASE 2 - AGILITY */}
      {screen === 'p2' && (
        <div ref={arenaRef} style={{ width: '100%', maxWidth: 500, zIndex: 10 }}>
          <h2 style={{ fontSize: 24, color: '#39FF14', marginBottom: 8, textAlign: 'center' }}>PHASE 02</h2>
          <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 16, background: 'linear-gradient(135deg, #39FF14, #39E6FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center' }}>AGILITY</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, padding: '0 20px' }}>
            <span style={{ color: '#fff8' }}>Nodes: {p2Taps.length}/{P2_TARGETS}</span>
            <span style={{ color: '#fff8' }}>Score: {p2Taps.length * 20}</span>
          </div>
          <div style={{ position: 'relative', width: '100%', height: 300, background: 'rgba(0,0,0,0.3)', borderRadius: 16, border: '1px solid rgba(57,255,20,0.3)', overflow: 'hidden' }}>
            <button ref={targetRef} onClick={handleTargetTap} style={{ position: 'absolute', left: `${targetPos.x}%`, top: `${targetPos.y}%`, width: 60, height: 60, borderRadius: '50%', background: 'radial-gradient(circle, #39FF14, #006600)', border: '3px solid #39FF14', cursor: 'pointer', boxShadow: '0 0 20px rgba(57,255,20,0.6)', transform: 'translate(-50%, -50%)', transition: 'left 0.2s, top 0.2s' }} />
          </div>
          <p style={{ color: '#fff8', textAlign: 'center', marginTop: 16 }}>Catch all nodes!</p>
        </div>
      )}

      {/* PHASE 3 - FLOW */}
      {screen === 'p3' && (
        <div style={{ textAlign: 'center', width: '100%', maxWidth: 500, zIndex: 10 }}>
          <h2 style={{ fontSize: 24, color: '#39E6FF', marginBottom: 8 }}>PHASE 03</h2>
          <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 8, background: 'linear-gradient(135deg, #39E6FF, #39FF14)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>FLOW</h1>
          <p style={{ color: '#fff8', marginBottom: 24 }}>Tap at the peak!</p>
          <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 24px' }}>
            <div style={{ position: 'absolute', inset: 0, border: `2px solid rgba(57,230,255,${pulseSize/100})`, borderRadius: '50%', transform: `scale(${1 + pulseSize/100})`, transition: 'none' }} />
            <div style={{ position: 'absolute', inset: 20, border: `2px solid rgba(57,230,255,${pulseSize/100 + 0.2})`, borderRadius: '50%', transform: `scale(${1 + pulseSize/100})`, transition: 'none' }} />
            <div style={{ position: 'absolute', inset: 40, border: `2px solid rgba(57,230,255,${pulseSize/100 + 0.4})`, borderRadius: '50%', transform: `scale(${1 + pulseSize/100})`, transition: 'none' }} />
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 20, height: 20, background: '#39E6FF', borderRadius: '50%', boxShadow: '0 0 20px rgba(57,230,255,0.8)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, padding: '0 20px' }}>
            <span style={{ color: '#fff8' }}>Wave: {Math.round(pulseSize)}%</span>
            <span style={{ color: '#fff8' }}>Hits: {hitCount}/3</span>
          </div>
          <button onClick={handleFlowTap} style={{ width: '100%', padding: '60px 0', fontSize: 28, fontWeight: 900, background: `linear-gradient(135deg, rgba(57,230,255,${0.3 + pulseSize/200}), rgba(57,255,20,${0.3 + pulseSize/200}))`, border: '3px solid #39E6FF', borderRadius: 50, color: 'white', cursor: 'pointer', boxShadow: '0 0 30px rgba(57,230,255,0.4)' }}>TAP NOW!</button>
        </div>
      )}

      {/* SCORE SCREEN */}
      {screen === 'score' && (
        <div style={{ textAlign: 'center', width: '100%', maxWidth: 500, zIndex: 10 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 24, color: '#fff' }}>STRESS TEST COMPLETE</h1>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 24, border: `1px solid ${verdict.tone === 'gold' ? '#D4AF37' : verdict.tone === 'white' ? '#fff' : '#ff4444'}` }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, background: `linear-gradient(135deg, ${verdict.tone === 'gold' ? '#D4AF37' : verdict.tone === 'white' ? '#fff' : '#ff4444'}, ${verdict.tone === 'gold' ? '#FFE135' : verdict.tone === 'white' ? '#ccc' : '#ff6666'})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{verdict.title}</h2>
            <p style={{ color: '#fff8', marginBottom: 24 }}>{verdict.body}</p>
            <div style={{ fontSize: 64, fontWeight: 900, marginBottom: 8, background: 'linear-gradient(135deg, #D4AF37, #FFE135)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{finalScore}</div>
            <p style={{ color: '#fff6', fontSize: 14 }}>OUT OF 99</p>
          </div>
          <p style={{ color: '#fff8', marginTop: 24, marginBottom: 16 }}>Enter your email to continue to Regulation</p>
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" style={{ flex: 1, minWidth: 200, padding: '12px 20px', borderRadius: 50, border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 16, outline: 'none' }} />
            <button type="submit" style={{ padding: '12px 24px', fontSize: 16, fontWeight: 700, background: 'linear-gradient(135deg, #D4AF37, #FFE135)', border: 'none', borderRadius: 50, color: '#000', cursor: 'pointer' }}>CONTINUE</button>
          </form>
        </div>
      )}

      {/* REGULATION SCREEN */}
      {screen === 'reg' && (
        <div style={{ textAlign: 'center', width: '100%', maxWidth: 500, zIndex: 10 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, color: '#fff' }}>REGULATION</h1>
          <p style={{ color: '#fff8', marginBottom: 24 }}>Breathe with the rhythm</p>
          <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 32px' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(57,255,20,0.1)', borderRadius: '50%', transform: `scale(${bubbleScale})`, transition: 'transform 0.1s' }} />
            <div style={{ position: 'absolute', inset: 20, background: 'rgba(57,255,20,0.2)', borderRadius: '50%', transform: `scale(${bubbleScale})`, transition: 'transform 0.1s' }} />
            <div style={{ position: 'absolute', inset: 40, background: 'rgba(57,255,20,0.3)', borderRadius: '50%', transform: `scale(${bubbleScale})`, transition: 'transform 0.1s' }} />
          </div>
          <p style={{ fontSize: 24, color: '#39FF14', fontWeight: 700, marginBottom: 8 }}>{regInstruction}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, padding: '0 20px' }}>
            <span style={{ color: '#fff8' }}>Timer: {regTimer}s</span>
            <span style={{ color: '#fff8' }}>Cycle: {regCycles + 1}/3</span>
          </div>
          <button onMouseDown={handleRegDown} onMouseUp={handleRegUp} onMouseLeave={handleRegUp} onTouchStart={handleRegDown} onTouchEnd={handleRegUp} style={{ width: '100%', padding: '60px 0', fontSize: 24, fontWeight: 900, background: `linear-gradient(135deg, rgba(57,255,20,${regPhase === 'inhale' ? 0.6 : 0.2}), rgba(0,102,0,${regPhase === 'inhale' ? 0.6 : 0.2}))`, border: '3px solid #39FF14', borderRadius: 50, color: 'white', cursor: 'pointer' }}>HOLD TO INHALE, RELEASE TO EXHALE</button>
          <button onClick={startRegulation} style={{ marginTop: 16, padding: '12px 24px', fontSize: 14, background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 50, color: '#fff8', cursor: 'pointer' }}>RESTART CYCLE</button>
        </div>
      )}

      {/* WIN SCREEN */}
      {screen === 'win' && (
        <div style={{ textAlign: 'center', width: '100%', maxWidth: 500, zIndex: 10 }}>
          <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 8, background: 'linear-gradient(135deg, #D4AF37, #FFE135)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CONGRATULATIONS!</h1>
          <p style={{ color: '#fff8', marginBottom: 24 }}>You completed the Regulation Game</p>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 32, border: '1px solid rgba(212,175,55,0.3)', marginBottom: 24 }}>
            <p style={{ color: '#fff8', fontSize: 14, marginBottom: 8 }}>Your Stress Test Score</p>
            <div style={{ fontSize: 64, fontWeight: 900, background: 'linear-gradient(135deg, #D4AF37, #FFE135)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{finalScore}</div>
          </div>
          {email && (
            <div style={{ background: 'rgba(57,255,20,0.1)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <p style={{ color: '#39FF14', fontSize: 14 }}>Email registered: <strong>{email}</strong></p>
            </div>
          )}
          <button onClick={() => setScreen('landing')} style={{ width: '100%', padding: '16px 32px', fontSize: 18, fontWeight: 900, background: 'linear-gradient(135deg, #D4AF37, #FFE135)', border: 'none', borderRadius: 50, color: '#000', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 2, boxShadow: '0 0 40px rgba(212,175,55,0.4)' }}>Play Again</button>
        </div>
      )}

      {/* EMAIL SCREEN (for landing option) */}
      {screen === 'email' && (
        <div style={{ textAlign: 'center', width: '100%', maxWidth: 500, zIndex: 10 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 24, color: '#fff' }}>ENTER YOUR EMAIL</h1>
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" style={{ width: '100%', padding: '16px 24px', fontSize: 18, borderRadius: 12, border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
            <button type="submit" style={{ width: '100%', padding: '16px 32px', fontSize: 18, fontWeight: 700, background: 'linear-gradient(135deg, #D4AF37, #FFE135)', border: 'none', borderRadius: 12, color: '#000', cursor: 'pointer' }}>SUBMIT</button>
          </form>
        </div>
      )}

    </div>
  );
}
