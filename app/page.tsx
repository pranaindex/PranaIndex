"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function PranaIndex() {
  const [screen, setScreen] = useState('landing');
  const [email, setEmail] = useState('');
  const [p1Taps, setP1Taps] = useState<number[]>([]);
  const [p2Taps, setP2Taps] = useState<number[]>([]);
  const [hitCount, setHitCount] = useState(0);
  const [pulseSize, setPulseSize] = useState(0);
  const [pulseDir, setPulseDir] = useState(1);
  const [finalScore, setFinalScore] = useState(0);
  
  // Regulation State (5-3-5)
  const [regStatus, setRegStatus] = useState('HOLD TO START'); // INHALE, HOLD, EXHALE
  const [regTimer, setRegTimer] = useState(5.0);
  const [isPressing, setIsPressing] = useState(false);

  const audioCtx = useRef<AudioContext | null>(null);
  const targetPos = useRef({ left: '50%', top: '50%' });
  const timerRef = useRef<any>(null);

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

  // --- PHASE 1 LOGIC ---
  const handleP1Tap = () => {
    playTone(200, 'sine', 0.1);
    const newTaps = [...p1Taps, Date.now()];
    setP1Taps(newTaps);
    if (newTaps.length >= 10) setScreen('p2');
  };

  // --- PHASE 2 LOGIC ---
  const handleP2Tap = () => {
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

  // --- PHASE 3 PULSE ---
  useEffect(() => {
    if (screen === 'p3' && hitCount < 3) {
      const interval = setInterval(() => {
        setPulseSize(p => {
          let n = p + (3 * pulseDir);
          if (n >= 100 || n <= 0) setPulseDir(d => d * -1);
          return n;
        });
      }, 20);
      return () => clearInterval(interval);
    }
  }, [screen, hitCount, pulseDir]);

  const handleP3Tap = () => {
    playTone(1200, 'sine', 0.15);
    const next = hitCount + 1;
    setHitCount(next);
    if (next >= 3) {
      setFinalScore(Math.floor(Math.random() * 20) + 75);
      setTimeout(() => setScreen('result'), 500);
    }
  };

  // --- REGULATION ENGINE (5-3-5) ---
  const startBreathing = () => {
    initAudio();
    setIsPressing(true);
    setRegStatus('INHALE');
    let timeLeft = 5.0;
    timerRef.current = setInterval(() => {
      timeLeft -= 0.1;
      setRegTimer(Math.max(0, timeLeft));
      if (timeLeft <= 0) {
        clearInterval(timerRef.current);
        startHold();
      }
    }, 100);
  };

  const startHold = () => {
    setRegStatus('HOLD');
    let timeLeft = 3.0;
    timerRef.current = setInterval(() => {
      timeLeft -= 0.1;
      setRegTimer(Math.max(0, timeLeft));
      if (timeLeft <= 0) {
        clearInterval(timerRef.current);
        setRegStatus('RELEASE TO EXHALE');
      }
    }, 100);
  };

  const handleRelease = () => {
    setIsPressing(false);
    clearInterval(timerRef.current);
    if (regStatus === 'RELEASE TO EXHALE' || regStatus === 'HOLD') {
      setRegStatus('EXHALE');
      let timeLeft = 5.0;
      timerRef.current = setInterval(() => {
        timeLeft -= 0.1;
        setRegTimer(Math.max(0, timeLeft));
        if (timeLeft <= 0) {
          clearInterval(timerRef.current);
          setRegStatus('COHERENCE ACHIEVED');
        }
      }, 100);
    } else {
      setRegStatus('FAILED - HOLD LONGER');
    }
  };

  return (
    <div style={{ backgroundColor: '#0A0E1A', color: 'white', minHeight: '100vh', fontFamily: 'Inter, sans-serif', touchAction: 'none' }}>
      <header style={{ textAlign: 'center', padding: '30px', color: '#D4AF37' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, fontStyle: 'italic' }}>π</div>
        <div style={{ fontSize: '9px', letterSpacing: '0.4em' }}>SYSTEM: ONLINE</div>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        
        {screen === 'landing' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#D4AF37', fontSize: '2.5rem', fontWeight: 900, fontStyle: 'italic' }}>PRANA INDEX</h2>
            <p style={{ color: '#D4AF37', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '40px' }}>"PLAY YOUR RHYTHM"</p>
            <button 
              onClick={() => { initAudio(); setScreen('p1'); }}
              style={{ backgroundColor: '#D4AF37', color: 'black', padding: '20px 60px', borderRadius: '50px', fontWeight: 900, border: 'none', cursor: 'pointer' }}
            >START ENGINE</button>
          </div>
        )}

        {screen === 'p1' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#D4AF37', fontSize: '12px', marginBottom: '40px' }}>PHASE 01: CONSISTENCY</h3>
            <button 
              onPointerDown={handleP1Tap}
              style={{ width: '200px', height: '200px', backgroundColor: '#22c55e', borderRadius: '50%', border: 'none', boxShadow: '0 0 50px rgba(34,197,94,0.5)', cursor: 'pointer', color: 'white', fontSize: '2rem', fontWeight: 900 }}
            >π</button>
            <p style={{ marginTop: '30px', color: '#22c55e', fontWeight: 900 }}>TAP STEADY BEAT</p>
          </div>
        )}

        {screen === 'p2' && (
          <div style={{ width: '300px', height: '450px', position: 'relative', backgroundColor: '#ffffff05', borderRadius: '30px', border: '1px solid #ffffff11' }}>
            <button 
              onPointerDown={handleP2Tap}
              style={{ position: 'absolute', left: targetPos.current.left, top: targetPos.current.top, width: '70px', height: '70px', backgroundColor: '#D4AF37', color: 'black', borderRadius: '50%', border: 'none', fontWeight: 900, fontSize: '24px' }}
            >π</button>
          </div>
        )}

        {screen === 'p3' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#D4AF37', marginBottom: '40px' }}>PHASE 03: HIT THE PEAK</h3>
            <div style={{ position: 'relative', width: '250px', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', width: `${pulseSize}%`, height: `${pulseSize}%`, backgroundColor: '#D4AF37', borderRadius: '50%', opacity: pulseSize/100 }}></div>
              <button 
                onPointerDown={handleP3Tap}
                style={{ zIndex: 10, width: '100px', height: '100px', backgroundColor: '#000', border: '3px solid #D4AF37', color: '#D4AF37', borderRadius: '50%', fontWeight: 900 }}
              >TAP</button>
            </div>
          </div>
        )}

        {screen === 'result' && (
          <div style={{ textAlign: 'center', maxWidth: '350px' }}>
            <h3 style={{ fontSize: '100px', fontWeight: 900, color: '#D4AF37', margin: 0 }}>{finalScore}</h3>
            <p style={{ color: '#D4AF37', fontWeight: 900, marginBottom: '30px' }}>USTAAD! FULL POWER!</p>
            <input 
              style={{ width: '100%', padding: '15px', background: 'rgba(0,0,0,0.5)', border: '1px solid #D4AF37', borderRadius: '50px', color: 'white', marginBottom: '15px', textAlign: 'center' }}
              placeholder="Enter email to Regulate..." 
              value={email} onChange={e => setEmail(e.target.value)} 
            />
            <button 
              onClick={() => setScreen('reg_game')}
              style={{ backgroundColor: '#D4AF37', color: 'black', padding: '20px 40px', borderRadius: '50px', fontWeight: 900, width: '100%', border: 'none' }}
            >CALIBRATE REGULATION</button>
          </div>
        )}

        {screen === 'reg_game' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#D4AF37', fontSize: '2rem', fontStyle: 'italic' }}>{regStatus}</h2>
            <h3 style={{ fontSize: '4rem', color: '#D4AF37', margin: '20px 0' }}>{regTimer.toFixed(1)}s</h3>
            
            <div 
              onPointerDown={startBreathing}
              onPointerUp={handleRelease}
              style={{ 
                width: '200px', height: '200px', borderRadius: '50%', 
                background: isPressing ? '#D4AF37' : 'transparent',
                border: '4px solid #D4AF37', margin: '0 auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: '0.2s', cursor: 'pointer'
              }}
            >
                <span style={{ color: isPressing ? 'black' : '#D4AF37', fontWeight: 900 }}>{isPressing ? 'HOLDING' : 'HOLD TO REV'}</span>
            </div>

            <p style={{ marginTop: '30px', fontSize: '10px', color: '#D4AF37', opacity: 0.6 }}>5s INHALE | 3s HOLD | 5s EXHALE</p>
            {regStatus === 'COHERENCE ACHIEVED' && (
                 <button onClick={() => setScreen('landing')} style={{ marginTop: '20px', color: '#D4AF37', background: 'none', border: 'none', textDecoration: 'underline' }}>RESET BASLINE</button>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
