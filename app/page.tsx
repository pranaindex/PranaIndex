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
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const p1TimerRef = useRef<NodeJS.Timeout | null>(null);
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
    setTargetPos({
      left: `${Math.random() * 75 + 10}%`,
      top: `${Math.random() * 65 + 15}%`
    });
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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0A0E1A',
      color: '#D4AF37',
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      overflow: 'hidden',
      touchAction: 'none',
      position: 'relative'
    }}>
      {/* PI Logo */}
      <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 50, textAlign: 'center' }}>
        <div style={{ fontWeight: 900, fontStyle: 'italic', color: '#D4AF37', fontSize: 40, textShadow: '0 0 20px rgba(212,175,55,0.5)' }}>PI</div>
        <div id="status-bar" style={{ fontSize: 10, letterSpacing: 4, opacity: 0.6, marginTop: 4, fontStyle: 'italic', fontWeight: 700, textTransform: 'uppercase' }}>SYSTEM ONLINE</div>
      </div>
      {/* LANDING SCREEN */}
      {screen === 'landing' && (
        <div style={{ textAlign: 'center', maxWidth: 400, marginTop: 60 }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, fontStyle: 'italic', letterSpacing: -1, color: '#D4AF37', marginBottom: 4, textTransform: 'uppercase' }}>PRANA INDEX</h2>
          <p style={{ fontSize: 12, letterSpacing: 2, color: '#D4AF37', fontWeight: 700, marginBottom: 32, textTransform: 'uppercase', fontStyle: 'italic' }}>PLAY YOUR RHYTHM</p>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', marginBottom: 24, boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}>
            <p><span style={{ color: '#D4AF37', fontWeight: 900, textTransform: 'uppercase', fontSize: 12 }}>01 CONSISTENCY</span><br/><span style={{ fontSize: 11, opacity: 0.8 }}>Tap a steady beat for 15s.</span></p>
            <p><span style={{ color: '#D4AF37', fontWeight: 900, textTransform: 'uppercase', fontSize: 12 }}>02 REFLUX</span><br/><span style={{ fontSize: 11, opacity: 0.8 }}>Catch 5 nodes as fast as possible.</span></p>
            <p><span style={{ color: '#D4AF37', fontWeight: 900, textTransform: 'uppercase', fontSize: 12 }}>03 FOCUS</span><br/><span style={{ fontSize: 11, opacity: 0.8 }}>Hit the button at the peak of the wave.</span></p>
          </div>
          <button onClick={startPhase1} style={{ background: '#D4AF37', color: '#0A0E1A', fontWeight: 900, padding: '20px 64px', borderRadius: 9999, fontSize: 18, boxShadow: '0 0 40px rgba(212,175,55,0.4)', textTransform: 'uppercase', letterSpacing: -1, fontStyle: 'italic', border: 'none', cursor: 'pointer' }}>START ENGINE</button>
        </div>
      )}
      {/* PHASE 1 - CONSISTENCY */}
      {screen === 'p1' && (
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center', marginTop: 60 }}>
          <h3 style={{ fontSize: 12, letterSpacing: 3, color: '#D4AF37', fontWeight: 900, marginBottom: 40, textTransform: 'uppercase', fontStyle: 'italic' }}>Play Your Rhythm</h3>
          <button id="tap-btn" onClick={handleP1Tap} style={{ width: 176, height: 176, background: '#D4AF37', borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 60px rgba(212,175,55,0.3)', border: 'none', cursor: 'pointer', margin: '0 auto' }}>
            <div style={{ fontWeight: 900, color: '#D4AF37', fontSize: 32 }}>PI</div>
          </button>
          <div style={{ marginTop: 48, width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 9999, overflow: 'hidden' }}>
            <div id="p1-progress" style={{ height: '100%', background: '#D4AF37', width: `${p1Progress}%`, transition: 'width 0.1s' }}></div>
          </div>
          <p style={{ marginTop: 24, fontSize: 10, color: '#D4AF37', textTransform: 'uppercase', fontWeight: 900, letterSpacing: 4 }}>{p1Taps.length > 0 ? 'KEEP A STEADY BEAT!' : 'TAP!'}</p>
        </div>
      )}

      {/* PHASE 2 - REFLUX */}
      {screen === 'p2' && (
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center', marginTop: 60 }}>
          <h3 style={{ fontSize: 12, letterSpacing: 4, color: '#D4AF37', fontWeight: 900, marginBottom: 12, textTransform: 'uppercase', fontStyle: 'italic' }}>Quick! Catch the</h3>
          <div id="arena" style={{ position: 'relative', width: '100%', height: 320, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, overflow: 'hidden', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)' }}>
            <button id="target" onClick={handleTargetTap} style={{ position: 'absolute', width: 64, height: 64, background: '#D4AF37', borderRadius: 9999, color: '#0A0E1A', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 0 30px rgba(212,175,55,0.5)', border: 'none', cursor: 'pointer', left: targetPos.left, top: targetPos.top, transform: 'translate(-50%, -50%)' }}>
              +
            </button>
          </div>
          <p style={{ marginTop: 16, fontSize: 11, color: '#D4AF37', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 2 }}>Nodes: {p2Taps.length}/{P2_TARGETS}</p>
        </div>
      )}
      {/* PHASE 3 - FOCUS */}
      {screen === 'p3' && (
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center', marginTop: 40 }}>
          <h3 style={{ fontSize: 12, letterSpacing: 4, color: '#D4AF37', fontWeight: 900, marginBottom: 24, textTransform: 'uppercase', fontStyle: 'italic' }}>Hit the Peak</h3>
          <div style={{ position: 'relative', width: 256, height: 256, margin: '0 auto', background: 'rgba(255,255,255,0.05)', borderRadius: 9999, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div id="wave-pulse" style={{ position: 'absolute', borderRadius: 9999, background: '#D4AF37', width: 0, height: 0, opacity: 0, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}></div>
            <button id="flow-btn" onClick={handleFlowTap} style={{ position: 'absolute', width: 96, height: 96, background: 'rgba(0,0,0,0.8)', border: '2px solid #D4AF37', borderRadius: 9999, zIndex: 10, fontWeight: 900, fontSize: 10, color: '#D4AF37', textTransform: 'uppercase', cursor: 'pointer', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
              TAP PEAK
            </button>
          </div>
          <div id="p3-dots" style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 48 }}>
            <div id="dot-0" style={{ width: 12, height: 12, borderRadius: 9999, background: pulseSize > 0 ? '#D4AF37' : 'rgba(255,255,255,0.1)', transition: 'all 0.2s' }}></div>
            <div id="dot-1" style={{ width: 12, height: 12, borderRadius: 9999, background: pulseSize > 0 && hitCount >= 1 ? '#D4AF37' : 'rgba(255,255,255,0.1)', transition: 'all 0.2s' }}></div>
            <div id="dot-2" style={{ width: 12, height: 12, borderRadius: 9999, background: pulseSize > 0 && hitCount >= 2 ? '#D4AF37' : 'rgba(255,255,255,0.1)', transition: 'all 0.2s' }}></div>
          </div>
        </div>
      )}
      {/* SCORE SCREEN */}
      {screen === 'score' && (
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center', marginTop: 40 }}>
          <div style={{ fontWeight: 900, fontStyle: 'italic', color: '#D4AF37', fontSize: 40, marginBottom: 4 }}>PI</div>
          <p style={{ fontSize: 10, letterSpacing: 4, opacity: 0.5, textTransform: 'uppercase', fontStyle: 'italic', fontWeight: 700, marginBottom: 8 }}>Your Index Score</p>
          <h3 id="score-val" style={{ fontSize: 110, fontWeight: 900, color: '#D4AF37', lineHeight: 1, marginBottom: 24, letterSpacing: -1 }}>{finalScore}</h3>
          <div id="verdict-box" style={{ padding: 24, borderRadius: 24, border: verdict.title === 'USTAAD!' ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)', background: verdict.title === 'USTAAD!' ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.05)', marginBottom: 24, boxShadow: verdict.title === 'USTAAD!' ? '0 0 30px rgba(212,175,55,0.2)' : '0 0 40px rgba(0,0,0,0.5)' }}>
            <p id="v-title" style={{ fontSize: 24, fontWeight: 900, fontStyle: 'italic', marginBottom: 8, letterSpacing: -1, textTransform: 'uppercase', color: verdict.title === 'USTAAD!' ? '#D4AF37' : verdict.title === 'ZABARDAST MOOD!' ? 'white' : '#ef4444' }}>{verdict.title}</p>
            <p id="v-body" style={{ fontSize: 12, opacity: 0.9, fontStyle: 'italic', lineHeight: 1.6 }}>{verdict.body}</p>
          </div>
          <div style={{ width: '100%', background: 'rgba(212,175,55,0.1)', padding: 24, borderRadius: 24, border: '1px solid rgba(212,175,55,0.4)', marginBottom: 24 }}>
            <p style={{ fontSize: 10, color: '#D4AF37', fontWeight: 900, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 2 }}>Unlock The Regulate Game</p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email..." style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 9999, padding: '16px 24px', fontSize: 12, marginBottom: 12, outline: 'none', color: 'white' }} />
            <button onClick={() => { if(!email.includes('@')) { alert('Need email to calibrate!'); return; } setScreen('reg'); }} style={{ width: '100%', background: '#D4AF37', color: '#0A0E1A', fontWeight: 900, padding: '16px', borderRadius: 9999, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, border: 'none', cursor: 'pointer' }}>CALIBRATE REGULATION</button>
          </div>
          <button onClick={() => { setScreen('landing'); setP1Taps([]); setP2Taps([]); setP3Hits([]); }} style={{ fontSize: 10, opacity: 0.4, textTransform: 'uppercase', letterSpacing: 2, textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Recalibrate Baseline</button>
        </div>
      )}
      
      {/* REGULATION SCREEN */}
screen === 'reg' && (
  <div style={{width:'100%', maxWidth:400, textAlign:'center', marginTop:60}}>
    <h3 style={{fontSize:12, letterSpacing:3, color:'#D4AF37', fontWeight:900, marginBottom:8, textTransform:'uppercase', fontStyle:'italic'}}>REGULATION MODE</h3>
    <p style={{fontSize:10, opacity:0.6, fontStyle:'italic', marginBottom:24}}>{regCycles}<span style={{opacity:0.3}}>/3 CYCLES</span></p>
    <div style={{position:'relative', width:256, height:256, margin:'0 auto'}}>
      <div style={{width:160, height:160, background:'#D4AF37', borderRadius:9999, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 60px rgba(212,175,55,0.3)', transform:`scale(${bubbleScale})`, transition:'transform 0.3s'}}>
        <div style={{fontWeight:900, color:'#0A0E1A', fontSize:36}}>
          <div style={{fontSize:10, textTransform:'uppercase', letterSpacing:2}}>{regInstruction}</div>
        </div>
      </div>
      <div style={{position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', fontSize:10, color:'#D4AF37', fontWeight:900, letterSpacing:2}}>{bubbleTime}</div>
    </div>
    <button id="reg-bubble" onClick={startRegGame} style={{marginTop:48, background:'#D4AF37', color:'#0A0E1A', fontWeight:900, padding:'16px 48px', borderRadius:9999, fontSize:10, textTransform:'uppercase', letterSpacing:2, border:'none', cursor:'pointer', boxShadow:'0 0 30px rgba(212,175,55,0.3)'}}>
      {regPhase==='ready'?'PRESS TO BEGIN':isRegActive?'INH...E':'REGULATE'}
    </button>
    <p style={{marginTop:24, fontSize:10, opacity:0.5, fontStyle:'italic'}}>{isRegActive?'Follow the bubble rhythm':regPhase==='ready'?'Ready to begin?':'Press button to start'}</p>
  </div>
)}

      {/* WIN SCREEN */}
{screen === 'win' && (
  <div style={{width:'100%', maxWidth:400, textAlign:'center', marginTop:40}}>
    <div style={{fontWeight:900, fontStyle:'italic', color:'#D4AF37', fontSize:40, marginBottom:4}}>PI</div>
    <p style={{fontSize:10, letterSpacing:4, opacity:0.5, textTransform:'uppercase', fontStyle:'italic', fontWeight:700, marginBottom:8}}>SYSTEM CALIBRATED</p>
    <h3 id="win-score-val" style={{fontSize:110, fontWeight:900, color:'#D4AF37', lineHeight:1, marginBottom:24, letterSpacing:-1}}>{finalScore}</h3>
    <div id="win-verdict" style={{padding:24, borderRadius:24, border:'1px solid #D4AF37', background:'rgba(212,175,55,0.1)', boxShadow:'0 0 30px rgba(212,175,55,0.2)', marginBottom:24}}>
      <p style={{fontSize:24, fontWeight:900, fontStyle:'italic', color:'#D4AF37', letterSpacing:-1, textTransform:'uppercase'}}>MASTER INDEX</p>
      <p style={{fontSize:12, opacity:0.9, fontStyle:'italic', marginTop:8}}>Your Prana Index has been calibrated. Regulation training complete.</p>
    </div>
    <button onClick={()=>{setScreen('landing'); setP1Taps([]); setP2Taps([]); setP3Hits([]);}} style={{fontSize:10, opacity:0.4, textTransform:'uppercase', letterSpacing:2, textDecoration:'underline', background:'none', border:'none', color:'inherit', cursor:'pointer'}}>
      Return to Home
    </button>
  </div>
)}
        </div>
    )
  }

