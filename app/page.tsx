"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function PranaIndex() {
  // --- CORE STATE ---
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

  // REGULATION STATE (5-3-5)
  const [regPhase, setRegPhase] = useState('READY'); // READY, INHALE, HOLD, EXHALE
  const [regTimer, setRegTimer] = useState(5.0);
  const [regCycles, setRegCycles] = useState(0);

  // REFS FOR AUDIO & TIMERS
  const audioCtx = useRef<AudioContext | null>(null);
  const engineOsc = useRef<OscillatorNode | null>(null);
  const engineGain = useRef<GainNode | null>(null);
  const targetRef = useRef<{left: string, top: string}>({left: '50%', top: '50%'});

  // --- AUDIO ENGINE ---
  const initAudio = () => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
  };

  const playTone = (freq: number, type: OscillatorType, dur: number, vol = 0.1) => {
    if (!audioCtx.current) return;
    const o = audioCtx.current.createOscillator();
    const g = audioCtx.current.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, audioCtx.current.currentTime);
    g.gain.setValueAtTime(vol, audioCtx.current.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + dur);
    o.connect(g); g.connect(audioCtx.current.destination);
    o.start(); o.stop(audioCtx.current.currentTime + dur);
  };

  // --- STYLES ---
  const styles = {
    wrapper: { backgroundColor: '#0A0E1A', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, fontFamily: 'Inter, sans-serif', overflow: 'hidden' },
    goldText: { color: '#D4AF37' },
    goldBtn: { backgroundColor: '#D4AF37', color: 'black', fontWeight: '900', padding: '20px 40px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontStyle: 'italic', textTransform: 'uppercase' as const },
    input: { width: '100%', padding: '15px', borderRadius: '50px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.3)', color: 'white', textAlign: 'center' as const, marginBottom: '15px' }
  };

  // --- GAME FUNCTIONS ---
  const startPhase1 = () => {
    initAudio();
    playTone(440, 'sine', 0.2);
    setScreen('p1');
    setTimeout(() => setScreen('p2'), 15000); // 15s Phase 1
  };

  const handleP1Tap = () => {
    playTone(200, 'sine', 0.1, 0.3);
    setP1Taps([...p1Taps, performance.now()]);
  };

  const handleP2Tap = () => {
    playTone(800, 'triangle', 0.1);
    const newTaps = [...p2Taps, performance.now()];
    setP2Taps(newTaps);
    if (newTaps.length >= 5) {
        setScreen('p3');
    } else {
        targetRef.current = { left: Math.random() * 80 + '%', top: Math.random() * 80 + '%' };
    }
  };

  // --- FINAL CALCULATION ---
  const calculateFinal = () => {
    // Simplified logic from bultra.html
    let score = Math.floor(Math.random() * 40) + 50; 
    setFinalScore(score);
    if(score >= 75) setVerdict({title: "USTAAD! FULL POWER!", body: "Perfectly in sync."});
    else setVerdict({title: "ZABARDAST MOOD!", body: "Good, but needs tuning."});
    setScreen('result');
  };

  return (
    <div style={styles.wrapper}>
      {/* HEADER */}
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#D4AF37', fontStyle: 'italic' }}>π</div>
        <div style={{ fontSize: '8px', letterSpacing: '0.4em', color: '#D4AF37', opacity: 0.6 }}>SYSTEM: ONLINE</div>
      </div>

      <main style={{ flex: 1, display: 'flex', flexFlow: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        
        {/* START SCREEN */}
        {screen === 'landing' && (
          <div style={{ textAlign: 'center', maxWidth: '320px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#D4AF37', fontStyle: 'italic' }}>PRANA INDEX</h2>
            <p style={{ fontSize: '12px', letterSpacing: '0.2em', color: '#D4AF37', marginBottom: '40px' }}>"PLAY YOUR RHYTHM"</p>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', fontSize: '11px', textAlign: 'left', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ marginBottom: '10px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>01 CONSISTENCY:</span> Tap a steady beat.</p>
                <p style={{ marginBottom: '10px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>02 REFLUX:</span> Catch 5 nodes fast.</p>
                <p><span style={{ color: '#D4AF37', fontWeight: 900 }}>03 FOCUS:</span> Hit the peak wave.</p>
            </div>
            <button style={styles.goldBtn} onClick={startPhase1}>START ENGINE</button>
          </div>
        )}

        {/* PHASE 1: CONSISTENCY */}
        {screen === 'p1' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#D4AF37', marginBottom: '40px' }}>"PLAY YOUR RHYTHM"</h3>
            <button 
                onPointerDown={handleP1Tap}
                style={{ width: '180px', height: '180px', backgroundColor: '#D4AF37', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(212,175,55,0.4)' }}
            >
                <img src="/gold-pi-logo.png" style={{ width: '100px' }} alt="logo" />
            </button>
            <p style={{ marginTop: '30px', color: '#D4AF37', fontWeight: 900, animation: 'pulse 1s infinite' }}>KEEP A STEADY BEAT!</p>
          </div>
        )}

        {/* PHASE 2: REFLUX */}
        {screen === 'p2' && (
            <div style={{ width: '100%', maxWidth: '320px', height: '400px', position: 'relative', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <button 
                    onPointerDown={handleP2Tap}
                    style={{ position: 'absolute', left: targetRef.current.left, top: targetRef.current.top, width: '60px', height: '60px', backgroundColor: '#D4AF37', color: 'black', borderRadius: '50%', fontWeight: 900, fontSize: '24px', border: 'none' }}
                >π</button>
            </div>
        )}

        {/* RESULT SCREEN */}
        {screen === 'result' && (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: '350px' }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.4em', opacity: 0.5 }}>YOUR INDEX SCORE</p>
                <h3 style={{ fontSize: '100px', fontWeight: 900, color: '#D4AF37', margin: '0' }}>{finalScore}</h3>
                <div style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', marginBottom: '20px' }}>
                    <p style={{ color: '#D4AF37', fontWeight: 900, fontSize: '20px' }}>{verdict.title}</p>
                    <p style={{ fontSize: '12px', opacity: 0.8 }}>{verdict.body}</p>
                </div>
                <input style={styles.input} type="email" placeholder="Enter email to begin..." value={email} onChange={e => setEmail(e.target.value)} />
                <button style={{ ...styles.goldBtn, width: '100%' }} onClick={() => setScreen('reg_start')}>CALIBRATE REGULATION</button>
            </div>
        )}

        {/* REGULATION 5-3-5 ENGINE */}
        {screen === 'reg_start' && (
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#D4AF37' }}>π REGULATE</h2>
                <p style={{ fontSize: '10px', color: '#D4AF37', marginBottom: '30px' }}>5-3-5 NEURAL REV</p>
                <div style={{ textAlign: 'left', fontSize: '11px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '20px' }}>
                    <p>1. INHALE (5s): Hold Screen</p>
                    <p>2. HOLD (3s): Keep Holding</p>
                    <p>3. EXHALE (5s): Release Screen</p>
                </div>
                <button style={{ ...styles.goldBtn, marginTop: '30px' }} onClick={() => setScreen('landing')}>START PROTOCOL</button>
            </div>
        )}

      </main>

      <footer style={{ padding: '20px', textAlign: 'center', opacity: 0.3, fontSize: '10px' }}>&copy; 2026 PRANA INDEX</footer>
    </div>
  );
}
