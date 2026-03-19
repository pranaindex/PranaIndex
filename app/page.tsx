"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function PranaIndex() {
  const [screen, setScreen] = useState('landing');
  const [regPhase, setRegPhase] = useState('READY'); 
  const [regTimer, setRegTimer] = useState(5.0);
  const [regCycles, setRegCycles] = useState(0);
  const [isHolding, setIsHolding] = useState(false);

  const audioCtx = useRef<AudioContext | null>(null);
  const rainAudio = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- 1. ATMOSPHERIC RAIN ANIMATION ---
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let drops: any[] = [];
    for (let i = 0; i < 200; i++) {
      drops.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, l: Math.random() * 20, v: Math.random() * 5 + 2 });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 14, 26, 0.2)'; // Dark blue-black trail
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(170, 170, 170, 0.15)';
      ctx.lineWidth = 1;
      drops.forEach(d => {
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, d.y + d.l); ctx.stroke();
        d.y += d.v; if (d.y > canvas.height) { d.y = -20; d.x = Math.random() * canvas.width; }
      });
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  // --- 2. SOUND ENGINE ---
  const startAtmosphere = () => {
    // Start Rain
    if (!rainAudio.current) {
      rainAudio.current = new Audio("https://www.soundjay.com/nature/rain-01.mp3");
      rainAudio.current.loop = true;
      rainAudio.current.volume = 0.3;
    }
    rainAudio.current.play();

    // Init Game Sound
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
    
    setScreen('stress_start');
  };

  const playTone = (f: number, d: number) => {
    if (!audioCtx.current) return;
    const o = audioCtx.current.createOscillator();
    const g = audioCtx.current.createGain();
    o.frequency.setValueAtTime(f, audioCtx.current.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + d);
    o.connect(g); g.connect(audioCtx.current.destination);
    o.start(); o.stop(audioCtx.current.currentTime + d);
  };

  // --- 3. REGULATION LOGIC (5-3-5 x 3 Cycles) ---
  const runRegCycle = () => {
    if (regCycles >= 3) { setRegPhase('COMPLETE'); return; }

    setRegPhase('INHALE');
    let time = 5.0;
    const inhaleInt = setInterval(() => {
      time -= 0.1; setRegTimer(Math.max(0, time));
      if (time <= 0) {
        clearInterval(inhaleInt);
        setRegPhase('HOLD');
        let hTime = 3.0;
        const holdInt = setInterval(() => {
          hTime -= 0.1; setRegTimer(Math.max(0, hTime));
          if (hTime <= 0) {
            clearInterval(holdInt);
            setRegPhase('EXHALE');
            let eTime = 5.0;
            const exhaleInt = setInterval(() => {
              eTime -= 0.1; setRegTimer(Math.max(0, eTime));
              if (eTime <= 0) {
                clearInterval(exhaleInt);
                setRegCycles(c => c + 1);
                setRegPhase('READY');
              }
            }, 100);
          }
        }, 100);
      }
    }, 100);
  };

  return (
    <div style={{ backgroundColor: '#0A0E1A', color: 'white', minHeight: '100vh', fontFamily: 'Inter, sans-serif', overflow: 'hidden', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
        
        {/* LANDING PAGE */}
        {screen === 'landing' && (
          <div style={{ animation: 'fadeIn 2s ease-in' }}>
            <img src="/gold-pi-logo.png" style={{ width: '180px', marginBottom: '10px' }} alt="Prana Index Logo" />
            <h1 style={{ color: 'white', fontSize: '14px', letterSpacing: '0.5em', fontWeight: 300, marginBottom: '40px' }}>PRANA INDEX</h1>
            
            <p style={{ color: '#39FF14', fontSize: '24px', fontWeight: 900, fontStyle: 'italic', marginBottom: '10px' }}>Play your rhythm</p>
            <p style={{ color: 'white', fontSize: '18px', fontWeight: 700, marginBottom: '40px', letterSpacing: '1px' }}>CHECK YOUR PI STRESS SCORE</p>
            
            <button 
              onClick={startAtmosphere}
              style={{ background: 'none', border: 'none', color: '#39FF14', fontSize: '32px', fontWeight: 900, cursor: 'pointer', outline: 'none' }}
            >Start</button>
          </div>
        )}

        {/* STRESS TEST START (The Details Page) */}
        {screen === 'stress_start' && (
          <div style={{ maxWidth: '320px', padding: '20px' }}>
            <h2 style={{ color: '#D4AF37', fontSize: '2.5rem', fontWeight: 900, fontStyle: 'italic' }}>PRANA INDEX</h2>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', margin: '30px 0' }}>
               <p style={{ fontSize: '11px', marginBottom: '10px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>01 CONSISTENCY:</span> Tap a steady beat for 15s.</p>
               <p style={{ fontSize: '11px', marginBottom: '10px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>02 REFLUX:</span> Catch 5 nodes as fast as possible.</p>
               <p style={{ fontSize: '11px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>03 FOCUS:</span> Hit the button at the peak of the wave.</p>
            </div>
            <button 
              onClick={() => setScreen('reg_game')}
              style={{ backgroundColor: '#D4AF37', color: 'black', padding: '20px 50px', borderRadius: '50px', fontWeight: 900, border: 'none' }}
            >START ENGINE</button>
          </div>
        )}

        {/* REGULATION GAME (5-3-5 x 3) */}
        {screen === 'reg_game' && (
          <div style={{ animation: 'fadeIn 1s ease-in' }}>
            <h2 style={{ color: '#D4AF37', fontSize: '2rem', fontStyle: 'italic', fontWeight: 900 }}>{regPhase}</h2>
            <h3 style={{ fontSize: '5rem', color: 'white', margin: '20px 0', fontWeight: 900 }}>{regTimer.toFixed(1)}s</h3>
            
            <div style={{ width: '250px', height: '250px', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
               <div style={{ 
                  width: '80px', height: '80px', background: '#D4AF37', borderRadius: '50%',
                  transform: regPhase === 'INHALE' ? `scale(${2.5 - (regTimer/2)})` : regPhase === 'EXHALE' ? `scale(${1 + (regTimer/2)})` : 'scale(1)',
                  transition: '0.1s linear', boxShadow: '0 0 40px rgba(212,175,55,0.5)'
               }}></div>
            </div>

            <p style={{ marginTop: '40px', color: '#D4AF37', letterSpacing: '2px' }}>CYCLE {regCycles + 1} / 3</p>
            
            {regPhase === 'READY' && regCycles < 3 && (
              <button onClick={runRegCycle} style={{ marginTop: '20px', background: '#D4AF37', color: 'black', padding: '15px 30px', borderRadius: '50px', fontWeight: 900, border: 'none' }}>BEGIN NEXT BREATH</button>
            )}
            
            {regPhase === 'COMPLETE' && (
              <div style={{ marginTop: '20px' }}>
                <p style={{ color: '#39FF14', fontWeight: 900 }}>COHERENCE ACHIEVED</p>
                <button onClick={() => window.location.reload()} style={{ color: 'white', background: 'none', border: 'none', textDecoration: 'underline', marginTop: '10px' }}>RESTART ENGINE</button>
              </div>
            )}
          </div>
        )}

      </div>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        body { margin: 0; padding: 0; background: #0A0E1A; }
      `}</style>
    </div>
  );
}
