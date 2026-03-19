"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function PranaIndexFinal() {
  const [screen, setScreen] = useState('landing'); // landing, p1_intro, p1, p2, p3, result, reg_intro, reg
  const [email, setEmail] = useState('');
  
  // Scoring Data
  const [p1Taps, setP1Taps] = useState<number[]>([]);
  const [p2Taps, setP2Taps] = useState<number[]>([]);
  const [p2StartTime, setP2StartTime] = useState(0);
  const [p3Hits, setP3Hits] = useState<number[]>([]);
  
  // UI Helpers
  const [p1Timer, setP1Timer] = useState(15);
  const [pulseSize, setPulseSize] = useState(0);
  const [isTapping, setIsTapping] = useState(false);
  const [targetPos, setTargetPos] = useState({ left: '50%', top: '50%' });
  const [finalScore, setFinalScore] = useState(0);

  // Regulation Game (5-3-5)
  const [regPhase, setRegPhase] = useState('READY'); 
  const [regTimer, setRegTimer] = useState(5.0);
  const [regCycle, setRegCycle] = useState(1);

  // Audio Refs
  const audioCtx = useRef<AudioContext | null>(null);
  const rainAudio = useRef<HTMLAudioElement | null>(null);
  const engineOsc = useRef<OscillatorNode | null>(null);
  const engineGain = useRef<GainNode | null>(null);

  // --- 1. RAIN ANIMATION (Persistent) ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let drops = Array.from({ length: 120 }, () => ({
      x: Math.random() * 2000, y: Math.random() * 2000, l: Math.random() * 20, v: Math.random() * 5 + 2
    }));
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 14, 26, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
      drops.forEach(d => {
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, d.y + d.l); ctx.stroke();
        d.y += d.v; if (d.y > canvas.height) d.y = -20;
      });
      requestAnimationFrame(animate);
    };
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize); resize(); animate();
    return () => window.removeEventListener('resize', resize);
  }, []);

  // --- 2. SOUND SYSTEM (ZERO DELAY) ---
  const initAllAudio = () => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!rainAudio.current) {
      rainAudio.current = new Audio("https://www.soundjay.com/nature/rain-01.mp3");
      rainAudio.current.loop = true;
      rainAudio.current.volume = 0.3;
    }
    rainAudio.current.play();
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
    setScreen('p1_intro');
  };

  const playBeep = (f: number, d: number) => {
    if (!audioCtx.current) return;
    const o = audioCtx.current.createOscillator();
    const g = audioCtx.current.createGain();
    o.frequency.setValueAtTime(f, audioCtx.current.currentTime);
    g.gain.setValueAtTime(0.1, audioCtx.current.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.current.currentTime + d);
    o.connect(g); g.connect(audioCtx.current.destination);
    o.start(); o.stop(audioCtx.current.currentTime + d);
  };

  const startEngineRev = (startF: number, endF: number, dur: number) => {
    if (!audioCtx.current) return;
    const o = audioCtx.current.createOscillator();
    const g = audioCtx.current.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(startF, audioCtx.current.currentTime);
    o.frequency.exponentialRampToValueAtTime(endF, audioCtx.current.currentTime + dur);
    g.gain.setValueAtTime(0.06, audioCtx.current.currentTime);
    g.gain.linearRampToValueAtTime(0.01, audioCtx.current.currentTime + dur);
    o.connect(g); g.connect(audioCtx.current.destination);
    o.start(); o.stop(audioCtx.current.currentTime + dur);
  };

  // --- 3. SCORING & PROGRESSION ---
  const calculateResult = () => {
    let cScore = 0;
    if (p1Taps.length > 5) {
      const diffs = p1Taps.slice(1).map((t, i) => t - p1Taps[i]);
      const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      const vari = diffs.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / diffs.length;
      cScore = Math.max(0, 100 - Math.sqrt(vari) / 5);
    }
    const rScore = Math.max(0, 100 - ((Date.now() - p2StartTime) / 50));
    const fScore = p3Hits.reduce((a, b) => a + b, 0) / (p3Hits.length || 1);
    setFinalScore(Math.floor((cScore * 0.4) + (rScore * 0.3) + (fScore * 0.3)));
    setScreen('result');
  };

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
      const i = setInterval(() => { f += 0.04; setPulseSize(50 + Math.sin(f) * 50); }, 20);
      return () => clearInterval(i);
    }
  }, [screen]);

  // --- 4. REGULATION (5-3-5 Ferrari Rev) ---
  const startRegulation = () => {
    if (regPhase !== 'READY') return;
    setRegPhase('INHALE'); setRegTimer(5);
    startEngineRev(80, 450, 5); // INHALE REV UP
    let time = 5;
    const inhale = setInterval(() => {
      time -= 0.1; setRegTimer(Math.max(0, time));
      if (time <= 0) {
        clearInterval(inhale); setRegPhase('HOLD'); setRegTimer(3);
        let hTime = 3;
        const hold = setInterval(() => {
          hTime -= 0.1; setRegTimer(Math.max(0, hTime));
          if (hTime <= 0) {
            clearInterval(hold); setRegPhase('EXHALE'); setRegTimer(5);
            startEngineRev(450, 60, 5); // EXHALE REV DOWN
            let eTime = 5;
            const exhale = setInterval(() => {
              eTime -= 0.1; setRegTimer(Math.max(0, eTime));
              if (eTime <= 0) {
                clearInterval(exhale);
                if (regCycle >= 3) setRegPhase('DONE');
                else { setRegCycle(c => c + 1); setRegPhase('READY'); }
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
        
        {screen === 'landing' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '100px', fontWeight: 900, color: '#D4AF37', fontStyle: 'italic', marginBottom: '-20px' }}>π</div>
            <h1 style={{ fontSize: '14px', letterSpacing: '10px', marginBottom: '40px' }}>PRANA INDEX</h1>
            <p style={{ color: '#D4AF37', fontSize: '26px', fontWeight: 900, fontStyle: 'italic', marginBottom: '5px' }}>"Play your rhythm"</p>
            <p style={{ letterSpacing: '1px', opacity: 0.6, marginBottom: '50px', fontSize: '12px' }}>CHECK YOUR PI STRESS SCORE</p>
            <button onClick={initAllAudio} style={{ border: '2px solid #D4AF37', color: '#D4AF37', padding: '15px 60px', borderRadius: '50px', background: 'none', fontSize: '18px', fontWeight: 900, cursor: 'pointer' }}>START ENGINE</button>
          </div>
        )}

        {screen === 'p1_intro' && (
          <div style={{ textAlign: 'center', maxWidth: '320px' }}>
            <h2 style={{ color: '#D4AF37', fontWeight: 900, marginBottom: '20px' }}>PHASE 01: CONSISTENCY</h2>
            <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '40px', lineHeight: 1.6 }}>Maintain a steady rhythm on the white node for 15 seconds. Don't break the flow!</p>
            <button onClick={() => setScreen('p1')} style={{ backgroundColor: '#D4AF37', color: 'black', padding: '18px 60px', borderRadius: '50px', fontWeight: 900, border: 'none' }}>START TEST</button>
          </div>
        )}

        {screen === 'p1' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#D4AF37', fontSize: '12px', fontWeight: 900, marginBottom: '20px' }}>"Kya toh bhi rhythm hai!"</p>
            <div style={{ fontSize: '60px', fontWeight: 900, marginBottom: '40px' }}>{p1Timer}s</div>
            <div 
              onPointerDown={() => { setIsTapping(true); setP1Taps(v => [...v, Date.now()]); playBeep(200, 0.1); }}
              onPointerUp={() => setIsTapping(false)}
              style={{ width: '180px', height: '180px', backgroundColor: 'white', borderRadius: '50%', transform: isTapping ? 'scale(0.85)' : 'scale(1)', transition: '0.1s', boxShadow: isTapping ? '0 0 60px white' : '0 0 20px rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            ><div style={{ color: 'black', fontWeight: 900, fontSize: '30px' }}>π</div></div>
          </div>
        )}

        {screen === 'p2' && (
          <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
             <p style={{ position: 'absolute', top: '120px', width: '100%', textAlign: 'center', color: '#D4AF37', fontSize: '12px', fontWeight: 900 }}>PHASE 02: REFLUX ({p2Taps.length}/5)</p>
             <button 
                onPointerDown={() => {
                    playBeep(800, 0.1);
                    if(p2Taps.length + 1 >= 5) setScreen('p3');
                    else { setP2Taps(v => [...v, Date.now()]); setTargetPos({ left: Math.random()*70+15+'%', top: Math.random()*70+15+'%' }); }
                }}
                style={{ position: 'absolute', left: targetPos.left, top: targetPos.top, width: '75px', height: '75px', borderRadius: '50%', backgroundColor: '#D4AF37', border: 'none', color: 'black', fontWeight: 900 }}
             >π</button>
          </div>
        )}

        {screen === 'p3' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#D4AF37', marginBottom: '50px', fontSize: '12px', fontWeight: 900 }}>PHASE 03: FOCUS (Hit the peak!)</p>
            <div style={{ width: '280px', height: '280px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', width: pulseSize+'%', height: pulseSize+'%', borderRadius: '50%', backgroundColor: pulseSize > 85 ? '#39FF14' : '#D4AF37', opacity: 0.5 }}></div>
                <button onPointerDown={() => {
                    setP3Hits(v => [...v, pulseSize]);
                    playBeep(pulseSize > 85 ? 1200 : 150, 0.2);
                    if (p3Hits.length + 1 >= 3) calculateResult();
                }} style={{ zIndex: 10, width: '110px', height: '110px', borderRadius: '50%', backgroundColor: 'black', border: '3px solid #D4AF37', color: '#D4AF37', fontWeight: 900 }}>TAP</button>
            </div>
          </div>
        )}

        {screen === 'result' && (
          <div style={{ textAlign: 'center', maxWidth: '380px' }}>
            <p style={{ fontSize: '12px', color: '#D4AF37', letterSpacing: '4px', fontWeight: 900 }}>PI STRESS SCORE</p>
            <h3 style={{ fontSize: '120px', fontWeight: 900, color: '#D4AF37', margin: '0' }}>{finalScore}</h3>
            
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '25px', border: '1px solid #ffffff11', marginBottom: '30px' }}>
               <p style={{ color: '#D4AF37', fontWeight: 900, fontSize: '22px', marginBottom: '5px' }}>{finalScore > 80 ? "USTAAD! KIRAAN!" : "LIGHT LELO!"}</p>
               <p style={{ opacity: 0.8, fontSize: '14px', fontStyle: 'italic' }}>{finalScore > 80 ? "Pura Hyderabad tumhare rhythm pe naachra! Ek number!" : "Engine thoda thanda hai bawa. Regulation game khelo!"}</p>
            </div>

            <div style={{ background: 'rgba(212,175,55,0.1)', padding: '20px', borderRadius: '30px', border: '1px solid #D4AF3744' }}>
              <p style={{ fontSize: '10px', fontWeight: 900, color: '#D4AF37', marginBottom: '15px' }}>ENTER EMAIL TO START PI REGULATION GAME</p>
              <input placeholder="ustaad@hyderabad.com" value={email} onChange={e=>setEmail(e.target.value)} style={{ width: '100%', padding: '18px', borderRadius: '50px', border: '1px solid #D4AF37', background: 'rgba(0,0,0,0.4)', color: 'white', textAlign: 'center', marginBottom: '15px' }} />
              <button onClick={() => setScreen('reg')} style={{ backgroundColor: '#D4AF37', color: 'black', padding: '18px 50px', borderRadius: '50px', fontWeight: 900, border: 'none', width: '100%' }}>UNLOCK REGULATION</button>
            </div>
          </div>
        )}

        {screen === 'reg' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#D4AF37', fontSize: '12px', fontWeight: 900, marginBottom: '20px' }}>5-3-5 ENGINE CALIBRATION</p>
            <p style={{ color: '#D4AF37', fontSize: '24px', fontWeight: 900, fontStyle: 'italic', marginBottom: '10px' }}>{regPhase}</p>
            <h2 style={{ fontSize: '70px', fontWeight: 900, marginBottom: '30px' }}>{regTimer.toFixed(1)}s</h2>
            
            <div onClick={startRegulation} style={{ width: '240px', height: '240px', borderRadius: '50%', border: '2px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
                <div style={{ 
                  width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#D4AF37',
                  transform: regPhase === 'INHALE' ? `scale(${1 + (5-regTimer)*0.3})` : regPhase === 'EXHALE' ? `scale(${2.5 - (5-regTimer)*0.3})` : 'scale(1)',
                  transition: '0.1s linear', boxShadow: '0 0 50px rgba(212,175,55,0.4)'
                }}></div>
                {regPhase === 'READY' && <div style={{ position: 'absolute', fontWeight: 900 }}>TAP TO REV</div>}
            </div>
            
            <p style={{ marginTop: '40px', fontWeight: 900, color: '#D4AF37' }}>CYCLE {regCycle} / 3</p>
            {regPhase === 'DONE' && <button onClick={() => window.location.reload()} style={{ color: '#39FF14', fontWeight: 900, marginTop: '20px', background: 'none', border: 'none', textDecoration: 'underline' }}>COMPLETE - RESTART</button>}
          </div>
        )}
      </div>
    </div>
  );
}
