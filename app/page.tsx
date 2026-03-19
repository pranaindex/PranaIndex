"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function PranaIndex() {
  const [screen, setScreen] = useState('landing');
  const [email, setEmail] = useState('');
  
  // Game States
  const [p1Taps, setP1Taps] = useState<number[]>([]);
  const [p2Taps, setP2Taps] = useState<number[]>([]);
  const [hitCount, setHitCount] = useState(0);
  const [pulseSize, setPulseSize] = useState(0);
  const [pulseDir, setPulseDir] = useState(1);
  const [p1TimeLeft, setP1TimeLeft] = useState(15);
  const [isTapping, setIsTapping] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  
  // Regulation States
  const [regPhase, setRegPhase] = useState('IDLE'); // IDLE, INHALE, HOLD, EXHALE, DONE
  const [regTimer, setRegTimer] = useState(5.0);
  const [regCycles, setRegCycles] = useState(0);

  // Refs
  const audioCtx = useRef<AudioContext | null>(null);
  const rainAudio = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetPos = useRef({ left: '50%', top: '50%' });
  const engineOsc = useRef<OscillatorNode | null>(null);
  const engineGain = useRef<GainNode | null>(null);

  // --- 1. RAIN ANIMATION ---
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    let drops: any[] = [];
    for (let i = 0; i < 150; i++) drops.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, l: Math.random() * 20, v: Math.random() * 4 + 2 });
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 14, 26, 0.2)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 1;
      drops.forEach(d => { ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, d.y + d.l); ctx.stroke(); d.y += d.v; if (d.y > canvas.height) d.y = -20; });
      requestAnimationFrame(animate);
    };
    animate();
    return () => window.removeEventListener('resize', resize);
  }, []);

  // --- 2. SOUND SYSTEM ---
  const initSystems = () => {
    if (!rainAudio.current) {
      rainAudio.current = new Audio("https://www.soundjay.com/nature/rain-01.mp3");
      rainAudio.current.loop = true;
      rainAudio.current.volume = 0.3;
    }
    rainAudio.current.play();
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
    setScreen('details');
  };

  const playTone = (f: number, t: OscillatorType, d: number, v = 0.1) => {
    if (!audioCtx.current) return;
    const o = audioCtx.current.createOscillator();
    const g = audioCtx.current.createGain();
    o.type = t; o.frequency.setValueAtTime(f, audioCtx.current.currentTime);
    g.gain.setValueAtTime(v, audioCtx.current.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + d);
    o.connect(g); g.connect(audioCtx.current.destination);
    o.start(); o.stop(audioCtx.current.currentTime + d);
  };

  const startEngineSound = (freq: number) => {
    if (!audioCtx.current) return;
    stopEngineSound();
    engineOsc.current = audioCtx.current.createOscillator();
    engineGain.current = audioCtx.current.createGain();
    engineOsc.current.type = 'sawtooth';
    engineOsc.current.frequency.setValueAtTime(freq, audioCtx.current.currentTime);
    engineGain.current.gain.setValueAtTime(0.02, audioCtx.current.currentTime);
    engineOsc.current.connect(engineGain.current);
    engineGain.current.connect(audioCtx.current.destination);
    engineOsc.current.start();
  };

  const stopEngineSound = () => {
    if (engineOsc.current) { engineOsc.current.stop(); engineOsc.current = null; }
  };

  // --- 3. GAME FLOW ---
  const startP1 = () => {
    setScreen('p1');
    let time = 15;
    const timer = setInterval(() => {
      time--; setP1TimeLeft(time);
      if (time <= 0) { clearInterval(timer); setScreen('p2'); playTone(600, 'sine', 0.5); }
    }, 1000);
  };

  const handleP3Tap = () => {
    if (pulseSize > 80) {
      playTone(1000, 'sine', 0.2, 0.2);
      setHitCount(h => {
        if (h + 1 >= 3) {
            setFinalScore(Math.floor(Math.random() * 15) + 84);
            setTimeout(() => setScreen('result'), 500);
        }
        return h + 1;
      });
    } else {
      playTone(100, 'sawtooth', 0.3, 0.1);
    }
  };

  // --- 4. REGULATION LOGIC (5-3-5) ---
  const handleRegDown = () => {
    if (regPhase !== 'IDLE' && regPhase !== 'READY') return;
    setIsTapping(true);
    setRegPhase('INHALE');
    startEngineSound(100);
    let time = 0;
    const int = setInterval(() => {
        time += 0.1; setRegTimer(5 - time);
        if (engineOsc.current) engineOsc.current.frequency.setValueAtTime(100 + (time * 40), audioCtx.current!.currentTime);
        if (time >= 5) {
            clearInterval(int);
            setRegPhase('HOLD');
            let hTime = 0;
            const hInt = setInterval(() => {
                hTime += 0.1; setRegTimer(3 - hTime);
                if (hTime >= 3) {
                    clearInterval(hInt);
                    setRegPhase('RELEASE TO EXHALE');
                    stopEngineSound();
                    playTone(400, 'sine', 0.3);
                }
            }, 100);
        }
    }, 100);
    (window as any).regInterval = int;
  };

  const handleRegUp = () => {
    setIsTapping(false);
    if (regPhase === 'RELEASE TO EXHALE') {
        setRegPhase('EXHALE');
        startEngineSound(300);
        let eTime = 0;
        const eInt = setInterval(() => {
            eTime += 0.1; setRegTimer(5 - eTime);
            if (engineOsc.current) engineOsc.current.frequency.setValueAtTime(300 - (eTime * 40), audioCtx.current!.currentTime);
            if (eTime >= 5) {
                clearInterval(eInt);
                stopEngineSound();
                setRegCycles(c => c + 1);
                if (regCycles + 1 >= 3) setRegPhase('DONE');
                else setRegPhase('IDLE');
            }
        }, 100);
    } else if (regPhase !== 'DONE') {
        clearInterval((window as any).regInterval);
        stopEngineSound();
        setRegPhase('IDLE');
        setRegTimer(5.0);
    }
  };

  useEffect(() => {
    if (screen === 'p3') {
        const int = setInterval(() => {
            setPulseSize(s => {
                let next = s + (4 * pulseDir);
                if (next >= 100 || next <= 0) setPulseDir(d => d * -1);
                return next;
            });
        }, 20);
        return () => clearInterval(int);
    }
  }, [screen, pulseDir]);

  return (
    <div style={{ backgroundColor: '#0A0E1A', color: 'white', minHeight: '100vh', touchAction: 'none', overflow: 'hidden', position: 'relative', fontFamily: 'sans-serif' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }} />
      
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        
        {screen === 'landing' && (
          <div style={{ textAlign: 'center' }}>
            <img src="/gold-pi-logo.png" style={{ width: '220px', marginBottom: '20px' }} />
            <p style={{ color: '#D4AF37', fontSize: '24px', fontWeight: 900, fontStyle: 'italic' }}>Play your rhythm</p>
            <p style={{ letterSpacing: '2px', marginBottom: '40px' }}>CHECK YOUR PI STRESS SCORE</p>
            <button onClick={initSystems} style={{ border: '2px solid #D4AF37', color: '#D4AF37', padding: '15px 50px', borderRadius: '50px', background: 'none', fontSize: '20px', fontWeight: 900 }}>START</button>
          </div>
        )}

        {screen !== 'landing' && <div style={{ position: 'absolute', top: '40px', fontSize: '24px', fontWeight: 900, color: '#D4AF37', fontStyle: 'italic' }}>PRANA INDEX</div>}

        {screen === 'details' && (
          <div style={{ textAlign: 'center', maxWidth: '320px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '30px', border: '1px solid #ffffff22', textAlign: 'left', marginTop: '40px' }}>
              <p style={{ fontSize: '12px', marginBottom: '10px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>01 CONSISTENCY:</span> Tap the white node steadily.</p>
              <p style={{ fontSize: '12px', marginBottom: '10px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>02 REFLUX:</span> Catch 5 nodes fast.</p>
              <p style={{ fontSize: '12px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>03 FOCUS:</span> Tap at the peak pulse.</p>
            </div>
            <button onClick={startP1} style={{ marginTop: '30px', backgroundColor: '#D4AF37', color: 'black', padding: '20px 60px', borderRadius: '50px', fontWeight: 900, border: 'none' }}>START ENGINE</button>
          </div>
        )}

        {screen === 'p1' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#D4AF37', letterSpacing: '2px', marginBottom: '10px' }}>PHASE 01: CONSISTENCY</p>
            <p style={{ fontSize: '40px', fontWeight: 900, marginBottom: '20px' }}>{p1TimeLeft}s</p>
            <div 
              onPointerDown={() => { setIsTapping(true); handleP1Tap(); playTone(200, 'sine', 0.1); }}
              onPointerUp={() => setIsTapping(false)}
              style={{ 
                width: '200px', height: '200px', backgroundColor: 'white', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: isTapping ? 'scale(0.9)' : 'scale(1)', transition: '0.1s',
                boxShadow: isTapping ? '0 0 80px white' : '0 0 20px rgba(255,255,255,0.2)'
              }}
            >
              <img src="/gold-pi-logo.png" style={{ width: '120px' }} />
            </div>
          </div>
        )}

        {screen === 'p2' && (
          <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
             <p style={{ position: 'absolute', top: '100px', width: '100%', textAlign: 'center', color: '#D4AF37' }}>PHASE 02: REFLUX</p>
             <button 
                onPointerDown={() => {
                    playTone(800, 'triangle', 0.1);
                    if(p2Taps.length + 1 >= 5) setScreen('p3');
                    else {
                        setP2Taps([...p2Taps, 1]);
                        targetPos.current = { left: Math.random()*70+15+'%', top: Math.random()*70+15+'%' };
                    }
                }}
                style={{ position: 'absolute', left: targetPos.current.left, top: targetPos.current.top, width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#D4AF37', color: 'black', fontWeight: 900, border: 'none' }}
             >π</button>
          </div>
        )}

        {screen === 'p3' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#D4AF37', marginBottom: '40px' }}>PHASE 03: FOCUS ({hitCount}/3)</p>
            <div style={{ width: '250px', height: '250px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', width: pulseSize+'%', height: pulseSize+'%', borderRadius: '50%', backgroundColor: pulseSize > 80 ? '#39FF14' : '#D4AF37', opacity: 0.5 }}></div>
                <button onPointerDown={handleP3Tap} style={{ zIndex: 10, width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'black', border: '3px solid #D4AF37', color: '#D4AF37', fontWeight: 900 }}>TAP</button>
            </div>
          </div>
        )}

        {screen === 'result' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '100px', fontWeight: 900, color: '#D4AF37', margin: 0 }}>{finalScore}</h3>
            <p style={{ fontWeight: 900, color: '#D4AF37', fontSize: '20px' }}>USTAAD! FULL POWER!</p>
            <input placeholder="Email to Regulate..." value={email} onChange={e=>setEmail(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '50px', border: '1px solid #D4AF37', background: 'none', color: 'white', textAlign: 'center', margin: '20px 0' }} />
            <button onClick={() => setScreen('reg')} style={{ backgroundColor: '#D4AF37', color: 'black', padding: '15px 40px', borderRadius: '50px', fontWeight: 900, border: 'none' }}>CALIBRATE</button>
          </div>
        )}

        {screen === 'reg' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#D4AF37', fontSize: '24px', fontWeight: 900 }}>{regPhase}</p>
            <h2 style={{ fontSize: '60px', margin: '10px 0' }}>{regTimer.toFixed(1)}s</h2>
            <div 
              onPointerDown={handleRegDown} onPointerUp={handleRegUp}
              style={{ 
                width: '200px', height: '200px', borderRadius: '50%', border: '4px solid #D4AF37', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: isTapping ? '#D4AF37' : 'transparent', transition: '0.2s'
              }}
            >
                <div style={{ color: isTapping ? 'black' : '#D4AF37', fontWeight: 900 }}>{isTapping ? 'REV' : 'HOLD'}</div>
            </div>
            <p style={{ marginTop: '20px' }}>CYCLE {regCycles} / 3</p>
            {regPhase === 'DONE' && <button onClick={() => window.location.reload()} style={{ color: '#39FF14', textDecoration: 'underline', marginTop: '20px', background: 'none', border: 'none' }}>COHERENCE ACHIEVED - RESTART</button>}
          </div>
        )}

      </div>
    </div>
  );
}
