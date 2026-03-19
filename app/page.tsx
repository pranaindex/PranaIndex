"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function PranaIndexApp() {
  const [screen, setScreen] = useState<'landing' | 'p1' | 'p2' | 'p3' | 'score' | 'reg' | 'win'>('landing');
  const [p1Taps, setP1Taps] = useState<number[]>([]);
  const [p2Taps, setP2Taps] = useState<number[]>([]);
  const [p2Start, setP2Start] = useState(0);
  const [p3Hits, setP3Hits] = useState<number[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const [email, setEmail] = useState('');
  const [p1Progress, setP1Progress] = useState(0);
  const [targetPos, setTargetPos] = useState({ left: '50%', top: '50%' });
  const [pulseSize, setPulseSize] = useState(0);
  const [pulseDir, setPulseDir] = useState(1);
  const [hitCount, setHitCount] = useState(0);
  const [verdict, setVerdict] = useState({ title: '', body: '' });
  const [regPhase, setRegPhase] = useState<'ready' | 'inhale' | 'exhale'>('ready');
  const [bubbleScale, setBubbleScale] = useState(1);
  const [bubbleTime, setBubbleTime] = useState('5.0s');
  const [regCycles, setRegCycles] = useState(0);
  const [regInstruction, setRegInstruction] = useState('READY?');
  const regHoldingRef = useRef(false);
  const phaseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const p1TimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseRef = useRef<number | null>(null);
  const p1StartTimeRef = useRef(0);

  const P1_DURATION = 15000;
  const P2_TARGETS = 5;
  const P3_PEAK_TARGET = 85;

  useEffect(() => {
    if (screen === 'landing') {
      setP1Taps([]);
      setP2Taps([]);
      setP3Hits([]);
      setP1Progress(0);
      setHitCount(0);
      setPulseSize(0);
      setRegPhase('ready');
      setBubbleScale(1);
      setBubbleTime('5.0s');
      setRegCycles(0);
      setRegInstruction('READY?');
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
    setP1Progress(0);
    p1StartTimeRef.current = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - p1StartTimeRef.current;
      const progress = (elapsed / P1_DURATION) * 100;
      setP1Progress(progress);
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
    moveTarget();
  };

  const moveTarget = () => {
    setTargetPos({ left: `${Math.random() * 75 + 10}%`, top: `${Math.random() * 65 + 15}%` });
  };

  const handleTargetTap = () => {
    const newTaps = [...p2Taps, Date.now() - p2Start];
    setP2Taps(newTaps);
    if (newTaps.length >= P2_TARGETS) {
      startPhase3();
    } else {
      moveTarget();
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
    let title = '', body = '';
    if (final >= 75) {
      title = 'USTAAD!';
      body = 'You are perfectly in sync. Smooth like midnight Irani Chai.';
    } else if (final >= 45) {
      title = 'ZABARDAST MOOD!';
      body = 'Good baseline, but the engine needs a little tuning. Stay focused!';
    } else {
      title = 'TOTAL GHOTALA!';
      body = 'Engine stalled. Your rhythm is everywhere. Take a breather!';
    }
    setVerdict({ title, body });
    setScreen('score');
  };
  const startRegulation = () => {
    setRegPhase('ready');
    setBubbleScale(1);
    setBubbleTime('5.0s');
    setRegCycles(0);
    setRegInstruction('READY?');
    regHoldingRef.current = false;
  };

  const handleRegDown = () => {
    if (!isRegActive || regPhase !== 'ready') return;
    regHoldingRef.current = true;
    setRegPhase('inhale');
    setRegInstruction('REV ENGINE (INHALE)');
    let startTime = Date.now();
    if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    phaseTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > 5.5) {
        clearInterval(phaseTimerRef.current!);
        setRegInstruction('READY?');
        setRegPhase('ready');
        setBubbleScale(1);
        setBubbleTime('5.0s');
        regHoldingRef.current = false;
        return;
      }
      const scale = 1 + (1.4 * Math.min(elapsed / 5, 1));
      setBubbleScale(scale);
      setBubbleTime((5 - elapsed).toFixed(1) + 's');
    }, 16);
  };

  const handleRegUp = () => {
    if (!regHoldingRef.current || regPhase !== 'inhale') return;
    regHoldingRef.current = false;
    clearInterval(phaseTimerRef.current!);
    setRegPhase('exhale');
    setRegInstruction('COAST DOWN (EXHALE)');
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
          setRegInstruction('READY?');
          setBubbleScale(1);
          setBubbleTime('5.0s');
        }
      } else {
        const scale = 2.4 - (1.4 * (elapsed / 5));
        setBubbleScale(Math.max(1, scale));
        setBubbleTime((5 - elapsed).toFixed(1) + 's');
      }
    }, 16);
  };

  const [isRegActive, setIsRegActive] = useState(false);

  const startRegGame = () => {
    setRegPhase('ready');
    setBubbleScale(1);
    setBubbleTime('5.0s');
    setRegCycles(0);
    setRegInstruction('READY?');
    regHoldingRef.current = false;
    setIsRegActive(true);
  };
  return (
    <main style={{ minHeight: '100vh', background: '#0A0E1A', color: '#D4AF37', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, boxSizing: 'border-box', textAlign: 'center' }}>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 32, fontWeight: 900, color: '#D4AF37', textShadow: '0 0 20px rgba(212,175,55,0.5)' }}>
          &#960;
        </span>
      </div>
      <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 32, opacity: 0.8 }}>
        Play Your Rhythm
      </div>

      {screen === 'landing' && (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, letterSpacing: 4, textTransform: 'uppercase' }}>Prana Index</h1>
          <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 24, letterSpacing: 1 }}>
            --------------------------------
          </div>
          <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.7, marginBottom: 24 }}>
            Play Your Rhythm
          </p>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, opacity: 0.7 }}>01 Consistency</div>
            <div style={{ fontSize: 8, opacity: 0.4 }}>Tap a steady beat for 15s.</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, opacity: 0.7 }}>02 Reflex</div>
            <div style={{ fontSize: 8, opacity: 0.4 }}>Catch 5 nodes as fast as possible.</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 20, marginBottom: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, opacity: 0.7 }}>03 Focus</div>
            <div style={{ fontSize: 8, opacity: 0.4 }}>Hit the button at the peak of the wave.</div>
          </div>
          <button
            onClick={startPhase1}
            onTouchStart={startPhase1}
            style={{ width: '100%', background: '#D4AF37', color: '#0A0E1A', fontWeight: 900, padding: 18, borderRadius: 9999, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(212,175,55,0.3)' }}
          >
            Start Engine
          </button>
        </div>
      )}
      {screen === 'p1' && (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 40, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8 }}>Play Your Rhythm</h2>
          <div style={{ position: 'relative', background: 'rgba(255,255,255,0.03)', borderRadius: 24, aspectRatio: '1', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)' }}>
            {p1Taps.map((t, i) => (
              <div key={i} style={{ position: 'absolute', width: 6, height: 6, background: '#00B4D8', borderRadius: '50%', left: `${(t / P1_DURATION) * 100}%`, bottom: '4%' }} />
            ))}
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
              <button
                onClick={handleP1Tap}
                onTouchStart={handleP1Tap}
                style={{ width: 80, height: 80, borderRadius: '50%', background: '#D4AF37', color: '#0A0E1A', fontSize: 24, fontWeight: 900, border: 'none', cursor: 'pointer', boxShadow: '0 0 30px rgba(212,175,55,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                PI
              </button>
            </div>
          </div>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, opacity: 0.7 }}>
            {p1Taps.length > 0 ? 'KEEP A STEADY BEAT!' : 'TAP!'}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 9999, height: 4, overflow: 'hidden' }}>
            <div style={{ background: '#D4AF37', height: '100%', width: `${p1Progress}%`, transition: 'width 0.1s' }} />
          </div>
        </div>
      )}
      {screen === 'p2' && (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8 }}>Quick! Catch the</h2>
          <div style={{ position: 'relative', background: 'rgba(255,255,255,0.03)', borderRadius: 24, aspectRatio: '1', marginBottom: 24, overflow: 'hidden', boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)' }}>
            {p2Taps.map((t, i) => (
              <div key={i} style={{ position: 'absolute', width: 6, height: 6, background: '#D4AF37', borderRadius: '50%', left: targetPos.left, top: targetPos.top }} />
            ))}
            <button
              onClick={handleTargetTap}
              onTouchStart={handleTargetTap}
              style={{ position: 'absolute', width: 32, height: 32, borderRadius: '50%', background: '#00B4D8', border: 'none', cursor: 'pointer', left: targetPos.left, top: targetPos.top, transform: 'translate(-50%,-50%)', boxShadow: '0 0 20px rgba(0,180,216,0.5)' }}
            >
              +
            </button>
          </div>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.5 }}>
            Nodes: {p2Taps.length}/{P2_TARGETS}
          </div>
        </div>
      )}
      {screen === 'p3' && (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 40, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8 }}>Hit the Peak</h2>
          <div style={{ position: 'relative', background: 'rgba(255,255,255,0.03)', borderRadius: 24, aspectRatio: '1', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)' }}>
            <div style={{ width: `${pulseSize}%`, height: `${pulseSize}%`, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))', border: '1px solid rgba(212,175,55,0.3)', position: 'absolute' }} />
            <button
              onClick={handleFlowTap}
              onTouchStart={handleFlowTap}
              style={{ position: 'relative', zIndex: 10, width: 70, height: 70, borderRadius: '50%', background: pulseSize > 80 ? '#D4AF37' : 'rgba(255,255,255,0.1)', color: pulseSize > 80 ? '#0A0E1A' : 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, border: 'none', cursor: 'pointer', boxShadow: pulseSize > 80 ? '0 0 30px rgba(212,175,55,0.6)' : 'none', transition: 'all 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Tap Peak
            </button>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: p3Hits.length > 0 && hitCount >= 1 ? '#D4AF37' : 'rgba(255,255,255,0.1)', transition: 'all 0.2s' }} />
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: p3Hits.length > 0 && hitCount >= 2 ? '#D4AF37' : 'rgba(255,255,255,0.1)', transition: 'all 0.2s' }} />
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: p3Hits.length >= 3 ? '#D4AF37' : 'rgba(255,255,255,0.1)', transition: 'all 0.2s' }} />
          </div>
        </div>
      )}
      {screen === 'score' && (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#D4AF37', textShadow: '0 0 20px rgba(212,175,55,0.5)' }}>
              &#960;
            </span>
          </div>
          <p style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24, opacity: 0.6 }}>Your Index Score</p>
          <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 16, color: '#D4AF37' }}>{finalScore}</h1>
          <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{verdict.title}</h2>
          <p style={{ fontSize: 10, opacity: 0.6, marginBottom: 32 }}>{verdict.body}</p>
          <p style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.4, marginBottom: 12 }}>Unlock The Regulate Game</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email..."
            style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 9999, padding: '16px 24px', fontSize: 12, marginBottom: 12, outline: 'none', color: 'white', boxSizing: 'border-box' }}
          />
          <button
            onClick={() => {
              if (!email.includes('@')) {
                alert('Need email to calibrate!');
                return;
              }
              setScreen('reg');
            }}
            onTouchStart={() => {
              if (!email.includes('@')) {
                alert('Need email to calibrate!');
                return;
              }
              setScreen('reg');
            }}
            style={{ width: '100%', background: '#D4AF37', color: '#0A0E1A', fontWeight: 900, padding: 16, borderRadius: 9999, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(212,175,55,0.3)' }}
          >
            Calibrate Regulation
          </button>
          <button
            onClick={() => { setScreen('landing'); setP1Taps([]); setP2Taps([]); setP3Hits([]); }}
            onTouchStart={() => { setScreen('landing'); setP1Taps([]); setP2Taps([]); setP3Hits([]); }}
            style={{ marginTop: 16, fontSize: 10, opacity: 0.4, textTransform: 'uppercase', letterSpacing: 2, textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            Recalibrate Baseline
          </button>
        </div>
      )}
      {screen === 'reg' && (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <h2 style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8 }}>Regulation Mode</h2>
          <p style={{ fontSize: 8, opacity: 0.4, marginBottom: 32 }}>{regCycles}/3 CYCLES</p>
          <div style={{ position: 'relative', background: 'rgba(255,255,255,0.03)', borderRadius: 24, aspectRatio: '1', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#D4AF37', transition: `transform ${bubbleTime} ease-in-out`, transform: `scale(${bubbleScale})`, boxShadow: '0 0 40px rgba(212,175,55,0.4)' }} />
          </div>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, opacity: 0.8 }}>{regInstruction}</div>
          <div style={{ fontSize: 24, fontWeight: 300, marginBottom: 24 }}>{bubbleTime}</div>
          <button
            onClick={() => { regPhase === 'ready' ? handleRegDown() : handleRegUp(); }}
            onTouchStart={() => { regPhase === 'ready' ? handleRegDown() : handleRegUp(); }}
            style={{ width: '100%', background: regPhase === 'ready' ? '#D4AF37' : '#00B4D8', color: '#0A0E1A', fontWeight: 700, padding: 16, borderRadius: 9999, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(212,175,55,0.3)' }}
          >
            {regPhase === 'ready' ? 'PRESS TO BEGIN' : isRegActive ? 'INHALE' : 'EXHALE'}
          </button>
          <p style={{ fontSize: 8, opacity: 0.4, marginTop: 16 }}>{isRegActive ? 'Follow the bubble rhythm' : regPhase === 'ready' ? 'Ready to begin?' : 'Press button to start'}</p>
        </div>
      )}
      {screen === 'win' && (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#D4AF37', textShadow: '0 0 20px rgba(212,175,55,0.5)' }}>
              &#960;
            </span>
          </div>
          <p style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24, opacity: 0.6 }}>System Calibrated</p>
          <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 8, color: '#D4AF37' }}>{finalScore}</h1>
          <h2 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 16, opacity: 0.6 }}>Master Index</h2>
          <p style={{ fontSize: 10, opacity: 0.6, marginBottom: 32 }}>Your Prana Index has been calibrated. Regulation training complete.</p>
          <button
            onClick={() => { setScreen('landing'); setP1Taps([]); setP2Taps([]); setP3Hits([]); }}
            onTouchStart={() => { setScreen('landing'); setP1Taps([]); setP2Taps([]); setP3Hits([]); }}
            style={{ width: '100%', background: '#D4AF37', color: '#0A0E1A', fontWeight: 900, padding: 16, borderRadius: 9999, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, border: 'none', cursor: 'pointer' }}
          >
            Return to Home
          </button>
        </div>
      )}
    </main>
  );
}
