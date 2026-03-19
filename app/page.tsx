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

  // Regulation State
  const [regPhase, setRegPhase] = useState('READY'); 
  const [regTimer, setRegTimer] = useState(5.0);

  const audioCtx = useRef<AudioContext | null>(null);
  const targetRef = useRef({ left: '50%', top: '50%' });

  // --- AUDIO ---
  const playTone = (freq: number, type: OscillatorType, dur: number, vol = 0.1) => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = audioCtx.current.createOscillator();
    const g = audioCtx.current.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, audioCtx.current.currentTime);
    g.gain.setValueAtTime(vol, audioCtx.current.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + dur);
    o.connect(g); g.connect(audioCtx.current.destination);
    o.start(); o.stop(audioCtx.current.currentTime + dur);
  };

  // --- PHASE TRANSITIONS ---
  useEffect(() => {
    if (screen === 'p2' && p2Taps.length >= 5) {
      setScreen('p3');
    }
  }, [p2Taps, screen]);

  useEffect(() => {
    if (screen === 'p3' && hitCount < 3) {
      const interval = setInterval(() => {
        setPulseSize(prev => {
          let next = prev + (2 * pulseDir);
          if (next >= 100 || next <= 0) setPulseDir(d => d * -1);
          return next;
        });
      }, 16);
      return () => clearInterval(interval);
    }
  }, [screen, hitCount, pulseDir]);

  // --- GAME ACTIONS ---
  const handleP2Tap = () => {
    playTone(800, 'triangle', 0.1);
    setP2Taps(prev => [...prev, performance.now()]);
    targetRef.current = { left: Math.random() * 80 + '%', top: Math.random() * 80 + '%' };
  };

  const handleP3Tap = () => {
    playTone(1200, 'sine', 0.15);
    setP3Hits(prev => [...prev, pulseSize]);
    setHitCount(prev => {
      const next = prev + 1;
      if (next >= 3) setTimeout(calculateFinal, 500);
      return next;
    });
  };

  const calculateFinal = () => {
    const score = Math.floor(Math.random() * 30) + 65;
    setFinalScore(score);
    setVerdict(score > 75 ? {title:"USTAAD!", body:"Perfect Sync."} : {title:"GOOD!", body:"Engine tuned."});
    setScreen('result');
  };

  return (
    <div style={{ backgroundColor: '#0A0E1A', color: 'white', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '20px', color: '#D4AF37' }}>
        <div style={{ fontSize: '2rem', fontStyle: 'italic', fontWeight: 900 }}>π</div>
        <div style={{ fontSize: '8px', letterSpacing: '0.4em' }}>SYSTEM: ONLINE</div>
      </div>

      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        
        {screen === 'landing' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#D4AF37', fontSize: '2.5rem', fontWeight: 900 }}>PRANA INDEX</h2>
            <p style={{ color: '#D4AF37', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '40px' }}>PLAY YOUR RHYTHM</p>
            <button 
              style={{ backgroundColor: '#D4AF37', color: 'black', padding: '20px 50px', borderRadius: '50px', fontWeight: 900, border: 'none', cursor: 'pointer' }}
              onClick={() => setScreen('p1')}
            >START ENGINE</button>
          </div>
        )}

        {screen === 'p1' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#D4AF37', fontSize: '12px', marginBottom: '40px' }}>PHASE 01: CONSISTENCY</h3>
            <button 
              onPointerDown={() => { playTone(200, 'sine', 0.1); setP1Taps([...p1Taps, Date.now()]); if(p1Taps.length > 10) setScreen('p2'); }}
              style={{ width: '180px', height: '180px', backgroundColor: '#22c55e', borderRadius: '50%', border: 'none', boxShadow: '0 0 40px #22c55e66' }}
            >
              <img src="/gold-pi-logo.png" style={{ width: '100px' }} alt="PI" />
            </button>
            <p style={{ marginTop: '20px', color: '#22c55e', fontWeight: 900 }}>TAP STEADY BEAT</p>
          </div>
        )}

        {screen === 'p2' && (
          <div style={{ width: '300px', height: '400px', position: 'relative', backgroundColor: '#ffffff05', borderRadius: '20px', border: '1px solid #ffffff11' }}>
            <button 
              onPointerDown={handleP2Tap}
              style={{ position: 'absolute', left: targetRef.current.left, top: targetRef.current.top, width: '60px', height: '60px', backgroundColor: '#D4AF37', borderRadius: '50%', border: 'none', fontWeight: 900 }}
            >π</button>
          </div>
        )}

        {screen === 'p3' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#D4AF37', marginBottom: '20px' }}>PHASE 03: HIT THE PEAK</h3>
            <div style={{ position: 'relative', width: '250px', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', width: `${pulseSize}%`, height: `${pulseSize}%`, backgroundColor: '#D4AF37', borderRadius: '50%', opacity: pulseSize/100 }}></div>
              <button 
                onPointerDown={handleP3Tap}
                style={{ zIndex: 10, width: '100px', height: '100px', backgroundColor: '#000', border: '2px solid #D4AF37', color: '#D4AF37', borderRadius: '50%', fontWeight: 900 }}
              >TAP PEAK</button>
            </div>
          </div>
        )}

        {screen === 'result' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '80px', color: '#D4AF37', margin: 0 }}>{finalScore}</h3>
            <p style={{ color: '#D4AF37', fontWeight: 900 }}>{verdict.title}</p>
            <input 
              style={{ width: '100%', padding: '15px', background: '#ffffff05', border: '1px solid #D4AF37', borderRadius: '50px', color: 'white', margin: '20px 0' }}
              placeholder="Email to Regulate..." 
              value={email} onChange={e => setEmail(e.target.value)} 
            />
            <button 
              style={{ backgroundColor: '#D4AF37', color: 'black', padding: '15px 40px', borderRadius: '50px', fontWeight: 900, border: 'none' }}
              onClick={() => setScreen('reg_start')}
            >CALIBRATE REGULATION</button>
          </div>
        )}

        {screen === 'reg_start' && (
           <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: '#D4AF37', fontSize: '2rem' }}>5-3-5 PROTOCOL</h2>
              <p style={{ fontSize: '11px', margin: '20px 0' }}>INHALE 5s | HOLD 3s | EXHALE 5s</p>
              <button 
                style={{ backgroundColor: '#D4AF37', color: 'black', padding: '20px 50px', borderRadius: '50px', fontWeight: 900, border: 'none' }}
                onClick={() => setScreen('landing')}
              >RESET ENGINE</button>
           </div>
        )}

      </main>
    </div>
  );
}
