"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function PranaIndex() {
  const [screen, setScreen] = useState('landing');
  const [email, setEmail] = useState('');
  
  // Game Tracking
  const [p1Taps, setP1Taps] = useState<number[]>([]);
  const [p2StartTime, setP2StartTime] = useState(0);
  const [p2Taps, setP2Taps] = useState<number[]>([]);
  const [p3Hits, setP3Hits] = useState<number[]>([]);
  
  // UI States
  const [p1TimeLeft, setP1TimeLeft] = useState(15);
  const [pulseSize, setPulseSize] = useState(0);
  const [pulseDir, setPulseDir] = useState(1);
  const [isTapping, setIsTapping] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [targetPos, setTargetPos] = useState({ left: '50%', top: '50%' });

  // Regulation States
  const [regPhase, setRegPhase] = useState('READY'); 
  const [regTimer, setRegTimer] = useState(5.0);
  const [regCycles, setRegCycles] = useState(0);

  // Audio Refs
  const audioCtx = useRef<AudioContext | null>(null);
  const rainAudio = useRef<HTMLAudioElement | null>(null);
  const engineOsc = useRef<OscillatorNode | null>(null);
  const engineGain = useRef<GainNode | null>(null);

  // --- 1. RAIN ANIMATION ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let animationFrameId: number;
    
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    let drops = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      l: Math.random() * 20,
      v: Math.random() * 4 + 2
    }));

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 14, 26, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      drops.forEach(d => {
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, d.y + d.l); ctx.stroke();
        d.y += d.v; if (d.y > canvas.height) d.y = -20;
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // --- 2. AUDIO SYSTEM ---
  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (!rainAudio.current) {
      rainAudio.current = new Audio("https://www.soundjay.com/nature/rain-01.mp3");
      rainAudio.current.loop = true;
      rainAudio.current.volume = 0.3;
    }
    rainAudio.current.play();
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
    setScreen('p1');
    startP1Timer();
  };

  const playTone = (freq: number, type: OscillatorType, dur: number, vol = 0.1) => {
    if (!audioCtx.current) return;
    const o = audioCtx.current.createOscillator();
    const g = audioCtx.current.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, audioCtx.current.currentTime);
    g.gain.setValueAtTime(vol, audioCtx.current.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + dur);
    o.connect(g); g.connect(audioCtx.current.destination);
    o.start(); o.stop(audioCtx.current.currentTime + dur);
  };

  // --- 3. SCORING ENGINE ---
  const calculateFinal = () => {
    // Consistency Score
    let cScore = 0;
    if (p1Taps.length > 5) {
      const intervals = p1Taps.slice(1).map((t, i) => t - p1Taps[i]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const stdDev = Math.sqrt(intervals.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / intervals.length);
      cScore = Math.max(0, 100 - (stdDev / 10));
    }
    // Reflex Score
    const rScore = Math.max(0, 100 - ((Date.now() - p2StartTime) / 60));
    // Focus Score
    const fScore = p3Hits.reduce((a, b) => a + b, 0) / (p3Hits.length || 1);

    const final = Math.floor((cScore * 0.4) + (rScore * 0.3) + (fScore * 0.3));
    setFinalScore(final);
    setScreen('result');
  };

  // --- 4. PHASE LOGIC ---
  const startP1Timer = () => {
    let time = 15;
    const interval = setInterval(() => {
      time--; setP1TimeLeft(time);
      if (time <= 0) {
        clearInterval(interval);
        setScreen('p2');
        setP2StartTime(Date.now());
      }
    }, 1000);
  };

  // Phase 3 Smooth Pulse
  useEffect(() => {
    if (screen === 'p3') {
      const int = setInterval(() => {
        setPulseSize(s => {
          let next = s + (0.9 * pulseDir); // SLOWER PULSE
          if (next >= 100 || next <= 0) setPulseDir(d => d * -1);
          return next;
        });
      }, 16);
      return () => clearInterval(int);
    }
  }, [screen, pulseDir]);

  // --- HYDERABADI VERDICTS ---
  const getVerdict = () => {
    if (finalScore >= 85) return { t: "USTAAD! KIRAAN FOCUS!", b: "Pura Hyderabad tumhare rhythm pe naachra! Ek number performance ustaad!" };
    if (finalScore >= 65) return { t: "ZABARDAST MOOD!", b: "Sahi hai mawa! Engine ek dum fit hai. Coherence full tight hai tumhari!" };
    if (finalScore >= 45) return { t: "CHALTA... LIGHT LELO", b: "Theek hai, magar thoda aur focus karo toh maza aata. Irani chai pii ke aao!" };
    return { t: "BAIGAN! TOTAL GHOTALA", b: "Engine baith gaya kya? Dimag khali hai bawa. Regulation game khel ke engine garam karo!" };
  };

  return (
    <div style={{ backgroundColor: '#0A0E1A', color: 'white', minHeight: '100vh', touchAction: 'none', overflow: 'hidden', position: 'relative', fontFamily: 'Inter, sans-serif' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }} />
      
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
        
        {screen === 'landing' && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '40px', fontWeight: 900, color: '#D4AF37', fontStyle: 'italic' }}>π</h1>
            <p style={{ letterSpacing: '8px', marginBottom: '40px', opacity: 0.8 }}>PRANA INDEX</p>
            <p style={{ color: '#D4AF37', fontSize: '24px', fontWeight: 900, fontStyle: 'italic', marginBottom: '10px' }}>"Play your rhythm, Ustaad!"</p>
            <button onClick={initAudio} style={{ border: '2px solid #D4AF37', color: '#D4AF37', padding: '15px 60px', borderRadius: '50px', background: 'none', fontSize: '20px', fontWeight: 900, cursor: 'pointer', marginTop: '30px' }}>START ENGINE</button>
          </div>
        )}

        {screen === 'p1' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#D4AF37', fontSize: '12px', fontWeight: 900, letterSpacing: '2px', marginBottom: '20px' }}>01 CONSISTENCY: "Kya toh bhi rhythm hai!"</p>
            <div style={{ fontSize: '60px', fontWeight: 900, marginBottom: '30px' }}>{p1TimeLeft}s</div>
            <button 
              onPointerDown={() => { setIsTapping(true); setP1Taps(prev => [...prev, Date.now()]); playTone(200, 'sine', 0.1); }}
              onPointerUp={() => setIsTapping(false)}
              style={{ width: '180px', height: '180px', backgroundColor: 'white', borderRadius: '50%', border: 'none', transform: isTapping ? 'scale(0.92)' : 'scale(1)', transition: '0.1s', boxShadow: isTapping ? '0 0 50px white' : '0 0 20px rgba(255,255,255,0.2)' }}
            />
          </div>
        )}

        {screen === 'p2' && (
          <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
             <p style={{ position: 'absolute', top: '120px', width: '100%', textAlign: 'center', color: '#D4AF37', fontSize: '12px', fontWeight: 900 }}>02 REFLUX: "Haule! Catch the nodes!"</p>
             <button 
                onPointerDown={() => {
                    playTone(800, 'triangle', 0.1);
                    if(p2Taps.length + 1 >= 5) setScreen('p3');
                    else {
                        setP2Taps(prev => [...prev, Date.now()]);
                        setTargetPos({ left: Math.random()*70+15+'%', top: Math.random()*70+15+'%' });
                    }
                }}
                style={{ position: 'absolute', left: targetPos.left, top: targetPos.top, width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#D4AF37', color: 'black', fontWeight: 900, border: 'none', cursor: 'pointer' }}
             >π</button>
          </div>
        )}

        {screen === 'p3' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#D4AF37', marginBottom: '50px', fontSize: '12px', fontWeight: 900 }}>03 FOCUS: "Sahi Point Pe Tap Karo"</p>
            <div style={{ width: '280px', height: '280px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', width: pulseSize+'%', height: pulseSize+'%', borderRadius: '50%', backgroundColor: pulseSize > 80 ? '#39FF14' : '#D4AF37', opacity: 0.4 }}></div>
                <button onPointerDown={() => {
                    setP3Hits(prev => [...prev, pulseSize]);
                    playTone(pulseSize > 80 ? 1000 : 150, 'sine', 0.2);
                    if (p3Hits.length + 1 >= 3) calculateFinal();
                }} style={{ zIndex: 10, width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'black', border: '3px solid #D4AF37', color: '#D4AF37', fontWeight: 900 }}>TAP PEAK</button>
            </div>
          </div>
        )}

        {screen === 'result' && (
          <div style={{ textAlign: 'center', maxWidth: '400px', padding: '0 20px' }}>
            <p style={{ fontSize: '10px', color: '#D4AF37', letterSpacing: '4px', fontWeight: 900 }}>PI STRESS SCORE</p>
            <h3 style={{ fontSize: '120px', fontWeight: 900, color: '#D4AF37', margin: '0', lineHeight: 1 }}>{finalScore}</h3>
            
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', border: '1px solid #ffffff11', margin: '20px 0' }}>
               <p style={{ color: '#D4AF37', fontWeight: 900, fontSize: '20px', marginBottom: '5px' }}>{getVerdict().t}</p>
               <p style={{ opacity: 0.8, fontSize: '13px', fontStyle: 'italic' }}>{getVerdict().b}</p>
            </div>

            <div style={{ background: 'rgba(212,175,55,0.1)', padding: '20px', borderRadius: '25px', border: '1px solid #D4AF3744' }}>
              <p style={{ fontSize: '10px', fontWeight: 900, color: '#D4AF37', marginBottom: '15px' }}>ENTER EMAIL TO GET THE PI STRESS REGULATION GAME</p>
              <input placeholder="ustaad@hyderabad.com" value={email} onChange={e=>setEmail(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '50px', border: '1px solid #D4AF37', background: 'rgba(0,0,0,0.5)', color: 'white', textAlign: 'center', marginBottom: '10px' }} />
              <button onClick={() => window.location.reload()} style={{ backgroundColor: '#D4AF37', color: 'black', padding: '15px 40px', borderRadius: '50px', fontWeight: 900, border: 'none', width: '100%' }}>CALIBRATE REGULATION</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
