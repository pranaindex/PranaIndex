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
      if (screen !== 'reg' && phaseTimerRef.current) clearInterval(phaseTimerRef.current);
      if (screen !== 'p1' && p1TimerRef.current) clearInterval(p1TimerRef.current);
      if (screen !== 'p3' && pulseRef.current) cancelAnimationFrame(pulseRef.current);
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
    if (p1TimerRef.current) {
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
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#000', minHeight: '100vh', color: '#fff', padding: 20, position: 'relative', overflow: 'hidden' }}>

      {/* Home Button */}
      {screen !== 'landing' && (
        <button onClick={() => setScreen('landing')} style={{ position: 'absolute', top: 20, left: 20, zIndex: 50, background: 'rgba(212,175,55,0.2)', border: '1px solid #D4AF37', borderRadius: 8, padding: '8px 16px', color: '#D4AF37', fontSize: 14, cursor: 'pointer' }}>PI Home</button>
      )}

      {/* LANDING SCREEN */}
      {screen === 'landing' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', background: 'linear-gradient(135deg, #D4AF37, #FFE135)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>Prana Index</h1>
          <p style={{ color: '#D4AF37', fontSize: 14, letterSpacing: 3, marginBottom: 40 }}>STRESS TEST SYSTEM v1.0</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 40, width: '100%', maxWidth: 400 }}>
            <div style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 12, padding: '16px 24px' }}>
              <h3 style={{ color: '#D4AF37', margin: '0 0 8px 0', fontSize: 24 }}>PHASE 01 — RHYTHM</h3>
              <p style={{ margin: 0, color: '#888', fontSize: 14 }}>Tap a steady beat for 15 seconds. Dont stop clicking!</p>
            </div>
            <div style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 12, padding: '16px 24px' }}>
              <h3 style={{ color: '#D4AF37', margin: '0 0 8px 0', fontSize: 24 }}>PHASE 02 — AGILITY</h3>
              <p style={{ margin: 0, color: '#888', fontSize: 14 }}>Catch 5 nodes as fast as possible.</p>
            </div>
            <div style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 12, padding: '16px 24px' }}>
              <h3 style={{ color: '#D4AF37', margin: '0 0 8px 0', fontSize: 24 }}>PHASE 03 — FLOW</h3>
              <p style={{ margin: 0, color: '#888', fontSize: 14 }}>Hit the button at the peak of the wave.</p>
            </div>
          </div>

          <button onClick={startPhase1} style={{ width: '100%', padding: '20px 40px', fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg, #D4AF37, #FFE135)', border: 'none', borderRadius: 50, color: '#000', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 4, boxShadow: '0 0 60px rgba(212,175,55,0.4)' }}>BEGIN STRESS TEST</button>
        </div>
      )}

      {/* PHASE 1 - RHYTHM */}
      {screen === 'p1' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
          <h2 style={{ color: '#D4AF37', fontSize: 32, marginBottom: 8 }}>PHASE 01</h2>
          <h3 style={{ color: '#D4AF37', fontSize: 20, letterSpacing: 3, marginBottom: 30 }}>RHYTHM</h3>
          <p style={{ color: '#888', marginBottom: 30 }}>Tap as fast as you can!</p>
          <div style={{ display: 'flex', gap: 30, marginBottom: 40, fontSize: 24, fontWeight: 700 }}>
            <span>Time: <span style={{ color: '#D4AF37' }}>{timeLeft.toFixed(1)}s</span></span>
            <span>Taps: <span style={{ color: '#D4AF37' }}>{p1Taps.length}</span></span>
          </div>
          <button onClick={handleP1Tap} style={{ width: 250, height: 250, borderRadius: '50%', background: `radial-gradient(circle, #D4AF37 ${p1Progress}%, #222 ${p1Progress}%)`, border: '4px solid #D4AF37', color: '#D4AF37', fontSize: 28, fontWeight: 900, cursor: 'pointer', boxShadow: `0 0 ${50 + p1Progress/2}px rgba(212,175,55,0.5)` }}>TAP!</button>
        </div>
      )}

      {/* PHASE 2 - AGILITY */}
      {screen === 'p2' && (
        <div ref={arenaRef} style={{ position: 'relative', minHeight: '100vh', textAlign: 'center' }}>
          <h2 style={{ color: '#D4AF37', fontSize: 32, marginBottom: 8 }}>PHASE 02</h2>
          <h3 style={{ color: '#D4AF37', fontSize: 20, letterSpacing: 3, marginBottom: 30 }}>AGILITY</h3>
          <div style={{ display: 'flex', gap: 30, justifyContent: 'center', fontSize: 20, fontWeight: 700, marginBottom: 40 }}>
            <span>Nodes: <span style={{ color: '#D4AF37' }}>{p2Taps.length}/{P2_TARGETS}</span></span>
            <span>Score: <span style={{ color: '#D4AF37' }}>{p2Taps.length * 20}</span></span>
          </div>
          <p style={{ color: '#888', marginBottom: 20 }}>Catch all nodes!</p>
          <button ref={targetRef} onClick={handleTargetTap} style={{ position: 'absolute', left: `${targetPos.x}%`, top: `${targetPos.y}%`, width: 70, height: 70, borderRadius: '50%', background: 'radial-gradient(circle, #D4AF37 0%, #D4AF3780 50%, transparent 70%)', border: '2px solid #D4AF37', color: '#D4AF37', fontSize: 14, fontWeight: 700, cursor: 'pointer', animation: 'pulseNode 0.3s ease-in-out infinite' }}>CATCH</button>
        </div>
      )}

      {/* PHASE 3 - FLOW */}
      {screen === 'p3' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
          <h2 style={{ color: '#D4AF37', fontSize: 32, marginBottom: 8 }}>PHASE 03</h2>
          <h3 style={{ color: '#D4AF37', fontSize: 20, letterSpacing: 3, marginBottom: 30 }}>FLOW</h3>
          <p style={{ color: '#888', marginBottom: 30 }}>Tap at the peak!</p>
          <div style={{ position: 'relative', width: 200, height: 200, marginBottom: 40 }}>
            <div style={{ position: 'absolute', width: `${pulseSize}%`, height: `${pulseSize}%`, borderRadius: '50%', background: 'radial-gradient(circle, #D4AF37 0%, #D4AF3780 40%, transparent 60%)', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />
          </div>
          <div style={{ display: 'flex', gap: 30, justifyContent: 'center', fontSize: 20, fontWeight: 700, marginBottom: 40 }}>
            <span>Wave: <span style={{ color: '#D4AF37' }}>{Math.round(pulseSize)}%</span></span>
            <span>Hits: <span style={{ color: '#D4AF37' }}>{hitCount}/3</span></span>
          </div>
          <button onClick={handleFlowTap} style={{ width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, #D4AF37 0%, #222 70%)`, border: '4px solid #D4AF37', color: '#D4AF37', fontSize: 24, fontWeight: 900, cursor: 'pointer', boxShadow: `0 0 ${40 + pulseSize/3}px rgba(212,175,55,0.6)` }}>TAP NOW!</button>
        </div>
      )}

      {/* SCORE SCREEN */}
      {screen === 'score' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
          <h2 style={{ color: '#888', fontSize: 16, letterSpacing: 3, marginBottom: 24 }}>STRESS TEST COMPLETE</h2>
          <h1 style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', color: verdict.tone === 'gold' ? '#FFD700' : verdict.tone === 'red' ? '#FF4444' : '#fff', marginBottom: 12 }}>{verdict.title}</h1>
          <p style={{ color: '#888', fontSize: 18, marginBottom: 40 }}>{verdict.body}</p>
          <div style={{ background: `linear-gradient(135deg, ${verdict.tone === 'gold' ? '#FFD700' : verdict.tone === 'red' ? '#FF4444' : '#fff'}33, transparent)`, border: `2px solid ${verdict.tone === 'gold' ? '#FFD700' : verdict.tone === 'red' ? '#FF4444' : '#fff'}`, borderRadius: 20, padding: '30px 60px', marginBottom: 40 }}>
            <div style={{ fontSize: 'clamp(3rem, 12vw, 6rem)', fontWeight: 900, color: verdict.tone === 'gold' ? '#FFD700' : verdict.tone === 'red' ? '#FF4444' : '#fff' }}>{finalScore}</div>
            <div style={{ color: '#888', fontSize: 14, marginTop: 8 }}>OUT OF 99</div>
          </div>
          <p style={{ color: '#888', marginBottom: 16 }}>Enter your email to continue to Regulation</p>
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', width: '100%', maxWidth: 400 }}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" style={{ width: '100%', padding: '16px 24px', fontSize: 18, borderRadius: 50, border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
            <button type="submit" style={{ width: '100%', padding: '16px 32px', fontSize: 18, fontWeight: 700, background: 'linear-gradient(135deg, #D4AF37, #FFE135)', border: 'none', borderRadius: 50, color: '#000', cursor: 'pointer' }}>CONTINUE</button>
          </form>
        </div>
      )}

      {/* REGULATION SCREEN */}
      {screen === 'reg' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
          <h2 style={{ color: '#D4AF37', fontSize: 32, marginBottom: 16 }}>REGULATION</h2>
          <p style={{ color: '#888', marginBottom: 40 }}>Breathe with the rhythm</p>
          <div style={{ position: 'relative', width: 300, height: 300, marginBottom: 40 }}>
            <div style={{ position: 'absolute', width: `${bubbleScale * 80}%`, height: `${bubbleScale * 80}%`, borderRadius: '50%', background: 'radial-gradient(circle, #D4AF3788 0%, #D4AF3744 50%, transparent 70%)', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', transition: 'width 0.1s, height 0.1s' }} />
          </div>
          <h3 style={{ color: '#D4AF37', fontSize: 24, marginBottom: 20 }}>{regInstruction}</h3>
          <div style={{ display: 'flex', gap: 30, justifyContent: 'center', fontSize: 18, fontWeight: 700, marginBottom: 40 }}>
            <span>Timer: <span style={{ color: '#D4AF37' }}>{regTimer}s</span></span>
            <span>Cycle: <span style={{ color: '#D4AF37' }}>{regCycles + 1}/3</span></span>
          </div>
          <button onMouseDown={handleRegDown} onMouseUp={handleRegUp} onMouseLeave={handleRegUp} style={{ width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, #D4AF37 0%, #222 70%)', border: '4px solid #D4AF37', color: '#D4AF37', fontSize: 18, fontWeight: 900, cursor: 'pointer', boxShadow: '0 0 50px rgba(212,175,55,0.4)', userSelect: 'none' }}>HOLD TO INHALE, RELEASE TO EXHALE</button>
        </div>
      )}

      {/* WIN SCREEN */}
      {screen === 'win' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
          <h2 style={{ color: '#4CAF50', fontSize: 'clamp(2rem, 8vw, 4rem)', marginBottom: 16 }}>CONGRATULATIONS!</h2>
          <p style={{ color: '#888', fontSize: 18, marginBottom: 40 }}>You completed the Regulation Game</p>
          <div style={{ background: 'linear-gradient(135deg, #4CAF5033, transparent)', border: '2px solid #4CAF50', borderRadius: 20, padding: '30px 60px', marginBottom: 30 }}>
            <p style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>Your Stress Test Score</p>
            <div style={{ fontSize: 'clamp(3rem, 12vw, 6rem)', fontWeight: 900, color: '#4CAF50' }}>{finalScore}</div>
          </div>
          {email && (
            <p style={{ color: '#888', marginBottom: 40 }}>Email registered: <strong style={{ color: '#D4AF37' }}>{email}</strong></p>
          )}
          <button onClick={() => setScreen('landing')} style={{ width: '100%', padding: '16px 32px', fontSize: 18, fontWeight: 900, background: 'linear-gradient(135deg, #D4AF37, #FFE135)', border: 'none', borderRadius: 50, color: '#000', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 2, boxShadow: '0 0 40px rgba(212,175,55,0.4)' }}>Play Again</button>
        </div>
      )}

      {/* EMAIL SCREEN */}
      {screen === 'email' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
          <h2 style={{ color: '#D4AF37', fontSize: 32, marginBottom: 16 }}>ENTER YOUR EMAIL</h2>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" style={{ width: '100%', maxWidth: 400, padding: '16px 24px', fontSize: 18, borderRadius: 12, border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white', marginBottom: 20, outline: 'none' }} />
          <button onClick={handleEmailSubmit} style={{ width: 200, padding: '16px 32px', fontSize: 18, fontWeight: 700, background: 'linear-gradient(135deg, #D4AF37, #FFE135)', border: 'none', borderRadius: 50, color: '#000', cursor: 'pointer' }}>SUBMIT</button>
        </div>
      )}

    </div>
  );
}
