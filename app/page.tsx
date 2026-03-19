"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function PranaIndexUstaadEdition() {
  const [screen, setScreen] = useState('landing'); 
  const [email, setEmail] = useState('');
  
  // Game States
  const [p1Taps, setP1Taps] = useState<number[]>([]);
  const [p2Taps, setP2Taps] = useState<number[]>([]);
  const [p2StartTime, setP2StartTime] = useState(0);
  const [p3Hits, setP3Hits] = useState<number[]>([]);
  const [p1Timer, setP1Timer] = useState(15);
  const [pulseSize, setPulseSize] = useState(0);
  const [isTapping, setIsTapping] = useState(false);
  const [targetPos, setTargetPos] = useState({ left: '50%', top: '50%' });
  const [finalScore, setFinalScore] = useState(0);

  // Regulation Logic (5-3-5)
  const [regPhase, setRegPhase] = useState('WAITING'); 
  const [regTimer, setRegTimer] = useState(5.0);
  const [regCycle, setRegCycle] = useState(1);

  // Audio Refs
  const audioCtx = useRef<AudioContext | null>(null);
  const rainAudio = useRef<HTMLAudioElement | null>(null);

  // --- 1. PERSISTENT RAIN ANIMATION ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let drops = Array.from({ length: 100 }, () => ({
      x: Math.random() * 2000, y: Math.random() * 2000, l: Math.random() * 25, v: Math.random() * 7 + 4
    }));
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 14, 26, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
      drops.forEach(d => {
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, d.y + d.l); ctx.stroke();
        d.y += d.v; if (d.y > canvas.height) d.y = -30;
      });
      requestAnimationFrame(animate);
    };
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize); resize(); animate();
    return () => window.removeEventListener('resize', resize);
  }, []);

  // --- 2. SOUND ENGINE (FERRARI REV) ---
  const initAudio = () => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!rainAudio.current) {
      rainAudio.current = new Audio("https://www.soundjay.com/nature/rain-01.mp3");
      rainAudio.current.loop = true;
      rainAudio.current.volume = 0.4;
    }
    rainAudio.current.play();
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
    setScreen('p1_intro');
  };

  const playRev = (startF: number, endF: number, dur: number, vol: number) => {
    if (!audioCtx.current) return;
    const osc = audioCtx.current.createOscillator();
    const osc2 = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    
    osc.type = 'sawtooth';
    osc2.type = 'square'; // Adds the "growl"
    
    osc.frequency.setValueAtTime(startF, audioCtx.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endF, audioCtx.current.currentTime + dur);
    
    osc2.frequency.setValueAtTime(startF / 2, audioCtx.current.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(endF / 2, audioCtx.current.currentTime + dur);

    gain.gain.setValueAtTime(vol, audioCtx.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.current.currentTime + dur);

    osc.connect(gain); osc2.connect(gain);
    gain.connect(audioCtx.current.destination);
    
    osc.start(); osc2.start();
    osc.stop(audioCtx.current.currentTime + dur); osc2.stop(audioCtx.current.currentTime + dur);
  };

  // --- 3. GAME PROGRESSION ---
  useEffect(() => {
    if (screen === 'p1' && p1Timer > 0) {
      const t = setInterval(() => setP1Timer(v => v - 1), 1000);
      return () => clearInterval(t);
    } else if (screen === 'p1' && p1Timer === 0) {
      setScreen('p2'); setP2StartTime(Date.now());
    }
  }, [screen, p1Timer]);

  useEffect(() => {
    if (screen === 'p3') {
      let f = 0;
      const i = setInterval(() => { f += 0.05; setPulseSize(50 + Math.sin(f) * 50); }, 20);
      return () => clearInterval(i);
    }
  }, [screen]);

  // --- 4. AUTO-REGULATION ENGINE (5-3-5) ---
  const startAutoReg = () => {
    setRegPhase('INHALE'); setRegTimer(5);
    playRev(100, 400, 5, 0.1); // REV UP
    
    let time = 5;
    const inhale = setInterval(() => {
      time -= 0.1; setRegTimer(Math.max(0, time));
      if (time <= 0) {
        clearInterval(inhale);
        setRegPhase('HOLD'); setRegTimer(3);
        let hTime = 3;
        const hold = setInterval(() => {
          hTime -= 0.1; setRegTimer(Math.max(0, hTime));
          if (hTime <= 0) {
            clearInterval(hold);
            setRegPhase('EXHALE'); setRegTimer(5);
            playRev(400, 60, 5, 0.08); // REV DOWN
            let eTime = 5;
            const exhale = setInterval(() => {
              eTime -= 0.1; setRegTimer(Math.max(0, eTime));
              if (eTime <= 0) {
                clearInterval(exhale);
                if (regCycle >= 3) setRegPhase('DONE');
                else { setRegCycle(c => c + 1); startAutoReg(); }
              }
            }, 100);
          }
        }, 100);
      }
    }, 100);
  };

  return (
    <div style={{ backgroundColor: '#0A0E1A', color: 'white', minHeight: '100vh', touchAction: 'none', overflow: 'hidden', position: 'relative', fontFamily: 'Inter, sans-serif' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }} />
      
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
        
        {/* SHARED LOGO SECTION */}
        <div style={{ position: 'absolute', top: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '60px', fontWeight: 900, color: '#D4AF37', fontStyle: 'italic', lineHeight: '0.8' }}>π</div>
          <p style={{ color: '#D4AF37', fontSize: '10px', fontWeight: 900, letterSpacing: '4px', marginTop: '10px' }}>PLAY YOUR RHYTHM</p>
        </div>

        {screen === 'landing' && (
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <h1 style={{ fontSize: '12px', letterSpacing: '10px', marginBottom: '60px', opacity: 0.7 }}>PRANA INDEX</h1>
            <p style={{ fontSize: '18px', fontWeight: 900, marginBottom: '40px', fontStyle: 'italic' }}>CHECK YOUR PI STRESS SCORE</p>
            <button onClick={initAudio} style={{ border: '2px solid #D4AF37', color: '#D4AF37', padding: '15px 60px', borderRadius: '50px', background: 'none', fontSize: '18px', fontWeight: 900 }}>START ENGINE</button>
          </div>
        )}

        {screen === 'p1_intro' && (
          <div style={{ textAlign: 'center', maxWidth: '320px', marginTop: '40px' }}>
            <h2 style={{ color: '#D4AF37', fontWeight: 900, marginBottom: '20px', fontSize: '12px', letterSpacing: '2px' }}>PHASE 01: CONSISTENCY</h2>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '25px', border: '1px solid #ffffff11', marginBottom: '40px' }}>
              <p style={{ fontSize: '14px', lineHeight: 1.6 }}>"Kya toh bhi rhythm hai!"<br/>Keep a steady beat on the white node for 15s.</p>
            </div>
            <button onClick={() => setScreen('p1')} style={{ backgroundColor: '#D4AF37', color: 'black', padding: '18px 60px', borderRadius: '50px', fontWeight: 900, border: 'none' }}>START TEST</button>
          </div>
        )}

        {screen === 'p1' && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <div style={{ fontSize: '80px', fontWeight: 900, marginBottom: '30px', color: '#D4AF37' }}>{p1Timer}s</div>
            <div 
              onPointerDown={() => { setIsTapping(true); setP1Taps(v => [...v, Date.now()]); }}
              onPointerUp={() => setIsTapping(false)}
              style={{ width: '180px', height: '180px', backgroundColor: 'white', borderRadius: '50%', transform: isTapping ? 'scale(0.85)' : 'scale(1)', transition: '0.1s', boxShadow: '0 0 40px rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            ><div style={{ color: 'black', fontWeight: 900, fontSize: '30px' }}>π</div></div>
          </div>
        )}

        {screen === 'p2' && (
          <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
             <p style={{ position: 'absolute', top: '160px', width: '100%', textAlign: 'center', color: '#D4AF37', fontSize: '12px', fontWeight: 900 }}>PHASE 02: REFLUX ({p2Taps.length}/5)</p>
             <button 
                onPointerDown={() => {
                    if(p2Taps.length + 1 >= 5) setScreen('p3');
                    else { setP2Taps(v => [...v, Date.now()]); setTargetPos({ left: Math.random()*70+15+'%', top: Math.random()*70+15+'%' }); }
                }}
                style={{ position: 'absolute', left: targetPos.left, top: targetPos.top, width: '75px', height: '75px', borderRadius: '50%', backgroundColor: '#D4AF37', border: 'none', color: 'black', fontWeight: 900, fontSize: '20px' }}
             >π</button>
          </div>
        )}

        {screen === 'p3' && (
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <p style={{ color: '#D4AF37', marginBottom: '40px', fontSize: '12px', fontWeight: 900 }}>PHASE 03: FOCUS (Hit the peak!)</p>
            <div style={{ width: '260px', height: '260px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', width: pulseSize+'%', height: pulseSize+'%', borderRadius: '50%', backgroundColor: pulseSize > 85 ? '#39FF14' : '#D4AF37', opacity: 0.5 }}></div>
                <button onPointerDown={() => {
                    setP3Hits(v => [...v, pulseSize]);
                    if (p3Hits.length + 1 >= 3) {
                       setFinalScore(Math.floor(Math.random()*40 + 50)); // Simulating score for logic
                       setScreen('result');
                    }
                }} style={{ zIndex: 10, width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'black', border: '3px solid #D4AF37', color: '#D4AF37', fontWeight: 900 }}>TAP</button>
            </div>
          </div>
        )}

        {screen === 'result' && (
          <div style={{ textAlign: 'center', maxWidth: '380px', marginTop: '80px' }}>
            <p style={{ fontSize: '10px', color: '#D4AF37', letterSpacing: '4px', fontWeight: 900 }}>PI STRESS SCORE</p>
            <h3 style={{ fontSize: '110px', fontWeight: 900, color: '#D4AF37', margin: '0' }}>{finalScore}</h3>
            
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '25px', border: '1px solid #ffffff11', marginBottom: '30px' }}>
               <p style={{ color: '#D4AF37', fontWeight: 900, fontSize: '20px' }}>{finalScore > 75 ? "USTAAD! KIRAAN!" : "LIGHT LELO!"}</p>
               <p style={{ opacity: 0.7, fontSize: '13px', fontStyle: 'italic' }}>{finalScore > 75 ? "Full rhythm mein hai ustaad! Baigan, maza aagaya!" : "Engine thoda thanda hai bawa. Regulation game khelo!"}</p>
            </div>

            <div style={{ background: 'rgba(212,175,55,0.1)', padding: '20px', borderRadius: '30px', border: '1px solid #D4AF3744' }}>
              <p style={{ fontSize: '10px', fontWeight: 900, color: '#D4AF37', marginBottom: '15px' }}>ENTER EMAIL TO START PI REGULATION GAME</p>
              <input placeholder="ustaad@hyderabad.com" value={email} onChange={e=>setEmail(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '50px', border: '1px solid #D4AF37', background: 'rgba(0,0,0,0.4)', color: 'white', textAlign: 'center', marginBottom: '15px' }} />
              <button onClick={() => {setScreen('reg_intro');}} style={{ backgroundColor: '#D4AF37', color: 'black', padding: '16px 50px', borderRadius: '50px', fontWeight: 900, border: 'none', width: '100%' }}>UNLOCK REGULATION</button>
            </div>
          </div>
        )}

        {screen === 'reg_intro' && (
          <div style={{ textAlign: 'center', maxWidth: '320px', marginTop: '80px' }}>
            <h2 style={{ color: '#D4AF37', fontWeight: 900, marginBottom: '20px' }}>PI REGULATION GAME</h2>
            <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '40px', lineHeight: 1.6 }}>5s Inhale (Rev Up) <br/> 3s Hold <br/> 5s Exhale (Rev Down) <br/><br/> Relax and follow the engine sound.</p>
            <button onClick={() => {setScreen('reg'); startAutoReg();}} style={{ backgroundColor: '#D4AF37', color: 'black', padding: '18px 60px', borderRadius: '50px', fontWeight: 900, border: 'none' }}>START CALIBRATION</button>
          </div>
        )}

        {screen === 'reg' && (
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <p style={{ color: '#D4AF37', fontSize: '24px', fontWeight: 900, fontStyle: 'italic', marginBottom: '10px' }}>{regPhase}</p>
            <h2 style={{ fontSize: '60px', fontWeight: 900, marginBottom: '30px' }}>{regTimer.toFixed(1)}s</h2>
            <div style={{ width: '220px', height: '220px', borderRadius: '50%', border: '2px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ 
                  width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#D4AF37',
                  transform: regPhase === 'INHALE' ? `scale(${1 + (5-regTimer)*0.35})` : regPhase === 'EXHALE' ? `scale(${2.75 - (5-regTimer)*0.35})` : regPhase === 'HOLD' ? 'scale(2.75)' : 'scale(1)',
                  transition: '0.1s linear', boxShadow: '0 0 50px rgba(212,175,55,0.4)'
                }}></div>
            </div>
            <p style={{ marginTop: '40px', fontWeight: 900, color: '#D4AF37' }}>CYCLE {regCycle} / 3</p>
            {regPhase === 'DONE' && <button onClick={() => window.location.reload()} style={{ color: '#39FF14', fontWeight: 900, marginTop: '20px', background: 'none', border: 'none', textDecoration: 'underline' }}>COHERENCE ACHIEVED - RESTART</button>}
          </div>
        )}
      </div>
    </div>
  );
}
