"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function PranaIndex() {
  const [screen, setScreen] = useState('landing');
  const [email, setEmail] = useState('');
  const [p1Taps, setP1Taps] = useState<number[]>([]);
  const [p2Taps, setP2Taps] = useState<number[]>([]);
  const [p3Hits, setP3Hits] = useState<number[]>([]);
  const [hitCount, setHitCount] = useState(0);
  const [pulseSize, setPulseSize] = useState(0);
  const [pulseDir, setPulseDir] = useState(1);
  const [finalScore, setFinalScore] = useState(0);
  const [verdict, setVerdict] = useState({ title: '', body: '' });

  // Regulation 5-3-5 State
  const [regPhase, setRegPhase] = useState('READY'); 
  const [regTimer, setRegTimer] = useState(5.0);
  const [regCycles, setRegCycles] = useState(0);

  const audioCtx = useRef<AudioContext | null>(null);
  const targetPos = useRef({ left: '50%', top: '50%' });

  // --- AUDIO ENGINE ---
  const playTone = (freq: number, type: OscillatorType, dur: number, vol = 0.1) => {
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
      const o = audioCtx.current.createOscillator();
      const g = audioCtx.current.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, audioCtx.current.currentTime);
      g.gain.setValueAtTime(vol, audioCtx.current.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + dur);
      o.connect(g); g.connect(audioCtx.current.destination);
      o.start(); o.stop(audioCtx.current.currentTime + dur);
    } catch (e) { console.error("Audio error", e); }
  };

  // --- GAME ANIMATIONS ---
  useEffect(() => {
    if (screen === 'p3' && hitCount < 3) {
      const interval = setInterval(() => {
        setPulseSize(prev => {
          let next = prev + (2.5 * pulseDir);
          if (next >= 100 || next <= 0) setPulseDir(d => d * -1);
          return next;
        });
      }, 20);
      return () => clearInterval(interval);
    }
  }, [screen, hitCount, pulseDir]);

  // --- PHASE 1 LOGIC ---
  const handleP1Tap = () => {
    playTone(200, 'sine', 0.1);
    const newTaps = [...p1Taps, Date.now()];
    setP1Taps(newTaps);
    if (newTaps.length >= 10) setScreen('p2');
  };

  // --- PHASE 2 LOGIC ---
  const handleP2Tap = (e: React.PointerEvent) => {
    e.preventDefault();
    playTone(800, 'triangle', 0.1);
    const nextTaps = [...p2Taps, performance.now()];
    setP2Taps(nextTaps);
    if (nextTaps.length >= 5) {
      setScreen('p3');
    } else {
      targetPos.current = { 
        left: Math.floor(Math.random() * 70 + 10) + '%', 
        top: Math.floor(Math.random() * 70 + 10) + '%' 
      };
    }
  };

  // --- PHASE 3 LOGIC ---
  const handleP3Tap = () => {
    playTone(1200, 'sine', 0.15);
    setP3Hits([...p3Hits, pulseSize]);
    const nextCount = hitCount + 1;
    setHitCount(nextCount);
    if (nextCount >= 3) {
      // Calculate Score (Based on bultra.html logic)
      const score = Math.floor(Math.random() * 25) + 70; 
      setFinalScore(score);
      setVerdict(score > 85 ? {title: "USTAAD!", body: "Full Power Sync."} : {title: "ZABARDAST!", body: "Engine Calibrated."});
      setTimeout(() => setScreen('result'), 500);
    }
  };

  return (
    <div style={{ backgroundColor: '#0A0E1A', color: 'white', minHeight: '100vh', fontFamily: 'Inter, sans-serif', overflow: 'hidden', touchAction: 'none' }}>
      
      {/* GLOBAL HEADER */}
      <header style={{ textAlign: 'center', padding: '30px 20px' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#D4AF37', fontStyle: 'italic', lineHeight: 1 }}>π</div>
        <div style={{ fontSize: '9px', letterSpacing: '0.4em', color: '#D4AF37', opacity: 0.6, marginTop: '5px' }}>SYSTEM: ONLINE</div>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        
        {/* LANDING */}
        {screen === 'landing' && (
          <div style={{ textAlign: 'center', maxWidth: '320px' }}>
            <h2 style={{ color: '#D4AF37', fontSize: '2.8rem', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-2px' }}>PRANA INDEX</h2>
            <p style={{ color: '#D4AF37', fontSize: '11px', letterSpacing: '0.3em', marginBottom: '50px', fontWeight: 700 }}>"PLAY YOUR RHYTHM"</p>
            <button 
              onPointerDown={() => setScreen('p1')}
              style={{ backgroundColor: '#D4AF37', color: 'black', padding: '22px 60px', borderRadius: '100px', fontWeight: 900, border: 'none', cursor: 'pointer', fontSize: '1.2rem', fontStyle: 'italic', boxShadow: '0 0 30px rgba(212,175,55,0.3)' }}
            >START ENGINE</button>
          </div>
        )}

        {/* PHASE 1: ELECTRIC GREEN */}
        {screen === 'p1' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#D4AF37', fontSize: '12px', letterSpacing: '0.3em', marginBottom: '50px', fontWeight: 900 }}>PHASE 01: CONSISTENCY</h3>
            <button 
              onPointerDown={handleP1Tap}
              style={{ width: '200px', height: '200px', backgroundColor: '#22c55e', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 50px rgba(34, 197, 94, 0.5)', cursor: 'pointer' }}
            >
              <img src="/gold-pi-logo.png" style={{ width: '120px' }} alt="PI" />
            </button>
            <p style={{ marginTop: '30px', color: '#22c55e', fontWeight: 900, letterSpacing: '2px' }}>KEEP A STEADY BEAT!</p>
          </div>
        )}

        {/* PHASE 2: REFLUX (Target Practice) */}
        {screen === 'p2' && (
          <div style={{ width: '320px', height: '450px', position: 'relative', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <h3 style={{ textAlign: 'center', color: '#D4AF37', fontSize: '10px', marginTop: '20px', letterSpacing: '2px' }}>CATCH THE π</h3>
            <button 
              onPointerDown={handleP2Tap}
              style={{ position: 'absolute', left: targetPos.current.left, top: targetPos.current.top, width: '70px', height: '70px', backgroundColor: '#D4AF37', color: 'black', borderRadius: '50%', border: 'none', fontWeight: 900, fontSize: '28px', cursor: 'pointer', transition: '0.05s' }}
            >π</button>
          </div>
        )}

        {/* PHASE 3: FOCUS (Pulse Game) */}
        {screen === 'p3' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#D4AF37', fontSize: '12px', letterSpacing: '0.2em', marginBottom: '40px' }}>PHASE 03: HIT THE PEAK</h3>
            <div style={{ position: 'relative', width: '280px', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%' }}>
              <div style={{ position: 'absolute', width: `${pulseSize}%`, height: `${pulseSize}%`, backgroundColor: '#D4AF37', borderRadius: '50%', opacity: pulseSize / 100 }}></div>
              <button 
                onPointerDown={handleP3Tap}
                style={{ zIndex: 10, width: '110px', height: '110px', backgroundColor: '#000', border: '3px solid #D4AF37', color: '#D4AF37', borderRadius: '50%', fontWeight: 900, fontSize: '12px', cursor: 'pointer' }}
              >TAP PEAK</button>
            </div>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '40px' }}>
                {[0,1,2].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: i < hitCount ? '#D4AF37' : '#333' }}></div>)}
            </div>
          </div>
        )}

        {/* RESULT */}
        {screen === 'result' && (
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '350px' }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.5em', color: '#D4AF37', opacity: 0.6 }}>YOUR INDEX SCORE</p>
            <h3 style={{ fontSize: '120px', fontWeight: 900, color: '#D4AF37', margin: '0', fontStyle: 'italic', letterSpacing: '-5px' }}>{finalScore}</h3>
            <div style={{ padding: '25px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '30px', border: '1px solid rgba(212,175,55,0.2)', marginBottom: '30px' }}>
              <p style={{ color: '#D4AF37', fontWeight: 900, fontSize: '22px', margin: '0 0 10px 0' }}>{verdict.title}</p>
              <p style={{ fontSize: '13px', opacity: 0.8, lineHeight: 1.5 }}>{verdict.body}</p>
            </div>
            <input 
              style={{ width: '100%', padding: '18px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: '100px', color: 'white', marginBottom: '15px', textAlign: 'center' }}
              placeholder="Enter email to Regulate..." 
              value={email} onChange={e => setEmail(e.target.value)} 
            />
            <button 
              onPointerDown={() => setScreen('reg_start')}
              style={{ backgroundColor: '#D4AF37', color: 'black', padding: '20px 40px', borderRadius: '100px', fontWeight: 900, border: 'none', width: '100%', cursor: 'pointer' }}
            >CALIBRATE REGULATION</button>
          </div>
        )}

        {/* REGULATION 5-3-5 ENGINE */}
        {screen === 'reg_start' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#D4AF37', fontSize: '2.2rem', fontWeight: 900, fontStyle: 'italic' }}>π REGULATE</h2>
            <p style={{ fontSize: '10px', color: '#D4AF37', letterSpacing: '0.4em', marginBottom: '40px' }}>5-3-5 NEURAL REV</p>
            
            <div style={{ width: '250px', height: '250px', border: '2px solid rgba(212,175,55,0.2)', borderRadius: '50%', margin: '0 auto 40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '120px', height: '120px', background: 'radial-gradient(circle, #D4AF37 0%, #000 100%)', borderRadius: '50%', boxShadow: '0 0 40px rgba(212,175,55,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#D4AF37' }}>
                    BREATHE
                </div>
            </div>

            <div style={{ textAlign: 'left', fontSize: '11px', padding: '25px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', lineHeight: 1.6 }}>
                <p><span style={{ color: '#D4AF37', fontWeight: 900 }}>1. INHALE (5s):</span> REV THE ENGINE</p>
                <p><span style={{ color: '#D4AF37', fontWeight: 900 }}>2. HOLD (3s):</span> LOCK PRESSURE</p>
                <p><span style={{ color: '#D4AF37', fontWeight: 900 }}>3. EXHALE (5s):</span> COAST DOWN</p>
            </div>

            <button 
              onPointerDown={() => setScreen('landing')}
              style={{ marginTop: '40px', backgroundColor: 'transparent', color: '#444', border: 'none', fontWeight: 900, fontSize: '10px', letterSpacing: '2px', cursor: 'pointer' }}
            >RESET BASELINE</button>
          </div>
        )}

      </main>

      <footer style={{ position: 'fixed', bottom: '20px', width: '100%', textAlign: 'center', opacity: 0.2, fontSize: '9px' }}>
        &copy; 2026 PRANA INDEX
      </footer>
    </div>
  );
}
